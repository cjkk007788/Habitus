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
Base.metadata.create_all(bind=engine)
# ↑ models/ 폴더에 정의된 테이블이 DB 파일에 없으면 자동 생성

#making server object that we use 
#Web server object
app = FastAPI(title=settings.PROJECT_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json")

# Configure CORS for frontend access (Vite default is 5173)
# Only admit request from frontend of below address
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        # ngrok / 외부 배포 URL 지원 (MVP 테스트용)
        "https://*.ngrok-free.app",
        "https://*.ngrok.io",
    ],
    allow_origin_regex=r"https://.*\.ngrok(-free)?\.app",  # ngrok 동적 URL 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API router import from api/routes/api.py
app.include_router(api_router, prefix=settings.API_V1_STR)
# ↑ /api/v1/... 로 시작하는 모든 요청을 api_router에게 넘긴다

@app.get("/")
def read_root():
    return {"message": "Welcome to Habitus API"}

#checking server alive
@app.get("/health")
def health_check():
    return {"status": "ok"}
