from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class MessageBase(BaseModel):
    from_user_id: str
    to_user_id: str
    content: str = Field(..., min_length=1, max_length=2000)


class MessageCreate(MessageBase):
    pass


class SendMessageBody(BaseModel):
    """Minimal body for POST /messages/send — from_user_id is taken from session."""
    to_user_id: str
    content: str = Field(..., min_length=1, max_length=2000)


class Message(MessageBase):
    model_config = ConfigDict(from_attributes=True)
    
    message_id: str
    is_read: bool = False
    sent_at: datetime
    read_at: Optional[datetime] = None


class Conversation(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    user_id: str
    other_user_id: str
    other_user_name: str
    other_user_picture: Optional[str] = None
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: int = 0
