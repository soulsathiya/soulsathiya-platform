from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from typing import Optional, List
from datetime import datetime
import re

DELETED_ACCOUNT_ERROR = "Account has been deleted. Contact support if this is a mistake."


class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)


class UserCreate(UserBase):
    password: Optional[str] = Field(None, min_length=8)
    is_google_auth: bool = False
    google_id: Optional[str] = None
    picture: Optional[str] = None
    terms_accepted: bool = False

    @field_validator('full_name')
    @classmethod
    def validate_full_name(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Full name must be at least 2 characters')
        if not re.match(r"^[a-zA-Z0-9\s\.\-']{2,100}$", v):
            raise ValueError('Full name contains invalid characters')
        return v.strip()


class User(UserBase):
    model_config = ConfigDict(from_attributes=True)
    
    user_id: str
    picture: Optional[str] = None
    is_email_verified: bool = False
    is_profile_complete: bool = False
    is_verified: bool = False
    verification_badge: Optional[str] = None
    subscription_status: str = "free"
    subscription_tier: Optional[str] = None
    terms_accepted_at: Optional[datetime] = None
    terms_version: Optional[str] = None
    is_active: bool = True
    status: str = "active"
    deleted_at: Optional[datetime] = None
    created_at: datetime
    last_login: Optional[datetime] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class SessionData(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    session_token: str
