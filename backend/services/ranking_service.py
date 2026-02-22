"""
Ranking Service - Handles ranking calculations and updates
"""
import logging
from typing import List, Dict, Optional
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

class RankingService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
    
    async def calculate_country_rankings(self, country_code: str) -> List[Dict]:
        """Calculate rankings for channels in a specific country"""
        channels = await self.db.channels.find(
            {"country_code": country_code, "is_active": True}
        ).to_list(1000)
        
        # Sort by subscriber count
        channels.sort(key=lambda x: x.get("subscriber_count", 0), reverse=True)
        
        # Assign ranks
        for idx, channel in enumerate(channels):
            channel["rank"] = idx + 1
        
        return channels
    
    async def update_rankings(self, country_code: str) -> Dict:
        """Update rankings for a country and detect changes"""
        channels = await self.db.channels.find(
            {"country_code": country_code, "is_active": True},
            {"_id": 0}
        ).to_list(1000)
        
        if not channels:
            return {"updated": 0, "changes": []}
        
        # Sort by subscriber count
        channels.sort(key=lambda x: x.get("subscriber_count", 0), reverse=True)
        
        changes = []
        now = datetime.now(timezone.utc).isoformat()
        
        for idx, channel in enumerate(channels):
            new_rank = idx + 1
            old_rank = channel.get("current_rank", new_rank)
            channel_id = channel["channel_id"]
            
            if old_rank != new_rank:
                changes.append({
                    "channel_id": channel_id,
                    "channel_name": channel.get("title", ""),
                    "old_rank": old_rank,
                    "new_rank": new_rank,
                    "change": old_rank - new_rank,
                    "timestamp": now
                })
                
                # Log rank history
                await self.db.rank_history.insert_one({
                    "channel_id": channel_id,
                    "country_code": country_code,
                    "old_rank": old_rank,
                    "new_rank": new_rank,
                    "timestamp": now
                })
            
            # Update channel rank
            await self.db.channels.update_one(
                {"channel_id": channel_id},
                {
                    "$set": {
                        "current_rank": new_rank,
                        "previous_rank": old_rank,
                        "rank_updated_at": now
                    }
                }
            )
        
        return {"updated": len(channels), "changes": changes}
    
    async def get_global_top_100(self) -> List[Dict]:
        """Get all channels globally sorted by subscribers"""
        channels = await self.db.channels.find(
            {"is_active": True},
            {"_id": 0}
        ).sort("subscriber_count", -1).limit(1000).to_list(1000)
        
        for idx, channel in enumerate(channels):
            channel["global_rank"] = idx + 1
        
        return channels
    
    async def get_fastest_growing(self, limit: int = 20) -> List[Dict]:
        """Get fastest growing channels by daily growth percentage"""
        channels = await self.db.channels.find(
            {"is_active": True, "daily_growth_percent": {"$exists": True}},
            {"_id": 0}
        ).sort("daily_growth_percent", -1).limit(limit).to_list(limit)
        
        return channels
    
    async def get_biggest_gainers_24h(self, limit: int = 20) -> List[Dict]:
        """Get channels with biggest subscriber gain in 24h"""
        channels = await self.db.channels.find(
            {"is_active": True, "daily_subscriber_gain": {"$exists": True}},
            {"_id": 0}
        ).sort("daily_subscriber_gain", -1).limit(limit).to_list(limit)
        
        return channels
    
    async def get_country_leaderboard(self, country_code: str, limit: int = 50) -> List[Dict]:
        """Get leaderboard for a specific country"""
        channels = await self.db.channels.find(
            {"country_code": country_code, "is_active": True},
            {"_id": 0}
        ).sort("subscriber_count", -1).limit(limit).to_list(limit)
        
        for idx, channel in enumerate(channels):
            channel["rank"] = idx + 1
        
        return channels
    
    async def get_rank_history(self, channel_id: str, days: int = 30) -> List[Dict]:
        """Get ranking history for a channel"""
        from datetime import timedelta
        
        start_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        
        history = await self.db.rank_history.find(
            {"channel_id": channel_id, "timestamp": {"$gte": start_date}},
            {"_id": 0}
        ).sort("timestamp", 1).to_list(1000)
        
        return history
    
    async def get_recent_ranking_changes(self, limit: int = 20) -> List[Dict]:
        """Get most recent ranking changes across all countries"""
        changes = await self.db.rank_history.find(
            {},
            {"_id": 0}
        ).sort("timestamp", -1).limit(limit).to_list(limit)
        
        return changes
    
    async def update_all_rankings(self) -> Dict:
        """Update rankings for all countries"""
        countries = await self.db.countries.find({}, {"code": 1}).to_list(300)
        
        total_updated = 0
        total_changes = []
        
        for country in countries:
            result = await self.update_rankings(country["code"])
            total_updated += result.get("updated", 0)
            total_changes.extend(result.get("changes", []))
        
        logger.info(f"Updated rankings for {len(countries)} countries, {total_updated} channels")
        return {"countries": len(countries), "channels_updated": total_updated, "changes": len(total_changes)}


def get_ranking_service(db: AsyncIOMotorDatabase) -> RankingService:
    return RankingService(db)
