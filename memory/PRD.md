# TopTube World Pro - Product Requirements Document

## Project Overview
**Name:** TopTube World Pro  
**Type:** SaaS Website  
**Purpose:** Track, rank, and predict the most subscribed YouTube channels per country in real-time

## Tech Stack
- **Frontend:** React 19, TailwindCSS, Recharts, React Simple Maps
- **Backend:** FastAPI (Python), APScheduler
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
- [x] Background auto-refresh system (every 6 hours)
- [x] Auto-ranking engine (every 10 minutes)
- [x] Sitemap.xml for SEO
- [x] AdSense essential pages (About, Privacy, Terms, Contact)
- [ ] Email notifications (deferred)
- [ ] Premium analytics (future)

## What's Been Implemented

### Database Stats (as of Feb 22, 2026)
- **197 Countries** - All world countries added with flags and regions
- **127 Channels** - Top YouTube channels tracked from 125 countries
- **72 Countries** with 0 channels (smaller nations without prominent YouTube presence)
- Real-time data from YouTube Data API v3

### Background Workers (Feb 22, 2026) - COMPLETED ✓
1. **Channel Refresh Job** (Every 6 hours)
   - Fetches fresh data from YouTube API for all 127 channels
   - Stores historical snapshots in `channel_stats` collection
   - Updates subscriber counts, view counts, video counts
   
2. **Ranking Update Job** (Every 10 minutes)
   - Recalculates global and country-specific rankings
   - Tracks ranking changes in `rank_history` collection
   - Updates viral labels based on growth patterns

3. **Growth Metrics Job** (Every 1 hour)
   - Calculates 24h, 7-day, 30-day growth metrics
   - Updates growth percentages for trending detection

### Sitemap.xml (Feb 22, 2026) - COMPLETED ✓
- Dynamic XML sitemap at `/api/sitemap.xml`
- **332 URLs total:**
  - 8 static pages (home, leaderboard, countries, trending, about, privacy, terms, contact)
  - 197 country pages
  - 127 channel pages
- Includes changefreq and priority for each URL
- Auto-updates when new channels are added

### AdSense Essential Pages (Feb 22, 2026) - COMPLETED ✓
1. **About Page** (`/about`)
   - Mission statement
   - Features overview (Global Coverage, Real-time Analytics, Viral Predictions, Historical Data)
   - Data sources explanation
   - Target audience descriptions

2. **Privacy Policy** (`/privacy`)
   - Information collection details
   - Usage policies
   - Cookie policy
   - Third-party services (YouTube API, Google Analytics, AdSense)
   - User rights

3. **Terms of Service** (`/terms`)
   - Acceptance of terms
   - Service description
   - Usage restrictions
   - Intellectual property
   - Disclaimers and limitations

4. **Contact Page** (`/contact`)
   - Contact form (name, email, subject, message)
   - Email addresses for different departments
   - Response time information

### SEO Implementation (Feb 22, 2026) - COMPLETED ✓
- Custom `useSEO` hook for dynamic meta tags
- Schema.org JSON-LD structured data on all pages
- Open Graph and Twitter Card meta tags
- Canonical URLs for all pages
- 197 individual country pages with unique SEO

### MVP Features Completed
1. **Homepage** - Hero section, world map, top channels
2. **Global Leaderboard** - Ranked table with all channels
3. **Countries Page** - Grid of 197 countries
4. **Country Detail Pages** - Top channels per country
5. **Channel Detail Pages** - Stats, growth charts, YouTube link
6. **Trending Page** - Fastest growing channels

### API Endpoints
**Public:**
- `GET /api/health` - Health check
- `GET /api/countries` - List all countries
- `GET /api/countries/{code}` - Country details
- `GET /api/channels` - List channels
- `GET /api/channels/{id}` - Channel details
- `GET /api/leaderboard/global` - Global leaderboard
- `GET /api/leaderboard/country/{code}` - Country leaderboard
- `GET /api/leaderboard/fastest-growing` - Trending
- `GET /api/sitemap.xml` - XML sitemap

**Scheduler:**
- `GET /api/scheduler/status` - Get scheduler status
- `POST /api/scheduler/trigger-refresh` - Manual refresh
- `POST /api/scheduler/trigger-ranking` - Manual ranking update

**Admin:**
- `GET /api/admin/stats` - Admin statistics
- `POST /api/admin/seed` - Seed database
- `POST /api/admin/refresh-all` - Refresh all channels

## AdSense Approval Assessment

### Positive Factors (HIGH approval likelihood):
✅ Original, valuable content (real-time YouTube analytics)
✅ Clear niche focus (YouTube channel tracking)
✅ 332+ unique pages with dynamic content
✅ Professional UI/UX design
✅ Mobile responsive
✅ Fast loading speeds
✅ Proper navigation structure
✅ SEO optimized with Schema.org
✅ Privacy Policy page
✅ Terms of Service page
✅ About Us page
✅ Contact page with form
✅ Sitemap.xml for crawlers

### Minor Concerns:
⚠️ 72 countries have 0 channels (could be flagged as thin content)
⚠️ Contact form is frontend-only (no backend email sending yet)

## Prioritized Backlog

### P0 (Critical) - Done ✓
- [x] YouTube API integration
- [x] Real-time channel data
- [x] Global and country rankings
- [x] SEO optimization
- [x] Background workers (auto-refresh, auto-ranking)
- [x] Sitemap.xml
- [x] AdSense essential pages

### P1 (Important) - Next Phase
- [ ] Populate channels for remaining 72 countries
- [ ] Connect contact form to email service (SendGrid/Resend)
- [ ] Add robots.txt file
- [ ] Google Analytics integration
- [ ] Add favicon and app icons

### P2 (Nice to Have) - Future
- [ ] Email notification system
- [ ] Weekly growth summary emails
- [ ] Google AdSense integration code
- [ ] Premium tier with API access
- [ ] Detailed analytics reports
- [ ] "Compare Channels" feature

## Environment Variables
- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - Database name
- `YOUTUBE_API_KEY` - YouTube Data API v3 key
- `CORS_ORIGINS` - Allowed origins
- `SITE_URL` - Base URL for sitemap

## Test Reports
- `/app/test_reports/iteration_1.json` - Initial testing
- `/app/test_reports/iteration_2.json` - SEO testing (100% pass)
- `/app/test_reports/iteration_3.json` - Background workers & AdSense pages (100% pass)
