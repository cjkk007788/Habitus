##프론트 엔드와 주고 받는 데이터를 깐깐하게 검사하는 도구들
#pydantic 데이터를 검증하는 도구
#BaseModel을 상속
#Field는 데이터의 세부 규칙을 정한다
#httpurl은 문자열이 올바른 웹주소인지 검사해주는 타입
from pydantic import BaseModel, Field, HttpUrl
#typing은 데이터의 형태를 알려주는 표준 도구
#optional은 있어도 되고 없어도 되는
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime

#Schema는 프론트 앤드와 주고 받는 데이터 규격이다
#데이터를 검증하는 방법에 대한 코드이다
# ============================================================
# Item Link Schemas
# ============================================================
#Basis using for pydantic is inherits BaseModel
class ItemLinkBase(BaseModel):
    #BaseModel of pydantic is validation object
    #Filed는 검증 규칙을 적어둔 함수
    #model에서 Column과 비슷
    #str만 올 수 있고 반드시 와야한다. (...이게 반드시)
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
    
    #ItemCreat는 백엔드에 보내는 item 규격서
    #itembase를 상속해서 기본 item 정보와함께 item과 관련된 링크를
    #Item정보와 함께 묶는다
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

##schemas는 데이터를 담는 서류 양식
##routes가 함수역할을 한다
#schemas는 프론트가 내용을 적어서 제출하는 양식이고
#내용을 검사한다
#이 내용 양식을 통해서 routes에 있는 함수가 쿼리를 날린다

