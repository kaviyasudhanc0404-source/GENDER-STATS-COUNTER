"""
Detection pipeline: face detection -> aligned face crop -> gender classification,
plus face recognition to count each person in a video once.
"""
import io
import logging
import threading

import cv2
import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError

from app import config
from app.models import FaceDetector, FaceEmbedder, GenderClassifier
from app.schemas import BoundingBox, Face, Gender, GenderCounts, ImageDetection, TrackedFace, VideoDetection, VideoFrame
from app.tracker import PersonTracker, Sighting

logger = logging.getLogger(__name__)


def decode_image(data: bytes) -> np.ndarray:
    """Decode image bytes into an upright BGR array (honours EXIF orientation)."""
    try:
        with Image.open(io.BytesIO(data)) as image:
            rgb = ImageOps.exif_transpose(image).convert("RGB")
    except (UnidentifiedImageError, OSError) as error:
        raise ValueError("The file is not a valid image") from error
    return cv2.cvtColor(np.asarray(rgb), cv2.COLOR_RGB2BGR)


def align_face(image: np.ndarray, face: np.ndarray) -> np.ndarray:
    """
    Crop a face rotated so the eyes are level, with the margins used during training
    (identical to `align_face` in MODEL_DETAILS/notebooks/finetune-gender-fairface.ipynb).
    """
    x, y, width, height = face[:4]
    (right_x, right_y), (left_x, left_y) = face[4:6], face[6:8]
    angle = np.degrees(np.arctan2(left_y - right_y, left_x - right_x))
    center = (x + width / 2, y + height / 2)
    size = (
        round(width * (1 + 2 * config.FACE_MARGIN_X)),
        round(height * (1 + config.FACE_MARGIN_TOP + config.FACE_MARGIN_BOTTOM)),
    )
    matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
    matrix[:, 2] -= (x - config.FACE_MARGIN_X * width, y - config.FACE_MARGIN_TOP * height)
    return cv2.warpAffine(image, matrix, size, flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


def normalized_box(face: np.ndarray, image_width: int, image_height: int) -> BoundingBox:
    """Face box clipped to the image, as fractions of the image size (3 decimals: about 2 px on a 1920 px image)."""
    x, y, width, height = (float(value) for value in face[:4])
    x1, y1 = max(0.0, x / image_width), max(0.0, y / image_height)
    x2, y2 = min(1.0, (x + width) / image_width), min(1.0, (y + height) / image_height)
    return BoundingBox(x=round(x1, 3), y=round(y1, 3), width=round(x2 - x1, 3), height=round(y2 - y1, 3))


class GenderPipeline:
    def __init__(self):
        self.detector = FaceDetector(
            config.FACE_DETECTOR_PATH, config.FACE_SCORE_THRESHOLD, config.MIN_FACE_SIZE, config.DETECTION_MAX_SIDE
        )
        self.classifier = GenderClassifier(config.GENDER_MODEL_PATH, config.CLASSIFIER_BATCH_SIZE)
        self.embedder = FaceEmbedder(config.FACE_RECOGNIZER_PATH)
        self.classifier.predict([np.zeros((64, 64, 3), np.uint8)])  # warm-up so the first request is fast
        logger.info("Models loaded")

    def classify_faces(self, image: np.ndarray) -> tuple[np.ndarray, list[tuple[Gender, float]]]:
        """Detect every face in a BGR image and classify its gender."""
        detections = self.detector.detect(image)
        return detections, self.classifier.predict([align_face(image, face) for face in detections])

    def detect_faces(self, image: np.ndarray) -> list[Face]:
        """Faces in a BGR image with their gender and a box relative to the image size."""
        detections, predictions = self.classify_faces(image)
        height, width = image.shape[:2]
        return [
            Face(box=normalized_box(face, width, height), gender=gender, confidence=confidence)
            for face, (gender, confidence) in zip(detections, predictions)
        ]

    def analyze_image(self, data: bytes) -> ImageDetection:
        faces = self.detect_faces(decode_image(data))
        return ImageDetection(**GenderCounts.tally(face.gender for face in faces), faces=faces)

    def analyze_video(self, path: str, cancel: threading.Event) -> VideoDetection:
        """
        Sample frames, recognise faces across them and count each person once. Also returns where every counted
        person appears in each sampled frame, so clients can replay the video with labelled face boxes.
        """
        capture = cv2.VideoCapture(path)
        if not capture.isOpened():
            raise ValueError("The file is not a readable video")

        fps = capture.get(cv2.CAP_PROP_FPS) or 25.0
        step = max(1, round(fps / config.VIDEO_SAMPLE_FPS))
        tracker = PersonTracker(
            continuity_threshold=config.TRACK_CONTINUITY_SIMILARITY,
            reid_threshold=config.TRACK_REID_SIMILARITY,
            max_gap=round(config.TRACK_MAX_MISSING_SECONDS * fps / step),
            max_move=config.TRACK_MAX_MOVE,
        )
        frame_index = 0
        frame_times = []  # seconds from the start, one per sampled frame
        try:
            # grab() skips frames cheaply; only sampled frames are decoded
            while not cancel.is_set() and capture.grab():
                if frame_index % step == 0:
                    decoded, frame = capture.retrieve()
                    if decoded:
                        frame_height, frame_width = frame.shape[:2]
                        detections, predictions = self.classify_faces(frame)
                        embeddings = self.embedder.embed(frame, detections)
                        tracker.update(len(frame_times), [
                            Sighting(box=face[:4], embedding=embedding, gender=gender, confidence=confidence)
                            for face, embedding, (gender, confidence) in zip(detections, embeddings, predictions)
                        ])
                        frame_times.append(frame_index / fps)
                frame_index += 1
        finally:
            capture.release()

        if not frame_times:
            raise ValueError("The video has no readable frames")

        people, appearances = tracker.timeline(min_sightings=min(config.TRACK_MIN_SIGHTINGS, len(frame_times)))
        return VideoDetection(
            **GenderCounts.tally(person.gender for person in people),
            frames_analyzed=len(frame_times),
            duration_seconds=round(frame_index / fps, 2),
            frames=[
                VideoFrame(time=round(time, 2), faces=[
                    TrackedFace(
                        box=normalized_box(box, frame_width, frame_height),
                        gender=person.gender,
                        confidence=person.confidence,
                        person=number,
                    )
                    for number, person, box in visible
                ])
                for time, visible in zip(frame_times, appearances)
            ],
        )
