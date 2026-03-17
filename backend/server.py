from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from contextlib import asynccontextmanager
import asyncio
import logging

from dependencies import client, boost_service, notification_service, email_service, db, create_indexes
from routers import (
    auth_router,
    profiles_router,
    compatibility_router,
    matches_router,
    messaging_router,
    subscriptions_router,
    notifications_router,
    boosts_router,
    admin_router,
    account_router,
    kyc_router,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Shared rate limiter (used by auth router and registered with the app)
# ---------------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address)

# ---------------------------------------------------------------------------
# Background task: expire stale boosts every 15 minutes
# ---------------------------------------------------------------------------
async def boost_expiry_loop():
    """Periodically expire boosts whose time has run out."""
    while True:
        try:
            expired = await boost_service.expire_old_boosts()
            if expired:
                logger.info(f"Boost expiry task: expired {expired} boost(s)")
        except Exception as e:
            logger.error(f"Boost expiry task error: {e}")
        await asyncio.sleep(15 * 60)  # run every 15 minutes


async def weekly_digest_loop():
    """Send weekly digest emails every 7 days to opted-in users."""
    # Wait 1 minute on startup before first check, to let the server settle
    await asyncio.sleep(60)
    while True:
        try:
            logger.info("Weekly digest task: starting digest run")
            # Fetch all users with verified emails
            users_cursor = db.users.find(
                {"is_email_verified": True},
                {"_id": 0, "user_id": 1, "email": 1, "full_name": 1}
            )
            async for user in users_cursor:
                try:
                    user_id = user["user_id"]
                    # Check opt-in
                    if not await notification_service.should_send_email(user_id, "weekly_digest"):
                        continue
                    # Count activity metrics
                    new_matches = await db.matches.count_documents({"user_id": user_id})
                    unread_messages = await db.messages.count_documents({
                        "to_user_id": user_id, "is_read": False
                    })
                    pending_interests = await db.interests.count_documents({
                        "to_user_id": user_id, "status": "pending"
                    })
                    # Only send if there's something to report
                    if new_matches + unread_messages + pending_interests == 0:
                        continue
                    unsub_token = await notification_service.generate_unsubscribe_token(
                        user_id, "weekly_digest"
                    )
                    await email_service.send_weekly_digest_email(
                        to=user["email"],
                        name=user.get("full_name", ""),
                        new_matches=new_matches,
                        unread_messages=unread_messages,
                        pending_interests=pending_interests,
                        unsubscribe_token=unsub_token,
                    )
                except Exception as user_exc:
                    logger.warning(f"Weekly digest failed for {user.get('user_id')}: {user_exc}")
            logger.info("Weekly digest task: run complete")
        except Exception as e:
            logger.error(f"Weekly digest task error: {e}")
        await asyncio.sleep(7 * 24 * 60 * 60)  # run every 7 days


# ---------------------------------------------------------------------------
# App lifespan (replaces deprecated @app.on_event)
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await create_indexes()
    boost_task = asyncio.create_task(boost_expiry_loop())
    digest_task = asyncio.create_task(weekly_digest_loop())
    logger.info("Background tasks started: boost_expiry_loop, weekly_digest_loop")
    yield
    # Shutdown
    for task in (boost_task, digest_task):
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass
    client.close()
    logger.info("Server shutdown: DB connection closed")


# ---------------------------------------------------------------------------
# Create the main app
# ---------------------------------------------------------------------------
app = FastAPI(title="SoulSathiya API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://soulsathiya.vercel.app",
        "https://www.soulsathiya.com",
        "https://soulsathiya.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Wire slowapi into the app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Include all API routers under /api prefix
app.include_router(auth_router, prefix="/api")
app.include_router(profiles_router, prefix="/api")
app.include_router(compatibility_router, prefix="/api")
app.include_router(matches_router, prefix="/api")
app.include_router(messaging_router, prefix="/api")
app.include_router(subscriptions_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(boosts_router, prefix="/api")
app.include_router(account_router, prefix="/api")
app.include_router(kyc_router,     prefix="/api")
# Admin router has its own /api/admin prefix built-in
app.include_router(admin_router)

# ---------------------------------------------------------------------------
# Health check (required by Render deployment)
# ---------------------------------------------------------------------------
@app.get("/api/health")
async def health_check():
    """Health check endpoint for deployment platforms (Render, etc.)"""
    return {"status": "ok", "service": "SoulSathiya API"}
