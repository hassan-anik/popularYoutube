"""
YouTube Service - Handles all YouTube Data API v3 interactions using direct HTTP requests
"""
import os
import logging
import aiohttp
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"

class YouTubeService:
    def __init__(self):
        self.api_key = os.environ.get('YOUTUBE_API_KEY')
        self._cache = {}
        self._cache_ttl = 300  # 5 minutes cache
    
    def _get_cache_key(self, prefix: str, identifier: str) -> str:
        return f"{prefix}:{identifier}"
    
    def _is_cache_valid(self, cache_key: str) -> bool:
        if cache_key not in self._cache:
            return False
        cached_time = self._cache[cache_key].get('timestamp')
        if cached_time is None:
            return False
        age = (datetime.now(timezone.utc) - cached_time).total_seconds()
        return age < self._cache_ttl
    
    def _set_cache(self, cache_key: str, data: Any):
        self._cache[cache_key] = {
            'data': data,
            'timestamp': datetime.now(timezone.utc)
        }
    
    def _get_cached(self, cache_key: str) -> Optional[Any]:
        if self._is_cache_valid(cache_key):
            return self._cache[cache_key]['data']
        return None

    async def get_channel_stats(self, channel_id: str) -> Optional[Dict]:
        """Fetch channel statistics from YouTube API"""
        cache_key = self._get_cache_key('channel_stats', channel_id)
        cached = self._get_cached(cache_key)
        if cached:
            logger.info(f"Cache hit for channel {channel_id}")
            return cached
        
        try:
            url = f"{YOUTUBE_API_BASE}/channels"
            params = {
                "key": self.api_key,
                "part": "statistics,snippet,contentDetails",
                "id": channel_id
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"YouTube API error: {response.status} - {error_text}")
                        if "quotaExceeded" in error_text:
                            raise Exception("YouTube API quota exceeded")
                        raise Exception(f"YouTube API error: {response.status}")
                    
                    data = await response.json()
            
            if not data.get("items"):
                logger.warning(f"Channel not found: {channel_id}")
                return None
            
            item = data["items"][0]
            stats = item.get("statistics", {})
            snippet = item.get("snippet", {})
            
            channel_data = {
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
                "hidden_subscriber_count": stats.get("hiddenSubscriberCount", False),
                "fetched_at": datetime.now(timezone.utc).isoformat()
            }
            
            self._set_cache(cache_key, channel_data)
            return channel_data
            
        except aiohttp.ClientError as e:
            logger.error(f"HTTP error fetching channel stats: {str(e)}")
            raise Exception(f"Network error: {str(e)}")
        except Exception as e:
            logger.error(f"Error fetching channel stats: {str(e)}")
            raise

    async def get_batch_channel_stats(self, channel_ids: List[str]) -> List[Dict]:
        """Fetch multiple channel statistics in batch (up to 50 per request)"""
        results = []
        chunk_size = 50
        
        for i in range(0, len(channel_ids), chunk_size):
            chunk = channel_ids[i:i + chunk_size]
            
            # Check cache first
            cached_results = []
            uncached_ids = []
            
            for cid in chunk:
                cache_key = self._get_cache_key('channel_stats', cid)
                cached = self._get_cached(cache_key)
                if cached:
                    cached_results.append(cached)
                else:
                    uncached_ids.append(cid)
            
            results.extend(cached_results)
            
            if not uncached_ids:
                continue
            
            try:
                url = f"{YOUTUBE_API_BASE}/channels"
                params = {
                    "key": self.api_key,
                    "part": "statistics,snippet",
                    "id": ",".join(uncached_ids)
                }
                
                async with aiohttp.ClientSession() as session:
                    async with session.get(url, params=params) as response:
                        if response.status != 200:
                            error_text = await response.text()
                            logger.error(f"YouTube API batch error: {error_text}")
                            continue
                        
                        data = await response.json()
                
                for item in data.get("items", []):
                    stats = item.get("statistics", {})
                    snippet = item.get("snippet", {})
                    
                    channel_data = {
                        "channel_id": item["id"],
                        "title": snippet.get("title", ""),
                        "description": snippet.get("description", ""),
                        "custom_url": snippet.get("customUrl", ""),
                        "country": snippet.get("country", ""),
                        "published_at": snippet.get("publishedAt", ""),
                        "thumbnail_url": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
                        "subscriber_count": int(stats.get("subscriberCount", 0)),
                        "view_count": int(stats.get("viewCount", 0)),
                        "video_count": int(stats.get("videoCount", 0)),
                        "hidden_subscriber_count": stats.get("hiddenSubscriberCount", False),
                        "fetched_at": datetime.now(timezone.utc).isoformat()
                    }
                    
                    cache_key = self._get_cache_key('channel_stats', item["id"])
                    self._set_cache(cache_key, channel_data)
                    results.append(channel_data)
                    
            except Exception as e:
                logger.error(f"Batch processing error for chunk {i}: {e}")
                continue
        
        return results

    async def get_channel_top_videos(self, channel_id: str, max_results: int = 5) -> List[Dict]:
        """Fetch top videos for a channel sorted by view count"""
        cache_key = self._get_cache_key('top_videos', channel_id)
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        try:
            # First get the uploads playlist ID
            url = f"{YOUTUBE_API_BASE}/channels"
            params = {
                "key": self.api_key,
                "part": "contentDetails",
                "id": channel_id
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status != 200:
                        return []
                    channel_data = await response.json()
            
            if not channel_data.get("items"):
                return []
            
            uploads_playlist_id = channel_data["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]
            
            # Get videos from uploads playlist
            url = f"{YOUTUBE_API_BASE}/playlistItems"
            params = {
                "key": self.api_key,
                "part": "contentDetails",
                "playlistId": uploads_playlist_id,
                "maxResults": 50
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status != 200:
                        return []
                    playlist_data = await response.json()
            
            video_ids = [item["contentDetails"]["videoId"] for item in playlist_data.get("items", [])]
            
            if not video_ids:
                return []
            
            # Get video statistics
            url = f"{YOUTUBE_API_BASE}/videos"
            params = {
                "key": self.api_key,
                "part": "snippet,statistics",
                "id": ",".join(video_ids[:50])
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status != 200:
                        return []
                    videos_data = await response.json()
            
            videos = []
            for item in videos_data.get("items", []):
                stats = item.get("statistics", {})
                snippet = item.get("snippet", {})
                
                videos.append({
                    "video_id": item["id"],
                    "title": snippet.get("title", ""),
                    "description": snippet.get("description", "")[:200],
                    "thumbnail_url": snippet.get("thumbnails", {}).get("medium", {}).get("url", ""),
                    "published_at": snippet.get("publishedAt", ""),
                    "view_count": int(stats.get("viewCount", 0)),
                    "like_count": int(stats.get("likeCount", 0)),
                    "comment_count": int(stats.get("commentCount", 0))
                })
            
            # Sort by view count and return top N
            videos.sort(key=lambda x: x["view_count"], reverse=True)
            result = videos[:max_results]
            
            self._set_cache(cache_key, result)
            return result
            
        except Exception as e:
            logger.error(f"Error fetching top videos: {str(e)}")
            return []

    async def search_channels(self, query: str, region_code: str = "", max_results: int = 10) -> List[Dict]:
        """Search for channels"""
        try:
            url = f"{YOUTUBE_API_BASE}/search"
            params = {
                "key": self.api_key,
                "part": "snippet",
                "q": query,
                "type": "channel",
                "maxResults": max_results
            }
            
            if region_code:
                params["regionCode"] = region_code
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"YouTube search error: {error_text}")
                        raise Exception(f"YouTube API error: {response.status}")
                    
                    data = await response.json()
            
            results = []
            for item in data.get("items", []):
                results.append({
                    "channel_id": item["id"]["channelId"],
                    "title": item["snippet"]["title"],
                    "description": item["snippet"]["description"],
                    "thumbnail_url": item["snippet"]["thumbnails"]["default"]["url"]
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching channels: {str(e)}")
            raise


# Singleton instance
youtube_service = YouTubeService()
