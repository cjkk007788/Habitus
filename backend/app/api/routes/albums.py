from fastapi import APIRouter, Depends, HTTPException, status, Body, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
import uuid as _uuid

from app.api.dependencies import get_db, get_current_user
from app.models.archive import Album, Item, User, Comment
from app.schemas.album import AlbumCreate, AlbumUpdate, AlbumResponse, AlbumListResponse, CommunityAlbumResponse
from app.schemas.comment import CommentCreate, CommentResponse
from app.services import embedding_service

router = APIRouter()


def _refresh_album_embedding(album_id, db_url: str):
    """백그라운드에서 앨범 임베딩 재계산 (별도 DB 세션 사용)"""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.models.archive import Album as AlbumModel

    connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}
    engine = create_engine(db_url, connect_args=connect_args)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    try:
        album = db.query(AlbumModel).filter(AlbumModel.id == album_id).first()
        if album:
            vec = embedding_service.compute_album_embedding(album)
            if vec:
                album.embedding = vec
                db.commit()
    except Exception as e:
        import logging
        logging.getLogger(__name__).error("임베딩 백그라운드 실패: %s", e)
    finally:
        db.close()

@router.post("/", response_model=AlbumResponse, status_code=status.HTTP_201_CREATED)
def create_album(
    album_in: AlbumCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_album = Album(**album_in.model_dump(), user_id=current_user.id)
    db.add(db_album)
    db.commit()
    db.refresh(db_album)
    # 임베딩 백그라운드 업데이트
    from app.core.config import settings
    background_tasks.add_task(_refresh_album_embedding, db_album.id, settings.DATABASE_URL)
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


@router.get("/community/", response_model=List[CommunityAlbumResponse])
def read_community_albums(
    category: Optional[str] = None,
    q: Optional[str] = None,
    sort: str = "latest",
    skip: int = 0,
    limit: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    커뮤니티 공개 앨범 목록.
    - q 파라미터로 코사인 유사도 검색 지원
    - 인증 불필요 (보데리 없이 요청 가능)
    """
    base_query = db.query(Album).filter(Album.is_public == True)
    if category and category != "all":
        base_query = base_query.filter(Album.category == category)

    if q:
        # 1단계: 코사인 유사도 검색
        all_public = base_query.all()
        query_vec = embedding_service.embed_text(q)
        if query_vec:
            scored = embedding_service.search_similar_albums(query_vec, all_public, top_k=limit)
            results = []
            for album in scored:
                # scored is a list of (album, score) tuples
                album_obj, score = album
                album_obj.similarity_score = score
                if album_obj.owner:
                    album_obj.owner_username = album_obj.owner.username
                album_obj.is_liked = current_user in album_obj.liked_by
                results.append(album_obj)
            return results
        else:
            # 임베딩 불가 시 키워드 폴백
            albums = base_query.filter(
                Album.title.ilike(f"%{q}%")
            ).order_by(Album.created_at.desc()).offset(skip).limit(limit).all()
    elif sort == "latest":
        albums = base_query.order_by(Album.created_at.desc()).offset(skip).limit(limit).all()
    else:
        albums = base_query.order_by(Album.updated_at.desc()).offset(skip).limit(limit).all()

    for album in albums:
        if album.owner:
            album.owner_username = album.owner.username
        album.is_liked = current_user in album.liked_by
    return albums


@router.get("/{album_id}/public", response_model=CommunityAlbumResponse)
def read_album_public(
    album_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Public 설정된 앨범을 비인증으로 조회 (Read-only)"""
    album = db.query(Album).filter(Album.id == album_id, Album.is_public == True).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found or not public")
    if album.owner:
        album.owner_username = album.owner.username
    album.is_liked = current_user in album.liked_by
    return album


@router.post("/{album_id}/like", response_model=AlbumResponse)
def toggle_album_like(
    album_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """앨범 좋아요 토글"""
    album = db.query(Album).filter(Album.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    
    if current_user in album.liked_by:
        album.liked_by.remove(current_user)
        album.likes_count = max(0, album.likes_count - 1)
        album.is_liked = False
    else:
        album.liked_by.append(current_user)
        album.likes_count += 1
        album.is_liked = True

    db.commit()
    db.refresh(album)
    if album.owner:
        album.owner_username = album.owner.username
    return album


@router.post("/{album_id}/clone", response_model=AlbumResponse, status_code=status.HTTP_201_CREATED)
def clone_album(
    album_id: UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    퍼블릭 앨범을 내 아카이브로 복제.
    - 원본 위작자 크레딛은 user_meta에 JSON으로 기록
    - 복제 된 앨범의 is_public은 False로 초기화
    """
    original = db.query(Album).filter(Album.id == album_id, Album.is_public == True).first()
    if not original:
        raise HTTPException(status_code=404, detail="Album not found or not public")

    # 새 앨범 생성 (원본 타이틀 + Cloned)
    cloned_album = Album(
        user_id=current_user.id,
        title=f"{original.title} (Cloned)",
        category=original.category,
        is_public=False,
    )
    db.add(cloned_album)
    db.flush()  # ID 미리 확보

    # 원본 아이템들 복제 (새 Item 레코드 생성)
    for orig_item in original.items:
        new_item = Item(
            user_id=current_user.id,
            external_id=orig_item.external_id,
            external_source="custom",
            item_type=orig_item.item_type,
            title=orig_item.title,
            description=orig_item.description,
            rating=0.0,
            status="want",
            impression=orig_item.impression,
            cover_image_url=orig_item.cover_image_url,
            genres=orig_item.genres,
            user_meta={"cloned_from_album": str(original.id), "cloned_from_user": str(original.user_id)},
            media_meta=orig_item.media_meta,
        )
        db.add(new_item)
        db.flush()
        cloned_album.items.append(new_item)

    db.commit()
    db.refresh(cloned_album)

    from app.core.config import settings
    background_tasks.add_task(_refresh_album_embedding, cloned_album.id, settings.DATABASE_URL)
    return cloned_album


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
    background_tasks: BackgroundTasks,
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
    from app.core.config import settings
    background_tasks.add_task(_refresh_album_embedding, db_album.id, settings.DATABASE_URL)
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
