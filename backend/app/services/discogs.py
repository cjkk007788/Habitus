"""
Discogs API 서비스 모듈.
앨범 릴리스 정보를 검색하여 누락된 메타데이터를 보충합니다.
"""

import logging
from typing import Dict, Any, Optional

from app.core.config import settings
from app.services.http_client import api_request

logger = logging.getLogger(__name__)

DISCOGS_BASE_URL = "https://api.discogs.com"


def _get_auth_headers() -> dict:
    """Discogs 인증 헤더를 생성합니다."""
    if settings.DISCOGS_API_KEY and settings.DISCOGS_API_SECRET:
        return {
            "Authorization": f"Discogs key={settings.DISCOGS_API_KEY}, secret={settings.DISCOGS_API_SECRET}"
        }
    return {}


async def search_release(query: str) -> Optional[Dict[str, Any]]:
    """Search for album releases on Discogs to supplement missing metadata."""
    return await api_request(
        f"{DISCOGS_BASE_URL}/database/search",
        params={"q": query, "type": "release"},
        headers=_get_auth_headers(),
    )


async def get_artist_image_url(artist_name: str) -> Optional[str]:
    """
    Search Discogs for an artist to get their real profile photo.
    Discogs provides much better artist images than iTunes and we have auth keys for it.
    """
    headers = _get_auth_headers()
    # User-Agent is required by Discogs API
    headers["User-Agent"] = "HabitusMusicApp/1.0"
    
    from app.services.http_client import DEFAULT_TIMEOUT
    data = await api_request(
        f"{DISCOGS_BASE_URL}/database/search",
        params={"q": artist_name, "type": "artist"},
        headers=headers,
        timeout=DEFAULT_TIMEOUT
    )

    if data:
        logger.info(f"Discogs API search for '{artist_name}': Found {len(data.get('results', []))} results.")
        if data.get("results"):
            # Return the cover_image of the top result
            img_url = data["results"][0].get("cover_image")
            # If it's the generic spacer image, ignore it
            if img_url and "spacer.gif" not in img_url:
                logger.info(f"Discogs extracted image: {img_url}")
                return img_url
    else:
        logger.warning(f"Discogs API request failed for artist: {artist_name}")

    return None
