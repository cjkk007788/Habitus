from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime

# ============================================================
# Item Link Schemas
# ============================================================
#Basis using for pydantic is inherits BaseModel
class ItemLinkBase(BaseModel):
    #BaseModel of pydantic is validation object
    platform: str = Field(..., description="youtube, spotify, imdb 등")
    url: str = Field(..., description="해당 플랫폼의 URL")
    # description is used in Swagger UI
    #... is ellipsis in pydantic which means required field


class ItemLinkCreate(ItemLinkBase):
    pass

class ItemLinkResponse(ItemLinkBase):
    #Used for backend give a response data to front
    id: UUID
    item_id: UUID

    class Config:
        from_attributes = True


# ============================================================
# Item Schemas
# ============================================================
class ItemBase(BaseModel):
    title: str = Field(..., description="아이템 제목 (예: 기생충, OK Computer)")
    item_type: str = Field(..., description="music, movie, book, art 등")
    external_id: Optional[str] = Field(None, description="외부 API 고유 ID")
    external_source: Optional[str] = Field(None, description="tmdb, musicbrainz 등")
    rating: Optional[float] = Field(None, ge=0.0, le=5.0, description="1.0 ~ 5.0 평점")
    impression: Optional[str] = Field(None, description="한줄평")
    description: Optional[str] = Field(None, description="상세 리뷰")
    cover_image_url: Optional[str] = Field(None, description="커버 이미지 URL")
    dominant_color: Optional[str] = Field(None, description="UI에 쓸 메인 색상 (Hex)")
    genres: Optional[List[str]] = Field(default=[], description="장르 태그 목록")
    
    # 카테고리별 유동적 데이터 (예: 음악이면 artist 정보 등)
    media_meta: Optional[Dict[str, Any]] = Field(default_factory=dict, description="카테고리별 상세 JSON 데이터")
    user_meta: Optional[Dict[str, Any]] = Field(default_factory=dict, description="유저 커스텀 태그/메모")

class ItemCreate(ItemBase):
    links: Optional[List[ItemLinkCreate]] = []

class ItemUpdate(BaseModel):
    title: Optional[str] = None
    rating: Optional[float] = Field(None, ge=0.0, le=5.0)
    impression: Optional[str] = None
    description: Optional[str] = None
    cover_image_url: Optional[str] = None
    dominant_color: Optional[str] = None
    genres: Optional[List[str]] = None
    media_meta: Optional[Dict[str, Any]] = None
    user_meta: Optional[Dict[str, Any]] = None
    links: Optional[List[ItemLinkCreate]] = None

class ItemInDBBase(ItemBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    #database to json
    class Config:
        from_attributes = True
        
#this is actural final json
class ItemResponse(ItemInDBBase):
    links: List[ItemLinkResponse] = []
