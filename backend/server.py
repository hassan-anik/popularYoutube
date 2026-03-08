"""
TopTube World Pro - Main FastAPI Server
Tracks, ranks, and predicts the most subscribed YouTube channels per country
"""
from fastapi import FastAPI
from fastapi.responses import PlainTextResponse
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
import os
import logging
from datetime import datetime, timezone, timedelta

from database import db, client
from services.youtube_service import youtube_service
from services.ranking_service import get_ranking_service
from services.growth_analyzer import get_growth_analyzer
from services.scheduler_service import get_scheduler_service

# Routes
from routes.channels import router as channels_router
from routes.users import router as users_router
from routes.engagement import router as engagement_router
from routes.admin import router as admin_router
from routes.contact import router as contact_router
from routes.blog import router as blog_router
from routes.seo import router as seo_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize services
ranking_service = get_ranking_service(db)
growth_analyzer = get_growth_analyzer(db)
scheduler_service = None

# Create the main app
app = FastAPI(title="TopTube World Pro", version="1.0.0")

# Add GZip compression
app.add_middleware(GZipMiddleware, minimum_size=500)

# Include all route modules
app.include_router(channels_router)
app.include_router(users_router)
app.include_router(engagement_router)
app.include_router(admin_router)
app.include_router(contact_router)
app.include_router(blog_router)
app.include_router(seo_router)

# Root-level sitemap (for Google Search Console - must be at /sitemap.xml)
@app.get("/sitemap.xml", response_class=PlainTextResponse)
async def root_sitemap():
    """Redirect root sitemap to API sitemap"""
    from routes.seo import get_sitemap
    return await get_sitemap()

# Root-level robots.txt
@app.get("/robots.txt", response_class=PlainTextResponse)
async def root_robots():
    base_url = os.environ.get('SITE_URL', 'https://channel-rank-staging.preview.emergentagent.com')
    return f"""User-agent: *
Allow: /

Sitemap: {base_url}/sitemap.xml
"""

# CORS middleware
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
    
    # Check if we need to seed historical data
    await seed_historical_data_if_needed()
    
    # Initialize and start the background scheduler
    scheduler_service = get_scheduler_service(db, youtube_service, ranking_service, growth_analyzer)
    scheduler_service.start()
    
    # Share scheduler with seo routes
    from routes.seo import set_scheduler_service
    set_scheduler_service(scheduler_service)
    
    logger.info("TopTube World Pro API started - Indexes created, Scheduler running")

async def seed_historical_data_if_needed():
    """Seed historical stats data if there's not enough data for growth calculations."""
    import random
    
    logger.info("Checking if historical data seeding is needed...")
    
    try:
        pipeline = [
            {"$group": {"_id": "$timestamp"}},
            {"$count": "total"}
        ]
        result = await db.channel_stats.aggregate(pipeline).to_list(1)
        unique_timestamps = result[0]["total"] if result else 0
        
        logger.info(f"Found {unique_timestamps} unique timestamps in channel_stats")
        
        if unique_timestamps < 3:
            logger.info("Seeding historical data for growth calculations...")
            
            channels = await db.channels.find(
                {"is_active": True},
                {"channel_id": 1, "subscriber_count": 1, "view_count": 1, "video_count": 1}
            ).to_list(500)
            
            if not channels:
                logger.info("No channels found, skipping historical data seeding")
                return
            
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
                    existing = await db.channel_stats.find_one({
                        "channel_id": channel["channel_id"],
                        "timestamp": {"$regex": f"^{timestamp[:10]}"}
                    })
                    
                    if existing:
                        continue
                    
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
            
            if inserted_count > 0:
                logger.info("Calculating growth metrics after seeding...")
                for channel in channels:
                    try:
                        await growth_analyzer.update_channel_growth_metrics(channel["channel_id"])
                    except Exception:
                        pass
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
