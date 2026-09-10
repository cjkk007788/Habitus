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
    
    # 2. 아이템 조회 (모든 아이템) -> ORM 객체 전체 대신 필요한 컬럼만 추출하여 메모리 최적화
    items = db.query(
        Item.id,
        Item.media_meta,
        Item.user_meta,
        Item.item_type,
        Item.title,
        Item.genres
    ).filter(Item.user_id == uid).all()
    
    if not items:
        return {
            "topArtists": [],
            "topGenres": []
        }
        
    artist_stats = {}
    genre_stats = {}
    
    def add_artist(name, item_type, item_id):
        if not name: return
        if name not in artist_stats:
            artist_stats[name] = {"count": 0, "types": Counter(), "items": []}
        artist_stats[name]["count"] += 1
        artist_stats[name]["types"][item_type] += 1
        artist_stats[name]["items"].append(str(item_id))

    def add_genre(name, item_type, item_id):
        if not name: return
        if name not in genre_stats:
            genre_stats[name] = {"count": 0, "types": Counter(), "items": []}
        genre_stats[name]["count"] += 1
        genre_stats[name]["types"][item_type] += 1
        genre_stats[name]["items"].append(str(item_id))
    
    for item in items:
        # Tally Artists
        media_meta = item.media_meta if isinstance(item.media_meta, dict) else {}
        user_meta = item.user_meta if isinstance(item.user_meta, dict) else {}
        raw = media_meta.get("rawFrontendData", {}) if isinstance(media_meta.get("rawFrontendData"), dict) else {}
        
        # 수집된 아티스트명 중복 방지용 Set
        found_artists = set()

        # 1) contributors 배열에서 집계 (role이 없어도 name이 있으면 카운팅)
        contributors = media_meta.get("contributors", [])
        if isinstance(contributors, list) and contributors:
            for c in contributors:
                role = str(c.get("role", "")).lower()
                name = str(c.get("name", "")).strip()
                if name:
                    # 프론트엔드 어댑터에서 subtitle을 무조건 contributors[{name}]에 넣는 동작으로 인해
                    # 국가코드(KR), 긴 설명문(overview) 등이 아티스트로 잘못 집계되는 현상 방지
                    if not role:
                        if len(name) > 40 or "..." in name or " · " in name or name in ("KR", "US", "UK", "JP", "Group", "Person"):
                            continue
                        if item.item_type in ("music_artist", "movie_person"):
                            continue
                            
                    if not role or role in ("artist", "director", "author", "composer", "performer", "actor"):
                        found_artists.add(name)

        # 2) media_meta.artists 배열에서 집계
        artists_list = media_meta.get("artists", [])
        if isinstance(artists_list, list):
            for a in artists_list:
                if isinstance(a, str) and a:
                    found_artists.add(a)
                elif isinstance(a, dict) and a.get("name"):
                    found_artists.add(a["name"])

        # 3) rawFrontendData.artists에서 집계
        raw_artists = raw.get("artists", [])
        if isinstance(raw_artists, list):
            for a in raw_artists:
                if isinstance(a, str) and a:
                    found_artists.add(a)

        # 4) contributors가 없고 music 타입이면 subtitle 사용
        if not contributors and item.item_type == "music" and getattr(item, "subtitle", None):
            found_artists.add(item.subtitle)
            
        # 5) movie_person 타입이면 아이템 자체가 아티스트임
        if item.item_type == "movie_person" and item.title:
            found_artists.add(item.title)
            
        # 6) music_artist 타입이면 아이템 자체가 아티스트임
        if item.item_type == "music_artist" and item.title:
            found_artists.add(item.title)
            
        # 중복 제거된 아티스트들을 한 번씩만 카운트
        for artist_name in found_artists:
            add_artist(artist_name, item.item_type, item.id)

            
        # Tally Genres
        if item.item_type in ["music", "movie", "book"]:
            genre_val = media_meta.get("genre")
            if genre_val and isinstance(genre_val, str):
                add_genre(genre_val, item.item_type, item.id)
                
            genres_val = media_meta.get("genres", [])
            if isinstance(genres_val, list):
                for g in genres_val:
                    if g:
                        add_genre(str(g), item.item_type, item.id)
                
            genre_tags = user_meta.get("genreTags", []) or user_meta.get("genre_tags", [])
            if isinstance(genre_tags, list):
                for g in genre_tags:
                    if g:
                        add_genre(str(g), item.item_type, item.id)
            
            # DB 컬럼 genres 에서도 집계 추가
            item_genres = getattr(item, "genres", [])
            item_genres = item_genres if isinstance(item_genres, list) else []
            for g in item_genres:
                if g:
                    add_genre(str(g), item.item_type, item.id)
                        
    # Sort and Format
    sorted_artists = sorted(artist_stats.items(), key=lambda x: x[1]["count"], reverse=True)
    top_artists = [
        {
            "name": name, 
            "count": stats["count"], 
            "type": stats["types"].most_common(1)[0][0] if stats["types"] else "unknown",
            "items": list(set(stats["items"]))
        }
        for name, stats in sorted_artists[:20]
    ]
    
    sorted_genres = sorted(genre_stats.items(), key=lambda x: x[1]["count"], reverse=True)
    top_genres = [
        {
            "name": name, 
            "count": stats["count"], 
            "type": stats["types"].most_common(1)[0][0] if stats["types"] else "unknown",
            "items": list(set(stats["items"]))
        }
        for name, stats in sorted_genres[:20]
    ]
    
    return {
        "topArtists": top_artists,
        "topGenres": top_genres
    }
