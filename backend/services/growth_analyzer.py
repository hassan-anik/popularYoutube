"""
Growth Analyzer Service - Calculates growth metrics and predictions
"""
import logging
from typing import List, Dict, Optional
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

class GrowthAnalyzer:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
    
    async def calculate_daily_growth(self, channel_id: str) -> Dict:
        """Calculate daily subscriber growth for a channel"""
        now = datetime.now(timezone.utc)
        yesterday = now - timedelta(days=1)
        
        # Get stats from 24 hours ago
        old_stats = await self.db.channel_stats.find_one(
            {
                "channel_id": channel_id,
                "timestamp": {"$lte": yesterday.isoformat()}
            },
            {"_id": 0},
            sort=[("timestamp", -1)]
        )
        
        # Get current stats
        current_stats = await self.db.channel_stats.find_one(
            {"channel_id": channel_id},
            {"_id": 0},
            sort=[("timestamp", -1)]
        )
        
        if not current_stats:
            return {"daily_gain": 0, "daily_percent": 0}
        
        current_subs = current_stats.get("subscriber_count", 0)
        
        if old_stats:
            old_subs = old_stats.get("subscriber_count", 0)
            daily_gain = current_subs - old_subs
            daily_percent = (daily_gain / old_subs * 100) if old_subs > 0 else 0
        else:
            daily_gain = 0
            daily_percent = 0
        
        return {
            "daily_gain": daily_gain,
            "daily_percent": round(daily_percent, 4)
        }
    
    async def calculate_weekly_growth(self, channel_id: str) -> Dict:
        """Calculate 7-day growth for a channel"""
        now = datetime.now(timezone.utc)
        week_ago = now - timedelta(days=7)
        
        old_stats = await self.db.channel_stats.find_one(
            {
                "channel_id": channel_id,
                "timestamp": {"$lte": week_ago.isoformat()}
            },
            {"_id": 0},
            sort=[("timestamp", -1)]
        )
        
        current_stats = await self.db.channel_stats.find_one(
            {"channel_id": channel_id},
            {"_id": 0},
            sort=[("timestamp", -1)]
        )
        
        if not current_stats:
            return {"weekly_gain": 0, "weekly_percent": 0}
        
        current_subs = current_stats.get("subscriber_count", 0)
        
        if old_stats:
            old_subs = old_stats.get("subscriber_count", 0)
            weekly_gain = current_subs - old_subs
            weekly_percent = (weekly_gain / old_subs * 100) if old_subs > 0 else 0
        else:
            weekly_gain = 0
            weekly_percent = 0
        
        return {
            "weekly_gain": weekly_gain,
            "weekly_percent": round(weekly_percent, 4)
        }
    
    async def calculate_monthly_growth(self, channel_id: str) -> Dict:
        """Calculate 30-day growth for a channel"""
        now = datetime.now(timezone.utc)
        month_ago = now - timedelta(days=30)
        
        old_stats = await self.db.channel_stats.find_one(
            {
                "channel_id": channel_id,
                "timestamp": {"$lte": month_ago.isoformat()}
            },
            {"_id": 0},
            sort=[("timestamp", -1)]
        )
        
        current_stats = await self.db.channel_stats.find_one(
            {"channel_id": channel_id},
            {"_id": 0},
            sort=[("timestamp", -1)]
        )
        
        if not current_stats:
            return {"monthly_gain": 0, "monthly_percent": 0}
        
        current_subs = current_stats.get("subscriber_count", 0)
        
        if old_stats:
            old_subs = old_stats.get("subscriber_count", 0)
            monthly_gain = current_subs - old_subs
            monthly_percent = (monthly_gain / old_subs * 100) if old_subs > 0 else 0
        else:
            monthly_gain = 0
            monthly_percent = 0
        
        return {
            "monthly_gain": monthly_gain,
            "monthly_percent": round(monthly_percent, 4)
        }
    
    async def get_growth_history(self, channel_id: str, days: int = 30) -> List[Dict]:
        """Get historical subscriber counts for charting"""
        start_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        
        stats = await self.db.channel_stats.find(
            {
                "channel_id": channel_id,
                "timestamp": {"$gte": start_date}
            },
            {"_id": 0}
        ).sort("timestamp", 1).to_list(1000)
        
        return stats
    
    async def calculate_viral_score(self, channel_id: str) -> Dict:
        """
        Calculate viral score and prediction label
        Viral Score = (daily_growth_rate × 7-day acceleration) ÷ total_subscribers
        Labels: Exploding, Rising Fast, Stable, Slowing
        """
        daily = await self.calculate_daily_growth(channel_id)
        weekly = await self.calculate_weekly_growth(channel_id)
        
        current_stats = await self.db.channel_stats.find_one(
            {"channel_id": channel_id},
            {"_id": 0},
            sort=[("timestamp", -1)]
        )
        
        if not current_stats:
            return {
                "viral_score": 0,
                "label": "Unknown",
                "color": "gray"
            }
        
        total_subs = current_stats.get("subscriber_count", 0)
        daily_rate = daily.get("daily_percent", 0)
        weekly_rate = weekly.get("weekly_percent", 0)
        
        # Calculate 7-day acceleration (is growth rate increasing?)
        acceleration = weekly_rate / 7 if weekly_rate else 0
        
        # Viral score calculation
        if total_subs > 0:
            viral_score = (daily_rate * acceleration) / (total_subs / 1000000)
        else:
            viral_score = 0
        
        # Normalize viral score
        viral_score = min(max(viral_score, 0), 100)
        
        # Determine label based on metrics
        if daily_rate > 1 or (daily_rate > 0.5 and weekly_rate > 5):
            label = "Exploding"
            color = "red"
        elif daily_rate > 0.3 or weekly_rate > 3:
            label = "Rising Fast"
            color = "green"
        elif daily_rate >= 0 and weekly_rate >= 0:
            label = "Stable"
            color = "blue"
        else:
            label = "Slowing"
            color = "yellow"
        
        return {
            "viral_score": round(viral_score, 2),
            "label": label,
            "color": color,
            "daily_growth_rate": daily_rate,
            "weekly_growth_rate": weekly_rate,
            "acceleration": round(acceleration, 4)
        }
    
    async def predict_overtake_time(self, channel_id: str, target_channel_id: str) -> Optional[Dict]:
        """Predict when a channel might overtake another based on growth rates"""
        channel_stats = await self.db.channels.find_one(
            {"channel_id": channel_id},
            {"_id": 0}
        )
        target_stats = await self.db.channels.find_one(
            {"channel_id": target_channel_id},
            {"_id": 0}
        )
        
        if not channel_stats or not target_stats:
            return None
        
        channel_subs = channel_stats.get("subscriber_count", 0)
        target_subs = target_stats.get("subscriber_count", 0)
        
        if channel_subs >= target_subs:
            return {"already_ahead": True}
        
        channel_daily_gain = channel_stats.get("daily_subscriber_gain", 0)
        target_daily_gain = target_stats.get("daily_subscriber_gain", 0)
        
        # If not gaining faster than target, will never overtake
        gap_closure_rate = channel_daily_gain - target_daily_gain
        if gap_closure_rate <= 0:
            return {"will_overtake": False, "reason": "Not growing faster than target"}
        
        subscriber_gap = target_subs - channel_subs
        days_to_overtake = subscriber_gap / gap_closure_rate
        
        overtake_date = datetime.now(timezone.utc) + timedelta(days=days_to_overtake)
        
        return {
            "will_overtake": True,
            "days_to_overtake": round(days_to_overtake),
            "predicted_date": overtake_date.strftime("%Y-%m-%d"),
            "current_gap": subscriber_gap,
            "daily_gap_closure": gap_closure_rate
        }
    
    async def update_channel_growth_metrics(self, channel_id: str) -> Dict:
        """Update all growth metrics for a channel"""
        daily = await self.calculate_daily_growth(channel_id)
        weekly = await self.calculate_weekly_growth(channel_id)
        monthly = await self.calculate_monthly_growth(channel_id)
        viral = await self.calculate_viral_score(channel_id)
        
        update_data = {
            "daily_subscriber_gain": daily.get("daily_gain", 0),
            "daily_growth_percent": daily.get("daily_percent", 0),
            "weekly_subscriber_gain": weekly.get("weekly_gain", 0),
            "weekly_growth_percent": weekly.get("weekly_percent", 0),
            "monthly_subscriber_gain": monthly.get("monthly_gain", 0),
            "monthly_growth_percent": monthly.get("monthly_percent", 0),
            "viral_score": viral.get("viral_score", 0),
            "viral_label": viral.get("label", "Unknown"),
            "metrics_updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await self.db.channels.update_one(
            {"channel_id": channel_id},
            {"$set": update_data}
        )
        
        return update_data


def get_growth_analyzer(db: AsyncIOMotorDatabase) -> GrowthAnalyzer:
    return GrowthAnalyzer(db)
