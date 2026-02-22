from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum


class SubscriptionTier(str, Enum):
    FREE = "free"
    BASIC = "basic"
    PREMIUM = "premium"
    ELITE = "elite"


class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class SubscriptionBase(BaseModel):
    user_id: str
    tier: SubscriptionTier
    razorpay_subscription_id: Optional[str] = None
    razorpay_plan_id: Optional[str] = None


class SubscriptionCreate(SubscriptionBase):
    pass


class Subscription(SubscriptionBase):
    model_config = ConfigDict(from_attributes=True)
    
    subscription_id: str
    status: SubscriptionStatus = SubscriptionStatus.ACTIVE
    started_at: datetime
    expires_at: Optional[datetime] = None
    auto_renew: bool = True
    created_at: datetime
    updated_at: datetime


class PaymentTransaction(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    transaction_id: str
    user_id: str
    subscription_id: str
    razorpay_payment_id: str
    razorpay_order_id: str
    amount: float
    currency: str = "INR"
    status: str
    created_at: datetime
