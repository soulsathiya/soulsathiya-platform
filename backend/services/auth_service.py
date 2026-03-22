from passlib.context import CryptContext
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid
import os
import secrets
import httpx
import logging

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


CURRENT_TERMS_VERSION = "v1.0"


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
                         picture: Optional[str] = None,
                         terms_accepted: bool = False) -> dict:
        """Create a new user.

        If *terms_accepted* is True the user document is stamped with
        ``terms_accepted_at`` and ``terms_version`` at creation time.
        """
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
            "terms_accepted_at": datetime.now(timezone.utc) if terms_accepted else None,
            "terms_version": CURRENT_TERMS_VERSION if terms_accepted else None,
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

        # Reject soft-deleted accounts with a specific sentinel value
        if not user.get("is_active", True) or user.get("status") == "deleted":
            return "deleted"

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
        if user and (not user.get("is_active", True) or user.get("status") == "deleted"):
            # Deleted users cannot use existing sessions
            await self.db.user_sessions.delete_one({"session_token": session_token})
            return None
        return user
    
    async def delete_session(self, session_token: str):
        """Delete a session (logout)"""
        await self.db.user_sessions.delete_one({"session_token": session_token})
    
    async def handle_google_oauth(self, session_id: str) -> Optional[dict]:
        """Handle Google OAuth callback.

        For **new** users the account is NOT created yet — instead the Google
        profile data is stashed in ``pending_registrations`` and a
        ``pending_token`` is returned so the frontend can show the Terms
        acceptance screen first.

        For **existing** users the normal session flow runs.

        Requires GOOGLE_OAUTH_SESSION_URL env var pointing to your OAuth
        session resolver.  See .env.example for setup instructions.
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    os.environ.get("GOOGLE_OAUTH_SESSION_URL", "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"),
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
                    # ── NEW user — stash data, do NOT create account yet ──
                    pending_token = f"pending_{uuid.uuid4().hex}"
                    await self.db.pending_registrations.delete_many({"email": email})
                    await self.db.pending_registrations.insert_one({
                        "pending_token": pending_token,
                        "email": email,
                        "full_name": name,
                        "picture": picture,
                        "google_id": google_id,
                        "is_google_auth": True,
                        "created_at": datetime.now(timezone.utc),
                        "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
                    })
                    return {
                        "status": "pending_terms",
                        "pending_token": pending_token,
                        "user_info": {"email": email, "full_name": name, "picture": picture},
                    }
                else:
                    # Block deleted accounts from Google OAuth login
                    if not user.get("is_active", True) or user.get("status") == "deleted":
                        return None
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

    # ------------------------------------------------------------------
    # Pending registration helpers  (Terms-before-account flow)
    # ------------------------------------------------------------------

    async def complete_pending_registration(self, pending_token: str) -> Optional[dict]:
        """Consume a pending registration token and create the real user account.

        Called only after the user has accepted Terms of Service on the
        frontend.  Returns ``{"user": ..., "session_token": ...}`` on success.
        """
        record = await self.db.pending_registrations.find_one({"pending_token": pending_token})
        if not record:
            return None

        expires_at = record.get("expires_at")
        if expires_at:
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at < datetime.now(timezone.utc):
                await self.db.pending_registrations.delete_one({"pending_token": pending_token})
                return None

        # Guard against duplicate creation (page refresh / retry)
        existing = await self.get_user_by_email(record["email"])
        if existing:
            # Already created — just create a session
            session_token = await self.create_session(existing["user_id"])
            await self.db.pending_registrations.delete_many({"email": record["email"]})
            return {"user": existing, "session_token": session_token}

        user = await self.create_user(
            email=record["email"],
            full_name=record["full_name"],
            is_google_auth=record.get("is_google_auth", True),
            google_id=record.get("google_id"),
            picture=record.get("picture"),
            terms_accepted=True,
        )
        session_token = await self.create_session(user["user_id"])

        # Consume the pending registration
        await self.db.pending_registrations.delete_many({"email": record["email"]})

        return {"user": user, "session_token": session_token}

    async def accept_terms(self, user_id: str) -> bool:
        """Record that an existing user has accepted the current Terms version."""
        result = await self.db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "terms_accepted_at": datetime.now(timezone.utc),
                "terms_version": CURRENT_TERMS_VERSION,
            }},
        )
        return result.modified_count > 0

    # ------------------------------------------------------------------
    # Email verification tokens
    # ------------------------------------------------------------------

    async def create_email_verification_token(self, user_id: str) -> str:
        """Generate a secure email verification token and store it in the DB.

        Any previous tokens for this user are invalidated before creating a new one.
        The token expires after 24 hours.
        """
        # Invalidate stale tokens
        await self.db.email_verification_tokens.delete_many({"user_id": user_id})

        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=24)

        await self.db.email_verification_tokens.insert_one({
            "token": token,
            "user_id": user_id,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc),
        })
        logger.info("Email verification token created for user %s", user_id)
        return token

    async def verify_email_token(self, token: str) -> Optional[dict]:
        """Consume an email verification token and mark the user's email as verified.

        Returns the updated user dict on success, None if the token is invalid/expired.
        """
        record = await self.db.email_verification_tokens.find_one({"token": token})
        if not record:
            return None

        expires_at = record["expires_at"]
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if expires_at < datetime.now(timezone.utc):
            await self.db.email_verification_tokens.delete_one({"token": token})
            logger.info("Expired email verification token used for user %s", record["user_id"])
            return None

        user_id = record["user_id"]
        await self.db.users.update_one(
            {"user_id": user_id},
            {"$set": {"is_email_verified": True}},
        )
        # Consume the token so it cannot be reused
        await self.db.email_verification_tokens.delete_one({"token": token})
        logger.info("Email verified for user %s", user_id)
        return await self.get_user_by_id(user_id)

    # ------------------------------------------------------------------
    # Password reset tokens
    # ------------------------------------------------------------------

    async def create_password_reset_token(self, email: str) -> Optional[str]:
        """Generate a secure password-reset token for the given email.

        Returns the token string on success, or None if the email is not found.
        The token expires after 1 hour.

        Note: callers should NOT reveal to end-users whether the email was found
        (to prevent account enumeration). Always show a generic success message.
        """
        user = await self.get_user_by_email(email)
        if not user:
            return None  # Caller must still return a generic success response

        user_id = user["user_id"]
        # Invalidate stale reset tokens
        await self.db.password_reset_tokens.delete_many({"user_id": user_id})

        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

        await self.db.password_reset_tokens.insert_one({
            "token": token,
            "user_id": user_id,
            "email": email,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc),
        })
        logger.info("Password reset token created for user %s", user_id)
        return token

    async def verify_password_reset_token(self, token: str) -> Optional[dict]:
        """Check if a reset token is valid and not expired.

        Returns the associated user dict if valid, else None.
        Does NOT consume the token — call reset_password_with_token to do that.
        """
        record = await self.db.password_reset_tokens.find_one({"token": token})
        if not record:
            return None

        expires_at = record["expires_at"]
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if expires_at < datetime.now(timezone.utc):
            await self.db.password_reset_tokens.delete_one({"token": token})
            return None

        return await self.get_user_by_id(record["user_id"])

    async def reset_password_with_token(self, token: str, new_password: str) -> dict:
        """Reset a user's password using a valid reset token.

        On success:
        - Updates password hash
        - Invalidates ALL existing sessions (security: stolen cookies become useless)
        - Deletes the used reset token

        Returns {"success": True} or {"success": False, "error": "..."}.
        """
        record = await self.db.password_reset_tokens.find_one({"token": token})
        if not record:
            return {"success": False, "error": "Invalid or expired reset token"}

        expires_at = record["expires_at"]
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if expires_at < datetime.now(timezone.utc):
            await self.db.password_reset_tokens.delete_one({"token": token})
            return {"success": False, "error": "Reset token has expired"}

        user_id = record["user_id"]
        new_hash = self.hash_password(new_password)

        await self.db.users.update_one(
            {"user_id": user_id},
            {"$set": {"password_hash": new_hash}},
        )
        # Invalidate all sessions so any stolen cookies are worthless
        await self.db.user_sessions.delete_many({"user_id": user_id})
        # Consume the token — one-time use only
        await self.db.password_reset_tokens.delete_many({"user_id": user_id})

        logger.info("Password reset for user %s; all sessions invalidated", user_id)
        return {"success": True}

    async def change_password(self, user_id: str, old_password: str, new_password: str) -> dict:
        """Change user password and invalidate ALL existing sessions.

        Returns {"success": True} on success, {"success": False, "error": "..."} on failure.
        Session invalidation is the key security property here: if an attacker
        already has a session cookie, changing the password will log them out.
        """
        user = await self.get_user_by_id(user_id)
        if not user:
            return {"success": False, "error": "User not found"}
        if user.get("is_google_auth"):
            return {"success": False, "error": "Google-authenticated users cannot set a password here"}
        if not self.verify_password(old_password, user.get("password_hash", "")):
            return {"success": False, "error": "Current password is incorrect"}
        new_hash = self.hash_password(new_password)
        await self.db.users.update_one(
            {"user_id": user_id},
            {"$set": {"password_hash": new_hash}}
        )
        # Invalidate ALL sessions for this user so stolen cookies are worthless
        await self.db.user_sessions.delete_many({"user_id": user_id})
        logger.info(f"Password changed for user {user_id}; all sessions invalidated")
        return {"success": True}
