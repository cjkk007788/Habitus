Habitus

음악 · 영화 · 책을 탐색(Digging)하고, 나만의 앨범/믹스로 아카이빙하며, 취향 리포트와 추천까지 받아보는 멀티 미디어 취향 아카이브 웹 서비스 (MVP)

Habitus는 바이닐(LP) 디깅 문화에서 영감을 받은 서비스입니다. 여러 외부 API에서 음악·영화·책을 검색하고, 마음에 드는 것을 Item → Album → Mix 구조로 모아 두면, 쌓인 데이터를 바탕으로 취향을 분석하고 비슷한 취향의 큐레이션을 추천해 줍니다.

주요 기능
🔍 Digging (탐색)
통합 검색: 음악(아티스트/트랙), 영화, 책을 하나의 검색창에서 카테고리별로 검색
장르 그리드 & 큐레이션 행: 카테고리별 인기 아티스트/트랙, 트렌딩·평점 높은 영화, 베스트셀러·수상작·고전 도서 등
동적 큐레이션: 내 취향 데이터에 맞춰 "Because you like ○○", "Deep Dive into ○○" 같은 추천 행을 자동 구성
상세 사이드바: 음악 미리듣기(iTunes), 영화 예고편/출연진·감독 정보, 도서 상세 정보 제공
🗂️ Archive (아카이브)
Content: 저장한 아이템을 Mix(대분류) → Album(소분류) 구조로 정리
Staging 영역: 우측 사이드바에서 여러 아이템을 담아 앨범 제목·설정을 편집한 뒤 한 번에 아카이빙
Custom Archive: 이미지 URL, 해시태그, 링크, 별점, 레이아웃 프리셋으로 직접 만드는 커스텀 앨범 (Masonry 그리드, 캐러셀)
Report: 아카이브 전체를 집계한 취향 분석 (Top 아티스트 / Top 장르, 워드클라우드)
🌐 Curation (커뮤니티)
공개로 설정한 앨범을 둘러보고 좋아요 · 댓글 · 복제(clone) 가능
Taste DNA 매칭: 앨범 텍스트를 임베딩(all-MiniLM-L6-v2)해 코사인 유사도로 취향이 비슷한 큐레이션 추천
기술 스택
영역	사용 기술
Frontend	React 19, Vite, React Router 7, Zustand, Swiper, react-resizable-panels, react-d3-cloud, lucide-react
Backend	FastAPI, Uvicorn, SQLAlchemy, Alembic, Pydantic Settings, httpx
Database	PostgreSQL 16 (Docker)
AI/추천	sentence-transformers (all-MiniLM-L6-v2, 384차원) 기반 임베딩 + 코사인 유사도, 장르/아티스트 겹침 스코어링
외부 API	MusicBrainz, Last.fm, Discogs, iTunes Search, TMDB, Google Books, Wikidata/Wikipedia, lyrics.ovh
프로젝트 구조
Habitus
├── backend
│   ├── app
│   │   ├── main.py              # FastAPI 앱 진입점 (CORS, 라우터, 임베딩 모델 백그라운드 로딩)
│   │   ├── core/                # 설정(.env), DB 엔진/세션
│   │   ├── models/              # archive.py (User, Mix, Album, Item, ItemLink, Comment) / catalog.py (외부 데이터 캐시)
│   │   ├── schemas/             # Pydantic 스키마
│   │   ├── services/            # 외부 API 연동 + embedding_service
│   │   └── api/routes/          # search, items, albums, mixes, curation, report, recommend, person, *_genres
│   ├── alembic/                 # DB 마이그레이션
│   └── docker-compose.yml       # PostgreSQL
└── frontend
    └── src
        ├── pages/               # Digging, Archive(Content/Report/Custom), Curation(Community), Social
        ├── components/          # LeftSidebar, RightSidebar, Navbar, visual/*, digging/* ...
        ├── store/               # Zustand 스토어 (search, archive, sidebar, custom, cache)
        ├── api/                 # 백엔드 호출 모듈
        └── utils/               # 미디어 어댑터, 색상 추출 등
데이터 모델
User ─┬─ Mix ──(mix_albums)── Album ──(album_items)── Item ── ItemLink
      │                         │ └─ Comment, album_likes
      └─ Album / Item (소유)
CatalogEntry : 외부 API 응답 캐시 (external_source + external_id 유니크)
Item: 음악/영화/책/아트 등 모든 카테고리를 하나의 테이블로 관리하고, 카테고리별 상세 정보는 media_meta(JSON)에 저장
Album: is_public, likes_count, embedding(JSON) 보유 → 커뮤니티 공개 및 유사도 검색에 사용
시작하기
사전 준비
Node.js 18+
Python 3.11+
Docker (PostgreSQL 실행용)
외부 API 키 (TMDB, Last.fm, Discogs 등 — 아래 환경 변수 참고)
1. 저장소 클론
bash
git clone https://github.com/cjkk007788/Habitus.git
cd Habitus
2. 백엔드
bash
cd backend

# PostgreSQL 실행
docker compose up -d

# 가상환경 및 패키지 설치
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install sentence-transformers numpy   # 임베딩 기반 추천 기능용 (선택)

# 환경 변수 설정 (아래 참고)
cp .env.example .env            # 또는 직접 .env 생성

# DB 마이그레이션
alembic upgrade head

# 서버 실행
uvicorn app.main:app --reload
API 서버: http://localhost:8000
Swagger 문서: http://localhost:8000/api/v1/openapi.json (FastAPI 기본 /docs 도 사용 가능)
헬스 체크: http://localhost:8000/health
3. 프론트엔드
bash
cd frontend
npm install
npm run dev
접속: http://127.0.0.1:5173
환경 변수

backend/.env

env
DATABASE_URL=postgresql+psycopg://habitus:habitus_dev@localhost:5432/habitus
DEBUG=True

TMDB_API_KEY=
TMDB_READ_ACCESS_TOKEN=
LASTFM_API_KEY=
LASTFM_SHARED_SECRET=
DISCOGS_API_KEY=
DISCOGS_API_SECRET=

frontend/.env.local (선택)

env
VITE_API_BASE_URL=http://localhost:8000/api/v1
API 개요

모든 엔드포인트는 /api/v1 접두사를 가집니다.

경로	설명
/search	음악·영화·책 통합 검색
/person	영화 인물(감독/배우) 정보
/genres/{music|book|movie}	장르 목록 및 장르별 아이템
/curation/{music|movie|book}	카테고리별 큐레이션 목록
/items	아카이브 아이템 CRUD
/albums	앨범 CRUD, 공개 앨범 조회, 좋아요, 복제, 댓글
/mixes	믹스 CRUD, 믹스에 앨범 추가
/report/taste-analysis	Top 아티스트/장르 취향 분석
/recommend/recommendations	취향 기반 아이템 추천
/recommend/dynamic-curation	취향 기반 동적 큐레이션 행 정의
현재 상태 & 로드맵

현재는 MVP 개발 단계입니다.

 통합 검색 / 장르·큐레이션 탐색
 Item · Album · Mix 아카이빙 및 커스텀 앨범
 취향 리포트 (Top 아티스트 / 장르)
 공개 앨범, 좋아요, 댓글, 복제
 임베딩 기반 Taste DNA 추천
 사용자 인증 (현재는 첫 번째 유저를 사용하는 임시 인증 — JWT 도입 예정)
 Social 페이지
 임베딩 검색을 pgvector 등 DB 레벨로 이전
 테스트 코드 및 CI 구성
 배포 (ngrok 기반 외부 테스트 → 정식 배포)
참고 사항
인증이 아직 없어서, 모든 요청은 DB의 첫 번째 유저(tester)로 처리됩니다.
임베딩 모델은 서버 시작 시 백그라운드에서 로드되며, sentence-transformers가 설치되어 있지 않으면 해당 기능만 비활성화됩니다.
외부 API 키가 없는 서비스는 해당 기능(검색/큐레이션 일부)이 동작하지 않을 수 있습니다.
