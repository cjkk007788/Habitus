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
    
    #아티스트 집계 하는 시간 복잡도가 (O(N^2))일 거 같은데
    #집계 로직이 들어가는 순간 META DATA로 하면 시간복잡도가 늘어남
    #데이터 베이스그조로 바꾸면 데이터베이스를 완벽하게 정의해야한다.
    
    def add_artist(name, item_type, item_id):
        ##artist 이름을 집계하는 함수

        if not name: return
        if name not in artist_stats:
            ##artist_stats = > 아티스트를 집계하는 바구니 없으면 추가하고 있으면
            #개수를 더하고 types도 더하고 아이템도 추가한다
            artist_stats[name] = {"count": 0, "types": Counter(), "items": []}
        artist_stats[name]["count"] += 1
        artist_stats[name]["types"][item_type] += 1
        artist_stats[name]["items"].append(str(item_id))
        #여기서는 id만 더해서 넣어준다.
        #프론트가 따로 id를 체크해서 get함수를 사용
    

    def add_genre(name, item_type, item_id):
        if not name: return
        if name not in genre_stats:
            #NAME이라는 KEY로 데이터를 바로 찾아내기 때문에 add_genre는 item이 N개이면 O(N)복잡도
            genre_stats[name] = {"count": 0, "types": Counter(), "items": []}
        genre_stats[name]["count"] += 1
        genre_stats[name]["types"][item_type] += 1
        genre_stats[name]["items"].append(str(item_id))
    
    #items는 해당 유저의 아카이브에 있는 모든 item 단위 항목들
    for item in items:
        # Tally Artists
        
        media_meta = item.media_meta if isinstance(item.media_meta, dict) else {}
        user_meta = item.user_meta if isinstance(item.user_meta, dict) else {}
        #raw는 프론트엔드에서 jason을 그대로 저장한 dictionanry
        raw = media_meta.get("rawFrontendData", {}) if isinstance(media_meta.get("rawFrontendData"), dict) else {}
        
        # 수집된 아티스트명 중복 방지용 Set
        found_artists = set()

        # 1) contributors 배열에서 집계 (role이 없어도 name이 있으면 카운팅)
        contributors = media_meta.get("contributors", [])
        if isinstance(contributors, list) and contributors:
            for c in contributors:
                #역할과 이름 정규화
                role = str(c.get("role", "")).lower()
                name = str(c.get("name", "")).strip()
                if name:
                    # 프론트엔드 어댑터에서 subtitle을 무조건 contributors[{name}]에 넣는 동작으로 인해
                    # contributors가 없고 item_type=music이면서 role=artist이면 아이템 자체가 아티스트
                    if not role:
                        if len(name) > 40 or "..." in name or " · " in name or name in ("KR", "US", "UK", "JP", "Group", "Person"):
                            continue
                        # role=artist인 music 아이템(구 music_artist)은 스킵
                        if media_meta.get("role") in ("artist", "person"):
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

        # 정규화 이후: role=artist인 music 아이템은 아이템 자체가 아티스트
        if media_meta.get("role") == "artist" and item.title:
            found_artists.add(item.title)
        
        # 정규화 이후: role=person인 movie 아이템은 아이템 자체가 아티스트/인물
        if media_meta.get("role") == "person" and item.title:
            found_artists.add(item.title)

        # 하위 호환: 이미 DB에 남아있는 구 타입 처리
        if item.item_type == "movie_person" and item.title:
            found_artists.add(item.title)
        if item.item_type == "music_artist" and item.title:
            found_artists.add(item.title)
            
        # 중복 제거된 아티스트들을 한 번씩만 카운트
        for artist_name in found_artists:
            add_artist(artist_name, item.item_type, item.id)

            
        # Tally Genres — 정규화 후 whitelist: music, movie, book
        # 하위 호환: DB에 남아있는 구 타입(music_artist, movie_person, custom)도 포함
        effective_type = item.item_type
        if effective_type in ("music_artist",):
            effective_type = "music"
        elif effective_type in ("movie_person",):
            effective_type = "movie"

        if effective_type in ["music", "movie", "book"]:
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
