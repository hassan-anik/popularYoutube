"""
Script to seed all countries into the database
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import sys
sys.path.append('/app/backend')
from data.countries import ALL_COUNTRIES, TOP_CHANNELS_BY_COUNTRY

async def seed_all_countries():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['test_database']
    
    # Get existing country codes
    existing = await db.countries.distinct("code")
    existing_set = set(existing)
    
    added = 0
    for country in ALL_COUNTRIES:
        if country["code"] not in existing_set:
            country_doc = {
                **country,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.countries.insert_one(country_doc)
            added += 1
    
    total = await db.countries.count_documents({})
    print(f"Added {added} new countries. Total: {total} countries")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_all_countries())
