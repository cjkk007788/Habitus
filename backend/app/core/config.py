from pydantic_settings import BaseSettings
#getting from .env
from functools import lru_cache

#Enviroment variable loading
#KEY, DB_URL, Project meta data
class Settings(BaseSettings):
    PROJECT_NAME: str = "Habitus API"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str
    DEBUG: bool = True
    
    # External API Keys (Phase 3)
    LASTFM_API_KEY: str | None = None
    LASTFM_SHARED_SECRET: str | None = None
    DISCOGS_API_KEY: str | None = None
    DISCOGS_API_SECRET: str | None = None

    # TMDB API Keys
    TMDB_API_KEY: str | None = None
    TMDB_READ_ACCESS_TOKEN: str | None = None

    class Config:
        #this parameter is defined at BaseSettings
        env_file = ".env"
        extra = "ignore"

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()

#class Config를 보고 "아, .env 파일을 읽어야겠구나" 하고 파일을 엽니다.

#Settings 클래스 안에 적혀있는 변수명(예: DATABASE_URL: str)을 확인합니다.

#
#.env 파일 안에서 DATABASE_URL= 뒤에 적힌 값을 찾습니다.

#값을 찾으면 파이썬 변수에 쏙 집어넣어 줍니다. 
#만약 못 찾으면 기본값(예: DEBUG: bool = True)을 쓰거나 에러를 냅니다.


#