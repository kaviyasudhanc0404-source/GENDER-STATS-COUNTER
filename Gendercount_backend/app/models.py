"""
Model wrappers, all running on OpenCV: YuNet face detection, MobileNetV3 gender classification
and SFace face recognition. OpenCV models keep per-call state, so each wrapper serialises its calls.
"""
import json
import threading
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

from app.schemas import Gender


class FaceDetector:
    """OpenCV YuNet face detector."""

    NMS_THRESHOLD = 0.3
    TOP_K = 5000

    def __init__(self, model_path: Path, score_threshold: float, min_face_size: int, max_side: int):
        self._model = cv2.FaceDetectorYN.create(
            str(model_path), "", (320, 320), score_threshold, self.NMS_THRESHOLD, self.TOP_K
        )
        self._min_face_size = min_face_size
        self._max_side = max_side
        self._lock = threading.Lock()

    def detect(self, image: np.ndarray) -> np.ndarray:
        """
        Detect faces in a BGR image. Returns one row per face in pixel coordinates of the image:
        x, y, width, height, right eye (x, y), left eye (x, y), nose (x, y), mouth corners (x, y, x, y), score.
        """
        height, width = image.shape[:2]
        scale = min(1.0, self._max_side / max(height, width))
        resized = image if scale == 1.0 else cv2.resize(image, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)

        with self._lock:
            self._model.setInputSize((resized.shape[1], resized.shape[0]))
            _, faces = self._model.detect(resized)

        if faces is None:
            return np.empty((0, 15), np.float32)
        faces[:, :14] /= scale
        return faces[np.minimum(faces[:, 2], faces[:, 3]) >= self._min_face_size]


class GenderClassifier:
    """
    MobileNetV3-Large fine-tuned on aligned face crops, exported to ONNX (classes: female, male).
    The decision threshold is read from the JSON file saved next to the model by the training notebook.
    """

    INPUT_SIZE = 224
    MEAN = np.array([0.485, 0.456, 0.406], np.float32)
    STD = np.array([0.229, 0.224, 0.225], np.float32)

    def __init__(self, model_path: Path, batch_size: int):
        self._net = cv2.dnn.readNetFromONNX(str(model_path))
        self._batch_size = batch_size
        self._female_threshold = json.loads(model_path.with_suffix(".json").read_text())["female_threshold"]
        self._lock = threading.Lock()

    def _preprocess(self, face: np.ndarray) -> np.ndarray:
        # Same as the training transform: PIL bilinear resize -> scale to 0-1 -> ImageNet normalisation
        rgb = Image.fromarray(cv2.cvtColor(face, cv2.COLOR_BGR2RGB)).resize((self.INPUT_SIZE,) * 2, Image.BILINEAR)
        return ((np.asarray(rgb, np.float32) / 255 - self.MEAN) / self.STD).transpose(2, 0, 1)

    def _female_probability(self, batch: np.ndarray) -> np.ndarray:
        with self._lock:
            self._net.setInput(batch)
            logits = self._net.forward()
        exp = np.exp(logits - logits.max(axis=1, keepdims=True))
        return exp[:, 0] / exp.sum(axis=1)

    def predict(self, faces: list[np.ndarray]) -> list[tuple[Gender, float]]:
        """Classify BGR face crops. Averages predictions of each crop and its mirror image."""
        predictions = []
        for start in range(0, len(faces), self._batch_size):
            batch = np.stack([self._preprocess(face) for face in faces[start:start + self._batch_size]])
            female = (self._female_probability(batch) + self._female_probability(np.ascontiguousarray(batch[..., ::-1]))) / 2
            predictions += [("female", float(p)) if p >= self._female_threshold else ("male", float(1 - p)) for p in female]
        return predictions


class FaceEmbedder:
    """OpenCV SFace face recognition: a unit-length 128-number fingerprint per face."""

    def __init__(self, model_path: Path):
        self._model = cv2.FaceRecognizerSF.create(str(model_path), "")
        self._lock = threading.Lock()

    def embed(self, image: np.ndarray, faces: np.ndarray) -> np.ndarray:
        """Fingerprints for YuNet detections (rows from FaceDetector.detect) in a BGR image."""
        if len(faces) == 0:
            return np.empty((0, 128), np.float32)
        with self._lock:
            features = np.vstack([self._model.feature(self._model.alignCrop(image, face)) for face in faces])
        return features / np.linalg.norm(features, axis=1, keepdims=True)
