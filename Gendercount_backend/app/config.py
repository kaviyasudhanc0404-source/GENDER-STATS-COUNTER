"""
Configuration for the Gender Statistics Counter backend.

Every tunable value can be overridden with an environment variable or a `.env` file.
"""
import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def _env(name: str, default, cast=str):
    value = os.environ.get(name)
    return default if value in (None, "") else cast(value)


def _env_bool(value: str) -> bool:
    return value.strip().lower() in {"1", "true", "yes", "on"}


# Models
MODELS_DIR = BASE_DIR / "models"
FACE_DETECTOR_PATH = MODELS_DIR / "face_detection_yunet_2023mar.onnx"
GENDER_MODEL_PATH = MODELS_DIR / "gender_mobilenetv3_fairface.onnx"  # decision threshold in the matching .json
FACE_RECOGNIZER_PATH = MODELS_DIR / "face_recognition_sface_2021dec.onnx"

# Face detection
FACE_SCORE_THRESHOLD = _env("FACE_SCORE_THRESHOLD", 0.7, float)
MIN_FACE_SIZE = _env("MIN_FACE_SIZE", 20, int)            # pixels; smaller faces are unreliable
DETECTION_MAX_SIDE = _env("DETECTION_MAX_SIDE", 1280, int)  # images are downscaled to this for detection
MAX_IMAGE_SIDE = _env("MAX_IMAGE_SIDE", 2560, int)  # uploads are decoded at most this size (limits server memory)

# Gender classification: faces are rotated so the eyes are level and the detected box is padded
# slightly (fractions of the box size) – must match MODEL_DETAILS/notebooks/finetune-gender-fairface.ipynb.
FACE_MARGIN_X = 0.10
FACE_MARGIN_TOP = 0.10
FACE_MARGIN_BOTTOM = 0.05
CLASSIFIER_BATCH_SIZE = 8  # faces per model run; larger batches cost far more memory (32 faces at once: ~500 MB peak)

# Video analysis
VIDEO_SAMPLE_FPS = _env("VIDEO_SAMPLE_FPS", 3.0, float)
# A face is the same person if it is still in view (seen within TRACK_MAX_MISSING_SECONDS, moved at most
# TRACK_MAX_MOVE face widths per sampled frame, fingerprint similarity >= TRACK_CONTINUITY_SIMILARITY)
# or if its fingerprint similarity is >= TRACK_REID_SIMILARITY (a person returning to the view).
TRACK_MAX_MISSING_SECONDS = 2.0
TRACK_MAX_MOVE = 1.5
TRACK_CONTINUITY_SIMILARITY = 0.30
TRACK_REID_SIMILARITY = _env("TRACK_REID_SIMILARITY", 0.55, float)  # higher = fewer wrong merges of different people
TRACK_MIN_SIGHTINGS = 2  # sampled frames a person must appear in to be counted

# Uploads
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov", ".avi"}
MAX_IMAGE_MB = _env("MAX_IMAGE_MB", 10, int)
MAX_VIDEO_MB = _env("MAX_VIDEO_MB", 200, int)

# API
API_HOST = _env("API_HOST", "0.0.0.0")
API_PORT = _env("API_PORT", 8000, int)
API_RELOAD = _env("API_RELOAD", False, _env_bool)
CORS_ORIGINS = [
    origin.strip()
    for origin in _env("CORS_ORIGINS", "http://localhost:8080,http://127.0.0.1:8080").split(",")
    if origin.strip()
]
