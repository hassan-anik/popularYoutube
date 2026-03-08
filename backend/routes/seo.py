import os
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query, Response
from fastapi.responses import PlainTextResponse
from database import db
from services.youtube_service import youtube_service
from services.ranking_service import get_ranking_service
from services.growth_analyzer import get_growth_analyzer

router = APIRouter(prefix="/api")
ranking_service = get_ranking_service(db)
growth_analyzer = get_growth_analyzer(db)

# Scheduler service - set by server.py after startup
_scheduler_service = None

def set_scheduler_service(svc):
    global _scheduler_service
    _scheduler_service = svc

def get_scheduler():
    return _scheduler_service


# ==================== SITEMAP ====================

@router.get("/sitemap.xml", response_class=PlainTextResponse)
async def get_sitemap():
    """Generate dynamic XML sitemap for SEO - Quality over quantity"""
    base_url = os.environ.get('SITE_URL', 'https://mostpopularyoutubechannel.com').rstrip('/')
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    
    # Start XML
    xml_parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    
    # Static pages - HIGH PRIORITY
    static_pages = [
        ('', '1.0', 'daily'),  # Homepage
        ('/leaderboard', '0.9', 'hourly'),
        ('/top-youtube-channels', '0.9', 'daily'),
        ('/most-subscribed-youtube-channels', '0.9', 'daily'),
        ('/youtube-subscriber-ranking', '0.9', 'daily'),
        ('/top-youtube-channels-by-country', '0.9', 'daily'),
        ('/countries', '0.8', 'daily'),
        ('/trending', '0.9', 'hourly'),
        ('/top-100', '0.8', 'daily'),
        ('/categories', '0.8', 'weekly'),
        ('/rising-stars', '0.8', 'daily'),
        ('/race', '0.7', 'daily'),
        ('/milestones', '0.7', 'daily'),
        ('/compare', '0.7', 'weekly'),
        ('/blog', '0.8', 'daily'),
        ('/methodology', '0.5', 'monthly'),
        ('/about', '0.3', 'monthly'),
        ('/contact', '0.3', 'monthly'),
        ('/privacy', '0.2', 'monthly'),
        ('/terms', '0.2', 'monthly'),
    ]
    
    for path, priority, freq in static_pages:
        xml_parts.append(f'''  <url>
    <loc>{base_url}{path}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>{freq}</changefreq>
    <priority>{priority}</priority>
  </url>''')
    
    # Country pages - Only countries WITH channel data (148 countries)
    countries = await db.countries.find({}, {"code": 1, "name": 1}).to_list(300)
    countries_with_data = []
    for country in countries:
        channel_count = await db.channels.count_documents({"country_code": country["code"]})
        if channel_count > 0:
            countries_with_data.append(country)
    
    for country in countries_with_data:
        xml_parts.append(f'''  <url>
    <loc>{base_url}/country/{country["code"]}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>''')
    
    # Blog posts from database - Only published posts with actual content
    blog_posts = await db.blog_posts.find(
        {"status": "published"},
        {"slug": 1, "updated_at": 1, "created_at": 1}
    ).to_list(500)
    
    for post in blog_posts:
        slug = post.get("slug", "")
        if not slug:
            continue
        lastmod = post.get("updated_at") or post.get("created_at") or today
        if isinstance(lastmod, str) and len(lastmod) >= 10:
            lastmod = lastmod[:10]
        else:
            lastmod = today
        xml_parts.append(f'''  <url>
    <loc>{base_url}/blog/{slug}</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>''')
    
    # Channel pages - Only TOP 50 channels by subscriber count (quality over quantity)
    top_channels = await db.channels.find(
        {"is_active": True, "channel_id": {"$exists": True, "$ne": ""}}, 
        {"channel_id": 1, "updated_at": 1}
    ).sort("subscriber_count", -1).limit(50).to_list(50)
    
    for channel in top_channels:
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


# ==================== SCHEDULER STATUS ====================

@router.get("/scheduler/status")
async def get_scheduler_status():
    """Get background scheduler status"""
    svc = get_scheduler()
    if svc is None:
        return {"status": "not_initialized"}
    return await svc.get_scheduler_status()

@router.post("/scheduler/trigger-refresh")
async def trigger_manual_refresh(background_tasks: BackgroundTasks):
    """Manually trigger a channel refresh (admin)"""
    svc = get_scheduler()
    if svc is None:
        raise HTTPException(status_code=500, detail="Scheduler not initialized")
    background_tasks.add_task(svc.refresh_all_channels)
    return {"message": "Channel refresh triggered"}

@router.post("/scheduler/trigger-ranking")
async def trigger_manual_ranking(background_tasks: BackgroundTasks):
    """Manually trigger ranking update (admin)"""
    svc = get_scheduler()
    if svc is None:
        raise HTTPException(status_code=500, detail="Scheduler not initialized")
    background_tasks.add_task(svc.update_all_rankings)
    return {"message": "Ranking update triggered"}

@router.post("/scheduler/trigger-stats-snapshot")
async def trigger_stats_snapshot(background_tasks: BackgroundTasks):
    """Manually trigger a stats snapshot for growth tracking"""
    svc = get_scheduler()
    if svc is None:
        raise HTTPException(status_code=500, detail="Scheduler not initialized")
    background_tasks.add_task(svc.record_stats_snapshot)
    return {"message": "Stats snapshot recording triggered"}

@router.post("/scheduler/trigger-growth-calc")
async def trigger_growth_calculation(background_tasks: BackgroundTasks):
    """Manually trigger growth metrics calculation"""
    svc = get_scheduler()
    if svc is None:
        raise HTTPException(status_code=500, detail="Scheduler not initialized")
    background_tasks.add_task(svc.calculate_growth_metrics)
    return {"message": "Growth metrics calculation triggered"}


@router.post("/scheduler/trigger-daily-blog")
async def trigger_daily_blog(background_tasks: BackgroundTasks):
    """Manually trigger daily blog post generation"""
    svc = get_scheduler()
    if svc is None:
        raise HTTPException(status_code=500, detail="Scheduler not initialized")
    background_tasks.add_task(svc.generate_daily_blog_post)
    return {"message": "Daily blog post generation triggered"}


@router.post("/scheduler/trigger-discovery")
async def trigger_channel_discovery(background_tasks: BackgroundTasks):
    """Manually trigger channel discovery for empty countries"""
    svc = get_scheduler()
    if svc is None:
        raise HTTPException(status_code=500, detail="Scheduler not initialized")
    background_tasks.add_task(svc.discover_new_channels)
    return {"message": "Channel discovery triggered"}


@router.post("/scheduler/trigger-expansion")
async def trigger_channel_expansion(background_tasks: BackgroundTasks):
    """Manually trigger channel expansion for low-coverage countries"""
    svc = get_scheduler()
    if svc is None:
        raise HTTPException(status_code=500, detail="Scheduler not initialized")
    background_tasks.add_task(svc.expand_country_channels)
    return {"message": "Channel expansion triggered"}


@router.get("/scheduler/quota-estimate")
async def get_quota_estimate():
    """Get estimated daily YouTube API quota usage"""
    # Count channels
    channel_count = await db.channels.count_documents({"is_active": True})
    
    # Count countries
    countries = await db.countries.find({}, {"code": 1}).to_list(300)
    empty_countries = 0
    low_coverage = 0
    
    for country in countries:
        count = await db.channels.count_documents({"country_code": country["code"]})
        if count == 0:
            empty_countries += 1
        elif count <= 5:
            low_coverage += 1
    
    # Calculate quota usage
    # channels.list = 1 unit per request (batches of 50)
    # search.list = 100 units per request
    
    refresh_per_day = 12  # Every 2 hours
    batches_per_refresh = (channel_count // 50) + 1
    refresh_quota = refresh_per_day * batches_per_refresh * 1  # 1 unit per batch
    
    discovery_per_day = 3  # Every 8 hours
    discovery_searches = min(10, empty_countries)  # 10 countries per run max
    discovery_quota = discovery_per_day * discovery_searches * 100  # 100 units per search
    
    expansion_per_day = 3  # Every 8 hours  
    expansion_searches = min(15, low_coverage)  # 15 countries per run max
    expansion_quota = expansion_per_day * expansion_searches * 100  # 100 units per search
    
    # Channel stats fetches during discovery/expansion (each discovered channel needs stats)
    avg_channels_per_search = 3  # Not all searches find new channels
    new_channel_fetches = (discovery_searches + expansion_searches) * avg_channels_per_search * (discovery_per_day + expansion_per_day) // 2
    fetch_quota = new_channel_fetches * 1  # 1 unit per channel
    
    total_daily = refresh_quota + discovery_quota + expansion_quota + fetch_quota
    
    return {
        "daily_quota_limit": 10000,
        "estimated_daily_usage": total_daily,
        "quota_remaining": 10000 - total_daily,
        "breakdown": {
            "channel_refresh": {
                "runs_per_day": refresh_per_day,
                "channels": channel_count,
                "quota_per_day": refresh_quota
            },
            "channel_discovery": {
                "runs_per_day": discovery_per_day,
                "empty_countries": empty_countries,
                "quota_per_day": discovery_quota
            },
            "channel_expansion": {
                "runs_per_day": expansion_per_day,
                "low_coverage_countries": low_coverage,
                "quota_per_day": expansion_quota
            },
            "new_channel_fetches": {
                "estimated_fetches": new_channel_fetches,
                "quota_per_day": fetch_quota
            }
        }
    }


@router.get("/blog/posts/auto-generated")
async def get_auto_generated_posts(limit: int = Query(10, ge=1, le=50)):
    """Get auto-generated blog posts"""
    posts = await db.blog_posts.find(
        {"is_auto_generated": True, "status": "published"},
        {"_id": 0}
    ).sort("published_at", -1).limit(limit).to_list(limit)
    
    return {
        "posts": posts,
        "total": len(posts)
    }


