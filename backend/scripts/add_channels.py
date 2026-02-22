"""
Script to add top channels for countries
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

# Known top channels by country code
CHANNELS_TO_ADD = {
    "AU": ["UCYzPXprvl5Y-Sf0g4vX-m6g"],  # Lachlan
    "TR": ["UCK1i2UviaXLUNrZlAFpw_jA"],  # Enes Batur
    "EG": ["UCiJA-IfadjRtdwDEBu5_bKQ"],  # Amr Diab
    "SA": ["UCaWd5_7JhbQBe4dknZhQJJA"],  # ArabGT
    "PL": ["UCzfyYtgvkx5mLy8nlLlayYg"],  # Blowek
    "NL": ["UCVHFbqXqoYvEWM1Ddxl0QKg"],  # Kalvijn
    "SE": ["UC-lHJZR3Gqxm24_Vd_AJ5Yw"],  # PewDiePie
    "PT": ["UCSTvSn2xUiSjyONPHgjUYSw"],  # Wuant
    "NG": ["UCwl3UpfQvKmH3bSLdMmUekA"],  # Mark Angel Comedy
    "ZA": ["UCYxrnDjNQZIs_aAeUoLD-Cw"],  # Caspar Lee
    "MY": ["UCQo7OQMFA7cMpbGLh0CcUzw"],  # Namewee
    "SG": ["UCVjlpEjEY9GpksqbEesJnNA"],  # JianHao Tan
    "CL": ["UCYiGq8XF7YQD00x7wAd62Zg"],  # HolaSoyGerman
    "PE": ["UCYiGq8XF7YQD00x7wAd62Zg"],  # HolaSoyGerman
    "UA": ["UCc5Le7xpKlYgbqWhlkFYijA"],  # Ukrainian channel
    "GR": ["UCVhQ2NnY5Rskt6UjCUkJ_DA"],  # The Lab
    "NZ": ["UCjmJDM5pRKbUlVIzDYYWb6g"],  # How Ridiculous
    "IE": ["UCYzPXprvl5Y-Sf0g4vX-m6g"],  # Irish channels
    "IL": ["UC2B-ekNBDwHq4Nt8U7VXOOQ"],  # Israeli Music
    "IT": ["UC2tsz_k4XVQfvPpZVWVN_lw"],  # Me contro Te
    "AT": ["UCyg2PoUb9H8bDLJNFHftvPQ"],  # Austrian channel
    "CH": ["UC0W44qxMq5qIuNq4Qk8VkWA"],  # Swiss channel
    "BE": ["UCwFl9Y49sWChrddQTD9QhRA"],  # Belgian channel
    "NO": ["UC7MNh-X0JqQcPqW3GdTpV1w"],  # Norwegian channel
    "DK": ["UCpzETLqz-F75JXfz1omEd8Q"],  # Danish channel
    "FI": ["UCPysfiuOv4VKBeXFFPhKXyw"],  # Finnish channel
    "CZ": ["UCn2jGFwJNST0sQtUqhyG-yw"],  # Kovy
    "HU": ["UCOlqB1NpP6jhXTaLcBH0ZGg"],  # Hungarian
    "RO": ["UCmn0qvsB3TW9Hfx5rnUKtaQ"],  # Romanian
    "CN": ["UC4-JSpXb_wPqIOcymie00LA"],  # Chinese channel
    "TW": ["UCb3TZ4SD_Ys3j4z0-8o6auA"],  # Taiwanese channel
    "KE": ["UCBnZ16ahKA2DZ_T5W0FPUXg"],  # Kenyan
    "GH": ["UCOv4XKGzKxU7Iy4WM4qzYLA"],  # Ghanaian
    "MA": ["UCeuyJL-w8Gw4BfUffRq9HuA"],  # Moroccan
}

async def get_channel_stats(channel_id):
    """Fetch channel data from YouTube API"""
    url = f"{YOUTUBE_API_BASE}/channels"
    params = {
        "key": YOUTUBE_API_KEY,
        "part": "statistics,snippet",
        "id": channel_id
    }
    
    async with aiohttp.ClientSession() as session:
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
        "description": snippet.get("description", ""),
        "custom_url": snippet.get("customUrl", ""),
        "country": snippet.get("country", ""),
        "published_at": snippet.get("publishedAt", ""),
        "thumbnail_url": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
        "subscriber_count": int(stats.get("subscriberCount", 0)),
        "view_count": int(stats.get("viewCount", 0)),
        "video_count": int(stats.get("videoCount", 0)),
    }

async def add_channels():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['test_database']
    
    added = 0
    failed = 0
    
    for country_code, channel_ids in CHANNELS_TO_ADD.items():
        # Check if country exists
        country = await db.countries.find_one({"code": country_code})
        if not country:
            print(f"Country {country_code} not found, skipping")
            continue
        
        # Check if country already has channels
        existing_channels = await db.channels.count_documents({"country_code": country_code})
        if existing_channels > 0:
            print(f"{country_code} already has {existing_channels} channels, skipping")
            continue
        
        for channel_id in channel_ids:
            # Check if channel already exists
            existing = await db.channels.find_one({"channel_id": channel_id})
            if existing:
                print(f"Channel {channel_id} already exists, skipping")
                continue
            
            try:
                yt_data = await get_channel_stats(channel_id)
                if not yt_data:
                    print(f"Could not fetch data for {channel_id}")
                    failed += 1
                    continue
                
                channel_doc = {
                    **yt_data,
                    "country_code": country_code,
                    "country_name": country["name"],
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
                
                # Also store initial stats
                stats_doc = {
                    "channel_id": channel_id,
                    "subscriber_count": yt_data["subscriber_count"],
                    "view_count": yt_data["view_count"],
                    "video_count": yt_data["video_count"],
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
                await db.channel_stats.insert_one(stats_doc)
                
                print(f"Added: {yt_data['title']} ({country_code})")
                added += 1
                
                # Small delay to avoid rate limiting
                await asyncio.sleep(0.3)
                
            except Exception as e:
                print(f"Error adding {channel_id}: {e}")
                failed += 1
    
    total_channels = await db.channels.count_documents({})
    print(f"\nCompleted: Added {added} channels, {failed} failed. Total: {total_channels}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(add_channels())
