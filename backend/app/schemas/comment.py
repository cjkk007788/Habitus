from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID

class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    pass

class CommentUpdate(CommentBase):
    pass

class CommentResponse(CommentBase):
    id: UUID
    album_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    
    # User's username could be useful for frontend
    username: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
