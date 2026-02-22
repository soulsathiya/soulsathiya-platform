from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from .profile import Gender, MaritalStatus, Religion, EducationLevel


class PartnerPreferenceBase(BaseModel):
    user_id: str
    
    # Age range
    age_min: int = Field(..., ge=18, le=100)
    age_max: int = Field(..., ge=18, le=100)
    
    # Height range
    height_min: Optional[int] = Field(None, ge=120, le=250)
    height_max: Optional[int] = Field(None, ge=120, le=250)
    
    # Demographics
    preferred_marital_status: Optional[List[MaritalStatus]] = []
    preferred_religion: Optional[List[Religion]] = []
    
    # Location
    preferred_cities: Optional[List[str]] = []
    preferred_states: Optional[List[str]] = []
    max_distance_km: Optional[int] = None
    
    # Education & Career
    preferred_education: Optional[List[EducationLevel]] = []
    preferred_occupation: Optional[List[str]] = []
    
    # Lifestyle
    preferred_diet: Optional[List[str]] = []
    preferred_drinking: Optional[List[str]] = []
    preferred_smoking: Optional[List[str]] = []


class PartnerPreferenceCreate(PartnerPreferenceBase):
    pass


class PartnerPreferenceUpdate(BaseModel):
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    height_min: Optional[int] = None
    height_max: Optional[int] = None
    preferred_marital_status: Optional[List[MaritalStatus]] = None
    preferred_religion: Optional[List[Religion]] = None
    preferred_cities: Optional[List[str]] = None
    preferred_states: Optional[List[str]] = None
    max_distance_km: Optional[int] = None
    preferred_education: Optional[List[EducationLevel]] = None
    preferred_occupation: Optional[List[str]] = None
    preferred_diet: Optional[List[str]] = None
    preferred_drinking: Optional[List[str]] = None
    preferred_smoking: Optional[List[str]] = None


class PartnerPreference(PartnerPreferenceBase):
    model_config = ConfigDict(from_attributes=True)
    
    preference_id: str
    created_at: datetime
    updated_at: datetime
