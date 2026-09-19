from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.models.catalog import CatalogEntry
from app.api.routes.report import get_taste_analysis

router = APIRouter()

@router.get("/recommendations")
async def get_recommendations(
    user_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None, description="music, movie, book 등으로 필터링"),
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    유저의 취향 분석(taste-analysis) 결과를 바탕으로
    CatalogEntry(외부 API 캐시)에서 겹치는 장르/아티스트가 많은 아이템을 추천합니다.
    """
    # 1. 기존 취향 분석 재사용
    taste = await get_taste_analysis(user_id=user_id, db=db)
    top_genres = {g["name"]: g["count"] for g in taste["topGenres"]}
    top_artists = {a["name"]: a["count"] for a in taste["topArtists"]}

    if not top_genres and not top_artists:
        return []

    # 2. 후보군 조회
    query = db.query(CatalogEntry)
    if category:
        query = query.filter(CatalogEntry.category == category)
    candidates = query.all()

    # 3. 겹침 기반 스코어링
    scored = []
    for c in candidates:
        meta = c.meta_data or {}
        score = 0.0
        
        genres = meta.get("genres", [])
        if isinstance(genres, list):
            for g in genres:
                score += top_genres.get(g, 0)
        
        artist = meta.get("artist") or meta.get("author") or meta.get("director")
        if artist and artist in top_artists:
            # 아티스트 일치는 장르보다 강한 신호로 가중치 부여
            score += top_artists[artist] * 2

        if score > 0:
            scored.append((score, c))
            
    scored.sort(key=lambda x: x[0], reverse=True)
    
    return [
        {
            "id": str(c.id),
            "title": c.title,
            "category": c.category,
            "cover_image_url": c.cover_image_url,
            "score": round(score, 2)
        }
        for score, c in scored[:limit]
    ]

from app.api.dependencies import get_current_user
from app.models.archive import User

@router.get("/dynamic-curation")
async def get_dynamic_curation(
    user_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """유저의 취향 데이터를 분석하여 동적 큐레이션(추천) 행 정의를 반환"""
    taste = await get_taste_analysis(user_id=user_id, db=db)
    
    top_genres = taste.get("topGenres", [])
    top_artists = taste.get("topArtists", [])
    
    if category:
        top_genres = [g for g in top_genres if g.get("type") == category]
        top_artists = [a for a in top_artists if a.get("type") == category]
    
    curations = []
    
    # 1. Taste DNA Match (커뮤니티 임베딩 기반 매칭)
    curations.append({
        "id": "taste_dna",
        "title": "🧬 Curations Matching Your Taste DNA",
        "type": "community_embedding",
        "target": "taste_dna"
    })
    
    # 2. Artist Lineage / Person
    if top_artists:
        best_artist = top_artists[0]["name"]
        if category == 'music':
            curations.append({
                "id": f"artist_{best_artist}",
                "title": f"🎤 Because you like {best_artist}",
                "type": "similar_artist",
                "target": best_artist
            })
        elif category == 'movie':
            curations.append({
                "id": f"person_{best_artist}",
                "title": f"🎬 Because you like {best_artist}",
                "type": "person",
                "target": best_artist
            })
        
    # 3. Genre Deep Dive
    if top_genres:
        best_genre = top_genres[0]["name"]
        curations.append({
            "id": f"genre_{best_genre}",
            "title": f"🎧 Deep Dive into {best_genre}",
            "type": "genre",
            "target": best_genre
        })
        
    # 4. Trending Default
    if category == 'music':
        curations.append({
            "id": "top_tracks",
            "title": "🔥 Trending Now",
            "type": "trending",
            "target": "music"
        })
    else:
        curations.append({
            "id": "trending",
            "title": "🔥 Trending Now",
            "type": "trending",
            "target": category or "all"
        })
    
    return curations
