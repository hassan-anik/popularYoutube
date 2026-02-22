"""
Test cases for TopTube World Pro - Iteration 3
Tests background scheduler status, sitemap generation, and new AdSense essential pages endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndScheduler:
    """Tests for health check and background scheduler"""
    
    def test_health_check(self):
        """Test that API health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        print(f"✓ Health check passed: {data}")
    
    def test_scheduler_status_endpoint(self):
        """Test that scheduler status endpoint returns scheduler information"""
        response = requests.get(f"{BASE_URL}/api/scheduler/status")
        assert response.status_code == 200
        data = response.json()
        
        # Verify scheduler is running
        assert data["is_running"] == True, "Scheduler should be running"
        assert "is_refreshing" in data
        assert "is_ranking" in data
        
        print(f"✓ Scheduler status: running={data['is_running']}")
    
    def test_scheduler_has_three_jobs(self):
        """Test that scheduler has exactly 3 background jobs configured"""
        response = requests.get(f"{BASE_URL}/api/scheduler/status")
        assert response.status_code == 200
        data = response.json()
        
        jobs = data.get("jobs", [])
        assert len(jobs) == 3, f"Expected 3 jobs, found {len(jobs)}"
        
        # Verify job IDs
        job_ids = [job["id"] for job in jobs]
        assert "refresh_channels" in job_ids, "Missing refresh_channels job"
        assert "update_rankings" in job_ids, "Missing update_rankings job"
        assert "calculate_growth" in job_ids, "Missing calculate_growth job"
        
        print(f"✓ Scheduler has 3 jobs: {job_ids}")
    
    def test_scheduler_job_intervals(self):
        """Test that scheduler jobs have correct intervals"""
        response = requests.get(f"{BASE_URL}/api/scheduler/status")
        assert response.status_code == 200
        data = response.json()
        
        jobs = {job["id"]: job for job in data.get("jobs", [])}
        
        # Check refresh_channels - should be 6 hours
        assert "6:00:00" in jobs["refresh_channels"]["trigger"], "refresh_channels should be 6 hour interval"
        
        # Check update_rankings - should be 10 minutes
        assert "0:10:00" in jobs["update_rankings"]["trigger"], "update_rankings should be 10 minute interval"
        
        # Check calculate_growth - should be 1 hour
        assert "1:00:00" in jobs["calculate_growth"]["trigger"], "calculate_growth should be 1 hour interval"
        
        print("✓ All scheduler job intervals are correct")
    
    def test_scheduler_jobs_have_next_run_time(self):
        """Test that all scheduler jobs have scheduled next_run time"""
        response = requests.get(f"{BASE_URL}/api/scheduler/status")
        assert response.status_code == 200
        data = response.json()
        
        for job in data.get("jobs", []):
            assert job.get("next_run") is not None, f"Job {job['id']} should have next_run time"
            print(f"✓ Job {job['id']} next run: {job['next_run']}")


class TestSitemap:
    """Tests for XML sitemap generation"""
    
    def test_sitemap_returns_xml(self):
        """Test that sitemap endpoint returns valid XML"""
        response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        assert response.status_code == 200
        
        # Check content type is XML
        content_type = response.headers.get("content-type", "")
        assert "xml" in content_type.lower() or "text/plain" in content_type.lower(), f"Expected XML content type, got {content_type}"
        
        # Check XML structure
        content = response.text
        assert content.startswith('<?xml version="1.0"'), "Should start with XML declaration"
        assert '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' in content
        assert '</urlset>' in content
        
        print("✓ Sitemap returns valid XML structure")
    
    def test_sitemap_has_300_plus_urls(self):
        """Test that sitemap contains 300+ URLs"""
        response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        assert response.status_code == 200
        
        url_count = response.text.count("<url>")
        assert url_count >= 300, f"Expected 300+ URLs, found {url_count}"
        
        print(f"✓ Sitemap contains {url_count} URLs (requirement: 300+)")
    
    def test_sitemap_contains_static_pages(self):
        """Test that sitemap contains all static pages"""
        response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        assert response.status_code == 200
        content = response.text
        
        required_pages = ["/", "/leaderboard", "/countries", "/trending", "/about", "/privacy", "/terms", "/contact"]
        
        for page in required_pages:
            if page == "/":
                # Check for homepage
                assert f"<loc>{BASE_URL}/</loc>" in content or f"<loc>{BASE_URL}</loc>" in content, f"Missing homepage in sitemap"
            else:
                assert f"<loc>{BASE_URL}{page}</loc>" in content, f"Missing {page} in sitemap"
        
        print(f"✓ Sitemap contains all {len(required_pages)} static pages")
    
    def test_sitemap_contains_country_pages(self):
        """Test that sitemap contains country pages"""
        response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        assert response.status_code == 200
        content = response.text
        
        country_count = content.count("/country/")
        assert country_count >= 10, f"Expected at least 10 country pages, found {country_count}"
        
        # Check specific countries
        assert "/country/US" in content, "Missing US country page"
        assert "/country/IN" in content, "Missing IN country page"
        
        print(f"✓ Sitemap contains {country_count} country pages")
    
    def test_sitemap_contains_channel_pages(self):
        """Test that sitemap contains channel pages"""
        response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        assert response.status_code == 200
        content = response.text
        
        channel_count = content.count("/channel/")
        assert channel_count >= 50, f"Expected at least 50 channel pages, found {channel_count}"
        
        print(f"✓ Sitemap contains {channel_count} channel pages")


class TestAdminStats:
    """Tests for admin statistics endpoint"""
    
    def test_admin_stats_endpoint(self):
        """Test that admin stats endpoint returns correct data structure"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        data = response.json()
        
        assert "total_countries" in data
        assert "total_channels" in data
        assert "total_stats_records" in data
        assert "last_update" in data
        
        assert data["total_countries"] > 0, "Should have countries"
        assert data["total_channels"] > 0, "Should have channels"
        
        print(f"✓ Admin stats: {data['total_countries']} countries, {data['total_channels']} channels")


class TestLeaderboardEndpoints:
    """Tests for leaderboard endpoints"""
    
    def test_global_leaderboard(self):
        """Test global leaderboard endpoint"""
        response = requests.get(f"{BASE_URL}/api/leaderboard/global?limit=10")
        assert response.status_code == 200
        data = response.json()
        
        assert "channels" in data
        assert len(data["channels"]) > 0
        
        # Verify channel data structure
        channel = data["channels"][0]
        assert "channel_id" in channel
        assert "title" in channel
        assert "subscriber_count" in channel
        
        print(f"✓ Global leaderboard returns {len(data['channels'])} channels")
    
    def test_fastest_growing(self):
        """Test fastest growing channels endpoint"""
        response = requests.get(f"{BASE_URL}/api/leaderboard/fastest-growing?limit=5")
        assert response.status_code == 200
        data = response.json()
        
        assert "channels" in data
        print(f"✓ Fastest growing endpoint returns {len(data.get('channels', []))} channels")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
