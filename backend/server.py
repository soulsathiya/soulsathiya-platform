from fastapi import FastAPI, APIRouter, HTTPException, Depends, Cookie, Response, UploadFile, File, Form
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from datetime import datetime, timezone, date
from typing import Optional, List, Dicth
import uuid

from models.user import UserCreate, UserLogin, User
from models.profile import ProfileCreate, ProfileUpdate, Profile
from models.photo import PhotoUpload, Photo
from models.partner_preference import PartnerPreferenceCreate, PartnerPreferenceUpdate, PartnerPreference
from models.community import CommunityCreate, Community
from models.psychometric import QuestionCreate, Question, ResponseCreate, Response as PsychometricResponse
from models.match import Match, MatchFilter
from models.interest import InterestCreate, Interest, InterestResponse
from models.message import MessageCreate, Message, Conversation
from models.subscription import SubscriptionCreate, Subscription
from models.verification import VerificationCreate, Verification
from models.boost import BoostCreate, Boost
from models.psychometric_extended import PsychometricProfileCreate, PsychometricProfile, CompatibilityScore
from models.deep_exploration import DeepUnlockRequest, DeepExplorationPair, DeepPsychometricProfile, DeepCompatibilityReport
from services.auth_service import AuthService
from services.boost_service import BoostService
from services.compatibility_engine import CompatibilityEngine
from services.deep_exploration_service import DeepExplorationService
from services.admin_service import AdminService
from services.notification_service import NotificationService, DEMO_DEEP_REPORT
from models.admin import AdminLogin
from data.psychometric_questions import PSYCHOMETRIC_QUESTIONS_36
from data.deep_questions import DEEP_QUESTIONS_FULL

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="SoulSathiya API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

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


# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    """Register a new user with email and password"""
    existing_user = await auth_service.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if not user_data.password:
        raise HTTPException(status_code=400, detail="Password is required")
    
    user = await auth_service.create_user(
        email=user_data.email,
        full_name=user_data.full_name,
        password=user_data.password
    )
    
    session_token = await auth_service.create_session(user["user_id"])
    
    response = JSONResponse(content={
        "message": "Registration successful",
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "picture": user.get("picture")
        }
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    return response


@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    """Login with email and password"""
    user = await auth_service.authenticate_user(credentials.email, credentials.password)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    session_token = await auth_service.create_session(user["user_id"])
    
    response = JSONResponse(content={
        "message": "Login successful",
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "picture": user.get("picture"),
            "is_profile_complete": user.get("is_profile_complete", False),
            "is_verified": user.get("is_verified", False),
            "subscription_status": user.get("subscription_status", "free")
        }
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    return response


@api_router.post("/auth/google-session")
async def google_session(session_id: str):
    """Exchange Google OAuth session_id for user session
    REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    """
    result = await auth_service.handle_google_oauth(session_id)
    
    if not result:
        raise HTTPException(status_code=401, detail="Google authentication failed")
    
    user = result["user"]
    session_token = result["session_token"]
    
    response = JSONResponse(content={
        "message": "Google login successful",
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "picture": user.get("picture"),
            "is_profile_complete": user.get("is_profile_complete", False),
            "is_verified": user.get("is_verified", False),
            "subscription_status": user.get("subscription_status", "free")
        }
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    return response


@api_router.get("/auth/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return {
        "user_id": current_user["user_id"],
        "email": current_user["email"],
        "full_name": current_user["full_name"],
        "picture": current_user.get("picture"),
        "is_profile_complete": current_user.get("is_profile_complete", False),
        "is_verified": current_user.get("is_verified", False),
        "verification_badge": current_user.get("verification_badge"),
        "subscription_status": current_user.get("subscription_status", "free"),
        "subscription_tier": current_user.get("subscription_tier")
    }


@api_router.post("/auth/logout")
async def logout(
    response: Response,
    session_token: Optional[str] = Cookie(None)
):
    """Logout user"""
    if session_token:
        await auth_service.delete_session(session_token)
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}


# ==================== PROFILE ROUTES ====================

@api_router.post("/profile")
async def create_profile(
    profile_data: ProfileCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create user profile"""
    existing = await db.profiles.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")
    
    profile_id = f"profile_{uuid.uuid4().hex[:12]}"
    profile_doc = profile_data.model_dump()
    profile_doc["profile_id"] = profile_id
    profile_doc["user_id"] = current_user["user_id"]
    profile_doc["completion_percentage"] = 60
    profile_doc["created_at"] = datetime.now(timezone.utc)
    profile_doc["updated_at"] = datetime.now(timezone.utc)
    
    if isinstance(profile_doc.get("date_of_birth"), date):
        profile_doc["date_of_birth"] = profile_doc["date_of_birth"].isoformat()
    
    if profile_doc.get("hobbies") is None:
        profile_doc["hobbies"] = []
    
    await db.profiles.insert_one(profile_doc)
    
    await db.users.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {"is_profile_complete": True}}
    )
    
    return {"message": "Profile created successfully", "profile_id": profile_id}


@api_router.get("/profile/{user_id}")
async def get_profile(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get user profile"""
    profile = await db.profiles.find_one({"user_id": user_id}, {"_id": 0})
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    photos = await db.photos.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("display_order", 1).to_list(6)
    
    visible_photos = []
    for photo in photos:
        if not photo.get("is_hidden"):
            visible_photos.append(photo)
        elif user_id == current_user["user_id"]:
            visible_photos.append(photo)
        else:
            mutual_interest = await db.interests.find_one({
                "$or": [
                    {"from_user_id": current_user["user_id"], "to_user_id": user_id, "status": "accepted"},
                    {"from_user_id": user_id, "to_user_id": current_user["user_id"], "status": "accepted"}
                ]
            })
            if mutual_interest:
                visible_photos.append(photo)
    
    return {
        "user": {
            "user_id": user["user_id"],
            "full_name": user["full_name"],
            "picture": user.get("picture"),
            "is_verified": user.get("is_verified", False),
            "verification_badge": user.get("verification_badge")
        },
        "profile": profile,
        "photos": visible_photos
    }


@api_router.put("/profile")
async def update_profile(
    profile_update: ProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user profile"""
    update_data = {k: v for k, v in profile_update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    if "date_of_birth" in update_data and isinstance(update_data["date_of_birth"], date):
        update_data["date_of_birth"] = update_data["date_of_birth"].isoformat()
    
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.profiles.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return {"message": "Profile updated successfully"}


# ==================== PHOTO ROUTES ====================

@api_router.post("/photos/upload")
async def upload_photo(
    file: UploadFile = File(...),
    is_primary: bool = Form(False),
    is_hidden: bool = Form(False),
    current_user: dict = Depends(get_current_user)
):
    """Upload profile photo (placeholder - will integrate S3)"""
    photo_count = await db.photos.count_documents({"user_id": current_user["user_id"]})
    
    if photo_count >= 6:
        raise HTTPException(status_code=400, detail="Maximum 6 photos allowed")
    
    if file.content_type not in ["image/jpeg", "image/jpg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="Only image files allowed")
    
    photo_id = f"photo_{uuid.uuid4().hex[:12]}"
    s3_key = f"photos/{current_user['user_id']}/{photo_id}_{file.filename}"
    
    photo_doc = {
        "photo_id": photo_id,
        "user_id": current_user["user_id"],
        "file_name": file.filename,
        "s3_key": s3_key,
        "s3_url": f"https://placeholder-s3-url/{s3_key}",
        "thumbnail_url": f"https://placeholder-s3-url/thumbnails/{s3_key}",
        "is_primary": is_primary,
        "is_hidden": is_hidden,
        "display_order": photo_count,
        "uploaded_at": datetime.now(timezone.utc)
    }
    
    await db.photos.insert_one(photo_doc)
    
    if is_primary:
        await db.photos.update_many(
            {"user_id": current_user["user_id"], "photo_id": {"$ne": photo_id}},
            {"$set": {"is_primary": False}}
        )
    
    profile = await db.profiles.find_one({"user_id": current_user["user_id"]})
    if profile:
        new_percentage = min(profile.get("completion_percentage", 60) + 10, 100)
        await db.profiles.update_one(
            {"user_id": current_user["user_id"]},
            {"$set": {"completion_percentage": new_percentage}}
        )
    
    return {
        "message": "Photo uploaded successfully",
        "photo_id": photo_id,
        "note": "S3 integration pending"
    }


@api_router.get("/photos/my-photos")
async def get_my_photos(current_user: dict = Depends(get_current_user)):
    """Get current user's photos"""
    photos = await db.photos.find(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    ).sort("display_order", 1).to_list(10)
    
    return {"photos": photos}


@api_router.put("/photos/{photo_id}/privacy")
async def toggle_photo_privacy(
    photo_id: str,
    is_hidden: bool,
    current_user: dict = Depends(get_current_user)
):
    """Toggle photo privacy"""
    result = await db.photos.update_one(
        {"photo_id": photo_id, "user_id": current_user["user_id"]},
        {"$set": {"is_hidden": is_hidden}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    return {"message": "Photo privacy updated"}


@api_router.delete("/photos/{photo_id}")
async def delete_photo(
    photo_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a photo"""
    result = await db.photos.delete_one({
        "photo_id": photo_id,
        "user_id": current_user["user_id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    return {"message": "Photo deleted successfully"}


# ==================== PARTNER PREFERENCE ROUTES ====================

@api_router.post("/partner-preferences")
async def create_partner_preferences(
    preferences: PartnerPreferenceCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create partner preferences"""
    existing = await db.partner_preferences.find_one(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    )
    
    if existing:
        raise HTTPException(status_code=400, detail="Preferences already exist. Use PUT to update.")
    
    preference_id = f"pref_{uuid.uuid4().hex[:12]}"
    pref_doc = preferences.model_dump()
    pref_doc["preference_id"] = preference_id
    pref_doc["user_id"] = current_user["user_id"]
    pref_doc["created_at"] = datetime.now(timezone.utc)
    pref_doc["updated_at"] = datetime.now(timezone.utc)
    
    await db.partner_preferences.insert_one(pref_doc)
    
    return {"message": "Partner preferences created", "preference_id": preference_id}


@api_router.get("/partner-preferences")
async def get_partner_preferences(current_user: dict = Depends(get_current_user)):
    """Get partner preferences"""
    preferences = await db.partner_preferences.find_one(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    )
    
    if not preferences:
        raise HTTPException(status_code=404, detail="Preferences not found")
    
    return preferences


# ==================== COMMUNITY ROUTES ====================

@api_router.get("/communities")
async def list_communities():
    """List all active communities"""
    communities = await db.communities.find(
        {"is_active": True},
        {"_id": 0}
    ).to_list(100)
    
    return {"communities": communities}


@api_router.post("/communities/join/{community_id}")
async def join_community(
    community_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Join a community"""
    community = await db.communities.find_one({"community_id": community_id}, {"_id": 0})
    
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    
    existing = await db.user_communities.find_one({
        "user_id": current_user["user_id"],
        "community_id": community_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Already a member")
    
    membership_doc = {
        "user_id": current_user["user_id"],
        "community_id": community_id,
        "joined_at": datetime.now(timezone.utc)
    }
    
    await db.user_communities.insert_one(membership_doc)
    
    await db.communities.update_one(
        {"community_id": community_id},
        {"$inc": {"member_count": 1}}
    )
    
    return {"message": "Joined community successfully"}


@api_router.get("/communities/my-communities")
async def get_my_communities(current_user: dict = Depends(get_current_user)):
    """Get user's communities"""
    memberships = await db.user_communities.find(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    ).to_list(50)
    
    community_ids = [m["community_id"] for m in memberships]
    
    communities = await db.communities.find(
        {"community_id": {"$in": community_ids}},
        {"_id": 0}
    ).to_list(50)
    
    return {"communities": communities}


# ==================== PSYCHOMETRIC ROUTES ====================

@api_router.get("/psychometric/questions")
async def get_psychometric_questions():
    """Get the 36-item psychometric questionnaire"""
    return {"questions": PSYCHOMETRIC_QUESTIONS_36, "total": len(PSYCHOMETRIC_QUESTIONS_36)}


@api_router.post("/psychometric/submit")
async def submit_psychometric_profile(
    profile_data: PsychometricProfileCreate,
    current_user: dict = Depends(get_current_user)
):
    """Submit complete psychometric profile"""
    if len(profile_data.responses) != 36:
        raise HTTPException(status_code=400, detail="Must submit all 36 responses")
    
    # Convert responses to list of dicts
    responses = [r.model_dump() for r in profile_data.responses]
    
    # Create profile using compatibility engine
    profile_id = await compatibility_engine.create_psychometric_profile(
        user_id=current_user["user_id"],
        responses=responses
    )
    
    # Update user profile completion
    await db.users.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {"is_profile_complete": True}}
    )
    
    return {
        "message": "Psychometric profile created successfully",
        "profile_id": profile_id
    }


@api_router.get("/psychometric/status")
async def get_psychometric_status(current_user: dict = Depends(get_current_user)):
    """Get user's psychometric profile status"""
    profile = await db.psychometric_profiles.find_one(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    )
    
    if not profile:
        return {
            "completed": False,
            "profile": None
        }
    
    return {
        "completed": True,
        "profile": {
            "profile_id": profile["profile_id"],
            "domain_scores": profile["domain_scores"],
            "archetype_primary": profile["archetype_primary"],
            "archetype_secondary": profile.get("archetype_secondary"),
            "completed_at": profile["completed_at"]
        }
    }


@api_router.get("/psychometric/profile")
async def get_my_psychometric_profile(current_user: dict = Depends(get_current_user)):
    """Get full psychometric profile"""
    profile = await db.psychometric_profiles.find_one(
        {"user_id": current_user["user_id"]},
        {"_id": 0, "raw_responses": 0}  # Exclude raw responses
    )
    
    if not profile:
        raise HTTPException(status_code=404, detail="Psychometric profile not found")
    
    return profile


@api_router.get("/compatibility/{matched_user_id}")
async def get_compatibility_score(
    matched_user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get detailed compatibility with another user"""
    compatibility_data = await compatibility_engine.calculate_compatibility(
        current_user["user_id"],
        matched_user_id
    )
    
    if "error" in compatibility_data:
        raise HTTPException(status_code=404, detail=compatibility_data["error"])
    
    # Get archetypes for insights
    profile_a = await db.psychometric_profiles.find_one(
        {"user_id": current_user["user_id"]},
        {"_id": 0, "archetype_primary": 1}
    )
    profile_b = await db.psychometric_profiles.find_one(
        {"user_id": matched_user_id},
        {"_id": 0, "archetype_primary": 1}
    )
    
    archetype_a = profile_a.get("archetype_primary", "harmonizer") if profile_a else "harmonizer"
    archetype_b = profile_b.get("archetype_primary", "harmonizer") if profile_b else "harmonizer"
    
    # Generate insights
    insights = compatibility_engine.generate_match_insights(
        compatibility_data,
        archetype_a,
        archetype_b
    )
    
    return {
        "compatibility_percentage": compatibility_data["compatibility_percentage"],
        "domain_breakdown": compatibility_data["domain_breakdown"],
        "insights": insights
    }


# ==================== MATCH ROUTES ====================

@api_router.get("/matches")
async def get_matches(
    min_compatibility: Optional[float] = None,
    max_distance_km: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get psychometric-ranked compatible matches"""
    # Check if user has completed psychometric profile
    psych_profile = await db.psychometric_profiles.find_one(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    )
    
    if psych_profile:
        # Get psychometric-ranked matches
        matches = await compatibility_engine.get_ranked_matches(
            user_id=current_user["user_id"],
            limit=50
        )
        
        # Get active boosts
        now = datetime.now(timezone.utc)
        boosted_users = await db.boosts.find(
            {"status": "active", "expires_at": {"$gt": now}},
            {"_id": 0, "user_id": 1}
        ).to_list(100)
        
        boosted_user_ids = {boost["user_id"] for boost in boosted_users}
        
        # Enrich with user data
        match_results = []
        for match in matches:
            user = await db.users.find_one(
                {"user_id": match["matched_user_id"]},
                {"_id": 0, "user_id": 1, "full_name": 1, "picture": 1, "is_verified": 1}
            )
            
            if user:
                profile = await db.profiles.find_one(
                    {"user_id": match["matched_user_id"]},
                    {"_id": 0, "city": 1, "occupation": 1, "date_of_birth": 1}
                )
                
                # Get archetype
                psych = await db.psychometric_profiles.find_one(
                    {"user_id": match["matched_user_id"]},
                    {"_id": 0, "archetype_primary": 1}
                )
                
                is_boosted = match["matched_user_id"] in boosted_user_ids
                
                match_results.append({
                    "match_id": match.get("match_id", f"match_{uuid.uuid4().hex[:8]}"),
                    "user": user,
                    "profile_preview": profile,
                    "archetype": psych.get("archetype_primary") if psych else None,
                    "compatibility_score": match["psychometric_score"],
                    "psychometric_score": match["psychometric_score"],
                    "distance_km": match.get("distance_km"),
                    "is_boosted": is_boosted,
                    "rank_score": match["rank_score"]
                })
        
        return {"matches": match_results, "count": len(match_results), "psychometric_enabled": True}
    
    else:
        # Fall back to basic matches
        query = {"user_id": current_user["user_id"], "status": "computed"}
    
    if min_compatibility:
        query["compatibility_score"] = {"$gte": min_compatibility}
    
    if max_distance_km:
        query["distance_km"] = {"$lte": max_distance_km}
    
    matches = await db.matches.find(query, {"_id": 0}).sort("compatibility_score", -1).to_list(50)
    
    # Get active boosts for all matched users
    now = datetime.now(timezone.utc)
    boosted_users = await db.boosts.find(
        {
            "status": "active",
            "expires_at": {"$gt": now}
        },
        {"_id": 0, "user_id": 1}
    ).to_list(100)
    
    boosted_user_ids = {boost["user_id"] for boost in boosted_users}
    
    match_results = []
    for match in matches:
        user = await db.users.find_one(
            {"user_id": match["matched_user_id"]},
            {"_id": 0, "user_id": 1, "full_name": 1, "picture": 1, "is_verified": 1}
        )
        
        if user:
            profile = await db.profiles.find_one(
                {"user_id": match["matched_user_id"]},
                {"_id": 0, "city": 1, "occupation": 1, "age": 1}
            )
            
            is_boosted = match["matched_user_id"] in boosted_user_ids
            
            match_results.append({
                "match_id": match["match_id"],
                "user": user,
                "profile_preview": profile,
                "compatibility_score": match["compatibility_score"],
                "distance_km": match.get("distance_km"),
                "is_boosted": is_boosted
            })
    
        # Sort: boosted profiles first, then by compatibility score
        match_results.sort(key=lambda x: (not x["is_boosted"], -x["compatibility_score"]))
        
        return {"matches": match_results, "count": len(match_results), "psychometric_enabled": False}


# ==================== INTEREST ROUTES ====================

@api_router.post("/interests/send")
async def send_interest(
    interest_data: InterestCreate,
    current_user: dict = Depends(get_current_user)
):
    """Send interest to another user"""
    if interest_data.to_user_id == current_user["user_id"]:
        raise HTTPException(status_code=400, detail="Cannot send interest to yourself")
    
    existing = await db.interests.find_one({
        "from_user_id": current_user["user_id"],
        "to_user_id": interest_data.to_user_id,
        "status": {"$in": ["pending", "accepted"]}
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Interest already sent")
    
    interest_id = f"interest_{uuid.uuid4().hex[:12]}"
    
    interest_doc = {
        "interest_id": interest_id,
        "from_user_id": current_user["user_id"],
        "to_user_id": interest_data.to_user_id,
        "message": interest_data.message,
        "status": "pending",
        "sent_at": datetime.now(timezone.utc),
        "responded_at": None
    }
    
    await db.interests.insert_one(interest_doc)
    
    return {"message": "Interest sent successfully", "interest_id": interest_id}


@api_router.post("/interests/{interest_id}/respond")
async def respond_to_interest(
    interest_id: str,
    response: InterestResponse,
    current_user: dict = Depends(get_current_user)
):
    """Accept or reject an interest"""
    interest = await db.interests.find_one(
        {"interest_id": interest_id, "to_user_id": current_user["user_id"]},
        {"_id": 0}
    )
    
    if not interest:
        raise HTTPException(status_code=404, detail="Interest not found")
    
    if interest["status"] != "pending":
        raise HTTPException(status_code=400, detail="Interest already responded to")
    
    status = "accepted" if response.action == "accept" else "rejected"
    
    await db.interests.update_one(
        {"interest_id": interest_id},
        {"$set": {
            "status": status,
            "responded_at": datetime.now(timezone.utc)
        }}
    )
    
    return {"message": f"Interest {status}"}


@api_router.get("/interests/received")
async def get_received_interests(current_user: dict = Depends(get_current_user)):
    """Get interests received by current user"""
    interests = await db.interests.find(
        {"to_user_id": current_user["user_id"]},
        {"_id": 0}
    ).sort("sent_at", -1).to_list(50)
    
    result = []
    for interest in interests:
        user = await db.users.find_one(
            {"user_id": interest["from_user_id"]},
            {"_id": 0, "user_id": 1, "full_name": 1, "picture": 1}
        )
        result.append({**interest, "from_user": user})
    
    return {"interests": result}


# ==================== MESSAGE ROUTES ====================

@api_router.post("/messages/send")
async def send_message(
    message_data: MessageCreate,
    current_user: dict = Depends(get_current_user)
):
    """Send a message (requires mutual interest)"""
    mutual_interest = await db.interests.find_one({
        "$or": [
            {"from_user_id": current_user["user_id"], "to_user_id": message_data.to_user_id, "status": "accepted"},
            {"from_user_id": message_data.to_user_id, "to_user_id": current_user["user_id"], "status": "accepted"}
        ]
    })
    
    if not mutual_interest:
        raise HTTPException(status_code=403, detail="Can only message users with mutual interest")
    
    message_id = f"msg_{uuid.uuid4().hex[:12]}"
    
    message_doc = {
        "message_id": message_id,
        "from_user_id": current_user["user_id"],
        "to_user_id": message_data.to_user_id,
        "content": message_data.content,
        "is_read": False,
        "sent_at": datetime.now(timezone.utc),
        "read_at": None
    }
    
    await db.messages.insert_one(message_doc)
    
    return {"message": "Message sent", "message_id": message_id}


@api_router.get("/messages/conversation/{other_user_id}")
async def get_conversation(
    other_user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get conversation with another user"""
    messages = await db.messages.find(
        {
            "$or": [
                {"from_user_id": current_user["user_id"], "to_user_id": other_user_id},
                {"from_user_id": other_user_id, "to_user_id": current_user["user_id"]}
            ]
        },
        {"_id": 0}
    ).sort("sent_at", 1).to_list(1000)
    
    await db.messages.update_many(
        {"from_user_id": other_user_id, "to_user_id": current_user["user_id"], "is_read": False},
        {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc)}}
    )
    
    return {"messages": messages}


@api_router.get("/messages/conversations")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    """Get all conversations"""
    pipeline = [
        {
            "$match": {
                "$or": [
                    {"from_user_id": current_user["user_id"]},
                    {"to_user_id": current_user["user_id"]}
                ]
            }
        },
        {"$sort": {"sent_at": -1}},
        {
            "$group": {
                "_id": {
                    "$cond": [
                        {"$eq": ["$from_user_id", current_user["user_id"]]},
                        "$to_user_id",
                        "$from_user_id"
                    ]
                },
                "last_message": {"$first": "$content"},
                "last_message_at": {"$first": "$sent_at"}
            }
        }
    ]
    
    conversations = await db.messages.aggregate(pipeline).to_list(100)
    
    result = []
    for conv in conversations:
        other_user_id = conv["_id"]
        user = await db.users.find_one(
            {"user_id": other_user_id},
            {"_id": 0, "user_id": 1, "full_name": 1, "picture": 1}
        )
        
        unread_count = await db.messages.count_documents({
            "from_user_id": other_user_id,
            "to_user_id": current_user["user_id"],
            "is_read": False
        })
        
        result.append({
            "other_user": user,
            "last_message": conv["last_message"],
            "last_message_at": conv["last_message_at"],
            "unread_count": unread_count
        })
    
    return {"conversations": result}


# ==================== SUBSCRIPTION ROUTES (Placeholder) ====================

@api_router.get("/subscription/plans")
async def get_subscription_plans():
    """Get available subscription plans"""
    plans = [
        {
            "tier": "basic",
            "name": "Basic",
            "price": 999,
            "currency": "INR",
            "duration": "monthly",
            "features": [
                "Send 10 interests per month",
                "View 50 profiles per day",
                "Basic filters"
            ],
            "deep_exploration": "Not included"
        },
        {
            "tier": "premium",
            "name": "Premium",
            "price": 1999,
            "currency": "INR",
            "duration": "monthly",
            "features": [
                "Unlimited interests",
                "Unlimited profile views",
                "Advanced filters",
                "See who viewed your profile",
                "Priority customer support",
                "Deep Couple Compatibility (₹999/pair add-on)"
            ],
            "deep_exploration": "₹999 per pair"
        },
        {
            "tier": "elite",
            "name": "Elite",
            "price": 4999,
            "currency": "INR",
            "duration": "monthly",
            "features": [
                "All Premium features",
                "Profile boost",
                "Dedicated relationship manager",
                "Verified badge priority",
                "Exclusive events access",
                "Unlimited Deep Couple Compatibility Exploration"
            ],
            "deep_exploration": "Included"
        }
    ]
    
    return {"plans": plans}


# ==================== VERIFICATION ROUTES (Placeholder) ====================

@api_router.post("/verification/initiate")
async def initiate_verification(
    verification_data: VerificationCreate,
    current_user: dict = Depends(get_current_user)
):
    """Initiate KYC verification process"""
    verification_id = f"verify_{uuid.uuid4().hex[:12]}"
    
    verification_doc = {
        "verification_id": verification_id,
        "user_id": current_user["user_id"],
        "status": "pending",
        "document_type": verification_data.document_type,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.verifications.insert_one(verification_doc)
    
    return {
        "message": "Verification initiated",
        "verification_id": verification_id,
        "note": "KYC provider integration pending"
    }


# ==================== DEEP EXPLORATION ROUTES ====================

@api_router.get("/deep/status/{partner_id}")
async def get_deep_exploration_status(
    partner_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get deep exploration status with a partner"""
    status = await deep_exploration_service.get_pair_status(
        current_user["user_id"],
        partner_id
    )
    return status


@api_router.post("/deep/unlock/{partner_id}")
async def unlock_deep_exploration(
    partner_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Unlock deep exploration (Elite: free, Premium: requires payment)"""
    tier, has_access, payment_req = await deep_exploration_service.check_tier_access(
        current_user["user_id"]
    )
    
    if tier == "free":
        raise HTTPException(
            status_code=403,
            detail="Please upgrade to Premium or Elite to unlock Deep Exploration"
        )
    
    if tier == "premium":
        # Return payment order details
        # Payment verification will be handled by separate endpoint
        raise HTTPException(
            status_code=402,
            detail={
                "message": "Payment required",
                "amount": 999,
                "tier": "premium"
            }
        )
    
    # Elite tier - create pair directly
    result = await deep_exploration_service.unlock_pair(
        unlocking_user_id=current_user["user_id"],
        partner_user_id=partner_id
    )
    
    # Notify partner about the unlock
    if not result["exists"]:
        await notification_service.notify_deep_unlock(
            unlocking_user_id=current_user["user_id"],
            partner_user_id=partner_id,
            pair_id=result["pair"]["pair_id"]
        )
    
    return {
        "message": "Deep Exploration unlocked",
        "pair_id": result["pair"]["pair_id"],
        "exists": result["exists"]
    }


@api_router.post("/deep/unlock-paid/{partner_id}")
async def unlock_deep_with_payment(
    partner_id: str,
    razorpay_payment_id: str,
    razorpay_order_id: str,
    razorpay_signature: str,
    current_user: dict = Depends(get_current_user)
):
    """Unlock deep exploration after payment verification (Premium users)"""
    # Verify payment signature
    # For now, simplified verification
    
    result = await deep_exploration_service.unlock_pair(
        unlocking_user_id=current_user["user_id"],
        partner_user_id=partner_id,
        payment_id=razorpay_payment_id
    )
    
    # Notify partner about the unlock
    if not result["exists"]:
        await notification_service.notify_deep_unlock(
            unlocking_user_id=current_user["user_id"],
            partner_user_id=partner_id,
            pair_id=result["pair"]["pair_id"]
        )
    
    return {
        "message": "Deep Exploration unlocked with payment",
        "pair_id": result["pair"]["pair_id"]
    }


@api_router.get("/deep/questions")
async def get_deep_questions(current_user: dict = Depends(get_current_user)):
    """Get the 108-item deep exploration questionnaire"""
    return {
        "questions": DEEP_QUESTIONS_FULL,
        "total": len(DEEP_QUESTIONS_FULL),
        "modules": [
            "expectations_roles",
            "conflict_repair",
            "attachment_trust",
            "lifestyle_integration",
            "intimacy_communication",
            "family_inlaw_dynamics"
        ]
    }


@api_router.post("/deep/submit")
async def submit_deep_profile(
    pair_id: str,
    responses: List[Dict],
    current_user: dict = Depends(get_current_user)
):
    """Submit deep psychometric profile"""
    if len(responses) != 108:
        raise HTTPException(status_code=400, detail="Must submit all 108 responses")
    
    # Get pair to identify partner
    pair = await db.deep_exploration_pairs.find_one({"pair_id": pair_id}, {"_id": 0})
    if not pair:
        raise HTTPException(status_code=404, detail="Pair not found")
    
    partner_id = pair["user_b_id"] if pair["user_a_id"] == current_user["user_id"] else pair["user_a_id"]
    
    # Save profile
    profile_id = await deep_exploration_service.save_deep_profile(
        user_id=current_user["user_id"],
        pair_id=pair_id,
        responses=responses
    )
    
    # Refresh pair status
    pair = await db.deep_exploration_pairs.find_one({"pair_id": pair_id}, {"_id": 0})
    
    if pair and len(pair.get("completed_users", [])) == 2:
        # Generate report
        report_id = await deep_exploration_service.generate_pair_report(pair_id)
        
        # Notify both users that report is ready
        await notification_service.notify_report_ready(
            user_a_id=pair["user_a_id"],
            user_b_id=pair["user_b_id"],
            pair_id=pair_id
        )
        
        return {
            "message": "Deep profile completed and report generated",
            "profile_id": profile_id,
            "report_generated": True,
            "report_id": report_id
        }
    else:
        # Notify partner that this user completed
        await notification_service.notify_deep_completed(
            completing_user_id=current_user["user_id"],
            partner_user_id=partner_id,
            pair_id=pair_id
        )
    
    return {
        "message": "Deep profile saved. Waiting for partner to complete.",
        "profile_id": profile_id,
        "report_generated": False
    }


@api_router.get("/deep/report/{pair_id}")
async def get_deep_report(
    pair_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get deep compatibility report for a pair"""
    report = await deep_exploration_service.get_pair_report(
        pair_id,
        current_user["user_id"]
    )
    
    if not report:
        raise HTTPException(
            status_code=404,
            detail="Report not found or not yet generated"
        )
    
    return report


@api_router.get("/deep/demo-report")
async def get_demo_deep_report():
    """Get demo deep compatibility report for marketing purposes"""
    return DEMO_DEEP_REPORT


# ==================== NOTIFICATION ROUTES ====================

@api_router.get("/notifications")
async def get_notifications(
    unread_only: bool = False,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get user notifications"""
    notifications = await notification_service.get_user_notifications(
        user_id=current_user["user_id"],
        unread_only=unread_only,
        limit=limit
    )
    unread_count = await notification_service.get_unread_count(current_user["user_id"])
    
    return {
        "notifications": notifications,
        "unread_count": unread_count
    }


@api_router.get("/notifications/count")
async def get_notification_count(current_user: dict = Depends(get_current_user)):
    """Get unread notification count"""
    count = await notification_service.get_unread_count(current_user["user_id"])
    return {"unread_count": count}


@api_router.post("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark a notification as read"""
    success = await notification_service.mark_as_read(
        notification_id=notification_id,
        user_id=current_user["user_id"]
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification marked as read"}


@api_router.post("/notifications/read-all")
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    """Mark all notifications as read"""
    count = await notification_service.mark_all_as_read(current_user["user_id"])
    return {"message": f"Marked {count} notifications as read"}


# ==================== BOOST ROUTES ====================

@api_router.get("/boost/plans")
async def get_boost_plans():
    """Get available profile boost plans"""
    plans = boost_service.get_boost_plans()
    return {"plans": plans}


@api_router.post("/boost/purchase")
async def purchase_boost(
    boost_data: BoostCreate,
    current_user: dict = Depends(get_current_user)
):
    """Purchase a profile boost"""
    # Check if user already has an active boost
    active_boost = await boost_service.get_active_boost(current_user["user_id"])
    if active_boost:
        raise HTTPException(
            status_code=400,
            detail="You already have an active boost. Wait for it to expire before purchasing another."
        )
    
    # Create Razorpay order and boost record
    order_data = await boost_service.create_boost_order(
        user_id=current_user["user_id"],
        duration=boost_data.duration
    )
    
    return {
        "message": "Boost order created",
        "order": order_data
    }


@api_router.post("/boost/verify-payment")
async def verify_boost_payment(
    boost_id: str,
    razorpay_payment_id: str,
    razorpay_order_id: str,
    razorpay_signature: str,
    current_user: dict = Depends(get_current_user)
):
    """Verify Razorpay payment and activate boost"""
    success = await boost_service.verify_payment_and_activate(
        boost_id=boost_id,
        razorpay_payment_id=razorpay_payment_id,
        razorpay_order_id=razorpay_order_id,
        razorpay_signature=razorpay_signature
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Payment verification failed")
    
    return {
        "message": "Boost activated successfully",
        "boost_id": boost_id
    }


@api_router.get("/boost/status")
async def get_boost_status(current_user: dict = Depends(get_current_user)):
    """Get current user's boost status"""
    stats = await boost_service.get_boost_stats(current_user["user_id"])
    return stats


@api_router.get("/boost/history")
async def get_boost_history(current_user: dict = Depends(get_current_user)):
    """Get user's boost purchase history"""
    boosts = await db.boosts.find(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return {"boosts": boosts}


# ==================== ADMIN ROUTES ====================

# Admin router with separate prefix
admin_router = APIRouter(prefix="/api/admin")


# Admin authentication dependency
async def get_current_admin(
    admin_session: Optional[str] = Cookie(None),
    authorization: Optional[str] = None
) -> dict:
    """Get current admin from session token"""
    token = admin_session
    
    if not token and authorization:
        if authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
    
    if not token:
        raise HTTPException(status_code=401, detail="Admin authentication required")
    
    admin = await admin_service.verify_admin_session(token)
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid or expired admin session")
    
    return admin


def require_role(allowed_roles: List[str]):
    """Dependency to check admin role"""
    async def role_checker(admin: dict = Depends(get_current_admin)):
        if admin.get("role") not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return admin
    return role_checker


@admin_router.post("/login")
async def admin_login(credentials: AdminLogin):
    """Admin login"""
    admin = await admin_service.authenticate_admin(credentials.email, credentials.password)
    
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    session_token = await admin_service.create_admin_session(admin["admin_id"])
    
    response = JSONResponse(content={
        "message": "Admin login successful",
        "admin": {
            "admin_id": admin["admin_id"],
            "email": admin["email"],
            "full_name": admin["full_name"],
            "role": admin["role"],
            "require_password_change": admin.get("require_password_change", False)
        }
    })
    
    response.set_cookie(
        key="admin_session",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=24 * 60 * 60,
        path="/"
    )
    
    return response


@admin_router.post("/logout")
async def admin_logout(
    response: Response,
    admin_session: Optional[str] = Cookie(None)
):
    """Admin logout"""
    if admin_session:
        await admin_service.delete_admin_session(admin_session)
    
    response.delete_cookie(key="admin_session", path="/")
    return {"message": "Logged out successfully"}


@admin_router.get("/me")
async def get_admin_info(admin: dict = Depends(get_current_admin)):
    """Get current admin info"""
    return admin


@admin_router.post("/setup")
async def setup_first_admin(email: str, password: str, full_name: str):
    """Setup first admin (only works if no admins exist)"""
    existing = await db.admin_users.count_documents({})
    if existing > 0:
        raise HTTPException(status_code=400, detail="Admin already exists. Contact super admin.")
    
    admin = await admin_service.create_admin(
        email=email,
        full_name=full_name,
        password=password,
        role="super_admin",
        require_password_change=True
    )
    
    return {"message": "Super admin created successfully", "admin_id": admin["admin_id"]}


@admin_router.post("/change-password")
async def change_admin_password(
    old_password: str,
    new_password: str,
    admin: dict = Depends(get_current_admin)
):
    """Change admin password"""
    result = await admin_service.change_admin_password(
        admin_id=admin["admin_id"],
        old_password=old_password,
        new_password=new_password
    )
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return {"message": result["message"]}


# Dashboard
@admin_router.get("/dashboard/metrics")
async def get_dashboard_metrics(admin: dict = Depends(get_current_admin)):
    """Get dashboard metrics"""
    metrics = await admin_service.get_dashboard_metrics()
    return metrics


# User Management
@admin_router.get("/users")
async def get_all_users(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    admin: dict = Depends(get_current_admin)
):
    """Get all users with pagination"""
    result = await admin_service.get_all_users(skip=skip, limit=limit, search=search)
    return result


@admin_router.get("/users/{user_id}")
async def get_user_detail(
    user_id: str,
    admin: dict = Depends(get_current_admin)
):
    """Get user details"""
    user = await admin_service.get_user_detail(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@admin_router.post("/users/{user_id}/suspend")
async def suspend_user(
    user_id: str,
    admin: dict = Depends(require_role(["super_admin", "moderator"]))
):
    """Suspend a user"""
    success = await admin_service.suspend_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User suspended"}


@admin_router.post("/users/{user_id}/activate")
async def activate_user(
    user_id: str,
    admin: dict = Depends(require_role(["super_admin", "moderator"]))
):
    """Activate a suspended user"""
    success = await admin_service.activate_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User activated"}


@admin_router.post("/users/{user_id}/verify")
async def verify_user(
    user_id: str,
    admin: dict = Depends(require_role(["super_admin", "moderator"]))
):
    """Manually verify a user"""
    success = await admin_service.verify_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User verified"}


@admin_router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    admin: dict = Depends(require_role(["super_admin"]))
):
    """Delete a user"""
    success = await admin_service.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}


# Profile Management
@admin_router.get("/profiles")
async def get_all_profiles(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    admin: dict = Depends(get_current_admin)
):
    """Get all profiles"""
    result = await admin_service.get_all_profiles(skip=skip, limit=limit, status=status)
    return result


@admin_router.post("/profiles/{profile_id}/flag")
async def flag_profile(
    profile_id: str,
    reason: str,
    admin: dict = Depends(require_role(["super_admin", "moderator"]))
):
    """Flag a profile"""
    success = await admin_service.flag_profile(profile_id, reason)
    if not success:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"message": "Profile flagged"}


@admin_router.post("/profiles/{profile_id}/approve")
async def approve_profile(
    profile_id: str,
    admin: dict = Depends(require_role(["super_admin", "moderator"]))
):
    """Approve a profile"""
    success = await admin_service.approve_profile(profile_id)
    if not success:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"message": "Profile approved"}


@admin_router.delete("/photos/{photo_id}")
async def remove_photo(
    photo_id: str,
    admin: dict = Depends(require_role(["super_admin", "moderator"]))
):
    """Remove a photo"""
    success = await admin_service.remove_photo(photo_id)
    if not success:
        raise HTTPException(status_code=404, detail="Photo not found")
    return {"message": "Photo removed"}


# Subscription Management
@admin_router.get("/subscriptions")
async def get_all_subscriptions(
    skip: int = 0,
    limit: int = 50,
    admin: dict = Depends(get_current_admin)
):
    """Get all subscriptions"""
    result = await admin_service.get_all_subscriptions(skip=skip, limit=limit)
    return result


@admin_router.put("/subscriptions/{user_id}/tier")
async def update_subscription_tier(
    user_id: str,
    tier: str,
    admin: dict = Depends(require_role(["super_admin"]))
):
    """Update user subscription tier"""
    success = await admin_service.update_user_tier(user_id, tier)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update tier")
    return {"message": f"Tier updated to {tier}"}


@admin_router.post("/subscriptions/{user_id}/extend")
async def extend_subscription(
    user_id: str,
    days: int,
    admin: dict = Depends(require_role(["super_admin"]))
):
    """Extend subscription by days"""
    success = await admin_service.extend_subscription(user_id, days)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to extend subscription")
    return {"message": f"Subscription extended by {days} days"}


@admin_router.post("/subscriptions/{user_id}/cancel")
async def cancel_subscription(
    user_id: str,
    admin: dict = Depends(require_role(["super_admin"]))
):
    """Cancel user subscription"""
    success = await admin_service.cancel_subscription(user_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to cancel subscription")
    return {"message": "Subscription cancelled"}


# Deep Exploration Management
@admin_router.get("/deep")
async def get_all_deep_pairs(
    skip: int = 0,
    limit: int = 50,
    admin: dict = Depends(get_current_admin)
):
    """Get all deep exploration pairs"""
    result = await admin_service.get_all_deep_pairs(skip=skip, limit=limit)
    return result


@admin_router.post("/deep/{pair_id}/revoke")
async def revoke_deep_access(
    pair_id: str,
    admin: dict = Depends(require_role(["super_admin"]))
):
    """Revoke deep exploration access"""
    success = await admin_service.revoke_deep_access(pair_id)
    if not success:
        raise HTTPException(status_code=404, detail="Pair not found")
    return {"message": "Deep exploration access revoked"}


# Reports/Moderation
@admin_router.get("/reports")
async def get_all_reports(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    admin: dict = Depends(get_current_admin)
):
    """Get all user reports"""
    result = await admin_service.get_all_reports(skip=skip, limit=limit, status=status)
    return result


@admin_router.put("/reports/{report_id}")
async def update_report(
    report_id: str,
    status: str,
    action: Optional[str] = None,
    admin: dict = Depends(require_role(["super_admin", "moderator"]))
):
    """Update report status"""
    success = await admin_service.update_report_status(report_id, status, action)
    if not success:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"message": "Report updated"}


@admin_router.post("/users/{user_id}/warn")
async def warn_user(
    user_id: str,
    reason: str,
    admin: dict = Depends(require_role(["super_admin", "moderator"]))
):
    """Warn a user"""
    success = await admin_service.warn_user(user_id, reason)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User warned"}


@admin_router.post("/users/{user_id}/ban")
async def ban_user(
    user_id: str,
    reason: str,
    admin: dict = Depends(require_role(["super_admin"]))
):
    """Ban a user"""
    success = await admin_service.ban_user(user_id, reason)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User banned"}


# Analytics
@admin_router.get("/analytics")
async def get_analytics(admin: dict = Depends(get_current_admin)):
    """Get platform analytics"""
    analytics = await admin_service.get_analytics()
    return analytics


# Include the router in the main app
app.include_router(api_router)
app.include_router(admin_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', 'http://localhost:3000,https://soulsathiya.vercel.app').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
