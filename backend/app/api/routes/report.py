from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import Optional, List, Dict, Any
from collections import Counter

from app.core.database import get_db
from app.models.archive import Item, User

import uuid

router = APIRouter()

@router.get("/taste-analysis")
async def get_taste_analysis(
    user_id: Optional[str] = Query(None, description="조회할 유저 ID. 없으면 첫 번째 유저 사용"),
    db: Session = Depends(get_db)
):
    """
    유저의 아카이브 아이템을 모두 조회하여 가장 좋아하는 아티스트와 장르를 집계합니다.
    """
    # 1. 유저 확인
    if not user_id:
        user = db.query(User).first()
        if not user:
            raise HTTPException(status_code=404, detail="시스템에 유저가 존재하지 않습니다.")
        uid = user.id
    else:
        try:
            uid = uuid.UUID(user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="유효하지 않은 유저 ID 포맷입니다.")
    
    # 2. 아이템 조회 (모든 아이템)
    items = db.query(Item).filter(Item.user_id == uid).all()
    
    if not items:
        return {
            "topArtists": [],
            "topGenres": []
        }
        
    artist_counter = Counter()
    genre_counter = Counter()
    
    for item in items:
        # Tally Artists
        # media_meta가 list인 경우 처리(오류 방지)
        media_meta = item.media_meta if isinstance(item.media_meta, dict) else {}
        user_meta = item.user_meta if isinstance(item.user_meta, dict) else {}
        
        contributors = media_meta.get("contributors", [])
        if isinstance(contributors, list) and contributors:
            for c in contributors:
                role = str(c.get("role", "")).lower()
                name = c.get("name", "")
                if name and (role == "artist" or role == "director" or role == "author"):
                    artist_counter[name] += 1
        elif item.item_type == "music" and getattr(item, "subtitle", None):
            # contributors 배열이 없고 music 타입이면 subtitle(보통 아티스트명)을 사용
            artist_counter[item.subtitle] += 1
            
        # Tally Genres
        genre_val = media_meta.get("genre")
        if genre_val:
            genre_counter[genre_val] += 1
            
        genres_val = media_meta.get("genres", [])
        if isinstance(genres_val, list):
            for g in genres_val:
                genre_counter[g] += 1
            
        genre_tags = user_meta.get("genreTags", [])
        if isinstance(genre_tags, list):
            for g in genre_tags:
                genre_counter[g] += 1
                
        # item.genres
        item_genres = item.genres if isinstance(item.genres, list) else []
        for g in item_genres:
            genre_counter[g] += 1
            
    top_artists = artist_counter.most_common(5)
    top_genres = genre_counter.most_common(5)
    
    return {
        "topArtists": top_artists,
        "topGenres": top_genres
    }
