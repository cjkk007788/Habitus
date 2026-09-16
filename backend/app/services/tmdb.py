"""
TMDB (The Movie Database) API 서비스 모듈.

영화 장르 목록 조회와 장르별 영화 발견 기능을 제공합니다.
인증 방식: Authorization: Bearer {READ_ACCESS_TOKEN} 헤더 사용
이미지 URL: https://image.tmdb.org/t/p/w500{poster_path} 형태로 조합
"""

import logging
from typing import Dict, Any, Optional, List

from app.core.config import settings
from app.services.http_client import api_request

logger = logging.getLogger(__name__)

TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500"

# 장르 목록 메모리 캐시 (MusicBrainz 패턴과 동일)
_cached_genres: List[Dict[str, str]] = []


def _get_auth_headers() -> dict:
    """TMDB Bearer 토큰 인증 헤더를 생성합니다."""
    if settings.TMDB_READ_ACCESS_TOKEN:
        return {
            "Authorization": f"Bearer {settings.TMDB_READ_ACCESS_TOKEN}",
            "accept": "application/json",
        }
    # Read Access Token이 없으면 API Key 방식으로 폴백
    return {"accept": "application/json"}


def _build_poster_url(poster_path: Optional[str]) -> Optional[str]:
    """poster_path를 완전한 이미지 URL로 변환합니다."""
    if not poster_path:
        return None
    return f"{TMDB_IMAGE_BASE}{poster_path}"


async def get_movie_genres() -> List[Dict[str, str]]:
    """
    TMDB에서 영화 장르 목록을 가져옵니다.
    첫 호출 이후 메모리에 캐시합니다.

    반환 형태 (GenreGrid와 동일한 포맷):
    [{"id": "28", "name": "Action"}, {"id": "12", "name": "Adventure"}, ...]
    """
    global _cached_genres
    if _cached_genres:
        return _cached_genres

    if not settings.TMDB_READ_ACCESS_TOKEN and not settings.TMDB_API_KEY:
        logger.error("TMDB 인증 정보가 설정되지 않았습니다. (TMDB_READ_ACCESS_TOKEN 또는 TMDB_API_KEY 필요)")
        return []

    params = {"language": "en-US"}
    # API Key 방식 폴백
    if not settings.TMDB_READ_ACCESS_TOKEN and settings.TMDB_API_KEY:
        params["api_key"] = settings.TMDB_API_KEY

    data = await api_request(
        f"{TMDB_BASE_URL}/genre/movie/list",
        params=params,
        headers=_get_auth_headers(),
    )

    if not data or "genres" not in data:
        logger.warning("TMDB 장르 목록을 가져오지 못했습니다.")
        return []

    # GenreGrid/Digging 페이지가 기대하는 {"id": str, "name": str} 형태로 변환
    # TMDB는 id를 정수로 반환하므로 문자열로 변환
    _cached_genres = [
        {"id": str(genre["id"]), "name": genre["name"]}
        for genre in data["genres"]
    ]

    logger.info("TMDB 영화 장르 %d개 캐시 완료", len(_cached_genres))
    return _cached_genres


async def get_movies_by_genre(
    genre_id: str,
    page: int = 1,
    limit: int = 20,
) -> List[Dict[str, Any]]:
    """
    TMDB discover API로 특정 장르의 영화 목록을 가져옵니다.

    Args:
        genre_id: TMDB 장르 ID (문자열, 예: "28" for Action)
        page: 페이지 번호 (1부터 시작)
        limit: 한 페이지당 결과 수 (TMDB 최대 20개)

    반환 형태 (프론트 RecommendationCards가 기대하는 포맷):
    [{
        "id": 550,
        "title": "Fight Club",
        "poster_path": "https://image.tmdb.org/t/p/w500/...",
        "overview": "...",
        "release_date": "1999-10-15",
        "vote_average": 8.4,
        "genre_ids": [18, 53]
    }, ...]
    """
    if not settings.TMDB_READ_ACCESS_TOKEN and not settings.TMDB_API_KEY:
        logger.error("TMDB 인증 정보가 없습니다.")
        return []

    params = {
        "with_genres": genre_id,
        "page": page,
        "language": "en-US",
        "sort_by": "popularity.desc",   # 인기순 정렬
        "include_adult": "false",        # 성인 콘텐츠 제외
    }
    if not settings.TMDB_READ_ACCESS_TOKEN and settings.TMDB_API_KEY:
        params["api_key"] = settings.TMDB_API_KEY

    data = await api_request(
        f"{TMDB_BASE_URL}/discover/movie",
        params=params,
        headers=_get_auth_headers(),
    )

    if not data or "results" not in data:
        logger.warning("TMDB 영화 목록을 가져오지 못했습니다. genre_id=%s page=%d", genre_id, page)
        return []

    # poster_path를 완전한 URL로 변환하여 반환
    movies = []
    for movie in data["results"][:limit]:
        movies.append({
            "id": movie.get("id"),
            "title": movie.get("title", "Unknown Title"),
            "poster_path": _build_poster_url(movie.get("poster_path")),
            "overview": movie.get("overview", ""),
            "release_date": movie.get("release_date", ""),
            "vote_average": movie.get("vote_average", 0.0),
            "genre_ids": movie.get("genre_ids", []),
        })

    logger.info(
        "TMDB genre_id=%s page=%d → %d편 반환",
        genre_id, page, len(movies)
    )
    return movies


async def get_movie_detail(movie_id: int) -> Optional[Dict[str, Any]]:
    """
    TMDB에서 단일 영화의 상세 정보를 가져옵니다.
    크레딧(출연진)과 영상(트레일러) 정보를 함께 요청합니다.

    Args:
        movie_id: TMDB 영화 ID (정수)
    """
    if not settings.TMDB_READ_ACCESS_TOKEN and not settings.TMDB_API_KEY:
        logger.error("TMDB 인증 정보가 없습니다.")
        return None

    params = {
        "language": "en-US",
        "append_to_response": "credits,videos",  # 출연진 + 트레일러 함께 조회
    }
    if not settings.TMDB_READ_ACCESS_TOKEN and settings.TMDB_API_KEY:
        params["api_key"] = settings.TMDB_API_KEY

    data = await api_request(
        f"{TMDB_BASE_URL}/movie/{movie_id}",
        params=params,
        headers=_get_auth_headers(),
    )

    if not data:
        logger.warning("TMDB 영화 상세 조회 실패. movie_id=%d", movie_id)
        return None

    # poster_path URL 변환
    data["poster_path"] = _build_poster_url(data.get("poster_path"))

    return data

async def get_trending_movies(page: int = 1, limit: int = 20) -> List[Dict[str, Any]]:
    """TMDB trending movies (week)."""
    if not settings.TMDB_READ_ACCESS_TOKEN and not settings.TMDB_API_KEY:
        logger.error("TMDB 인증 정보가 없습니다.")
        return []

    params = {"language": "en-US", "page": page}
    if not settings.TMDB_READ_ACCESS_TOKEN and settings.TMDB_API_KEY:
        params["api_key"] = settings.TMDB_API_KEY

    data = await api_request(
        f"{TMDB_BASE_URL}/trending/movie/week",
        params=params,
        headers=_get_auth_headers(),
    )

    if not data or "results" not in data:
        return []

    movies = []
    for movie in data.get("results", []):
        if movie.get("adult") is True:
            continue
        movies.append({
            "id": movie.get("id"),
            "title": movie.get("title", "Unknown Title"),
            "poster_path": _build_poster_url(movie.get("poster_path")),
            "overview": movie.get("overview", ""),
            "release_date": movie.get("release_date", ""),
            "vote_average": movie.get("vote_average", 0.0),
            "genre_ids": movie.get("genre_ids", []),
        })
        if len(movies) >= limit:
            break
    return movies


async def get_top_rated_movies(page: int = 1, limit: int = 20) -> List[Dict[str, Any]]:
    """TMDB top rated movies."""
    if not settings.TMDB_READ_ACCESS_TOKEN and not settings.TMDB_API_KEY:
        logger.error("TMDB 인증 정보가 없습니다.")
        return []

    params = {"language": "en-US", "page": page}
    if not settings.TMDB_READ_ACCESS_TOKEN and settings.TMDB_API_KEY:
        params["api_key"] = settings.TMDB_API_KEY

    data = await api_request(
        f"{TMDB_BASE_URL}/movie/top_rated",
        params=params,
        headers=_get_auth_headers(),
    )

    if not data or "results" not in data:
        return []

    movies = []
    for movie in data["results"][:limit]:
        movies.append({
            "id": movie.get("id"),
            "title": movie.get("title", "Unknown Title"),
            "poster_path": _build_poster_url(movie.get("poster_path")),
            "overview": movie.get("overview", ""),
            "release_date": movie.get("release_date", ""),
            "vote_average": movie.get("vote_average", 0.0),
            "genre_ids": movie.get("genre_ids", []),
        })
    return movies

async def get_movie_trailer(movie_id: int) -> Optional[str]:
    """TMDB에서 특정 영화의 가장 인기있는 YouTube 트레일러 키를 가져옵니다."""
    if not settings.TMDB_READ_ACCESS_TOKEN and not settings.TMDB_API_KEY:
        logger.error("TMDB 인증 정보가 없습니다.")
        return None

    params = {"language": "en-US"}
    if not settings.TMDB_READ_ACCESS_TOKEN and settings.TMDB_API_KEY:
        params["api_key"] = settings.TMDB_API_KEY

    data = await api_request(
        f"{TMDB_BASE_URL}/movie/{movie_id}/videos",
        params=params,
        headers=_get_auth_headers(),
    )

    if not data or "results" not in data:
        return None

    # Filter for YouTube videos
    youtube_videos = [v for v in data["results"] if v.get("site") == "YouTube"]
    
    if not youtube_videos:
        return None
        
    # Prefer 'Trailer', then 'Teaser', then anything else
    trailers = [v for v in youtube_videos if v.get("type") == "Trailer"]
    teasers = [v for v in youtube_videos if v.get("type") == "Teaser"]
    
    best_videos = trailers if trailers else (teasers if teasers else youtube_videos)
    
    # Get the official one or the first one
    official = [t for t in best_videos if t.get("official")]
    selected = official[0] if official else best_videos[0]
    return selected.get("key")


async def search_movies(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    TMDB /search/movie 를 사용해 영화를 검색합니다.

    Args:
        query: 검색어 (영화 제목)
        limit: 반환할 최대 결과 수

    Returns:
        통합 검색 응답 포맷에 맞는 결과 리스트
    """
    if not settings.TMDB_READ_ACCESS_TOKEN and not settings.TMDB_API_KEY:
        logger.error("TMDB 인증 정보가 없습니다.")
        return []

    params = {
        "query": query,
        "language": "en-US",
        "page": 1,
        "include_adult": "false",
    }
    if not settings.TMDB_READ_ACCESS_TOKEN and settings.TMDB_API_KEY:
        params["api_key"] = settings.TMDB_API_KEY

    data = await api_request(
        f"{TMDB_BASE_URL}/search/movie",
        params=params,
        headers=_get_auth_headers(),
    )

    if not data or "results" not in data:
        logger.warning("TMDB 영화 검색 결과 없음. query=%s", query)
        return []

    results = []
    for movie in data["results"][:limit]:
        release_year = None
        release_date = movie.get("release_date", "")
        if release_date and len(release_date) >= 4:
            release_year = int(release_date[:4])

        # 감독 정보는 search 결과에 없으므로 overview 일부를 subtitle로 활용
        overview = movie.get("overview", "")
        subtitle = overview[:80] + "..." if len(overview) > 80 else overview

        results.append({
            "external_id": str(movie.get("id", "")),
            "external_source": "tmdb",
            "item_type": "movie",
            "title": movie.get("title", "Unknown Title"),
            "subtitle": subtitle,
            "cover_image_url": _build_poster_url(movie.get("poster_path")),
            "preview_url": None,
            "release_year": release_year,
            "metadata": {
                "tmdb_id": movie.get("id"),
                "overview": movie.get("overview", ""),
                "release_date": release_date,
                "vote_average": movie.get("vote_average", 0.0),
                "genre_ids": movie.get("genre_ids", []),
                "popularity": movie.get("popularity", 0.0),
            },
        })

    logger.info("TMDB 검색 query='%s' → %d편 반환", query, len(results))
    return results

async def get_trending_persons(page: int = 1, limit: int = 20) -> List[Dict[str, Any]]:
    """TMDB trending persons (week)."""
    if not settings.TMDB_READ_ACCESS_TOKEN and not settings.TMDB_API_KEY:
        logger.error("TMDB 인증 정보가 없습니다.")
        return []

    params = {"language": "en-US", "page": page}
    if not settings.TMDB_READ_ACCESS_TOKEN and settings.TMDB_API_KEY:
        params["api_key"] = settings.TMDB_API_KEY

    data = await api_request(
        f"{TMDB_BASE_URL}/trending/person/week",
        params=params,
        headers=_get_auth_headers(),
    )

    if not data or "results" not in data:
        return []

    persons = []
    for person in data.get("results", []):
        if person.get("adult") is True:
            continue

        # 대표작(known_for)에서 제목 추출
        known_for = person.get("known_for", [])
        titles = [work.get("title") or work.get("name") for work in known_for if work.get("title") or work.get("name")]
        subtitle = person.get("known_for_department", "Acting")
        if titles:
            subtitle += f" • {', '.join(titles[:3])}"

        persons.append({
            "id": str(person.get("id", "")),
            "external_id": str(person.get("id", "")),
            "external_source": "tmdb",
            "item_type": "movie",
            "itemType": "movie",  # 정규화: movie_person → movie
            "title": person.get("name", "Unknown Person"),
            "subtitle": subtitle,
            "cover_image_url": _build_poster_url(person.get("profile_path")),
            "image_url": _build_poster_url(person.get("profile_path")),
            "preview_url": None,
            "release_year": None,
            "metadata": {
                "tmdb_id": person.get("id"),
                "department": person.get("known_for_department"),
                "popularity": person.get("popularity", 0.0),
                "role": "person",  # 정규화: movie_person → movie, role 보존
            },
            "type": "Person"
        })
        if len(persons) >= limit:
            break
    return persons


async def search_person(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    TMDB /search/person 을 사용해 영화인(배우, 감독 등)을 검색합니다.
    """
    if not settings.TMDB_READ_ACCESS_TOKEN and not settings.TMDB_API_KEY:
        logger.error("TMDB 인증 정보가 없습니다.")
        return []

    params = {
        "query": query,
        "language": "en-US",
        "page": 1,
        "include_adult": "false",
    }
    if not settings.TMDB_READ_ACCESS_TOKEN and settings.TMDB_API_KEY:
        params["api_key"] = settings.TMDB_API_KEY

    data = await api_request(
        f"{TMDB_BASE_URL}/search/person",
        params=params,
        headers=_get_auth_headers(),
    )

    if not data or "results" not in data:
        logger.warning("TMDB 인물 검색 결과 없음. query=%s", query)
        return []

    results = []
    for person in data["results"][:limit]:
        # 대표작(known_for)에서 제목 추출
        known_for = person.get("known_for", [])
        titles = [work.get("title") or work.get("name") for work in known_for if work.get("title") or work.get("name")]
        subtitle = person.get("known_for_department", "Acting")
        if titles:
            subtitle += f" • {', '.join(titles[:3])}"

        results.append({
            "external_id": str(person.get("id", "")),
            "external_source": "tmdb",
            "item_type": "movie",
            "title": person.get("name", "Unknown Person"),
            "subtitle": subtitle,
            "cover_image_url": _build_poster_url(person.get("profile_path")),
            "preview_url": None,
            "release_year": None,
            "metadata": {
                "tmdb_id": person.get("id"),
                "department": person.get("known_for_department"),
                "popularity": person.get("popularity", 0.0),
                "role": "person",  # 정규화: movie_person → movie, role 보존
            },
        })

    logger.info("TMDB 인물 검색 query='%s' → %d명 반환", query, len(results))
    return results

async def get_person_detail(person_id: int) -> Optional[Dict[str, Any]]:
    """
    TMDB에서 인물 상세 정보(약력, 생일 등) 및 참여 작품(movie_credits)을 가져옵니다.
    """
    if not settings.TMDB_READ_ACCESS_TOKEN and not settings.TMDB_API_KEY:
        logger.error("TMDB 인증 정보가 없습니다.")
        return None

    params = {
        "language": "en-US",
        "append_to_response": "movie_credits",  # 출연진/제작진 영화 목록 추가
    }
    if not settings.TMDB_READ_ACCESS_TOKEN and settings.TMDB_API_KEY:
        params["api_key"] = settings.TMDB_API_KEY

    data = await api_request(
        f"{TMDB_BASE_URL}/person/{person_id}",
        params=params,
        headers=_get_auth_headers(),
    )

    if not data:
        logger.warning("TMDB 인물 상세 조회 실패. person_id=%d", person_id)
        return None

    data["profile_path"] = _build_poster_url(data.get("profile_path"))
    
    # 크레딧 이미지 처리
    if "movie_credits" in data:
        for cast in data["movie_credits"].get("cast", []):
            cast["poster_path"] = _build_poster_url(cast.get("poster_path"))
        for crew in data["movie_credits"].get("crew", []):
            crew["poster_path"] = _build_poster_url(crew.get("poster_path"))

    return data

