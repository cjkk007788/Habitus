from fastapi import APIRouter
from app.api.routes import items, albums, mixes, search, music_genres, book_genres, movie_genres, curation

api_router = APIRouter()

api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(items.router, prefix="/items", tags=["items"])
api_router.include_router(albums.router, prefix="/albums", tags=["albums"])
api_router.include_router(mixes.router, prefix="/mixes", tags=["mixes"])
api_router.include_router(music_genres.router, prefix="/genres/music", tags=["music_genres"])
api_router.include_router(book_genres.router, prefix="/genres/book", tags=["book_genres"])
api_router.include_router(movie_genres.router, prefix="/genres/movie", tags=["movie_genres"])
api_router.include_router(curation.router, prefix="/curation", tags=["curation"])
