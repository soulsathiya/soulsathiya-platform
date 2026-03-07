from fastapi import HTTPException, Cookie, Depends
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import Optional, List

from services.auth_service import AuthService
from services.boost_service import BoostService
from services.compatibility_engine import CompatibilityEngine
from services.deep_exploration_service import DeepExplorationService
from services.admin_service import AdminService
from services.notification_service import NotificationService, DEMO_DEEP_REPORT

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize services
auth_service = AuthService(db)
boost_service = BoostService(db)
compatibility_engine = CompatibilityEngine(db)
deep_exploration_service = DeepExplorationService(db, boost_service)
admin_service = AdminService(db)
notification_service = NotificationService(db)


# Dependency to get current user from session
async def get_current_user(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = None
) -> dict:
    """Get current user from session token (cookie or header)"""
    token = session_token
    
    if not token and authorization:
        if authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user = await auth_service.verify_session(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    
    return user


# ---------------------------------------------------------------------------
# Subscription tier enforcement
# ---------------------------------------------------------------------------

TIER_HIERARCHY = {"free": 0, "basic": 1, "premium": 2, "elite": 3}

def require_tier(minimum_tier: str):
    """
    FastAPI dependency factory — raises 403 if user's subscription tier
    is below the required minimum.

    Usage:
        @router.get("/some-premium-endpoint")
        async def endpoint(user = Depends(require_tier("premium"))):
            ...
    """
    async def _check(current_user: dict = Depends(get_current_user)) -> dict:
        user_tier = current_user.get("subscription_tier") or "free"
        user_level = TIER_HIERARCHY.get(user_tier, 0)
        required_level = TIER_HIERARCHY.get(minimum_tier, 0)
        if user_level < required_level:
            raise HTTPException(
                status_code=403,
                detail=(
                    f"This feature requires a {minimum_tier.capitalize()} subscription or higher. "
                    f"Your current plan is '{user_tier}'."
                )
            )
        return current_user
    return _check


def get_user_tier(current_user: dict) -> str:
    """Return the user's current subscription tier string (defaults to 'free')."""
    return current_user.get("subscription_tier") or "free"
