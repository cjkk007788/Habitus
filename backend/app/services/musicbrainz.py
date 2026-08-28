"""
MusicBrainz API 서비스 모듈.

아티스트/트랙 검색, MBID 조회, 장르 목록, 장르별 아티스트 검색 기능을 제공합니다.
HTTP 요청 로직(속도 제한, 타임아웃, 에러 방어)은 http_client.py에 위임합니다.
"""

import logging
from typing import Dict, Any, Optional, List

from app.services.http_client import mb_request, mb_request_text

logger = logging.getLogger(__name__)

# ── 장르 캐시 ──────────────────────────────────────────────
_cached_genres: List[Dict[str, str]] = []


async def search_artist(query: str) -> Optional[Dict[str, Any]]:
    """Search for an artist by name."""
    return await mb_request("/artist", params={"query": query})


async def search_recording(query: str) -> Optional[Dict[str, Any]]:
    """Search for a recording (track) by name."""
    return await mb_request("/recording", params={"query": query})


async def get_artist_by_mbid(mbid: str) -> Optional[Dict[str, Any]]:
    """Get detailed artist info using their MusicBrainz ID (MBID)."""
    return await mb_request(f"/artist/{mbid}", params={"inc": "url-rels+tags"})


async def get_recording_by_mbid(mbid: str) -> Optional[Dict[str, Any]]:
    """Get detailed recording (track) info using their MusicBrainz ID (MBID)."""
    return await mb_request(
        f"/recording/{mbid}",
        params={"inc": "artist-credits+releases+tags"},
    )


async def get_all_genres() -> List[Dict[str, str]]:
    """
    Fetch all genres from MusicBrainz using the text format.
    Caches the result in memory after the first fetch.
    """
    global _cached_genres
    if _cached_genres:
        return _cached_genres

    text = await mb_request_text("/genre/all")
    if text is None:
        return []

    genres = []
    for line in text.strip().split("\n"):
        name = line.strip()
        if name:
            genres.append({
                "id": name.lower().replace(" ", "-"),
                "name": name,
            })

    _cached_genres = genres
    logger.info("Cached %d genres from MusicBrainz", len(genres))
    return _cached_genres


async def get_artists_by_genre(genre: str, page: int = 1, limit: int = 10) -> List[Dict[str, Any]]:
    """Search for artists by genre (tag) using MusicBrainz Search API."""
    offset = (page - 1) * limit
    data = await mb_request(
        "/artist",
        params={
            "query": f'tag:"{genre}"', 
            "limit": limit,
            "offset": offset
        },
    )
    if data and "artists" in data:
        return data["artists"]
    return []
