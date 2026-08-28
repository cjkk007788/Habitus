# 📚 Habitus 백엔드 기초 & 코드 완벽 분석 가이드

> 이 문서는 **백엔드 입문자**의 눈높이에 맞춰, 웹 백엔드의 기본 원리부터 현재 프로젝트의 전체 코드 구조, 데이터베이스 설계, API 동작 방식까지 차근차근 이해할 수 있도록 정리한 가이드입니다.

---

## 📑 목차
1. [백엔드 기초 지식 (이것만 알면 백엔드가 보인다)](#1-백엔드-기초-지식)
2. [Habitus 백엔드 전체 아키텍처 개요](#2-habitus-백엔드-전체-아키텍처-개요)
3. [설정 & 데이터베이스 연결 계층 (`app/core`)](#3-설정--데이터베이스-연결-계층-appcore)
4. [데이터베이스 모델 계층 (`app/models`)](#4-데이터베이스-모델-계층-appmodels)
5. [데이터 검증 & 전송 계층 (`app/schemas`)](#5-데이터-검증--전송-계층-appschemas)
6. [외부 API 연동 & 비즈니스 서비스 계층 (`app/services`)](#6-외부-api-연동--비즈니스-서비스-계층-appservices)
7. [API 라우트 & 컨트롤러 계층 (`app/api/routes`)](#7-api-라우트--컨트롤러-계층-appapiroutes)
8. [의존성 주입 & 인증 계층 (`app/api/dependencies.py`)](#8-의존성-주입--인증-계층-appapidependenciespy)
9. [요청(Request)에서 응답(Response)까지의 전체 흐름 예시](#9-요청request에서-응답response까지의-전체-흐름-예시)

---

## 1. 백엔드 기초 지식

### 1-1. 클라이언트와 서버의 대화 (HTTP Request & Response)
* **클라이언트 (Frontend / React)**: 사용자가 보는 화면. "내 앨범 목록 줘!", "이 노래 저장해줘!" 하고 **요청(Request)**을 보냅니다.

* **서버 (Backend / FastAPI)**: 화면 뒤에서 일하는 두뇌. 요청을 받아 DB에서 데이터를 찾거나 가공한 뒤 **응답(Response)**을 돌려줍니다.

* 데이터는 주로 **JSON (JavaScript Object Notation)** 형식(키-값 쌍, 파이썬의 딕셔너리 형태)으로 주고받습니다.

### 1-2. HTTP 메서드 (CRUD 기본)

백엔드 API는 보통 URL과 행동(Method)을 조합하여 만듭니다.

* **GET** (조회): 데이터를 가져올 때 (예: `GET /api/v1/albums` -> 앨범 목록 조회)
* **POST** (생성): 새로운 데이터를 만들 때 (예: `POST /api/v1/albums` -> 새 앨범 생성)
* **PUT / PATCH** (수정): 기존 데이터를 바꿀 때 (예: `PUT /api/v1/albums/123` -> 앨범 이름 수정)
* **DELETE** (삭제): 데이터를 지울 때 (예: `DELETE /api/v1/albums/123` -> 앨범 삭제)

### 1-3. ORM (Object-Relational Mapping)이란?
* 과거에는 파이썬에서 DB 데이터를 다루려면 `SELECT * FROM albums WHERE user_id = '...'` 같은 원시 SQL 문장을 직접 써야 했습니다.


* **ORM(SQLAlchemy)**을 쓰면, SQL 대신 파이썬 클래스 객체(`db.query(Album).filter(...)`)로 데이터를 다룰 수 있습니다. DB가 바뀌어도(SQLite ➔ PostgreSQL) 코드를 고칠 필요가 없는 마법 같은 도구입니다.

---

## 2. Habitus 백엔드 전체 아키텍처 개요

우리 백엔드는 **계층화 아키텍처(Layered Architecture)**로 깔끔하게 분리되어 있습니다.

```
backend/
├── app/
│   ├── core/           # [설정 & 인프라] 환경변수(.env), DB 세션 연결
│   ├── models/         # [DB 설계도] SQLAlchemy ORM 테이블 클래스 정의
│   ├── schemas/        # [데이터 검증] Pydantic 입출력 데이터 규격 정의
│   ├── services/       # [비즈니스 로직] TMDB, iTunes, MusicBrainz 외부 API 연동
│   ├── api/            # [API 엔드포인트]
│   │   ├── routes/     # URL 경로별 요청 처리 (albums, items, search 등)
│   │   └── dependencies.py  # 공통 의존성 (DB 세션 제공, 유저 인증)
│   └── main.py         # [진입점] FastAPI 앱 시작, CORS 설정, 라우터 등록
├── habitus.db          # 실제 SQLite DB 파일
├── requirements.txt    # 파이썬 패키지 목록
└── .env                # 비밀 키, DB URL 등 환경 설정 파일
```

---

## 3. 설정 & 데이터베이스 연결 계층 (`app/core`)

### 3-1. `app/core/config.py` (환경변수 관리)
* **역할**: `.env` 파일에 있는 비밀번호, API 키, DB 주소 등을 파이썬에서 쓰기 쉽게 객체로 불러옵니다.
* `pydantic-settings`의 `BaseSettings`를 상속받아 타입을 자동 검사합니다.
* `DATABASE_URL: str` -> DB 연결 주소 (현재 `sqlite:///./habitus.db`)

### 3-2. `app/core/database.py` (DB 연결 및 세션 관리)

* **`engine`**: 실제 데이터베이스와 연결 통로를 엽니다.
* **`SessionLocal`**: 데이터베이스와 대화할 수 있는 '작업 단위(세션)'를 만드는 공장입니다.
* **`Base`**: 모든 DB 테이블 클래스가 상속받는 부모 클래스입니다.
* **`get_db()`**: 요청이 들어올 때 DB 세션을 하나 열어주고(`yield db`), 요청 처리가 끝나면 안전하게 닫아주는(`db.close()`) 핵심 함수입니다.

---

## 4. 데이터베이스 모델 계층 (`app/models`)

데이터가 DB 테이블에 어떤 모양으로 저장될지를 정의합니다.

### 4-1. `app/models/archive.py` (핵심 도메인 모델)

```
[ User (유저) ]
       │ 1:N
       ├───────────────────────────────┐
       ▼ 1:N                           ▼ 1:N
   [ Mix (믹스) ]                   [ Album (앨범) ]
       │                               │
       │ N:M (mix_items)               │ N:M (album_items)
       └──────────────┬────────────────┘
                      ▼
                 [ Item (아이템) ] ──1:N──▶ [ ItemLink (외부링크) ]
                 (음악, 영화, 책, 미술 등)
```

1. **`User`**: 사용자 테이블 (`id`, `username`, `created_at`).

2. **`Mix`**: 대분류 폴더/컬렉션 (`title`, `cover_image`, `is_public` 등). 여러 개의 앨범이나 아이템을 묶을 수 있습니다.

3. **`Album`**: 소분류 앨범 (`title`, `category`, `is_public`). 음악/영화/책/미술 등 카테고리별로 아이템을 묶습니다.

4. **`Item` (가장 중요한 테이블)**:
   * 모든 종류의 콘텐츠(음악 트랙, 영화, 도서 등)를 하나로 담는 범용 테이블입니다.
   * `item_type`: "music", "movie", "book", "art" 등
   * `rating`, `status`("want", "archived" 등), `cover_image_url`, `dominant_color`
   * `media_meta` (JSON 컬럼): 음악이면 `{artist, album, duration}`, 영화면 `{director, runtime}`, 책이면 `{author, isbn}` 처럼 자유롭게 저장!

5. **다대다(N:M) 중간 테이블**:
   * `album_items`: 하나의 앨범에 여러 아이템이 들어가고, 하나의 아이템도 여러 앨범에 속할 수 있습니다. `order_index`로 순서를 기억합니다.
   * `mix_albums`, `mix_items`: 믹스와 앨범/아이템 간의 연결 테이블.


### 4-2. `app/models/catalog.py` (외부 메타데이터 캐시)
* **`CatalogEntry`**: 유저가 검색한 MusicBrainz, TMDB, Google Books의 데이터를 저장해 두는 캐시 테이블입니다.
* 똑같은 영화나 음악을 다시 검색할 때 외부 API를 매번 부르지 않고 우리 DB에서 초고속으로 꺼내줍니다.

---

## 5. 데이터 검증 & 전송 계층 (`app/schemas`)

> ❓ **"DB Model이 있는데 왜 Pydantic Schema가 또 필요한가요?"**
> * **DB Model (`models/`)**: 실제 데이터베이스 테이블의 형태 (내부 데이터 구조)
> * **Pydantic Schema (`schemas/`)**: 사용자가 화면에서 보낸 데이터가 올바른지 검사하고, 사용자에게 돌려줄 데이터만 골라내는 **'출입국 심사표'** (보안 & 유효성 검사)

* **`schemas/album.py`**:
  * `AlbumCreate`: 앨범을 새로 만들 때 프론트엔드가 보내야 하는 데이터 (`title`, `category`, `is_public`)
  * `AlbumResponse`: 클라이언트에게 결과를 돌려줄 때 사용하는 규격
* **`schemas/item.py`**:
  * `ItemCreate`: 아이템 생성 요청 데이터 검증
  * `ItemResponse`: 클라이언트에 내려줄 아이템 상세 정보

---

## 6. 외부 API 연동 & 비즈니스 서비스 계층 (`app/services`)

유저가 원하는 콘텐츠(음악, 영화, 책)를 검색할 때 외부 공공 데이터베이스와 통신합니다.

* `musicbrainz.py` & `discogs.py` & `itunes.py`: 전 세계 음악 앨범, 트랙, 아티스트, 커버 이미지 검색
* `tmdb.py`: 영화/시리즈 제목, 감독, 포스터, 줄거리 검색 (The Movie Database API)
* `google_books.py`: 도서 제목, 저자, 출판사, 책 표지 검색
* `http_client.py`: 외부 API와 통신할 때 사용하는 비동기 고속 HTTP 클라이언트 (`httpx`)

---

## 7. API 라우트 & 컨트롤러 계층 (`app/api/routes`)

프론트엔드와 직접 맞닿는 URL 창구입니다.

* `search.py` (`/api/v1/search`):
  * `GET /search/all?q=인셉션` -> 음악, 영화, 책을 한 번에 통합 검색
* `albums.py` (`/api/v1/albums`):
  * `GET /` -> 내 앨범 목록 가져오기
  * `POST /` -> 새 앨범 만들기
  * `POST /{album_id}/items` -> 앨범에 아이템 추가하기
  * `DELETE /{album_id}/items/{item_id}` -> 앨범에서 아이템 제거하기
* `items.py` (`/api/v1/items`):
  * 아카이빙된 개별 아이템들의 CRUD 및 상태 변경
* `mixes.py` (`/api/v1/mixes`):
  * 믹스 컬렉션 관리

---

## 8. 의존성 주입 & 인증 계층 (`app/api/dependencies.py`)

FastAPI의 가장 강력한 기능인 **의존성 주입(Dependency Injection)**이 들어있는 곳입니다.

```python
def get_current_user(db: Session = Depends(get_db)) -> User:
    # 현재는 개발 모드: 첫 번째 유저(tester)를 자동으로 꺼내줌
    user = db.query(User).first()
    if not user:
        user = User(username="tester")
        db.add(user)
        db.commit()
    return user
```

* **동작 방식**: 라우트 함수에 `current_user: User = Depends(get_current_user)`를 적어두면, FastAPI가 요청이 올 때마다 알아서 유저를 찾아 함수 안에 쏙 넣어줍니다.
* **Firebase 연동 시**: 이곳의 로직만 "Firebase 토큰 검증 ➔ 해당 UID 유저 조회"로 바꿔주면 백엔드 전체에 로그인이 즉시 적용됩니다!

---

## 9. 요청(Request)에서 응답(Response)까지의 전체 흐름 예시

사용자가 **"새 앨범 만들기"** 버튼을 눌렀을 때 백엔드 내부에서 일어나는 6단계:

```
1. [클라이언트 (React)] 
   POST /api/v1/albums 요청 
   Body: {"title": "내 인생 영화들", "category": "movie"}

2. [main.py]
   CORS 검사 통과 후 `/api/v1/albums` 라우터로 전달

3. [schemas/album.py]
   `AlbumCreate` 스키마가 들어온 데이터의 타입이 맞는지 검증

4. [api/dependencies.py]
   `get_db()`로 DB 세션 생성 + `get_current_user`로 현재 로그인한 유저 가져오기

5. [api/routes/albums.py]
   `Album(title="내 인생 영화들", category="movie", user_id=current_user.id)` 객체 생성 후
   `db.add(db_album)` ➔ `db.commit()`으로 DB에 영구 저장

6. [클라이언트 (React)]
   `AlbumResponse` 규격에 맞춰 생성된 앨범 JSON 데이터를 201 Created로 응답 수신!
```

---

💡 **궁금한 부분이 생기면 언제든 질문해 주세요! 특정 파일의 코드 한 줄 한 줄까지 자세하게 풀어 설명해 드릴게요.**
