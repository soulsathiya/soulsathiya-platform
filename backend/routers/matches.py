from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import Optional
import uuid

from pydantic import BaseModel
from models.interest import InterestResponse
from dependencies import db, get_current_user, compatibility_engine, require_tier, TIER_HIERARCHY

router = APIRouter(tags=["matches"])


class SendInterestBody(BaseModel):
    """Minimal body for POST /interests/send — from_user_id is always taken from session."""
    to_user_id: str
    message: Optional[str] = None


# ==================== MATCH ROUTES ====================

@router.get("/matches")
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
        
        match_results = []
        for match in matches:
            user = await db.users.find_one(
                {"user_id": match["matched_user_id"], "is_active": {"$ne": False}},
                {"_id": 0, "user_id": 1, "full_name": 1, "picture": 1, "is_verified": 1}
            )

            if user:
                profile = await db.profiles.find_one(
                    {"user_id": match["matched_user_id"]},
                    {"_id": 0, "city": 1, "state": 1, "date_of_birth": 1, "occupation": 1}
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
        
        return {"matches": match_results, "match_type": "psychometric"}
    
    # Fallback: basic matching for users without psychometric profile
    query = {
        "user_id": current_user["user_id"]
    }
    
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
            {"user_id": match["matched_user_id"], "is_active": {"$ne": False}},
            {"_id": 0, "user_id": 1, "full_name": 1, "picture": 1, "is_verified": 1}
        )

        if user:
            profile = await db.profiles.find_one(
                {"user_id": match["matched_user_id"]},
                {"_id": 0, "city": 1, "state": 1, "date_of_birth": 1, "occupation": 1}
            )

            is_boosted = match["matched_user_id"] in boosted_user_ids
            
            match_results.append({
                "match_id": match.get("match_id", f"match_{uuid.uuid4().hex[:8]}"),
                "user": user,
                "profile_preview": profile,
                "compatibility_score": match.get("compatibility_score", 0),
                "distance_km": match.get("distance_km"),
                "is_boosted": is_boosted
            })
    
    return {"matches": match_results, "match_type": "basic"}


# ==================== INTEREST ROUTES ====================

@router.post("/interests/send")
async def send_interest(
    interest_data: SendInterestBody,
    current_user: dict = Depends(get_current_user)
):
    """Send interest to another user"""
    if interest_data.to_user_id == current_user["user_id"]:
        raise HTTPException(status_code=400, detail="Cannot send interest to yourself")

    # Enforce basic-tier monthly interest limit (10/month)
    user_tier = current_user.get("subscription_tier") or "free"
    if TIER_HIERARCHY.get(user_tier, 0) < TIER_HIERARCHY.get("premium", 2):
        from datetime import timezone
        import datetime
        month_start = datetime.datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        monthly_count = await db.interests.count_documents({
            "from_user_id": current_user["user_id"],
            "sent_at": {"$gte": month_start}
        })
        limit = 10 if user_tier == "basic" else 0  # free users get 0 (can't send interests)
        if user_tier == "free":
            raise HTTPException(status_code=403, detail="Free users cannot send interests. Please upgrade to Basic or higher.")
        if monthly_count >= limit:
            raise HTTPException(status_code=403, detail=f"Basic plan limit reached: {limit} interests per month. Upgrade to Premium for unlimited.")
    
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
        "sent_at": datetime.now(timezone.utc)
    }
    
    await db.interests.insert_one(interest_doc)
    
    return {"message": "Interest sent", "interest_id": interest_id}


@router.post("/interests/{interest_id}/respond")
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


@router.get("/interests/received")
async def get_received_interests(current_user: dict = Depends(get_current_user)):
    """Get interests received by current user"""
    interests = await db.interests.find(
        {"to_user_id": current_user["user_id"]},
        {"_id": 0}
    ).sort("sent_at", -1).to_list(50)
    
    result = []
    for interest in interests:
        user = await db.users.find_one(
            {"user_id": interest["from_user_id"], "is_active": {"$ne": False}},
            {"_id": 0, "user_id": 1, "full_name": 1, "picture": 1}
        )
        if user:
            result.append({**interest, "from_user": user})
    
    return {"interests": result}
