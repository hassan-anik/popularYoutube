"""
YouTube Service - Handles all YouTube Data API v3 interactions
"""
import os
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import asyncio

logger = logging.getLogger(__name__)

YOUTUBE_API_SERVICE_NAME = "youtube"
YOUTUBE_API_VERSION = "v3"

class YouTubeService:
    def __init__(self):
        self.api_key = os.environ.get('YOUTUBE_API_KEY')
        self._service = None
        self._cache = {}
        self._cache_ttl = 300  # 5 minutes cache
    
    def _get_service(self):
        if self._service is None:
            self._service = build(
                YOUTUBE_API_SERVICE_NAME,
                YOUTUBE_API_VERSION,
                developerKey=self.api_key,
                cache_discovery=False
            )
        return self._service
    
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
            service = self._get_service()
            request = service.channels().list(
                part="statistics,snippet,contentDetails,brandingSettings",
                id=channel_id
            )
            response = await asyncio.get_event_loop().run_in_executor(None, request.execute)
            
            if not response.get("items"):
                logger.warning(f"Channel not found: {channel_id}")
                return None
            
            item = response["items"][0]
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
            
        except HttpError as e:
            error_content = e.content.decode('utf-8') if e.content else str(e)
            if "quotaExceeded" in error_content:
                logger.error("YouTube API quota exceeded")
                raise Exception("YouTube API quota exceeded")
            elif "keyInvalid" in error_content:
                logger.error("Invalid YouTube API key")
                raise Exception("Invalid YouTube API key")
            else:
                logger.error(f"YouTube API error: {error_content}")
                raise Exception(f"YouTube API error: {str(e)}")
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
                service = self._get_service()
                request = service.channels().list(
                    part="statistics,snippet,contentDetails",
                    id=",".join(uncached_ids)
                )
                response = await asyncio.get_event_loop().run_in_executor(None, request.execute)
                
                for item in response.get("items", []):
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
                    
            except HttpError as e:
                error_content = e.content.decode('utf-8') if e.content else str(e)
                logger.error(f"Batch processing error: {error_content}")
                raise
        
        return results

    async def get_channel_top_videos(self, channel_id: str, max_results: int = 5) -> List[Dict]:
        """Fetch top videos for a channel sorted by view count"""
        cache_key = self._get_cache_key('top_videos', channel_id)
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        try:
            service = self._get_service()
            
            # First get the uploads playlist ID
            channel_request = service.channels().list(
                part="contentDetails",
                id=channel_id
            )
            channel_response = await asyncio.get_event_loop().run_in_executor(None, channel_request.execute)
            
            if not channel_response.get("items"):
                return []
            
            uploads_playlist_id = channel_response["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]
            
            # Get videos from uploads playlist
            playlist_request = service.playlistItems().list(
                part="snippet,contentDetails",
                playlistId=uploads_playlist_id,
                maxResults=50  # Get more to sort by views
            )
            playlist_response = await asyncio.get_event_loop().run_in_executor(None, playlist_request.execute)
            
            video_ids = [item["contentDetails"]["videoId"] for item in playlist_response.get("items", [])]
            
            if not video_ids:
                return []
            
            # Get video statistics
            videos_request = service.videos().list(
                part="snippet,statistics",
                id=",".join(video_ids[:50])
            )
            videos_response = await asyncio.get_event_loop().run_in_executor(None, videos_request.execute)
            
            videos = []
            for item in videos_response.get("items", []):
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
            
        except HttpError as e:
            logger.error(f"Error fetching top videos: {str(e)}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error fetching top videos: {str(e)}")
            return []

    async def search_channels(self, query: str, region_code: str = "", max_results: int = 10) -> List[Dict]:
        """Search for channels"""
        try:
            service = self._get_service()
            
            request_params = {
                "part": "snippet",
                "q": query,
                "type": "channel",
                "maxResults": max_results
            }
            
            if region_code:
                request_params["regionCode"] = region_code
            
            request = service.search().list(**request_params)
            response = await asyncio.get_event_loop().run_in_executor(None, request.execute)
            
            results = []
            for item in response.get("items", []):
                results.append({
                    "channel_id": item["id"]["channelId"],
                    "title": item["snippet"]["title"],
                    "description": item["snippet"]["description"],
                    "thumbnail_url": item["snippet"]["thumbnails"]["default"]["url"]
                })
            
            return results
            
        except HttpError as e:
            logger.error(f"Error searching channels: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error searching channels: {str(e)}")
            raise


# Singleton instance
youtube_service = YouTubeService()
