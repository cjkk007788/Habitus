from fastapi import APIRouter, Query
from typing import List, Dict, Any
from cachetools import TTLCache
import logging

from app.services import wikidata

logger = logging.getLogger(__name__)
router = APIRouter()

# 24-hour cache for person searches to avoid rate limits and reduce latency
search_cache = TTLCache(maxsize=1000, ttl=86400)

@router.get("/search")
async def search_person(
    q: str = Query(..., description="검색할 인물 이름 (예: 크리스토퍼 놀란)"),
    category: str = Query(None, description="카테고리 필터 (선택 사항)")
) -> List[Dict[str, Any]]:
    """
    Wikidata를 이용하여 인물을 검색하고 공식 영문 이름과 직업 설명을 반환합니다.
    검색 결과는 24시간 동안 메모리에 캐시됩니다.
    """
    query = q.strip()
    if not query:
        return []

    cache_key = f"{query}_{category}"
    if cache_key in search_cache:
        logger.info(f"Cache hit for person search: {query}")
        return search_cache[cache_key]

    logger.info(f"Fetching Wikidata for person search: {query}")
    results = await wikidata.search_entities(query=query, limit=7)
    
    # Store in cache
    search_cache[cache_key] = results
    
    return results
