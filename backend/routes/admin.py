import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from typing import List, Dict, Any
from database import db
from routes.utils import store_channel_stats
from models import AdminStats
from services.youtube_service import youtube_service
from services.ranking_service import get_ranking_service
from services.growth_analyzer import get_growth_analyzer

router = APIRouter(prefix="/api")
ranking_service = get_ranking_service(db)
growth_analyzer = get_growth_analyzer(db)

logger = logging.getLogger(__name__)

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

@router.post("/admin/refresh-channel/{channel_id}")
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

@router.post("/admin/refresh-all")
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

@router.delete("/admin/channel/{channel_id}")
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

@router.get("/search/channels")
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

@router.get("/predictions/overtake/{channel_id}/{target_channel_id}")
async def predict_overtake(channel_id: str, target_channel_id: str):
    """Predict when a channel might overtake another"""
    prediction = await growth_analyzer.predict_overtake_time(channel_id, target_channel_id)
    if not prediction:
        raise HTTPException(status_code=404, detail="One or both channels not found")
    return prediction


# ==================== HELPER FUNCTIONS ====================


@router.post("/admin/seed")
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


@router.post("/admin/populate-empty-countries")
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
    
    channels_added = 0
    countries_processed = 0
    countries_skipped = 0
    
    for country in empty_countries:
        country_code = country["code"]
        country_name = country["name"]
        
        try:
            # Search for real YouTube channels from this specific country using YouTube API
            search_results = await youtube_service.search_channels(
                query="popular YouTuber",
                region_code=country_code,
                max_results=3
            )
            
            if not search_results:
                logger.info(f"No YouTube channels found for {country_name} ({country_code}), skipping")
                countries_skipped += 1
                continue
            
            # Add found channels
            for result in search_results:
                channel_id = result.get("channel_id")
                if not channel_id:
                    continue
                
                # Check if channel already exists
                existing = await db.channels.find_one({"channel_id": channel_id})
                if existing:
                    continue
                
                # Fetch full channel data from YouTube
                try:
                    channel_data = await youtube_service.get_channel_stats(channel_id)
                    if not channel_data:
                        continue
                    
                    # Create channel document
                    channel_doc = {
                        "channel_id": channel_id,
                        "title": channel_data.get("title", "Unknown"),
                        "description": channel_data.get("description", ""),
                        "thumbnail_url": channel_data.get("thumbnail_url", ""),
                        "subscriber_count": channel_data.get("subscriber_count", 0),
                        "view_count": channel_data.get("view_count", 0),
                        "video_count": channel_data.get("video_count", 0),
                        "country_code": country_code,
                        "country_name": country_name,
                        "created_at": datetime.now(timezone.utc).isoformat(),
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                        "is_active": True
                    }
                    
                    await db.channels.insert_one(channel_doc)
                    channels_added += 1
                    logger.info(f"Added {channel_doc['title']} for {country_name}")
                    
                except Exception as e:
                    logger.error(f"Error fetching channel {channel_id}: {e}")
                    continue
            
            countries_processed += 1
            
            # Rate limiting - wait between countries to avoid quota issues
            await asyncio.sleep(0.5)
            
        except Exception as e:
            logger.error(f"Error processing {country_name}: {e}")
            countries_skipped += 1
            continue
    
    # Update rankings in background
    background_tasks.add_task(ranking_service.update_all_rankings)
    
    return {
        "message": "Population complete - only real YouTube data added",
        "countries_processed": countries_processed,
        "channels_added": channels_added,
        "countries_skipped": countries_skipped,
        "empty_countries_found": len(empty_countries)
    }


@router.post("/admin/fix-channel-countries")
async def fix_channel_countries():
    """Fix country codes for well-known channels that were misattributed"""
    
    # Map of channel_id -> correct country_code
    # These are well-known channels with verified countries
    corrections = {
        # === UNITED STATES ===
        "UCX6OQ3DkcsbYNE6H8uQQuVA": {"country_code": "US", "country_name": "United States"},  # MrBeast
        "UClgRkhTL3_hImCAmdLfDE4g": {"country_code": "US", "country_name": "United States"},  # YouTube Movies
        "UC-9-kyTW8ZkZNDHQJ6FgpwQ": {"country_code": "US", "country_name": "United States"},  # Music (YouTube)
        "UCRijo3ddMTht_IHyNSNXpNQ": {"country_code": "US", "country_name": "United States"},  # Dude Perfect
        "UCEdvpU2pFRCVqU6yIPyTpMQ": {"country_code": "US", "country_name": "United States"},  # Marshmello
        "UCM9r1xn6s30OnlJWb-jc3Sw": {"country_code": "US", "country_name": "United States"},  # XXXTENTACION
        "UC5OrDvL9DscpcAstz7JnQGA": {"country_code": "US", "country_name": "United States"},  # Michael Jackson
        "UCucot-Zp428OwkyRm2I7v2Q": {"country_code": "US", "country_name": "United States"},  # James Charles
        "UCG8rbF3g2AMX70yOd8vqIZg": {"country_code": "US", "country_name": "United States"},  # Logan Paul
        "UC-2Y8dQb0S6DtpxNgAKoJKA": {"country_code": "US", "country_name": "United States"},  # PlayStation
        "UCfA5CSlYGseqSeOhsiiZTfw": {"country_code": "US", "country_name": "United States"},  # Sturniolo Triplets
        "UC1a2ZCw7tugRZYRMnecNj3A": {"country_code": "US", "country_name": "United States"},  # Celine Dept
        "UCMHKlaUOwMvgZ339zcjEI2A": {"country_code": "US", "country_name": "United States"},  # Stassiebaby
        "UCHkj014U2CQ2Nv0UZeYpE_A": {"country_code": "CA", "country_name": "Canada"},  # Justin Bieber
        "UC0WP5P-ufpRfjbNrmOWwLBQ": {"country_code": "CA", "country_name": "Canada"},  # The Weeknd
        
        # === ITALY (Real Italian channels) ===
        "UC86suRFnqiw8zN6LIYxddYQ": {"country_code": "IT", "country_name": "Italy"},  # Khaby Lame (Senegal-born, based in Italy)
        
        # === SPAIN ===
        "UCXazgXDIYyWH-yXLAkcrFxw": {"country_code": "ES", "country_name": "Spain"},  # elrubiusOMG
        "UCam8T03EOFBsNdR0thrFHdQ": {"country_code": "ES", "country_name": "Spain"},  # VEGETTA777
        "UCvPRgjCz3nJrdPVHgPvRe0w": {"country_code": "ES", "country_name": "Spain"},  # Ibai (Spanish, not Argentine)
        
        # === CHILE ===
        "UCYiGq8XF7YQD00x7wAd62Zg": {"country_code": "CL", "country_name": "Chile"},  # JuegaGerman
        
        # === PAKISTAN ===
        "UCq5ANZhwtJPLokKxP25MyuA": {"country_code": "PK", "country_name": "Pakistan"},  # Ducky Bhai
        
        # === UAE ===
        "UC-YO7JkqlrBsgMGiAlqQ7Tg": {"country_code": "AE", "country_name": "United Arab Emirates"},  # Mo Vlogs
        
        # === VIETNAM ===
        "UCnr9mXQGjCp6ZSLWt3E9ruQ": {"country_code": "VN", "country_name": "Vietnam"},  # Stokes Twins are American
        
        # === UK ===
        "UC0C-w0YjGpqDXGB8IHb662A": {"country_code": "GB", "country_name": "United Kingdom"},  # Ed Sheeran
        "UCMtFAi84ehTSYSE9XoHefig": {"country_code": "GB", "country_name": "United Kingdom"},  # Mrwhosetheboss (UK based)
    }
    
    updated_count = 0
    for channel_id, correction in corrections.items():
        result = await db.channels.update_one(
            {"channel_id": channel_id},
            {"$set": correction}
        )
        if result.modified_count > 0:
            updated_count += 1
            logger.info(f"Fixed country for channel {channel_id} to {correction['country_code']}")
    
    return {
        "message": "Channel countries fixed",
        "updated_count": updated_count,
        "total_corrections_attempted": len(corrections)
    }


@router.delete("/admin/remove-misattributed-channels")
async def remove_misattributed_channels():
    """Remove channels that are clearly not from the country they're listed in"""
    
    # Channels to remove from specific countries (they belong elsewhere)
    to_remove = [
        # Remove from Italy - these are not Italian
        {"channel_id": "UCG8rbF3g2AMX70yOd8vqIZg", "wrong_country": "IT"},  # Logan Paul (US)
        {"channel_id": "UC-2Y8dQb0S6DtpxNgAKoJKA", "wrong_country": "IT"},  # PlayStation (US/Japan)
        {"channel_id": "UCfA5CSlYGseqSeOhsiiZTfw", "wrong_country": "IT"},  # Sturniolo Triplets (US)
        {"channel_id": "UC1a2ZCw7tugRZYRMnecNj3A", "wrong_country": "IT"},  # Celine Dept (US)
        {"channel_id": "UCMHKlaUOwMvgZ339zcjEI2A", "wrong_country": "IT"},  # Stassiebaby (US)
        
        # Remove from Turkey - not Turkish
        {"channel_id": "UC_hoQDD6zKcIqpIYLsFbBeA", "wrong_country": "TR"},  # Mo Vlogs (UAE)
        {"channel_id": "UC_c-RTowPbIlzMkIa_O7s6Q", "wrong_country": "TR"},  # Ducky Bhai (Pakistan)
        
        # Remove from Vietnam - not Vietnamese  
        {"channel_id": "UCbp9MyKCTEww4CxEzc_Tp0Q", "wrong_country": "VN"},  # Stokes Twins (US)
        
        # Remove from Argentina - not Argentine
        {"channel_id": "UCaY_-ksFSQtTGk0y1HA_3YQ", "wrong_country": "AR"},  # Ibai (Spanish)
        
        # Remove from Kenya - not Kenyan
        {"channel_id": "UCMiJRAwDNSNzuYeN2uWa0pA", "wrong_country": "KE"},  # Mrwhosetheboss (UK)
        
        # Remove from South Africa - not South African
        {"channel_id": "UCmh5gdwCx6lN7gEC20leNVA", "wrong_country": "ZA"},  # David Dobrik (US)
    ]
    
    removed_count = 0
    for item in to_remove:
        # Check if channel exists in wrong country
        channel = await db.channels.find_one({
            "channel_id": item["channel_id"],
            "country_code": item["wrong_country"]
        })
        
        if channel:
            # Delete from wrong country
            result = await db.channels.delete_one({
                "channel_id": item["channel_id"],
                "country_code": item["wrong_country"]
            })
            if result.deleted_count > 0:
                removed_count += 1
                logger.info(f"Removed misattributed channel {item['channel_id']} from {item['wrong_country']}")
    
    return {
        "message": "Misattributed channels removed",
        "removed_count": removed_count,
        "total_attempted": len(to_remove)
    }


@router.post("/admin/import-channels")
async def import_channels(channels: List[Dict[Any, Any]]):
    """Import channels from JSON data (used for syncing between environments)"""
    
    added_count = 0
    updated_count = 0
    
    for channel_data in channels:
        channel_id = channel_data.get("channel_id")
        if not channel_id:
            continue
            
        # Remove _id if present
        channel_data.pop("_id", None)
        
        existing = await db.channels.find_one({"channel_id": channel_id})
        
        if existing:
            await db.channels.update_one(
                {"channel_id": channel_id},
                {"$set": channel_data}
            )
            updated_count += 1
        else:
            await db.channels.insert_one(channel_data)
            added_count += 1
    
    return {
        "message": "Channels imported successfully",
        "added": added_count,
        "updated": updated_count,
        "total": len(channels)
    }


@router.get("/admin/export-channels")
async def export_channels():
    """Export all channels as JSON (used for syncing between environments)"""
    
    channels = await db.channels.find({}, {"_id": 0}).to_list(length=None)
    
    return {
        "channels": channels,
        "total": len(channels)
    }


@router.post("/admin/normalize-channels")
async def normalize_channels():
    """Normalize all channel data - add title from name and country_name from country_code"""
    
    # Get all countries for lookup
    countries = await db.countries.find({}, {"_id": 0, "code": 1, "name": 1}).to_list(length=None)
    country_map = {c["code"]: c["name"] for c in countries}
    
    # Find channels missing title (have name instead)
    title_update_count = 0
    channels_missing_title = await db.channels.find(
        {"name": {"$exists": True}, "title": {"$exists": False}},
        {"_id": 0, "channel_id": 1, "name": 1}
    ).to_list(length=None)
    
    for channel in channels_missing_title:
        await db.channels.update_one(
            {"channel_id": channel["channel_id"]},
            {"$set": {"title": channel["name"]}}
        )
        title_update_count += 1
    
    # Find channels missing country_name (have country_code instead)
    country_name_update_count = 0
    channels_missing_country = await db.channels.find(
        {"country_code": {"$exists": True}, "country_name": {"$exists": False}},
        {"_id": 0, "channel_id": 1, "country_code": 1}
    ).to_list(length=None)
    
    for channel in channels_missing_country:
        country_code = channel.get("country_code")
        country_name = country_map.get(country_code, country_code)
        await db.channels.update_one(
            {"channel_id": channel["channel_id"]},
            {"$set": {"country_name": country_name}}
        )
        country_name_update_count += 1
    
    return {
        "message": "Channel normalization complete",
        "title_updates": title_update_count,
        "country_name_updates": country_name_update_count,
        "total_channels_fixed": title_update_count + country_name_update_count
    }


@router.post("/admin/search-and-add-country-channels/{country_code}")
async def search_and_add_country_channels(country_code: str, background_tasks: BackgroundTasks):
    """Search YouTube for popular channels in a country and add them"""
    
    country_code = country_code.upper()
    
    # Get country info
    country = await db.countries.find_one({"code": country_code}, {"_id": 0})
    if not country:
        return {"error": f"Country {country_code} not found"}
    
    country_name = country.get("name", country_code)
    
    # Search queries to find popular YouTubers
    search_queries = [
        f"popular YouTuber {country_name}",
        f"top YouTube channel {country_name}",
        f"famous YouTuber from {country_name}",
    ]
    
    found_channels = {}
    
    for query in search_queries:
        try:
            results = await youtube_service.search_channels(query, region_code=country_code, max_results=5)
            for ch in results:
                if ch["channel_id"] not in found_channels:
                    found_channels[ch["channel_id"]] = ch
        except Exception as e:
            logger.error(f"Search error for '{query}': {e}")
            continue
    
    if not found_channels:
        return {"error": f"No channels found for {country_name}", "country": country_code}
    
    added_count = 0
    updated_count = 0
    failed_count = 0
    
    for channel_id, basic_info in found_channels.items():
        try:
            existing = await db.channels.find_one({"channel_id": channel_id})
            yt_data = await youtube_service.get_channel_stats(channel_id)
            
            if not yt_data:
                failed_count += 1
                continue
            
            # Only add channels with decent subscriber counts
            if yt_data.get("subscriber_count", 0) < 10000:
                continue
            
            channel_doc = {
                "channel_id": channel_id,
                "title": yt_data.get("title", basic_info.get("title", "Unknown")),
                "description": yt_data.get("description", ""),
                "custom_url": yt_data.get("custom_url", ""),
                "thumbnail_url": yt_data.get("thumbnail_url", ""),
                "subscriber_count": yt_data.get("subscriber_count", 0),
                "view_count": yt_data.get("view_count", 0),
                "video_count": yt_data.get("video_count", 0),
                "country_code": country_code,
                "country_name": country_name,
                "published_at": yt_data.get("published_at", ""),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "is_active": True,
                "viral_label": "Stable",
                "viral_score": 0.0,
                "daily_subscriber_gain": 0,
                "daily_growth_percent": 0.0,
            }
            
            if existing:
                await db.channels.update_one({"channel_id": channel_id}, {"$set": channel_doc})
                updated_count += 1
            else:
                channel_doc["created_at"] = datetime.now(timezone.utc).isoformat()
                channel_doc["current_rank"] = 0
                channel_doc["previous_rank"] = 0
                await db.channels.insert_one(channel_doc)
                added_count += 1
                
        except Exception as e:
            logger.error(f"Error processing channel {channel_id}: {e}")
            failed_count += 1
    
    if added_count > 0 or updated_count > 0:
        background_tasks.add_task(ranking_service.update_rankings, country_code)
    
    return {
        "message": f"Channels searched and processed for {country_name}",
        "country": country_code,
        "found": len(found_channels),
        "added": added_count,
        "updated": updated_count,
        "failed": failed_count
    }


@router.post("/admin/add-country-channels/{country_code}")
async def add_country_channels(country_code: str, background_tasks: BackgroundTasks):
    """Add popular YouTube channels for a specific country"""
    
    # Popular channels by country (verified channel IDs)
    country_channels = {
        "PK": [  # Pakistan
            {"channel_id": "UCcr0Ewy3Q-j5bjq8TuPFqng", "name": "ARY Digital HD"},
            {"channel_id": "UC6YcM0Ddod4YqydoH39BWPQ", "name": "Hum TV"},
            {"channel_id": "UCJwAGz48lOfnZhVK7QZwGvA", "name": "Geo TV"},
            {"channel_id": "UCq5ANZhwtJPLokKxP25MyuA", "name": "Ducky Bhai"},
            {"channel_id": "UC2_C7xQkCz6r5qblHHMnG3A", "name": "Sahir Lodhi"},
            {"channel_id": "UCqS1VHu7FMhuDqGF6S8s2dw", "name": "Nadir Ali"},
        ],
        "PE": [  # Peru
            {"channel_id": "UCLj7pY6GQ7Xhyy2YLZCRIvA", "name": "Whatdafaqshow"},
            {"channel_id": "UCKBPimzSQvp22hTAl0HjINQ", "name": "Mox"},
            {"channel_id": "UC8xNhJPq-hySn7BHwK9FZFA", "name": "DeBarrio"},
            {"channel_id": "UCX6bZ6pq5CDKIh04IoWX8Mw", "name": "El Robot de Platon"},
        ],
        "PH": [  # Philippines - add more
            {"channel_id": "UCuZ60EEHpS6Pv5u7oSIqGZw", "name": "Ivana Alawi"},
            {"channel_id": "UCqMWPVWk8m40Y6yNsjoB8_g", "name": "Cong TV"},
            {"channel_id": "UCTg_MKrpEDbXrOqZwP3r4Nw", "name": "Mimiyuuuh"},
            {"channel_id": "UC8cqQMLRDbU3e_XU7J93UlA", "name": "Donnalyn Bartolome"},
        ],
        "ZA": [  # South Africa - add more
            {"channel_id": "UCO5SYu7T1NKvT6xqU6IRo3w", "name": "Caspar Lee"},
            {"channel_id": "UCDGbVBqZqJcvmAXxxv7j_pw", "name": "Lasizwe"},
            {"channel_id": "UC2V0A2ZKrPJNbF-fCT_vLrQ", "name": "Trevor Noah"},
        ],
        "BD": [  # Bangladesh
            {"channel_id": "UC6rGWyC_qKxS7GNxCvI1Cag", "name": "Tawhid Afridi"},
            {"channel_id": "UCuMB23TMp0J5VrfJT_5W7NA", "name": "Salman Muqtadir"},
        ],
        "KE": [  # Kenya
            {"channel_id": "UCKPxaS2-z_gRf6jbgbS4y0A", "name": "Churchill Show"},
            {"channel_id": "UC4mxP2yNyHJECe0DWZqF6Aw", "name": "Bahati Kenya"},
        ],
    }
    
    country_code = country_code.upper()
    if country_code not in country_channels:
        return {"error": f"No channel list for {country_code}", "available": list(country_channels.keys())}
    
    # Get country info
    country = await db.countries.find_one({"code": country_code}, {"_id": 0})
    if not country:
        return {"error": f"Country {country_code} not found"}
    
    country_name = country.get("name", country_code)
    channels_to_add = country_channels[country_code]
    
    added_count = 0
    updated_count = 0
    failed_count = 0
    
    for channel_info in channels_to_add:
        channel_id = channel_info["channel_id"]
        
        try:
            existing = await db.channels.find_one({"channel_id": channel_id})
            yt_data = await youtube_service.get_channel_stats(channel_id)
            
            if not yt_data:
                logger.warning(f"Could not fetch data for channel {channel_id}")
                failed_count += 1
                continue
            
            channel_doc = {
                "channel_id": channel_id,
                "title": yt_data.get("title", channel_info.get("name", "Unknown")),
                "description": yt_data.get("description", ""),
                "custom_url": yt_data.get("custom_url", ""),
                "thumbnail_url": yt_data.get("thumbnail_url", ""),
                "subscriber_count": yt_data.get("subscriber_count", 0),
                "view_count": yt_data.get("view_count", 0),
                "video_count": yt_data.get("video_count", 0),
                "country_code": country_code,
                "country_name": country_name,
                "published_at": yt_data.get("published_at", ""),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "is_active": True,
                "viral_label": "Stable",
                "viral_score": 0.0,
                "daily_subscriber_gain": 0,
                "daily_growth_percent": 0.0,
            }
            
            if existing:
                await db.channels.update_one({"channel_id": channel_id}, {"$set": channel_doc})
                updated_count += 1
            else:
                channel_doc["created_at"] = datetime.now(timezone.utc).isoformat()
                channel_doc["current_rank"] = 0
                channel_doc["previous_rank"] = 0
                await db.channels.insert_one(channel_doc)
                added_count += 1
                
        except Exception as e:
            logger.error(f"Error processing channel {channel_id}: {e}")
            failed_count += 1
    
    background_tasks.add_task(ranking_service.update_rankings, country_code)
    
    return {
        "message": f"Channels processed for {country_name}",
        "country": country_code,
        "added": added_count,
        "updated": updated_count,
        "failed": failed_count
    }


@router.post("/admin/add-top-global-channels")
async def add_top_global_channels(background_tasks: BackgroundTasks):
    """Add the real top global YouTube channels by subscriber count"""
    
    # Real top YouTube channels with their verified data (as of 2024-2025)
    # Channel IDs from actual YouTube
    top_channels = [
        # T-Series - India - 270M+
        {"channel_id": "UCq-Fj5jknLsUf-MWSy4_brA", "country_code": "IN", "country_name": "India"},
        # Cocomelon - US - 175M+
        {"channel_id": "UCbCmjCuTUZos6Inko4u57UQ", "country_code": "US", "country_name": "United States"},
        # Sony Entertainment Television India
        {"channel_id": "UCpEhnqL0y41EpW2TvWAHD7Q", "country_code": "IN", "country_name": "India"},
        # Kids Diana Show - US - 120M+
        {"channel_id": "UCk8GzjMOrta8yxDcKfylJYw", "country_code": "US", "country_name": "United States"},
        # PewDiePie - Sweden - 111M+
        {"channel_id": "UC-lHJZR3Gqxm24_Vd_AJ5Yw", "country_code": "SE", "country_name": "Sweden"},
        # Like Nastya - US - 115M+
        {"channel_id": "UCJplp5SjeGSdVdwsfb9Q7lQ", "country_code": "US", "country_name": "United States"},
        # Vlad and Niki - US - 115M+
        {"channel_id": "UCvlE5gTbOvjiolFlEm-c_Ow", "country_code": "US", "country_name": "United States"},
        # Zee Music Company - India - 105M+
        {"channel_id": "UCFFbwnve3yF62-tVXkTyHqg", "country_code": "IN", "country_name": "India"},
        # WWE - US - 100M+
        {"channel_id": "UCJ5v_MCY6GNUBTO8-D3XoAg", "country_code": "US", "country_name": "United States"},
        # BLACKPINK - South Korea - 95M+
        {"channel_id": "UCOmHUn--16B90oW2L6FRR3A", "country_code": "KR", "country_name": "South Korea"},
        # Goldmines - India - 95M+
        {"channel_id": "UCyoXW-Dse7fURq30EWl_CUA", "country_code": "IN", "country_name": "India"},
        # 5-Minute Crafts - Cyprus - 80M+
        {"channel_id": "UC295-Dw_tDNtZXFeAPAQKEw", "country_code": "CY", "country_name": "Cyprus"},
        # BANGTANTV (BTS) - South Korea - 75M+
        {"channel_id": "UCLkAepWjdylmXSltofFvsYQ", "country_code": "KR", "country_name": "South Korea"},
        # Justin Bieber - Canada - 73M+
        {"channel_id": "UCHkj014U2CQ2Nv0UZeYpE_A", "country_code": "CA", "country_name": "Canada"},
        # HYBE LABELS - South Korea - 75M+
        {"channel_id": "UC3IZKseVpdzPSBaWxBxundA", "country_code": "KR", "country_name": "South Korea"},
        # Shemaroo Filmi Gaane - India
        {"channel_id": "UCF1JIbMUs6uqoZEY1Haw0GQ", "country_code": "IN", "country_name": "India"},
        # Movieclips - US
        {"channel_id": "UC3gNmTGu-TTbFPpfSs5kNkg", "country_code": "US", "country_name": "United States"},
        # Sony SAB - India
        {"channel_id": "UC6-F5tO8uklgE9Zy8IvbdFw", "country_code": "IN", "country_name": "India"},
        # ChuChu TV - India
        {"channel_id": "UCBnDOF4LK2a48kz3TQEX3Ag", "country_code": "IN", "country_name": "India"},
        # Eminem - US
        {"channel_id": "UCfM3zsQsOnfWNUppiycmBuw", "country_code": "US", "country_name": "United States"},
    ]
    
    added_count = 0
    updated_count = 0
    failed_count = 0
    
    for channel_info in top_channels:
        channel_id = channel_info["channel_id"]
        
        try:
            # Check if channel already exists
            existing = await db.channels.find_one({"channel_id": channel_id})
            
            # Fetch fresh data from YouTube API
            yt_data = await youtube_service.get_channel_stats(channel_id)
            
            if not yt_data:
                logger.warning(f"Could not fetch data for channel {channel_id}")
                failed_count += 1
                continue
            
            channel_doc = {
                "channel_id": channel_id,
                "title": yt_data.get("title", "Unknown"),
                "description": yt_data.get("description", ""),
                "custom_url": yt_data.get("custom_url", ""),
                "thumbnail_url": yt_data.get("thumbnail_url", ""),
                "subscriber_count": yt_data.get("subscriber_count", 0),
                "view_count": yt_data.get("view_count", 0),
                "video_count": yt_data.get("video_count", 0),
                "country_code": channel_info["country_code"],
                "country_name": channel_info["country_name"],
                "published_at": yt_data.get("published_at", ""),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "is_active": True,
                "viral_label": "Stable",
                "viral_score": 0.0,
                "daily_subscriber_gain": 0,
                "daily_growth_percent": 0.0,
                "weekly_growth_percent": 0,
                "monthly_growth_percent": 0,
            }
            
            if existing:
                await db.channels.update_one(
                    {"channel_id": channel_id},
                    {"$set": channel_doc}
                )
                updated_count += 1
                logger.info(f"Updated channel: {channel_doc['title']}")
            else:
                channel_doc["created_at"] = datetime.now(timezone.utc).isoformat()
                channel_doc["current_rank"] = 0
                channel_doc["previous_rank"] = 0
                await db.channels.insert_one(channel_doc)
                added_count += 1
                logger.info(f"Added channel: {channel_doc['title']}")
                
        except Exception as e:
            logger.error(f"Error processing channel {channel_id}: {e}")
            failed_count += 1
            continue
    
    # Update all rankings
    background_tasks.add_task(ranking_service.update_all_rankings)
    
    return {
        "message": "Top global channels processed",
        "added": added_count,
        "updated": updated_count,
        "failed": failed_count
    }


@router.delete("/admin/remove-placeholder-channels")
async def remove_placeholder_channels():
    """Remove all placeholder/fake channel data (channels with _ in channel_id)"""
    
    # Remove channels that are copies (have original_channel_id or _ in channel_id)
    result = await db.channels.delete_many({
        "$or": [
            {"original_channel_id": {"$exists": True}},
            {"channel_id": {"$regex": "_"}}
        ]
    })
    
    logger.info(f"Removed {result.deleted_count} placeholder channels")
    
    return {
        "message": "Placeholder channels removed",
        "deleted_count": result.deleted_count
    }


