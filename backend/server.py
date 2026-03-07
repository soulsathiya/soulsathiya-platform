from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from contextlib import asynccontextmanager
import os
import asyncio
import logging

from dependencies import client, boost_service
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


# ---------------------------------------------------------------------------
# App lifespan (replaces deprecated @app.on_event)
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    task = asyncio.create_task(boost_expiry_loop())
    logger.info("Background task started: boost_expiry_loop")
    yield
    # Shutdown
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
# Admin router has its own /api/admin prefix built-in
app.include_router(admin_router)

# ---------------------------------------------------------------------------
# CORS middleware
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', 'http://localhost:3000,https://soulsathiya.vercel.app').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Health check (required by Render deployment)
# ---------------------------------------------------------------------------
@app.get("/api/health")
async def health_check():
    """Health check endpoint for deployment platforms (Render, etc.)"""
    return {"status": "ok", "service": "SoulSathiya API"}
