from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum


class InterestStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"


class InterestBase(BaseModel):
    from_user_id: Optional[str] = None   # set server-side from session; not required in request body
    to_user_id: str
    message: Optional[str] = None


class InterestCreate(InterestBase):
    pass


class Interest(InterestBase):
    model_config = ConfigDict(from_attributes=True)
    
    interest_id: str
    status: InterestStatus = InterestStatus.PENDING
    sent_at: datetime
    responded_at: Optional[datetime] = None


class InterestResponse(BaseModel):
    interest_id: str
    action: str  # accept or reject
    message: Optional[str] = None
