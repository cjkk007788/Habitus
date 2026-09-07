from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, JSON, DateTime, Table, Uuid as UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
#Base is parent class of every table class made from database.py
from app.core.database import Base

##Model 폴더는 DB의 설계도 가장 아래에 있는 것

#이 파일은 Habitus의 핵심 데이터들을 정의한 중요한 모델 파일

#catalog.py는 공용 임시 창고

#archive.py는 개인 서제 유저의 보관함

# ============================================================
# 중간 테이블 (다대다 관계용 Junction Tables)
# ============================================================
#in sql many-to-many, many mixes have many cards, many cards have many mixes, this table make that work
#Base.metadata is information for tables for sqlalchemy, sqlite
mix_albums = Table(
    'mix_albums',
    Base.metadata,
    Column('mix_id', UUID(as_uuid=True), ForeignKey('mixes.id'), primary_key=True),
    Column('album_id', UUID(as_uuid=True), ForeignKey('albums.id'), primary_key=True),
    Column('order_index', Integer, default=0)
)

mix_items = Table(
    'mix_items',
    Base.metadata,
    Column('mix_id', UUID(as_uuid=True), ForeignKey('mixes.id'), primary_key=True),
    Column('item_id', UUID(as_uuid=True), ForeignKey('items.id'), primary_key=True),
    Column('order_index', Integer, default=0)
)

album_items = Table(
    'album_items',
    Base.metadata,
    Column('album_id', UUID(as_uuid=True), ForeignKey('albums.id'), primary_key=True),
    Column('item_id', UUID(as_uuid=True), ForeignKey('items.id'), primary_key=True),
    Column('order_index', Integer, default=0)
)


# ============================================================
# User (유저)
# ============================================================

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    mixes = relationship("Mix", back_populates="owner")
    albums = relationship("Album", back_populates="owner")
    items = relationship("Item", back_populates="owner")


# ============================================================
# Mix (대분류 폴더 - 앨범을 모은 컬렉션)
# ============================================================

class Mix(Base):
    __tablename__ = "mixes"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    cover_image = Column(String, nullable=True)
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner = relationship("User", back_populates="mixes")
    albums = relationship("Album", secondary=mix_albums, back_populates="mixes")
    items = relationship("Item", secondary=mix_items, back_populates="mixes")


# ============================================================
# Album (소분류 폴더 - 아이템을 모은 그룹)
# ============================================================

class Album(Base):
    __tablename__ = "albums"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    title = Column(String, index=True)
    category = Column(String)                              # "music", "movie", "book", "art", "style"
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner = relationship("User", back_populates="albums")
    mixes = relationship("Mix", secondary=mix_albums, back_populates="albums")
    items = relationship("Item", secondary=album_items, back_populates="albums")



# ============================================================
# Item (아카이빙된 개별 아이템 - 핵심 테이블)
# ============================================================

class Item(Base):
    """
    범용 아카이브 아이템 테이블.
    음악, 영화, 책, 미술작품 등 모든 카테고리의 아이템을 하나의 테이블에서 관리합니다.
    카테고리별 고유 데이터는 media_meta (JSON) 컬럼에 저장됩니다.
    """
    __tablename__ = "items"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    # 외부 서비스 연결 (범용) ---
    external_id = Column(String, nullable=True)            # 외부 서비스 ID (Spotify ID, TMDB ID, ISBN 등)
    external_source = Column(String, nullable=True)        # "spotify", "tmdb", "google_books", "met" 등

    # 공통 필드 (모든 카테고리 동일) ---
    item_type = Column(String, index=True)                 # "music", "movie", "book", "art", "style"
    title = Column(String, index=True)                     # 곡 제목 / 영화 제목 / 책 제목 등
    description = Column(String, nullable=True)            # 상세 설명 및 리뷰
    rating = Column(Float, default=0.0)                    # 유저 평점 (협업 필터링 핵심 가중치)
    status = Column(String, default="want")                # "want" / "listened" / "watched" / "read" / "archived"
    impression = Column(String, nullable=True)             # 한줄평

    # 비주얼 (바이닐 디자인 시그니처) ---
    cover_image_url = Column(String, nullable=True)        # 메인 커버 이미지 URL
    dominant_color = Column(String, nullable=True)         # 추출된 대표 색상 (예: "#1a2b3c")
    color_palette = Column(JSON, nullable=True)            # 색상 팔레트 (예: ["#1a2b3c", "#4d5e6f"])

    # 장르 & 태그 ---
    genres = Column(JSON, default=list)                    # 유저가 선택/입력한 장르 (예: ["rock", "indie"])

    # 유연한 메타데이터 (카테고리별 고유 데이터) ---
    user_meta = Column(JSON, default=dict)                 # 유저 커스텀 메모/태그
    media_meta = Column(JSON, default=dict)                # 카테고리별 상세 메타데이터
    # music → {"artist": "Radiohead", "album": "OK Computer", "duration_ms": 263000}
    # movie → {"director": "봉준호", "cast": ["송강호"], "runtime_min": 132}
    # book  → {"author": "하루키", "isbn": "978-...", "page_count": 456}
    # art   → {"artist": "Monet", "medium": "Oil on canvas", "year": 1872}

    # 타임스탬프 ---
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 관계 ---
    owner = relationship("User", back_populates="items")
    albums = relationship("Album", secondary=album_items, back_populates="items")
    mixes = relationship("Mix", secondary=mix_items, back_populates="items")
    links = relationship("ItemLink", back_populates="item", cascade="all, delete-orphan")


# ============================================================
# ItemLink (아이템에 연결된 외부 링크 - 별도 테이블)
# ============================================================

class ItemLink(Base):
    """
    아이템에 연결된 외부 링크들을 관리하는 테이블.
    하나의 아이템에 YouTube, Spotify, Apple Music 등 여러 링크가 붙을 수 있습니다.
    """
    __tablename__ = "item_links"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id = Column(UUID(as_uuid=True), ForeignKey("items.id"), nullable=False)
    platform = Column(String, nullable=False)              # "youtube", "spotify", "apple_music", "melon" 등
    url = Column(String, nullable=False)                   # 실제 URL
    label = Column(String, nullable=True)                  # 표시 이름 (예: "공식 MV", "라이브 버전")

    item = relationship("Item", back_populates="links")
