from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    INCLUDED = "included"  # For Elite tier


class DeepExplorationStatus(str, Enum):
    UNLOCKED = "unlocked"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class DeepExplorationPair(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    pair_id: str
    user_a_id: str
    user_b_id: str
    unlocked_by_user: str
    tier_at_unlock: str  # free, premium, elite
    payment_status: PaymentStatus
    razorpay_payment_id: Optional[str] = None
    started_users: List[str] = []
    completed_users: List[str] = []
    status: DeepExplorationStatus = DeepExplorationStatus.UNLOCKED
    unlocked_at: datetime
    completed_at: Optional[datetime] = None


class DeepModuleScores(BaseModel):
    expectations_roles: float
    conflict_repair: float
    attachment_trust: float
    lifestyle_integration: float
    intimacy_communication: float
    family_inlaw_dynamics: float


class DeepPsychometricProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    profile_id: str
    user_id: str
    pair_id: str
    module_scores: DeepModuleScores
    raw_responses: List[Dict[str, Any]]
    completed_at: datetime
    created_at: datetime


class PairDynamics(BaseModel):
    expectation_alignment: float
    conflict_dynamics: float
    attachment_pair_type: str
    lifestyle_friction: float
    family_integration: float
    deep_compatibility_score: float


class DeepCompatibilityReport(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    report_id: str
    pair_id: str
    user_a_id: str
    user_b_id: str
    dimension_scores: PairDynamics
    deep_score: float
    strengths: List[str]
    growth_areas: List[str]
    risks: List[str]
    conversation_prompts: List[str]
    long_term_outlook: str
    generated_at: datetime


class DeepUnlockRequest(BaseModel):
    partner_user_id: str
