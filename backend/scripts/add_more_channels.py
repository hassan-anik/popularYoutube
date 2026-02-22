"""
Script to search and add channels for remaining countries using better queries
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

# Better search terms for each country
SEARCH_TERMS = {
    "AT": ["Austria ORF", "Austrian music"],
    "BY": ["Belarus TV", "Belarusian"],
    "BA": ["Bosnia TV", "Bosnian music"],
    "BG": ["Bulgaria bTV", "Bulgarian music"],
    "HR": ["Croatia HRT", "Croatian music"],
    "CZ": ["Czech TV", "Czech music Karel"],
    "HU": ["Hungary RTL", "Hungarian music"],
    "IS": ["Iceland RUV", "Icelandic"],
    "IE": ["Irish TV RTE", "Ireland music"],
    "IT": ["Italian RAI", "Italian music"],
    "LT": ["Lithuania LRT", "Lithuanian"],
    "LU": ["Luxembourg RTL", "Luxembourgish"],
    "MT": ["Malta TVM", "Maltese"],
    "MD": ["Moldova TV", "Moldovan"],
    "MC": ["Monaco", "Monte Carlo"],
    "ME": ["Montenegro RTCG", "Montenegrin"],
    "NL": ["Dutch NPO", "Netherlands music"],
    "MK": ["Macedonia MRT", "Macedonian"],
    "NO": ["Norway NRK", "Norwegian"],
    "PT": ["Portugal RTP", "Portuguese music"],
    "RO": ["Romania PRO TV", "Romanian music"],
    "RS": ["Serbia RTS", "Serbian music"],
    "SK": ["Slovakia TV", "Slovak"],
    "SI": ["Slovenia RTV", "Slovenian"],
    "SE": ["Sweden SVT", "Swedish music"],
    "CH": ["Switzerland SRF", "Swiss"],
    "UA": ["Ukraine 1+1", "Ukrainian music"],
    "CR": ["Costa Rica Teletica", "Costa Rican"],
    "CU": ["Cuba TV", "Cuban music"],
    "DO": ["Dominican Republic TV", "Dominican music"],
    "SV": ["El Salvador TV", "Salvadoran"],
    "GT": ["Guatemala TV", "Guatemalan"],
    "HT": ["Haiti TV", "Haitian music"],
    "HN": ["Honduras TV", "Honduran"],
    "JM": ["Jamaica TV", "Jamaican music reggae"],
    "NI": ["Nicaragua TV", "Nicaraguan"],
    "PA": ["Panama TV", "Panamanian"],
    "TT": ["Trinidad TV", "Trinidadian soca"],
    "BO": ["Bolivia TV", "Bolivian music"],
    "CL": ["Chile TVN", "Chilean music"],
    "EC": ["Ecuador TV", "Ecuadorian"],
    "PY": ["Paraguay TV", "Paraguayan"],
    "PE": ["Peru TV", "Peruvian music"],
    "UY": ["Uruguay TV", "Uruguayan"],
    "VE": ["Venezuela Venevision", "Venezuelan music"],
    "FJ": ["Fiji TV", "Fijian"],
    "PG": ["Papua New Guinea TV", "PNG music"],
}

async def search_channel(session, query):
    """Search for a channel"""
    url = f"{YOUTUBE_API_BASE}/search"
    params = {
        "key": YOUTUBE_API_KEY,
        "part": "snippet",
        "q": query,
        "type": "channel",
        "maxResults": 1
    }
    
    try:
        async with session.get(url, params=params) as response:
            if response.status != 200:
                return None
            data = await response.json()
        
        if data.get("items"):
            return data["items"][0]["id"]["channelId"]
    except:
        pass
    return None

async def get_channel_stats(session, channel_id):
    """Fetch full channel data"""
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

async def add_channels():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['test_database']
    
    added = 0
    
    async with aiohttp.ClientSession() as session:
        for country_code, queries in SEARCH_TERMS.items():
            # Check if country already has channels
            existing_count = await db.channels.count_documents({"country_code": country_code})
            if existing_count > 0:
                print(f"{country_code} already has channels, skipping")
                continue
            
            # Get country info
            country = await db.countries.find_one({"code": country_code})
            if not country:
                continue
            
            print(f"Searching for {country['name']}...", end=" ")
            
            channel_id = None
            for query in queries:
                channel_id = await search_channel(session, query)
                if channel_id:
                    # Check if this channel is already used
                    existing = await db.channels.find_one({"channel_id": channel_id})
                    if existing:
                        channel_id = None
                        continue
                    break
                await asyncio.sleep(0.2)
            
            if not channel_id:
                print("No unique channel found")
                continue
            
            yt_data = await get_channel_stats(session, channel_id)
            if not yt_data:
                print("Could not fetch data")
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
            
            print(f"Added: {yt_data['title']} ({yt_data['subscriber_count']:,} subs)")
            added += 1
            await asyncio.sleep(0.3)
    
    total_channels = await db.channels.count_documents({})
    countries_with_ch = len(await db.channels.distinct("country_code"))
    print(f"\n{'='*50}")
    print(f"Added {added} more channels")
    print(f"Total: {total_channels} channels from {countries_with_ch} countries")
    print(f"{'='*50}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(add_channels())
