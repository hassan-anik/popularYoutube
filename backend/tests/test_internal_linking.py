"""
Backend tests for Internal Linking feature
Tests the new API endpoints for related channels and neighboring countries
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://toptube-preview-env.preview.emergentagent.com')

# Test data - known channels and countries
TEST_CHANNEL_ID = "UCBnZ16ahKA2DZ_T5W0FPUXg"  # ChuChu TV from India
TEST_COUNTRY_CODE = "IN"  # India

class TestRelatedChannelsAPI:
    """Test /api/channels/{channel_id}/related endpoint"""
    
    def test_related_channels_returns_200(self):
        """Test that related channels endpoint returns 200 for valid channel"""
        response = requests.get(f"{BASE_URL}/api/channels/{TEST_CHANNEL_ID}/related?limit=6")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ Related channels API returns 200")
    
    def test_related_channels_returns_array(self):
        """Test that related_channels is an array"""
        response = requests.get(f"{BASE_URL}/api/channels/{TEST_CHANNEL_ID}/related?limit=6")
        data = response.json()
        assert "related_channels" in data, "Missing related_channels key"
        assert isinstance(data["related_channels"], list), "related_channels should be a list"
        print(f"✓ Related channels returns array with {len(data['related_channels'])} channels")
    
    def test_related_channels_excludes_current_channel(self):
        """Test that the current channel is not in related channels"""
        response = requests.get(f"{BASE_URL}/api/channels/{TEST_CHANNEL_ID}/related?limit=6")
        data = response.json()
        related_ids = [ch["channel_id"] for ch in data["related_channels"]]
        assert TEST_CHANNEL_ID not in related_ids, "Current channel should not be in related channels"
        print(f"✓ Related channels excludes the current channel")
    
    def test_related_channels_same_country(self):
        """Test that related channels are from the same country"""
        response = requests.get(f"{BASE_URL}/api/channels/{TEST_CHANNEL_ID}/related?limit=6")
        data = response.json()
        if data["related_channels"]:
            for ch in data["related_channels"]:
                assert ch["country_code"] == data["country_code"], \
                    f"Related channel {ch['title']} is from {ch['country_code']}, expected {data['country_code']}"
        print(f"✓ All related channels are from the same country ({data.get('country_code', 'N/A')})")
    
    def test_related_channels_has_required_fields(self):
        """Test that each related channel has required fields"""
        response = requests.get(f"{BASE_URL}/api/channels/{TEST_CHANNEL_ID}/related?limit=6")
        data = response.json()
        required_fields = ["channel_id", "title", "thumbnail_url", "subscriber_count"]
        
        for ch in data["related_channels"]:
            for field in required_fields:
                assert field in ch, f"Missing field {field} in related channel"
        print(f"✓ Related channels have all required fields")
    
    def test_related_channels_limit_parameter(self):
        """Test that limit parameter works correctly"""
        response = requests.get(f"{BASE_URL}/api/channels/{TEST_CHANNEL_ID}/related?limit=3")
        data = response.json()
        assert len(data["related_channels"]) <= 3, f"Expected max 3 channels, got {len(data['related_channels'])}"
        print(f"✓ Limit parameter works correctly")
    
    def test_related_channels_invalid_channel_returns_404(self):
        """Test that invalid channel ID returns 404"""
        response = requests.get(f"{BASE_URL}/api/channels/INVALID_CHANNEL_ID_12345/related?limit=6")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Invalid channel returns 404")


class TestNeighboringCountriesAPI:
    """Test /api/countries/{country_code}/neighbors endpoint"""
    
    def test_neighbors_returns_200(self):
        """Test that neighbors endpoint returns 200 for valid country"""
        response = requests.get(f"{BASE_URL}/api/countries/{TEST_COUNTRY_CODE}/neighbors?limit=8")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ Neighbors API returns 200")
    
    def test_neighbors_returns_array(self):
        """Test that neighbors is an array"""
        response = requests.get(f"{BASE_URL}/api/countries/{TEST_COUNTRY_CODE}/neighbors?limit=8")
        data = response.json()
        assert "neighbors" in data, "Missing neighbors key"
        assert isinstance(data["neighbors"], list), "neighbors should be a list"
        print(f"✓ Neighbors returns array with {len(data['neighbors'])} countries")
    
    def test_neighbors_excludes_current_country(self):
        """Test that the current country is not in neighbors"""
        response = requests.get(f"{BASE_URL}/api/countries/{TEST_COUNTRY_CODE}/neighbors?limit=8")
        data = response.json()
        neighbor_codes = [n["code"] for n in data["neighbors"]]
        assert TEST_COUNTRY_CODE not in neighbor_codes, "Current country should not be in neighbors"
        print(f"✓ Neighbors excludes the current country")
    
    def test_neighbors_same_region(self):
        """Test that neighbors are from the same region"""
        response = requests.get(f"{BASE_URL}/api/countries/{TEST_COUNTRY_CODE}/neighbors?limit=8")
        data = response.json()
        current_region = data.get("current_region", "")
        if data["neighbors"] and current_region:
            for neighbor in data["neighbors"]:
                assert neighbor.get("region") == current_region, \
                    f"Neighbor {neighbor['name']} is from {neighbor.get('region')}, expected {current_region}"
        print(f"✓ All neighbors are from the same region ({data.get('current_region', 'N/A')})")
    
    def test_neighbors_has_top_channel(self):
        """Test that each neighbor has top_channel info"""
        response = requests.get(f"{BASE_URL}/api/countries/{TEST_COUNTRY_CODE}/neighbors?limit=8")
        data = response.json()
        for neighbor in data["neighbors"]:
            assert "top_channel" in neighbor, f"Missing top_channel for {neighbor['name']}"
        print(f"✓ Neighbors include top_channel info")
    
    def test_neighbors_limit_parameter(self):
        """Test that limit parameter works correctly"""
        response = requests.get(f"{BASE_URL}/api/countries/{TEST_COUNTRY_CODE}/neighbors?limit=4")
        data = response.json()
        assert len(data["neighbors"]) <= 4, f"Expected max 4 neighbors, got {len(data['neighbors'])}"
        print(f"✓ Limit parameter works correctly")
    
    def test_neighbors_invalid_country_returns_404(self):
        """Test that invalid country code returns 404"""
        response = requests.get(f"{BASE_URL}/api/countries/XX/neighbors?limit=8")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Invalid country returns 404")
    
    def test_neighbors_returns_metadata(self):
        """Test that response includes current_region and current_country metadata"""
        response = requests.get(f"{BASE_URL}/api/countries/{TEST_COUNTRY_CODE}/neighbors?limit=8")
        data = response.json()
        assert "current_region" in data, "Missing current_region in response"
        assert "current_country" in data, "Missing current_country in response"
        assert data["current_country"] == "India", f"Expected India, got {data['current_country']}"
        print(f"✓ Response includes correct metadata")


class TestChannelPage:
    """Test channel page loads and shows related channels"""
    
    def test_channel_endpoint_returns_data(self):
        """Test that channel endpoint returns valid data"""
        response = requests.get(f"{BASE_URL}/api/channels/{TEST_CHANNEL_ID}")
        assert response.status_code == 200
        data = response.json()
        assert "title" in data
        assert "country_code" in data
        assert "country_name" in data
        print(f"✓ Channel endpoint returns valid data for {data['title']}")


class TestCountryPage:
    """Test country page loads and shows neighbors"""
    
    def test_country_endpoint_returns_data(self):
        """Test that country endpoint returns valid data"""
        response = requests.get(f"{BASE_URL}/api/countries/{TEST_COUNTRY_CODE}")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "region" in data
        assert "channels" in data
        print(f"✓ Country endpoint returns valid data for {data['name']}")
    
    def test_country_has_channels(self):
        """Test that India has at least 1 channel"""
        response = requests.get(f"{BASE_URL}/api/countries/{TEST_COUNTRY_CODE}")
        data = response.json()
        assert len(data["channels"]) >= 1, "Expected at least 1 channel in India"
        print(f"✓ India has {len(data['channels'])} channels")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
