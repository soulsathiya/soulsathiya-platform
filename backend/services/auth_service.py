from passlib.context import CryptContext
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid
import os
import httpx
import logging

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    def __init__(self, db):
        self.db = db
        self.session_expiry_days = 7
    
    def hash_password(self, password: str) -> str:
        """Hash a password"""
        return pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    async def create_user(self, email: str, full_name: str, password: Optional[str] = None,
                         is_google_auth: bool = False, google_id: Optional[str] = None,
                         picture: Optional[str] = None) -> dict:
        """Create a new user"""
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        
        user_doc = {
            "user_id": user_id,
            "email": email,
            "full_name": full_name,
            "picture": picture,
            "is_email_verified": is_google_auth,
            "is_profile_complete": False,
            "is_verified": False,
            "verification_badge": None,
            "subscription_status": "free",
            "subscription_tier": None,
            "created_at": datetime.now(timezone.utc),
            "last_login": None
        }
        
        if is_google_auth:
            user_doc["google_id"] = google_id
            user_doc["is_google_auth"] = True
        else:
            user_doc["password_hash"] = self.hash_password(password)
            user_doc["is_google_auth"] = False
        
        await self.db.users.insert_one(user_doc)
        return user_doc
    
    async def get_user_by_email(self, email: str) -> Optional[dict]:
        """Get user by email"""
        return await self.db.users.find_one({"email": email}, {"_id": 0})
    
    async def get_user_by_id(self, user_id: str) -> Optional[dict]:
        """Get user by ID"""
        return await self.db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    async def authenticate_user(self, email: str, password: str) -> Optional[dict]:
        """Authenticate user with email and password"""
        user = await self.get_user_by_email(email)
        if not user or user.get("is_google_auth"):
            return None
        
        if not self.verify_password(password, user.get("password_hash", "")):
            return None
        
        await self.db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": {"last_login": datetime.now(timezone.utc)}}
        )
        
        return user
    
    async def create_session(self, user_id: str) -> str:
        """Create a new session for user"""
        session_token = f"session_{uuid.uuid4().hex}"
        expires_at = datetime.now(timezone.utc) + timedelta(days=self.session_expiry_days)
        
        session_doc = {
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc)
        }
        
        await self.db.user_sessions.insert_one(session_doc)
        return session_token
    
    async def verify_session(self, session_token: str) -> Optional[dict]:
        """Verify session token and return user"""
        session = await self.db.user_sessions.find_one(
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
            await self.db.user_sessions.delete_one({"session_token": session_token})
            return None
        
        user = await self.get_user_by_id(session["user_id"])
        return user
    
    async def delete_session(self, session_token: str):
        """Delete a session (logout)"""
        await self.db.user_sessions.delete_one({"session_token": session_token})
    
    async def handle_google_oauth(self, session_id: str) -> Optional[dict]:
        """Handle Google OAuth callback"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                    headers={"X-Session-ID": session_id},
                    timeout=10.0
                )
                
                if response.status_code != 200:
                    logger.error(f"Google OAuth failed: {response.text}")
                    return None
                
                data = response.json()
                email = data.get("email")
                name = data.get("name")
                picture = data.get("picture")
                google_id = data.get("id")
                
                user = await self.get_user_by_email(email)
                
                if not user:
                    user = await self.create_user(
                        email=email,
                        full_name=name,
                        is_google_auth=True,
                        google_id=google_id,
                        picture=picture
                    )
                else:
                    await self.db.users.update_one(
                        {"user_id": user["user_id"]},
                        {"$set": {
                            "last_login": datetime.now(timezone.utc),
                            "picture": picture or user.get("picture")
                        }}
                    )
                    user = await self.get_user_by_id(user["user_id"])
                
                session_token = await self.create_session(user["user_id"])
                
                return {
                    "user": user,
                    "session_token": session_token
                }
        
        except Exception as e:
            logger.error(f"Google OAuth error: {str(e)}")
            return None
