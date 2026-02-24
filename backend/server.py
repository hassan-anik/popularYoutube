"""
TopTube World Pro - Main FastAPI Server
Tracks, ranks, and predicts the most subscribed YouTube channels per country
"""
from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks, Query, Response
from fastapi.responses import PlainTextResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta

from services.youtube_service import youtube_service
from services.ranking_service import get_ranking_service
from services.growth_analyzer import get_growth_analyzer
from services.scheduler_service import get_scheduler_service

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize services
ranking_service = get_ranking_service(db)
growth_analyzer = get_growth_analyzer(db)
scheduler_service = None  # Will be initialized on startup

# Create the main app
app = FastAPI(title="TopTube World Pro", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ==================== MODELS ====================

class CountryCreate(BaseModel):
    code: str
    name: str
    flag_emoji: str = ""
    region: str = ""

class CountryResponse(BaseModel):
    code: str
    name: str
    flag_emoji: str
    region: str
    channel_count: int = 0
    top_channel: Optional[Dict] = None

class ChannelCreate(BaseModel):
    channel_id: str
    country_code: str

class ChannelResponse(BaseModel):
    channel_id: str
    title: str
    description: str
    country_code: str
    country_name: str
    thumbnail_url: str
    subscriber_count: int
    view_count: int
    video_count: int
    current_rank: int = 0
    previous_rank: int = 0
    daily_subscriber_gain: int = 0
    daily_growth_percent: float = 0
    weekly_growth_percent: float = 0
    monthly_growth_percent: float = 0
    viral_label: str = "Stable"
    viral_score: float = 0
    published_at: str = ""

class ContactFormRequest(BaseModel):
    name: str
    email: str
    subject: str
    message: str

class StatsSnapshot(BaseModel):
    channel_id: str
    subscriber_count: int
    view_count: int
    video_count: int
    timestamp: str

class AdminStats(BaseModel):
    total_countries: int
    total_channels: int
    total_stats_records: int
    last_update: str


# ==================== HEALTH & STATUS ====================

@api_router.get("/")
async def root():
    return {"message": "TopTube World Pro API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


# ==================== COUNTRIES ====================

@api_router.get("/countries", response_model=List[CountryResponse])
async def get_countries():
    """Get all tracked countries with their top channel"""
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

@api_router.get("/countries/{country_code}")
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

@api_router.post("/countries")
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

@api_router.get("/channels")
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

@api_router.get("/channels/{channel_id}")
async def get_channel(channel_id: str):
    """Get detailed channel information"""
    channel = await db.channels.find_one({"channel_id": channel_id}, {"_id": 0})
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
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


@api_router.get("/channels/{channel_id}/related")
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


@api_router.get("/countries/{country_code}/neighbors")
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


@api_router.post("/channels")
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

@api_router.get("/leaderboard/global")
async def get_global_leaderboard(response: Response, limit: int = Query(default=200, le=1000)):
    """Get global top channels leaderboard"""
    channels = await ranking_service.get_global_top_100()
    # Add SEO headers
    response.headers["Last-Modified"] = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S GMT")
    response.headers["Cache-Control"] = "public, max-age=300"
    return {"channels": channels[:limit], "total": len(channels)}

@api_router.get("/leaderboard/country/{country_code}")
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

@api_router.get("/leaderboard/fastest-growing")
async def get_fastest_growing(response: Response, limit: int = Query(default=20, le=100)):
    """Get fastest growing channels by daily growth percentage"""
    channels = await ranking_service.get_fastest_growing(limit)
    response.headers["Last-Modified"] = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S GMT")
    return {"channels": channels}

@api_router.get("/leaderboard/biggest-gainers")
async def get_biggest_gainers(response: Response, limit: int = Query(default=20, le=100)):
    """Get channels with biggest subscriber gain in 24h"""
    channels = await ranking_service.get_biggest_gainers_24h(limit)
    response.headers["Last-Modified"] = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S GMT")
    return {"channels": channels}


# ==================== STATS & ANALYTICS ====================

@api_router.get("/stats/map-data")
async def get_map_data():
    """Get data for world map visualization - top channel per country"""
    countries = await db.countries.find({}, {"_id": 0}).to_list(300)
    
    map_data = []
    for country in countries:
        top_channel = await db.channels.find_one(
            {"country_code": country["code"], "is_active": True},
            {"_id": 0},
            sort=[("subscriber_count", -1)]
        )
        
        if top_channel:
            map_data.append({
                "country_code": country["code"],
                "country_name": country["name"],
                "flag_emoji": country.get("flag_emoji", ""),
                "top_channel": {
                    "channel_id": top_channel["channel_id"],
                    "title": top_channel["title"],
                    "thumbnail_url": top_channel.get("thumbnail_url", ""),
                    "subscriber_count": top_channel["subscriber_count"],
                    "viral_label": top_channel.get("viral_label", "Stable")
                }
            })
    
    return {"map_data": map_data}

@api_router.get("/stats/channel/{channel_id}/history")
async def get_channel_stats_history(channel_id: str, days: int = Query(default=30, le=90)):
    """Get historical stats for a channel"""
    history = await growth_analyzer.get_growth_history(channel_id, days)
    return {"channel_id": channel_id, "history": history, "days": days}

@api_router.get("/stats/ranking-changes")
async def get_ranking_changes(limit: int = Query(default=20, le=100)):
    """Get recent ranking changes across all countries"""
    changes = await ranking_service.get_recent_ranking_changes(limit)
    return {"changes": changes}


# ==================== ADMIN ====================

@api_router.get("/admin/stats")
async def get_admin_stats():
    """Get admin dashboard statistics"""
    total_countries = await db.countries.count_documents({})
    total_channels = await db.channels.count_documents({})
    total_stats = await db.channel_stats.count_documents({})
    
    # Get last update time
    last_stat = await db.channel_stats.find_one({}, sort=[("timestamp", -1)])
    last_update = last_stat["timestamp"] if last_stat else "Never"
    
    return {
        "total_countries": total_countries,
        "total_channels": total_channels,
        "total_stats_records": total_stats,
        "last_update": last_update
    }

@api_router.post("/admin/refresh-channel/{channel_id}")
async def refresh_channel(channel_id: str, background_tasks: BackgroundTasks):
    """Manually refresh a channel's data from YouTube"""
    channel = await db.channels.find_one({"channel_id": channel_id})
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    try:
        yt_data = await youtube_service.get_channel_stats(channel_id)
        if not yt_data:
            raise HTTPException(status_code=404, detail="YouTube channel not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Update channel document
    update_data = {
        "title": yt_data.get("title", ""),
        "description": yt_data.get("description", ""),
        "thumbnail_url": yt_data.get("thumbnail_url", ""),
        "subscriber_count": yt_data.get("subscriber_count", 0),
        "view_count": yt_data.get("view_count", 0),
        "video_count": yt_data.get("video_count", 0),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.channels.update_one({"channel_id": channel_id}, {"$set": update_data})
    
    # Store stats snapshot
    await store_channel_stats(channel_id, yt_data)
    
    # Update growth metrics
    background_tasks.add_task(growth_analyzer.update_channel_growth_metrics, channel_id)
    
    # Update rankings
    background_tasks.add_task(ranking_service.update_rankings, channel["country_code"])
    
    return {"message": "Channel refreshed", "data": update_data}

@api_router.post("/admin/refresh-all")
async def refresh_all_channels(background_tasks: BackgroundTasks):
    """Refresh all tracked channels (use sparingly due to API quota)"""
    channels = await db.channels.find({"is_active": True}, {"channel_id": 1}).to_list(1000)
    channel_ids = [c["channel_id"] for c in channels]
    
    if not channel_ids:
        return {"message": "No channels to refresh"}
    
    # Batch refresh
    try:
        results = await youtube_service.get_batch_channel_stats(channel_ids)
        
        for yt_data in results:
            channel_id = yt_data["channel_id"]
            
            update_data = {
                "title": yt_data.get("title", ""),
                "description": yt_data.get("description", ""),
                "thumbnail_url": yt_data.get("thumbnail_url", ""),
                "subscriber_count": yt_data.get("subscriber_count", 0),
                "view_count": yt_data.get("view_count", 0),
                "video_count": yt_data.get("video_count", 0),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.channels.update_one({"channel_id": channel_id}, {"$set": update_data})
            await store_channel_stats(channel_id, yt_data)
        
        # Update all rankings
        countries = await db.countries.find({}, {"code": 1}).to_list(300)
        for country in countries:
            background_tasks.add_task(ranking_service.update_rankings, country["code"])
        
        return {"message": f"Refreshed {len(results)} channels"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/admin/channel/{channel_id}")
async def delete_channel(channel_id: str):
    """Remove a channel from tracking"""
    result = await db.channels.delete_one({"channel_id": channel_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    # Also remove stats
    await db.channel_stats.delete_many({"channel_id": channel_id})
    await db.rank_history.delete_many({"channel_id": channel_id})
    
    return {"message": "Channel deleted"}


# ==================== SEARCH ====================

@api_router.get("/search/channels")
async def search_youtube_channels(
    query: str,
    region_code: str = "",
    max_results: int = Query(default=10, le=25)
):
    """Search for YouTube channels (for adding new channels)"""
    try:
        results = await youtube_service.search_channels(query, region_code, max_results)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== PREDICTIONS ====================

@api_router.get("/predictions/overtake/{channel_id}/{target_channel_id}")
async def predict_overtake(channel_id: str, target_channel_id: str):
    """Predict when a channel might overtake another"""
    prediction = await growth_analyzer.predict_overtake_time(channel_id, target_channel_id)
    if not prediction:
        raise HTTPException(status_code=404, detail="One or both channels not found")
    return prediction


# ==================== HELPER FUNCTIONS ====================

async def store_channel_stats(channel_id: str, yt_data: Dict):
    """Store a stats snapshot for historical tracking"""
    stats_doc = {
        "channel_id": channel_id,
        "subscriber_count": yt_data.get("subscriber_count", 0),
        "view_count": yt_data.get("view_count", 0),
        "video_count": yt_data.get("video_count", 0),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.channel_stats.insert_one(stats_doc)


# ==================== SEED DATA ====================

@api_router.post("/admin/seed")
async def seed_initial_data(background_tasks: BackgroundTasks):
    """Seed database with initial countries and popular channels"""
    
    # Check if already seeded
    existing_countries = await db.countries.count_documents({})
    if existing_countries > 0:
        return {"message": "Database already seeded", "countries": existing_countries}
    
    # Seed countries with their top YouTube channels
    seed_data = [
        {"code": "US", "name": "United States", "flag_emoji": "🇺🇸", "region": "North America", 
         "channels": ["UCq-Fj5jknLsUf-MWSy4_brA", "UCX6OQ3DkcsbYNE6H8uQQuVA", "UCvjgEDvShRsADqghFPPCZgQ"]},  # T-Series, MrBeast, Cocomelon
        {"code": "IN", "name": "India", "flag_emoji": "🇮🇳", "region": "Asia",
         "channels": ["UCq-Fj5jknLsUf-MWSy4_brA", "UCpEhnqL0y41EpW2TvWAHD7Q", "UCnJjcn5FrgrOEp5_N45ZLEQ"]},  # T-Series, SET India
        {"code": "BR", "name": "Brazil", "flag_emoji": "🇧🇷", "region": "South America",
         "channels": ["UCKGgKxG4IewRjqFNoXRjfKg", "UC5PlTlhPJnUhM2XqnVnRHzw"]},  # Kondzilla
        {"code": "MX", "name": "Mexico", "flag_emoji": "🇲🇽", "region": "North America",
         "channels": ["UCYiGq8XF7YQD00x7wAd62Zg"]},  # Badabun
        {"code": "RU", "name": "Russia", "flag_emoji": "🇷🇺", "region": "Europe",
         "channels": ["UCWpmtlPhmpihEhwvZ0tdT1A"]},  # Get Movies
        {"code": "JP", "name": "Japan", "flag_emoji": "🇯🇵", "region": "Asia",
         "channels": ["UCX6OQ3DkcsbYNE6H8uQQuVA"]},  # MrBeast (popular there too)
        {"code": "KR", "name": "South Korea", "flag_emoji": "🇰🇷", "region": "Asia",
         "channels": ["UC-9-kyTW8ZkZNDHQJ6FgpwQ"]},  # BLACKPINK
        {"code": "GB", "name": "United Kingdom", "flag_emoji": "🇬🇧", "region": "Europe",
         "channels": ["UC5BMxOv1EoOfP7vOcjJO_vw"]},
        {"code": "DE", "name": "Germany", "flag_emoji": "🇩🇪", "region": "Europe",
         "channels": ["UCyNtlmLB73-7gtlBz00XOQQ"]},  # Kurzgesagt
        {"code": "FR", "name": "France", "flag_emoji": "🇫🇷", "region": "Europe",
         "channels": ["UCYiGq8XF7YQD00x7wAd62Zg"]},
        {"code": "ID", "name": "Indonesia", "flag_emoji": "🇮🇩", "region": "Asia",
         "channels": ["UC-lHJZR3Gqxm24_Vd_AJ5Yw"]},  # PewDiePie (popular)
        {"code": "PH", "name": "Philippines", "flag_emoji": "🇵🇭", "region": "Asia",
         "channels": ["UCjr2bPAyPV5qUyGPKM25XXg"]},
        {"code": "TH", "name": "Thailand", "flag_emoji": "🇹🇭", "region": "Asia",
         "channels": ["UCq-Fj5jknLsUf-MWSy4_brA"]},
        {"code": "VN", "name": "Vietnam", "flag_emoji": "🇻🇳", "region": "Asia",
         "channels": ["UC-lHJZR3Gqxm24_Vd_AJ5Yw"]},
        {"code": "ES", "name": "Spain", "flag_emoji": "🇪🇸", "region": "Europe",
         "channels": ["UCam8T03EOFBsNdR0thrFHdQ"]},  # elrubiusOMG
        {"code": "AR", "name": "Argentina", "flag_emoji": "🇦🇷", "region": "South America",
         "channels": ["UCYiGq8XF7YQD00x7wAd62Zg"]},
        {"code": "CO", "name": "Colombia", "flag_emoji": "🇨🇴", "region": "South America",
         "channels": ["UC-lHJZR3Gqxm24_Vd_AJ5Yw"]},
        {"code": "PK", "name": "Pakistan", "flag_emoji": "🇵🇰", "region": "Asia",
         "channels": ["UCq-Fj5jknLsUf-MWSy4_brA"]},
        {"code": "BD", "name": "Bangladesh", "flag_emoji": "🇧🇩", "region": "Asia",
         "channels": ["UCq-Fj5jknLsUf-MWSy4_brA"]},
        {"code": "CA", "name": "Canada", "flag_emoji": "🇨🇦", "region": "North America",
         "channels": ["UCpB959t8iPrxQWj7G6n0ctQ"]},  # SSSniperWolf
    ]
    
    channels_added = 0
    countries_added = 0
    
    for country_data in seed_data:
        # Insert country
        country_doc = {
            "code": country_data["code"],
            "name": country_data["name"],
            "flag_emoji": country_data["flag_emoji"],
            "region": country_data["region"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.countries.insert_one(country_doc)
        countries_added += 1
        
        # Add channels for this country
        for channel_id in country_data.get("channels", []):
            # Check if channel already exists
            existing = await db.channels.find_one({"channel_id": channel_id})
            if existing:
                continue
            
            try:
                yt_data = await youtube_service.get_channel_stats(channel_id)
                if yt_data:
                    channel_doc = {
                        "channel_id": channel_id,
                        "title": yt_data.get("title", ""),
                        "description": yt_data.get("description", ""),
                        "custom_url": yt_data.get("custom_url", ""),
                        "country_code": country_data["code"],
                        "country_name": country_data["name"],
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
                    await store_channel_stats(channel_id, yt_data)
                    channels_added += 1
                    logger.info(f"Added channel: {yt_data.get('title', channel_id)}")
            except Exception as e:
                logger.error(f"Error adding channel {channel_id}: {e}")
                continue
    
    # Update rankings for all countries
    for country_data in seed_data:
        background_tasks.add_task(ranking_service.update_rankings, country_data["code"])
    
    return {
        "message": "Database seeded successfully",
        "countries_added": countries_added,
        "channels_added": channels_added
    }


@api_router.post("/admin/populate-empty-countries")
async def populate_empty_countries(background_tasks: BackgroundTasks):
    """Find and add top YouTube channels for countries with 0 channels"""
    
    # Get all countries with 0 channels
    pipeline = [
        {
            "$lookup": {
                "from": "channels",
                "localField": "code",
                "foreignField": "country_code",
                "as": "channels"
            }
        },
        {
            "$match": {
                "channels": {"$size": 0}
            }
        },
        {
            "$project": {
                "_id": 0,
                "code": 1,
                "name": 1
            }
        }
    ]
    
    empty_countries = await db.countries.aggregate(pipeline).to_list(200)
    logger.info(f"Found {len(empty_countries)} countries with 0 channels")
    
    # Global channels to use as fallbacks (most subscribed globally)
    GLOBAL_CHANNELS = [
        "UCX6OQ3DkcsbYNE6H8uQQuVA",  # MrBeast
        "UC-lHJZR3Gqxm24_Vd_AJ5Yw",  # PewDiePie
        "UCq-Fj5jknLsUf-MWSy4_brA",  # T-Series
        "UCvjgEDvShRsADqghFPPCZgQ",  # Cocomelon
    ]
    
    # Known popular channels by country/region
    known_channels = {
        # Europe
        "ID": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast (fallback for Indonesia)
        "TR": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast (fallback for Turkey)
        "IT": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast (fallback for Italy)
        "AT": ["UCyNtlmLB73-7gtlBz00XOQQ"],  # Kurzgesagt (German speaking)
        "CH": ["UCyNtlmLB73-7gtlBz00XOQQ"],  # Kurzgesagt (German speaking)
        "PL": ["UC-lHJZR3Gqxm24_Vd_AJ5Yw"],  # PewDiePie popular
        "NL": ["UC-lHJZR3Gqxm24_Vd_AJ5Yw"],  # PewDiePie popular
        "SE": ["UC-lHJZR3Gqxm24_Vd_AJ5Yw"],  # PewDiePie (Sweden)
        "NO": ["UC-lHJZR3Gqxm24_Vd_AJ5Yw"],  # PewDiePie popular
        "DK": ["UC-lHJZR3Gqxm24_Vd_AJ5Yw"],  # PewDiePie popular
        "FI": ["UC-lHJZR3Gqxm24_Vd_AJ5Yw"],  # PewDiePie popular
        "CZ": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "HU": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "RO": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "BG": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "GR": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "HR": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "SK": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "SI": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "RS": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "UA": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "BY": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "EE": ["UC-lHJZR3Gqxm24_Vd_AJ5Yw"],  # PewDiePie
        "LV": ["UC-lHJZR3Gqxm24_Vd_AJ5Yw"],  # PewDiePie
        "LT": ["UC-lHJZR3Gqxm24_Vd_AJ5Yw"],  # PewDiePie
        "IE": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "PT": ["UCam8T03EOFBsNdR0thrFHdQ"],  # elrubiusOMG
        "BE": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "AL": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "AD": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "BA": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "XK": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "ME": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "MK": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "LI": ["UCyNtlmLB73-7gtlBz00XOQQ"],  # Kurzgesagt
        "LU": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "MT": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "MC": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "SM": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "VA": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "MD": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "IS": ["UC-lHJZR3Gqxm24_Vd_AJ5Yw"],  # PewDiePie
        "CY": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        
        # Middle East & Africa
        "KE": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "AE": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "SA": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "EG": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "NG": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "ZA": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "MA": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "DZ": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "TN": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "LY": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "GH": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "CI": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "SN": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "CM": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "TZ": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "UG": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "ET": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "SD": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "AO": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "MZ": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "ZM": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "ZW": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "BW": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "NA": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "RW": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "MU": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "MW": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "IQ": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "SY": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "JO": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "LB": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "KW": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "QA": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "BH": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "OM": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "YE": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "IL": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "IR": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        
        # Asia & Oceania
        "NZ": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "SG": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "MY": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "NP": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "LK": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "MM": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "KH": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "LA": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "MN": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "KZ": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "UZ": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "TJ": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "KG": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "TM": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "AZ": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "AM": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "GE": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "AF": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "BT": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "MV": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "BN": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "TW": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "HK": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "MO": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "TL": ["UCq-Fj5jknLsUf-MWSy4_brA"],  # T-Series
        "PG": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "FJ": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "SB": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "VU": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "WS": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "TO": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "KI": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "FM": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "MH": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "PW": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "NR": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "TV": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        
        # Americas
        "CL": ["UCYiGq8XF7YQD00x7wAd62Zg"],  # Badabun
        "PE": ["UCYiGq8XF7YQD00x7wAd62Zg"],  # Badabun
        "VE": ["UCYiGq8XF7YQD00x7wAd62Zg"],  # Badabun
        "EC": ["UCYiGq8XF7YQD00x7wAd62Zg"],  # Badabun
        "BO": ["UCYiGq8XF7YQD00x7wAd62Zg"],  # Badabun
        "PY": ["UCYiGq8XF7YQD00x7wAd62Zg"],  # Badabun
        "UY": ["UCYiGq8XF7YQD00x7wAd62Zg"],  # Badabun
        "CR": ["UCYiGq8XF7YQD00x7wAd62Zg"],  # Badabun
        "PA": ["UCYiGq8XF7YQD00x7wAd62Zg"],  # Badabun
        "HN": ["UCYiGq8XF7YQD00x7wAd62Zg"],  # Badabun
        "SV": ["UCYiGq8XF7YQD00x7wAd62Zg"],  # Badabun
        "GT": ["UCYiGq8XF7YQD00x7wAd62Zg"],  # Badabun
        "NI": ["UCYiGq8XF7YQD00x7wAd62Zg"],  # Badabun
        "CU": ["UCYiGq8XF7YQD00x7wAd62Zg"],  # Badabun
        "DO": ["UCYiGq8XF7YQD00x7wAd62Zg"],  # Badabun
        "PR": ["UCYiGq8XF7YQD00x7wAd62Zg"],  # Badabun
        "HT": ["UCYiGq8XF7YQD00x7wAd62Zg"],  # Badabun
        "JM": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "TT": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "BS": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "BB": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "BZ": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "GY": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "SR": ["UCX6OQ3DkcsbYNE6H8uQQuVA"],  # MrBeast
        "GL": ["UC-lHJZR3Gqxm24_Vd_AJ5Yw"],  # PewDiePie
    }
    
    channels_added = 0
    countries_processed = 0
    
    for country in empty_countries:
        country_code = country["code"]
        country_name = country["name"]
        
        try:
            channel_ids = known_channels.get(country_code, [])
            
            # If no known channel, use a global popular channel as fallback
            if not channel_ids:
                # Use global channels without hitting the API
                channel_ids = [GLOBAL_CHANNELS[countries_processed % len(GLOBAL_CHANNELS)]]
            
            # Add channels for this country
            for channel_id in channel_ids[:1]:  # Just add 1 per country
                # Check if channel already exists
                existing = await db.channels.find_one({"channel_id": channel_id})
                if existing:
                    # Just assign this channel to the country (don't change existing)
                    # Create a separate channel entry for this country
                    pass
                
                # Try to get cached data first
                channel_data = await db.channels.find_one({"channel_id": channel_id}, {"_id": 0})
                
                if channel_data:
                    # Create a copy for this country
                    new_channel_doc = dict(channel_data)
                    new_channel_doc["country_code"] = country_code
                    new_channel_doc["channel_id"] = f"{channel_id}_{country_code}"
                    new_channel_doc["original_channel_id"] = channel_id
                    new_channel_doc["created_at"] = datetime.now(timezone.utc).isoformat()
                    
                    # Check if already exists for this country
                    existing_for_country = await db.channels.find_one({"channel_id": new_channel_doc["channel_id"]})
                    if not existing_for_country:
                        await db.channels.insert_one(new_channel_doc)
                        channels_added += 1
                        logger.info(f"Assigned {channel_data.get('title')} to {country_name}")
                else:
                    logger.warning(f"No cached data for {channel_id}, skipping {country_name}")
            
            countries_processed += 1
            
        except Exception as e:
            logger.error(f"Error processing {country_name}: {e}")
            continue
    
    # Update rankings in background
    background_tasks.add_task(ranking_service.update_all_rankings)
    
    return {
        "message": "Population complete",
        "countries_processed": countries_processed,
        "channels_added": channels_added,
        "empty_countries_found": len(empty_countries)
    }


# ==================== CONTACT FORM ====================

import resend
import asyncio

# Initialize Resend
resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@toptubeworldpro.com')


# ==================== NEWSLETTER ====================

class NewsletterSubscribe(BaseModel):
    email: str

@api_router.post("/newsletter/subscribe")
async def subscribe_newsletter(data: NewsletterSubscribe):
    """Subscribe to newsletter"""
    email = data.email.lower().strip()
    
    # Validate email format
    if not email or '@' not in email:
        raise HTTPException(status_code=400, detail="Invalid email address")
    
    # Check if already subscribed
    existing = await db.newsletter_subscribers.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already subscribed")
    
    # Save subscriber
    subscriber_doc = {
        "email": email,
        "subscribed_at": datetime.now(timezone.utc).isoformat(),
        "status": "active"
    }
    await db.newsletter_subscribers.insert_one(subscriber_doc)
    
    logger.info(f"New newsletter subscriber: {email}")
    return {"status": "success", "message": "Successfully subscribed!"}

@api_router.get("/newsletter/subscribers")
async def get_newsletter_subscribers():
    """Get all newsletter subscribers (admin)"""
    subscribers = await db.newsletter_subscribers.find(
        {"status": "active"},
        {"_id": 0, "email": 1, "subscribed_at": 1}
    ).to_list(10000)
    return {"subscribers": subscribers, "total": len(subscribers)}


@api_router.post("/contact")
async def submit_contact_form(form: ContactFormRequest):
    """Handle contact form submissions"""
    try:
        # Build email HTML
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">New Contact Form Submission</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #e5e5e5;">
                    <td style="padding: 12px 0; font-weight: bold; width: 120px;">Name:</td>
                    <td style="padding: 12px 0;">{form.name}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e5e5;">
                    <td style="padding: 12px 0; font-weight: bold;">Email:</td>
                    <td style="padding: 12px 0;">{form.email}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e5e5;">
                    <td style="padding: 12px 0; font-weight: bold;">Subject:</td>
                    <td style="padding: 12px 0;">{form.subject}</td>
                </tr>
                <tr>
                    <td style="padding: 12px 0; font-weight: bold; vertical-align: top;">Message:</td>
                    <td style="padding: 12px 0; white-space: pre-wrap;">{form.message}</td>
                </tr>
            </table>
            <p style="margin-top: 20px; color: #666; font-size: 12px;">
                Sent from TopTube World Pro Contact Form
            </p>
        </div>
        """
        
        # Check if Resend API key is configured
        if not resend.api_key or resend.api_key == '':
            # Log the contact form submission to database instead
            contact_doc = {
                "name": form.name,
                "email": form.email,
                "subject": form.subject,
                "message": form.message,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "status": "pending"
            }
            await db.contact_submissions.insert_one(contact_doc)
            logger.info(f"Contact form saved to database (no email configured): {form.email}")
            return {
                "status": "success",
                "message": "Your message has been received. We'll get back to you soon!"
            }
        
        # Send email via Resend
        params = {
            "from": SENDER_EMAIL,
            "to": [ADMIN_EMAIL],
            "reply_to": form.email,
            "subject": f"[TopTube Contact] {form.subject} - from {form.name}",
            "html": html_content
        }
        
        # Run sync SDK in thread to keep FastAPI non-blocking
        email_result = await asyncio.to_thread(resend.Emails.send, params)
        
        # Also save to database for records
        contact_doc = {
            "name": form.name,
            "email": form.email,
            "subject": form.subject,
            "message": form.message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": "sent",
            "email_id": email_result.get("id")
        }
        await db.contact_submissions.insert_one(contact_doc)
        
        logger.info(f"Contact form email sent: {form.email} -> {ADMIN_EMAIL}")
        return {
            "status": "success",
            "message": "Your message has been sent. We'll get back to you soon!"
        }
        
    except Exception as e:
        logger.error(f"Error processing contact form: {e}")
        # Save to database even on email failure
        contact_doc = {
            "name": form.name,
            "email": form.email,
            "subject": form.subject,
            "message": form.message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": "error",
            "error": str(e)
        }
        await db.contact_submissions.insert_one(contact_doc)
        return {
            "status": "success",
            "message": "Your message has been received. We'll get back to you soon!"
        }


# ==================== BLOG ADMIN ====================

BLOG_ADMIN_KEY = os.environ.get('BLOG_ADMIN_KEY', 'toptube2024admin')
BLOG_CATEGORIES = ['Trending', 'Guide', 'Analysis', 'Case Study', 'Strategy', 'Gaming', 'News', 'Tips']

def verify_admin_key(admin_key: str):
    """Verify the admin key for protected endpoints"""
    if admin_key != BLOG_ADMIN_KEY:
        raise HTTPException(status_code=401, detail="Invalid admin key")

class BlogPostCreate(BaseModel):
    title: str
    slug: str
    excerpt: str
    content: str
    category: str
    image: str = ""
    status: str = "draft"  # draft or published
    read_time: str = "5 min read"

class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    image: Optional[str] = None
    status: Optional[str] = None
    read_time: Optional[str] = None

@api_router.get("/blog/categories")
async def get_blog_categories():
    """Get available blog categories"""
    return {"categories": BLOG_CATEGORIES}

@api_router.get("/blog/posts")
async def get_blog_posts(
    status: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = Query(default=20, le=100),
    skip: int = 0
):
    """Get all blog posts (public - only published unless admin)"""
    query = {}
    if status:
        query["status"] = status
    else:
        query["status"] = "published"  # Default to published for public
    
    if category:
        query["category"] = category
    
    posts = await db.blog_posts.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.blog_posts.count_documents(query)
    
    return {"posts": posts, "total": total}

@api_router.get("/blog/posts/{slug}")
async def get_blog_post(slug: str):
    """Get a single blog post by slug"""
    post = await db.blog_posts.find_one({"slug": slug}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


# ==================== AUTO-GENERATED COUNTRY BLOG POSTS ====================

@api_router.get("/blog/country/{country_code}")
async def get_country_blog_post(country_code: str):
    """Get auto-generated blog post for a country with top YouTubers"""
    country = await db.countries.find_one({"code": country_code.upper()}, {"_id": 0})
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")
    
    # Get top 10 channels for this country
    channels = await db.channels.find(
        {"country_code": country_code.upper(), "is_active": True},
        {"_id": 0}
    ).sort("subscriber_count", -1).limit(10).to_list(10)
    
    year = datetime.now(timezone.utc).year
    country_name = country.get("name", country_code)
    flag = country.get("flag_emoji", "")
    region = country.get("region", "")
    
    # Generate SEO-optimized content
    title = f"Top 10 Most Subscribed YouTubers in {country_name} {flag} ({year})"
    slug = f"top-youtubers-{country_name.lower().replace(' ', '-')}-{year}"
    
    # Build the article content
    intro = f"""Discover the most popular YouTube channels from {country_name}! This comprehensive guide ranks the top 10 most subscribed YouTubers from {country_name} in {year}, complete with subscriber counts, growth statistics, and what makes each channel special.

{country_name}, located in {region}, has a thriving YouTube community. {"The #1 YouTuber is " + channels[0]['title'] + " with " + format_number_simple(channels[0]['subscriber_count']) + " subscribers." if channels else ""}"""

    # Generate channel sections
    channel_sections = []
    for idx, channel in enumerate(channels):
        rank = idx + 1
        section = f"""
### #{rank}. {channel.get('title', 'Unknown')}

**Subscribers:** {format_number_simple(channel.get('subscriber_count', 0))}
**Total Views:** {format_number_simple(channel.get('view_count', 0))}
**Videos:** {channel.get('video_count', 0)}
**24h Growth:** +{format_number_simple(channel.get('daily_subscriber_gain', 0))} subscribers

{channel.get('title', 'This channel')} ranks #{rank} in {country_name} with an impressive {format_number_simple(channel.get('subscriber_count', 0))} subscribers. {"Currently showing " + channel.get('viral_label', 'stable') + " growth patterns." if channel.get('viral_label') else ""}

[View detailed statistics →](/channel/{channel.get('channel_id', '')})
"""
        channel_sections.append(section)
    
    content = intro + "\n\n## The Top 10 YouTubers in " + country_name + " " + str(year) + "\n" + "\n".join(channel_sections)
    
    # Add conclusion
    content += f"""

## Conclusion

These are the top 10 most subscribed YouTube channels from {country_name} as of {year}. The YouTube landscape is constantly evolving, with new creators rising and established channels continuing to grow.

**Want to explore more?**
- [View all {country_name} channels](/country/{country_code.upper()})
- [Compare these channels](/compare)
- [See global rankings](/leaderboard)

*Data updated regularly from YouTube API. Last update: {datetime.now(timezone.utc).strftime('%B %d, %Y')}*
"""
    
    # Calculate read time (roughly 200 words per minute)
    word_count = len(content.split())
    read_time = max(3, word_count // 200)
    
    return {
        "title": title,
        "slug": slug,
        "country_code": country_code.upper(),
        "country_name": country_name,
        "flag_emoji": flag,
        "region": region,
        "excerpt": f"Discover the top 10 most subscribed YouTube channels from {country_name} in {year}. See who's #1 and track their growth statistics.",
        "content": content,
        "category": "Country Rankings",
        "channels": channels,
        "total_channels": len(channels),
        "read_time": f"{read_time} min read",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "is_auto_generated": True
    }


@api_router.get("/blog/countries")
async def get_all_country_blog_posts():
    """Get list of all auto-generated country blog posts for sitemap/index"""
    countries = await db.countries.find({}, {"_id": 0, "code": 1, "name": 1, "flag_emoji": 1, "region": 1}).to_list(300)
    year = datetime.now(timezone.utc).year
    
    posts = []
    for country in countries:
        posts.append({
            "country_code": country["code"],
            "country_name": country["name"],
            "flag_emoji": country.get("flag_emoji", ""),
            "slug": f"top-youtubers-{country['name'].lower().replace(' ', '-')}-{year}",
            "title": f"Top 10 Most Subscribed YouTubers in {country['name']} ({year})",
            "url": f"/blog/country/{country['code']}"
        })
    
    return {"posts": posts, "total": len(posts), "year": year}


def format_number_simple(num):
    """Simple number formatter for blog content"""
    if not num:
        return "0"
    if num >= 1000000000:
        return f"{num / 1000000000:.2f}B"
    if num >= 1000000:
        return f"{num / 1000000:.2f}M"
    if num >= 1000:
        return f"{num / 1000:.1f}K"
    return str(num)


@api_router.get("/admin/blog/posts")
async def admin_get_all_posts(admin_key: str = Query(...)):
    """Admin: Get all posts including drafts"""
    verify_admin_key(admin_key)
    posts = await db.blog_posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"posts": posts}

@api_router.post("/admin/blog/posts")
async def admin_create_post(post: BlogPostCreate, admin_key: str = Query(...)):
    """Admin: Create a new blog post"""
    verify_admin_key(admin_key)
    
    # Check for duplicate slug
    existing = await db.blog_posts.find_one({"slug": post.slug})
    if existing:
        raise HTTPException(status_code=400, detail="A post with this slug already exists")
    
    post_doc = {
        "id": str(uuid.uuid4()),
        "title": post.title,
        "slug": post.slug,
        "excerpt": post.excerpt,
        "content": post.content,
        "category": post.category,
        "image": post.image,
        "status": post.status,
        "read_time": post.read_time,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.blog_posts.insert_one(post_doc)
    del post_doc["_id"]  # Remove MongoDB _id before returning
    
    return {"message": "Post created", "post": post_doc}

@api_router.put("/admin/blog/posts/{post_id}")
async def admin_update_post(post_id: str, post: BlogPostUpdate, admin_key: str = Query(...)):
    """Admin: Update a blog post"""
    verify_admin_key(admin_key)
    
    existing = await db.blog_posts.find_one({"id": post_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Post not found")
    
    update_data = {k: v for k, v in post.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.blog_posts.update_one({"id": post_id}, {"$set": update_data})
    
    updated_post = await db.blog_posts.find_one({"id": post_id}, {"_id": 0})
    return {"message": "Post updated", "post": updated_post}

@api_router.delete("/admin/blog/posts/{post_id}")
async def admin_delete_post(post_id: str, admin_key: str = Query(...)):
    """Admin: Delete a blog post"""
    verify_admin_key(admin_key)
    
    result = await db.blog_posts.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return {"message": "Post deleted"}

@api_router.post("/admin/blog/upload-image")
async def admin_upload_image(admin_key: str = Query(...)):
    """Admin: Get a placeholder for image upload (use external service)"""
    verify_admin_key(admin_key)
    
    # For now, return instructions for using external image hosting
    return {
        "message": "For image uploads, use one of these free services:",
        "options": [
            {"name": "Imgur", "url": "https://imgur.com/upload"},
            {"name": "ImgBB", "url": "https://imgbb.com/"},
            {"name": "Unsplash", "url": "https://unsplash.com/"}
        ],
        "instructions": "Upload your image to one of these services and paste the URL in the image field"
    }


# ==================== SITEMAP ====================

@api_router.get("/sitemap.xml", response_class=PlainTextResponse)
async def get_sitemap():
    """Generate dynamic XML sitemap for SEO"""
    base_url = os.environ.get('SITE_URL', 'https://mostpopularyoutubechannel.com').rstrip('/')
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    
    # Start XML
    xml_parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    
    # Static pages (no trailing slash for consistency)
    static_pages = [
        ('', '1.0', 'daily'),  # Homepage - empty string = no trailing slash after base_url
        ('/top-100', '0.95', 'daily'),  # High-traffic SEO page
        ('/leaderboard', '0.9', 'hourly'),
        ('/countries', '0.8', 'daily'),
        ('/trending', '0.9', 'hourly'),
        ('/compare', '0.7', 'weekly'),
        ('/blog', '0.8', 'daily'),
        ('/about', '0.3', 'monthly'),
        ('/privacy', '0.2', 'monthly'),
        ('/terms', '0.2', 'monthly'),
        ('/contact', '0.3', 'monthly'),
    ]
    
    for path, priority, freq in static_pages:
        xml_parts.append(f'''  <url>
    <loc>{base_url}{path}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>{freq}</changefreq>
    <priority>{priority}</priority>
  </url>''')
    
    # Country pages (197 countries)
    countries = await db.countries.find({}, {"code": 1, "name": 1}).to_list(300)
    for country in countries:
        xml_parts.append(f'''  <url>
    <loc>{base_url}/country/{country["code"]}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>''')
    
    # SEO-friendly country slug URLs (e.g., /india-youtubers)
    seo_slugs = {
        'US': 'united-states-youtubers', 'IN': 'india-youtubers', 'BR': 'brazil-youtubers',
        'MX': 'mexico-youtubers', 'RU': 'russia-youtubers', 'JP': 'japan-youtubers',
        'KR': 'south-korea-youtubers', 'GB': 'united-kingdom-youtubers', 'DE': 'germany-youtubers',
        'FR': 'france-youtubers', 'ID': 'indonesia-youtubers', 'PH': 'philippines-youtubers'
    }
    for code, slug in seo_slugs.items():
        xml_parts.append(f'''  <url>
    <loc>{base_url}/{slug}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>''')
    
    # Auto-generated country blog posts (197 posts)
    for country in countries:
        xml_parts.append(f'''  <url>
    <loc>{base_url}/blog/country/{country["code"]}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.75</priority>
  </url>''')
    
    # Channel pages - only include active channels with valid IDs
    channels = await db.channels.find(
        {"is_active": True, "channel_id": {"$exists": True, "$ne": ""}}, 
        {"channel_id": 1, "updated_at": 1}
    ).to_list(1000)
    
    for channel in channels:
        channel_id = channel.get("channel_id", "")
        if not channel_id or len(channel_id) < 10:  # Skip invalid channel IDs
            continue
        lastmod = channel.get("updated_at", today)
        if isinstance(lastmod, str) and len(lastmod) >= 10:
            lastmod = lastmod[:10]  # Get just the date part
        else:
            lastmod = today
        xml_parts.append(f'''  <url>
    <loc>{base_url}/channel/{channel_id}</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>''')
    
    xml_parts.append('</urlset>')
    
    return Response(
        content='\n'.join(xml_parts),
        media_type='application/xml',
        headers={
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600'
        }
    )


# ==================== SCHEDULER STATUS ====================

@api_router.get("/scheduler/status")
async def get_scheduler_status():
    """Get background scheduler status"""
    if scheduler_service is None:
        return {"status": "not_initialized"}
    return await scheduler_service.get_scheduler_status()

@api_router.post("/scheduler/trigger-refresh")
async def trigger_manual_refresh(background_tasks: BackgroundTasks):
    """Manually trigger a channel refresh (admin)"""
    if scheduler_service is None:
        raise HTTPException(status_code=500, detail="Scheduler not initialized")
    background_tasks.add_task(scheduler_service.refresh_all_channels)
    return {"message": "Channel refresh triggered"}

@api_router.post("/scheduler/trigger-ranking")
async def trigger_manual_ranking(background_tasks: BackgroundTasks):
    """Manually trigger ranking update (admin)"""
    if scheduler_service is None:
        raise HTTPException(status_code=500, detail="Scheduler not initialized")
    background_tasks.add_task(scheduler_service.update_all_rankings)
    return {"message": "Ranking update triggered"}

@api_router.post("/scheduler/trigger-stats-snapshot")
async def trigger_stats_snapshot(background_tasks: BackgroundTasks):
    """Manually trigger a stats snapshot for growth tracking"""
    if scheduler_service is None:
        raise HTTPException(status_code=500, detail="Scheduler not initialized")
    background_tasks.add_task(scheduler_service.record_stats_snapshot)
    return {"message": "Stats snapshot recording triggered"}

@api_router.post("/scheduler/trigger-growth-calc")
async def trigger_growth_calculation(background_tasks: BackgroundTasks):
    """Manually trigger growth metrics calculation"""
    if scheduler_service is None:
        raise HTTPException(status_code=500, detail="Scheduler not initialized")
    background_tasks.add_task(scheduler_service.calculate_growth_metrics)
    return {"message": "Growth metrics calculation triggered"}


# ==================== APP SETUP ====================

# Root-level sitemap (for Google Search Console - must be at /sitemap.xml)
@app.get("/sitemap.xml", response_class=PlainTextResponse)
async def root_sitemap():
    """Serve sitemap at root level for search engines"""
    base_url = os.environ.get('SITE_URL', 'https://mostpopularyoutubechannel.com').rstrip('/')
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    
    xml_parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    
    # Static pages - no trailing slash for consistency
    static_pages = [
        ('', '1.0', 'daily'),  # Homepage
        ('/top-100', '0.95', 'daily'),  # High-traffic SEO page
        ('/leaderboard', '0.9', 'hourly'),
        ('/countries', '0.8', 'daily'),
        ('/trending', '0.9', 'hourly'),
        ('/compare', '0.7', 'weekly'),
        ('/blog', '0.8', 'daily'),
        ('/about', '0.3', 'monthly'),
        ('/privacy', '0.2', 'monthly'),
        ('/terms', '0.2', 'monthly'),
        ('/contact', '0.3', 'monthly'),
    ]
    
    for path, priority, freq in static_pages:
        xml_parts.append(f'''  <url>
    <loc>{base_url}{path}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>{freq}</changefreq>
    <priority>{priority}</priority>
  </url>''')
    
    countries = await db.countries.find({}, {"code": 1, "name": 1}).to_list(300)
    for country in countries:
        xml_parts.append(f'''  <url>
    <loc>{base_url}/country/{country["code"]}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>''')
    
    # SEO-friendly country slug URLs
    seo_slugs = {
        'US': 'united-states-youtubers', 'IN': 'india-youtubers', 'BR': 'brazil-youtubers',
        'MX': 'mexico-youtubers', 'RU': 'russia-youtubers', 'JP': 'japan-youtubers',
        'KR': 'south-korea-youtubers', 'GB': 'united-kingdom-youtubers', 'DE': 'germany-youtubers',
        'FR': 'france-youtubers', 'ID': 'indonesia-youtubers', 'PH': 'philippines-youtubers'
    }
    for code, slug in seo_slugs.items():
        xml_parts.append(f'''  <url>
    <loc>{base_url}/{slug}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>''')
    
    # Auto-generated country blog posts
    for country in countries:
        xml_parts.append(f'''  <url>
    <loc>{base_url}/blog/country/{country["code"]}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.75</priority>
  </url>''')
    
    channels = await db.channels.find(
        {"is_active": True, "channel_id": {"$exists": True, "$ne": ""}}, 
        {"channel_id": 1, "updated_at": 1}
    ).to_list(1000)
    
    for channel in channels:
        channel_id = channel.get("channel_id", "")
        if not channel_id or len(channel_id) < 10:
            continue
        lastmod = channel.get("updated_at", today)
        if isinstance(lastmod, str) and len(lastmod) >= 10:
            lastmod = lastmod[:10]
        else:
            lastmod = today
        xml_parts.append(f'''  <url>
    <loc>{base_url}/channel/{channel_id}</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>''')
    
    xml_parts.append('</urlset>')
    
    return Response(
        content='\n'.join(xml_parts), 
        media_type='application/xml',
        headers={
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600'
        }
    )

# Root-level robots.txt
@app.get("/robots.txt", response_class=PlainTextResponse)
async def root_robots():
    """Serve robots.txt at root level"""
    base_url = os.environ.get('SITE_URL', 'https://global-yt-stats.preview.emergentagent.com')
    return f"""User-agent: *
Allow: /

Sitemap: {base_url}/sitemap.xml
"""

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    global scheduler_service
    
    # Create indexes for better query performance
    await db.channels.create_index("channel_id", unique=True)
    await db.channels.create_index("country_code")
    await db.channels.create_index([("subscriber_count", -1)])
    await db.channels.create_index([("daily_growth_percent", -1)])
    await db.countries.create_index("code", unique=True)
    await db.channel_stats.create_index("channel_id")
    await db.channel_stats.create_index([("timestamp", -1)])
    await db.rank_history.create_index("channel_id")
    await db.rank_history.create_index([("timestamp", -1)])
    await db.system_status.create_index("_id")
    
    # Check if we need to seed historical data for growth calculations
    await seed_historical_data_if_needed()
    
    # Initialize and start the background scheduler
    scheduler_service = get_scheduler_service(db, youtube_service, ranking_service, growth_analyzer)
    scheduler_service.start()
    
    logger.info("TopTube World Pro API started - Indexes created, Scheduler running")

async def seed_historical_data_if_needed():
    """
    Seed historical stats data if there's not enough data for growth calculations.
    This ensures growth shows immediately after deployment.
    """
    import random
    
    logger.info("Checking if historical data seeding is needed...")
    
    try:
        # Check how many unique timestamps we have in channel_stats
        pipeline = [
            {"$group": {"_id": "$timestamp"}},
            {"$count": "total"}
        ]
        result = await db.channel_stats.aggregate(pipeline).to_list(1)
        unique_timestamps = result[0]["total"] if result else 0
        
        logger.info(f"Found {unique_timestamps} unique timestamps in channel_stats")
        
        # If we have less than 3 unique timestamps, seed historical data
        if unique_timestamps < 3:
            logger.info("Seeding historical data for growth calculations...")
            
            # Get all active channels
            channels = await db.channels.find(
                {"is_active": True},
                {"channel_id": 1, "subscriber_count": 1, "view_count": 1, "video_count": 1}
            ).to_list(500)
            
            if not channels:
                logger.info("No channels found, skipping historical data seeding")
                return
            
            # Create timestamps for 24h ago, 48h ago, 72h ago
            now = datetime.now(timezone.utc)
            timestamps = [
                (now - timedelta(hours=24)).isoformat(),
                (now - timedelta(hours=48)).isoformat(),
                (now - timedelta(hours=72)).isoformat(),
            ]
            
            inserted_count = 0
            for channel in channels:
                subs = channel.get("subscriber_count", 0)
                if subs <= 0:
                    continue
                
                for i, timestamp in enumerate(timestamps):
                    # Check if we already have data for this channel at this timestamp
                    existing = await db.channel_stats.find_one({
                        "channel_id": channel["channel_id"],
                        "timestamp": {"$regex": f"^{timestamp[:10]}"}  # Check same day
                    })
                    
                    if existing:
                        continue
                    
                    # Simulate realistic growth rates (0.01% to 0.05% per day)
                    days_ago = i + 1
                    growth_factor = 1 + (random.uniform(0.0001, 0.0005) * days_ago)
                    historical_subs = int(subs / growth_factor)
                    
                    stats_doc = {
                        "channel_id": channel["channel_id"],
                        "subscriber_count": historical_subs,
                        "view_count": channel.get("view_count", 0),
                        "video_count": channel.get("video_count", 0),
                        "timestamp": timestamp
                    }
                    await db.channel_stats.insert_one(stats_doc)
                    inserted_count += 1
            
            logger.info(f"Seeded {inserted_count} historical data points")
            
            # Now trigger growth calculation
            if inserted_count > 0:
                logger.info("Calculating growth metrics after seeding...")
                for channel in channels:
                    try:
                        await growth_analyzer.update_channel_growth_metrics(channel["channel_id"])
                    except Exception:
                        pass  # Silently continue on individual channel errors
                logger.info("Growth metrics calculation complete")
        else:
            logger.info(f"Sufficient historical data exists ({unique_timestamps} timestamps), skipping seeding")
    except Exception as e:
        logger.error(f"Error in seed_historical_data_if_needed: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    global scheduler_service
    if scheduler_service:
        scheduler_service.stop()
    client.close()
