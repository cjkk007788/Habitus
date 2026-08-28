from fastapi import APIRouter
from typing import List, Dict, Any
import logging
from app.services import google_books

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("", response_model=List[Dict[str, Any]])
async def get_book_genres():
    """
    Get book genres list.
    """
    genres = await google_books.get_book_genres()
    return genres

@router.get("/{genre_name}/items", response_model=List[Dict[str, Any]])
async def get_books_by_genre(
    genre_name: str,
    page: int = 1,
    limit: int = 10,
):
    """
    Get books for a specific genre from Google Books.
    """
    books = await google_books.get_books_by_genre(genre_name, page=page, limit=limit)
    return books
