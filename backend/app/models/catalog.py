from sqlalchemy import Column, String, DateTime, JSON, UniqueConstraint, Uuid as UUID
from sqlalchemy.sql import func
import uuid
#Base is parent class of every table class made from database.py

from app.core.database import Base

#caching table

class CatalogEntry(Base):
    """
    범용 외부 메타데이터 캐시 테이블.
    MusicBrainz, Spotify, TMDB, Google Books, Met API 등
    어떤 외부 서비스의 데이터든 통합 저장합니다.
    
    동일한 외부 ID에 대해 중복 API 호출을 방지하는 캐시 역할도 겸합니다.
    """
    __tablename__ = "catalog_entries"

    #catalog id
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


    # 외부 서비스 식별 ---

    external_id = Column(String, nullable=False)        # 외부 서비스의 고유 ID (Spotify track ID, TMDB movie ID 등)
    external_source = Column(String, nullable=False)    # "spotify", "tmdb", "google_books", "met", "musicbrainz"
    
    # 카테고리 & 기본 정보 ---
    category = Column(String, nullable=False, index=True)  # "music_artist", "music_album", "music_track", "movie", "book", "art"
    title = Column(String, index=True)                     # 대표 제목 (곡명, 영화명, 책 제목 등)
    cover_image_url = Column(String, nullable=True)        # 대표 이미지 URL

    # 카테고리별 상세 메타데이터 (JSON) ---
    meta_data = Column(JSON, default=dict)
    # 자유형 데이터 / API가 주는 걸 그대로 넣는다
    # 예시:
    # music_track  → {"artist": "Radiohead", "album": "OK Computer", "duration_ms": 263000, "preview_url": "..."}
    # movie        → {"director": "봉준호", "cast": ["송강호"], "runtime_min": 132, "release_year": 2019}
    # book         → {"author": "무라카미 하루키", "isbn": "978-...", "publisher": "문학사상", "page_count": 456}
    # art          → {"artist": "Monet", "medium": "Oil on canvas", "year": 1872, "museum": "Musée d'Orsay"}

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 같은 외부 서비스의 같은 ID는 중복 저장 방지
    __table_args__ = (
        UniqueConstraint('external_id', 'external_source', name='uq_external_identity'),
    )

    
