from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
import httpx
import logging

from app.api.dependencies import get_db, get_current_user
from app.models.archive import Item, User, Album, Mix, mix_albums, mix_items, album_items
from app.schemas.item import ItemCreate, ItemUpdate, ItemResponse
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

@router.delete("/clear_all", status_code=status.HTTP_204_NO_CONTENT)
def clear_all_user_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """유저의 모든 아카이브 데이터(아이템, 앨범, 믹스)를 삭제합니다."""
    
    user_mix_ids = db.query(Mix.id).filter(Mix.user_id == current_user.id)
    user_album_ids = db.query(Album.id).filter(Album.user_id == current_user.id)

    # 중간 테이블부터 명시적으로 삭제 (CASCADE 부재 대응)
    db.execute(mix_albums.delete().where(mix_albums.c.mix_id.in_(user_mix_ids)))
    db.execute(mix_items.delete().where(mix_items.c.mix_id.in_(user_mix_ids)))
    db.execute(album_items.delete().where(album_items.c.album_id.in_(user_album_ids)))

    # 본 테이블 bulk delete
    db.query(Album).filter(Album.user_id == current_user.id).delete(synchronize_session=False)
    db.query(Mix).filter(Mix.user_id == current_user.id).delete(synchronize_session=False)
    db.query(Item).filter(Item.user_id == current_user.id).delete(synchronize_session=False)

    db.commit()
    return None

#If frontend sent post address /, this function working
#Make jason data to pydantic object
#in router.post fast api engine do analysis the paramiter types
# Then they transfrom automatically to object pydantic
#Router.post is checking parameter. ex db session has depends so not fitting jason body
#ItemCreate, checking class it inherits baseModel so give the json body
#만약에 POST/api/v1/items로 요청이 오면 바로 이 함수를 실행
#파라미터의 문법을 보면 이 함수가 실행될때, item 객체가 만들어지고, DB의존성을 부여하고
#현재 유저 객체를 생성한다고 이해
@router.post("/", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
def create_item(
    item_in: ItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item_data = item_in.model_dump(exclude={"links"})

    if item_data.get("item_type") == "movie" and item_data.get("external_source") == "tmdb":
        tmdb_id = item_data.get("external_id")
        if tmdb_id:
            try:
                headers = {"accept": "application/json"}
                if settings.TMDB_READ_ACCESS_TOKEN:
                    headers["Authorization"] = f"Bearer {settings.TMDB_READ_ACCESS_TOKEN}"
                
                url = f"https://api.themoviedb.org/3/movie/{tmdb_id}"
                params = {"append_to_response": "credits"}
                if not settings.TMDB_READ_ACCESS_TOKEN and settings.TMDB_API_KEY:
                    params["api_key"] = settings.TMDB_API_KEY

                res = httpx.get(url, headers=headers, params=params, timeout=5.0)
                if res.status_code == 200:
                    data = res.json()
                    credits = data.get("credits", {})
                    
                    directors = [c["name"] for c in credits.get("crew", []) if c.get("job") == "Director"]
                    cast = [c["name"] for c in credits.get("cast", [])[:5]]
                    
                    if directors or cast:
                        media_meta = item_data.get("media_meta") or {}
                        
                        existing_artists = media_meta.get("artists", [])
                        if not isinstance(existing_artists, list):
                            existing_artists = [existing_artists] if existing_artists else []
                        
                        for d in directors:
                            if d not in existing_artists:
                                existing_artists.append(d)
                        
                        media_meta["artists"] = existing_artists
                        
                        contributors = media_meta.get("contributors", [])
                        if not isinstance(contributors, list):
                            contributors = []
                            
                        contributors = [c for c in contributors if not (isinstance(c, dict) and "..." in c.get("name", ""))]
                        
                        for d in directors:
                            if not any(c.get("name") == d and c.get("role") == "Director" for c in contributors):
                                contributors.append({"name": d, "role": "Director"})
                        for a in cast:
                            if not any(c.get("name") == a and c.get("role") == "Actor" for c in contributors):
                                contributors.append({"name": a, "role": "Actor"})
                            
                        media_meta["contributors"] = contributors
                        item_data["media_meta"] = media_meta
            except Exception as e:
                logger.warning(f"Failed to fetch TMDB credits for item {tmdb_id}: {e}")

    db_item = Item(**item_data, user_id=current_user.id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/", response_model=List[ItemResponse])
def read_items(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items = db.query(Item).filter(Item.user_id == current_user.id).offset(skip).limit(limit).all()
    return items

@router.get("/custom/", response_model=List[ItemResponse])
def read_custom_items(
    item_type: Optional[str] = Query(None, description="카테고리 필터 (music, movie, book, custom 등)"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """커스텀(수동) 아카이빙 아이템만 조회. item_type으로 필터 가능."""
    query = db.query(Item).filter(
        Item.user_id == current_user.id,
        Item.external_source == "custom"
    )
    if item_type:
        query = query.filter(Item.item_type == item_type)
    return query.order_by(Item.created_at.desc()).offset(skip).limit(limit).all()

@router.get("/{item_id}", response_model=ItemResponse)
def read_item(
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(Item).filter(Item.id == item_id, Item.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@router.put("/{item_id}", response_model=ItemResponse)
def update_item(
    item_id: UUID,
    item_in: ItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_item = db.query(Item).filter(Item.id == item_id, Item.user_id == current_user.id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    update_data = item_in.model_dump(exclude_unset=True, exclude={"links"})
    for field, value in update_data.items():
        setattr(db_item, field, value)
        
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_item = db.query(Item).filter(Item.id == item_id, Item.user_id == current_user.id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db.delete(db_item)
    db.commit()
    return None
