"""
API response models.
"""
from collections import Counter
from typing import Iterable, Literal

from pydantic import BaseModel, Field

Gender = Literal["female", "male"]


class BoundingBox(BaseModel):
    """Face box as fractions (0-1) of the image width and height."""
    x: float
    y: float
    width: float
    height: float


class Face(BaseModel):
    box: BoundingBox
    gender: Gender
    confidence: float = Field(ge=0, le=1)


class TrackedFace(Face):
    """A face in a video, labelled with the person it belongs to (numbered from 1 in order of first appearance)."""
    person: int = Field(ge=1)


class VideoFrame(BaseModel):
    """One analysed video frame and the counted people visible in it."""
    time: float  # seconds from the start of the video
    faces: list[TrackedFace]


class GenderCounts(BaseModel):
    male: int
    female: int
    total: int

    @staticmethod
    def tally(genders: Iterable[Gender]) -> dict:
        counts = Counter(genders)
        return {"male": counts["male"], "female": counts["female"], "total": counts.total()}


class ImageDetection(GenderCounts):
    faces: list[Face]


class VideoDetection(GenderCounts):
    frames_analyzed: int
    duration_seconds: float
    frames: list[VideoFrame]


class Health(BaseModel):
    status: Literal["ok"]
