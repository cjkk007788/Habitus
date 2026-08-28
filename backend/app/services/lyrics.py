"""
Lyrics API 서비스 모듈.

lyrics.ovh 오픈 API를 통해 가사를 가져옵니다.
"""

import logging
from typing import Optional

from app.services.http_client import api_request

logger = logging.getLogger(__name__)

LYRICS_OVH_URL = "https://api.lyrics.ovh/v1"


async def get_lyrics(artist: str, title: str) -> Optional[str]:
    """Fetch lyrics for a given artist and track title using the open lyrics.ovh API."""
    data = await api_request(
        f"{LYRICS_OVH_URL}/{artist}/{title}",
        timeout=5.0,
    )

    if data:
        return data.get("lyrics")
    return None
