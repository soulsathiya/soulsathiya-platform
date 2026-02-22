from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, List, Any
from datetime import datetime
from enum import Enum


class PsychometricDomain(str, Enum):
    EMOTIONAL = "emotional_style"
    PERSONALITY = "personality"
    VALUES = "values"
    TRUST = "trust_attachment"
    LIFESTYLE = "lifestyle"
    GROWTH = "growth_mindset"
    EXPECTATIONS = "marriage_expectations"


class QuestionType(str, Enum):
    LIKERT_5 = "likert_5"  # 1-5 scale
    LIKERT_7 = "likert_7"  # 1-7 scale
    BINARY = "binary"  # Yes/No
    CHOICE = "multiple_choice"


class PsychometricQuestion(BaseModel):
    question_id: str
    domain: PsychometricDomain
    question_text: str
    question_type: QuestionType
    options: Optional[List[str]] = None
    reverse_scored: bool = False
    weight: float = 1.0


class PsychometricResponse(BaseModel):
    question_id: str
    response: Any  # Can be int (1-5, 1-7), bool, or string


class PsychometricProfileCreate(BaseModel):
    responses: List[PsychometricResponse]


class DomainScores(BaseModel):
    emotional_style: float
    personality: float
    values: float
    trust_attachment: float
    lifestyle: float
    growth_mindset: float
    marriage_expectations: float


class ArchetypeType(str, Enum):
    HARMONIZER = "harmonizer"
    ACHIEVER = "achiever"
    GUARDIAN = "guardian"
    EXPLORER = "explorer"
    NURTURER = "nurturer"
    TRADITIONALIST = "traditionalist"
    MODERNIST = "modernist"


class PsychometricProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    profile_id: str
    user_id: str
    raw_responses: List[Dict[str, Any]]
    domain_scores: DomainScores
    archetype_primary: Optional[ArchetypeType] = None
    archetype_secondary: Optional[ArchetypeType] = None
    lie_score: float = 0.0
    completed_at: datetime
    created_at: datetime


class CompatibilityScore(BaseModel):
    compatibility_percentage: float
    domain_breakdown: Dict[str, float]
    strengths: List[str]
    differences: List[str]
    risks: List[str]
    communication_tip: str


class MatchWithCompatibility(BaseModel):
    match_id: str
    user_id: str
    matched_user_id: str
    compatibility_score: float
    profile_score: float
    preference_score: float
    psychometric_score: float
    distance_km: Optional[float]
    is_boosted: bool
    compatibility_details: Optional[CompatibilityScore] = None
