from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.api.dependencies import get_db, get_current_user
from app.models.archive import Album, Item, User, Comment
from app.schemas.album import AlbumCreate, AlbumUpdate, AlbumResponse, AlbumListResponse
from app.schemas.comment import CommentCreate, CommentResponse

router = APIRouter()

@router.post("/", response_model=AlbumResponse, status_code=status.HTTP_201_CREATED)
def create_album(
    album_in: AlbumCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_album = Album(**album_in.model_dump(), user_id=current_user.id)
    db.add(db_album)
    db.commit()
    db.refresh(db_album)
    return db_album

@router.get("/", response_model=List[AlbumListResponse])
def read_albums(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    albums = db.query(Album).filter(Album.user_id == current_user.id).offset(skip).limit(limit).all()
    # Pydantic이 item_count를 0으로 기본 처리하겠지만, 실제 로직에서는 len(album.items) 등을 할당해줄 수 있습니다.
    return albums

@router.get("/custom/", response_model=List[AlbumResponse])
def read_custom_albums(
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """커스텀 카테고리의 앨범만 조회. category 파라미터로 추가 필터 가능."""
    query = db.query(Album).filter(
        Album.user_id == current_user.id
    )
    if category and category != "all":
        query = query.filter(Album.category == category)
    return query.order_by(Album.created_at.desc()).offset(skip).limit(limit).all()

@router.get("/{album_id}", response_model=AlbumResponse)
def read_album(
    album_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    album = db.query(Album).filter(Album.id == album_id, Album.user_id == current_user.id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    return album

@router.put("/{album_id}", response_model=AlbumResponse)
def update_album(
    album_id: UUID,
    album_in: AlbumUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_album = db.query(Album).filter(Album.id == album_id, Album.user_id == current_user.id).first()
    if not db_album:
        raise HTTPException(status_code=404, detail="Album not found")
    
    update_data = album_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_album, field, value)
        
    db.commit()
    db.refresh(db_album)
    return db_album

@router.delete("/{album_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_album(
    album_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_album = db.query(Album).filter(Album.id == album_id, Album.user_id == current_user.id).first()
    if not db_album:
        raise HTTPException(status_code=404, detail="Album not found")
    
    db.delete(db_album)
    db.commit()
    return None

@router.post("/{album_id}/items", response_model=AlbumResponse)
def add_items_to_album(
    album_id: UUID,
    item_ids: List[UUID] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """앨범에 아이템들을 추가합니다."""
    album = db.query(Album).filter(Album.id == album_id, Album.user_id == current_user.id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
        
    items = db.query(Item).filter(Item.id.in_(item_ids), Item.user_id == current_user.id).all()
    if not items:
        raise HTTPException(status_code=404, detail="Items not found")
        
    for item in items:
        if item not in album.items:
            album.items.append(item)
            
    db.commit()
    db.refresh(album)
    return album

@router.put("/{album_id}/items", response_model=AlbumResponse)
def sync_items_to_album(
    album_id: UUID,
    item_ids: List[UUID] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """앨범의 아이템 목록을 완전히 교체합니다."""
    album = db.query(Album).filter(Album.id == album_id, Album.user_id == current_user.id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
        
    items = db.query(Item).filter(Item.id.in_(item_ids), Item.user_id == current_user.id).all()
    # 입력된 ID 순서를 보장하기 위해 정렬
    item_dict = {item.id: item for item in items}
    ordered_items = [item_dict[uuid] for uuid in item_ids if uuid in item_dict]
    
    # 앨범의 전체 아이템 목록을 교체
    album.items = ordered_items
    
    db.commit()
    db.refresh(album)
    return album


@router.post("/{album_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    album_id: UUID,
    comment_in: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    album = db.query(Album).filter(Album.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
        
    db_comment = Comment(**comment_in.model_dump(), album_id=album_id, user_id=current_user.id)
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    
    # inject username for frontend
    db_comment.username = current_user.username
    return db_comment

@router.get("/{album_id}/comments", response_model=List[CommentResponse])
def read_comments(
    album_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    album = db.query(Album).filter(Album.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
        
    comments = db.query(Comment).filter(Comment.album_id == album_id).order_by(Comment.created_at.desc()).offset(skip).limit(limit).all()
    for c in comments:
        c.username = c.user.username if c.user else None
    return comments

@router.delete("/{album_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    album_id: UUID,
    comment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comment = db.query(Comment).filter(Comment.id == comment_id, Comment.album_id == album_id, Comment.user_id == current_user.id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found or not authorized")
        
    db.delete(comment)
    db.commit()
    return None
