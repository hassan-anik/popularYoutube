import logging
import os, uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Query, Body
from typing import List, Optional, Dict
from database import db
from routes.utils import verify_admin_key, format_number_simple
from models import BlogPostCreate, BlogPostUpdate

router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)

# ==================== BLOG ADMIN ====================

BLOG_ADMIN_KEY = os.environ.get('BLOG_ADMIN_KEY', 'toptube2024admin')
BLOG_CATEGORIES = ['Trending', 'Guide', 'Analysis', 'Case Study', 'Strategy', 'Gaming', 'News', 'Tips']


@router.get("/blog/categories")
async def get_blog_categories():
    """Get available blog categories"""
    return {"categories": BLOG_CATEGORIES}

@router.get("/blog/posts")
async def get_blog_posts(
    status: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = Query(default=20, le=100),
    skip: int = 0
):
    """Get all blog posts (public - only published unless admin)"""
    query = {}
    if status:
        query["status"] = status
    else:
        query["status"] = "published"  # Default to published for public
    
    if category:
        query["category"] = category
    
    posts = await db.blog_posts.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.blog_posts.count_documents(query)
    
    return {"posts": posts, "total": total}

@router.get("/blog/posts/{slug}")
async def get_blog_post(slug: str):
    """Get a single blog post by slug"""
    post = await db.blog_posts.find_one({"slug": slug}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


# ==================== AUTO-GENERATED COUNTRY BLOG POSTS ====================

@router.get("/blog/country/{country_code}")
async def get_country_blog_post(country_code: str):
    """Get auto-generated blog post for a country with top YouTubers"""
    try:
        country = await db.countries.find_one({"code": country_code.upper()}, {"_id": 0})
        if not country:
            raise HTTPException(status_code=404, detail="Country not found")
        
        # Get top 10 channels for this country
        channels = await db.channels.find(
            {"country_code": country_code.upper(), "is_active": True},
            {"_id": 0}
        ).sort("subscriber_count", -1).limit(10).to_list(10)
        
        # Ensure channels is always a list
        if channels is None:
            channels = []
        
        year = datetime.now(timezone.utc).year
        country_name = country.get("name", country_code) or country_code
        flag = country.get("flag_emoji", "") or ""
        region = country.get("region", "") or "Unknown"
        
        # Generate SEO-optimized content
        title = f"Top 10 Most Subscribed YouTubers in {country_name} {flag} ({year})"
        slug = f"top-youtubers-{country_name.lower().replace(' ', '-')}-{year}"
        
        # Build the article content - handle empty channels case
        if channels and len(channels) > 0:
            top_channel_text = f"The #1 YouTuber is {channels[0].get('title', 'Unknown')} with {format_number_simple(channels[0].get('subscriber_count', 0))} subscribers."
        else:
            top_channel_text = "We are currently tracking YouTube creators from this country."
        
        intro = f"""Discover the most popular YouTube channels from {country_name}! This comprehensive guide ranks the top 10 most subscribed YouTubers from {country_name} in {year}, complete with subscriber counts, growth statistics, and what makes each channel special.

{country_name}, located in {region}, has a thriving YouTube community. {top_channel_text}"""

        # Generate channel sections
        channel_sections = []
        for idx, channel in enumerate(channels):
            if not channel:
                continue
            rank = idx + 1
            channel_title = channel.get('title', 'Unknown') or 'Unknown'
            subscriber_count = channel.get('subscriber_count', 0) or 0
            view_count = channel.get('view_count', 0) or 0
            video_count = channel.get('video_count', 0) or 0
            daily_gain = channel.get('daily_subscriber_gain', 0) or 0
            viral_label = channel.get('viral_label', '')
            channel_id = channel.get('channel_id', '')
            
            section = f"""
### #{rank}. {channel_title}

**Subscribers:** {format_number_simple(subscriber_count)}
**Total Views:** {format_number_simple(view_count)}
**Videos:** {video_count}
**24h Growth:** +{format_number_simple(daily_gain)} subscribers

{channel_title} ranks #{rank} in {country_name} with an impressive {format_number_simple(subscriber_count)} subscribers. {"Currently showing " + viral_label + " growth patterns." if viral_label else ""}

[View detailed statistics →](/channel/{channel_id})
"""
            channel_sections.append(section)
    
        content = intro + "\n\n## The Top 10 YouTubers in " + country_name + " " + str(year) + "\n" + "\n".join(channel_sections)
        
        # Add conclusion
        content += f"""

## Conclusion

These are the top 10 most subscribed YouTube channels from {country_name} as of {year}. The YouTube landscape is constantly evolving, with new creators rising and established channels continuing to grow.

**Want to explore more?**
- [View all {country_name} channels](/country/{country_code.upper()})
- [Compare these channels](/compare)
- [See global rankings](/leaderboard)

*Data updated regularly from YouTube API. Last update: {datetime.now(timezone.utc).strftime('%B %d, %Y')}*
"""
        
        # Calculate read time (roughly 200 words per minute)
        word_count = len(content.split())
        read_time = max(3, word_count // 200)
        
        return {
            "title": title,
            "slug": slug,
            "country_code": country_code.upper(),
            "country_name": country_name,
            "flag_emoji": flag,
            "region": region,
            "excerpt": f"Discover the top 10 most subscribed YouTube channels from {country_name} in {year}. See who's #1 and track their growth statistics.",
            "content": content,
            "category": "Country Rankings",
            "channels": channels,
            "total_channels": len(channels) if channels else 0,
            "read_time": f"{read_time} min read",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "is_auto_generated": True
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating country blog post for {country_code}: {e}")
        # Return a minimal valid response instead of 500
        return {
            "title": f"YouTube Channels in {country_code.upper()}",
            "slug": f"youtubers-{country_code.lower()}",
            "country_code": country_code.upper(),
            "country_name": country_code.upper(),
            "flag_emoji": "",
            "region": "Unknown",
            "excerpt": f"YouTube channels from {country_code.upper()}",
            "content": f"# YouTube Channels in {country_code.upper()}\n\nWe are currently gathering data for this country. Please check back later.",
            "category": "Country Rankings",
            "channels": [],
            "total_channels": 0,
            "read_time": "1 min read",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "is_auto_generated": True
        }


@router.get("/blog/countries")
async def get_all_country_blog_posts():
    """Get list of all auto-generated country blog posts for sitemap/index"""
    countries = await db.countries.find({}, {"_id": 0, "code": 1, "name": 1, "flag_emoji": 1, "region": 1}).to_list(300)
    year = datetime.now(timezone.utc).year
    
    posts = []
    for country in countries:
        posts.append({
            "country_code": country["code"],
            "country_name": country["name"],
            "flag_emoji": country.get("flag_emoji", ""),
            "slug": f"top-youtubers-{country['name'].lower().replace(' ', '-')}-{year}",
            "title": f"Top 10 Most Subscribed YouTubers in {country['name']} ({year})",
            "url": f"/blog/country/{country['code']}"
        })
    
    return {"posts": posts, "total": len(posts), "year": year}



@router.get("/admin/blog/posts")
async def admin_get_all_posts(admin_key: str = Query(...)):
    """Admin: Get all posts including drafts"""
    verify_admin_key(admin_key)
    posts = await db.blog_posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"posts": posts}

@router.post("/admin/blog/posts")
async def admin_create_post(post: BlogPostCreate, admin_key: str = Query(...)):
    """Admin: Create a new blog post"""
    verify_admin_key(admin_key)
    
    # Check for duplicate slug
    existing = await db.blog_posts.find_one({"slug": post.slug})
    if existing:
        raise HTTPException(status_code=400, detail="A post with this slug already exists")
    
    post_doc = {
        "id": str(uuid.uuid4()),
        "title": post.title,
        "slug": post.slug,
        "excerpt": post.excerpt,
        "content": post.content,
        "category": post.category,
        "image": post.image,
        "status": post.status,
        "read_time": post.read_time,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.blog_posts.insert_one(post_doc)
    del post_doc["_id"]  # Remove MongoDB _id before returning
    
    return {"message": "Post created", "post": post_doc}

@router.put("/admin/blog/posts/{post_id}")
async def admin_update_post(post_id: str, post: BlogPostUpdate, admin_key: str = Query(...)):
    """Admin: Update a blog post"""
    verify_admin_key(admin_key)
    
    existing = await db.blog_posts.find_one({"id": post_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Post not found")
    
    update_data = {k: v for k, v in post.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.blog_posts.update_one({"id": post_id}, {"$set": update_data})
    
    updated_post = await db.blog_posts.find_one({"id": post_id}, {"_id": 0})
    return {"message": "Post updated", "post": updated_post}

@router.delete("/admin/blog/posts/{post_id}")
async def admin_delete_post(post_id: str, admin_key: str = Query(...)):
    """Admin: Delete a blog post"""
    verify_admin_key(admin_key)
    
    result = await db.blog_posts.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return {"message": "Post deleted"}

@router.post("/admin/blog/upload-image")
async def admin_upload_image(admin_key: str = Query(...)):
    """Admin: Get a placeholder for image upload (use external service)"""
    verify_admin_key(admin_key)
    
    # For now, return instructions for using external image hosting
    return {
        "message": "For image uploads, use one of these free services:",
        "options": [
            {"name": "Imgur", "url": "https://imgur.com/upload"},
            {"name": "ImgBB", "url": "https://imgbb.com/"},
            {"name": "Unsplash", "url": "https://unsplash.com/"}
        ],
        "instructions": "Upload your image to one of these services and paste the URL in the image field"
    }


@router.post("/admin/blog/import")
async def admin_import_blog_posts(admin_key: str = Query(...), posts: List[Dict] = Body(...)):
    """Admin: Import blog posts from JSON - useful for syncing between environments"""
    verify_admin_key(admin_key)
    
    imported_count = 0
    skipped_count = 0
    
    for post in posts:
        # Check if post already exists by slug
        existing = await db.blog_posts.find_one({"slug": post.get("slug")})
        if existing:
            skipped_count += 1
            continue
        
        # Insert the post
        await db.blog_posts.insert_one(post)
        imported_count += 1
    
    return {
        "message": "Import complete",
        "imported": imported_count,
        "skipped": skipped_count,
        "total_processed": len(posts)
    }


@router.get("/admin/blog/export")
async def admin_export_blog_posts(admin_key: str = Query(...)):
    """Admin: Export all blog posts as JSON - useful for backup and syncing"""
    verify_admin_key(admin_key)
    
    posts = await db.blog_posts.find({}, {"_id": 0}).to_list(length=None)
    
    return {
        "posts": posts,
        "total": len(posts),
        "exported_at": datetime.now(timezone.utc).isoformat()
    }



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


