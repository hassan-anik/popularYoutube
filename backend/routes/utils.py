"""
Shared utility functions for TopTube World Pro routes.
"""
import os
from datetime import datetime, timezone
from typing import Optional
from fastapi import Request, HTTPException
from database import db


async def get_current_user(request: Request) -> Optional[dict]:
    """Helper to get current user from session token"""
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        return None
    
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        return None
    
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        return None
    
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    return user


def verify_admin_key(admin_key: str):
    """Verify admin key for protected endpoints"""
    valid_key = os.environ.get("ADMIN_KEY", "toptube2024admin")
    if admin_key != valid_key:
        raise HTTPException(status_code=403, detail="Invalid admin key")


def format_number_simple(num):
    """Format number for display (e.g., 1234567 -> 1.23M)"""
    if num >= 1_000_000_000:
        return f"{num/1_000_000_000:.2f}B"
    elif num >= 1_000_000:
        return f"{num/1_000_000:.2f}M"
    elif num >= 1_000:
        return f"{num/1_000:.1f}K"
    return str(num)


async def store_channel_stats(channel_id: str, yt_data: dict):
    """Store a channel stats snapshot"""
    stats_doc = {
        "channel_id": channel_id,
        "subscriber_count": yt_data.get("subscriber_count", 0),
        "view_count": yt_data.get("view_count", 0),
        "video_count": yt_data.get("video_count", 0),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.channel_stats.insert_one(stats_doc)
