from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.schemas.item import ItemResponse

# ============================================================
# Album Schemas
# ============================================================
class AlbumBase(BaseModel):
    title: str = Field(..., description="앨범 제목 (예: 비오는 날 듣기 좋은 음악)")
    category: Optional[str] = Field(None, description="music, movie, book 등 (생략 시 복합 앨범)")
    is_public: Optional[bool] = Field(default=False)

class AlbumCreate(AlbumBase):
    pass

class AlbumUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    is_public: Optional[bool] = None

class AlbumInDBBase(AlbumBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

#Item을 열어볼때의 규격
class AlbumResponse(AlbumInDBBase):
    # 이 앨범에 담긴 아이템 목록
    #여기에 Item 관련 정보들이 들어간다
    items: List[ItemResponse] = []
    owner_username: Optional[str] = None  # 커뮤니티 뷰에서 작성자 표시용
    likes_count: int = 0
    is_liked: bool = False

class AlbumListResponse(AlbumInDBBase):
    # 목록 조회 시에는 items 배열 대신 썸네일 정도만 포함하거나 개수만 포함할 수 있습니다.
    item_count: int = 0
    likes_count: int = 0

class CommunityAlbumResponse(AlbumInDBBase):
    """커뮤니티 탐색 전용 응답 — 작성자 정보와 아이템 썸네일 포함"""
    items: List[ItemResponse] = []
    owner_username: Optional[str] = None
    similarity_score: Optional[float] = None  # 유사도 검색 시 점수
    likes_count: int = 0
    is_liked: bool = False
