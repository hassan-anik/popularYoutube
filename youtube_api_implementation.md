# TopTube World Pro - YouTube API Implementation Document

## Overview
**Website:** https://mostpopularyoutubechannel.com  
**Purpose:** YouTube analytics platform tracking top channels across 197 countries  
**API Used:** YouTube Data API v3

---

## API Integration Details

### Endpoints Used

#### 1. Channels.list
- **Purpose:** Fetch channel statistics and metadata
- **Parts:** `snippet`, `statistics`
- **Fields Retrieved:**
  - Channel title
  - Description
  - Thumbnail URL
  - Subscriber count
  - View count
  - Video count
- **Quota Cost:** 1 unit per call

#### 2. Search.list
- **Purpose:** Discover YouTube channels
- **Type:** `channel`
- **Usage:** Admin searches to add new channels
- **Quota Cost:** 100 units per call

---

## Data Flow Architecture

```
[YouTube Data API v3]
        |
        v
[FastAPI Backend Server]
        |
        v
[MongoDB Database]
        |
        v
[React Frontend Website]
        |
        v
[Public Users]
```

---

## How YouTube Data is Displayed

### 1. Homepage
- World map showing top channel per country
- Global subscriber leaderboard
- Fastest growing channels section

### 2. Country Pages (/country/{code})
- Top 10 YouTube channels for each country
- Subscriber counts, view counts, growth metrics
- Channel thumbnails and descriptions

### 3. Channel Pages (/channel/{id})
- Individual channel statistics
- Subscriber count with real-time updates
- 24-hour growth metrics
- Historical ranking data

### 4. Leaderboard (/leaderboard)
- Global top 100 most subscribed channels
- Sortable by subscribers, views, growth

### 5. Top 100 Page (/top-100)
- Dedicated SEO page for top 100 YouTubers
- FAQ section about top creators

---

## Data Refresh Schedule

| Data Type | Refresh Frequency | API Calls |
|-----------|------------------|-----------|
| Channel Statistics | Every 4 hours | 1 unit/channel |
| New Channel Discovery | On-demand | 100 units/search |
| Rankings Calculation | After each refresh | 0 (local calculation) |

---

## Data Storage Policy

- **Primary Data:** Refreshed every 4 hours (always current)
- **Historical Data:** Stored 30-90 days for growth calculations
- **Derived Metrics:** Calculated locally (rankings, growth %)
- **Compliance:** Data refreshed regularly per YouTube ToS

---

## User Features Using YouTube Data

1. **Browse Rankings** - View top channels by country
2. **Compare Channels** - Side-by-side comparison tool
3. **Track Growth** - 24-hour subscriber gain metrics
4. **Search Channels** - Find specific YouTube creators
5. **View Statistics** - Detailed channel analytics

---

## Screenshots

### Homepage
- Global leaderboard with subscriber counts
- Country selection map

### Channel Page
- Channel thumbnail, title, description
- Subscriber/view/video counts
- Growth metrics and viral status

### Country Page
- Top 10 channels list
- Country-specific rankings

---

## Technical Stack

- **Backend:** Python FastAPI
- **Database:** MongoDB
- **Frontend:** React.js
- **Hosting:** Cloud-based deployment
- **API Integration:** Official YouTube Data API v3 client

---

## Contact

**Website:** https://mostpopularyoutubechannel.com  
**Purpose:** Educational YouTube analytics for discovering global creators

---

*Document created for YouTube API quota increase request*
