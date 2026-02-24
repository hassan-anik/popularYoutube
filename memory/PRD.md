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
- `GET /api/sitemap.xml` - XML sitemap
- `POST /api/contact` - Contact form
- `POST /api/newsletter/subscribe` - Newsletter signup

## Files Structure
```
/app/
├── backend/
│   ├── server.py              # Main FastAPI app
│   ├── services/
│   │   ├── youtube_service.py
│   │   ├── ranking_service.py
│   │   ├── growth_analyzer.py
│   │   └── scheduler_service.py
│   └── .env
└── frontend/
    ├── public/
    │   ├── index.html         # GA4 + AdSense
    │   ├── manifest.json      # PWA manifest
    │   ├── sw.js              # Service worker
    │   └── robots.txt
    └── src/
        └── App.js             # All pages (~3200 lines)
```

## Known Limitations
- ~70 countries use placeholder channels due to YouTube API quota limits
- Blog posts are mock/static data (not connected to CMS)
- Growth charts require historical data collection over time

## Test Reports
- `/app/test_reports/iteration_10.json` - All 10 SEO tasks complete (100% pass)
- `/app/test_reports/iteration_9.json` - Auto-generated blog posts
- `/app/test_reports/iteration_8.json` - Top 100, FAQ, Breadcrumbs

## Next Steps / Backlog (P2)
- [ ] Connect blog to real CMS or database
- [ ] Add Redis caching layer for API responses
- [ ] Implement Sentry error tracking
- [ ] Add push notifications for ranking changes
- [ ] Premium tier with API access
- [ ] Refactor App.js into smaller component files
