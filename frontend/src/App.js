import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate } from "react-router-dom";
import { Helmet, HelmetProvider } from "react-helmet-async";
import axios from "axios";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from "react-simple-maps";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Globe,
  Users,
  Eye,
  PlayCircle,
  RefreshCw,
  Search,
  ChevronRight,
  Crown,
  Flame,
  Zap,
  BarChart3,
  Settings,
  ArrowUp,
  ArrowDown,
  X,
  Menu,
  ExternalLink
} from "lucide-react";
import "@/App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Utility functions
const formatNumber = (num) => {
  if (!num) return "0";
  if (num >= 1000000000) return (num / 1000000000).toFixed(2) + "B";
  if (num >= 1000000) return (num / 1000000).toFixed(2) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatShortDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// ==================== SEO COMPONENTS ====================

// Base site info
const SITE_NAME = "TopTube World Pro";
const SITE_URL = process.env.REACT_APP_BACKEND_URL || "https://toptubeworldpro.com";

// Home Page SEO
const HomeSEO = () => (
  <Helmet>
    <title>TopTube World Pro - Global YouTube Channel Rankings & Analytics</title>
    <meta name="description" content="Track and analyze the most subscribed YouTube channels worldwide. Real-time rankings, growth predictions, and analytics for 197 countries. Discover top YouTubers by country." />
    <meta name="keywords" content="YouTube rankings, most subscribed YouTubers, top YouTube channels, YouTube analytics, subscriber count, YouTube growth tracker, global YouTube statistics" />
    <link rel="canonical" href={SITE_URL} />
    
    {/* Open Graph */}
    <meta property="og:type" content="website" />
    <meta property="og:title" content="TopTube World Pro - Global YouTube Channel Rankings" />
    <meta property="og:description" content="Track the most subscribed YouTube channels across 197 countries. Real-time rankings, growth predictions, and viral channel detection." />
    <meta property="og:url" content={SITE_URL} />
    <meta property="og:site_name" content={SITE_NAME} />
    
    {/* Twitter Card */}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="TopTube World Pro - Global YouTube Rankings" />
    <meta name="twitter:description" content="Track the most subscribed YouTube channels across 197 countries with real-time analytics." />
    
    {/* Schema.org structured data */}
    <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": SITE_NAME,
        "url": SITE_URL,
        "description": "Track and analyze the most subscribed YouTube channels worldwide with real-time rankings and growth predictions.",
        "potentialAction": {
          "@type": "SearchAction",
          "target": `${SITE_URL}/countries`,
          "query-input": "required name=search_term_string"
        }
      })}
    </script>
  </Helmet>
);

// Country Page SEO
const CountrySEO = ({ country, channels }) => {
  if (!country) return null;
  
  const topChannel = channels?.[0];
  const channelCount = channels?.length || 0;
  const totalSubs = channels?.reduce((sum, c) => sum + (c.subscriber_count || 0), 0) || 0;
  
  const title = `Top YouTube Channels in ${country.name} ${country.flag_emoji} - Most Subscribed YouTubers ${new Date().getFullYear()}`;
  const description = `Discover the ${channelCount} most subscribed YouTube channels in ${country.name}. ${topChannel ? `#1 is ${topChannel.title} with ${formatNumber(topChannel.subscriber_count)} subscribers.` : ''} Real-time rankings and growth analytics.`;
  const keywords = `top YouTube channels ${country.name}, most subscribed YouTubers ${country.name}, ${country.name} YouTube rankings, popular YouTubers in ${country.name}, ${country.name} YouTube statistics, best YouTubers ${country.name}`;
  const pageUrl = `${SITE_URL}/country/${country.code}`;
  
  // Schema.org ItemList for country rankings
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Top YouTube Channels in ${country.name}`,
    "description": description,
    "url": pageUrl,
    "numberOfItems": channelCount,
    "itemListElement": channels?.slice(0, 10).map((channel, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "item": {
        "@type": "Organization",
        "name": channel.title,
        "url": `https://youtube.com/channel/${channel.channel_id}`,
        "description": `YouTube channel with ${formatNumber(channel.subscriber_count)} subscribers`,
        "image": channel.thumbnail_url
      }
    })) || []
  };

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={pageUrl} />
      
      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      
      {/* Schema.org structured data */}
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
};

// Channel Page SEO
const ChannelSEO = ({ channel }) => {
  if (!channel) return null;
  
  const title = `${channel.title} - YouTube Channel Stats & Analytics | ${formatNumber(channel.subscriber_count)} Subscribers`;
  const description = `${channel.title} YouTube channel statistics: ${formatNumber(channel.subscriber_count)} subscribers, ${formatNumber(channel.view_count)} total views, ${channel.video_count} videos. From ${channel.country_name}. Track growth and rankings.`;
  const keywords = `${channel.title}, ${channel.title} subscribers, ${channel.title} stats, ${channel.title} YouTube, ${channel.country_name} YouTuber, YouTube channel analytics`;
  const pageUrl = `${SITE_URL}/channel/${channel.channel_id}`;
  
  // Schema.org for YouTube Channel
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": channel.title,
    "url": `https://youtube.com/channel/${channel.channel_id}`,
    "description": channel.description?.substring(0, 500) || `YouTube channel from ${channel.country_name}`,
    "image": channel.thumbnail_url,
    "sameAs": [
      `https://youtube.com/channel/${channel.channel_id}`
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": Math.min(5, Math.max(1, (channel.viral_score || 50) / 20)),
      "bestRating": 5,
      "worstRating": 1,
      "ratingCount": channel.subscriber_count || 1
    },
    "interactionStatistic": [
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/SubscribeAction",
        "userInteractionCount": channel.subscriber_count
      },
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/WatchAction",
        "userInteractionCount": channel.view_count
      }
    ]
  };

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={pageUrl} />
      
      {/* Open Graph */}
      <meta property="og:type" content="profile" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={channel.thumbnail_url} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={channel.thumbnail_url} />
      
      {/* Schema.org structured data */}
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
};

// Leaderboard Page SEO
const LeaderboardSEO = ({ totalChannels }) => {
  const title = `Global YouTube Leaderboard - Top ${totalChannels || 100} Most Subscribed Channels ${new Date().getFullYear()}`;
  const description = `Complete ranking of the world's most subscribed YouTube channels. Live subscriber counts, daily growth, and viral status for ${totalChannels || 100}+ channels. Updated in real-time.`;
  const pageUrl = `${SITE_URL}/leaderboard`;
  
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content="YouTube leaderboard, most subscribed YouTube channels, top YouTubers worldwide, global YouTube rankings, YouTube subscriber count, biggest YouTube channels" />
      <link rel="canonical" href={pageUrl} />
      
      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      
      {/* Schema.org structured data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "Global YouTube Channel Leaderboard",
          "description": description,
          "url": pageUrl,
          "numberOfItems": totalChannels || 100
        })}
      </script>
    </Helmet>
  );
};

// Countries List Page SEO
const CountriesListSEO = ({ totalCountries }) => {
  const title = `YouTube Rankings by Country - Browse ${totalCountries || 197} Countries | TopTube World Pro`;
  const description = `Explore YouTube channel rankings for ${totalCountries || 197} countries worldwide. Find the most subscribed YouTubers in any country. Real-time subscriber counts and growth analytics.`;
  const pageUrl = `${SITE_URL}/countries`;
  
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content="YouTube by country, YouTubers by country, top channels by country, YouTube rankings countries, international YouTubers, YouTube statistics by country" />
      <link rel="canonical" href={pageUrl} />
      
      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
};

// Trending Page SEO
const TrendingSEO = () => {
  const title = `Trending YouTube Channels - Fastest Growing YouTubers ${new Date().getFullYear()}`;
  const description = `Discover the fastest growing YouTube channels right now. See which YouTubers are gaining subscribers the fastest with real-time growth analytics and viral predictions.`;
  const pageUrl = `${SITE_URL}/trending`;
  
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content="trending YouTube channels, fastest growing YouTubers, viral YouTube channels, YouTube growth, rising YouTubers, YouTube trending, biggest daily gains" />
      <link rel="canonical" href={pageUrl} />
      
      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
};

// Header Component
const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-[#0d0d0d] border-b border-[#1a1a1a] sticky top-0 z-50" data-testid="header">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
              <PlayCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">TopTube World Pro</span>
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-gray-300 hover:text-white transition-colors" data-testid="nav-home">
              Home
            </Link>
            <Link to="/leaderboard" className="text-gray-300 hover:text-white transition-colors" data-testid="nav-leaderboard">
              Leaderboard
            </Link>
            <Link to="/countries" className="text-gray-300 hover:text-white transition-colors" data-testid="nav-countries">
              Countries
            </Link>
            <Link to="/trending" className="text-gray-300 hover:text-white transition-colors" data-testid="nav-trending">
              Trending
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-gray-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-[#1a1a1a]">
            <div className="flex flex-col gap-4">
              <Link to="/" className="text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Home</Link>
              <Link to="/leaderboard" className="text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Leaderboard</Link>
              <Link to="/countries" className="text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Countries</Link>
              <Link to="/trending" className="text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Trending</Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

// Footer Component
const Footer = () => (
  <footer className="bg-[#0d0d0d] border-t border-[#1a1a1a] py-12 mt-16" data-testid="footer">
    <div className="max-w-6xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
              <PlayCircle className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white">TopTube World Pro</span>
          </div>
          <p className="text-gray-500 text-sm">
            Track and analyze the most subscribed YouTube channels worldwide in real-time.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-4">Rankings</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/leaderboard" className="text-gray-400 hover:text-white">Global Leaderboard</Link></li>
            <li><Link to="/trending" className="text-gray-400 hover:text-white">Fastest Growing</Link></li>
            <li><Link to="/countries" className="text-gray-400 hover:text-white">By Country</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-4">Popular Countries</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/country/US" className="text-gray-400 hover:text-white">United States</Link></li>
            <li><Link to="/country/IN" className="text-gray-400 hover:text-white">India</Link></li>
            <li><Link to="/country/BR" className="text-gray-400 hover:text-white">Brazil</Link></li>
            <li><Link to="/country/KR" className="text-gray-400 hover:text-white">South Korea</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-4">About</h4>
          <ul className="space-y-2 text-sm">
            <li><span className="text-gray-400">Data from YouTube API</span></li>
            <li><span className="text-gray-400">Updated in real-time</span></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#1a1a1a] mt-8 pt-8 text-center text-gray-500 text-sm">
        © 2026 TopTube World Pro. All rights reserved.
      </div>
    </div>
  </footer>
);

// Viral Badge
const ViralBadge = ({ label }) => {
  const styles = {
    "Exploding": "bg-red-500/20 text-red-400 border-red-500/30",
    "Rising Fast": "bg-green-500/20 text-green-400 border-green-500/30",
    "Stable": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Slowing": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
  };
  
  const icons = {
    "Exploding": <Flame className="w-3 h-3" />,
    "Rising Fast": <TrendingUp className="w-3 h-3" />,
    "Stable": <Minus className="w-3 h-3" />,
    "Slowing": <TrendingDown className="w-3 h-3" />
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${styles[label] || styles["Stable"]}`} data-testid={`viral-badge-${label?.toLowerCase()}`}>
      {icons[label]} {label || "Stable"}
    </span>
  );
};

// Rank Change Display
const RankChange = ({ current, previous }) => {
  const change = previous - current;
  if (change > 0) {
    return <span className="text-green-400 flex items-center gap-1 text-sm"><ArrowUp className="w-3 h-3" /> {change}</span>;
  }
  if (change < 0) {
    return <span className="text-red-400 flex items-center gap-1 text-sm"><ArrowDown className="w-3 h-3" /> {Math.abs(change)}</span>;
  }
  return <span className="text-gray-500 text-sm">-</span>;
};

// World Map Component
const WorldMap = ({ mapData, onCountryClick }) => {
  const countryDataMap = {};
  mapData?.forEach(item => {
    countryDataMap[item.country_code] = item;
  });

  return (
    <div className="bg-[#111] rounded-lg border border-[#222] overflow-hidden" data-testid="world-map">
      <ComposableMap projectionConfig={{ scale: 140 }} style={{ width: "100%", height: "350px" }}>
        <ZoomableGroup center={[0, 20]} zoom={1}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const countryCode = geo.properties.ISO_A2;
                const hasData = countryDataMap[countryCode];
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => hasData && onCountryClick(countryCode)}
                    style={{
                      default: {
                        fill: hasData ? "#1e40af" : "#1a1a1a",
                        stroke: "#333",
                        strokeWidth: 0.5,
                        outline: "none",
                        cursor: hasData ? "pointer" : "default"
                      },
                      hover: {
                        fill: hasData ? "#2563eb" : "#1a1a1a",
                        stroke: "#333",
                        strokeWidth: 0.5,
                        outline: "none"
                      },
                      pressed: { outline: "none" }
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
};

// Growth Chart
const GrowthChart = ({ data }) => {
  const chartData = data?.map(item => ({
    date: formatShortDate(item.timestamp),
    subscribers: item.subscriber_count
  })) || [];

  return (
    <div className="h-64" data-testid="growth-chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorSubs" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
          <XAxis dataKey="date" stroke="#666" tick={{ fill: '#666', fontSize: 11 }} />
          <YAxis stroke="#666" tick={{ fill: '#666', fontSize: 11 }} tickFormatter={formatNumber} />
          <Tooltip 
            contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px' }}
            labelStyle={{ color: '#999' }}
            formatter={(value) => [formatNumber(value), "Subscribers"]}
          />
          <Area type="monotone" dataKey="subscribers" stroke="#22c55e" fill="url(#colorSubs)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Channel Card Component
const ChannelCard = ({ channel, rank, onClick }) => (
  <div 
    className="bg-[#111] border border-[#222] rounded-lg p-4 hover:border-[#333] transition-colors cursor-pointer"
    onClick={onClick}
    data-testid={`channel-card-${channel.channel_id}`}
  >
    <div className="flex items-start gap-4">
      <div className="text-2xl font-bold text-gray-600">#{rank}</div>
      <img 
        src={channel.thumbnail_url || "https://via.placeholder.com/64"} 
        alt={channel.title}
        className="w-16 h-16 rounded-full"
        onError={(e) => e.target.src = "https://via.placeholder.com/64"}
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-white truncate">{channel.title}</h3>
        <p className="text-gray-500 text-sm">{channel.country_name}</p>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-lg font-bold text-white">{formatNumber(channel.subscriber_count)}</span>
          <span className="text-green-400 text-sm">+{formatNumber(channel.daily_subscriber_gain || 0)}/day</span>
        </div>
      </div>
      <ViralBadge label={channel.viral_label} />
    </div>
  </div>
);

// ==================== PAGES ====================

// Home Page
const HomePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState([]);
  const [globalTop, setGlobalTop] = useState([]);
  const [fastestGrowing, setFastestGrowing] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mapRes, globalRes, growingRes, statsRes] = await Promise.all([
          axios.get(`${API}/stats/map-data`),
          axios.get(`${API}/leaderboard/global?limit=5`),
          axios.get(`${API}/leaderboard/fastest-growing?limit=5`),
          axios.get(`${API}/admin/stats`)
        ]);
        setMapData(mapRes.data.map_data || []);
        setGlobalTop(globalRes.data.channels || []);
        setFastestGrowing(growingRes.data.channels || []);
        setStats(statsRes.data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div data-testid="home-page">
      <HomeSEO />
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#111] to-[#0a0a0a] py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Global YouTube Channel Rankings
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Track, analyze, and predict the most subscribed YouTube channels across {stats?.total_countries || 0} countries in real-time.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/leaderboard" className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors" data-testid="cta-leaderboard">
              View Leaderboard
            </Link>
            <Link to="/countries" className="bg-[#222] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#333] transition-colors" data-testid="cta-countries">
              Browse Countries
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-[#0d0d0d] border-y border-[#1a1a1a] py-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-white">{stats?.total_countries || 0}</div>
              <div className="text-gray-500 text-sm">Countries</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">{stats?.total_channels || 0}</div>
              <div className="text-gray-500 text-sm">Channels Tracked</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">{formatNumber(stats?.total_stats_records || 0)}</div>
              <div className="text-gray-500 text-sm">Data Points</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400">Live</div>
              <div className="text-gray-500 text-sm">Real-time Updates</div>
            </div>
          </div>
        </div>
      </section>

      {/* World Map Section */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-white mb-2">Top Channels by Country</h2>
          <p className="text-gray-500 mb-6">Click on a highlighted country to view its top YouTube channels</p>
          <WorldMap mapData={mapData} onCountryClick={(code) => navigate(`/country/${code}`)} />
        </div>
      </section>

      {/* Top Channels Section */}
      <section className="py-12 bg-[#0d0d0d]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Top 5 Worldwide</h2>
              <p className="text-gray-500">Most subscribed YouTube channels globally</p>
            </div>
            <Link to="/leaderboard" className="text-red-500 hover:text-red-400 flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {globalTop.map((channel, idx) => (
              <ChannelCard 
                key={channel.channel_id}
                channel={channel}
                rank={idx + 1}
                onClick={() => navigate(`/channel/${channel.channel_id}`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-500" /> Fastest Growing
              </h2>
              <p className="text-gray-500">Channels with highest daily growth rate</p>
            </div>
            <Link to="/trending" className="text-red-500 hover:text-red-400 flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fastestGrowing.map((channel, idx) => (
              <div 
                key={channel.channel_id}
                className="bg-[#111] border border-[#222] rounded-lg p-4 hover:border-[#333] cursor-pointer"
                onClick={() => navigate(`/channel/${channel.channel_id}`)}
                data-testid={`trending-card-${idx}`}
              >
                <div className="flex items-center gap-3">
                  <img src={channel.thumbnail_url || "https://via.placeholder.com/48"} alt="" className="w-12 h-12 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white truncate">{channel.title}</h4>
                    <p className="text-gray-500 text-sm">{channel.country_name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold">+{channel.daily_growth_percent?.toFixed(2) || 0}%</div>
                    <div className="text-gray-500 text-xs">daily</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

// Global Leaderboard Page
const LeaderboardPage = () => {
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API}/leaderboard/global?limit=500`);
        setChannels(response.data.channels || []);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-8" data-testid="leaderboard-page">
      <LeaderboardSEO totalChannels={channels.length} />
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Global Leaderboard</h1>
          <p className="text-gray-500">All tracked YouTube channels worldwide, ranked by subscribers</p>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-[#111] border border-[#222] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#0d0d0d] border-b border-[#222]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Channel</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Subscribers</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Change</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">24h Gain</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {channels.map((channel, idx) => (
                <tr 
                  key={channel.channel_id}
                  className="hover:bg-[#1a1a1a] cursor-pointer transition-colors"
                  onClick={() => navigate(`/channel/${channel.channel_id}`)}
                  data-testid={`leaderboard-row-${idx}`}
                >
                  <td className="px-4 py-4 font-bold text-gray-400">#{idx + 1}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <img src={channel.thumbnail_url || "https://via.placeholder.com/40"} alt="" className="w-10 h-10 rounded-full" />
                      <div>
                        <div className="font-medium text-white">{channel.title}</div>
                        <div className="text-xs text-gray-500">{channel.country_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-bold text-white">{formatNumber(channel.subscriber_count)}</td>
                  <td className="px-4 py-4"><RankChange current={channel.current_rank || idx + 1} previous={channel.previous_rank || idx + 1} /></td>
                  <td className="px-4 py-4 text-green-400">+{formatNumber(channel.daily_subscriber_gain || 0)}</td>
                  <td className="px-4 py-4"><ViralBadge label={channel.viral_label} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {channels.map((channel, idx) => (
            <ChannelCard key={channel.channel_id} channel={channel} rank={idx + 1} onClick={() => navigate(`/channel/${channel.channel_id}`)} />
          ))}
        </div>
      </div>
    </div>
  );
};

// Countries List Page
const CountriesPage = () => {
  const navigate = useNavigate();
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API}/countries`);
        setCountries(response.data || []);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-8" data-testid="countries-page">
      <CountriesListSEO totalCountries={countries.length} />
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Countries</h1>
          <p className="text-gray-500">Explore YouTube rankings by country</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {countries.map(country => (
            <div
              key={country.code}
              className="bg-[#111] border border-[#222] rounded-lg p-5 hover:border-[#333] cursor-pointer transition-colors"
              onClick={() => navigate(`/country/${country.code}`)}
              data-testid={`country-card-${country.code}`}
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">{country.flag_emoji}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-lg">{country.name}</h3>
                  <p className="text-gray-500 text-sm">{country.channel_count} channels</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </div>
              {country.top_channel && (
                <div className="mt-4 pt-4 border-t border-[#222]">
                  <p className="text-xs text-gray-500 mb-2">Top Channel</p>
                  <div className="flex items-center gap-2">
                    <img src={country.top_channel.thumbnail_url || "https://via.placeholder.com/32"} alt="" className="w-8 h-8 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{country.top_channel.title}</div>
                      <div className="text-xs text-gray-500">{formatNumber(country.top_channel.subscriber_count)} subs</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Country Detail Page
const CountryPage = () => {
  const { countryCode } = useParams();
  const navigate = useNavigate();
  const [country, setCountry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API}/countries/${countryCode}`);
        setCountry(response.data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [countryCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!country) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Country not found
      </div>
    );
  }

  const topThree = country.channels?.slice(0, 3) || [];

  return (
    <div className="py-8" data-testid="country-detail-page">
      <CountrySEO country={country} channels={country.channels} />
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-5xl">{country.flag_emoji}</span>
            <div>
              <h1 className="text-3xl font-bold text-white">{country.name}</h1>
              <p className="text-gray-500">{country.region} • {country.channels?.length || 0} channels tracked</p>
            </div>
          </div>
        </div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {topThree.map((channel, idx) => (
            <div
              key={channel.channel_id}
              className={`bg-[#111] border rounded-lg p-6 cursor-pointer hover:border-[#444] transition-colors ${idx === 0 ? 'border-yellow-600' : 'border-[#222]'}`}
              onClick={() => navigate(`/channel/${channel.channel_id}`)}
              data-testid={`podium-${idx}`}
            >
              <div className="text-center mb-4">
                <span className="text-3xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
              </div>
              <img src={channel.thumbnail_url || "https://via.placeholder.com/80"} alt="" className="w-20 h-20 rounded-full mx-auto mb-4" />
              <h3 className="font-bold text-white text-center mb-1">{channel.title}</h3>
              <p className="text-2xl font-bold text-white text-center">{formatNumber(channel.subscriber_count)}</p>
              <p className="text-gray-500 text-sm text-center">subscribers</p>
              <div className="mt-4 text-center">
                <ViralBadge label={channel.viral_label} />
              </div>
            </div>
          ))}
        </div>

        {/* All Rankings */}
        <div className="bg-[#111] border border-[#222] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[#222]">
            <h2 className="font-bold text-white">All Rankings</h2>
          </div>
          <div className="divide-y divide-[#222]">
            {country.channels?.map((channel, idx) => (
              <div
                key={channel.channel_id}
                className="px-4 py-4 hover:bg-[#1a1a1a] cursor-pointer flex items-center gap-4"
                onClick={() => navigate(`/channel/${channel.channel_id}`)}
                data-testid={`country-rank-${idx}`}
              >
                <div className="w-8 font-bold text-gray-500">#{idx + 1}</div>
                <img src={channel.thumbnail_url || "https://via.placeholder.com/40"} alt="" className="w-10 h-10 rounded-full" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{channel.title}</div>
                  <div className="text-sm text-gray-500">{formatNumber(channel.view_count)} views</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white">{formatNumber(channel.subscriber_count)}</div>
                  <div className="text-green-400 text-sm">+{formatNumber(channel.daily_subscriber_gain || 0)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Channel Detail Page
const ChannelPage = () => {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API}/channels/${channelId}`);
        setChannel(response.data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [channelId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Channel not found
      </div>
    );
  }

  return (
    <div className="py-8" data-testid="channel-detail-page">
      <ChannelSEO channel={channel} />
      <div className="max-w-6xl mx-auto px-4">
        {/* Channel Header */}
        <div className="bg-[#111] border border-[#222] rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <img 
              src={channel.thumbnail_url || "https://via.placeholder.com/120"} 
              alt={channel.title}
              className="w-24 h-24 rounded-full border-4 border-[#222]"
            />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-white">{channel.title}</h1>
                <ViralBadge label={channel.viral_label} />
              </div>
              <p className="text-gray-500 mb-3">
                <Link to={`/country/${channel.country_code}`} className="hover:text-white">{channel.country_name}</Link>
                {channel.current_rank && ` • Rank #${channel.current_rank}`}
              </p>
              <p className="text-gray-400 text-sm line-clamp-2">{channel.description}</p>
              <a 
                href={`https://youtube.com/channel/${channel.channel_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-red-500 hover:text-red-400 mt-3 text-sm"
              >
                View on YouTube <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#111] border border-[#222] rounded-lg p-4 text-center">
            <Users className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{formatNumber(channel.subscriber_count)}</div>
            <div className="text-gray-500 text-sm">Subscribers</div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-lg p-4 text-center">
            <Eye className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{formatNumber(channel.view_count)}</div>
            <div className="text-gray-500 text-sm">Total Views</div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-lg p-4 text-center">
            <PlayCircle className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{channel.video_count}</div>
            <div className="text-gray-500 text-sm">Videos</div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-lg p-4 text-center">
            <Zap className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{channel.viral_prediction?.viral_score || 0}</div>
            <div className="text-gray-500 text-sm">Viral Score</div>
          </div>
        </div>

        {/* Growth Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#111] border border-[#222] rounded-lg p-5">
            <h3 className="text-gray-500 text-sm mb-2">24-Hour Growth</h3>
            <div className={`text-3xl font-bold ${(channel.daily_subscriber_gain || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {channel.daily_subscriber_gain >= 0 ? '+' : ''}{formatNumber(channel.daily_subscriber_gain || 0)}
            </div>
            <div className="text-gray-500 text-sm">
              {channel.daily_growth_percent >= 0 ? '+' : ''}{channel.daily_growth_percent?.toFixed(4) || 0}%
            </div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-lg p-5">
            <h3 className="text-gray-500 text-sm mb-2">7-Day Growth</h3>
            <div className={`text-3xl font-bold ${(channel.weekly_subscriber_gain || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {channel.weekly_subscriber_gain >= 0 ? '+' : ''}{formatNumber(channel.weekly_subscriber_gain || 0)}
            </div>
            <div className="text-gray-500 text-sm">
              {channel.weekly_growth_percent >= 0 ? '+' : ''}{channel.weekly_growth_percent?.toFixed(4) || 0}%
            </div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-lg p-5">
            <h3 className="text-gray-500 text-sm mb-2">30-Day Growth</h3>
            <div className={`text-3xl font-bold ${(channel.monthly_subscriber_gain || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {channel.monthly_subscriber_gain >= 0 ? '+' : ''}{formatNumber(channel.monthly_subscriber_gain || 0)}
            </div>
            <div className="text-gray-500 text-sm">
              {channel.monthly_growth_percent >= 0 ? '+' : ''}{channel.monthly_growth_percent?.toFixed(4) || 0}%
            </div>
          </div>
        </div>

        {/* Growth Chart */}
        {channel.growth_history?.length > 0 && (
          <div className="bg-[#111] border border-[#222] rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Subscriber Growth (30 Days)</h2>
            <GrowthChart data={channel.growth_history} />
          </div>
        )}

        {/* Top Videos */}
        {channel.top_videos?.length > 0 && (
          <div className="bg-[#111] border border-[#222] rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Top Videos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {channel.top_videos.map((video) => (
                <a
                  key={video.video_id}
                  href={`https://youtube.com/watch?v=${video.video_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:opacity-80 transition-opacity"
                  data-testid={`video-${video.video_id}`}
                >
                  <img src={video.thumbnail_url} alt="" className="w-full rounded-lg mb-2" />
                  <h4 className="font-medium text-white text-sm line-clamp-2 mb-1">{video.title}</h4>
                  <p className="text-gray-500 text-xs">{formatNumber(video.view_count)} views • {formatShortDate(video.published_at)}</p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Trending Page
const TrendingPage = () => {
  const navigate = useNavigate();
  const [fastestGrowing, setFastestGrowing] = useState([]);
  const [biggestGainers, setBiggestGainers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [growingRes, gainersRes] = await Promise.all([
          axios.get(`${API}/leaderboard/fastest-growing?limit=20`),
          axios.get(`${API}/leaderboard/biggest-gainers?limit=20`)
        ]);
        setFastestGrowing(growingRes.data.channels || []);
        setBiggestGainers(gainersRes.data.channels || []);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-8" data-testid="trending-page">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Trending</h1>
          <p className="text-gray-500">Channels with the fastest growth and biggest gains</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Fastest Growing */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" /> Fastest Growing (by %)
            </h2>
            <div className="bg-[#111] border border-[#222] rounded-lg divide-y divide-[#222]">
              {fastestGrowing.map((channel, idx) => (
                <div
                  key={channel.channel_id}
                  className="p-4 hover:bg-[#1a1a1a] cursor-pointer flex items-center gap-4"
                  onClick={() => navigate(`/channel/${channel.channel_id}`)}
                  data-testid={`fastest-${idx}`}
                >
                  <div className="w-6 font-bold text-gray-500">{idx + 1}</div>
                  <img src={channel.thumbnail_url || "https://via.placeholder.com/40"} alt="" className="w-10 h-10 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">{channel.title}</div>
                    <div className="text-xs text-gray-500">{channel.country_name}</div>
                  </div>
                  <div className="text-green-400 font-bold">+{channel.daily_growth_percent?.toFixed(2) || 0}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Biggest Gainers */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500" /> Biggest 24h Gains
            </h2>
            <div className="bg-[#111] border border-[#222] rounded-lg divide-y divide-[#222]">
              {biggestGainers.map((channel, idx) => (
                <div
                  key={channel.channel_id}
                  className="p-4 hover:bg-[#1a1a1a] cursor-pointer flex items-center gap-4"
                  onClick={() => navigate(`/channel/${channel.channel_id}`)}
                  data-testid={`gainer-${idx}`}
                >
                  <div className="w-6 font-bold text-gray-500">{idx + 1}</div>
                  <img src={channel.thumbnail_url || "https://via.placeholder.com/40"} alt="" className="w-10 h-10 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">{channel.title}</div>
                    <div className="text-xs text-gray-500">{channel.country_name}</div>
                  </div>
                  <div className="text-green-400 font-bold">+{formatNumber(channel.daily_subscriber_gain || 0)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Admin Page
const AdminPage = () => {
  const [stats, setStats] = useState(null);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, countriesRes] = await Promise.all([
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/countries`)
      ]);
      setStats(statsRes.data);
      setCountries(countriesRes.data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const response = await axios.post(`${API}/admin/seed`);
      setMessage({ type: "success", text: response.data.message });
      fetchData();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.detail || "Failed to seed" });
    } finally {
      setSeeding(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await axios.post(`${API}/admin/refresh-all`);
      setMessage({ type: "success", text: response.data.message });
      fetchData();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.detail || "Failed to refresh" });
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    setSearching(true);
    try {
      const response = await axios.get(`${API}/search/channels?query=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data.results || []);
    } catch (error) {
      setMessage({ type: "error", text: "Search failed" });
    } finally {
      setSearching(false);
    }
  };

  const handleAddChannel = async (channelId) => {
    if (!selectedCountry) {
      setMessage({ type: "error", text: "Select a country first" });
      return;
    }
    try {
      await axios.post(`${API}/channels`, { channel_id: channelId, country_code: selectedCountry });
      setMessage({ type: "success", text: "Channel added!" });
      setSearchResults([]);
      fetchData();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.detail || "Failed to add" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-8" data-testid="admin-page">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center justify-between ${message.type === 'success' ? 'bg-green-900/30 border border-green-800 text-green-400' : 'bg-red-900/30 border border-red-800 text-red-400'}`}>
            {message.text}
            <button onClick={() => setMessage(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#111] border border-[#222] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{stats?.total_countries || 0}</div>
            <div className="text-gray-500 text-sm">Countries</div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{stats?.total_channels || 0}</div>
            <div className="text-gray-500 text-sm">Channels</div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{formatNumber(stats?.total_stats_records || 0)}</div>
            <div className="text-gray-500 text-sm">Data Points</div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{stats?.last_update !== "Never" ? formatShortDate(stats?.last_update) : "Never"}</div>
            <div className="text-gray-500 text-sm">Last Update</div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-[#111] border border-[#222] rounded-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              data-testid="seed-btn"
            >
              {seeding && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              Seed Initial Data
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-[#222] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#333] disabled:opacity-50 flex items-center gap-2"
              data-testid="refresh-btn"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh All
            </button>
          </div>
        </div>

        {/* Add Channel */}
        <div className="bg-[#111] border border-[#222] rounded-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Add Channel</h2>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="bg-[#0d0d0d] border border-[#333] rounded-lg px-4 py-2 text-white"
              data-testid="country-select"
            >
              <option value="">Select Country</option>
              {countries.map(c => (
                <option key={c.code} value={c.code}>{c.flag_emoji} {c.name}</option>
              ))}
            </select>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search YouTube channels..."
                className="flex-1 bg-[#0d0d0d] border border-[#333] rounded-lg px-4 py-2 text-white"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                data-testid="search-input"
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                data-testid="search-btn"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="border border-[#222] rounded-lg divide-y divide-[#222]">
              {searchResults.map(result => (
                <div key={result.channel_id} className="p-4 flex items-center gap-4">
                  <img src={result.thumbnail_url} alt="" className="w-10 h-10 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">{result.title}</div>
                    <div className="text-xs text-gray-500 truncate">{result.description}</div>
                  </div>
                  <button
                    onClick={() => handleAddChannel(result.channel_id)}
                    className="bg-[#222] text-white px-3 py-1 rounded text-sm hover:bg-[#333]"
                    data-testid={`add-${result.channel_id}`}
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Countries Table */}
        <div className="bg-[#111] border border-[#222] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[#222]">
            <h2 className="font-bold text-white">Countries Overview</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0d0d0d]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Country</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Channels</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Top Channel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {countries.map(country => (
                  <tr key={country.code} data-testid={`admin-country-${country.code}`}>
                    <td className="px-4 py-3 text-white">{country.flag_emoji} {country.name}</td>
                    <td className="px-4 py-3 text-gray-400">{country.channel_count}</td>
                    <td className="px-4 py-3 text-gray-400">{country.top_channel?.title || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App
function App() {
  return (
    <div className="App bg-[#0a0a0a] min-h-screen">
      <BrowserRouter>
        <Header />
        <main className="min-h-[calc(100vh-200px)]">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/countries" element={<CountriesPage />} />
            <Route path="/country/:countryCode" element={<CountryPage />} />
            <Route path="/channel/:channelId" element={<ChannelPage />} />
            <Route path="/trending" element={<TrendingPage />} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </div>
  );
}

export default App;
