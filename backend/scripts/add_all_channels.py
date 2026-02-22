"""
Script to add top YouTube channel for every country
"""
import asyncio
import aiohttp
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path('/app/backend/.env'))

YOUTUBE_API_KEY = os.environ.get('YOUTUBE_API_KEY')
YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"

async def search_top_channel(session, country_name, region_code=None):
    """Search for top YouTube channel in a country"""
    # Try different search queries
    queries = [
        f"{country_name} youtube",
        f"{country_name} music",
        f"{country_name} tv",
        f"{country_name}",
    ]
    
    for query in queries:
        try:
            url = f"{YOUTUBE_API_BASE}/search"
            params = {
                "key": YOUTUBE_API_KEY,
                "part": "snippet",
                "q": query,
                "type": "channel",
                "maxResults": 1,
                "order": "relevance"
            }
            if region_code and len(region_code) == 2:
                params["regionCode"] = region_code
            
            async with session.get(url, params=params) as response:
                if response.status != 200:
                    continue
                data = await response.json()
            
            if data.get("items"):
                item = data["items"][0]
                return {
                    "channel_id": item["id"]["channelId"],
                    "title": item["snippet"]["title"],
                    "thumbnail_url": item["snippet"]["thumbnails"]["default"]["url"]
                }
        except Exception as e:
            continue
    
    return None

async def get_channel_stats(session, channel_id):
    """Fetch full channel data from YouTube API"""
    url = f"{YOUTUBE_API_BASE}/channels"
    params = {
        "key": YOUTUBE_API_KEY,
        "part": "statistics,snippet",
        "id": channel_id
    }
    
    try:
        async with session.get(url, params=params) as response:
            if response.status != 200:
                return None
            data = await response.json()
        
        if not data.get("items"):
            return None
        
        item = data["items"][0]
        stats = item.get("statistics", {})
        snippet = item.get("snippet", {})
        
        return {
            "channel_id": channel_id,
            "title": snippet.get("title", ""),
            "description": snippet.get("description", "")[:500],
            "custom_url": snippet.get("customUrl", ""),
            "published_at": snippet.get("publishedAt", ""),
            "thumbnail_url": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
            "subscriber_count": int(stats.get("subscriberCount", 0)),
            "view_count": int(stats.get("viewCount", 0)),
            "video_count": int(stats.get("videoCount", 0)),
        }
    except:
        return None

async def add_channels_for_all_countries():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['test_database']
    
    # Get all countries without channels
    countries_with_channels = await db.channels.distinct("country_code")
    all_countries = await db.countries.find({}, {"_id": 0}).to_list(300)
    
    countries_needing_channels = [
        c for c in all_countries 
        if c["code"] not in countries_with_channels
    ]
    
    print(f"Countries needing channels: {len(countries_needing_channels)}")
    
    added = 0
    skipped = 0
    
    async with aiohttp.ClientSession() as session:
        for country in countries_needing_channels:
            country_code = country["code"]
            country_name = country["name"]
            
            print(f"Searching for {country_name} ({country_code})...", end=" ")
            
            # Search for top channel
            search_result = await search_top_channel(session, country_name, country_code)
            
            if not search_result:
                print("No channel found")
                skipped += 1
                await asyncio.sleep(0.2)
                continue
            
            # Check if this channel already exists (might be assigned to another country)
            existing = await db.channels.find_one({"channel_id": search_result["channel_id"]})
            if existing:
                print(f"Channel already exists for {existing.get('country_code')}")
                skipped += 1
                await asyncio.sleep(0.2)
                continue
            
            # Get full channel stats
            yt_data = await get_channel_stats(session, search_result["channel_id"])
            
            if not yt_data:
                print("Could not fetch channel data")
                skipped += 1
                await asyncio.sleep(0.2)
                continue
            
            # Create channel document
            channel_doc = {
                **yt_data,
                "country_code": country_code,
                "country_name": country_name,
                "current_rank": 1,
                "previous_rank": 1,
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
            stats_doc = {
                "channel_id": yt_data["channel_id"],
                "subscriber_count": yt_data["subscriber_count"],
                "view_count": yt_data["view_count"],
                "video_count": yt_data["video_count"],
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            await db.channel_stats.insert_one(stats_doc)
            
            print(f"Added: {yt_data['title']} ({yt_data['subscriber_count']:,} subs)")
            added += 1
            
            # Rate limiting - be gentle with the API
            await asyncio.sleep(0.5)
    
    # Final stats
    total_countries = await db.countries.count_documents({})
    total_channels = await db.channels.count_documents({})
    countries_with_ch = len(await db.channels.distinct("country_code"))
    
    print(f"\n{'='*50}")
    print(f"COMPLETED!")
    print(f"Added: {added} new channels")
    print(f"Skipped: {skipped} countries (no channel found or duplicate)")
    print(f"Total countries: {total_countries}")
    print(f"Countries with channels: {countries_with_ch}")
    print(f"Total channels tracked: {total_channels}")
    print(f"{'='*50}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(add_channels_for_all_countries())
