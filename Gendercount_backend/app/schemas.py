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


class Health(BaseModel):
    status: Literal["ok"]
