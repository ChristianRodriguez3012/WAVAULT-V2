#!/usr/bin/env python3
"""
Minimal, ASCII-only filename parser to extract basic metadata from beat file names.
Expected shape: "ARTIST x COLLAB - TITLE - 130 BPM E Minor Type Beat".
"""

import re
from typing import Dict, List, Optional

# Keyword lists kept small on purpose; extend cautiously to avoid false positives.
_MOOD_KEYWORDS = ["melodic", "dark", "aggressive", "chill"]
_GENRE_KEYWORDS = ["trap latino", "latin trap", "reggaeton", "hip-hop", "r&b"]


def _extract_bpm(segment: str) -> Optional[int]:
    match = re.search(r"\b(\d{2,3})\s*bpm\b", segment, flags=re.IGNORECASE)
    return int(match.group(1)) if match else None


def _extract_key(segment: str) -> Optional[str]:
    match = re.search(r"\b([A-G])\s*(#|b)?\s*(Minor|Major|maj|min|m)\b", segment, flags=re.IGNORECASE)
    if not match:
        return None
    note = match.group(1).upper()
    accidental = (match.group(2) or "").replace("#", "#").replace("b", "b")
    scale_raw = match.group(3).lower()
    scale = "Minor" if scale_raw in ("min", "m", "minor") else "Major"
    return f"{note}{accidental} {scale}".strip()


def _extract_mood(segment: str) -> Optional[str]:
    lowered = segment.lower()
    for word in _MOOD_KEYWORDS:
        if word in lowered:
            return word.title()
    return None


def _extract_genres(segment: str) -> List[str]:
    lowered = segment.lower()
    genres = []
    for word in _GENRE_KEYWORDS:
        if word in lowered:
            genres.append(word.title())
    return genres


def parse_filename(filename: str) -> Dict:
    base = filename.rsplit('/', 1)[-1]
    name = re.sub(r"\.(mp3|wav|flac|m4a|aac|ogg)$", "", base, flags=re.IGNORECASE)
    name = re.sub(r"\s+", " ", name).strip()

    info = {
        "artist": None,
        "collabs": [],
        "title": None,
        "bpm": None,
        "key": None,
        "type": "Beat",
        "mood_hint": None,
        "genre_hint": [],
    }

    parts = [p.strip() for p in re.split(r"\s*-\s*", name) if p.strip()]
    if not parts:
        return info

    # Artists and collaborators from the first segment
    artist_segment = parts[0]
    artists = [a.strip() for a in re.split(r"\s*(?:x|ft\.?|feat\.?|&|,|\+|with)\s*", artist_segment, flags=re.IGNORECASE) if a.strip()]
    if artists:
        info["artist"] = artists[0]
        info["collabs"] = artists

    # Title is typically the second segment if present
    if len(parts) > 1:
        info["title"] = parts[1]

    # Scan remaining segments for metadata
    for segment in parts[1:]:
        bpm = _extract_bpm(segment)
        if bpm:
            info["bpm"] = bpm

        key = _extract_key(segment)
        if key:
            info["key"] = key

        mood = _extract_mood(segment)
        if mood and not info["mood_hint"]:
            info["mood_hint"] = mood

        genres = _extract_genres(segment)
        if genres:
            info["genre_hint"].extend(genres)

    # Deduplicate genres preserving order
    seen = set()
    deduped_genres = []
    for g in info["genre_hint"]:
        if g not in seen:
            deduped_genres.append(g)
            seen.add(g)
    info["genre_hint"] = deduped_genres

    return info
