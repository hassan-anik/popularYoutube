"""
Background Scheduler Service for TopTube World Pro
Handles automatic data refresh and ranking updates
"""
import logging
from datetime import datetime, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

class SchedulerService:
    def __init__(self, db: AsyncIOMotorDatabase, youtube_service, ranking_service, growth_analyzer):
        self.db = db
        self.youtube_service = youtube_service
        self.ranking_service = ranking_service
        self.growth_analyzer = growth_analyzer
        self.scheduler = AsyncIOScheduler()
        self._is_refreshing = False
        self._is_ranking = False
        
    def start(self):
        """Start the background scheduler with all jobs"""
        # Job 1: Refresh all channel data every 6 hours
        self.scheduler.add_job(
            self.refresh_all_channels,
            trigger=IntervalTrigger(hours=6),
            id='refresh_channels',
            name='Refresh all channel data from YouTube',
            replace_existing=True
        )
        
        # Job 2: Update rankings every 10 minutes
        self.scheduler.add_job(
            self.update_all_rankings,
            trigger=IntervalTrigger(minutes=10),
            id='update_rankings',
            name='Update channel rankings',
            replace_existing=True
        )
        
        # Job 3: Calculate growth metrics every hour
        self.scheduler.add_job(
            self.calculate_growth_metrics,
            trigger=IntervalTrigger(hours=1),
            id='calculate_growth',
            name='Calculate growth metrics for all channels',
            replace_existing=True
        )
        
        self.scheduler.start()
        logger.info("Background scheduler started with jobs: refresh_channels (6h), update_rankings (10m), calculate_growth (1h)")
        
    def stop(self):
        """Stop the background scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown(wait=False)
            logger.info("Background scheduler stopped")
    
    async def refresh_all_channels(self):
        """Refresh all tracked channels from YouTube API"""
        if self._is_refreshing:
            logger.warning("Channel refresh already in progress, skipping...")
            return
            
        self._is_refreshing = True
        logger.info("Starting scheduled channel refresh...")
        
        try:
            # Get all active channels
            channels = await self.db.channels.find(
                {"is_active": True}, 
                {"channel_id": 1}
            ).to_list(1000)
            
            if not channels:
                logger.info("No channels to refresh")
                return
                
            channel_ids = [c["channel_id"] for c in channels]
            logger.info(f"Refreshing {len(channel_ids)} channels...")
            
            # Batch fetch from YouTube API
            results = await self.youtube_service.get_batch_channel_stats(channel_ids)
            
            updated_count = 0
            for yt_data in results:
                channel_id = yt_data["channel_id"]
                
                # Update channel document
                update_data = {
                    "title": yt_data.get("title", ""),
                    "description": yt_data.get("description", ""),
                    "thumbnail_url": yt_data.get("thumbnail_url", ""),
                    "subscriber_count": yt_data.get("subscriber_count", 0),
                    "view_count": yt_data.get("view_count", 0),
                    "video_count": yt_data.get("video_count", 0),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
                
                await self.db.channels.update_one(
                    {"channel_id": channel_id}, 
                    {"$set": update_data}
                )
                
                # Store stats snapshot for historical tracking
                stats_doc = {
                    "channel_id": channel_id,
                    "subscriber_count": yt_data.get("subscriber_count", 0),
                    "view_count": yt_data.get("view_count", 0),
                    "video_count": yt_data.get("video_count", 0),
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
                await self.db.channel_stats.insert_one(stats_doc)
                updated_count += 1
            
            # Update last refresh timestamp
            await self.db.system_status.update_one(
                {"_id": "scheduler"},
                {
                    "$set": {
                        "last_channel_refresh": datetime.now(timezone.utc).isoformat(),
                        "channels_refreshed": updated_count
                    }
                },
                upsert=True
            )
            
            logger.info(f"Channel refresh completed: {updated_count} channels updated")
            
        except Exception as e:
            logger.error(f"Error during channel refresh: {e}")
        finally:
            self._is_refreshing = False
    
    async def update_all_rankings(self):
        """Update rankings for all countries and globally"""
        if self._is_ranking:
            logger.warning("Ranking update already in progress, skipping...")
            return
            
        self._is_ranking = True
        logger.info("Starting scheduled ranking update...")
        
        try:
            # Get all countries
            countries = await self.db.countries.find({}, {"code": 1}).to_list(300)
            
            # Update rankings for each country
            for country in countries:
                await self.ranking_service.update_rankings(country["code"])
            
            # Update global rankings
            await self._update_global_rankings()
            
            # Update last ranking timestamp
            await self.db.system_status.update_one(
                {"_id": "scheduler"},
                {
                    "$set": {
                        "last_ranking_update": datetime.now(timezone.utc).isoformat()
                    }
                },
                upsert=True
            )
            
            logger.info(f"Ranking update completed for {len(countries)} countries")
            
        except Exception as e:
            logger.error(f"Error during ranking update: {e}")
        finally:
            self._is_ranking = False
    
    async def _update_global_rankings(self):
        """Update global rankings across all channels"""
        # Get all active channels sorted by subscriber count
        channels = await self.db.channels.find(
            {"is_active": True},
            {"channel_id": 1, "current_rank": 1, "subscriber_count": 1}
        ).sort("subscriber_count", -1).to_list(1000)
        
        for idx, channel in enumerate(channels):
            new_rank = idx + 1
            old_rank = channel.get("current_rank", new_rank)
            
            # Check if rank changed
            if old_rank != new_rank:
                # Store rank change history
                rank_change_doc = {
                    "channel_id": channel["channel_id"],
                    "old_rank": old_rank,
                    "new_rank": new_rank,
                    "change": old_rank - new_rank,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
                await self.db.rank_history.insert_one(rank_change_doc)
            
            # Update channel with new rank
            await self.db.channels.update_one(
                {"channel_id": channel["channel_id"]},
                {
                    "$set": {
                        "previous_rank": old_rank,
                        "current_rank": new_rank
                    }
                }
            )
    
    async def calculate_growth_metrics(self):
        """Calculate growth metrics for all channels"""
        logger.info("Starting growth metrics calculation...")
        
        try:
            channels = await self.db.channels.find(
                {"is_active": True}, 
                {"channel_id": 1}
            ).to_list(1000)
            
            for channel in channels:
                await self.growth_analyzer.update_channel_growth_metrics(channel["channel_id"])
            
            logger.info(f"Growth metrics calculated for {len(channels)} channels")
            
        except Exception as e:
            logger.error(f"Error calculating growth metrics: {e}")
    
    async def get_scheduler_status(self):
        """Get current scheduler status and job information"""
        jobs = []
        for job in self.scheduler.get_jobs():
            jobs.append({
                "id": job.id,
                "name": job.name,
                "next_run": job.next_run_time.isoformat() if job.next_run_time else None,
                "trigger": str(job.trigger)
            })
        
        # Get last run times from database
        status = await self.db.system_status.find_one({"_id": "scheduler"})
        
        return {
            "is_running": self.scheduler.running,
            "is_refreshing": self._is_refreshing,
            "is_ranking": self._is_ranking,
            "jobs": jobs,
            "last_channel_refresh": status.get("last_channel_refresh") if status else None,
            "last_ranking_update": status.get("last_ranking_update") if status else None,
            "channels_refreshed": status.get("channels_refreshed", 0) if status else 0
        }


# Singleton instance
_scheduler_service = None

def get_scheduler_service(db, youtube_service, ranking_service, growth_analyzer):
    global _scheduler_service
    if _scheduler_service is None:
        _scheduler_service = SchedulerService(db, youtube_service, ranking_service, growth_analyzer)
    return _scheduler_service
