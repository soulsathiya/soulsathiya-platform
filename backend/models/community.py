from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime


class CommunityBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    category: str  # profession, religion_sect, regional, etc.
    description: Optional[str] = None
    is_active: bool = True


class CommunityCreate(CommunityBase):
    pass


class Community(CommunityBase):
    model_config = ConfigDict(from_attributes=True)
    
    community_id: str
    member_count: int = 0
    created_at: datetime


class UserCommunityMembership(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    user_id: str
    community_id: str
    joined_at: datetime
