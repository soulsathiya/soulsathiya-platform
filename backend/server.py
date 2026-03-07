from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import os

from dependencies import client

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

# Create the main app
app = FastAPI(title="SoulSathiya API")

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

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', 'http://localhost:3000,https://soulsathiya.vercel.app').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


@app.get("/api/health")
async def health_check():
    """Health check endpoint for deployment platforms (Render, etc.)"""
    return {"status": "ok", "service": "SoulSathiya API"}
