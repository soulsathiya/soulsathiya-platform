from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, date
from enum import Enum


class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class MaritalStatus(str, Enum):
    NEVER_MARRIED = "never_married"
    DIVORCED = "divorced"
    WIDOWED = "widowed"
    AWAITING_DIVORCE = "awaiting_divorce"


class Religion(str, Enum):
    HINDU = "hindu"
    MUSLIM = "muslim"
    CHRISTIAN = "christian"
    SIKH = "sikh"
    BUDDHIST = "buddhist"
    JAIN = "jain"
    PARSI = "parsi"
    OTHER = "other"
    NO_RELIGION = "no_religion"


class EducationLevel(str, Enum):
    HIGH_SCHOOL = "high_school"
    BACHELORS = "bachelors"
    MASTERS = "masters"
    DOCTORATE = "doctorate"
    DIPLOMA = "diploma"
    OTHER = "other"


class ProfileBase(BaseModel):
    user_id: str
    date_of_birth: date
    gender: Gender
    phone_number: str = Field(..., pattern=r"^[6-9]\d{9}$")
    
    # Demographics
    marital_status: MaritalStatus
    height_cm: Optional[int] = Field(None, ge=120, le=250)
    religion: Optional[Religion] = None
    caste: Optional[str] = None
    mother_tongue: Optional[str] = None
    
    # Location
    city: str
    state: str
    country: str = "India"
    
    # Education & Career
    education_level: EducationLevel
    education_details: Optional[str] = None
    occupation: str
    annual_income: Optional[str] = None
    
    # Lifestyle
    diet: Optional[str] = None  # vegetarian, non-vegetarian, vegan
    drinking: Optional[str] = None  # never, occasionally, regularly
    smoking: Optional[str] = None  # never, occasionally, regularly
    
    # About
    bio: Optional[str] = Field(None, max_length=1000)
    hobbies: Optional[List[str]] = []
    
    # Social Media
    linkedin_url: Optional[str] = None
    instagram_handle: Optional[str] = None


class ProfileCreate(ProfileBase):
    pass


class ProfileUpdate(BaseModel):
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    phone_number: Optional[str] = None
    marital_status: Optional[MaritalStatus] = None
    height_cm: Optional[int] = None
    religion: Optional[Religion] = None
    caste: Optional[str] = None
    mother_tongue: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    education_level: Optional[EducationLevel] = None
    education_details: Optional[str] = None
    occupation: Optional[str] = None
    annual_income: Optional[str] = None
    diet: Optional[str] = None
    drinking: Optional[str] = None
    smoking: Optional[str] = None
    bio: Optional[str] = None
    hobbies: Optional[List[str]] = None
    linkedin_url: Optional[str] = None
    instagram_handle: Optional[str] = None


class Profile(ProfileBase):
    model_config = ConfigDict(from_attributes=True)
    
    profile_id: str
    completion_percentage: int = 0
    created_at: datetime
    updated_at: datetime
