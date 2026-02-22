from datetime import datetime, timezone, timedelta
from typing import Optional, Dict
import uuid
import os
import razorpay
import logging

logger = logging.getLogger(__name__)


class BoostService:
    def __init__(self, db):
        self.db = db
        
        # Initialize Razorpay client
        # Note: For production, get actual Razorpay credentials
        # For now, using placeholder - will be replaced with actual keys
        razorpay_key_id = os.getenv('RAZORPAY_KEY_ID', 'rzp_test_placeholder')
        razorpay_key_secret = os.getenv('RAZORPAY_KEY_SECRET', 'placeholder_secret')
        
        try:
            self.razorpay_client = razorpay.Client(auth=(razorpay_key_id, razorpay_key_secret))
        except Exception as e:
            logger.warning(f"Razorpay initialization failed: {e}. Using mock mode.")
            self.razorpay_client = None
    
    def get_boost_plans(self) -> list:
        """Get available boost plans with pricing"""
        return [
            {
                "duration": "24_hours",
                "name": "24 Hour Boost",
                "price": 299,
                "currency": "INR",
                "description": "Appear at the top of matches for 24 hours",
                "features": [
                    "Top position in match results",
                    "3x more profile views",
                    "Priority visibility"
                ]
            },
            {
                "duration": "48_hours",
                "name": "48 Hour Boost",
                "price": 499,
                "currency": "INR",
                "description": "Appear at the top of matches for 48 hours",
                "popular": True,
                "features": [
                    "Top position in match results",
                    "3x more profile views",
                    "Priority visibility",
                    "Save 17% vs 2x 24hr"
                ]
            },
            {
                "duration": "1_week",
                "name": "1 Week Boost",
                "price": 899,
                "currency": "INR",
                "description": "Appear at the top of matches for 7 days",
                "features": [
                    "Top position in match results",
                    "3x more profile views",
                    "Priority visibility",
                    "Save 35% vs daily boosts"
                ]
            }
        ]
    
    def get_duration_hours(self, duration: str) -> int:
        """Convert duration string to hours"""
        duration_map = {
            "24_hours": 24,
            "48_hours": 48,
            "1_week": 168
        }
        return duration_map.get(duration, 24)
    
    def get_price_for_duration(self, duration: str) -> float:
        """Get price for boost duration"""
        plans = self.get_boost_plans()
        for plan in plans:
            if plan["duration"] == duration:
                return plan["price"]
        return 299  # Default to 24 hour price
    
    async def create_boost_order(self, user_id: str, duration: str) -> Dict:
        """Create a boost order with Razorpay"""
        boost_id = f"boost_{uuid.uuid4().hex[:12]}"
        price = self.get_price_for_duration(duration)
        
        # Create Razorpay order
        razorpay_order = None
        if self.razorpay_client:
            try:
                razorpay_order = self.razorpay_client.order.create({
                    "amount": int(price * 100),  # Convert to paise
                    "currency": "INR",
                    "receipt": boost_id,
                    "notes": {
                        "boost_id": boost_id,
                        "user_id": user_id,
                        "duration": duration
                    }
                })
            except Exception as e:
                logger.error(f"Razorpay order creation failed: {e}")
        
        # Create boost record
        boost_doc = {
            "boost_id": boost_id,
            "user_id": user_id,
            "duration": duration,
            "price_paid": price,
            "status": "pending_payment",
            "razorpay_order_id": razorpay_order["id"] if razorpay_order else f"mock_order_{boost_id}",
            "razorpay_payment_id": None,
            "started_at": None,
            "expires_at": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        await self.db.boosts.insert_one(boost_doc)
        
        return {
            "boost_id": boost_id,
            "razorpay_order_id": boost_doc["razorpay_order_id"],
            "razorpay_key_id": os.getenv('RAZORPAY_KEY_ID', 'rzp_test_placeholder'),
            "amount": price,
            "currency": "INR"
        }
    
    async def verify_payment_and_activate(self, boost_id: str, razorpay_payment_id: str, 
                                         razorpay_order_id: str, razorpay_signature: str) -> bool:
        """Verify Razorpay payment and activate boost"""
        boost = await self.db.boosts.find_one({"boost_id": boost_id}, {"_id": 0})
        
        if not boost:
            return False
        
        # Verify signature with Razorpay
        is_valid = False
        if self.razorpay_client:
            try:
                self.razorpay_client.utility.verify_payment_signature({
                    'razorpay_order_id': razorpay_order_id,
                    'razorpay_payment_id': razorpay_payment_id,
                    'razorpay_signature': razorpay_signature
                })
                is_valid = True
            except Exception as e:
                logger.error(f"Payment verification failed: {e}")
                return False
        else:
            # Mock mode - accept payment
            is_valid = True
        
        if is_valid:
            # Activate boost
            now = datetime.now(timezone.utc)
            duration_hours = self.get_duration_hours(boost["duration"])
            expires_at = now + timedelta(hours=duration_hours)
            
            await self.db.boosts.update_one(
                {"boost_id": boost_id},
                {"$set": {
                    "status": "active",
                    "razorpay_payment_id": razorpay_payment_id,
                    "started_at": now,
                    "expires_at": expires_at,
                    "updated_at": now
                }}
            )
            
            return True
        
        return False
    
    async def get_active_boost(self, user_id: str) -> Optional[Dict]:
        """Get user's active boost if any"""
        now = datetime.now(timezone.utc)
        
        boost = await self.db.boosts.find_one(
            {
                "user_id": user_id,
                "status": "active",
                "expires_at": {"$gt": now}
            },
            {"_id": 0}
        )
        
        return boost
    
    async def get_boost_stats(self, user_id: str) -> Dict:
        """Get boost usage statistics"""
        total_boosts = await self.db.boosts.count_documents({
            "user_id": user_id,
            "status": "active"
        })
        
        active_boost = await self.get_active_boost(user_id)
        
        return {
            "total_boosts_used": total_boosts,
            "active_boost": active_boost,
            "has_active_boost": active_boost is not None
        }
    
    async def expire_old_boosts(self):
        """Background task to expire old boosts"""
        now = datetime.now(timezone.utc)
        
        result = await self.db.boosts.update_many(
            {
                "status": "active",
                "expires_at": {"$lte": now}
            },
            {"$set": {
                "status": "expired",
                "updated_at": now
            }}
        )
        
        logger.info(f"Expired {result.modified_count} boosts")
        return result.modified_count
