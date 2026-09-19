from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
#reading .env
from app.core.config import settings
from app.api.routes.api import api_router
#read engine
from app.core.database import engine, Base
from app.models import archive, catalog

#if input uvicorn app.main:app --reload, python operate this file from up and bottom

# Create tables
# Database table model is defined in app.models and import the
#basic SQL ALchemy
#archiveItem, album all are derived from base
#app/ model안에 있는 db 테이블을 상속받아서 만든다.
# Base.metadata.create_all(bind=engine) # Removed for Alembic
#metada는 데이터베이스의 클래스 설계도 모음
#create_all -- > habitus.db에 접속
#db에 없는 테이블이 있는지 확인하고 생성하는 명령

#making server object that we use 
#Web server object
app = FastAPI(title=settings.PROJECT_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json")
#cors problem 웹브라우저는 보안을 위해 출처(도메인, 포트)가 다르면 API요청을 기본적으로 차단
#5173, 8000 다르니까 프론트엔드에서 백엔드로 API 호출 불가
# Configure CORS for frontend access (Vite default is 5173)
# Only admit request from frontend of below address
#middleware는 요청을 가로채서 CORS설정에 따라 허용/차단 하는 중간 브라우저

#REACT는 화면을 만드는 코드 자체, 버튼, 사이드바, 카드 등을 만드는 도구

#VITE는 REACT 코드를 웹 브라우저가 읽을 수 있도록 변환
#실시간으로 화면을 띄워주는 로컬 개발 서버 도구

#VITE는 REACT 코드를 HTML로 변환해서 브라우저에게 전송하는 로컬 서버이다

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        #프론트앤드 주소 목록
        "http://localhost:5173",
        #VITE 로컬 주소
        "http://localhost:3000",
        #REACT LOCAL 주소
        "http://127.0.0.1:5173",
        # ngrok / 외부 배포 URL 지원 (MVP 테스트용)
        "https://*.ngrok-free.app",
        #외부 테스트용 N GROK주소
        "https://*.ngrok.io",
    ],
    allow_origin_regex=r"https://.*\.ngrok(-free)?\.app",  # ngrok 동적 URL 허용
    #쿠키/인증 정보 전송 허용
    allow_credentials=True,
    #HTTP Methods ㅓㅎ용
    allow_methods=["*"],
    #
    allow_headers=["*"],
)

# API router import from api/routes/api.py
# 기능별로 쪼개놓은 API 주소들을 메인 서버에 한 번에 꽃아주는 모드
app.include_router(api_router, prefix=settings.API_V1_STR)
# ↑ /api/v1/... 로 시작하는 모든 요청을 api_router에게 넘긴다

# @ 파이썬 데코레이터 문법
#이 함수가 언제 실행되는지 FAST API 서버에 규칙 등록
#클라이언트가 기본 주소 root주소 + /에 접속하면 readRoot실행

@app.get("/")
def read_root():
    #json 반환
    #표준 데이터 형식 json형식
    #key : data
    return {"message": "Welcome to Habitus API"}

#checking server alive
@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.on_event("startup")
def startup_event():
    import threading
    import logging
    from app.services.embedding_service import _get_model
    logger = logging.getLogger(__name__)
    logger.info("Initializing embedding model in background...")
    threading.Thread(target=_get_model, daemon=True).start()
