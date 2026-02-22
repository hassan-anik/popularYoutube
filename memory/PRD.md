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
- [x] SEO optimization for all pages
- [ ] Email notifications (deferred)
- [ ] Premium analytics (future)

## What's Been Implemented

### Database Stats (as of Feb 22, 2026)
- **197 Countries** - All world countries added with flags and regions
- **127 Channels** - Top YouTube channels tracked from 125 countries
- **72 Countries** with 0 channels (smaller nations without prominent YouTube presence)
- Real-time data from YouTube Data API v3

### SEO Implementation (Feb 22, 2026) - COMPLETED
1. **Custom useSEO Hook**
   - React 19 compatible implementation
   - Directly manipulates document.head for dynamic meta tags
   - Updates title, description, keywords, OG tags, Twitter cards
   - Sets canonical URLs for all pages

2. **Page-Specific SEO:**
   - **Homepage:** "TopTube World Pro - Global YouTube Channel Rankings & Analytics"
   - **Country Pages:** "Top YouTube Channels in [Country] - Most Subscribed YouTubers [Year]"
   - **Channel Pages:** "[Channel Name] - YouTube Channel Stats & Analytics | [Subs] Subscribers"
   - **Leaderboard:** "Global YouTube Leaderboard - Top [X] Most Subscribed Channels [Year]"
   - **Countries List:** "YouTube Rankings by Country - Browse [X] Countries"
   - **Trending:** "Trending YouTube Channels - Fastest Growing YouTubers [Year]"

3. **Schema.org Structured Data (JSON-LD):**
   - Homepage: WebSite schema with SearchAction
   - Country pages: ItemList schema with top 10 channels
   - Channel pages: Organization schema with InteractionCounter stats
   - Leaderboard: ItemList schema

4. **Technical Approach:**
   - JsonLd component using dangerouslySetInnerHTML for Schema.org data
   - All meta tags dynamically generated based on page content
   - Open Graph and Twitter Card support on all pages

### MVP Features Completed
1. **Homepage**
   - Hero section with stats overview
   - Interactive world map showing top channel per country
   - Top 5 worldwide channels list
   - Fastest growing channels section

2. **Global Leaderboard**
   - Ranked table with channel info
   - Subscriber counts, daily gains
   - Viral status badges
   - Click to view channel details

3. **Countries Page**
   - Grid of all 197 tracked countries with flags
   - Channel count per country
   - Top channel preview
   - Click to view country details

4. **Country Detail Pages (197 pages)**
   - SEO optimized with dynamic meta tags
   - Podium view for top 3 channels
   - Full rankings table
   - Schema.org ItemList structured data

5. **Channel Detail Pages**
   - Profile with avatar and description
   - Subscriber count, views, video count
   - 24h, 7-day, 30-day growth metrics
   - 30-day growth chart (Recharts)
   - Top videos section
   - YouTube link
   - Schema.org Organization structured data

6. **Trending Page**
   - Fastest growing by percentage
   - Biggest 24h gains

7. **Admin Dashboard** (Hidden from public)
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
- [x] SEO optimization for all pages

### P1 (Important) - Next Phase
- [ ] Background worker for auto-refresh every 6 hours
- [ ] Cron job for ranking updates every 10 minutes
- [ ] Populate channels for remaining 72 countries
- [ ] Ranking change notifications/badges

### P2 (Nice to Have) - Future
- [ ] Email notification system
- [ ] Weekly growth summary emails
- [ ] Google AdSense integration
- [ ] Premium tier with API access
- [ ] Detailed analytics reports
- [ ] Historical comparison charts
- [ ] "Compare Channels" feature

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

## Test Reports
- `/app/test_reports/iteration_1.json` - Initial testing
- `/app/test_reports/iteration_2.json` - SEO testing (100% pass rate)
