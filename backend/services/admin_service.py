from typing import Dict, List, Optional
from datetime import datetime, timezone, timedelta
import uuid
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AdminService:
    def __init__(self, db):
        self.db = db
    
    def hash_password(self, password: str) -> str:
        return pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)
    
    async def authenticate_admin(self, email: str, password: str) -> Optional[Dict]:
        """Authenticate admin user"""
        admin = await self.db.admin_users.find_one({"email": email}, {"_id": 0})
        
        if not admin or not admin.get("is_active"):
            return None
        
        if not self.verify_password(password, admin.get("password_hash", "")):
            return None
        
        # Update last login
        await self.db.admin_users.update_one(
            {"admin_id": admin["admin_id"]},
            {"$set": {"last_login": datetime.now(timezone.utc)}}
        )
        
        return admin
    
    async def create_admin_session(self, admin_id: str) -> str:
        """Create admin session token"""
        session_token = f"admin_session_{uuid.uuid4().hex}"
        expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
        
        session_doc = {
            "admin_id": admin_id,
            "session_token": session_token,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc)
        }
        
        await self.db.admin_sessions.insert_one(session_doc)
        return session_token
    
    async def verify_admin_session(self, session_token: str) -> Optional[Dict]:
        """Verify admin session and return admin user"""
        session = await self.db.admin_sessions.find_one(
            {"session_token": session_token},
            {"_id": 0}
        )
        
        if not session:
            return None
        
        expires_at = session["expires_at"]
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        
        if expires_at < datetime.now(timezone.utc):
            await self.db.admin_sessions.delete_one({"session_token": session_token})
            return None
        
        admin = await self.db.admin_users.find_one(
            {"admin_id": session["admin_id"]},
            {"_id": 0}
        )
        
        return admin
    
    async def get_dashboard_metrics(self) -> Dict:
        """Get admin dashboard metrics"""
        # Total users
        total_users = await self.db.users.count_documents({})
        
        # Active users (logged in last 30 days)
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        active_users = await self.db.users.count_documents({
            "last_login": {"$gte": thirty_days_ago}
        })
        
        # Total matches
        total_matches = await self.db.matches.count_documents({"status": "computed"})
        
        # Deep exploration metrics
        deep_unlocked = await self.db.deep_exploration_pairs.count_documents({})
        deep_completed = await self.db.deep_compatibility_reports.count_documents({})
        
        # Subscriptions by tier
        pipeline = [
            {"$group": {
                "_id": "$subscription_tier",
                "count": {"$sum": 1}
            }}
        ]
        tier_counts = await self.db.users.aggregate(pipeline).to_list(10)
        subscriptions_by_tier = {item["_id"] or "free": item["count"] for item in tier_counts}
        
        # Boost purchases
        boost_purchases = await self.db.boosts.count_documents({"status": "active"})
        
        # Revenue this month (simplified)
        first_of_month = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0)
        
        # Calculate from subscriptions and boosts
        premium_count = subscriptions_by_tier.get("premium", 0)
        elite_count = subscriptions_by_tier.get("elite", 0)
        
        monthly_revenue = (premium_count * 1999) + (elite_count * 4999)
        
        boost_revenue = await self.db.boosts.count_documents({
            "created_at": {"$gte": first_of_month},
            "status": {"$in": ["active", "expired"]}
        })
        
        deep_revenue = await self.db.deep_exploration_pairs.count_documents({
            "unlocked_at": {"$gte": first_of_month},
            "payment_status": "paid"
        })
        
        total_revenue = monthly_revenue + (boost_revenue * 299) + (deep_revenue * 999)
        
        return {
            "total_users": total_users,
            "active_users": active_users,
            "total_matches": total_matches,
            "deep_exploration_unlocked": deep_unlocked,
            "deep_reports_completed": deep_completed,
            "subscriptions_by_tier": subscriptions_by_tier,
            "boost_purchases": boost_purchases,
            "revenue_this_month": total_revenue
        }
    
    async def get_all_users(self, skip: int = 0, limit: int = 50) -> List[Dict]:
        """Get all users with pagination"""
        users = await self.db.users.find(
            {},
            {"_id": 0, "password_hash": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        return users
    
    async def suspend_user(self, user_id: str) -> bool:
        """Suspend a user account"""
        result = await self.db.users.update_one(
            {"user_id": user_id},
            {"$set": {"is_active": False, "suspended_at": datetime.now(timezone.utc)}}
        )
        return result.modified_count > 0
    
    async def activate_user(self, user_id: str) -> bool:
        """Activate a suspended user"""
        result = await self.db.users.update_one(
            {"user_id": user_id},
            {"$set": {"is_active": True}, "$unset": {"suspended_at": ""}}
        )
        return result.modified_count > 0
    
    async def verify_user(self, user_id: str) -> bool:
        """Manually verify a user"""
        result = await self.db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "is_verified": True,
                "verification_badge": "admin_verified",
                "verified_at": datetime.now(timezone.utc)
            }}
        )
        return result.modified_count > 0
