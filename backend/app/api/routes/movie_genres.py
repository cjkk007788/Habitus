from fastapi import APIRouter
from typing import List, Dict, Any
import logging
from app.services import tmdb

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("", response_model=List[Dict[str, str]])
async def get_movie_genres():
    """
    Get movie genres list from TMDB.
    """
    genres = await tmdb.get_movie_genres()
    return genres

@router.get("/{genre_id}/items", response_model=List[Dict[str, Any]])
async def get_movies_by_genre(
    genre_id: str,
    page: int = 1,
    limit: int = 20,
):
    """
    Get movies for a specific genre from TMDB.
    """
    movies = await tmdb.get_movies_by_genre(genre_id, page=page, limit=limit)
    return movies

@router.get("/{movie_id}/trailer")
async def get_movie_trailer(movie_id: int):
    """
    Get YouTube trailer key for a specific movie.
    """
    trailer_key = await tmdb.get_movie_trailer(movie_id)
    return {"trailer_key": trailer_key}

@router.get("/{movie_id}/details")
async def get_movie_details(movie_id: int):
    """
    Get full movie details including credits from TMDB.
    """
    details = await tmdb.get_movie_detail(movie_id)
    return details

