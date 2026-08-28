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

class AlbumResponse(AlbumInDBBase):
    # 이 앨범에 담긴 아이템 목록
    items: List[ItemResponse] = []

class AlbumListResponse(AlbumInDBBase):
    # 목록 조회 시에는 items 배열 대신 썸네일 정도만 포함하거나 개수만 포함할 수 있습니다.
    item_count: int = 0
