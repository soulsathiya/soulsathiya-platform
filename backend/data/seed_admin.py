"""Seed initial admin user"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone
import uuid
from pathlib import Path
from dotenv import load_dotenv
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def seed_admin():
    """Create default admin user"""
    existing = await db.admin_users.find_one({"email": "admin@soulsathiya.com"})
    
    if existing:
        print("Admin user already exists")
        return
    
    admin_doc = {
        "admin_id": f"admin_{uuid.uuid4().hex[:12]}",
        "email": "admin@soulsathiya.com",
        "full_name": "SoulSathiya Admin",
        "password_hash": pwd_context.hash("admin123"),  # Change in production!
        "role": "super_admin",
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "last_login": None
    }
    
    await db.admin_users.insert_one(admin_doc)
    print("✅ Admin user created")
    print("   Email: admin@soulsathiya.com")
    print("   Password: admin123")
    print("   ⚠️  CHANGE PASSWORD IN PRODUCTION!")


if __name__ == "__main__":
    asyncio.run(seed_admin())
    client.close()
