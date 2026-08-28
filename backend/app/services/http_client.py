"""
공용 HTTP 클라이언트 모듈.

모든 외부 API 서비스(MusicBrainz, Last.fm, iTunes, Discogs, Lyrics)가
공유하는 HTTP 요청 로직을 한 곳에 모아 중복을 제거합니다.

- MusicBrainz 전용: 1초당 1회 속도 제한(Rate Limit) 적용
- 범용: timeout, try-except 에러 방어 통일
"""

import httpx
import asyncio
import time
import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)

# ── 공용 설정 ──────────────────────────────────────────────
DEFAULT_TIMEOUT = 30.0

# 주의: MusicBrainz는 가짜 이메일(.local 등)을 사용하면 IP를 차단합니다!
# 차단이 풀린 후 MusicBrainz를 캐싱용으로 다시 쓰려면 아래 이메일을 본인의 진짜 이메일로 변경해야 합니다.
APP_USER_AGENT = "HabitusMusicApp/1.0.0 (cjkk007788@naver.com)"

# ── MusicBrainz Rate Limiter (1 req/sec) ───────────────────
_last_mb_request_time = 0.0
_mb_lock: Optional[asyncio.Lock] = None


#-> type hint
async def _ensure_mb_lock() -> asyncio.Lock:
    """Lazy initialization으로 이벤트 루프 충돌을 방지합니다."""
    global _mb_lock
    if _mb_lock is None:
        _mb_lock = asyncio.Lock()
    return _mb_lock

# ── Last.fm Rate Limiter (5 req/sec -> 1 req / 0.2s) ───────────
_last_lastfm_request_time = 0.0
_lastfm_lock: Optional[asyncio.Lock] = None

async def _ensure_lastfm_lock() -> asyncio.Lock:
    global _lastfm_lock
    if _lastfm_lock is None:
        _lastfm_lock = asyncio.Lock()
    return _lastfm_lock

# ── Discogs Rate Limiter (60 req/min -> 1 req / 1.1s) ──────────
_last_discogs_request_time = 0.0
_discogs_lock: Optional[asyncio.Lock] = None

async def _ensure_discogs_lock() -> asyncio.Lock:
    global _discogs_lock
    if _discogs_lock is None:
        _discogs_lock = asyncio.Lock()
    return _discogs_lock

# ── Google Books Rate Limiter (e.g. 2 req/sec -> 0.5s) ──────────
_last_googlebooks_request_time = 0.0
_googlebooks_lock: Optional[asyncio.Lock] = None

async def _ensure_googlebooks_lock() -> asyncio.Lock:
    global _googlebooks_lock
    if _googlebooks_lock is None:
        _googlebooks_lock = asyncio.Lock()
    return _googlebooks_lock

# ── TMDB Rate Limiter (50 req/sec 허용 -> 안전하게 20 req/sec / 0.05s) ──────
_last_tmdb_request_time = 0.0
_tmdb_lock: Optional[asyncio.Lock] = None

async def _ensure_tmdb_lock() -> asyncio.Lock:
    global _tmdb_lock
    if _tmdb_lock is None:
        _tmdb_lock = asyncio.Lock()
    return _tmdb_lock

_shared_client: Optional[httpx.AsyncClient] = None

def _get_client() -> httpx.AsyncClient:
    global _shared_client
    if _shared_client is None or _shared_client.is_closed:
        _shared_client = httpx.AsyncClient(timeout=DEFAULT_TIMEOUT)
    return _shared_client


async def mb_request(
    path: str,
    params: Optional[dict] = None,
    headers: Optional[dict] = None,
) -> Optional[dict]:
    """
    MusicBrainz API 전용 GET 요청.
    - 1초당 1회 속도 제한 자동 적용
    - timeout, 에러 방어 내장
    - 200 OK 시 JSON dict 반환, 실패 시 None 반환
    """
    global _last_mb_request_time

    base_url = "https://musicbrainz.org/ws/2"
    default_headers = {"User-Agent": APP_USER_AGENT, "Accept": "application/json"}
    if headers:
        default_headers.update(headers)

    merged_params = {"fmt": "json"}
    if params:
        merged_params.update(params)

    lock = await _ensure_mb_lock()

    try:
        async with lock:
            now = time.time()
            elapsed = now - _last_mb_request_time
            if elapsed < 1.2:
                await asyncio.sleep(1.2 - elapsed)
            _last_mb_request_time = time.time()

            client = _get_client()
            response = await client.get(
                f"{base_url}{path}",
                params=merged_params,
                headers=default_headers,
                timeout=DEFAULT_TIMEOUT
            )

        if response.status_code == 200:
            return response.json()
        else:
            logger.warning("MusicBrainz %s responded %d", path, response.status_code)
            return None

    except httpx.TimeoutException:
        logger.error("MusicBrainz %s timed out after %ss", path, DEFAULT_TIMEOUT)
        return None
    except Exception as e:
        logger.error("MusicBrainz %s failed: %s", path, e, exc_info=True)
        return None


async def mb_request_text(
    path: str,
    params: Optional[dict] = None,
) -> Optional[str]:
    """
    MusicBrainz API 전용 GET 요청 (텍스트 응답용).
    - genre/all 등 text/plain 응답에 사용
    - 200 OK 시 텍스트 문자열 반환, 실패 시 None 반환
    """
    global _last_mb_request_time

    base_url = "https://musicbrainz.org/ws/2"
    headers = {"User-Agent": APP_USER_AGENT, "Accept": "text/plain"}
    merged_params = {"fmt": "txt"}
    if params:
        merged_params.update(params)

    lock = await _ensure_mb_lock()

    try:
        async with lock:
            now = time.time()
            elapsed = now - _last_mb_request_time
            if elapsed < 1.2:
                await asyncio.sleep(1.2 - elapsed)
            _last_mb_request_time = time.time()

            client = _get_client()
            response = await client.get(
                f"{base_url}{path}",
                params=merged_params,
                headers=headers,
                timeout=DEFAULT_TIMEOUT
            )

        if response.status_code == 200:
            return response.text
        else:
            logger.warning("MusicBrainz %s responded %d", path, response.status_code)
            return None

    except httpx.TimeoutException:
        logger.error("MusicBrainz %s text request timed out", path)
        return None
    except Exception as e:
        logger.error("MusicBrainz %s text request failed: %s", path, e, exc_info=True)
        return None


async def api_request(
    url: str,
    params: Optional[dict] = None,
    headers: Optional[dict] = None,
    timeout: float = DEFAULT_TIMEOUT,
) -> Optional[dict]:
    """
    범용 외부 API GET 요청 (Last.fm, iTunes, Discogs 등).
    - 속도 제한 없음 (특정 호스트 제외)
    - timeout, 에러 방어 내장
    - 200 OK 시 JSON dict 반환, 실패 시 None 반환
    """
    global _last_lastfm_request_time
    global _last_discogs_request_time
    global _last_googlebooks_request_time
    global _last_tmdb_request_time

    default_headers = {"User-Agent": APP_USER_AGENT}
    if headers:
        default_headers.update(headers)

    try:
        client = _get_client()
        if "audioscrobbler.com" in url:
            lock = await _ensure_lastfm_lock()
            async with lock:
                now = time.time()
                elapsed = now - _last_lastfm_request_time
                if elapsed < 0.2:
                    await asyncio.sleep(0.2 - elapsed)
                _last_lastfm_request_time = time.time()
                response = await client.get(url, params=params, headers=default_headers, timeout=timeout)
        elif "api.discogs.com" in url:
            lock = await _ensure_discogs_lock()
            async with lock:
                now = time.time()
                elapsed = now - _last_discogs_request_time
                if elapsed < 1.1:
                    await asyncio.sleep(1.1 - elapsed)
                _last_discogs_request_time = time.time()
                response = await client.get(url, params=params, headers=default_headers, timeout=timeout)
        elif "googleapis.com" in url:
            lock = await _ensure_googlebooks_lock()
            async with lock:
                now = time.time()
                elapsed = now - _last_googlebooks_request_time
                if elapsed < 0.5:
                    await asyncio.sleep(0.5 - elapsed)
                _last_googlebooks_request_time = time.time()
                response = await client.get(url, params=params, headers=default_headers, timeout=timeout)
        elif "api.themoviedb.org" in url:
            lock = await _ensure_tmdb_lock()
            async with lock:
                now = time.time()
                elapsed = now - _last_tmdb_request_time
                if elapsed < 0.05:
                    await asyncio.sleep(0.05 - elapsed)
                _last_tmdb_request_time = time.time()
                response = await client.get(url, params=params, headers=default_headers, timeout=timeout)
        else:
            response = await client.get(url, params=params, headers=default_headers, timeout=timeout)

        if response.status_code == 200:
            return response.json()
        else:
            logger.warning("API %s responded %d", url, response.status_code)
            return None

    except httpx.TimeoutException:
        logger.error("API %s timed out after %ss", url, timeout)
        return None
    except Exception as e:
        logger.error("API %s failed: %s", url, e, exc_info=True)
        return None


async def api_request_text(
    url: str,
    params: Optional[dict] = None,
    headers: Optional[dict] = None,
    timeout: float = DEFAULT_TIMEOUT,
) -> Optional[str]:
    """
    범용 외부 API GET 요청 (텍스트 응답용, Lyrics 등).
    - 200 OK 시 텍스트 문자열 반환, 실패 시 None 반환
    """
    global _last_lastfm_request_time
    global _last_discogs_request_time

    default_headers = {"User-Agent": APP_USER_AGENT}
    if headers:
        default_headers.update(headers)

    try:
        client = _get_client()
        if "audioscrobbler.com" in url:
            lock = await _ensure_lastfm_lock()
            async with lock:
                now = time.time()
                elapsed = now - _last_lastfm_request_time
                if elapsed < 0.2:
                    await asyncio.sleep(0.2 - elapsed)
                _last_lastfm_request_time = time.time()
                response = await client.get(url, params=params, headers=default_headers, timeout=timeout)
        elif "api.discogs.com" in url:
            lock = await _ensure_discogs_lock()
            async with lock:
                now = time.time()
                elapsed = now - _last_discogs_request_time
                if elapsed < 1.1:
                    await asyncio.sleep(1.1 - elapsed)
                _last_discogs_request_time = time.time()
                response = await client.get(url, params=params, headers=default_headers, timeout=timeout)
        else:
            response = await client.get(url, params=params, headers=default_headers, timeout=timeout)

        if response.status_code == 200:
            return response.text
        else:
            logger.warning("API %s responded %d", url, response.status_code)
            return None

    except httpx.TimeoutException:
        logger.error("API %s text request timed out after %ss", url, timeout)
        return None
    except Exception as e:
        logger.error("API %s text request failed: %s", url, e, exc_info=True)
        return None
