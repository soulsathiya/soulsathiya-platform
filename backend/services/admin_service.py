from typing import Dict, List, Optional
from datetime import datetime, timezone, timedelta
import uuid
import os
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
        
        await self.db.admin_users.update_one(
            {"admin_id": admin["admin_id"]},
            {"$set": {"last_login": datetime.now(timezone.utc)}}
        )
        
        return admin
    
    async def create_admin(
        self,
        email: str,
        full_name: str,
        password: str,
        role: str = "moderator",
        require_password_change: bool = False
    ) -> Dict:
        """Create a new admin user"""
        admin_id = f"admin_{uuid.uuid4().hex[:12]}"
        
        admin_doc = {
            "admin_id": admin_id,
            "email": email,
            "full_name": full_name,
            "password_hash": self.hash_password(password),
            "role": role,
            "is_active": True,
            "require_password_change": require_password_change,
            "created_at": datetime.now(timezone.utc),
            "last_login": None
        }
        
        await self.db.admin_users.insert_one(admin_doc)
        return {k: v for k, v in admin_doc.items() if k != "password_hash"}
    
    async def change_admin_password(
        self,
        admin_id: str,
        old_password: str,
        new_password: str
    ) -> Dict:
        """Change admin password"""
        admin = await self.db.admin_users.find_one({"admin_id": admin_id}, {"_id": 0})
        
        if not admin:
            return {"success": False, "error": "Admin not found"}
        
        if not self.verify_password(old_password, admin.get("password_hash", "")):
            return {"success": False, "error": "Current password is incorrect"}
        
        if len(new_password) < 8:
            return {"success": False, "error": "Password must be at least 8 characters"}
        
        await self.db.admin_users.update_one(
            {"admin_id": admin_id},
            {
                "$set": {
                    "password_hash": self.hash_password(new_password),
                    "require_password_change": False,
                    "password_changed_at": datetime.now(timezone.utc)
                }
            }
        )
        
        return {"success": True, "message": "Password changed successfully"}
    
    async def create_admin_from_env(self) -> Optional[Dict]:
        """Create admin from environment variables if not exists"""
        env_email = os.environ.get("ADMIN_EMAIL")
        env_password = os.environ.get("ADMIN_PASSWORD")
        
        if not env_email:
            return None
        
        existing = await self.db.admin_users.find_one({"email": env_email}, {"_id": 0})
        if existing:
            return existing
        
        # Use a secure default if no password provided
        password = env_password or f"change_me_{uuid.uuid4().hex[:8]}"
        
        admin = await self.create_admin(
            email=env_email,
            full_name="Super Admin",
            password=password,
            role="super_admin",
            require_password_change=os.environ.get("ADMIN_REQUIRE_PASSWORD_CHANGE", "true").lower() == "true"
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
            {"_id": 0, "password_hash": 0}
        )
        
        return admin
    
    async def delete_admin_session(self, session_token: str):
        """Delete admin session"""
        await self.db.admin_sessions.delete_one({"session_token": session_token})
    
    async def get_dashboard_metrics(self) -> Dict:
        """Get admin dashboard metrics"""
        total_users = await self.db.users.count_documents({})
        
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        active_users = await self.db.users.count_documents({
            "last_login": {"$gte": thirty_days_ago}
        })
        
        total_matches = await self.db.matches.count_documents({"status": "computed"})
        
        deep_unlocked = await self.db.deep_exploration_pairs.count_documents({})
        deep_completed = await self.db.deep_compatibility_reports.count_documents({})
        
        pipeline = [
            {"$group": {
                "_id": "$subscription_tier",
                "count": {"$sum": 1}
            }}
        ]
        tier_counts = await self.db.users.aggregate(pipeline).to_list(10)
        subscriptions_by_tier = {item["_id"] or "free": item["count"] for item in tier_counts}
        
        boost_purchases = await self.db.boosts.count_documents({"status": "active"})
        
        first_of_month = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0)
        
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
    
    async def get_all_users(self, skip: int = 0, limit: int = 50, search: str = None) -> Dict:
        """Get all users with pagination"""
        query = {}
        if search:
            query = {
                "$or": [
                    {"email": {"$regex": search, "$options": "i"}},
                    {"full_name": {"$regex": search, "$options": "i"}}
                ]
            }
        
        total = await self.db.users.count_documents(query)
        users = await self.db.users.find(
            query,
            {"_id": 0, "password_hash": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        return {"users": users, "total": total}
    
    async def get_user_detail(self, user_id: str) -> Optional[Dict]:
        """Get user with profile details"""
        user = await self.db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
        if not user:
            return None
        
        profile = await self.db.profiles.find_one({"user_id": user_id}, {"_id": 0})
        photos = await self.db.photos.find({"user_id": user_id}, {"_id": 0}).to_list(10)
        psychometric = await self.db.psychometric_profiles.find_one(
            {"user_id": user_id}, {"_id": 0, "raw_responses": 0}
        )
        
        return {
            "user": user,
            "profile": profile,
            "photos": photos,
            "psychometric": psychometric
        }
    
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
    
    async def delete_user(self, user_id: str) -> bool:
        """Delete a user and related data"""
        await self.db.profiles.delete_one({"user_id": user_id})
        await self.db.photos.delete_many({"user_id": user_id})
        await self.db.psychometric_profiles.delete_one({"user_id": user_id})
        await self.db.user_sessions.delete_many({"user_id": user_id})
        result = await self.db.users.delete_one({"user_id": user_id})
        return result.deleted_count > 0
    
    # Profile Management
    async def get_all_profiles(self, skip: int = 0, limit: int = 50, status: str = None) -> Dict:
        """Get all profiles with pagination"""
        query = {}
        if status == "flagged":
            query["is_flagged"] = True
        
        total = await self.db.profiles.count_documents(query)
        profiles = await self.db.profiles.find(
            query, {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        # Enrich with user data
        for profile in profiles:
            user = await self.db.users.find_one(
                {"user_id": profile["user_id"]},
                {"_id": 0, "full_name": 1, "email": 1, "picture": 1}
            )
            profile["user"] = user
            photos = await self.db.photos.find(
                {"user_id": profile["user_id"]},
                {"_id": 0}
            ).to_list(6)
            profile["photos"] = photos
        
        return {"profiles": profiles, "total": total}
    
    async def flag_profile(self, profile_id: str, reason: str) -> bool:
        """Flag a profile for review"""
        result = await self.db.profiles.update_one(
            {"profile_id": profile_id},
            {"$set": {"is_flagged": True, "flag_reason": reason, "flagged_at": datetime.now(timezone.utc)}}
        )
        return result.modified_count > 0
    
    async def approve_profile(self, profile_id: str) -> bool:
        """Approve a profile"""
        result = await self.db.profiles.update_one(
            {"profile_id": profile_id},
            {"$set": {"is_flagged": False}, "$unset": {"flag_reason": "", "flagged_at": ""}}
        )
        return result.modified_count > 0
    
    async def remove_photo(self, photo_id: str) -> bool:
        """Remove a photo"""
        result = await self.db.photos.delete_one({"photo_id": photo_id})
        return result.deleted_count > 0
    
    # Subscription Management
    async def get_all_subscriptions(self, skip: int = 0, limit: int = 50) -> Dict:
        """Get all subscriptions"""
        pipeline = [
            {"$match": {"subscription_tier": {"$ne": None}}},
            {"$sort": {"created_at": -1}},
            {"$skip": skip},
            {"$limit": limit},
            {"$project": {"_id": 0, "password_hash": 0}}
        ]
        users = await self.db.users.aggregate(pipeline).to_list(limit)
        total = await self.db.users.count_documents({"subscription_tier": {"$ne": None}})
        
        return {"subscriptions": users, "total": total}
    
    async def update_user_tier(self, user_id: str, tier: str) -> bool:
        """Update user subscription tier"""
        valid_tiers = ["free", "basic", "premium", "elite"]
        if tier not in valid_tiers:
            return False
        
        update_data = {
            "subscription_tier": tier if tier != "free" else None,
            "subscription_status": "active" if tier != "free" else "free",
            "tier_updated_at": datetime.now(timezone.utc)
        }
        
        result = await self.db.users.update_one(
            {"user_id": user_id},
            {"$set": update_data}
        )
        return result.modified_count > 0
    
    async def extend_subscription(self, user_id: str, days: int) -> bool:
        """Extend user subscription by days"""
        user = await self.db.users.find_one({"user_id": user_id}, {"_id": 0})
        if not user or not user.get("subscription_tier"):
            return False
        
        current_expiry = user.get("subscription_expires_at", datetime.now(timezone.utc))
        if isinstance(current_expiry, str):
            current_expiry = datetime.fromisoformat(current_expiry)
        
        new_expiry = current_expiry + timedelta(days=days)
        
        result = await self.db.users.update_one(
            {"user_id": user_id},
            {"$set": {"subscription_expires_at": new_expiry}}
        )
        return result.modified_count > 0
    
    async def cancel_subscription(self, user_id: str) -> bool:
        """Cancel user subscription"""
        result = await self.db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "subscription_tier": None,
                "subscription_status": "cancelled",
                "subscription_cancelled_at": datetime.now(timezone.utc)
            }}
        )
        return result.modified_count > 0
    
    # Deep Exploration Management
    async def get_all_deep_pairs(self, skip: int = 0, limit: int = 50) -> Dict:
        """Get all deep exploration pairs"""
        total = await self.db.deep_exploration_pairs.count_documents({})
        pairs = await self.db.deep_exploration_pairs.find(
            {}, {"_id": 0}
        ).sort("unlocked_at", -1).skip(skip).limit(limit).to_list(limit)
        
        # Enrich with user data
        for pair in pairs:
            user_a = await self.db.users.find_one(
                {"user_id": pair["user_a_id"]},
                {"_id": 0, "full_name": 1, "email": 1}
            )
            user_b = await self.db.users.find_one(
                {"user_id": pair["user_b_id"]},
                {"_id": 0, "full_name": 1, "email": 1}
            )
            pair["user_a"] = user_a
            pair["user_b"] = user_b
            
            # Get report if exists
            report = await self.db.deep_compatibility_reports.find_one(
                {"pair_id": pair["pair_id"]},
                {"_id": 0, "deep_score": 1}
            )
            pair["report"] = report
        
        return {"pairs": pairs, "total": total}
    
    async def revoke_deep_access(self, pair_id: str) -> bool:
        """Revoke deep exploration access"""
        result = await self.db.deep_exploration_pairs.update_one(
            {"pair_id": pair_id},
            {"$set": {"status": "revoked", "revoked_at": datetime.now(timezone.utc)}}
        )
        return result.modified_count > 0
    
    # Reports/Moderation
    async def get_all_reports(self, skip: int = 0, limit: int = 50, status: str = None) -> Dict:
        """Get all user reports"""
        query = {}
        if status:
            query["status"] = status
        
        total = await self.db.user_reports.count_documents(query)
        reports = await self.db.user_reports.find(
            query, {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        # Enrich with user data
        for report in reports:
            reporter = await self.db.users.find_one(
                {"user_id": report["reporter_id"]},
                {"_id": 0, "full_name": 1, "email": 1}
            )
            reported = await self.db.users.find_one(
                {"user_id": report["reported_user_id"]},
                {"_id": 0, "full_name": 1, "email": 1}
            )
            report["reporter"] = reporter
            report["reported_user"] = reported
        
        return {"reports": reports, "total": total}
    
    async def create_report(self, reporter_id: str, reported_user_id: str, reason: str) -> str:
        """Create a user report"""
        report_id = f"report_{uuid.uuid4().hex[:12]}"
        
        report_doc = {
            "report_id": report_id,
            "reporter_id": reporter_id,
            "reported_user_id": reported_user_id,
            "reason": reason,
            "status": "pending",
            "created_at": datetime.now(timezone.utc)
        }
        
        await self.db.user_reports.insert_one(report_doc)
        return report_id
    
    async def update_report_status(self, report_id: str, status: str, action: str = None) -> bool:
        """Update report status"""
        update_data = {
            "status": status,
            "updated_at": datetime.now(timezone.utc)
        }
        if action:
            update_data["action_taken"] = action
        
        result = await self.db.user_reports.update_one(
            {"report_id": report_id},
            {"$set": update_data}
        )
        return result.modified_count > 0
    
    async def warn_user(self, user_id: str, reason: str) -> bool:
        """Warn a user"""
        warning_id = f"warn_{uuid.uuid4().hex[:8]}"
        warning = {
            "warning_id": warning_id,
            "reason": reason,
            "created_at": datetime.now(timezone.utc)
        }
        
        result = await self.db.users.update_one(
            {"user_id": user_id},
            {"$push": {"warnings": warning}}
        )
        return result.modified_count > 0
    
    async def ban_user(self, user_id: str, reason: str) -> bool:
        """Ban a user"""
        result = await self.db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "is_banned": True,
                "is_active": False,
                "ban_reason": reason,
                "banned_at": datetime.now(timezone.utc)
            }}
        )
        return result.modified_count > 0
    
    # Analytics
    async def get_analytics(self) -> Dict:
        """Get platform analytics"""
        now = datetime.now(timezone.utc)
        
        # Users per week (last 8 weeks)
        users_per_week = []
        for i in range(8):
            week_start = now - timedelta(weeks=i+1)
            week_end = now - timedelta(weeks=i)
            count = await self.db.users.count_documents({
                "created_at": {"$gte": week_start, "$lt": week_end}
            })
            users_per_week.append({
                "week": f"Week {8-i}",
                "count": count,
                "start_date": week_start.isoformat()
            })
        users_per_week.reverse()
        
        # Subscriptions by tier
        tier_pipeline = [
            {"$group": {"_id": "$subscription_tier", "count": {"$sum": 1}}}
        ]
        tier_data = await self.db.users.aggregate(tier_pipeline).to_list(10)
        subscriptions_by_tier = [
            {"tier": item["_id"] or "free", "count": item["count"]}
            for item in tier_data
        ]
        
        # Deep unlocks per week
        deep_per_week = []
        for i in range(8):
            week_start = now - timedelta(weeks=i+1)
            week_end = now - timedelta(weeks=i)
            count = await self.db.deep_exploration_pairs.count_documents({
                "unlocked_at": {"$gte": week_start, "$lt": week_end}
            })
            deep_per_week.append({
                "week": f"Week {8-i}",
                "count": count
            })
        deep_per_week.reverse()
        
        # Revenue calculation
        premium_count = sum(1 for t in tier_data if t["_id"] == "premium")
        elite_count = sum(1 for t in tier_data if t["_id"] == "elite")
        
        first_of_month = now.replace(day=1, hour=0, minute=0, second=0)
        boost_count = await self.db.boosts.count_documents({
            "created_at": {"$gte": first_of_month}
        })
        deep_paid_count = await self.db.deep_exploration_pairs.count_documents({
            "unlocked_at": {"$gte": first_of_month},
            "payment_status": "paid"
        })
        
        revenue = {
            "subscriptions": (premium_count * 1999) + (elite_count * 4999),
            "boosts": boost_count * 299,
            "deep_exploration": deep_paid_count * 999,
            "total": (premium_count * 1999) + (elite_count * 4999) + (boost_count * 299) + (deep_paid_count * 999)
        }
        
        return {
            "users_per_week": users_per_week,
            "subscriptions_by_tier": subscriptions_by_tier,
            "deep_unlocks_per_week": deep_per_week,
            "revenue": revenue
        }
