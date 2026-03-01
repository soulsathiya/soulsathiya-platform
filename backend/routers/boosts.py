from fastapi import APIRouter, HTTPException, Depends

from models.boost import BoostCreate
from dependencies import db, get_current_user, boost_service

router = APIRouter(prefix="/boost", tags=["boosts"])


@router.get("/plans")
async def get_boost_plans():
    """Get available profile boost plans"""
    plans = boost_service.get_boost_plans()
    return {"plans": plans}


@router.post("/purchase")
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


@router.post("/verify-payment")
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


@router.get("/status")
async def get_boost_status(current_user: dict = Depends(get_current_user)):
    """Get current user's boost status"""
    stats = await boost_service.get_boost_stats(current_user["user_id"])
    return stats


@router.get("/history")
async def get_boost_history(current_user: dict = Depends(get_current_user)):
    """Get user's boost purchase history"""
    boosts = await db.boosts.find(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return {"boosts": boosts}
