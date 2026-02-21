from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class QuestionType(str, Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    SCALE = "scale"  # 1-10 scale
    YES_NO = "yes_no"
    TEXT = "text"


class QuestionCategory(str, Enum):
    PERSONALITY = "personality"
    VALUES = "values"
    LIFESTYLE = "lifestyle"
    RELATIONSHIP_GOALS = "relationship_goals"
    COMPATIBILITY = "compatibility"


class QuestionBase(BaseModel):
    question_text: str
    question_type: QuestionType
    category: QuestionCategory
    options: Optional[List[str]] = []  # For multiple choice
    scale_min: Optional[int] = None
    scale_max: Optional[int] = None
    weight: float = 1.0  # For compatibility scoring
    is_active: bool = True


class QuestionCreate(QuestionBase):
    pass


class Question(QuestionBase):
    model_config = ConfigDict(from_attributes=True)
    
    question_id: str
    display_order: int
    created_at: datetime


class ResponseBase(BaseModel):
    user_id: str
    question_id: str
    answer: Any  # Can be string, number, or boolean


class ResponseCreate(ResponseBase):
    pass


class Response(ResponseBase):
    model_config = ConfigDict(from_attributes=True)
    
    response_id: str
    answered_at: datetime


class PsychometricScore(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    user_id: str
    category_scores: Dict[str, float]
    overall_score: float
    completed_at: datetime
