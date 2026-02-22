# TopTube World Pro - Product Requirements Document

## Project Overview
**Name:** TopTube World Pro  
**Type:** SaaS Website  
**Purpose:** Track, rank, and predict the most subscribed YouTube channels per country in real-time

## Tech Stack
- **Frontend:** React 19, TailwindCSS, Recharts, React Simple Maps
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **External API:** YouTube Data API v3

## User Personas
1. **YouTube Enthusiasts** - Track favorite creators' growth
2. **Content Creators** - Monitor competition and trends
3. **Marketing Professionals** - Identify influencers by region
4. **Data Analysts** - Research YouTube trends and predictions

## Core Requirements (Static)
- [x] Global leaderboard with real-time subscriber counts
- [x] Country-specific rankings and pages
- [x] Channel detail pages with growth metrics
- [x] World map visualization
- [x] Viral prediction engine (Exploding/Rising/Stable/Slowing)
- [x] Admin dashboard for data management
- [ ] Email notifications (deferred)
- [ ] Premium analytics (future)

## What's Been Implemented (Jan 22, 2026)

### MVP Features Completed
1. **Homepage**
   - Hero section with stats overview
   - Interactive world map showing top channel per country
   - Top 5 worldwide channels list
   - Fastest growing channels section

2. **Global Top 100 Leaderboard**
   - Ranked table with channel info
   - Subscriber counts, daily gains
   - Viral status badges
   - Click to view channel details

3. **Countries Page**
   - Grid of all tracked countries with flags
   - Channel count per country
   - Top channel preview
   - Click to view country details

4. **Country Detail Pages**
   - Podium view for top 3 channels
   - Full rankings table
   - Click to view channel details

5. **Channel Detail Pages**
   - Profile with avatar and description
   - Subscriber count, views, video count
   - 24h, 7-day, 30-day growth metrics
   - 30-day growth chart (Recharts)
   - Top videos section
   - YouTube link

6. **Trending Page**
   - Fastest growing by percentage
   - Biggest 24h gains

7. **Admin Dashboard**
   - Stats overview
   - Seed initial data button
   - Refresh all channels button
   - Search and add YouTube channels
   - Countries overview table

### Backend Services
- `youtube_service.py` - YouTube API integration with caching
- `ranking_service.py` - Ranking calculations
- `growth_analyzer.py` - Growth metrics and viral predictions

### Database Collections
- `countries` - Country info with flags
- `channels` - Channel data and stats
- `channel_stats` - Historical snapshots
- `rank_history` - Ranking changes

## Prioritized Backlog

### P0 (Critical) - Done ✓
- [x] YouTube API integration
- [x] Real-time channel data
- [x] Global and country rankings
- [x] Channel detail pages

### P1 (Important) - Next Phase
- [ ] Background worker for auto-refresh every 6 hours
- [ ] Cron job for ranking updates every 10 minutes
- [ ] SEO metadata for country pages
- [ ] Ranking change notifications/badges

### P2 (Nice to Have) - Future
- [ ] Email notification system
- [ ] Weekly growth summary emails
- [ ] Google AdSense integration
- [ ] Premium tier with API access
- [ ] Detailed analytics reports
- [ ] Historical comparison charts

## Next Tasks
1. Implement background worker for automatic data refresh
2. Add more channels to each country
3. Implement SEO meta tags dynamically
4. Add "Ranking Changed" visual indicators
5. Consider adding authentication for admin routes

## API Endpoints
- `GET /api/health` - Health check
- `GET /api/countries` - List all countries
- `GET /api/countries/{code}` - Country details
- `GET /api/channels` - List channels
- `GET /api/channels/{id}` - Channel details
- `GET /api/leaderboard/global` - Top 100
- `GET /api/leaderboard/country/{code}` - Country leaderboard
- `GET /api/leaderboard/fastest-growing` - Trending
- `GET /api/leaderboard/biggest-gainers` - 24h gains
- `GET /api/stats/map-data` - World map data
- `GET /api/admin/stats` - Admin statistics
- `POST /api/admin/seed` - Seed database
- `POST /api/admin/refresh-all` - Refresh all channels
- `GET /api/search/channels` - Search YouTube

## Environment Variables
- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - Database name
- `YOUTUBE_API_KEY` - YouTube Data API v3 key
- `CORS_ORIGINS` - Allowed origins
