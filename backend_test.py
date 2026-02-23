"""
Backend API Testing for TopTube World Pro
Tests all endpoints and functionality
"""
import requests
import sys
import json
from datetime import datetime

class TopTubeAPITester:
    def __init__(self, base_url="https://global-yt-stats.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status=200, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                return True, response.json() if response.content else {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.content:
                    try:
                        error_detail = response.json()
                        print(f"   Error details: {error_detail}")
                    except:
                        print(f"   Raw response: {response.text}")
                self.failed_tests.append(f"{name}: Expected {expected_status}, got {response.status_code}")
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout")
            self.failed_tests.append(f"{name}: Request timeout")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append(f"{name}: {str(e)}")
            return False, {}

    def test_health_endpoints(self):
        """Test health and status endpoints"""
        print("\n=== HEALTH CHECK TESTS ===")
        
        # Test root endpoint
        success, _ = self.run_test("Root Endpoint", "GET", "")
        
        # Test health endpoint
        success, _ = self.run_test("Health Check", "GET", "health")

    def test_countries_endpoints(self):
        """Test countries-related endpoints"""
        print("\n=== COUNTRIES ENDPOINTS ===")
        
        # Get all countries
        success, countries_data = self.run_test("Get All Countries", "GET", "countries")
        
        if success and countries_data:
            print(f"   Found {len(countries_data)} countries")
            
            # Test getting a specific country
            if len(countries_data) > 0:
                country_code = countries_data[0]['code']
                success, country_detail = self.run_test(
                    f"Get Country Detail ({country_code})", 
                    "GET", 
                    f"countries/{country_code}"
                )
                
                # Test non-existent country
                self.run_test("Get Non-existent Country", "GET", "countries/XX", expected_status=404)

    def test_channels_endpoints(self):
        """Test channel-related endpoints"""
        print("\n=== CHANNELS ENDPOINTS ===")
        
        # Get all channels
        success, channels_data = self.run_test("Get All Channels", "GET", "channels?limit=10")
        
        if success and channels_data and 'channels' in channels_data:
            channels = channels_data['channels']
            print(f"   Found {len(channels)} channels")
            
            # Test getting a specific channel
            if len(channels) > 0:
                channel_id = channels[0]['channel_id']
                success, channel_detail = self.run_test(
                    f"Get Channel Detail ({channel_id[:20]}...)", 
                    "GET", 
                    f"channels/{channel_id}"
                )
                
        # Test non-existent channel
        self.run_test("Get Non-existent Channel", "GET", "channels/non-existent", expected_status=404)

    def test_leaderboard_endpoints(self):
        """Test leaderboard endpoints"""
        print("\n=== LEADERBOARD ENDPOINTS ===")
        
        # Global leaderboard
        success, global_data = self.run_test("Global Leaderboard", "GET", "leaderboard/global?limit=5")
        
        # Fastest growing
        success, growing_data = self.run_test("Fastest Growing", "GET", "leaderboard/fastest-growing?limit=5")
        
        # Biggest gainers
        success, gainers_data = self.run_test("Biggest Gainers", "GET", "leaderboard/biggest-gainers?limit=5")

    def test_stats_endpoints(self):
        """Test statistics endpoints"""
        print("\n=== STATS ENDPOINTS ===")
        
        # Map data
        success, map_data = self.run_test("Map Data", "GET", "stats/map-data")
        
        # Ranking changes
        success, ranking_data = self.run_test("Ranking Changes", "GET", "stats/ranking-changes?limit=5")

    def test_admin_endpoints(self):
        """Test admin endpoints"""
        print("\n=== ADMIN ENDPOINTS ===")
        
        # Admin stats
        success, admin_data = self.run_test("Admin Stats", "GET", "admin/stats")
        
        if success and admin_data:
            print(f"   Database status: {admin_data.get('total_countries', 0)} countries, {admin_data.get('total_channels', 0)} channels")

    def test_search_endpoints(self):
        """Test search functionality"""
        print("\n=== SEARCH ENDPOINTS ===")
        
        # Search channels
        success, search_data = self.run_test("Search Channels", "GET", "search/channels?query=pewdiepie&max_results=3")
        
        if success and search_data and 'results' in search_data:
            print(f"   Found {len(search_data['results'])} search results")

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting TopTube World Pro API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        
        self.test_health_endpoints()
        self.test_countries_endpoints()
        self.test_channels_endpoints()
        self.test_leaderboard_endpoints()
        self.test_stats_endpoints()
        self.test_admin_endpoints()
        self.test_search_endpoints()
        
        # Print final results
        print(f"\n📊 FINAL RESULTS:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = TopTubeAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())