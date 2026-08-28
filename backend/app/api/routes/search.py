from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict, Any
import asyncio
import logging

from app.services import musicbrainz, lastfm, itunes, lyrics, tmdb, google_books

logger = logging.getLogger(__name__)
router = APIRouter()


# ─────────────────────────────────────────────
# 내부 헬퍼: 각 카테고리별 검색 → 통합 포맷 변환
# ─────────────────────────────────────────────

async def _search_music(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    MusicBrainz에서 아티스트 + 트랙을 동시에 검색하고
    통합 포맷으로 변환합니다.
    iTunes에서 아트워크/미리듣기 URL을 best-effort로 보강합니다.
    """
    artist_task = musicbrainz.search_artist(query)
    recording_task = musicbrainz.search_recording(query)

    artist_data, recording_data = await asyncio.gather(
        artist_task, recording_task, return_exceptions=True
    )

    results: List[Dict[str, Any]] = []

    # 아티스트 결과
    if isinstance(artist_data, dict) and "artists" in artist_data:
        for artist in artist_data["artists"][:limit // 2]:
            # iTunes에서 아티스트 이미지 시도
            cover_url = None
            try:
                cover_url = await itunes.get_artist_image_url(artist.get("name", ""))
            except Exception:
                pass

            results.append({
                "external_id": artist.get("id", ""),
                "external_source": "musicbrainz",
                "item_type": "music_artist",
                "title": artist.get("name", "Unknown Artist"),
                "subtitle": artist.get("type", "") + (" · " + artist.get("country", "") if artist.get("country") else ""),
                "cover_image_url": cover_url,
                "preview_url": None,
                "release_year": None,
                "metadata": {
                    "mbid": artist.get("id"),
                    "type": artist.get("type"),
                    "country": artist.get("country"),
                    "tags": [t["name"] for t in artist.get("tags", [])[:5]] if artist.get("tags") else [],
                },
            })

    # 트랙 결과
    if isinstance(recording_data, dict) and "recordings" in recording_data:
        for rec in recording_data["recordings"][:limit // 2]:
            artist_name = "Unknown Artist"
            artist_credits = rec.get("artist-credit", [])
            if artist_credits:
                artist_name = artist_credits[0].get("name", "Unknown Artist")

            # iTunes에서 트랙 아트워크 + 미리듣기 보강
            cover_url = None
            preview_url = None
            try:
                itunes_data = await itunes.search_track(artist=artist_name, track=rec.get("title", ""))
                if itunes_data:
                    cover_url = itunes_data.get("artwork_url")
                    if cover_url:
                        cover_url = cover_url.replace("100x100bb", "300x300bb")
                    preview_url = itunes_data.get("preview_url")
            except Exception:
                pass

            # 릴리즈 연도 추출
            release_year = None
            releases = rec.get("releases", [])
            if releases:
                date = releases[0].get("date", "")
                if date and len(date) >= 4:
                    try:
                        release_year = int(date[:4])
                    except ValueError:
                        pass

            results.append({
                "external_id": rec.get("id", ""),
                "external_source": "musicbrainz",
                "item_type": "music",          # RightSidebar isMusic = music | music_artist
                "title": rec.get("title", "Unknown Track"),
                "subtitle": artist_name,
                "cover_image_url": cover_url,
                "preview_url": preview_url,
                "release_year": release_year,
                "metadata": {
                    "mbid": rec.get("id"),
                    "artist": artist_name,
                    "releases": [r.get("title", "") for r in releases[:3]],
                    "duration_ms": rec.get("length"),
                },
            })

    return results


async def _search_movie(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """TMDB에서 영화와 영화인(감독/배우)을 동시에 검색합니다."""
    movie_task = tmdb.search_movies(query, limit=limit)
    person_task = tmdb.search_person(query, limit=limit)

    movie_results, person_results = await asyncio.gather(
        movie_task, person_task, return_exceptions=True
    )

    results = []
    # 영화인 결과를 상단에 배치
    if isinstance(person_results, list):
        results.extend(person_results)
    if isinstance(movie_results, list):
        results.extend(movie_results)

    return results[:limit]


async def _search_book(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Google Books에서 도서를 검색합니다."""
    try:
        return await google_books.search_books(query, limit=limit)
    except Exception as e:
        logger.error("Google Books 검색 오류: %s", e)
        return []


# ─────────────────────────────────────────────
# 엔드포인트
# ─────────────────────────────────────────────

@router.get("")
async def unified_search(
    q: str = Query(..., min_length=1, description="검색어"),
    type: str = Query("music", description="검색 카테고리: music | movie | book | all"),
    limit: int = Query(10, ge=1, le=30, description="결과 수"),
):
    """
    통합 검색 엔드포인트.

    - **music**: MusicBrainz 아티스트 + 트랙 동시 검색 (iTunes 보강)
    - **movie**: TMDB 영화 검색
    - **book**: Google Books 검색
    - **all**: music + movie + book 병렬 검색 후 합산
    """
    if type == "music":
        results = await _search_music(q, limit=limit)

    elif type == "movie":
        results = await _search_movie(q, limit=limit)

    elif type == "book":
        results = await _search_book(q, limit=limit)

    elif type == "all":
        music_results, movie_results, book_results = await asyncio.gather(
            _search_music(q, limit=limit // 3 + 1),
            _search_movie(q, limit=limit // 3 + 1),
            _search_book(q, limit=limit // 3 + 1),
            return_exceptions=True,
        )
        results = []
        for r in [music_results, movie_results, book_results]:
            if isinstance(r, list):
                results.extend(r)

    else:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 type입니다: {type}. music | movie | book | all 중 선택하세요."
        )

    return {
        "query": q,
        "type": type,
        "count": len(results),
        "results": results,
    }


# ─────────────────────────────────────────────
# 상세 정보 엔드포인트 (기존 유지)
# ─────────────────────────────────────────────

@router.get("/details")
async def get_details(
    mbid: str = Query(..., description="MusicBrainz ID"),
    category: str = Query(..., description="카테고리 (music_artist, music_track)"),
    title: Optional[str] = Query(None, description="곡 제목 (track 검색시 필요)"),
    artist: Optional[str] = Query(None, description="아티스트 이름 (track 검색시 필요)"),
):
    """
    MBID를 기반으로 여러 외부 API를 병렬로 호출하여 상세 데이터를 수집합니다.
    """
    meta_data = {}

    if category == "music_artist":
        tasks = [
            musicbrainz.get_artist_by_mbid(mbid),
            lastfm.get_artist_info(artist_name=artist or title or "", mbid=mbid)
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        meta_data["musicbrainz"] = results[0] if not isinstance(results[0], Exception) else None
        meta_data["lastfm"] = results[1] if not isinstance(results[1], Exception) else None
        meta_data["type"] = "music_artist"

    elif category == "music_track":
        if not title or not artist:
            raise HTTPException(status_code=400, detail="title and artist are required for music_track")
        tasks = [
            musicbrainz.get_recording_by_mbid(mbid),
            lastfm.get_track_info(artist_name=artist, track_name=title, mbid=mbid),
            itunes.search_track(artist=artist, track=title),
            lyrics.get_lyrics(artist=artist, title=title)
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        meta_data["musicbrainz"] = results[0] if not isinstance(results[0], Exception) else None
        meta_data["lastfm"] = results[1] if not isinstance(results[1], Exception) else None
        meta_data["itunes"] = results[2] if not isinstance(results[2], Exception) else None
        meta_data["lyrics"] = results[3] if not isinstance(results[3], Exception) else None
        meta_data["type"] = "music_track"

    elif category == "movie_person":
        try:
            person_detail = await tmdb.get_person_detail(int(mbid))
            meta_data["tmdb"] = person_detail
            meta_data["type"] = "movie_person"
        except Exception as e:
            logger.error(f"TMDB person detail error: {e}")
            meta_data["tmdb"] = None
            meta_data["type"] = "movie_person"

    else:
        raise HTTPException(status_code=400, detail="Unsupported category")

    return {"cached": False, "data": meta_data}
