from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum


class MatchStatus(str, Enum):
    PENDING = "pending"
    COMPUTED = "computed"
    FILTERED = "filtered"


class Match(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    match_id: str
    user_id: str
    matched_user_id: str
    compatibility_score: float = Field(..., ge=0, le=100)
    profile_score: float = 0.0
    preference_score: float = 0.0
    psychometric_score: float = 0.0
    distance_km: Optional[float] = None
    status: MatchStatus = MatchStatus.PENDING
    computed_at: datetime
    last_updated: datetime


class MatchFilter(BaseModel):
    min_compatibility: Optional[float] = Field(None, ge=0, le=100)
    max_distance_km: Optional[int] = None
    community_ids: Optional[list[str]] = []
    age_min: Optional[int] = None
    age_max: Optional[int] = None
