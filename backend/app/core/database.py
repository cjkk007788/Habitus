#데이터 베이스와 파이썬을 연결하는 부분
#sqlalchemy 는 orm object realational mapping
#쿼리문 대신 파이썬 코드와 객체로 db조작

#데이터베이스와 연결통로를 생성하는 함수
from sqlalchemy import create_engine

#파이썬 객체와 db 테이블을 이어주는 도구가 모여있음
#session maker 객체는 데이터를 주고 받는 통로
#읽거나 쓸때 session 객체를 이용
#decalartive_base는 db 테이블을 파이썬 클래스로 만들기 위한
#부모 설계도를 생성
#파이썬 클래스를 DB처럼 사용하기위한 최상단 객체
#Archive item, album같은 파이썬 테이블이 이걸 상속받아서 db처럼 사용하게 됨

from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# sqlite not support multi thread, 
connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
#line for connecting db
#db와 연결
engine = create_engine(settings.DATABASE_URL, echo=settings.DEBUG, connect_args=connect_args)

#DATABASE URL, In developing we can see qurey in terminal, making multi thread operating
#Database connection pool
#it's like thread
#db와  소통할놈 연결
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
#Sessionmaker is commnuicate db, whenever checking db, new is session made
#Declarative Base
#Base is parent class of every table class
#db생성
Base = declarative_base()

#Every table classes inherit this base()
#FastAPI use Depends(get_db)
#get_db yield session
#실제 객체를 만들고 반환
def get_db():
    #make session
    db = SessionLocal()
    try:
        yield db
        #give session to router
    finally:
        #close session
        db.close()
