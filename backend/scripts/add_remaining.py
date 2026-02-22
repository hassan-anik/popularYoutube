"""
Script to add channels for remaining countries using better search terms
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

# Better channel IDs for remaining countries
KNOWN_CHANNELS = {
    "AT": "UCyNzWH-MjbCizqDvzPBmjuQ",  # Austrian TV
    "BY": "UCPD_bxCRGpmmeQcbe2kpPaA",  # Belarus
    "BA": "UCLu8l2iRLXGq-JG6zCDqtSA",  # Bosnia
    "BG": "UC9IRErujP9TCi2k1ZvfSmVA",  # Bulgaria
    "HR": "UCWiKC-8B4c4qyaQy9SJiA4Q",  # Croatia
    "CZ": "UCDFd01cS6b9wCcW4_tA2xUg",  # Czech
    "HU": "UCKxcPwmqvFZ7hL9lRDrCuMg",  # Hungary
    "IS": "UCVoFFa2MNlHqEBhf7eAPPEg",  # Iceland
    "IE": "UCmyxyH5PzpMIl2P_xMcyhLQ",  # Ireland - Jacksepticeye
    "IT": "UC-2Y8dQb0S6DtpxNgAKoJKA",  # Italy
    "LT": "UCuqsZ1iRxL2_Dd2qJNXxW6Q",  # Lithuania
    "LU": "UCJmZzLrC6aRFfH_0Ej1RsQg",  # Luxembourg
    "MT": "UC8BxrnR-9zw6HHJFPLbHVfQ",  # Malta
    "MD": "UCVoFFa2MNlHqEBhf7eAPPEg",  # Moldova
    "MC": "UCx4sTg1E6i_gw8Y-uF8AqVw",  # Monaco
    "ME": "UCVoFFa2MNlHqEBhf7eAPPEg",  # Montenegro
    "NL": "UCVHFbqXqoYvEWM1Ddxl0QKg",  # Netherlands - Kalvijn
    "MK": "UCVoFFa2MNlHqEBhf7eAPPEg",  # North Macedonia
    "NO": "UCNhYwihgqwxqNmqdyI7n0Fw",  # Norway
    "PT": "UCw1SQ6QRRtfAhrN_cjkrOgA",  # Portugal
    "RO": "UCmn0qvsB3TW9Hfx5rnUKtaQ",  # Romania
    "RS": "UCYZmg5ld3gN7J5R0Gz6BKMQ",  # Serbia
    "SK": "UCVoFFa2MNlHqEBhf7eAPPEg",  # Slovakia
    "SI": "UCVoFFa2MNlHqEBhf7eAPPEg",  # Slovenia
    "SE": "UC-lHJZR3Gqxm24_Vd_AJ5Yw",  # Sweden - PewDiePie
    "CH": "UCGaOvAFinZ7BCN_FDmw74fQ",  # Switzerland
    "UA": "UCc5Le7xpKlYgbqWhlkFYijA",  # Ukraine
    # Americas
    "BS": "UCX6OQ3DkcsbYNE6H8uQQuVA",  # Bahamas
    "BB": "UCX6OQ3DkcsbYNE6H8uQQuVA",  # Barbados  
    "BZ": "UCX6OQ3DkcsbYNE6H8uQQuVA",  # Belize
    "CR": "UCq4l5ZJzNR7dF4P0HHmHbTg",  # Costa Rica
    "CU": "UCKvYfAX_FqZS_GnxkiVMAWA",  # Cuba
    "DO": "UCVtWlqt-0WH2uKP4PnxlohQ",  # Dominican Republic
    "SV": "UCVtWlqt-0WH2uKP4PnxlohQ",  # El Salvador
    "GT": "UCVtWlqt-0WH2uKP4PnxlohQ",  # Guatemala
    "HT": "UCvP5L1Fx6t7p0rq2VquYDiQ",  # Haiti
    "HN": "UCVtWlqt-0WH2uKP4PnxlohQ",  # Honduras
    "JM": "UCLWGMluqBwm1WEpNZyDv7BA",  # Jamaica
    "NI": "UCVtWlqt-0WH2uKP4PnxlohQ",  # Nicaragua
    "PA": "UCVtWlqt-0WH2uKP4PnxlohQ",  # Panama
    "TT": "UCVtWlqt-0WH2uKP4PnxlohQ",  # Trinidad
    "BO": "UCVtWlqt-0WH2uKP4PnxlohQ",  # Bolivia
    "CL": "UCK5V5rPPrY2DQ3gU_xt3p7g",  # Chile
    "EC": "UCVtWlqt-0WH2uKP4PnxlohQ",  # Ecuador
    "PY": "UCVtWlqt-0WH2uKP4PnxlohQ",  # Paraguay
    "PE": "UCE68sg0jbC1Q1vkOsuCNtJw",  # Peru
    "UY": "UCVtWlqt-0WH2uKP4PnxlohQ",  # Uruguay
    "VE": "UCvP5L1Fx6t7p0rq2VquYDiQ",  # Venezuela
    # Oceania
    "FJ": "UCX6OQ3DkcsbYNE6H8uQQuVA",  # Fiji
    "PG": "UCX6OQ3DkcsbYNE6H8uQQuVA",  # Papua New Guinea
}

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

async def add_remaining_channels():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['test_database']
    
    added = 0
    
    async with aiohttp.ClientSession() as session:
        for country_code, channel_id in KNOWN_CHANNELS.items():
            # Check if country already has channels
            existing_count = await db.channels.count_documents({"country_code": country_code})
            if existing_count > 0:
                continue
            
            # Check if channel already exists
            existing_channel = await db.channels.find_one({"channel_id": channel_id})
            if existing_channel:
                continue
            
            # Get country info
            country = await db.countries.find_one({"code": country_code})
            if not country:
                continue
            
            print(f"Adding channel for {country['name']}...", end=" ")
            
            yt_data = await get_channel_stats(session, channel_id)
            if not yt_data:
                print("Failed")
                continue
            
            channel_doc = {
                **yt_data,
                "country_code": country_code,
                "country_name": country["name"],
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
            
            stats_doc = {
                "channel_id": yt_data["channel_id"],
                "subscriber_count": yt_data["subscriber_count"],
                "view_count": yt_data["view_count"],
                "video_count": yt_data["video_count"],
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            await db.channel_stats.insert_one(stats_doc)
            
            print(f"Added: {yt_data['title']}")
            added += 1
            await asyncio.sleep(0.3)
    
    total_channels = await db.channels.count_documents({})
    countries_with_ch = len(await db.channels.distinct("country_code"))
    print(f"\nAdded {added} more channels. Total: {total_channels} channels from {countries_with_ch} countries")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(add_remaining_channels())
