from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import Optional, List, Dict
import uuid

from models.verification import VerificationCreate
from dependencies import db, get_current_user, deep_exploration_service, notification_service, DEMO_DEEP_REPORT
from data.deep_questions import DEEP_QUESTIONS_FULL

router = APIRouter(tags=["subscriptions"])


# ==================== SUBSCRIPTION ROUTES (Placeholder) ====================

@router.get("/subscription/plans")
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
                "Everything in Premium",
                "Unlimited Deep Couple Compatibility",
                "Personal matchmaking assistant",
                "Priority profile visibility",
                "Video call feature",
                "Background verification badge"
            ],
            "deep_exploration": "Unlimited (included)"
        }
    ]
    
    return {"plans": plans}


# ==================== VERIFICATION ROUTES (Placeholder) ====================

@router.post("/verification/initiate")
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

@router.get("/deep/status/{partner_id}")
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


@router.post("/deep/unlock/{partner_id}")
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
        # Payment verification will be handled by unlock-paid endpoint
        order = await deep_exploration_service.create_payment_order(
            user_id=current_user["user_id"],
            partner_id=partner_id
        )
        return {
            "requires_payment": True,
            "order": order,
            "message": "Payment required for Premium users"
        }
    
    # Elite users get free access
    result = await deep_exploration_service.unlock_pair(
        unlocking_user_id=current_user["user_id"],
        partner_user_id=partner_id
    )
    
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


@router.post("/deep/unlock-paid/{partner_id}")
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
    
    # Notify partner
    if not result["exists"]:
        await notification_service.notify_deep_unlock(
            unlocking_user_id=current_user["user_id"],
            partner_user_id=partner_id,
            pair_id=result["pair"]["pair_id"]
        )
    
    return {
        "message": "Deep Exploration unlocked (paid)",
        "pair_id": result["pair"]["pair_id"]
    }


@router.get("/deep/questions")
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


@router.post("/deep/submit")
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
    
    # Determine partner
    if pair["user_a_id"] == current_user["user_id"]:
        partner_id = pair["user_b_id"]
    elif pair["user_b_id"] == current_user["user_id"]:
        partner_id = pair["user_a_id"]
    else:
        raise HTTPException(status_code=403, detail="Not a member of this pair")
    
    # Submit profile
    profile_id = await deep_exploration_service.submit_deep_profile(
        user_id=current_user["user_id"],
        pair_id=pair_id,
        responses=responses
    )
    
    # Check if both have submitted
    both_complete = await deep_exploration_service.check_both_submitted(pair_id)
    
    if both_complete:
        # Generate report
        await deep_exploration_service.generate_deep_report(pair_id)
        
        # Notify both users
        await notification_service.notify_deep_report_ready(
            pair_id=pair_id,
            user_a_id=pair["user_a_id"],
            user_b_id=pair["user_b_id"]
        )
    
    return {
        "message": "Deep profile submitted",
        "profile_id": profile_id,
        "both_complete": both_complete
    }


@router.get("/deep/report/{pair_id}")
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


@router.get("/deep/demo-report")
async def get_demo_deep_report():
    """Get demo deep compatibility report for marketing purposes"""
    return DEMO_DEEP_REPORT
