import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query, Response
from typing import List, Optional
from database import db
from routes.utils import store_channel_stats
from models import ChannelCreate, ChannelResponse, CountryCreate, CountryResponse
from services.youtube_service import youtube_service
from services.growth_analyzer import get_growth_analyzer
from services.ranking_service import get_ranking_service

router = APIRouter(prefix="/api")
growth_analyzer = get_growth_analyzer(db)
ranking_service = get_ranking_service(db)

logger = logging.getLogger(__name__)

# ==================== HEALTH & STATUS ====================

@router.get("/")
async def root():
    return {"message": "TopTube World Pro API", "version": "1.0.0"}

@router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


# ==================== COUNTRIES ====================

@router.get("/countries", response_model=List[CountryResponse])
async def get_countries(response: Response):
    """Get all tracked countries with their top channel"""
    # Cache for 10 minutes
    response.headers["Cache-Control"] = "public, max-age=600"
    
    countries = await db.countries.find({}, {"_id": 0}).to_list(300)
    
    result = []
    for country in countries:
        # Get channel count
        channel_count = await db.channels.count_documents({"country_code": country["code"]})
        
        # Get top channel
        top_channel = await db.channels.find_one(
            {"country_code": country["code"], "is_active": True},
            {"_id": 0},
            sort=[("subscriber_count", -1)]
        )
        
        result.append({
            **country,
            "channel_count": channel_count,
            "top_channel": top_channel
        })
    
    return result

@router.get("/countries/{country_code}")
async def get_country(country_code: str):
    """Get detailed country information with top channels"""
    country = await db.countries.find_one({"code": country_code.upper()}, {"_id": 0})
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")
    
    # Get all channels for this country
    channels = await db.channels.find(
        {"country_code": country_code.upper(), "is_active": True},
        {"_id": 0}
    ).sort("subscriber_count", -1).to_list(100)
    
    # Assign ranks
    for idx, channel in enumerate(channels):
        channel["rank"] = idx + 1
    
    # Get recent ranking changes for this country
    recent_changes = await db.rank_history.find(
        {"country_code": country_code.upper()},
        {"_id": 0}
    ).sort("timestamp", -1).limit(10).to_list(10)
    
    return {
        **country,
        "channels": channels,
        "recent_ranking_changes": recent_changes
    }

@router.post("/countries")
async def create_country(country: CountryCreate):
    """Add a new country to track (Admin)"""
    existing = await db.countries.find_one({"code": country.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Country already exists")
    
    country_doc = {
        "code": country.code.upper(),
        "name": country.name,
        "flag_emoji": country.flag_emoji,
        "region": country.region,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.countries.insert_one(country_doc)
    return {"message": "Country created", "country": country_doc}


# ==================== CHANNELS ====================

@router.get("/channels")
async def get_all_channels(
    country_code: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(default=100, le=500),
    skip: int = 0
):
    """Get all tracked channels, optionally filtered by country or search query"""
    query = {"is_active": True}
    if country_code:
        query["country_code"] = country_code.upper()
    
    # Add search filter for channel title
    if search and len(search) >= 2:
        query["title"] = {"$regex": search, "$options": "i"}
    
    channels = await db.channels.find(query, {"_id": 0}).sort(
        "subscriber_count", -1
    ).skip(skip).limit(limit).to_list(limit)
    
    total = await db.channels.count_documents(query)
    
    return {"channels": channels, "total": total, "limit": limit, "skip": skip}

@router.get("/channels/{channel_id}")
async def get_channel(channel_id: str):
    """Get detailed channel information"""
    channel = await db.channels.find_one({"channel_id": channel_id}, {"_id": 0})
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    # Normalize channel data - ensure title and country_name exist
    if "title" not in channel and "name" in channel:
        channel["title"] = channel["name"]
    if "country_name" not in channel and "country_code" in channel:
        # Look up country name from country code
        country = await db.countries.find_one({"code": channel["country_code"]}, {"_id": 0, "name": 1})
        channel["country_name"] = country["name"] if country else channel["country_code"]
    
    # Get growth history
    growth_history = await growth_analyzer.get_growth_history(channel_id, days=30)
    
    # Get top videos
    try:
        top_videos = await youtube_service.get_channel_top_videos(channel_id, max_results=5)
    except Exception as e:
        logger.error(f"Error fetching top videos: {e}")
        top_videos = []
    
    # Get rank history
    rank_history = await ranking_service.get_rank_history(channel_id, days=30)
    
    # Get viral prediction
    viral_info = await growth_analyzer.calculate_viral_score(channel_id)
    
    return {
        **channel,
        "growth_history": growth_history,
        "top_videos": top_videos,
        "rank_history": rank_history,
        "viral_prediction": viral_info
    }


@router.get("/channels/{channel_id}/related")
async def get_related_channels(channel_id: str, limit: int = Query(default=6, le=20)):
    """Get related channels from the same country for internal linking"""
    channel = await db.channels.find_one({"channel_id": channel_id}, {"_id": 0})
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    # Get other channels from the same country, excluding current channel
    related = await db.channels.find(
        {
            "country_code": channel["country_code"],
            "channel_id": {"$ne": channel_id},
            "is_active": True
        },
        {"_id": 0, "channel_id": 1, "title": 1, "thumbnail_url": 1, "subscriber_count": 1, "country_code": 1, "country_name": 1}
    ).sort("subscriber_count", -1).limit(limit).to_list(limit)
    
    return {"related_channels": related, "country_code": channel["country_code"], "country_name": channel.get("country_name", "")}


@router.get("/countries/{country_code}/neighbors")
async def get_neighboring_countries(country_code: str, limit: int = Query(default=8, le=20)):
    """Get neighboring countries from the same region for internal linking"""
    country = await db.countries.find_one({"code": country_code.upper()}, {"_id": 0})
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")
    
    # Get countries from the same region, excluding current country
    neighbors = await db.countries.find(
        {
            "region": country.get("region", ""),
            "code": {"$ne": country_code.upper()}
        },
        {"_id": 0}
    ).to_list(limit)
    
    # For each neighbor, get top channel info
    for neighbor in neighbors:
        top_channel = await db.channels.find_one(
            {"country_code": neighbor["code"], "is_active": True},
            {"_id": 0, "title": 1, "subscriber_count": 1, "thumbnail_url": 1},
            sort=[("subscriber_count", -1)]
        )
        neighbor["top_channel"] = top_channel
    
    return {
        "neighbors": neighbors,
        "current_region": country.get("region", ""),
        "current_country": country["name"]
    }


@router.post("/channels")
async def add_channel(channel_data: ChannelCreate, background_tasks: BackgroundTasks):
    """Add a new channel to track (Admin)"""
    existing = await db.channels.find_one({"channel_id": channel_data.channel_id})
    if existing:
        raise HTTPException(status_code=400, detail="Channel already being tracked")
    
    # Verify country exists
    country = await db.countries.find_one({"code": channel_data.country_code.upper()})
    if not country:
        raise HTTPException(status_code=400, detail="Country not found")
    
    # Fetch channel data from YouTube
    try:
        yt_data = await youtube_service.get_channel_stats(channel_data.channel_id)
        if not yt_data:
            raise HTTPException(status_code=404, detail="YouTube channel not found")
    except Exception as e:
        logger.error(f"Error fetching YouTube data: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    
    # Create channel document
    channel_doc = {
        "channel_id": channel_data.channel_id,
        "title": yt_data.get("title", ""),
        "description": yt_data.get("description", ""),
        "custom_url": yt_data.get("custom_url", ""),
        "country_code": channel_data.country_code.upper(),
        "country_name": country["name"],
        "thumbnail_url": yt_data.get("thumbnail_url", ""),
        "subscriber_count": yt_data.get("subscriber_count", 0),
        "view_count": yt_data.get("view_count", 0),
        "video_count": yt_data.get("video_count", 0),
        "published_at": yt_data.get("published_at", ""),
        "current_rank": 0,
        "previous_rank": 0,
        "daily_subscriber_gain": 0,
        "daily_growth_percent": 0,
        "weekly_growth_percent": 0,
        "monthly_growth_percent": 0,
        "viral_label": "Stable",
        "viral_score": 0,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.channels.insert_one(channel_doc)
    
    # Store initial stats
    await store_channel_stats(channel_data.channel_id, yt_data)
    
    # Update rankings in background
    background_tasks.add_task(ranking_service.update_rankings, channel_data.country_code.upper())
    
    del channel_doc["_id"]
    return {"message": "Channel added", "channel": channel_doc}


# ==================== LEADERBOARDS ====================

@router.get("/leaderboard/global")
async def get_global_leaderboard(response: Response, limit: int = Query(default=200, le=1000)):
    """Get global top channels leaderboard"""
    channels = await ranking_service.get_global_top_100()
    # Add SEO headers
    response.headers["Last-Modified"] = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S GMT")
    response.headers["Cache-Control"] = "public, max-age=300"
    return {"channels": channels[:limit], "total": len(channels)}

@router.get("/leaderboard/country/{country_code}")
async def get_country_leaderboard(response: Response, country_code: str, limit: int = Query(default=50, le=100)):
    """Get country-specific leaderboard"""
    channels = await ranking_service.get_country_leaderboard(country_code.upper(), limit)
    country = await db.countries.find_one({"code": country_code.upper()}, {"_id": 0})
    # Add SEO headers
    response.headers["Last-Modified"] = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S GMT")
    response.headers["Cache-Control"] = "public, max-age=300"
    return {
        "country": country,
        "channels": channels,
        "total": len(channels)
    }

@router.get("/leaderboard/fastest-growing")
async def get_fastest_growing(response: Response, limit: int = Query(default=20, le=100)):
    """Get fastest growing channels by daily growth percentage"""
    channels = await ranking_service.get_fastest_growing(limit)
    response.headers["Last-Modified"] = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S GMT")
    return {"channels": channels}

@router.get("/leaderboard/biggest-gainers")
async def get_biggest_gainers(response: Response, limit: int = Query(default=20, le=100)):
    """Get channels with biggest subscriber gain in 24h"""
    channels = await ranking_service.get_biggest_gainers_24h(limit)
    response.headers["Last-Modified"] = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S GMT")
    return {"channels": channels}


# ==================== STATS & ANALYTICS ====================

@router.get("/stats/map-data")
async def get_map_data(response: Response):
    """Get data for world map visualization - top channel per country"""
    # Cache for 5 minutes
    response.headers["Cache-Control"] = "public, max-age=300"
    
    countries = await db.countries.find({}, {"_id": 0}).to_list(300)
    
    map_data = []
    for country in countries:
        top_channel = await db.channels.find_one(
            {"country_code": country["code"], "is_active": True},
            {"_id": 0},
            sort=[("subscriber_count", -1)]
        )
        
        if top_channel:
            # Handle both 'title' and 'name' field names
            channel_title = top_channel.get("title") or top_channel.get("name") or "Unknown"
            map_data.append({
                "country_code": country["code"],
                "country_name": country["name"],
                "flag_emoji": country.get("flag_emoji", ""),
                "channel_count": await db.channels.count_documents({"country_code": country["code"]}),
                "top_channel": {
                    "channel_id": top_channel.get("channel_id", ""),
                    "title": channel_title,
                    "thumbnail_url": top_channel.get("thumbnail_url", ""),
                    "subscriber_count": top_channel.get("subscriber_count", 0),
                    "viral_label": top_channel.get("viral_label", "Stable")
                }
            })
    
    return {"map_data": map_data}

@router.get("/stats/channel/{channel_id}/history")
async def get_channel_stats_history(channel_id: str, days: int = Query(default=30, le=90)):
    """Get historical stats for a channel"""
    history = await growth_analyzer.get_growth_history(channel_id, days)
    return {"channel_id": channel_id, "history": history, "days": days}

@router.get("/stats/ranking-changes")
async def get_ranking_changes(limit: int = Query(default=20, le=100)):
    """Get recent ranking changes across all countries"""
    changes = await ranking_service.get_recent_ranking_changes(limit)
    return {"changes": changes}


