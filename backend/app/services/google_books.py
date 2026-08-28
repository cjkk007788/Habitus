import os
import aiohttp
import logging
from typing import List, Dict, Any
from dotenv import load_dotenv
from app.services.http_client import api_request

load_dotenv()

logger = logging.getLogger(__name__)

GOOGLE_BOOKS_API_KEY = os.getenv("GoogleBooks_API_KEY")
BASE_URL = "https://www.googleapis.com/books/v1"

async def get_book_genres() -> List[Dict[str, Any]]:
    """
    Google Books doesn't have a direct 'list of all genres' endpoint.
    We return a curated list of standard genres to use with the `subject:` query.
    """
    return [
        # 소설 / 문학 (Fiction & Literature)
        {"id": "fiction", "name": "Fiction"},
        {"id": "science-fiction", "name": "Science Fiction"},
        {"id": "fantasy", "name": "Fantasy"},
        {"id": "romance", "name": "Romance"},
        {"id": "mystery", "name": "Mystery"},
        {"id": "thriller", "name": "Thriller"},
        {"id": "horror", "name": "Horror"},
        {"id": "poetry", "name": "Poetry"},
        # 인문 / 사회 (Humanities & Society)
        {"id": "history", "name": "History"},
        {"id": "biography", "name": "Biography"},
        {"id": "philosophy", "name": "Philosophy"},
        {"id": "psychology", "name": "Psychology"},
        {"id": "religion", "name": "Religion"},
        {"id": "social-science", "name": "Social Science"},
        # 실용 / 전문 / 취미 (Non-Fiction & Hobbies)
        {"id": "business", "name": "Business"},
        {"id": "computers", "name": "Computers"},
        {"id": "science", "name": "Science"},
        {"id": "art", "name": "Art"},
        {"id": "cooking", "name": "Cooking"},
        {"id": "travel", "name": "Travel"},
        {"id": "health", "name": "Health"},
        {"id": "non-fiction", "name": "Non-Fiction"},
    ]

async def get_books_by_genre(genre_name: str, page: int = 1, limit: int = 10) -> List[Dict[str, Any]]:
    """Fetch books by subject (genre) from Google Books API."""
    if not GOOGLE_BOOKS_API_KEY:
        logger.error("GoogleBooks_API_KEY is not set.")
        return []
        
    url = f"{BASE_URL}/volumes"
    
    # Calculate start index based on page and limit (0-indexed)
    start_index = (page - 1) * limit
    
    params = {
        "q": f'subject:"{genre_name}"',
        "printType": "books",
        "maxResults": limit,
        "startIndex": start_index,
        "orderBy": "relevance",
        "key": GOOGLE_BOOKS_API_KEY
    }
    
    try:
        data = await api_request(url, params=params)
        if data and "items" in data:
            return data["items"]
        return []
    except Exception as e:
        logger.error(f"Error fetching Google Books by genre: {e}")
        return []


async def get_curated_books(curation_type: str, page: int = 1, limit: int = 20) -> List[Dict[str, Any]]:
    """Fetch curated books using specific search queries."""
    if not GOOGLE_BOOKS_API_KEY:
        logger.error("GoogleBooks_API_KEY is not set.")
        return []

    # Map curation_type to search queries
    query_map = {
        "bestseller": 'subject:fiction', 
        "award": 'award winning books',
        "classic": 'subject:classic',
    }

    query = query_map.get(curation_type, 'subject:"fiction"')
    
    url = f"{BASE_URL}/volumes"
    start_index = (page - 1) * limit
    
    params = {
        "q": query,
        "printType": "books",
        "maxResults": limit,
        "startIndex": start_index,
        "orderBy": "relevance",
        "key": GOOGLE_BOOKS_API_KEY
    }
    
    try:
        data = await api_request(url, params=params)
        if data and "items" in data:
            return data["items"]
        return []
    except Exception as e:
        logger.error(f"Error fetching curated Google Books: {e}")
        return []


async def search_books(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Google Books API로 도서를 검색합니다.

    Args:
        query: 검색어 (제목, 저자 등)
        limit: 반환할 최대 결과 수

    Returns:
        통합 검색 응답 포맷에 맞는 결과 리스트
    """
    if not GOOGLE_BOOKS_API_KEY:
        logger.error("GoogleBooks_API_KEY is not set.")
        return []

    url = f"{BASE_URL}/volumes"
    params = {
        "q": query,
        "printType": "books",
        "maxResults": limit,
        "startIndex": 0,
        "orderBy": "relevance",
        "key": GOOGLE_BOOKS_API_KEY,
    }

    try:
        data = await api_request(url, params=params)
        if not data or "items" not in data:
            logger.warning("Google Books 검색 결과 없음. query=%s", query)
            return []

        results = []
        for item in data["items"][:limit]:
            info = item.get("volumeInfo", {})

            # 저자 및 출판 연도
            authors = info.get("authors", [])
            subtitle = ", ".join(authors) if authors else "Unknown Author"
            published_date = info.get("publishedDate", "")
            release_year = None
            if published_date and len(published_date) >= 4:
                try:
                    release_year = int(published_date[:4])
                except ValueError:
                    pass

            # 커버 이미지 (thumbnail → 더 큰 이미지로 교체)
            image_links = info.get("imageLinks", {})
            cover_url = image_links.get("thumbnail") or image_links.get("smallThumbnail")
            if cover_url:
                # HTTP를 HTTPS로 변환 (Mixed Content 방지)
                cover_url = cover_url.replace("http://", "https://")
                # zoom=1 → zoom=3 으로 올려서 해상도 향상
                cover_url = cover_url.replace("zoom=1", "zoom=3")

            # ISBN
            isbn = ""
            for identifier in info.get("industryIdentifiers", []):
                if identifier.get("type") in ("ISBN_13", "ISBN_10"):
                    isbn = identifier.get("identifier", "")
                    break

            results.append({
                "external_id": item.get("id", ""),
                "external_source": "google_books",
                "item_type": "book",
                "title": info.get("title", "Unknown Title"),
                "subtitle": subtitle,
                "cover_image_url": cover_url,
                "preview_url": None,
                "release_year": release_year,
                "metadata": {
                    "authors": authors,
                    "publisher": info.get("publisher", ""),
                    "published_date": published_date,
                    "description": info.get("description", ""),
                    "page_count": info.get("pageCount"),
                    "categories": info.get("categories", []),
                    "isbn": isbn,
                    "language": info.get("language", ""),
                    "preview_link": info.get("previewLink", ""),
                },
            })

        logger.info("Google Books 검색 query='%s' → %d권 반환", query, len(results))
        return results

    except Exception as e:
        logger.error(f"Error searching Google Books: {e}")
        return []

