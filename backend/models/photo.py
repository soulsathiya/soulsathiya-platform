from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class PhotoBase(BaseModel):
    user_id: str
    is_primary: bool = False
    is_hidden: bool = False


class PhotoUpload(BaseModel):
    is_primary: bool = False
    is_hidden: bool = False


class Photo(PhotoBase):
    model_config = ConfigDict(from_attributes=True)
    
    photo_id: str
    file_name: str
    s3_key: str
    s3_url: str
    thumbnail_url: Optional[str] = None
    display_order: int = 0
    uploaded_at: datetime


class PhotoReorder(BaseModel):
    photo_id: str
    new_order: int
