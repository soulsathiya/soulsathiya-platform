from fastapi import FastAPI, APIRouter, HTTPException, Depends, Cookie, Response, UploadFile, File, Form
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from datetime import datetime, timezone, date
from typing import Optional, List
import uuid

from models.user import UserCreate, UserLogin, User
from models.profile import ProfileCreate, ProfileUpdate, Profile
from models.photo import PhotoUpload, Photo
from models.partner_preference import PartnerPreferenceCreate, PartnerPreferenceUpdate, PartnerPreference
from models.community import CommunityCreate, Community
from models.psychometric import QuestionCreate, Question, ResponseCreate, Response
from models.match import Match, MatchFilter
from models.interest import InterestCreate, Interest, InterestResponse
from models.message import MessageCreate, Message, Conversation
from models.subscription import SubscriptionCreate, Subscription
from models.verification import VerificationCreate, Verification
from models.boost import BoostCreate, Boost
from services.auth_service import AuthService
from services.boost_service import BoostService

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
async def get_questions(current_user: dict = Depends(get_current_user)):
    """Get active psychometric questions"""
    questions = await db.psychometric_questions.find(
        {"is_active": True},
        {"_id": 0}
    ).sort("display_order", 1).to_list(100)
    
    return {"questions": questions}


@api_router.post("/psychometric/responses")
async def submit_response(
    response_data: ResponseCreate,
    current_user: dict = Depends(get_current_user)
):
    """Submit psychometric response"""
    response_id = f"resp_{uuid.uuid4().hex[:12]}"
    
    response_doc = response_data.model_dump()
    response_doc["response_id"] = response_id
    response_doc["user_id"] = current_user["user_id"]
    response_doc["answered_at"] = datetime.now(timezone.utc)
    
    await db.psychometric_responses.insert_one(response_doc)
    
    return {"message": "Response recorded", "response_id": response_id}


# ==================== MATCH ROUTES ====================

@api_router.get("/matches")
async def get_matches(
    min_compatibility: Optional[float] = None,
    max_distance_km: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get compatible matches"""
    query = {"user_id": current_user["user_id"], "status": "computed"}
    
    if min_compatibility:
        query["compatibility_score"] = {"$gte": min_compatibility}
    
    if max_distance_km:
        query["distance_km"] = {"$lte": max_distance_km}
    
    matches = await db.matches.find(query, {"_id": 0}).sort("compatibility_score", -1).to_list(50)
    
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
            
            match_results.append({
                "match_id": match["match_id"],
                "user": user,
                "profile_preview": profile,
                "compatibility_score": match["compatibility_score"],
                "distance_km": match.get("distance_km")
            })
    
    return {"matches": match_results, "count": len(match_results)}


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
            ]
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
                "Priority customer support"
            ]
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
                "Exclusive events access"
            ]
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


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
