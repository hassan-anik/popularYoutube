# TopTube World Pro - Product Requirements Document

## Project Overview
**Name:** TopTube World Pro  
**Type:** SaaS Website  
**Purpose:** Track, rank, and predict the most subscribed YouTube channels per country in real-time

## Tech Stack
- **Frontend:** React 19, TailwindCSS, Recharts, React Simple Maps
- **Backend:** FastAPI (Python), APScheduler, Resend
- **Database:** MongoDB
- **External API:** YouTube Data API v3

## Current Stats (Feb 22, 2026)
- **197 Countries** - All world countries with channels
- **200+ Channels** - Top YouTube channels tracked
- **405 URLs** - In sitemap for SEO
- **3 Background Jobs** - Auto-refresh, ranking, growth metrics

## Core Requirements - ALL COMPLETE ✓
- [x] Global leaderboard with real-time subscriber counts
- [x] Country-specific rankings and pages (197 pages)
- [x] Channel detail pages with growth metrics
- [x] World map visualization
- [x] Viral prediction engine (Exploding/Rising/Stable/Slowing)
- [x] Admin dashboard for data management (hidden)
- [x] SEO optimization for all pages
- [x] Background auto-refresh system (every 6 hours)
- [x] Auto-ranking engine (every 10 minutes)
- [x] Growth metrics calculation (every 1 hour)
- [x] Sitemap.xml for SEO (405 URLs)
- [x] Robots.txt for crawlers
- [x] Google Analytics integration (placeholder ID)
- [x] Google AdSense integration (placeholder ID)
- [x] AdSense essential pages (About, Privacy, Terms, Contact)
- [x] Contact form with email/database storage
- [x] All 197 countries populated with channels

## Implementation Details

### Background Scheduler (APScheduler)
| Job | Interval | Function |
|-----|----------|----------|
| refresh_channels | 6 hours | Fetch fresh data from YouTube API |
| update_rankings | 10 minutes | Recalculate global and country rankings |
| calculate_growth | 1 hour | Calculate 24h/7d/30d growth metrics |

### SEO Features
- Dynamic page titles for each country/channel
- Meta descriptions with channel stats
- Schema.org JSON-LD structured data
- Open Graph and Twitter Card tags
- Canonical URLs
- Sitemap.xml with 405 URLs
- Robots.txt with sitemap reference

### AdSense Ready Pages
- `/about` - Mission, features, data sources
- `/privacy` - Privacy policy
- `/terms` - Terms of service
- `/contact` - Contact form (saves to DB)

### Contact Form
- Submits to POST `/api/contact`
- Saves to MongoDB `contact_submissions` collection
- Ready for Resend email integration (just add API key)

## AdSense Approval Status: READY ✓
All requirements met:
- ✅ 405+ unique indexed pages
- ✅ Original, valuable content
- ✅ Privacy Policy page
- ✅ Terms of Service page
- ✅ About Us page
- ✅ Contact page with form
- ✅ Mobile responsive
- ✅ Professional design
- ✅ Sitemap.xml
- ✅ Robots.txt
- ✅ Google Analytics ready
- ✅ AdSense code ready

## API Endpoints

### Public
- `GET /api/countries` - List all countries
- `GET /api/countries/{code}` - Country details
- `GET /api/channels` - List channels
- `GET /api/channels/{id}` - Channel details
- `GET /api/leaderboard/global` - Global leaderboard
- `GET /api/leaderboard/fastest-growing` - Trending
- `GET /api/sitemap.xml` - XML sitemap
- `POST /api/contact` - Contact form

### Scheduler
- `GET /api/scheduler/status` - Get job status
- `POST /api/scheduler/trigger-refresh` - Manual refresh
- `POST /api/scheduler/trigger-ranking` - Manual ranking update

### Admin (Hidden)
- `GET /api/admin/stats` - Admin statistics
- `POST /api/admin/seed` - Seed database
- `POST /api/admin/populate-empty-countries` - Fill empty countries

## Environment Variables
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
YOUTUBE_API_KEY=your_youtube_api_key
CORS_ORIGINS=*
SITE_URL=https://your-domain.com
RESEND_API_KEY=your_resend_api_key (optional)
SENDER_EMAIL=your_sender@email.com (optional)
ADMIN_EMAIL=your_admin@email.com (optional)
```

## To Activate Integrations

### Google Analytics
Replace `G-XXXXXXXXXX` in `/app/frontend/public/index.html` with your GA4 Measurement ID.

### Google AdSense
Replace `ca-pub-XXXXXXXXXXXXXXXX` in `/app/frontend/public/index.html` with your AdSense Publisher ID.

### Resend Email
Add `RESEND_API_KEY` to `/app/backend/.env` to enable email sending for contact form.

## Test Reports
- `/app/test_reports/iteration_1.json` - Initial testing
- `/app/test_reports/iteration_2.json` - SEO testing
- `/app/test_reports/iteration_3.json` - Background workers & AdSense pages
- `/app/test_reports/iteration_4.json` - Final validation (100% pass)

## Files Structure
```
/app/
├── backend/
│   ├── server.py              # Main FastAPI app (1000+ lines)
│   ├── services/
│   │   ├── youtube_service.py # YouTube API integration
│   │   ├── ranking_service.py # Ranking calculations
│   │   ├── growth_analyzer.py # Growth metrics
│   │   └── scheduler_service.py # Background jobs
│   └── .env
└── frontend/
    ├── public/
    │   ├── index.html         # GA4 + AdSense scripts
    │   └── robots.txt         # Search crawler rules
    └── src/
        └── App.js             # All pages (2000+ lines)
```

## Remaining Backlog (P2 - Optional)
- [ ] Connect Resend email for contact form
- [ ] Add real GA4 Measurement ID
- [ ] Add real AdSense Publisher ID
- [ ] Email notification system
- [ ] Premium tier with API access
- [ ] Compare Channels feature
