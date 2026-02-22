from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum


class AdminRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    MODERATOR = "moderator"
    SUPPORT = "support"


class AdminUser(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    admin_id: str
    email: EmailStr
    full_name: str
    role: AdminRole
    is_active: bool = True
    created_at: datetime
    last_login: Optional[datetime] = None


class AdminLogin(BaseModel):
    email: EmailStr
    password: str


class DashboardMetrics(BaseModel):
    total_users: int
    active_users: int
    total_matches: int
    deep_exploration_unlocked: int
    deep_reports_completed: int
    subscriptions_by_tier: dict
    boost_purchases: int
    revenue_this_month: float
