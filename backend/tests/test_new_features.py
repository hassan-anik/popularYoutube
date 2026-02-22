"""
Backend tests for TopTube World Pro - New Features (Iteration 6)
Tests: Search, Compare, Blog, Favorites, Real-time indicators, PWA support
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestHealthAndBasics:
    """Basic health and API tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health endpoint working")
    
    def test_admin_stats(self):
        """Test admin stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_countries" in data
        assert "total_channels" in data
        print(f"✓ Admin stats: {data['total_countries']} countries, {data['total_channels']} channels")


class TestSearchFunctionality:
    """Tests for global search feature"""
    
    def test_channels_search_returns_results(self):
        """Test search returns relevant channels"""
        response = requests.get(f"{BASE_URL}/api/channels?search=MrBeast&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "channels" in data
        assert len(data["channels"]) > 0
        # Verify returned channels match search
        for channel in data["channels"]:
            assert "MrBeast" in channel.get("title", ""), f"Channel {channel.get('title')} does not match search"
        print(f"✓ Search returned {len(data['channels'])} results for 'MrBeast'")
    
    def test_channels_search_partial_match(self):
        """Test search works with partial text"""
        response = requests.get(f"{BASE_URL}/api/channels?search=Series&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "channels" in data
        assert len(data["channels"]) > 0
        print(f"✓ Partial search returned {len(data['channels'])} results")
    
    def test_channels_search_case_insensitive(self):
        """Test search is case insensitive"""
        response1 = requests.get(f"{BASE_URL}/api/channels?search=pewdiepie&limit=5")
        response2 = requests.get(f"{BASE_URL}/api/channels?search=PewDiePie&limit=5")
        assert response1.status_code == 200
        assert response2.status_code == 200
        # Both should return results
        data1 = response1.json()
        data2 = response2.json()
        assert len(data1["channels"]) == len(data2["channels"])
        print("✓ Search is case insensitive")
    
    def test_channels_search_no_results(self):
        """Test search with no matching results"""
        response = requests.get(f"{BASE_URL}/api/channels?search=xyznonexistent123&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "channels" in data
        assert len(data["channels"]) == 0
        print("✓ Search correctly returns empty for no matches")


class TestCompareFeature:
    """Tests for channel comparison feature"""
    
    def test_get_single_channel_for_comparison(self):
        """Test getting channel details for comparison"""
        # First get a channel ID
        channels_resp = requests.get(f"{BASE_URL}/api/channels?limit=1")
        assert channels_resp.status_code == 200
        channel_id = channels_resp.json()["channels"][0]["channel_id"]
        
        # Get full details
        response = requests.get(f"{BASE_URL}/api/channels/{channel_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify comparison-relevant fields
        assert "subscriber_count" in data
        assert "view_count" in data
        assert "video_count" in data
        assert "daily_subscriber_gain" in data
        assert "daily_growth_percent" in data
        assert "viral_label" in data
        assert "country_name" in data
        print(f"✓ Channel data retrieved with all comparison fields: {data.get('title')}")
    
    def test_get_multiple_channels_for_comparison(self):
        """Test getting multiple channels for comparison"""
        # Get first 4 channel IDs
        channels_resp = requests.get(f"{BASE_URL}/api/channels?limit=4")
        assert channels_resp.status_code == 200
        channel_ids = [c["channel_id"] for c in channels_resp.json()["channels"]]
        
        # Fetch each channel
        comparison_data = []
        for cid in channel_ids:
            response = requests.get(f"{BASE_URL}/api/channels/{cid}")
            assert response.status_code == 200
            comparison_data.append(response.json())
        
        assert len(comparison_data) == 4
        print(f"✓ Retrieved {len(comparison_data)} channels for comparison")


class TestPWASupport:
    """Tests for PWA manifest and service worker"""
    
    def test_manifest_json_accessible(self):
        """Test manifest.json is accessible"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        assert response.status_code == 200
        data = response.json()
        
        # Verify required PWA fields
        assert "name" in data
        assert "short_name" in data
        assert "icons" in data
        assert "start_url" in data
        assert "display" in data
        assert data["display"] == "standalone"
        
        # Verify icons
        assert len(data["icons"]) >= 2
        print(f"✓ PWA manifest accessible: {data['name']}")
    
    def test_service_worker_accessible(self):
        """Test service worker file is accessible"""
        response = requests.get(f"{BASE_URL}/sw.js")
        assert response.status_code == 200
        content = response.text
        
        # Verify SW content
        assert "CACHE_NAME" in content
        assert "self.addEventListener" in content
        assert "install" in content
        assert "activate" in content
        assert "fetch" in content
        print("✓ Service worker accessible and has correct structure")


class TestLeaderboardWithAds:
    """Tests for leaderboard with in-feed ads"""
    
    def test_leaderboard_returns_channels(self):
        """Test global leaderboard returns ranked channels"""
        response = requests.get(f"{BASE_URL}/api/leaderboard/global?limit=50")
        assert response.status_code == 200
        data = response.json()
        
        assert "channels" in data
        assert len(data["channels"]) > 0
        
        # Verify channels are sorted by subscriber count
        prev_subs = float('inf')
        for channel in data["channels"][:10]:
            assert channel["subscriber_count"] <= prev_subs
            prev_subs = channel["subscriber_count"]
        
        print(f"✓ Leaderboard returned {len(data['channels'])} channels, properly sorted")
    
    def test_leaderboard_has_all_required_fields(self):
        """Test leaderboard channels have fields needed for UI"""
        response = requests.get(f"{BASE_URL}/api/leaderboard/global?limit=5")
        assert response.status_code == 200
        data = response.json()
        
        for channel in data["channels"]:
            # Fields needed for display
            assert "channel_id" in channel
            assert "title" in channel
            assert "thumbnail_url" in channel
            assert "subscriber_count" in channel
            assert "country_name" in channel
            # Fields for viral badge
            assert "viral_label" in channel
            # Fields for growth display
            assert "daily_subscriber_gain" in channel
        
        print("✓ Leaderboard channels have all required fields")


class TestChannelDetailPage:
    """Tests for channel detail page features"""
    
    def test_channel_has_real_time_fields(self):
        """Test channel has fields for real-time indicators"""
        channels_resp = requests.get(f"{BASE_URL}/api/channels?limit=1")
        channel_id = channels_resp.json()["channels"][0]["channel_id"]
        
        response = requests.get(f"{BASE_URL}/api/channels/{channel_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Updated timestamp for "Last Updated" indicator
        assert "updated_at" in data or "rank_updated_at" in data
        
        # Growth data for live counters
        assert "subscriber_count" in data
        assert "view_count" in data
        assert "video_count" in data
        
        print("✓ Channel has real-time indicator fields")
    
    def test_channel_has_growth_history(self):
        """Test channel returns growth history for charts"""
        channels_resp = requests.get(f"{BASE_URL}/api/channels?limit=1")
        channel_id = channels_resp.json()["channels"][0]["channel_id"]
        
        response = requests.get(f"{BASE_URL}/api/channels/{channel_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Growth history for chart
        assert "growth_history" in data
        print(f"✓ Channel has growth_history field with {len(data.get('growth_history', []))} data points")
    
    def test_channel_has_viral_prediction(self):
        """Test channel returns viral prediction data"""
        channels_resp = requests.get(f"{BASE_URL}/api/channels?limit=1")
        channel_id = channels_resp.json()["channels"][0]["channel_id"]
        
        response = requests.get(f"{BASE_URL}/api/channels/{channel_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Viral prediction data
        assert "viral_prediction" in data or "viral_label" in data
        print("✓ Channel has viral prediction data")


class TestNewsletterEndpoint:
    """Tests for newsletter subscription"""
    
    def test_newsletter_subscribe_new_email(self):
        """Test subscribing with new email"""
        import uuid
        test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        
        response = requests.post(
            f"{BASE_URL}/api/newsletter/subscribe",
            json={"email": test_email}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        print(f"✓ Newsletter subscription works for new email: {test_email}")
    
    def test_newsletter_subscribe_duplicate(self):
        """Test duplicate subscription returns error"""
        test_email = "duplicate_test_email@example.com"
        
        # First subscription
        requests.post(f"{BASE_URL}/api/newsletter/subscribe", json={"email": test_email})
        
        # Second subscription should fail
        response = requests.post(
            f"{BASE_URL}/api/newsletter/subscribe",
            json={"email": test_email}
        )
        assert response.status_code == 400
        print("✓ Duplicate subscription correctly rejected")


class TestMapData:
    """Tests for map visualization data"""
    
    def test_map_data_returns_countries(self):
        """Test map data endpoint returns country info"""
        response = requests.get(f"{BASE_URL}/api/stats/map-data")
        assert response.status_code == 200
        data = response.json()
        
        assert "map_data" in data
        assert len(data["map_data"]) > 0
        
        # Verify structure
        sample = data["map_data"][0]
        assert "country_code" in sample
        assert "country_name" in sample
        assert "top_channel" in sample
        
        print(f"✓ Map data returned {len(data['map_data'])} countries with top channels")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
