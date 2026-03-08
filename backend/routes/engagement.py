import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Request
from typing import Optional
from database import db
from routes.utils import get_current_user
from models import ChannelRequestCreate, PollCreate, PollVote, AlertCreate, AlertUpdate

router = APIRouter(prefix="/api")


@router.post("/channel-requests")
async def submit_channel_request(request_data: ChannelRequestCreate, request: Request):
    """Submit a channel request to be tracked"""
    user = await get_current_user(request)
    
    # Extract channel ID from URL if possible
    channel_id = None
    url = request_data.channel_url
    if "youtube.com/channel/" in url:
        channel_id = url.split("youtube.com/channel/")[1].split("/")[0].split("?")[0]
    elif "youtube.com/@" in url:
        channel_id = url.split("youtube.com/@")[1].split("/")[0].split("?")[0]
    
    # Check if already requested
    existing = await db.channel_requests.find_one({
        "$or": [
            {"channel_url": request_data.channel_url},
            {"channel_id": channel_id} if channel_id else {"channel_url": "impossible"}
        ]
    })
    
    if existing:
        return {"success": False, "message": "This channel has already been requested"}
    
    # Create request
    channel_request = {
        "request_id": f"req_{uuid.uuid4().hex[:12]}",
        "channel_url": request_data.channel_url,
        "channel_id": channel_id,
        "channel_name": request_data.channel_name,
        "country_code": request_data.country_code,
        "reason": request_data.reason,
        "submitted_by": user["user_id"] if user else "anonymous",
        "submitted_by_email": user["email"] if user else None,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "votes": 1
    }
    
    await db.channel_requests.insert_one(channel_request)
    
    return {
        "success": True,
        "message": "Channel request submitted successfully!",
        "request_id": channel_request["request_id"]
    }

@router.get("/channel-requests")
async def get_channel_requests(
    status: str = "pending",
    limit: int = 20
):
    """Get channel requests"""
    requests = await db.channel_requests.find(
        {"status": status},
        {"_id": 0}
    ).sort("votes", -1).limit(limit).to_list(limit)
    
    return {"requests": requests}

@router.post("/channel-requests/{request_id}/vote")
async def vote_channel_request(request_id: str, request: Request):
    """Vote for a channel request"""
    user = await get_current_user(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Login required to vote")
    
    # Check if user already voted
    existing_vote = await db.channel_request_votes.find_one({
        "request_id": request_id,
        "user_id": user["user_id"]
    })
    
    if existing_vote:
        return {"success": False, "message": "You have already voted for this request"}
    
    # Record vote
    await db.channel_request_votes.insert_one({
        "request_id": request_id,
        "user_id": user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Increment vote count
    await db.channel_requests.update_one(
        {"request_id": request_id},
        {"$inc": {"votes": 1}}
    )
    
    return {"success": True, "message": "Vote recorded!"}


# ==================== PREDICTION POLLS ====================


@router.get("/polls")
async def get_polls(
    status: str = "active",
    limit: int = 10
):
    """Get prediction polls"""
    now = datetime.now(timezone.utc).isoformat()
    
    if status == "active":
        polls = await db.polls.find(
            {"end_date": {"$gt": now}},
            {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
    else:
        polls = await db.polls.find(
            {"end_date": {"$lte": now}},
            {"_id": 0}
        ).sort("end_date", -1).limit(limit).to_list(limit)
    
    # Enrich with channel data
    for poll in polls:
        channel_a = await db.channels.find_one({"channel_id": poll["channel_a_id"]}, {"_id": 0, "title": 1, "thumbnail_url": 1, "subscriber_count": 1})
        channel_b = await db.channels.find_one({"channel_id": poll["channel_b_id"]}, {"_id": 0, "title": 1, "thumbnail_url": 1, "subscriber_count": 1})
        poll["channel_a"] = channel_a
        poll["channel_b"] = channel_b
        
        # Calculate vote percentages
        total_votes = poll.get("votes_a", 0) + poll.get("votes_b", 0)
        poll["total_votes"] = total_votes
        poll["percent_a"] = round((poll.get("votes_a", 0) / total_votes * 100) if total_votes > 0 else 50, 1)
        poll["percent_b"] = round((poll.get("votes_b", 0) / total_votes * 100) if total_votes > 0 else 50, 1)
    
    return {"polls": polls}

@router.post("/polls/{poll_id}/vote")
async def vote_poll(poll_id: str, vote: PollVote, request: Request):
    """Vote in a prediction poll"""
    user = await get_current_user(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Login required to vote")
    
    # Check if poll exists and is active
    poll = await db.polls.find_one({"poll_id": poll_id}, {"_id": 0})
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    end_date = datetime.fromisoformat(poll["end_date"].replace("Z", "+00:00"))
    if end_date < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Poll has ended")
    
    # Check if user already voted
    existing_vote = await db.poll_votes.find_one({
        "poll_id": poll_id,
        "user_id": user["user_id"]
    })
    
    if existing_vote:
        return {"success": False, "message": "You have already voted in this poll"}
    
    # Record vote
    await db.poll_votes.insert_one({
        "poll_id": poll_id,
        "user_id": user["user_id"],
        "choice": vote.choice,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Update poll counts
    vote_field = "votes_a" if vote.choice == "a" else "votes_b"
    await db.polls.update_one(
        {"poll_id": poll_id},
        {"$inc": {vote_field: 1}}
    )
    
    return {"success": True, "message": "Vote recorded!"}

@router.post("/admin/polls")
async def create_poll(poll_data: PollCreate, request: Request):
    """Create a new prediction poll (admin only)"""
    # For now, allow creation without admin check for simplicity
    
    # Default end date is end of current month
    if not poll_data.end_date:
        now = datetime.now(timezone.utc)
        if now.month == 12:
            end_date = datetime(now.year + 1, 1, 1, tzinfo=timezone.utc)
        else:
            end_date = datetime(now.year, now.month + 1, 1, tzinfo=timezone.utc)
        end_date_str = end_date.isoformat()
    else:
        end_date_str = poll_data.end_date
    
    poll = {
        "poll_id": f"poll_{uuid.uuid4().hex[:12]}",
        "question": poll_data.question,
        "channel_a_id": poll_data.channel_a_id,
        "channel_b_id": poll_data.channel_b_id,
        "prediction_type": poll_data.prediction_type,
        "votes_a": 0,
        "votes_b": 0,
        "end_date": end_date_str,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.polls.insert_one(poll)
    
    return {"success": True, "poll_id": poll["poll_id"]}


# ==================== USER FAVORITES (Synced) ====================

@router.get("/user/favorites")
async def get_user_favorites(request: Request):
    """Get user's synced favorites"""
    user = await get_current_user(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Login required")
    
    favorites = await db.user_favorites.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).to_list(100)
    
    # Get channel details
    channel_ids = [f["channel_id"] for f in favorites]
    channels = await db.channels.find(
        {"channel_id": {"$in": channel_ids}},
        {"_id": 0}
    ).to_list(100)
    
    return {"favorites": channels}

@router.post("/user/favorites/{channel_id}")
async def add_user_favorite(channel_id: str, request: Request):
    """Add a channel to user's favorites"""
    user = await get_current_user(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Login required")
    
    # Check if already favorited
    existing = await db.user_favorites.find_one({
        "user_id": user["user_id"],
        "channel_id": channel_id
    })
    
    if existing:
        return {"success": True, "message": "Already in favorites"}
    
    await db.user_favorites.insert_one({
        "user_id": user["user_id"],
        "channel_id": channel_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"success": True, "message": "Added to favorites"}

@router.delete("/user/favorites/{channel_id}")
async def remove_user_favorite(channel_id: str, request: Request):
    """Remove a channel from user's favorites"""
    user = await get_current_user(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Login required")
    
    await db.user_favorites.delete_one({
        "user_id": user["user_id"],
        "channel_id": channel_id
    })
    
    return {"success": True, "message": "Removed from favorites"}


# ==================== USER NOTIFICATION ALERTS ====================


@router.get("/user/alerts")
async def get_user_alerts(request: Request):
    """Get user's notification alerts"""
    user = await get_current_user(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Login required")
    
    alerts = await db.user_alerts.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).to_list(100)
    
    # Enrich with channel data
    for alert in alerts:
        channel = await db.channels.find_one(
            {"channel_id": alert["channel_id"]},
            {"_id": 0, "title": 1, "thumbnail_url": 1, "subscriber_count": 1, "country_name": 1}
        )
        alert["channel"] = channel
    
    return {"alerts": alerts}

@router.post("/user/alerts")
async def create_alert(alert_data: AlertCreate, request: Request):
    """Create a new notification alert"""
    user = await get_current_user(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Login required")
    
    # Validate alert type
    valid_types = ["milestone", "daily_gain", "rank_change"]
    if alert_data.alert_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid alert type. Must be one of: {valid_types}")
    
    # Check if channel exists
    channel = await db.channels.find_one({"channel_id": alert_data.channel_id}, {"_id": 0, "subscriber_count": 1})
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    # Check if alert already exists for this channel and type
    existing = await db.user_alerts.find_one({
        "user_id": user["user_id"],
        "channel_id": alert_data.channel_id,
        "alert_type": alert_data.alert_type
    })
    
    if existing:
        return {"success": False, "message": "Alert already exists for this channel and type"}
    
    # Set default thresholds based on alert type
    threshold = alert_data.threshold
    if threshold is None:
        if alert_data.alert_type == "milestone":
            # Default to next milestone (round up to nearest 10M, 50M, or 100M)
            current_subs = channel.get("subscriber_count", 0)
            if current_subs < 10000000:
                threshold = 10000000
            elif current_subs < 50000000:
                threshold = 50000000
            elif current_subs < 100000000:
                threshold = 100000000
            else:
                threshold = ((current_subs // 100000000) + 1) * 100000000
        elif alert_data.alert_type == "daily_gain":
            threshold = 100000  # Alert when daily gain > 100K
        elif alert_data.alert_type == "rank_change":
            threshold = 1  # Alert on any rank change
    
    alert = {
        "alert_id": f"alert_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "user_email": user.get("email"),
        "channel_id": alert_data.channel_id,
        "alert_type": alert_data.alert_type,
        "threshold": threshold,
        "enabled": True,
        "notify_email": alert_data.notify_email,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_triggered": None,
        "trigger_count": 0
    }
    
    await db.user_alerts.insert_one(alert)
    
    return {
        "success": True,
        "message": "Alert created successfully",
        "alert_id": alert["alert_id"]
    }

@router.put("/user/alerts/{alert_id}")
async def update_alert(alert_id: str, alert_data: AlertUpdate, request: Request):
    """Update an existing alert"""
    user = await get_current_user(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Login required")
    
    # Find the alert
    alert = await db.user_alerts.find_one({
        "alert_id": alert_id,
        "user_id": user["user_id"]
    })
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # Update fields
    update_data = {"enabled": alert_data.enabled}
    if alert_data.threshold is not None:
        update_data["threshold"] = alert_data.threshold
    if alert_data.notify_email is not None:
        update_data["notify_email"] = alert_data.notify_email
    
    await db.user_alerts.update_one(
        {"alert_id": alert_id},
        {"$set": update_data}
    )
    
    return {"success": True, "message": "Alert updated"}

@router.delete("/user/alerts/{alert_id}")
async def delete_alert(alert_id: str, request: Request):
    """Delete a notification alert"""
    user = await get_current_user(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Login required")
    
    result = await db.user_alerts.delete_one({
        "alert_id": alert_id,
        "user_id": user["user_id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return {"success": True, "message": "Alert deleted"}

@router.get("/user/alerts/check")
async def check_triggered_alerts(request: Request):
    """Check for triggered alerts for the current user"""
    user = await get_current_user(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Login required")
    
    alerts = await db.user_alerts.find(
        {"user_id": user["user_id"], "enabled": True},
        {"_id": 0}
    ).to_list(100)
    
    triggered = []
    
    for alert in alerts:
        channel = await db.channels.find_one(
            {"channel_id": alert["channel_id"]},
            {"_id": 0, "title": 1, "subscriber_count": 1, "daily_subscriber_gain": 1, "global_rank": 1}
        )
        
        if not channel:
            continue
        
        is_triggered = False
        trigger_reason = ""
        
        if alert["alert_type"] == "milestone":
            if channel.get("subscriber_count", 0) >= alert.get("threshold", 0):
                is_triggered = True
                trigger_reason = f"Reached {alert['threshold']:,} subscribers!"
        
        elif alert["alert_type"] == "daily_gain":
            if channel.get("daily_subscriber_gain", 0) >= alert.get("threshold", 0):
                is_triggered = True
                trigger_reason = f"Daily gain exceeded {alert['threshold']:,}!"
        
        elif alert["alert_type"] == "rank_change":
            # For rank change, we'd need to track previous rank - simplified for now
            pass
        
        if is_triggered:
            triggered.append({
                "alert": alert,
                "channel": channel,
                "reason": trigger_reason
            })
    
    return {"triggered_alerts": triggered, "total_alerts": len(alerts)}


# ==================== ADMIN ====================
