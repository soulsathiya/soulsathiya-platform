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
