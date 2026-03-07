#!/usr/bin/env python3
"""
Script to sync blog posts from preview to production.
Run this AFTER deploying to production.

Usage:
    python3 sync_blog_to_production.py

This script will:
1. Read the exported blog posts from blog_posts_export.json
2. Send them to your production API endpoint
3. Report success/failure
"""

import requests
import json
import sys
import os

# Configuration - UPDATE THESE IF NEEDED
PRODUCTION_URL = "https://mostpopularyoutubechannel.com"
ADMIN_KEY = "toptube2024admin"
EXPORT_FILE = "/app/backend/blog_posts_export.json"

def main():
    print("=" * 50)
    print("Blog Posts Sync to Production")
    print("=" * 50)
    print()
    
    # Check if export file exists
    if not os.path.exists(EXPORT_FILE):
        print(f"ERROR: Export file not found: {EXPORT_FILE}")
        print("Please export blog posts first from preview environment.")
        sys.exit(1)
    
    # Load export file
    with open(EXPORT_FILE, 'r') as f:
        posts = json.load(f)
    
    print(f"Found {len(posts)} blog posts to import")
    print(f"Target: {PRODUCTION_URL}")
    print()
    
    # Confirm
    response = input("Proceed with import? (y/n): ")
    if response.lower() != 'y':
        print("Aborted.")
        sys.exit(0)
    
    # Send to production
    print()
    print("Importing...")
    
    try:
        response = requests.post(
            f"{PRODUCTION_URL}/api/admin/blog/import",
            params={"admin_key": ADMIN_KEY},
            json=posts,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            print()
            print("✓ Import successful!")
            print(f"  - Imported: {result.get('imported', 0)}")
            print(f"  - Skipped (already exists): {result.get('skipped', 0)}")
            print(f"  - Total processed: {result.get('total_processed', 0)}")
        else:
            print()
            print(f"✗ Import failed with status {response.status_code}")
            print(f"  Response: {response.text[:500]}")
            
    except requests.exceptions.ConnectionError:
        print()
        print("✗ Could not connect to production server")
        print("  Make sure the URL is correct and the server is running")
        
    except Exception as e:
        print()
        print(f"✗ Error: {str(e)}")

if __name__ == "__main__":
    main()
