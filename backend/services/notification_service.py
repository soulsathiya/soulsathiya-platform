from typing import Dict, List, Optional
from datetime import datetime, timezone
import uuid


class NotificationService:
    """Service to manage in-app notifications for deep exploration events"""
    
    NOTIFICATION_TYPES = {
        "deep_invite": "Your match invited you to explore deeper compatibility",
        "deep_partner_completed": "Your partner completed the deep compatibility assessment",
        "deep_report_ready": "Your Deep Compatibility Report is ready!",
        "deep_reminder": "Don't forget to complete your deep compatibility assessment"
    }
    
    def __init__(self, db):
        self.db = db
    
    async def create_notification(
        self,
        user_id: str,
        notification_type: str,
        pair_id: Optional[str] = None,
        partner_id: Optional[str] = None,
        custom_message: Optional[str] = None
    ) -> str:
        """Create a new notification for a user"""
        notification_id = f"notif_{uuid.uuid4().hex[:12]}"
        
        message = custom_message or self.NOTIFICATION_TYPES.get(
            notification_type, "You have a new notification"
        )
        
        # Get partner info if available
        partner_name = None
        if partner_id:
            partner = await self.db.users.find_one(
                {"user_id": partner_id},
                {"_id": 0, "full_name": 1}
            )
            if partner:
                partner_name = partner.get("full_name", "").split()[0]
                if partner_name:
                    if notification_type == "deep_invite":
                        message = f"{partner_name} invited you to explore deeper compatibility"
                    elif notification_type == "deep_partner_completed":
                        message = f"{partner_name} completed the deep compatibility assessment"
        
        notification_doc = {
            "notification_id": notification_id,
            "user_id": user_id,
            "type": notification_type,
            "message": message,
            "pair_id": pair_id,
            "partner_id": partner_id,
            "is_read": False,
            "created_at": datetime.now(timezone.utc)
        }
        
        await self.db.notifications.insert_one(notification_doc)
        return notification_id
    
    async def get_user_notifications(
        self,
        user_id: str,
        unread_only: bool = False,
        limit: int = 50
    ) -> List[Dict]:
        """Get notifications for a user"""
        query = {"user_id": user_id}
        if unread_only:
            query["is_read"] = False
        
        notifications = await self.db.notifications.find(
            query,
            {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        return notifications
    
    async def get_unread_count(self, user_id: str) -> int:
        """Get count of unread notifications"""
        count = await self.db.notifications.count_documents({
            "user_id": user_id,
            "is_read": False
        })
        return count
    
    async def mark_as_read(self, notification_id: str, user_id: str) -> bool:
        """Mark a notification as read"""
        result = await self.db.notifications.update_one(
            {"notification_id": notification_id, "user_id": user_id},
            {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc)}}
        )
        return result.modified_count > 0
    
    async def mark_all_as_read(self, user_id: str) -> int:
        """Mark all notifications as read for a user"""
        result = await self.db.notifications.update_many(
            {"user_id": user_id, "is_read": False},
            {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc)}}
        )
        return result.modified_count
    
    async def notify_deep_unlock(
        self,
        unlocking_user_id: str,
        partner_user_id: str,
        pair_id: str
    ):
        """Notify partner when deep exploration is unlocked"""
        await self.create_notification(
            user_id=partner_user_id,
            notification_type="deep_invite",
            pair_id=pair_id,
            partner_id=unlocking_user_id
        )
    
    async def notify_deep_completed(
        self,
        completing_user_id: str,
        partner_user_id: str,
        pair_id: str
    ):
        """Notify partner when user completes deep assessment"""
        await self.create_notification(
            user_id=partner_user_id,
            notification_type="deep_partner_completed",
            pair_id=pair_id,
            partner_id=completing_user_id
        )
    
    async def notify_report_ready(
        self,
        user_a_id: str,
        user_b_id: str,
        pair_id: str
    ):
        """Notify both users when deep report is ready"""
        await self.create_notification(
            user_id=user_a_id,
            notification_type="deep_report_ready",
            pair_id=pair_id,
            partner_id=user_b_id
        )
        await self.create_notification(
            user_id=user_b_id,
            notification_type="deep_report_ready",
            pair_id=pair_id,
            partner_id=user_a_id
        )


# Demo report data for sample viewing
DEMO_DEEP_REPORT = {
    "pair_id": "demo_pair_001",
    "is_demo": True,
    "deep_score": 87,
    "long_term_outlook": "Your compatibility shows a strong foundation built on shared values and complementary personality traits. While you each bring unique strengths to the relationship, your core alignment in emotional expression and life goals suggests excellent potential for a fulfilling long-term partnership.",
    "strengths": [
        "Strong emotional attunement - you both value deep conversations and emotional vulnerability",
        "Aligned financial philosophies - similar approaches to saving, spending, and long-term planning",
        "Compatible conflict resolution styles - both prefer direct communication over avoidance",
        "Shared family values - agreement on family involvement and parenting approaches",
        "Mutual respect for personal space and independence within the relationship"
    ],
    "growth_areas": [
        "Consider discussing expectations around household responsibilities early",
        "Create regular check-in rituals to maintain emotional connection during busy periods",
        "Explore each other's love languages to ensure both feel appreciated",
        "Discuss career ambitions and how to support each other's professional growth"
    ],
    "dimension_scores": {
        "expectations_roles": 85,
        "conflict_repair": 88,
        "attachment_trust": 92,
        "lifestyle_integration": 82,
        "intimacy_communication": 89,
        "family_inlaw_dynamics": 84
    },
    "conversation_prompts": [
        "What does your ideal weekend together look like five years from now?",
        "How do you envision handling disagreements when we're stressed or tired?",
        "What traditions from your family would you like us to continue or create new?",
        "How can I best support you when you're going through a difficult time?",
        "What are your non-negotiables in our relationship?"
    ],
    "generated_at": "2026-02-22T00:00:00Z"
}
