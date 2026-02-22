"""
TopTube World Pro - Final Features Test Suite
Tests: 197 countries with channels, sitemap, robots.txt, contact form, scheduler status, homepage stats
"""
import pytest
import requests
import os
import re

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndBasics:
    """Basic health and connectivity tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        print("PASS: Health endpoint working")

    def test_root_endpoint(self):
        """Test root API endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "version" in data
        print("PASS: Root API endpoint working")


class TestCountriesAndChannels:
    """Test that all 197 countries have channels"""
    
    def test_total_countries_count(self):
        """Verify 197 countries exist"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        data = response.json()
        assert data["total_countries"] == 197, f"Expected 197 countries, got {data['total_countries']}"
        print(f"PASS: Total countries = {data['total_countries']}")
    
    def test_total_channels_count(self):
        """Verify 200+ channels tracked"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        data = response.json()
        assert data["total_channels"] >= 200, f"Expected 200+ channels, got {data['total_channels']}"
        print(f"PASS: Total channels = {data['total_channels']}")
    
    def test_all_countries_have_channels(self):
        """Verify no countries have 0 channels"""
        response = requests.get(f"{BASE_URL}/api/countries")
        assert response.status_code == 200
        countries = response.json()
        
        empty_countries = [c["code"] for c in countries if c.get("channel_count", 0) == 0]
        assert len(empty_countries) == 0, f"Countries without channels: {empty_countries}"
        print(f"PASS: All {len(countries)} countries have at least 1 channel")
    
    def test_countries_have_top_channel_data(self):
        """Verify top channel data is populated for countries"""
        response = requests.get(f"{BASE_URL}/api/countries")
        assert response.status_code == 200
        countries = response.json()
        
        # Sample check for top 10 countries
        for country in countries[:10]:
            assert "top_channel" in country, f"Missing top_channel for {country['code']}"
            if country["channel_count"] > 0:
                assert country["top_channel"] is not None, f"top_channel is None for {country['code']}"
        print("PASS: Countries have top_channel data")


class TestSitemap:
    """Sitemap.xml tests - verify 400+ URLs"""
    
    def test_sitemap_exists(self):
        """Test sitemap.xml endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        assert response.status_code == 200
        assert "xml" in response.headers.get("content-type", "").lower()
        print("PASS: Sitemap.xml endpoint exists")
    
    def test_sitemap_valid_xml(self):
        """Test sitemap is valid XML format"""
        response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        content = response.text
        assert '<?xml version="1.0" encoding="UTF-8"?>' in content
        assert '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' in content
        assert '</urlset>' in content
        print("PASS: Sitemap is valid XML format")
    
    def test_sitemap_url_count(self):
        """Test sitemap has 400+ URLs"""
        response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        content = response.text
        url_count = content.count("<url>")
        assert url_count >= 400, f"Expected 400+ URLs, got {url_count}"
        print(f"PASS: Sitemap has {url_count} URLs (>= 400 required)")
    
    def test_sitemap_contains_static_pages(self):
        """Test sitemap contains all static pages"""
        response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        content = response.text
        
        required_pages = ["/leaderboard", "/countries", "/trending", "/about", "/privacy", "/terms", "/contact"]
        for page in required_pages:
            assert page in content, f"Missing static page: {page}"
        print("PASS: Sitemap contains all static pages")
    
    def test_sitemap_contains_country_pages(self):
        """Test sitemap contains country pages"""
        response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        content = response.text
        
        # Check for sample country pages
        country_codes = ["US", "IN", "BR", "JP", "GB", "DE"]
        for code in country_codes:
            assert f"/country/{code}" in content, f"Missing country page: {code}"
        print("PASS: Sitemap contains country pages")


class TestRobotsTxt:
    """Robots.txt tests"""
    
    def test_robots_txt_exists(self):
        """Test robots.txt exists at root"""
        response = requests.get(f"{BASE_URL}/robots.txt")
        assert response.status_code == 200
        print("PASS: robots.txt exists")
    
    def test_robots_txt_content(self):
        """Test robots.txt has required directives"""
        response = requests.get(f"{BASE_URL}/robots.txt")
        content = response.text
        
        assert "User-agent:" in content
        assert "Sitemap:" in content
        assert "sitemap.xml" in content.lower()
        print("PASS: robots.txt has required directives")


class TestContactForm:
    """Contact form API tests"""
    
    def test_contact_form_success(self):
        """Test contact form submission succeeds"""
        payload = {
            "name": "TEST_User",
            "email": "test@example.com",
            "subject": "Test Subject",
            "message": "This is a test message for testing purposes."
        }
        response = requests.post(f"{BASE_URL}/api/contact", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "message" in data
        print("PASS: Contact form submission successful")
    
    def test_contact_form_validation(self):
        """Test contact form validates required fields"""
        # Missing required fields
        payload = {"name": "Test"}  # Missing email, subject, message
        response = requests.post(f"{BASE_URL}/api/contact", json=payload)
        assert response.status_code == 422  # Validation error
        print("PASS: Contact form validates required fields")


class TestScheduler:
    """Background scheduler status tests"""
    
    def test_scheduler_status_endpoint(self):
        """Test scheduler status endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/scheduler/status")
        assert response.status_code == 200
        data = response.json()
        assert "is_running" in data
        print("PASS: Scheduler status endpoint exists")
    
    def test_scheduler_is_running(self):
        """Test scheduler is running"""
        response = requests.get(f"{BASE_URL}/api/scheduler/status")
        data = response.json()
        assert data["is_running"] == True, "Scheduler is not running"
        print("PASS: Scheduler is running")
    
    def test_scheduler_has_three_jobs(self):
        """Test scheduler has 3 jobs configured"""
        response = requests.get(f"{BASE_URL}/api/scheduler/status")
        data = response.json()
        
        assert "jobs" in data
        jobs = data["jobs"]
        assert len(jobs) == 3, f"Expected 3 jobs, got {len(jobs)}"
        
        job_ids = [j["id"] for j in jobs]
        assert "refresh_channels" in job_ids, "Missing refresh_channels job"
        assert "update_rankings" in job_ids, "Missing update_rankings job"
        assert "calculate_growth" in job_ids, "Missing calculate_growth job"
        print(f"PASS: Scheduler has 3 jobs: {job_ids}")


class TestLeaderboard:
    """Global leaderboard tests"""
    
    def test_global_leaderboard(self):
        """Test global leaderboard endpoint"""
        response = requests.get(f"{BASE_URL}/api/leaderboard/global")
        assert response.status_code == 200
        data = response.json()
        assert "channels" in data
        assert len(data["channels"]) > 0
        print(f"PASS: Global leaderboard has {len(data['channels'])} channels")
    
    def test_country_leaderboard(self):
        """Test country leaderboard endpoint"""
        response = requests.get(f"{BASE_URL}/api/leaderboard/country/US")
        assert response.status_code == 200
        data = response.json()
        assert "channels" in data
        assert "country" in data
        print("PASS: Country leaderboard working")


class TestMapData:
    """Map data for homepage visualization"""
    
    def test_map_data_endpoint(self):
        """Test map data endpoint returns data"""
        response = requests.get(f"{BASE_URL}/api/stats/map-data")
        assert response.status_code == 200
        data = response.json()
        assert "map_data" in data
        assert len(data["map_data"]) > 0
        print(f"PASS: Map data has {len(data['map_data'])} countries with channels")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
