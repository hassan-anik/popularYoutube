#!/usr/bin/env python3
"""
Script to sync blog posts to production database.
Run this from a machine that has access to your production MongoDB (whitelisted IP).

Usage:
    python sync_to_production.py

Make sure to set the PROD_MONGO_URL environment variable or edit the script below.
"""
import asyncio
import json
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import os

# Production MongoDB settings - UPDATE THESE OR SET AS ENVIRONMENT VARIABLES
PROD_URL = os.environ.get("PROD_MONGO_URL", "mongodb+srv://leaderboard-test-1:d6ledjklqs2c73bsh7k0@customer-apps.w9qx2h.mongodb.net/?retryWrites=true&w=majority")
PROD_DB = os.environ.get("PROD_DB_NAME", "toptube-world")

async def sync_blog_posts():
    """Sync blog posts from JSON file to production database"""
    
    # Load exported posts
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(script_dir, "blog_posts_export.json")
    
    with open(json_path, "r") as f:
        posts = json.load(f)
    
    print(f"Loaded {len(posts)} blog posts from export file")
    
    # Connect to production
    print(f"Connecting to production database: {PROD_DB}")
    client = AsyncIOMotorClient(PROD_URL, serverSelectionTimeoutMS=30000)
    db = client[PROD_DB]
    
    # Test connection
    await client.admin.command("ping")
    print("Connected to production MongoDB!")
    
    # Get existing slugs
    existing_slugs = await db.blog_posts.distinct("slug")
    print(f"Found {len(existing_slugs)} existing posts in production")
    
    added_count = 0
    updated_count = 0
    skipped_count = 0
    
    for post in posts:
        slug = post.get("slug")
        if not slug:
            skipped_count += 1
            continue
        
        # Convert date strings to datetime
        for date_field in ["published_at", "created_at", "updated_at"]:
            if date_field in post and isinstance(post[date_field], str):
                try:
                    post[date_field] = datetime.fromisoformat(post[date_field].replace("Z", "+00:00"))
                except:
                    pass
        
        if slug in existing_slugs:
            # Check if content changed
            existing = await db.blog_posts.find_one({"slug": slug})
            if existing and existing.get("content") != post.get("content"):
                await db.blog_posts.update_one({"slug": slug}, {"$set": post})
                updated_count += 1
                print(f"  Updated: {post.get('title', slug)}")
            else:
                skipped_count += 1
        else:
            await db.blog_posts.insert_one(post)
            added_count += 1
            print(f"  Added: {post.get('title', slug)}")
    
    client.close()
    
    print("\n" + "="*50)
    print(f"SYNC COMPLETE!")
    print(f"  Added: {added_count}")
    print(f"  Updated: {updated_count}")
    print(f"  Skipped (already exists): {skipped_count}")
    print(f"  Total processed: {len(posts)}")
    print("="*50)

if __name__ == "__main__":
    asyncio.run(sync_blog_posts())
