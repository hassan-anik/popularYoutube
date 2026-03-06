# TopTube World Pro - Product Requirements Document

## ⚠️ CRITICAL: ALWAYS USE PRODUCTION DATABASE
**All database operations must target the PRODUCTION database directly.**
- Production API: `https://mostpopularyoutubechannel.com/api`
- Admin Key: `toptube2024admin`
- DO NOT make changes to preview database - always use production!

## Project Overview
**Name:** TopTube World Pro  
**Type:** SaaS Website  
**Purpose:** Track, rank, and predict the most subscribed YouTube channels per country in real-time

## Tech Stack
- **Frontend:** React 19, TailwindCSS, Recharts, React Simple Maps
- **Backend:** FastAPI (Python), APScheduler, Resend
- **Database:** MongoDB
- **External API:** YouTube Data API v3

## Current Stats (Mar 4, 2026)
- **197 Countries** - All world countries supported
- **~1,437 Channels** - Top YouTube channels tracked (production)
- **~47,599 Data Points** - Historical tracking records
- **7 Background Jobs** - Auto-refresh (2h), ranking (10m), growth (1h), stats (2h), daily blog (9am), channel discovery (8h), channel expansion (8h)
- **Auto-Blogger** - Daily automated blog post generation
- **151 Blog Posts** - Country ranking posts for all countries with data

## Code Architecture (Refactored Feb 25, 2026)
```
/app/frontend/src/
├── utils/           # Constants, formatting utilities
│   ├── constants.js # API URLs, site config, country slugs
│   └── format.js    # Number/date formatting
├── hooks/           # Custom React hooks
│   ├── useFavorites.js
│   └── useSEO.js
├── context/         # React contexts
│   └── ThemeContext.jsx
├── components/
│   ├── common/      # Header, Footer, Badges, Indicators
│   ├── ads/         # AdSense components
│   └── seo/         # Breadcrumb, FAQ, SEO helpers
└── App.js           # Main app with all page components
```

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
- [x] Google Analytics integration
- [x] Google AdSense integration
- [x] AdSense essential pages (About, Privacy, Terms, Contact)
- [x] Contact form with email/database storage
- [x] All 197 countries populated with channels

## 10-Point Improvement Plan - ALL COMPLETE ✓ (Feb 22, 2026)

### 1. Search & Filter System ✓
- Global channel search bar in header
- Filter leaderboard by subscriber range, growth rate, country
- Sort by different metrics

### 2. More Ad Placements ✓
- Sidebar ads on channel pages (sticky)
- In-feed ads between leaderboard rows (every 10 rows)
- Sticky bottom banner on mobile

### 3. PWA (Progressive Web App) ✓
- manifest.json with app icons and shortcuts
- Service worker for offline support
- "Add to Home Screen" capability

### 4. Channel Comparison Tool ✓
- Compare up to 4 channels side by side
- Growth charts overlay
- Shareable comparison links (/compare?ids=id1,id2)

### 5. Real-time Data Indicators ✓
- Live pulsing indicator on channel pages
- "Last updated X ago" timestamps
- Animated counter components

### 6. Blog/Content Section ✓
- Blog page at /blog with featured post
- 6 mock articles (SEO content placeholders)
- Category badges and read time indicators
- Newsletter signup CTA

### 7. User Favorites ✓
- Save favorite channels to localStorage
- Dedicated /favorites page
- Heart icon in navigation and channel pages
- No login required

### 8. Embed Widgets ✓
- Embeddable channel stats iframe code
- Copy to clipboard button
- "Powered by TopTube World Pro" branding

### 9. Performance Optimizations ✓
- Image lazy loading on all pages
- Service worker caching

### 10. Navigation Updates ✓
- Header: Home, Leaderboard, Countries, Trending, Compare, Blog, Favorites
- Footer: Updated with all new pages and links

### 11. Dark/Light Mode Toggle ✓ (Feb 22, 2026)
- Theme toggle button in header (Sun/Moon icons)
- Persists preference in localStorage
- Respects system preference on first visit
- Smooth CSS transitions between themes
- Full support across all pages and components

### 12. SEO Internal Linking ✓ (Feb 23, 2026)
- **CountryPage:** "Top YouTube Channels in [Region]" with 8 neighboring countries
- **CountryPage:** "More YouTubers from [Country]" with channel thumbnails (when >3 channels)
- **CountryPage:** "Discover More" navigation with Popular Countries, Rankings, Tools, Resources
- **ChannelPage:** "Other Popular YouTubers from [Country]" with related channel cards
- **ChannelPage:** "Explore More" navigation with context-aware links
- Semantic HTML: `<nav>`, `<section>` elements with ARIA labels
- Descriptive anchor text instead of "click here"
- Title attributes for SEO
- Lazy loading images for performance
- New APIs: `/api/channels/{id}/related`, `/api/countries/{code}/neighbors`

### 13. Advanced SEO Features ✓ (Feb 24, 2026)
- **Top 100 Page:** New `/top-100` route - high-traffic SEO landing page
  - Top 3 spotlight with gradient cards (gold/silver/bronze)
  - Complete 100 channel list with rank badges
  - Quick stats (combined subscribers, 24h growth, countries)
  - FAQ section with expandable questions
  - Internal links to related pages
- **Breadcrumb Navigation:** With BreadcrumbList JSON-LD schema
  - CountryPage: Home > Countries > [Country]
  - ChannelPage: Home > [Country] > [Channel]
  - Top100Page: Home > Leaderboard > Top 100
- **FAQ Schema Markup:** FAQPage JSON-LD on key pages
  - Dynamic questions based on page content
  - Expandable accordion UI
- **Sitemap Updated:** Now includes `/top-100` with 0.95 priority
- **Footer Updated:** Added "Top 100 YouTubers" link in Rankings

## Implementation Details

### New Pages Added
- `/compare` - Channel comparison tool
- `/favorites` - User's saved channels
- `/blog` - Blog & insights section

### New Components
- `SidebarAd` - Sticky 300x250 ad for channel pages
- `InFeedAd` - Ads between leaderboard rows
- `StickyMobileAd` - Fixed bottom ad for mobile
- `FavoriteButton` - Heart icon toggle
- `LiveIndicator` - Green pulsing dot
- `LastUpdatedIndicator` - Relative timestamp
- `AnimatedCounter` - Animated number transitions
- `EmbedWidget` - Embed code generator
- `ComparePage` - Channel comparison UI
- `FavoritesPage` - Saved channels list
- `BlogPage` - Article listing
- `ThemeProvider` - Context for dark/light mode
- `ThemeToggle` - Sun/Moon toggle button

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
- Sitemap.xml with 700+ URLs (197 countries + 197 blog posts + channels + SEO slugs)
- Robots.txt with sitemap reference
- Top 100 Page with FAQ schema
- Breadcrumb navigation with BreadcrumbList schema
- FAQ schema markup on Country and Channel pages
- Auto-generated 197 country blog posts ("/blog/country/{CODE}")
- SEO-friendly country URLs ("/india-youtubers" → "/country/IN") - 52 countries
- HowTo schema on Compare page (4 steps)
- Hreflang tags (x-default, en)

## API Endpoints

### Public
- `GET /api/countries` - List all countries
- `GET /api/countries/{code}` - Country details
- `GET /api/countries/{code}/neighbors` - Neighboring countries from same region
- `GET /api/channels` - List channels (with ?search= param)
- `GET /api/channels/{id}` - Channel details
- `GET /api/channels/{id}/related` - Related channels from same country
- `GET /api/leaderboard/global` - Global leaderboard
- `GET /api/leaderboard/fastest-growing` - Trending
- `GET /api/blog/country/{code}` - Auto-generated country blog post
- `GET /api/blog/countries` - List all 197 country blog posts
- `GET /api/sitemap.xml` - XML sitemap
- `POST /api/contact` - Contact form
- `POST /api/newsletter/subscribe` - Newsletter signup
- `DELETE /api/admin/remove-placeholder-channels` - Remove fake data

### Authentication (Emergent Google OAuth)
- `POST /api/auth/session` - Exchange session_id for session_token
- `GET /api/auth/me` - Get current authenticated user
- `POST /api/auth/logout` - Logout and clear session

### User Engagement
- `POST /api/channel-requests` - Submit channel request
- `GET /api/channel-requests` - Get pending requests
- `POST /api/channel-requests/{id}/vote` - Vote for a request
- `GET /api/polls` - Get active prediction polls
- `POST /api/polls/{id}/vote` - Vote in a poll
- `POST /api/admin/polls` - Create new poll
- `GET /api/user/favorites` - Get user's synced favorites
- `POST /api/user/favorites/{channel_id}` - Add to favorites
- `DELETE /api/user/favorites/{channel_id}` - Remove from favorites

## Data Quality
- Removed 108 placeholder/fake channel entries (MrBeast was used as placeholder for 70+ countries)
- Countries without real data now show "No Data Available" message
- Only authentic, verified YouTube channel data is displayed

## Files Structure (Updated Feb 25, 2026)
```
/app/
├── backend/
│   ├── server.py              # Main FastAPI app
│   └── .env
├── frontend/
│   ├── public/
│   │   ├── index.html         # GA4 + AdSense
│   │   ├── manifest.json      # PWA manifest
│   │   ├── sw.js              # Service worker
│   │   └── robots.txt
│   └── src/
│       ├── utils/             # NEW: Constants, formatting
│       ├── hooks/             # NEW: useFavorites, useSEO
│       ├── context/           # NEW: ThemeContext
│       ├── components/
│       │   ├── common/        # NEW: Header, Footer, etc.
│       │   ├── ads/           # NEW: AdSense components
│       │   ├── seo/           # NEW: Breadcrumb, FAQ
│       │   └── ui/            # Shadcn components
│       └── App.js             # Pages (~4800 lines)
├── BACKLINK_STRATEGY.md       # NEW: SEO backlink guide
└── memory/
    └── PRD.md
```

## Known Limitations
- ~91 countries have no channel data yet (showing "No Data Available")
- Blog posts are mock/static data (not connected to CMS)
- Growth charts require historical data collection over time

## Test Reports
- `/app/test_reports/iteration_10.json` - All 10 SEO tasks complete (100% pass)
- `/app/test_reports/iteration_9.json` - Auto-generated blog posts
- `/app/test_reports/iteration_8.json` - Top 100, FAQ, Breadcrumbs

## Completed This Session (Feb 25 - Mar 1, 2026)
- [x] Frontend code refactoring - Created modular structure with utils/, hooks/, context/, components/
- [x] Backlink Strategy document created (`/app/BACKLINK_STRATEGY.md`)
- [x] Data policy confirmed - Only real YouTube data, no placeholder population
- [x] Populated ~745 channels across 147 countries (from original ~155)
- [x] Fixed global leaderboard - added T-Series, Cocomelon, corrected MrBeast country
- [x] Auto-blogger feature - daily automated blog posts with "TopTube Editorial" author
- [x] Fixed Breadcrumbs structured data error (Google Search Console)
- [x] SEO-focused blog posts created:
  - `/blog/top-youtube-channel-in-the-united-states-2026-update` (MrBeast 469M lead)
  - `/blog/top-youtube-channel-in-india-2026-update` (T-Series 310M lead)
- [x] **PRODUCTION FIX (Mar 1):** Created comprehensive India blog post on production
  - 6,300+ chars of SEO content with Top 10 table, FAQs, statistics
  - Targeting high-impression URL from Google Search Console
- [x] Production database sync completed (~745 channels)

## Next Steps / Backlog
### P1 - High Priority
- [ ] Continue refactoring App.js - Move page components to /pages folder (~4800 lines still)
- [ ] Implement data-driven growth charts (Recharts) for channel pages
- [ ] Populate remaining 74 countries (blocked by YouTube API quota)

### P2 - Medium Priority
- [ ] Add Redis caching layer for API responses
- [ ] Build Viral Prediction Engine with "Viral Score" algorithm
- [ ] Automatic sitemap regeneration via cron job
- [ ] Create "Milestone" content (channels about to hit 100M)

### P3 - Low Priority
- [ ] Implement Sentry error tracking
- [ ] Add push notifications for ranking changes
- [ ] Premium tier with API access
- [ ] Fix Last-Modified headers for SEO
- [ ] Address React hydration warnings

## Known Blockers
- **YouTube API Quota** - Daily limit frequently exceeded. 74 countries still have 0 channels.

## YouTube API ToS Compliance (Mar 6, 2026) ✅
**CRITICAL FIX COMPLETED** - Resolved all violations from YouTube ToS Report

### Violations Fixed:
1. ✅ **Policy III.A.1 (YouTube ToS Agreement)** - Added prominent YouTube ToS notice to Terms of Service page with link to https://www.youtube.com/t/terms
2. ✅ **Policy III.A.2c (Google Privacy Policy Link)** - Added Google Privacy Policy link to Privacy Policy page at http://www.google.com/policies/privacy
3. ✅ **Policy III.E.4h (Derived Metrics Disclaimer)** - Added clear disclaimers that growth stats, viral scores, and predictions are "estimated by TopTube World Pro" and not from YouTube

### Implementation Details:
- **Terms of Service page**: New red highlighted section with YouTube ToS link + "Data Disclaimer" section explaining derived metrics
- **Privacy Policy page**: New red highlighted section with Google Privacy Policy link
- **Channel pages**: Yellow disclaimer banner + asterisks (*) on all derived metrics (24h Growth, 7-Day Growth, 30-Day Growth, Viral Score)
- **Leaderboard pages**: Asterisks on "24H GAIN" and "STATUS" columns + footer disclaimer
- **Site-wide footer**: Added links to YouTube ToS and Google Privacy Policy with disclaimer text

### Admin Action Required:
- User must respond to YouTube's email confirming whether they use one or multiple API project numbers

### New Methodology Page Created (Mar 6, 2026):
- **URL:** `/methodology`
- **Content:** Comprehensive explanation of data sources and calculation methods
- **Sections:**
  - Official YouTube Data (Subscribers, Views, Video Count, Creation Date)
  - Estimated Metrics with formulas (24h Growth, 7/30-Day Growth, Viral Status, Viral Score)
  - How We Collect Data (API requests, storage, refresh schedule)
  - Accuracy & Limitations (YouTube rounding, timing delays, growth estimates)
  - YouTube API Compliance (ToS and Privacy Policy links)
- **SEO Value:** Targets "YouTube analytics methodology" keywords

### High Traffic SEO Features Added (Mar 6, 2026):
1. **Race to Milestone Page** (`/race`)
   - Live tracking of channels racing to subscriber milestones (500M, 250M, 200M, etc.)
   - Progress bars, estimated arrival times, featured races
   - SEO: "race to 500 million subscribers", "who will hit 500m first"

2. **Milestone Tracker Page** (`/milestones`)
   - Upcoming milestones with estimated dates
   - Historical timeline (MrBeast 400M, T-Series 300M, etc.)
   - Milestone levels (Diamond 500M, Platinum 200M, Gold 100M, Silver 50M)
   - SEO: "youtube milestone tracker", "channels hitting 100 million"

3. **Channel Category Pages** (`/categories`, `/category/:slug`)
   - 8 categories: Music, Gaming, Entertainment, Education, Sports, News, Kids, Tech
   - Category list page with channel counts and top channels
   - Individual category pages with podium and full rankings
   - SEO: "top gaming youtubers", "best music channels"

4. **Rising Stars Page** (`/rising-stars`)
   - Channels under 50M subscribers with growth potential
   - Filter by: Fastest Growth %, Most Daily Gains, Going Viral
   - SEO: "rising youtube stars", "next big youtubers"


### User Engagement Features Added (Mar 6, 2026):
1. **User Accounts with Google OAuth**
   - Emergent Google Auth integration
   - Sign In button in header
   - User menu dropdown (My Favorites, Request Channel, Prediction Polls, Sign Out)
   - Session persistence with httpOnly cookies (7 days)

2. **Channel Request Form** (`/request-channel`)
   - Form to submit YouTube channel URLs for tracking
   - Fields: Channel URL, Name, Country, Reason
   - Popular Requests section with voting system
   - Anonymous submissions allowed, voting requires login

3. **Prediction Polls** (`/polls`)
   - Interactive voting polls (e.g., "Who will gain more subscribers?")
   - Visual progress bars showing vote percentages
   - Requires login to vote
   - Poll end dates with automatic expiration
   - Admin endpoint to create new polls: POST /api/admin/polls

### Multi-Language Support Added (Mar 6, 2026):
**Languages Supported:**
- 🇺🇸 English (default)
- 🇪🇸 Español (Spanish)
- 🇮🇳 हिन्दी (Hindi)
- 🇧🇷 Português (Portuguese)

**Implementation:**
- i18next + react-i18next for internationalization
- Language detection from browser, URL param (?lang=es), or localStorage
- Language selector dropdown in header
- Translations for navigation, homepage, stats, common UI elements

**Files Created:**
- `/app/frontend/src/i18n.js` - i18n configuration
- `/app/frontend/src/locales/en.json` - English translations
- `/app/frontend/src/locales/es.json` - Spanish translations
- `/app/frontend/src/locales/hi.json` - Hindi translations
- `/app/frontend/src/locales/pt.json` - Portuguese translations
