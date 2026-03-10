from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
import uuid
import asyncio
import logging

from models.message import MessageCreate
from dependencies import db, get_current_user, notification_service, email_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/messages", tags=["messaging"])


@router.post("/send")
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
        raise HTTPException(status_code=403, detail="Mutual interest required to send messages")
    
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

    # Fire-and-forget: in-app + email notification to recipient
    async def _notify():
        try:
            # In-app notification
            await notification_service.notify_new_message(
                to_user_id=message_data.to_user_id,
                from_user_id=current_user["user_id"],
            )
            # Email notification (only if user opted in)
            should_email = await notification_service.should_send_email(
                message_data.to_user_id, "new_message"
            )
            if should_email:
                recipient = await db.users.find_one(
                    {"user_id": message_data.to_user_id}, {"_id": 0, "email": 1, "full_name": 1}
                )
                sender = await db.users.find_one(
                    {"user_id": current_user["user_id"]}, {"_id": 0, "full_name": 1}
                )
                if recipient and recipient.get("email"):
                    unsub_token = await notification_service.generate_unsubscribe_token(
                        message_data.to_user_id, "new_message"
                    )
                    await email_service.send_message_notification_email(
                        to=recipient["email"],
                        recipient_name=recipient.get("full_name", ""),
                        sender_name=sender.get("full_name", "") if sender else "",
                        preview=message_data.content,
                        unsubscribe_token=unsub_token,
                    )
        except Exception as exc:
            logger.warning("Message notification error: %s", exc)

    asyncio.create_task(_notify())

    return {"message": "Message sent", "message_id": message_id}


@router.get("/conversation/{other_user_id}")
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
    ).sort("sent_at", 1).to_list(100)
    
    # Mark messages as read
    await db.messages.update_many(
        {
            "from_user_id": other_user_id,
            "to_user_id": current_user["user_id"],
            "is_read": False
        },
        {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc)}}
    )
    
    return {"messages": messages}


@router.get("/conversations")
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
