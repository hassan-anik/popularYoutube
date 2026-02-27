#!/usr/bin/env python3
"""
Run this script to sync channels to your production database.

Usage:
    python3 sync_to_production.py https://mostpopularyoutubechannel.com
"""

import json
import requests
import sys

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 sync_to_production.py <production_url>")
        print("Example: python3 sync_to_production.py https://mostpopularyoutubechannel.com")
        sys.exit(1)
    
    prod_url = sys.argv[1].rstrip('/')
    
    # Load channels
    with open('channels_export.json', 'r') as f:
        channels = json.load(f)
    
    print(f"Importing {len(channels)} channels to {prod_url}...")
    
    # Import in batches of 50
    batch_size = 50
    for i in range(0, len(channels), batch_size):
        batch = channels[i:i+batch_size]
        try:
            response = requests.post(
                f"{prod_url}/api/admin/import-channels",
                json=batch,
                timeout=60
            )
            result = response.json()
            print(f"Batch {i//batch_size + 1}: Added {result.get('added', 0)}, Updated {result.get('updated', 0)}")
        except Exception as e:
            print(f"Error importing batch: {e}")
    
    print("Done!")

if __name__ == "__main__":
    main()
