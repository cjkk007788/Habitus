from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# sqlite not support multi thread, 
connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
#line for connecting db
engine = create_engine(settings.DATABASE_URL, echo=settings.DEBUG, connect_args=connect_args)

#DATABASE URL, In developing we can see qurey in terminal, making multi thread operating
#Database connection pool
#it's like thread
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
#Sessionmaker is commnuicate db, whenever checking db, new is session made
#Declarative Base
#Base is parent class of every table class
Base = declarative_base()

#Every table classes inherit this base()
#FastAPI use Depends(get_db)
#get_db yield session
def get_db():
    #make session
    db = SessionLocal()
    try:
        yield db
        #give session to router
    finally:
        #close session
        db.close()
