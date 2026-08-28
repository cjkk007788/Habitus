"""
iTunes API 서비스 모듈.

트랙 검색을 통해 30초 미리듣기 URL과 고해상도 앨범 아트워크를 가져옵니다.
"""

import logging
from typing import Dict, Any, Optional

from app.services.http_client import api_request

logger = logging.getLogger(__name__)

ITUNES_BASE_URL = "https://itunes.apple.com/search"


async def search_track(artist: str, track: str) -> Optional[Dict[str, Any]]:
    """
    Search iTunes for a track to get 30s previewUrl and high-res artwork.
    """
    params = {
        "term": f"{artist} {track}",
        "media": "music",
        "entity": "song",
        "limit": 1,
    }

    data = await api_request(ITUNES_BASE_URL, params=params, timeout=5.0)

    if data and data.get("resultCount", 0) > 0:
        result = data["results"][0]
        return {
            "preview_url": result.get("previewUrl"),
            "artwork_url": result.get("artworkUrl100"),
            "track_name": result.get("trackName"),
            "artist_name": result.get("artistName"),
            "apple_music_url": result.get("trackViewUrl"),
        }

    return None


async def get_artist_image_url(artist_name: str) -> Optional[str]:
    """
    Search iTunes for an artist's most popular track to extract a high-res cover image.
    Uses artworkUrl100 but modifies it to 600x600 for premium quality.
    """
    params = {
        "term": artist_name,
        "media": "music",
        "entity": "song",
        "limit": 1,
    }

    data = await api_request(ITUNES_BASE_URL, params=params, timeout=5.0)

    if data:
        logger.info(f"iTunes API search for '{artist_name}': Found {data.get('resultCount', 0)} results.")
        if data.get("resultCount", 0) > 0:
            result = data["results"][0]
            artwork_url = result.get("artworkUrl100")
            logger.info(f"Extracted original artwork URL: {artwork_url}")
            if artwork_url:
                # Replace 100x100 with 600x600 for high resolution
                high_res_url = artwork_url.replace("100x100bb", "600x600bb")
                logger.info(f"Converted to high-res URL: {high_res_url}")
                return high_res_url
    else:
        logger.warning(f"iTunes API request failed or returned empty for artist: {artist_name}")

    return None

