"""
Last.fm API 서비스 모듈.

아티스트 정보(태그, 유사 아티스트)와 트랙 정보(재생수, 태그)를 가져옵니다.
"""

import logging
from typing import Dict, Any, Optional

from app.core.config import settings
from app.services.http_client import api_request

logger = logging.getLogger(__name__)

LASTFM_BASE_URL = "http://ws.audioscrobbler.com/2.0/"


async def get_artist_info(artist_name: str, mbid: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Fetch artist info including top tags and similar artists from Last.fm."""
    if not settings.LASTFM_API_KEY:
        logger.warning("LASTFM_API_KEY is not set, skipping Last.fm request")
        return None

    params = {
        "method": "artist.getinfo",
        "api_key": settings.LASTFM_API_KEY,
        "format": "json",
    }

    if mbid:
        params["mbid"] = mbid
    else:
        params["artist"] = artist_name

    return await api_request(LASTFM_BASE_URL, params=params)


async def get_track_info(artist_name: str, track_name: str, mbid: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Fetch track info including tags and playcount from Last.fm."""
    if not settings.LASTFM_API_KEY:
        logger.warning("LASTFM_API_KEY is not set, skipping Last.fm request")
        return None

    params = {
        "method": "track.getinfo",
        "api_key": settings.LASTFM_API_KEY,
        "format": "json",
    }

    if mbid:
        params["mbid"] = mbid
    else:
        params["artist"] = artist_name
        params["track"] = track_name

    return await api_request(LASTFM_BASE_URL, params=params)


async def get_top_artists_by_tag(tag: str, page: int = 1, limit: int = 10) -> list:
    """Fetch top artists for a specific genre/tag from Last.fm (much more resilient than MusicBrainz)."""
    if not settings.LASTFM_API_KEY:
        logger.warning("LASTFM_API_KEY is not set, skipping Last.fm request")
        return []

    params = {
        "method": "tag.gettopartists",
        "tag": tag,
        "api_key": settings.LASTFM_API_KEY,
        "format": "json",
        "limit": limit,
        "page": page
    }

    data = await api_request(LASTFM_BASE_URL, params=params)
    if data and "topartists" in data and "artist" in data["topartists"]:
        return data["topartists"]["artist"]
    return []


async def get_all_genres() -> list:
    """Fetch all top tags (genres) from Last.fm to replace MusicBrainz."""
    if not settings.LASTFM_API_KEY:
        logger.warning("LASTFM_API_KEY is not set, skipping Last.fm request")
        return []

    params = {
        "method": "tag.getTopTags",
        "api_key": settings.LASTFM_API_KEY,
        "format": "json"
    }

    data = await api_request(LASTFM_BASE_URL, params=params)
    if data and "toptags" in data and "tag" in data["toptags"]:
        tags = data["toptags"]["tag"]
        # Format them to match what the frontend expects: { id: "genre-name", name: "Genre Name" }
        formatted_genres = []
        for t in tags:
            name = t.get("name", "")
            if name:
                formatted_genres.append({
                    "id": name.lower().replace(" ", "-"),
                    "name": name.title()
                })
        return formatted_genres
    return []


async def get_global_top_tracks(page: int = 1, limit: int = 10) -> list:
    """Fetch global top tracks from Last.fm chart."""
    if not settings.LASTFM_API_KEY:
        logger.warning("LASTFM_API_KEY is not set, skipping Last.fm request")
        return []

    params = {
        "method": "chart.gettoptracks",
        "api_key": settings.LASTFM_API_KEY,
        "format": "json",
        "limit": limit,
        "page": page
    }

    data = await api_request(LASTFM_BASE_URL, params=params)
    if data and "tracks" in data and "track" in data["tracks"]:
        return data["tracks"]["track"]
    return []


async def get_global_top_artists(page: int = 1, limit: int = 10) -> list:
    """Fetch global top artists from Last.fm chart."""
    if not settings.LASTFM_API_KEY:
        logger.warning("LASTFM_API_KEY is not set, skipping Last.fm request")
        return []

    params = {
        "method": "chart.gettopartists",
        "api_key": settings.LASTFM_API_KEY,
        "format": "json",
        "limit": limit,
        "page": page
    }

    data = await api_request(LASTFM_BASE_URL, params=params)
    if data and "artists" in data and "artist" in data["artists"]:
        return data["artists"]["artist"]
    return []
