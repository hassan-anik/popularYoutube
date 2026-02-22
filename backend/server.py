"""
TopTube World Pro - Main FastAPI Server
Tracks, ranks, and predicts the most subscribed YouTube channels per country
"""
from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone

from services.youtube_service import youtube_service
from services.ranking_service import get_ranking_service
from services.growth_analyzer import get_growth_analyzer

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize services
ranking_service = get_ranking_service(db)
growth_analyzer = get_growth_analyzer(db)

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
    limit: int = Query(default=100, le=500),
    skip: int = 0
):
    """Get all tracked channels, optionally filtered by country"""
    query = {"is_active": True}
    if country_code:
        query["country_code"] = country_code.upper()
    
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
async def get_global_leaderboard(limit: int = Query(default=100, le=500)):
    """Get global top channels leaderboard"""
    channels = await ranking_service.get_global_top_100()
    return {"channels": channels[:limit], "total": len(channels)}

@api_router.get("/leaderboard/country/{country_code}")
async def get_country_leaderboard(country_code: str, limit: int = Query(default=50, le=100)):
    """Get country-specific leaderboard"""
    channels = await ranking_service.get_country_leaderboard(country_code.upper(), limit)
    
    country = await db.countries.find_one({"code": country_code.upper()}, {"_id": 0})
    
    return {
        "country": country,
        "channels": channels,
        "total": len(channels)
    }

@api_router.get("/leaderboard/fastest-growing")
async def get_fastest_growing(limit: int = Query(default=20, le=100)):
    """Get fastest growing channels by daily growth percentage"""
    channels = await ranking_service.get_fastest_growing(limit)
    return {"channels": channels}

@api_router.get("/leaderboard/biggest-gainers")
async def get_biggest_gainers(limit: int = Query(default=20, le=100)):
    """Get channels with biggest subscriber gain in 24h"""
    channels = await ranking_service.get_biggest_gainers_24h(limit)
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


# ==================== APP SETUP ====================

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
    logger.info("TopTube World Pro API started - Indexes created")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
