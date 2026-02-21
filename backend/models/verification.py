from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class VerificationStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    VERIFIED = "verified"
    FAILED = "failed"
    REJECTED = "rejected"


class DocumentType(str, Enum):
    AADHAAR = "aadhaar"
    PAN = "pan"
    PASSPORT = "passport"
    DRIVER_LICENSE = "driver_license"


class VerificationBase(BaseModel):
    user_id: str


class VerificationCreate(VerificationBase):
    document_type: DocumentType
    document_number: str


class Verification(VerificationBase):
    model_config = ConfigDict(from_attributes=True)
    
    verification_id: str
    status: VerificationStatus = VerificationStatus.PENDING
    document_type: Optional[DocumentType] = None
    document_s3_key: Optional[str] = None
    face_image_s3_key: Optional[str] = None
    extracted_data: Optional[Dict[str, Any]] = None
    verification_provider: Optional[str] = None  # hyperverge or idfy
    provider_verification_id: Optional[str] = None
    confidence_score: Optional[float] = None
    verification_badge: Optional[str] = None
    verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    error_message: Optional[str] = None
