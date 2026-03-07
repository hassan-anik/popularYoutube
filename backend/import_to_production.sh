#!/bin/bash
# Script to import blog posts to production after deployment
# Run this ONCE after deploying to production

PRODUCTION_URL="https://mostpopularyoutubechannel.com"
ADMIN_KEY="toptube2024admin"

echo "=== Blog Posts Import Script ==="
echo "This will import blog posts from the export file to production."
echo ""

# Read the export file
if [ ! -f "/app/backend/blog_posts_export.json" ]; then
    echo "ERROR: Export file not found at /app/backend/blog_posts_export.json"
    echo "Please run the export first from preview environment."
    exit 1
fi

echo "Found export file. Importing to: $PRODUCTION_URL"
echo ""

# Import to production
curl -X POST "$PRODUCTION_URL/api/admin/blog/import?admin_key=$ADMIN_KEY" \
    -H "Content-Type: application/json" \
    -d @/app/backend/blog_posts_export.json

echo ""
echo ""
echo "=== Import Complete ==="
echo "Check your production site to verify blog posts are visible."
