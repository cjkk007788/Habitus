from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.archive import User

# 임시 인증용 의존성 (추후 JWT 도입 시 교체)
def get_current_user(db: Session = Depends(get_db)) -> User:
    # MVP 테스트를 위해 첫 번째 유저를 무조건 가져오거나 생성합니다.
    user = db.query(User).first()
    if not user:
        user = User(username="tester")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user
