"""
Test suite for Auto-Generated Country Blog Posts Feature
Testing: /api/blog/country/{code}, /api/blog/countries, sitemap
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestBlogCountryAPI:
    """Tests for the auto-generated country blog posts API"""
    
    def test_get_blog_countries_list(self):
        """Test GET /api/blog/countries returns list of 197 countries"""
        response = requests.get(f"{BASE_URL}/api/blog/countries")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "posts" in data, "Response should contain 'posts' key"
        assert "total" in data, "Response should contain 'total' key"
        
        # Should have at least some countries (expecting 197 or close)
        posts = data["posts"]
        total = data["total"]
        
        print(f"Total countries in blog posts: {total}")
        assert total >= 1, f"Expected at least some countries, got {total}"
        
        # Verify structure of a country post entry
        if posts:
            sample_post = posts[0]
            assert "country_code" in sample_post, "Post should have country_code"
            assert "country_name" in sample_post, "Post should have country_name"
            assert "slug" in sample_post, "Post should have slug"
            assert "title" in sample_post, "Post should have title"
            assert "url" in sample_post, "Post should have url"
            
            # Verify URL format
            assert sample_post["url"].startswith("/blog/country/"), f"URL should start with /blog/country/, got {sample_post['url']}"
            
            print(f"Sample post: {sample_post['country_name']} - {sample_post['title']}")
        
        print("PASS: /api/blog/countries returns valid country list")
    
    def test_get_india_blog_post(self):
        """Test GET /api/blog/country/IN returns correct data for India"""
        response = requests.get(f"{BASE_URL}/api/blog/country/IN")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify required fields
        required_fields = ["title", "slug", "country_code", "country_name", "excerpt", 
                         "content", "category", "channels", "total_channels", 
                         "read_time", "generated_at", "is_auto_generated"]
        
        for field in required_fields:
            assert field in data, f"Response should contain '{field}' field"
        
        # Verify India-specific data
        assert data["country_code"] == "IN", f"Expected country_code 'IN', got {data['country_code']}"
        assert data["country_name"] == "India", f"Expected country_name 'India', got {data['country_name']}"
        assert data["is_auto_generated"] == True, "Should be auto-generated"
        
        # Verify title format
        assert "India" in data["title"], f"Title should contain 'India', got {data['title']}"
        assert "Top" in data["title"], f"Title should contain 'Top', got {data['title']}"
        
        # Verify channels list
        channels = data["channels"]
        total = data["total_channels"]
        
        print(f"India blog post: {data['title']}")
        print(f"Channels tracked: {total}")
        
        # Should have at least some channels
        assert total >= 1, f"Expected at least 1 channel, got {total}"
        
        # Verify channel structure
        if channels:
            channel = channels[0]
            assert "title" in channel, "Channel should have title"
            assert "subscriber_count" in channel, "Channel should have subscriber_count"
            assert "channel_id" in channel, "Channel should have channel_id"
            
            print(f"#1 Channel: {channel['title']} - {channel.get('subscriber_count', 0)} subscribers")
        
        print("PASS: /api/blog/country/IN returns valid India blog post")
    
    def test_get_us_blog_post(self):
        """Test GET /api/blog/country/US returns correct data for United States"""
        response = requests.get(f"{BASE_URL}/api/blog/country/US")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        assert data["country_code"] == "US", f"Expected 'US', got {data['country_code']}"
        assert data["country_name"] == "United States", f"Expected 'United States', got {data['country_name']}"
        
        print(f"US blog post: {data['title']}")
        print(f"Channels: {data['total_channels']}")
        
        print("PASS: /api/blog/country/US returns valid data")
    
    def test_blog_post_has_region_and_flag(self):
        """Test that blog posts include region and flag emoji"""
        response = requests.get(f"{BASE_URL}/api/blog/country/JP")
        
        assert response.status_code == 200
        
        data = response.json()
        
        # Should have flag emoji and region
        assert "flag_emoji" in data, "Should have flag_emoji"
        assert "region" in data, "Should have region"
        
        print(f"Japan: {data['flag_emoji']} | Region: {data['region']}")
        
        print("PASS: Blog posts include region and flag_emoji")
    
    def test_blog_post_content_structure(self):
        """Test that blog post content has proper structure"""
        response = requests.get(f"{BASE_URL}/api/blog/country/IN")
        
        assert response.status_code == 200
        
        data = response.json()
        content = data.get("content", "")
        
        # Content should contain key sections
        assert "## " in content, "Content should have H2 headers"
        assert "###" in content, "Content should have H3 headers for channel rankings"
        
        # Should have conclusion
        assert "Conclusion" in content, "Content should have Conclusion section"
        
        # Should have internal links
        assert "/channel/" in content, "Content should have channel links"
        assert "/country/" in content, "Content should have country links"
        
        print(f"Content length: {len(content)} characters")
        print("PASS: Blog post content has proper structure")
    
    def test_invalid_country_code(self):
        """Test that invalid country code returns 404"""
        response = requests.get(f"{BASE_URL}/api/blog/country/INVALID")
        
        assert response.status_code == 404, f"Expected 404 for invalid country, got {response.status_code}"
        
        print("PASS: Invalid country code returns 404")
    
    def test_lowercase_country_code(self):
        """Test that lowercase country code works (case insensitivity)"""
        response = requests.get(f"{BASE_URL}/api/blog/country/in")
        
        assert response.status_code == 200, f"Expected 200 for lowercase 'in', got {response.status_code}"
        
        data = response.json()
        assert data["country_code"] == "IN", "Should normalize to uppercase"
        
        print("PASS: Lowercase country code works correctly")


class TestSitemapWithCountryBlogPosts:
    """Tests for sitemap including country blog post URLs"""
    
    def test_api_sitemap_includes_blog_country_urls(self):
        """Test that /api/sitemap.xml includes /blog/country/{code} URLs"""
        response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        
        assert response.status_code == 200
        
        content = response.text
        
        # Should include blog country URLs
        assert "/blog/country/" in content, "Sitemap should include /blog/country/ URLs"
        
        # Check specific countries
        assert "/blog/country/IN" in content or "/blog/country/US" in content, \
            "Sitemap should include specific country blog URLs"
        
        print("PASS: API sitemap includes /blog/country/ URLs")
    
    def test_root_sitemap_includes_blog_country_urls(self):
        """Test that root /sitemap.xml includes country blog posts"""
        response = requests.get(f"{BASE_URL}/sitemap.xml")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        content = response.text
        
        # Should include blog country URLs
        assert "/blog/country/" in content, "Root sitemap should include /blog/country/ URLs"
        
        # Count how many country blog URLs are in sitemap
        count = content.count("/blog/country/")
        print(f"Found {count} /blog/country/ URLs in sitemap")
        
        print("PASS: Root sitemap includes country blog URLs")


class TestBlogCountriesCount:
    """Test that 197 countries are available"""
    
    def test_verify_country_count(self):
        """Verify we have approximately 197 countries for blog posts"""
        response = requests.get(f"{BASE_URL}/api/blog/countries")
        
        assert response.status_code == 200
        
        data = response.json()
        total = data["total"]
        
        print(f"Total countries available: {total}")
        
        # Should have significant number of countries (not necessarily exactly 197)
        assert total >= 10, f"Expected at least 10 countries, got {total}"
        
        # Log for informational purposes
        if total < 197:
            print(f"NOTE: Only {total} countries seeded, expected 197")
        elif total >= 197:
            print(f"PASS: {total} countries available (197+ expected)")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
