from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from datetime import datetime, timezone
from typing import Optional
import uuid
import logging

from models.psychometric_extended import PsychometricProfileCreate
from dependencies import db, get_current_user, compatibility_engine
from data.psychometric_questions import PSYCHOMETRIC_QUESTIONS_36

logger = logging.getLogger(__name__)


async def _backfill_matches(user_id: str):
    """
    After a psychometric profile is submitted, compute and upsert match
    documents against every other user who also has a psychometric profile.
    This populates the `matches` collection so the basic-match fallback path
    also works, and surfaces the new user to others.
    """
    try:
        other_profiles = await db.psychometric_profiles.find(
            {"user_id": {"$ne": user_id}},
            {"_id": 0, "user_id": 1}
        ).to_list(300)

        for other in other_profiles:
            other_id = other["user_id"]
            compat = await compatibility_engine.calculate_compatibility(user_id, other_id)
            score = compat.get("compatibility_percentage", 0)

            match_base = {
                "compatibility_score": score,
                "status": "computed",
                "computed_at": datetime.now(timezone.utc),
            }

            # Upsert match: current user → other
            await db.matches.update_one(
                {"user_id": user_id, "matched_user_id": other_id},
                {"$set": match_base,
                 "$setOnInsert": {"match_id": f"match_{uuid.uuid4().hex[:8]}",
                                  "user_id": user_id,
                                  "matched_user_id": other_id,
                                  "created_at": datetime.now(timezone.utc)}},
                upsert=True,
            )

            # Upsert reciprocal match: other → current user
            await db.matches.update_one(
                {"user_id": other_id, "matched_user_id": user_id},
                {"$set": match_base,
                 "$setOnInsert": {"match_id": f"match_{uuid.uuid4().hex[:8]}",
                                  "user_id": other_id,
                                  "matched_user_id": user_id,
                                  "created_at": datetime.now(timezone.utc)}},
                upsert=True,
            )

        logger.info(f"Backfilled {len(other_profiles)} match(es) for user {user_id}")
    except Exception as exc:
        logger.error(f"_backfill_matches failed for {user_id}: {exc}")

router = APIRouter(tags=["compatibility"])


# ==================== COMMUNITY ROUTES ====================

@router.get("/communities")
async def list_communities():
    """List all active communities"""
    communities = await db.communities.find(
        {"is_active": True},
        {"_id": 0}
    ).to_list(100)
    
    return {"communities": communities}


@router.post("/communities/join/{community_id}")
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
        "membership_id": f"mem_{uuid.uuid4().hex[:12]}",
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


@router.get("/communities/my-communities")
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

@router.get("/psychometric/questions")
async def get_psychometric_questions():
    """Get the 36-item psychometric questionnaire"""
    return {"questions": PSYCHOMETRIC_QUESTIONS_36, "total": len(PSYCHOMETRIC_QUESTIONS_36)}


@router.post("/psychometric/submit")
async def submit_psychometric_profile(
    profile_data: PsychometricProfileCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Submit complete psychometric profile"""
    if len(profile_data.responses) != 36:
        raise HTTPException(status_code=400, detail="Must submit all 36 responses")

    # Convert responses to list of dicts
    responses = [r.model_dump() for r in profile_data.responses]

    # Save psychometric profile and compute domain scores / archetype
    profile_id = await compatibility_engine.create_psychometric_profile(
        user_id=current_user["user_id"],
        responses=responses
    )

    # Mark profile as complete
    await db.users.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {
            "is_profile_complete": True,
            "psychometric_completed_at": datetime.now(timezone.utc),
        }}
    )

    # Compute and store match scores against all existing psychometric profiles
    # (runs in background so the API response is instant)
    background_tasks.add_task(_backfill_matches, current_user["user_id"])

    return {
        "message": "Psychometric profile created successfully",
        "profile_id": profile_id
    }


@router.get("/psychometric/status")
async def get_psychometric_status(current_user: dict = Depends(get_current_user)):
    """Check if user has completed psychometric profile"""
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


@router.get("/psychometric/profile")
async def get_my_psychometric_profile(current_user: dict = Depends(get_current_user)):
    """Get full psychometric profile"""
    profile = await db.psychometric_profiles.find_one(
        {"user_id": current_user["user_id"]},
        {"_id": 0, "raw_responses": 0}  # Exclude raw responses
    )
    
    if not profile:
        raise HTTPException(status_code=404, detail="Psychometric profile not found")
    
    return profile


# ==================== COMPATIBILITY ROUTES ====================

@router.get("/compatibility/{matched_user_id}")
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
    
    return {
        **compatibility_data,
        "your_archetype": archetype_a,
        "their_archetype": archetype_b
    }
