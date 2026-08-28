from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.schemas.album import AlbumResponse, AlbumListResponse
from app.schemas.item import ItemResponse

# ============================================================
# Mix Schemas
# ============================================================
class MixBase(BaseModel):
    title: str = Field(..., description="믹스 제목 (예: 2024년 최고의 작품들)")
    description: Optional[str] = Field(None, description="믹스 설명")
    cover_image: Optional[str] = Field(None, description="믹스 대표 이미지 URL")
    is_public: Optional[bool] = Field(default=False)

class MixCreate(MixBase):
    album_ids: Optional[List[UUID]] = []
    item_ids: Optional[List[UUID]] = []

class MixUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    is_public: Optional[bool] = None
    album_ids: Optional[List[UUID]] = None
    item_ids: Optional[List[UUID]] = None

class MixInDBBase(MixBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MixResponse(MixInDBBase):
    # 이 믹스에 담긴 앨범과 아이템 목록
    albums: List[AlbumResponse] = []
    items: List[ItemResponse] = []

class MixListResponse(MixInDBBase):
    album_count: int = 0
