from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.api.dependencies import get_db, get_current_user
from app.models.archive import Mix, Album, User
from app.schemas.mix import MixCreate, MixUpdate, MixResponse, MixListResponse

router = APIRouter()

@router.post("/", response_model=MixResponse, status_code=status.HTTP_201_CREATED)
def create_mix(
    mix_in: MixCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # db_mix = Mix(**mix_in.model_dump(), user_id=current_user.id) # Cannot do this directly if album_ids/item_ids are in mix_in
    
    mix_data = mix_in.model_dump(exclude={"album_ids", "item_ids"})
    db_mix = Mix(**mix_data, user_id=current_user.id)
    
    if mix_in.album_ids:
        albums = db.query(Album).filter(Album.id.in_(mix_in.album_ids), Album.user_id == current_user.id).all()
        db_mix.albums.extend(albums)
        
    if mix_in.item_ids:
        # We need to import Item
        from app.models.archive import Item
        items = db.query(Item).filter(Item.id.in_(mix_in.item_ids), Item.user_id == current_user.id).all()
        db_mix.items.extend(items)

    db.add(db_mix)
    db.commit()
    db.refresh(db_mix)
    return db_mix

@router.get("/", response_model=List[MixListResponse])
def read_mixes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    mixes = db.query(Mix).filter(Mix.user_id == current_user.id).offset(skip).limit(limit).all()
    return mixes

@router.get("/{mix_id}", response_model=MixResponse)
def read_mix(
    mix_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    mix = db.query(Mix).filter(Mix.id == mix_id, Mix.user_id == current_user.id).first()
    if not mix:
        raise HTTPException(status_code=404, detail="Mix not found")
    return mix

@router.put("/{mix_id}", response_model=MixResponse)
def update_mix(
    mix_id: UUID,
    mix_in: MixUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_mix = db.query(Mix).filter(Mix.id == mix_id, Mix.user_id == current_user.id).first()
    if not db_mix:
        raise HTTPException(status_code=404, detail="Mix not found")
    
    update_data = mix_in.model_dump(exclude_unset=True, exclude={"album_ids", "item_ids"})
    for field, value in update_data.items():
        setattr(db_mix, field, value)
        
    if mix_in.album_ids is not None:
        albums = db.query(Album).filter(Album.id.in_(mix_in.album_ids), Album.user_id == current_user.id).all()
        db_mix.albums = albums
        
    if mix_in.item_ids is not None:
        from app.models.archive import Item
        items = db.query(Item).filter(Item.id.in_(mix_in.item_ids), Item.user_id == current_user.id).all()
        db_mix.items = items
        
    db.commit()
    db.refresh(db_mix)
    return db_mix

@router.delete("/{mix_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_mix(
    mix_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_mix = db.query(Mix).filter(Mix.id == mix_id, Mix.user_id == current_user.id).first()
    if not db_mix:
        raise HTTPException(status_code=404, detail="Mix not found")
    
    db.delete(db_mix)
    db.commit()
    return None

@router.post("/{mix_id}/albums", response_model=MixResponse)
def add_albums_to_mix(
    mix_id: UUID,
    album_ids: List[UUID],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """믹스에 앨범들을 추가합니다."""
    mix = db.query(Mix).filter(Mix.id == mix_id, Mix.user_id == current_user.id).first()
    if not mix:
        raise HTTPException(status_code=404, detail="Mix not found")
        
    albums = db.query(Album).filter(Album.id.in_(album_ids), Album.user_id == current_user.id).all()
    if not albums:
        raise HTTPException(status_code=404, detail="Albums not found")
        
    for album in albums:
        if album not in mix.albums:
            mix.albums.append(album)
            
    db.commit()
    db.refresh(mix)
    return mix
