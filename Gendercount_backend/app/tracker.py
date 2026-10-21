"""
Counts unique people in a video by recognising faces (SFace fingerprints), so a person is counted once
even when they move fast, are hidden for a moment, or leave the view and come back.
Fingerprints live only in memory for the duration of one video analysis.
"""
from collections import Counter
from dataclasses import dataclass, field

import numpy as np

from app.schemas import Gender


@dataclass
class Sighting:
    """One face in one sampled frame."""
    box: np.ndarray        # x, y, width, height in pixels
    embedding: np.ndarray  # unit-length SFace fingerprint
    gender: Gender
    confidence: float


@dataclass
class Person:
    box: np.ndarray
    last_seen: int
    gallery: list[np.ndarray] = field(default_factory=list)  # fingerprints from different angles
    votes: Counter = field(default_factory=Counter)          # gender -> summed confidence
    female_probability: float = 0.0                          # summed over all sightings
    sightings: int = 0

    GALLERY_SIZE = 10
    GALLERY_DIVERSITY = 0.8  # only keep fingerprints that differ from the stored ones

    def similarity(self, embedding: np.ndarray) -> float:
        return max(float(stored @ embedding) for stored in self.gallery)

    def is_near(self, box: np.ndarray, frames_gap: int, max_move: float) -> bool:
        """Whether the face centre moved at most `max_move` face widths per sampled frame."""
        (x, y, w, h), (bx, by, bw, bh) = self.box, box
        distance = np.hypot((x + w / 2) - (bx + bw / 2), (y + h / 2) - (by + bh / 2))
        return distance <= max_move * max(w, bw) * frames_gap

    def add(self, sighting: Sighting, frame: int) -> None:
        if len(self.gallery) < self.GALLERY_SIZE and (not self.gallery or self.similarity(sighting.embedding) < self.GALLERY_DIVERSITY):
            self.gallery.append(sighting.embedding)
        self.box = sighting.box
        self.last_seen = frame
        self.votes[sighting.gender] += sighting.confidence
        self.female_probability += sighting.confidence if sighting.gender == "female" else 1 - sighting.confidence
        self.sightings += 1

    @property
    def gender(self) -> Gender:
        return self.votes.most_common(1)[0][0]

    @property
    def confidence(self) -> float:
        """Average probability of the final gender over all sightings."""
        female = self.female_probability / self.sightings
        return round(female if self.gender == "female" else 1 - female, 3)


class PersonTracker:
    """
    A face belongs to an already seen person when either
    - it is the same person still in view: seen within `max_gap` sampled frames, close to their last
      position and with a fingerprint similarity of at least `continuity_threshold`, or
    - it is a returning person: fingerprint similarity of at least `reid_threshold`, anywhere and any time.
    Otherwise it starts a new person.
    """

    def __init__(self, continuity_threshold: float, reid_threshold: float, max_gap: int, max_move: float):
        self._continuity_threshold = continuity_threshold
        self._reid_threshold = reid_threshold
        self._max_gap = max_gap
        self._max_move = max_move
        self._people: list[Person] = []
        self._appearances: list[list[tuple[int, np.ndarray]]] = []  # per sampled frame: (person index, face box)

    def _matches(self, person: Person, sighting: Sighting, frame: int, similarity: float) -> bool:
        if similarity >= self._reid_threshold:
            return True
        gap = frame - person.last_seen
        return (
            gap <= self._max_gap
            and similarity >= self._continuity_threshold
            and person.is_near(sighting.box, gap, self._max_move)
        )

    def update(self, frame: int, sightings: list[Sighting]) -> None:
        """Assign the faces of one sampled frame, most similar pairs first; each person matches at most one face."""
        candidates = []
        for s, sighting in enumerate(sightings):
            for p, person in enumerate(self._people):
                similarity = person.similarity(sighting.embedding)
                if self._matches(person, sighting, frame, similarity):
                    candidates.append((similarity, s, p))

        appearances = []
        assigned_sightings, assigned_people = set(), set()
        for _, s, p in sorted(candidates, reverse=True):
            if s not in assigned_sightings and p not in assigned_people:
                self._people[p].add(sightings[s], frame)
                appearances.append((p, sightings[s].box))
                assigned_sightings.add(s)
                assigned_people.add(p)

        for s, sighting in enumerate(sightings):
            if s not in assigned_sightings:
                person = Person(box=sighting.box, last_seen=frame)
                person.add(sighting, frame)
                appearances.append((len(self._people), sighting.box))
                self._people.append(person)

        self._appearances.append(appearances)

    def timeline(self, min_sightings: int) -> tuple[list[Person], list[list[tuple[int, Person, np.ndarray]]]]:
        """
        The people seen in at least `min_sightings` sampled frames, in order of first appearance, and for every
        sampled frame which of them are visible: (person number starting at 1, person, face box in pixels).
        """
        numbers = {}
        for index, person in enumerate(self._people):
            if person.sightings >= min_sightings:
                numbers[index] = len(numbers) + 1
        frames = [
            [(numbers[index], self._people[index], box) for index, box in appearances if index in numbers]
            for appearances in self._appearances
        ]
        return [self._people[index] for index in numbers], frames
