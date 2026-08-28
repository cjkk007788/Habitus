from fastapi import APIRouter
from typing import List, Dict, Any
import logging
from app.services import musicbrainz, discogs

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("", response_model=List[Dict[str, str]])
async def get_genres():
    """
    Get all music genres from MusicBrainz.
    Results are cached in memory after the first fetch.
    """
    genres = await musicbrainz.get_all_genres()
    return genres


@router.get("/{genre}/items", response_model=List[Dict[str, Any]])
async def get_genre_artists(
    genre: str,
    page: int = 1,
    limit: int = 10,
):
    """
    Get top artists for a specific genre from MusicBrainz.
    아티스트 이미지는 Discogs에서 직접 가져옵니다.
    """
    artists = await musicbrainz.get_artists_by_genre(genre, page=page, limit=limit)

    for artist in artists:
        name = artist.get("name", "")
        img_url = await discogs.get_artist_image_url(name)
        if img_url:
            artist["image_url"] = img_url

    images_count = sum(1 for a in artists if "image_url" in a)
    logger.info(f"Returning {len(artists)} artists for genre '{genre}' (page {page}). {images_count} have images.")

    return artists
