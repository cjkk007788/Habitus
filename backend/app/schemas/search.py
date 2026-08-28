from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

# ============================================================
# Search Schemas (External API Proxy Responses)
# ============================================================
class SearchResultItem(BaseModel):
    external_id: str = Field(..., description="외부 서비스의 고유 ID")
    external_source: str = Field(..., description="musicbrainz, tmdb 등")
    category: str = Field(..., description="music_artist, movie, book 등")
    title: str = Field(..., description="결과 제목/이름")
    cover_image_url: Optional[str] = Field(None, description="커버 썸네일 URL")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="상세 메타데이터")

class SearchResponse(BaseModel):
    query: str
    source: str
    results: List[SearchResultItem] = []
