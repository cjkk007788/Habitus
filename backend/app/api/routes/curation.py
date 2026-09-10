from fastapi import APIRouter
from typing import List, Dict, Any
import logging
import asyncio
from app.services import lastfm, tmdb, google_books, discogs, itunes

logger = logging.getLogger(__name__)
router = APIRouter()

# --- Music Curations ---
@router.get("/music/lists")
async def get_music_curation_lists():
    return [
        {"id": "top_tracks", "title": "🎧 글로벌 인기 트랙 (Top Tracks)"},
        {"id": "top_artists", "title": "🎤 글로벌 인기 아티스트 (Top Artists)"}
    ]

@router.get("/music/{curation_id}")
async def get_music_curation_items(curation_id: str, page: int = 1, limit: int = 10):
    if curation_id == "top_tracks":
        tracks = await lastfm.get_global_top_tracks(page=page, limit=limit)
        # Fetch actual track artwork from iTunes (Last.fm images are placeholders now)
        async def enrich_track(track):
            artist_name = track.get("artist", {}).get("name", "")
            track_name = track.get("name", "")
            if artist_name and track_name:
                itunes_data = await itunes.search_track(artist_name, track_name)
                if itunes_data:
                    if itunes_data.get("artwork_url"):
                        track["image_url"] = itunes_data["artwork_url"].replace("100x100bb", "600x600bb")
                    if itunes_data.get("preview_url"):
                        track["preview_url"] = itunes_data["preview_url"]
                    if itunes_data.get("apple_music_url"):
                        track["apple_music_url"] = itunes_data["apple_music_url"]
                    if itunes_data.get("primary_genre_name"):
                        track["genre"] = itunes_data["primary_genre_name"]
            return track
        
        enriched_tracks = await asyncio.gather(*(enrich_track(t) for t in tracks))
        return list(enriched_tracks)
    elif curation_id == "top_artists":
        artists = await lastfm.get_global_top_artists(page=page, limit=limit)
        # Fetch images for top artists from Discogs like we do in music_genres.py
        for artist in artists:
            name = artist.get("name", "")
            img_url = await discogs.get_artist_image_url(name)
            if img_url:
                artist["image_url"] = img_url
        return artists
    return []

# --- Movie Curations ---
@router.get("/movie/lists")
async def get_movie_curation_lists():
    return [
        {"id": "trending", "title": "🔥 요즘 뜨는 영화 (Trending This Week)"},
        {"id": "trending_persons", "title": "🌟 요즘 뜨는 영화인 (Trending Persons)"},
        {"id": "top_rated", "title": "⭐ 역대 최고 평점 (Top Rated)"}
    ]

@router.get("/movie/{curation_id}")
async def get_movie_curation_items(curation_id: str, page: int = 1, limit: int = 20):
    if curation_id == "trending":
        return await tmdb.get_trending_movies(page=page, limit=limit)
    elif curation_id == "trending_persons":
        return await tmdb.get_trending_persons(page=page, limit=limit)
    elif curation_id == "top_rated":
        return await tmdb.get_top_rated_movies(page=page, limit=limit)
    return []

# --- Book Curations ---
@router.get("/book/lists")
async def get_book_curation_lists():
    return [
        {"id": "bestseller", "title": "📚 스테디셀러 / 인기 도서"},
        {"id": "award", "title": "🏆 수상작 추천"},
        {"id": "classic", "title": "🕰️ 고전문학 클래식"}
    ]

@router.get("/book/{curation_id}")
async def get_book_curation_items(curation_id: str, page: int = 1, limit: int = 10):
    return await google_books.get_curated_books(curation_type=curation_id, page=page, limit=limit)
