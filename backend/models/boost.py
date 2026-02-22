from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum


class BoostStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    PENDING_PAYMENT = "pending_payment"


class BoostDuration(str, Enum):
    HOURS_24 = "24_hours"
    HOURS_48 = "48_hours"
    WEEK = "1_week"


class BoostPlan(BaseModel):
    duration: BoostDuration
    price: float
    name: str
    description: str


class BoostBase(BaseModel):
    user_id: str
    duration: BoostDuration
    price_paid: float


class BoostCreate(BaseModel):
    duration: BoostDuration


class Boost(BoostBase):
    model_config = ConfigDict(from_attributes=True)
    
    boost_id: str
    status: BoostStatus = BoostStatus.PENDING_PAYMENT
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    started_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class BoostPaymentResponse(BaseModel):
    boost_id: str
    razorpay_order_id: str
    razorpay_key_id: str
    amount: float
    currency: str = "INR"
