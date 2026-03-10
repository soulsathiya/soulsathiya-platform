from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from datetime import datetime, timezone, date
from typing import Optional
import uuid
import os
import io
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
import logging

from models.profile import ProfileCreate, ProfileUpdate
from models.partner_preference import PartnerPreferenceCreate
from dependencies import db, get_current_user

logger = logging.getLogger(__name__)

def get_s3_client():
    """Get boto3 S3 client from environment variables"""
    return boto3.client(
        "s3",
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
        region_name=os.environ.get("AWS_REGION", "ap-south-1"),
    )

S3_BUCKET = os.environ.get("S3_BUCKET_NAME", "")

router = APIRouter(tags=["profiles"])


# ==================== PROFILE ROUTES ====================

@router.post("/profile")
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
    
    if "date_of_birth" in profile_doc and isinstance(profile_doc["date_of_birth"], date):
        profile_doc["date_of_birth"] = profile_doc["date_of_birth"].isoformat()
    
    await db.profiles.insert_one(profile_doc)
    
    await db.users.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {"is_profile_complete": True}}
    )
    
    return {"message": "Profile created successfully", "profile_id": profile_id}


@router.get("/profile/{user_id}")
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


@router.put("/profile")
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

@router.post("/photos/upload")
async def upload_photo(
    file: UploadFile = File(...),
    is_primary: bool = Form(False),
    is_hidden: bool = Form(False),
    current_user: dict = Depends(get_current_user)
):
    """Upload profile photo to S3"""
    photo_count = await db.photos.count_documents({"user_id": current_user["user_id"]})

    if photo_count >= 6:
        raise HTTPException(status_code=400, detail="Maximum 6 photos allowed")

    if file.content_type not in ["image/jpeg", "image/jpg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, or WebP images are allowed")

    if not S3_BUCKET:
        raise HTTPException(status_code=500, detail="S3 bucket not configured. Set S3_BUCKET_NAME env var.")

    photo_id = f"photo_{uuid.uuid4().hex[:12]}"
    s3_key = f"photos/{current_user['user_id']}/{photo_id}_{file.filename}"

    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be under 5 MB")

    try:
        s3 = get_s3_client()
        s3.upload_fileobj(
            io.BytesIO(file_bytes),
            S3_BUCKET,
            s3_key,
            ExtraArgs={"ContentType": file.content_type, "ACL": "public-read"},
        )
    except NoCredentialsError:
        logger.error("AWS credentials not configured")
        raise HTTPException(status_code=500, detail="Storage credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.")
    except ClientError as e:
        logger.error(f"S3 upload failed: {e}")
        raise HTTPException(status_code=500, detail="Photo upload failed. Please try again.")

    region = os.environ.get("AWS_REGION", "ap-south-1")
    s3_url = f"https://{S3_BUCKET}.s3.{region}.amazonaws.com/{s3_key}"
    thumbnail_url = f"https://{S3_BUCKET}.s3.{region}.amazonaws.com/thumbnails/{s3_key}"

    photo_doc = {
        "photo_id": photo_id,
        "user_id": current_user["user_id"],
        "file_name": file.filename,
        "s3_key": s3_key,
        "s3_url": s3_url,
        "thumbnail_url": thumbnail_url,
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
        "s3_url": s3_url
    }

@router.get("/photos/my-photos")
async def get_my_photos(current_user: dict = Depends(get_current_user)):
    """Get current user's photos"""
    photos = await db.photos.find(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    ).sort("display_order", 1).to_list(10)
    
    return {"photos": photos}


@router.put("/photos/{photo_id}/privacy")
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


@router.delete("/photos/{photo_id}")
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

@router.post("/partner-preferences")
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
    
    return {"message": "Partner preferences saved", "preference_id": preference_id}


@router.get("/partner-preferences")
async def get_partner_preferences(current_user: dict = Depends(get_current_user)):
    """Get partner preferences"""
    preferences = await db.partner_preferences.find_one(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    )
    
    if not preferences:
        raise HTTPException(status_code=404, detail="Preferences not found")
    
    return preferences
