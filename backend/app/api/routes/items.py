from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.api.dependencies import get_db, get_current_user
from app.models.archive import Item, User
from app.schemas.item import ItemCreate, ItemUpdate, ItemResponse

router = APIRouter()

#If frontend sent post address /, this function working
#Make jason data to pydantic object
#in router.post fast api engine do analysis the paramiter types
# Then they transfrom automatically to object pydantic
#Router.post is checking parameter. ex db session has depends so not fitting jason body
#ItemCreate, checking class it inherits baseModel so give the json body
@router.post("/", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
def create_item(
    #parameter
    #ItemCreate in schmeas itemclass inherites basemodel from pyndatic it clear validation
    #ItemCreate has attributes title, item_type, external_id, external_source, rating, impression, description, cover_image, dominant_color, genres, is_public, media_meta, user_meta, links
    
    item_in: ItemCreate,
    db: Session = Depends(get_db),
    #의존성 주입
    #get_db is function that make a session, so we can use db in this function
    #get_current_user is function that get current user
    current_user: User = Depends(get_current_user)
    #checking http imformation and checking to token is real
    #connecting User object current_user

    #Depends is connecting DB with user
):
    # Pydantic 스키마를 dictionarly
    item_data = item_in.model_dump(exclude={"links"})
    #dictionary --> SQLALchemy 변환
    db_item = Item(**item_data, user_id=current_user.id)
    
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    # TODO: Links 저장 로직 추가 (ItemLink 테이블)
    
    return db_item

#response_model = List[ItemResponse] is telling to fast api engine that the return type is list of ItemResponse
#getting user's item lists
@router.get("/", response_model=List[ItemResponse])
def read_items(
    skip: int = 0,
    limit: int = 100,
    #conntecting DB
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
    
):
    #this is ORM.
    #Find Item table in db, User.id = current_id
    items = db.query(Item).filter(Item.user_id == current_user.id).offset(skip).limit(limit).all()
    return items

@router.get("/{item_id}", response_model=ItemResponse)
def read_item(
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(Item).filter(Item.id == item_id, Item.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@router.put("/{item_id}", response_model=ItemResponse)
def update_item(
    item_id: UUID,
    item_in: ItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_item = db.query(Item).filter(Item.id == item_id, Item.user_id == current_user.id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    update_data = item_in.model_dump(exclude_unset=True, exclude={"links"})
    for field, value in update_data.items():
        setattr(db_item, field, value)
        
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_item = db.query(Item).filter(Item.id == item_id, Item.user_id == current_user.id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db.delete(db_item)
    db.commit()
    return None
