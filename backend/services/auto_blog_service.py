"""
Auto Blog Service for TopTube World Pro
Generates daily blog posts about YouTube ranking changes
"""
import logging
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid
import random

logger = logging.getLogger(__name__)

class AutoBlogService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
    
    async def generate_daily_ranking_post(self):
        """Generate and publish a daily ranking blog post"""
        logger.info("Generating daily ranking blog post...")
        
        try:
            today = datetime.now(timezone.utc)
            date_str = today.strftime("%B %d, %Y")
            date_slug = today.strftime("%Y-%m-%d")
            
            # Get top 10 channels globally
            top_channels = await self.db.channels.find(
                {"is_active": True},
                {"_id": 0}
            ).sort("subscriber_count", -1).limit(10).to_list(10)
            
            # Get fastest growing channels (by daily growth)
            fastest_growing = await self.db.channels.find(
                {"is_active": True, "daily_subscriber_gain": {"$gt": 0}},
                {"_id": 0}
            ).sort("daily_subscriber_gain", -1).limit(5).to_list(5)
            
            # Get some interesting stats
            total_channels = await self.db.channels.count_documents({"is_active": True})
            total_subs = await self.db.channels.aggregate([
                {"$match": {"is_active": True}},
                {"$group": {"_id": None, "total": {"$sum": "$subscriber_count"}}}
            ]).to_list(1)
            total_subs_count = total_subs[0]["total"] if total_subs else 0
            
            # Get country with most channels
            country_stats = await self.db.channels.aggregate([
                {"$match": {"is_active": True}},
                {"$group": {"_id": "$country_name", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
                {"$limit": 5}
            ]).to_list(5)
            
            # Generate the blog post content
            content = self._generate_post_content(
                date_str=date_str,
                top_channels=top_channels,
                fastest_growing=fastest_growing,
                total_channels=total_channels,
                total_subs=total_subs_count,
                country_stats=country_stats
            )
            
            # Create the blog post
            post = {
                "id": str(uuid.uuid4()),
                "title": f"YouTube Rankings Update - {date_str}",
                "slug": f"daily-youtube-rankings-{date_slug}",
                "content": content,
                "excerpt": f"Daily update on the most subscribed YouTube channels. See who's leading the global rankings and which channels are growing fastest on {date_str}.",
                "category": "Daily Rankings",
                "author": "TopTube Editorial",
                "status": "published",
                "published_at": today.isoformat(),
                "created_at": today.isoformat(),
                "updated_at": today.isoformat(),
                "is_published": True,
                "is_auto_generated": True,
                "views": 0,
                "tags": ["rankings", "daily update", "youtube stats", today.strftime("%B %Y").lower()]
            }
            
            # Check if today's post already exists
            existing = await self.db.blog_posts.find_one({"slug": post["slug"]})
            if existing:
                # Update existing post
                await self.db.blog_posts.update_one(
                    {"slug": post["slug"]},
                    {"$set": post}
                )
                logger.info(f"Updated existing daily post: {post['slug']}")
            else:
                # Insert new post
                await self.db.blog_posts.insert_one(post)
                logger.info(f"Published new daily post: {post['slug']}")
            
            return post
            
        except Exception as e:
            logger.error(f"Error generating daily blog post: {e}")
            raise
    
    def _generate_post_content(self, date_str, top_channels, fastest_growing, total_channels, total_subs, country_stats):
        """Generate the blog post content with markdown"""
        
        # Format subscriber count
        def fmt(num):
            if num >= 1_000_000_000:
                return f"{num/1_000_000_000:.2f}B"
            elif num >= 1_000_000:
                return f"{num/1_000_000:.2f}M"
            elif num >= 1_000:
                return f"{num/1_000:.1f}K"
            return str(num)
        
        # Intro variations
        intros = [
            f"Welcome to your daily YouTube rankings update for {date_str}! Here's everything you need to know about the top YouTube channels right now.",
            f"Good day, YouTube enthusiasts! It's {date_str} and we've got fresh data on the most subscribed channels worldwide.",
            f"The YouTube landscape is always changing. Here's your {date_str} snapshot of the top creators and fastest risers.",
            f"Another day, another update! Let's dive into the YouTube rankings for {date_str}.",
        ]
        
        content = f"""
{random.choice(intros)}

## Global Top 10 Most Subscribed Channels

The battle for YouTube supremacy continues! Here are today's top 10 most subscribed channels:

| Rank | Channel | Country | Subscribers |
|------|---------|---------|-------------|
"""
        
        for i, ch in enumerate(top_channels, 1):
            content += f"| #{i} | **{ch.get('title', 'Unknown')}** | {ch.get('country_name', 'N/A')} | {fmt(ch.get('subscriber_count', 0))} |\n"
        
        content += f"""
### Key Highlights

- **{top_channels[0].get('title', 'Unknown')}** continues to lead with {fmt(top_channels[0].get('subscriber_count', 0))} subscribers
- The top 10 channels combined have over {fmt(sum(ch.get('subscriber_count', 0) for ch in top_channels))} subscribers
- We're tracking **{total_channels}** channels across the globe

"""
        
        if fastest_growing and len(fastest_growing) > 0:
            content += """## Fastest Growing Channels Today

These channels are on fire! Here are the top gainers:

| Channel | Country | Daily Gain | Total Subs |
|---------|---------|------------|------------|
"""
            for ch in fastest_growing:
                gain = ch.get('daily_subscriber_gain', 0)
                if gain > 0:
                    content += f"| **{ch.get('title', 'Unknown')}** | {ch.get('country_name', 'N/A')} | +{fmt(gain)} | {fmt(ch.get('subscriber_count', 0))} |\n"
        
        if country_stats and len(country_stats) > 0:
            content += f"""
## Top Countries by Channel Count

Which countries dominate YouTube? Here's the breakdown:

"""
            for stat in country_stats:
                content += f"- **{stat['_id']}**: {stat['count']} channels\n"
        
        # Closing
        closings = [
            "Stay tuned for tomorrow's update to see how the rankings shift!",
            "Check back tomorrow for the latest changes in the YouTube rankings.",
            "The race for subscribers never stops - see you in the next update!",
            "That's all for today! Keep creating and keep watching.",
        ]
        
        content += f"""
## Summary

As of {date_str}, we're tracking **{total_channels}** YouTube channels with a combined **{fmt(total_subs)}** subscribers. The YouTube creator economy continues to grow, with new milestones being reached every day.

{random.choice(closings)}

---

*This post was automatically generated by TopTube World Pro's ranking system. Data is updated multiple times daily.*
"""
        
        return content.strip()
    
    async def generate_milestone_post(self, channel, milestone):
        """Generate a blog post when a channel hits a milestone"""
        logger.info(f"Generating milestone post for {channel.get('title')} hitting {milestone}")
        
        today = datetime.now(timezone.utc)
        
        def fmt(num):
            if num >= 1_000_000_000:
                return f"{num/1_000_000_000:.0f}B"
            elif num >= 1_000_000:
                return f"{num/1_000_000:.0f}M"
            return str(num)
        
        title = f"{channel.get('title')} Hits {fmt(milestone)} Subscribers!"
        slug = f"{channel.get('title', 'channel').lower().replace(' ', '-')}-{fmt(milestone).lower()}-subscribers-{today.strftime('%Y%m%d')}"
        
        content = f"""
# {channel.get('title')} Reaches {fmt(milestone)} Subscribers!

Big news in the YouTube world! **{channel.get('title')}** from {channel.get('country_name', 'Unknown')} has officially crossed the **{fmt(milestone)} subscriber** milestone!

## Channel Stats

- **Current Subscribers:** {fmt(channel.get('subscriber_count', 0))}
- **Total Views:** {fmt(channel.get('view_count', 0))}
- **Videos:** {channel.get('video_count', 0)}
- **Country:** {channel.get('country_name', 'Unknown')}

## What This Means

Reaching {fmt(milestone)} subscribers is a massive achievement in the YouTube ecosystem. This puts {channel.get('title')} among the elite creators on the platform.

Congratulations to {channel.get('title')} and their community!

---

*Track more YouTube milestones and rankings at TopTube World Pro.*
"""
        
        post = {
            "id": str(uuid.uuid4()),
            "title": title,
            "slug": slug,
            "content": content.strip(),
            "excerpt": f"{channel.get('title')} has reached {fmt(milestone)} subscribers on YouTube!",
            "category": "Milestones",
            "author": "TopTube Bot",
            "status": "published",
            "published_at": today.isoformat(),
            "created_at": today.isoformat(),
            "updated_at": today.isoformat(),
            "is_published": True,
            "is_auto_generated": True,
            "views": 0,
            "tags": ["milestone", channel.get('title', '').lower(), f"{fmt(milestone).lower()} subscribers"]
        }
        
        await self.db.blog_posts.insert_one(post)
        logger.info(f"Published milestone post: {post['slug']}")
        
        return post


# Singleton instance getter
_auto_blog_service = None

def get_auto_blog_service(db: AsyncIOMotorDatabase):
    global _auto_blog_service
    if _auto_blog_service is None:
        _auto_blog_service = AutoBlogService(db)
    return _auto_blog_service
