import React, { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
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
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
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
  ExternalLink,
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  Mail,
  Send,
  MessageCircle,
  Heart,
  Star,
  Clock,
  Code,
  Copy,
  Check,
  Plus,
  Trash2,
  BookOpen,
  FileText,
  CalendarDays,
  Bookmark,
  Download,
  Sun,
  Moon,
  Home,
  ChevronDown,
  Trophy,
  HelpCircle
} from "lucide-react";
import "@/App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const API_URL = API;

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ==================== THEME SYSTEM ====================

const ThemeContext = React.createContext();

const THEME_KEY = 'toptube_theme';

const getInitialTheme = () => {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored;
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
  } catch (e) {}
  return 'dark';
};

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update meta theme color
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#0a0a0a' : '#ffffff');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const useTheme = () => React.useContext(ThemeContext);

// Theme Toggle Button Component
const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg transition-all duration-300 hover:bg-gray-200 dark:hover:bg-gray-700"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      data-testid="theme-toggle"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-yellow-400" />
      ) : (
        <Moon className="w-5 h-5 text-gray-600" />
      )}
    </button>
  );
};

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

// ==================== AD COMPONENTS ====================

// AdSense Display Ad Component
const AdBanner = ({ slot = "auto", format = "auto", style = {} }) => {
  const adRef = useRef(null);
  
  useEffect(() => {
    try {
      if (window.adsbygoogle && adRef.current) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, []);
  
  return (
    <div className="ad-container my-4" style={style}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client="ca-pub-3641870553510634"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
};

// Horizontal Banner Ad (for between sections) - Hidden on mobile
const HorizontalAd = () => (
  <div className="hidden md:block w-full bg-[#0d0d0d] border border-[#222] rounded-lg p-2 my-6">
    <div className="text-center text-xs text-gray-500 mb-1">Advertisement</div>
    <AdBanner format="horizontal" style={{ minHeight: '90px' }} />
  </div>
);

// Sidebar Ad Component
const SidebarAd = () => (
  <div className="bg-[#0d0d0d] border border-[#222] rounded-lg p-2 sticky top-20">
    <div className="text-center text-xs text-gray-500 mb-1">Sponsored</div>
    <AdBanner format="rectangle" style={{ minHeight: '250px', width: '300px' }} />
  </div>
);

// In-Feed Ad (for between rows) - Desktop only, every 20 rows
const InFeedAd = ({ index }) => {
  // Only show on desktop and every 20 rows
  if (index > 0 && index % 20 === 0) {
    return (
      <tr className="bg-[#0a0a0a] hidden md:table-row">
        <td colSpan="6" className="px-4 py-3">
          <div className="text-center text-xs text-gray-500 mb-1">Sponsored</div>
          <AdBanner format="fluid" style={{ minHeight: '60px' }} />
        </td>
      </tr>
    );
  }
  return null;
};

// ==================== FAVORITES SYSTEM ====================

const FAVORITES_KEY = 'toptube_favorites';

const getFavorites = () => {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveFavorites = (favorites) => {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
};

const useFavorites = () => {
  const [favorites, setFavorites] = useState(getFavorites);

  const toggleFavorite = (channel) => {
    setFavorites(prev => {
      const exists = prev.find(f => f.channel_id === channel.channel_id);
      let updated;
      if (exists) {
        updated = prev.filter(f => f.channel_id !== channel.channel_id);
      } else {
        updated = [...prev, {
          channel_id: channel.channel_id,
          title: channel.title,
          thumbnail_url: channel.thumbnail_url,
          subscriber_count: channel.subscriber_count,
          added_at: new Date().toISOString()
        }];
      }
      saveFavorites(updated);
      return updated;
    });
  };

  const isFavorite = (channelId) => favorites.some(f => f.channel_id === channelId);

  return { favorites, toggleFavorite, isFavorite };
};

// Favorite Button Component
const FavoriteButton = ({ channel, isFavorite, onToggle, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };
  
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle(channel);
      }}
      className={`p-2 rounded-lg transition-colors ${isFavorite ? 'bg-red-500/20 text-red-500' : 'bg-[#222] text-gray-400 hover:text-red-500'}`}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      data-testid={`favorite-btn-${channel.channel_id}`}
    >
      <Heart className={`${sizeClasses[size]} ${isFavorite ? 'fill-current' : ''}`} />
    </button>
  );
};

// ==================== REAL-TIME INDICATORS ====================

// Animated Counter Component
const AnimatedCounter = ({ value, format = true }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);
  
  useEffect(() => {
    if (value !== prevValue.current) {
      const diff = value - prevValue.current;
      const steps = 20;
      const increment = diff / steps;
      let current = prevValue.current;
      let step = 0;
      
      const interval = setInterval(() => {
        step++;
        current += increment;
        setDisplayValue(Math.round(current));
        
        if (step >= steps) {
          clearInterval(interval);
          setDisplayValue(value);
        }
      }, 50);
      
      prevValue.current = value;
      return () => clearInterval(interval);
    }
  }, [value]);
  
  return <span>{format ? formatNumber(displayValue) : displayValue}</span>;
};

// Last Updated Indicator
const LastUpdatedIndicator = ({ timestamp, className = '' }) => {
  const [timeAgo, setTimeAgo] = useState('');
  
  useEffect(() => {
    const updateTime = () => {
      if (!timestamp) return;
      const now = new Date();
      const updated = new Date(timestamp);
      const diffMs = now - updated;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMins < 1) setTimeAgo('Just now');
      else if (diffMins < 60) setTimeAgo(`${diffMins}m ago`);
      else if (diffHours < 24) setTimeAgo(`${diffHours}h ago`);
      else setTimeAgo(`${diffDays}d ago`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [timestamp]);
  
  return (
    <span className={`flex items-center gap-1 text-xs text-gray-500 ${className}`}>
      <Clock className="w-3 h-3" />
      Updated {timeAgo}
    </span>
  );
};

// Live Pulse Indicator
const LiveIndicator = () => (
  <span className="flex items-center gap-1 text-xs text-green-400">
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
    </span>
    Live
  </span>
);

// ==================== EMBED WIDGET CODE GENERATOR ====================

const EmbedWidget = ({ type, data }) => {
  const [copied, setCopied] = useState(false);
  
  const generateEmbedCode = () => {
    const baseUrl = BACKEND_URL;
    
    if (type === 'channel') {
      return `<iframe src="${baseUrl}/embed/channel/${data.channel_id}" width="300" height="150" frameborder="0" style="border-radius:8px;"></iframe>
<p style="font-size:11px;color:#666;">Powered by <a href="${baseUrl}" target="_blank">TopTube World Pro</a></p>`;
    }
    
    if (type === 'country') {
      return `<iframe src="${baseUrl}/embed/country/${data.country_code}" width="300" height="200" frameborder="0" style="border-radius:8px;"></iframe>
<p style="font-size:11px;color:#666;">Powered by <a href="${baseUrl}" target="_blank">TopTube World Pro</a></p>`;
    }
    
    return '';
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(generateEmbedCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="bg-[#0d0d0d] border border-[#333] rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400 flex items-center gap-2">
          <Code className="w-4 h-4" />
          Embed Widget
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs px-2 py-1 bg-[#222] rounded hover:bg-[#333] transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="text-xs text-gray-500 bg-[#111] p-3 rounded overflow-x-auto">
        {generateEmbedCode()}
      </pre>
    </div>
  );
};

// ==================== SOCIAL SHARING ====================

const SocialShareButtons = ({ url, title, description }) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = encodeURIComponent(description || '');
  
  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDesc}%0A%0A${encodedUrl}`
  };
  
  const handleShare = (platform) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400');
  };
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400 text-sm flex items-center gap-1">
        <Share2 className="w-4 h-4" /> Share:
      </span>
      <button
        onClick={() => handleShare('twitter')}
        className="p-2 bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 rounded-lg transition-colors"
        title="Share on Twitter"
      >
        <Twitter className="w-4 h-4 text-[#1DA1F2]" />
      </button>
      <button
        onClick={() => handleShare('facebook')}
        className="p-2 bg-[#4267B2]/20 hover:bg-[#4267B2]/30 rounded-lg transition-colors"
        title="Share on Facebook"
      >
        <Facebook className="w-4 h-4 text-[#4267B2]" />
      </button>
      <button
        onClick={() => handleShare('linkedin')}
        className="p-2 bg-[#0077B5]/20 hover:bg-[#0077B5]/30 rounded-lg transition-colors"
        title="Share on LinkedIn"
      >
        <Linkedin className="w-4 h-4 text-[#0077B5]" />
      </button>
      <button
        onClick={() => handleShare('whatsapp')}
        className="p-2 bg-[#25D366]/20 hover:bg-[#25D366]/30 rounded-lg transition-colors"
        title="Share on WhatsApp"
      >
        <MessageCircle className="w-4 h-4 text-[#25D366]" />
      </button>
      <button
        onClick={() => handleShare('email')}
        className="p-2 bg-gray-500/20 hover:bg-gray-500/30 rounded-lg transition-colors"
        title="Share via Email"
      >
        <Mail className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  );
};

// ==================== NEWSLETTER SIGNUP ====================

const NewsletterSignup = ({ compact = false }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus('loading');
    try {
      const response = await axios.post(`${API_URL}/newsletter/subscribe`, { email });
      if (response.data.status === 'success') {
        setStatus('success');
        setMessage('Thanks for subscribing!');
        setEmail('');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Already subscribed or invalid email');
    }
    
    setTimeout(() => {
      setStatus('idle');
      setMessage('');
    }, 3000);
  };
  
  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="flex-1 bg-[#0d0d0d] border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 focus:outline-none"
          required
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    );
  }
  
  return (
    <div className="bg-gradient-to-r from-red-600/20 to-red-900/20 border border-red-500/30 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-red-500/20 rounded-lg">
          <Mail className="w-6 h-6 text-red-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Stay Updated</h3>
          <p className="text-gray-400 text-sm">Get weekly YouTube ranking updates</p>
        </div>
      </div>
      
      {status === 'success' ? (
        <div className="text-green-400 text-center py-3">{message}</div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 bg-[#0d0d0d] border border-[#333] rounded-lg px-4 py-3 text-white focus:border-red-500 focus:outline-none"
            required
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
      )}
      {status === 'error' && <p className="text-red-400 text-sm mt-2">{message}</p>}
    </div>
  );
};

// ==================== SEO COMPONENTS ====================

// Base site info
const SITE_NAME = "TopTube World Pro";
const SITE_URL = process.env.REACT_APP_BACKEND_URL || "https://toptubeworldpro.com";

// Helper component for JSON-LD structured data
const JsonLd = ({ data }) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
  />
);

// Custom hook for dynamic SEO
const useSEO = ({ title, description, keywords, canonical, ogType = "website", ogImage = null }) => {
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = title;
    }
    
    // Update or create meta tags
    const updateMeta = (name, content, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };
    
    if (description) {
      updateMeta('description', description);
      updateMeta('og:description', description, true);
      updateMeta('twitter:description', description);
    }
    
    if (keywords) {
      updateMeta('keywords', keywords);
    }
    
    if (title) {
      updateMeta('og:title', title, true);
      updateMeta('twitter:title', title);
    }
    
    if (ogType) {
      updateMeta('og:type', ogType, true);
    }
    
    if (canonical) {
      updateMeta('og:url', canonical, true);
      // Update canonical link
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonical);
    }
    
    if (ogImage) {
      updateMeta('og:image', ogImage, true);
      updateMeta('twitter:image', ogImage);
    }
    
    updateMeta('og:site_name', SITE_NAME, true);
    
  }, [title, description, keywords, canonical, ogType, ogImage]);
};

// Home Page SEO
const HomeSEO = () => {
  useSEO({
    title: "TopTube World Pro - Global YouTube Channel Rankings & Analytics",
    description: "Track and analyze the most subscribed YouTube channels worldwide. Real-time rankings, growth predictions, and analytics for 197 countries. Discover top YouTubers by country.",
    keywords: "YouTube rankings, most subscribed YouTubers, top YouTube channels, YouTube analytics, subscriber count, YouTube growth tracker, global YouTube statistics",
    canonical: SITE_URL
  });
  
  const schemaData = {
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
  };
  
  return <JsonLd data={schemaData} />;
};

// Country Page SEO
const CountrySEO = ({ country, channels }) => {
  const topChannel = channels?.[0];
  const channelCount = channels?.length || 0;
  
  const title = country ? `Top YouTube Channels in ${country.name} ${country.flag_emoji} - Most Subscribed YouTubers ${new Date().getFullYear()}` : "";
  const description = country ? `Discover the ${channelCount} most subscribed YouTube channels in ${country.name}. ${topChannel ? `#1 is ${topChannel.title} with ${formatNumber(topChannel.subscriber_count)} subscribers.` : ''} Real-time rankings and growth analytics.` : "";
  const keywords = country ? `top YouTube channels ${country.name}, most subscribed YouTubers ${country.name}, ${country.name} YouTube rankings, popular YouTubers in ${country.name}, ${country.name} YouTube statistics, best YouTubers ${country.name}` : "";
  const pageUrl = country ? `${SITE_URL}/country/${country.code}` : "";
  
  useSEO({
    title,
    description,
    keywords,
    canonical: pageUrl
  });
  
  if (!country) return null;
  
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

  return <JsonLd data={schemaData} />;
};

// Channel Page SEO
const ChannelSEO = ({ channel }) => {
  const title = channel ? `${channel.title} - YouTube Channel Stats & Analytics | ${formatNumber(channel.subscriber_count)} Subscribers` : "";
  const description = channel ? `${channel.title} YouTube channel statistics: ${formatNumber(channel.subscriber_count)} subscribers, ${formatNumber(channel.view_count)} total views, ${channel.video_count} videos. From ${channel.country_name}. Track growth and rankings.` : "";
  const keywords = channel ? `${channel.title}, ${channel.title} subscribers, ${channel.title} stats, ${channel.title} YouTube, ${channel.country_name} YouTuber, YouTube channel analytics` : "";
  const pageUrl = channel ? `${SITE_URL}/channel/${channel.channel_id}` : "";
  
  useSEO({
    title,
    description,
    keywords,
    canonical: pageUrl,
    ogType: "profile",
    ogImage: channel?.thumbnail_url
  });
  
  if (!channel) return null;
  
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

  return <JsonLd data={schemaData} />;
};

// Leaderboard Page SEO
const LeaderboardSEO = ({ totalChannels }) => {
  const title = `Global YouTube Leaderboard - Top ${totalChannels || 100} Most Subscribed Channels ${new Date().getFullYear()}`;
  const description = `Complete ranking of the world's most subscribed YouTube channels. Live subscriber counts, daily growth, and viral status for ${totalChannels || 100}+ channels. Updated in real-time.`;
  const pageUrl = `${SITE_URL}/leaderboard`;
  
  useSEO({
    title,
    description,
    keywords: "YouTube leaderboard, most subscribed YouTube channels, top YouTubers worldwide, global YouTube rankings, YouTube subscriber count, biggest YouTube channels",
    canonical: pageUrl
  });
  
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Global YouTube Channel Leaderboard",
    "description": description,
    "url": pageUrl,
    "numberOfItems": totalChannels || 100
  };
  
  return <JsonLd data={schemaData} />;
};

// Countries List Page SEO
const CountriesListSEO = ({ totalCountries }) => {
  const title = `YouTube Rankings by Country - Browse ${totalCountries || 197} Countries | TopTube World Pro`;
  const description = `Explore YouTube channel rankings for ${totalCountries || 197} countries worldwide. Find the most subscribed YouTubers in any country. Real-time subscriber counts and growth analytics.`;
  const pageUrl = `${SITE_URL}/countries`;
  
  useSEO({
    title,
    description,
    keywords: "YouTube by country, YouTubers by country, top channels by country, YouTube rankings countries, international YouTubers, YouTube statistics by country",
    canonical: pageUrl
  });
  
  return null;
};

// Trending Page SEO
const TrendingSEO = () => {
  useSEO({
    title: `Trending YouTube Channels - Fastest Growing YouTubers ${new Date().getFullYear()}`,
    description: "Discover the fastest growing YouTube channels right now. See which YouTubers are gaining subscribers the fastest with real-time growth analytics and viral predictions.",
    keywords: "trending YouTube channels, fastest growing YouTubers, viral YouTube channels, YouTube growth, rising YouTubers, YouTube trending, biggest daily gains",
    canonical: `${SITE_URL}/trending`
  });
  
  return null;
};

// Top 100 Page SEO
const Top100SEO = ({ channels }) => {
  const year = new Date().getFullYear();
  const title = `Top 100 Most Subscribed YouTube Channels ${year} - Global Rankings`;
  const description = `Complete list of the top 100 most subscribed YouTube channels in ${year}. ${channels?.[0]?.title || 'MrBeast'} leads with ${formatNumber(channels?.[0]?.subscriber_count || 0)} subscribers. Live rankings updated daily.`;
  
  useSEO({
    title,
    description,
    keywords: "top 100 YouTube channels, most subscribed YouTube channels, top 100 YouTubers, biggest YouTube channels, YouTube subscriber rankings, top YouTubers list",
    canonical: `${SITE_URL}/top-100`
  });
  
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Top 100 Most Subscribed YouTube Channels ${year}`,
    "description": description,
    "url": `${SITE_URL}/top-100`,
    "numberOfItems": 100,
    "itemListElement": channels?.slice(0, 100).map((channel, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "item": {
        "@type": "Organization",
        "name": channel.title,
        "url": `https://youtube.com/channel/${channel.channel_id}`,
        "description": `#${idx + 1} most subscribed YouTube channel with ${formatNumber(channel.subscriber_count)} subscribers`,
        "image": channel.thumbnail_url
      }
    })) || []
  };
  
  return <JsonLd data={schemaData} />;
};

// ==================== BREADCRUMB COMPONENT ====================

const Breadcrumb = ({ items }) => {
  // Generate JSON-LD schema for breadcrumbs
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "name": item.label,
      "item": item.href ? `${SITE_URL}${item.href}` : undefined
    }))
  };

  return (
    <>
      <JsonLd data={schemaData} />
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center gap-2 text-sm text-gray-400">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-center gap-2">
              {idx > 0 && <ChevronRight className="w-3 h-3" />}
              {item.href ? (
                <Link 
                  to={item.href} 
                  className="hover:text-white transition-colors"
                  title={item.label}
                >
                  {idx === 0 && <Home className="w-4 h-4 inline mr-1" />}
                  {item.label}
                </Link>
              ) : (
                <span className="text-gray-300">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
};

// ==================== FAQ SCHEMA COMPONENT ====================

const FAQSchema = ({ faqs }) => {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return <JsonLd data={schemaData} />;
};

// FAQ Section UI Component
const FAQSection = ({ faqs, title = "Frequently Asked Questions" }) => {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="bg-[#111] border border-[#222] rounded-lg p-6" data-testid="faq-section">
      <FAQSchema faqs={faqs} />
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-red-500" />
        {title}
      </h2>
      <div className="space-y-3">
        {faqs.map((faq, idx) => (
          <div key={idx} className="border border-[#222] rounded-lg overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-[#1a1a1a] transition-colors"
              aria-expanded={openIndex === idx}
            >
              <span className="font-medium text-white pr-4">{faq.question}</span>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openIndex === idx ? 'rotate-180' : ''}`} />
            </button>
            {openIndex === idx && (
              <div className="px-4 pb-4 text-gray-400 text-sm leading-relaxed">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

// ==================== STATIC PAGES FOR ADSENSE ====================

// About Page
const AboutPage = () => {
  useSEO({
    title: "About TopTube World Pro - YouTube Channel Rankings Platform",
    description: "Learn about TopTube World Pro, the leading platform for tracking and analyzing YouTube channel rankings across 197 countries worldwide.",
    keywords: "about TopTube World Pro, YouTube analytics platform, YouTube rankings website",
    canonical: `${SITE_URL}/about`
  });

  return (
    <div className="py-12" data-testid="about-page">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-white mb-8">About TopTube World Pro</h1>
        
        <div className="bg-[#111] border border-[#222] rounded-lg p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Our Mission</h2>
            <p className="text-gray-300 leading-relaxed">
              TopTube World Pro is dedicated to providing the most comprehensive and accurate YouTube channel 
              analytics platform. We track, rank, and predict the growth of the most subscribed YouTube channels 
              across 197 countries in real-time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">What We Offer</h2>
            <ul className="text-gray-300 space-y-3">
              <li className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                <span><strong>Global Coverage:</strong> Track YouTube channels from every country in the world with localized rankings and insights.</span>
              </li>
              <li className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                <span><strong>Real-time Analytics:</strong> Get up-to-date subscriber counts, view statistics, and growth metrics refreshed automatically.</span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0" />
                <span><strong>Viral Predictions:</strong> Our algorithm identifies channels that are "Exploding", "Rising Fast", "Stable", or "Slowing".</span>
              </li>
              <li className="flex items-start gap-3">
                <BarChart3 className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                <span><strong>Historical Data:</strong> View growth charts and track how channels have performed over time.</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Data Sources</h2>
            <p className="text-gray-300 leading-relaxed">
              All channel data is sourced directly from the official YouTube Data API v3, ensuring accuracy 
              and reliability. Our systems automatically refresh data every 6 hours and update rankings every 
              10 minutes to provide you with the most current information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Who Uses TopTube World Pro?</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[#0d0d0d] rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">Content Creators</h3>
                <p className="text-gray-400 text-sm">Track competitors and identify trends in your niche.</p>
              </div>
              <div className="bg-[#0d0d0d] rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">Marketing Professionals</h3>
                <p className="text-gray-400 text-sm">Find influencers by country for targeted campaigns.</p>
              </div>
              <div className="bg-[#0d0d0d] rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">Data Analysts</h3>
                <p className="text-gray-400 text-sm">Research YouTube trends and growth patterns.</p>
              </div>
              <div className="bg-[#0d0d0d] rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">YouTube Enthusiasts</h3>
                <p className="text-gray-400 text-sm">Stay updated on your favorite creators' growth.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

// Privacy Policy Page
const PrivacyPage = () => {
  useSEO({
    title: "Privacy Policy - TopTube World Pro",
    description: "Read our privacy policy to understand how TopTube World Pro collects, uses, and protects your data.",
    keywords: "privacy policy, data protection, TopTube World Pro privacy",
    canonical: `${SITE_URL}/privacy`
  });

  return (
    <div className="py-12" data-testid="privacy-page">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        <p className="text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        
        <div className="bg-[#111] border border-[#222] rounded-lg p-8 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Information We Collect</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              TopTube World Pro collects minimal information to provide our services:
            </p>
            <ul className="text-gray-300 list-disc list-inside space-y-2">
              <li><strong>Usage Data:</strong> We collect anonymous usage statistics such as pages visited, time spent on site, and general location (country level).</li>
              <li><strong>Cookies:</strong> We use essential cookies to ensure the website functions properly and analytics cookies to improve our services.</li>
              <li><strong>YouTube Data:</strong> All YouTube channel data displayed is publicly available information obtained through the official YouTube Data API.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
            <ul className="text-gray-300 list-disc list-inside space-y-2">
              <li>To provide and maintain our service</li>
              <li>To analyze usage patterns and improve user experience</li>
              <li>To detect and prevent technical issues</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Data Sharing</h2>
            <p className="text-gray-300 leading-relaxed">
              We do not sell, trade, or rent your personal information to third parties. We may share 
              anonymous, aggregated statistics with partners for analytical purposes. We use Google 
              Analytics to understand how visitors use our site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Third-Party Services</h2>
            <p className="text-gray-300 leading-relaxed">
              Our service integrates with third-party services including:
            </p>
            <ul className="text-gray-300 list-disc list-inside space-y-2 mt-2">
              <li><strong>YouTube Data API:</strong> To fetch publicly available channel statistics</li>
              <li><strong>Google Analytics:</strong> To analyze website traffic and usage patterns</li>
              <li><strong>Google AdSense:</strong> To display relevant advertisements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Cookies</h2>
            <p className="text-gray-300 leading-relaxed">
              We use cookies and similar tracking technologies to track activity on our website. You can 
              instruct your browser to refuse all cookies or indicate when a cookie is being sent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Data Security</h2>
            <p className="text-gray-300 leading-relaxed">
              We implement appropriate security measures to protect against unauthorized access, alteration, 
              disclosure, or destruction of data. However, no method of transmission over the Internet is 
              100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Your Rights</h2>
            <p className="text-gray-300 leading-relaxed">
              You have the right to access, correct, or delete any personal data we hold about you. 
              Contact us at anikhasan1100@gmail.com for any privacy-related requests.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Changes to This Policy</h2>
            <p className="text-gray-300 leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any changes by 
              posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

// Terms of Service Page
const TermsPage = () => {
  useSEO({
    title: "Terms of Service - TopTube World Pro",
    description: "Read the terms and conditions for using TopTube World Pro's YouTube channel analytics platform.",
    keywords: "terms of service, terms and conditions, TopTube World Pro terms",
    canonical: `${SITE_URL}/terms`
  });

  return (
    <div className="py-12" data-testid="terms-page">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
        <p className="text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        
        <div className="bg-[#111] border border-[#222] rounded-lg p-8 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              By accessing and using TopTube World Pro, you accept and agree to be bound by these Terms of 
              Service. If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p className="text-gray-300 leading-relaxed">
              TopTube World Pro provides YouTube channel analytics, rankings, and growth predictions. 
              Our service aggregates publicly available data from YouTube to provide insights about 
              channel performance across different countries.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Use of Service</h2>
            <p className="text-gray-300 leading-relaxed mb-4">You agree to use our service only for lawful purposes. You may not:</p>
            <ul className="text-gray-300 list-disc list-inside space-y-2">
              <li>Use automated systems to scrape or extract data without permission</li>
              <li>Attempt to interfere with or disrupt the service</li>
              <li>Use the service for any illegal or unauthorized purpose</li>
              <li>Misrepresent your identity or affiliation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Intellectual Property</h2>
            <p className="text-gray-300 leading-relaxed">
              The TopTube World Pro name, logo, and all related content are protected by intellectual 
              property laws. YouTube channel data and thumbnails remain the property of their respective 
              owners and YouTube.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Disclaimer of Warranties</h2>
            <p className="text-gray-300 leading-relaxed">
              Our service is provided "as is" without warranties of any kind. We do not guarantee the 
              accuracy, completeness, or timeliness of the data displayed. YouTube channel statistics 
              may vary from official YouTube figures due to API limitations and refresh timing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Limitation of Liability</h2>
            <p className="text-gray-300 leading-relaxed">
              TopTube World Pro shall not be liable for any indirect, incidental, special, consequential, 
              or punitive damages resulting from your use of or inability to use the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Third-Party Links</h2>
            <p className="text-gray-300 leading-relaxed">
              Our service contains links to YouTube and other third-party websites. We are not responsible 
              for the content or practices of these external sites.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Changes to Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              We reserve the right to modify these terms at any time. Continued use of the service after 
              changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Contact</h2>
            <p className="text-gray-300 leading-relaxed">
              For questions about these Terms of Service, please contact us at anikhasan1100@gmail.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

// Contact Page
const ContactPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useSEO({
    title: "Contact Us - TopTube World Pro",
    description: "Get in touch with TopTube World Pro. Contact us for support, feedback, or business inquiries.",
    keywords: "contact TopTube World Pro, support, feedback, business inquiries",
    canonical: `${SITE_URL}/contact`
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API}/contact`, formData);
      if (response.data.status === 'success') {
        setSubmitted(true);
      }
    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error('Contact form error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-12" data-testid="contact-page">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-white mb-8">Contact Us</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-[#111] border border-[#222] rounded-lg p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Send us a message</h2>
            
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Message Sent!</h3>
                <p className="text-gray-400">Thank you for reaching out. We'll get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-4 py-3 text-white focus:border-red-500 focus:outline-none"
                    placeholder="Your name"
                    data-testid="contact-name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-4 py-3 text-white focus:border-red-500 focus:outline-none"
                    placeholder="your@email.com"
                    data-testid="contact-email"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Subject</label>
                  <select
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-4 py-3 text-white focus:border-red-500 focus:outline-none"
                    data-testid="contact-subject"
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="feedback">Feedback</option>
                    <option value="business">Business Inquiry</option>
                    <option value="data">Data Correction Request</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Message</label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    rows={5}
                    className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-4 py-3 text-white focus:border-red-500 focus:outline-none resize-none"
                    placeholder="How can we help you?"
                    data-testid="contact-message"
                  />
                </div>
                {error && (
                  <div className="text-red-500 text-sm">{error}</div>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="contact-submit"
                >
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-[#111] border border-[#222] rounded-lg p-6">
              <h3 className="font-semibold text-white mb-4">General Inquiries</h3>
              <p className="text-gray-400 text-sm mb-2">For general questions and information:</p>
              <a href="mailto:anikhasan1100@gmail.com" className="text-red-500 hover:text-red-400">
                anikhasan1100@gmail.com
              </a>
            </div>

            <div className="bg-[#111] border border-[#222] rounded-lg p-6">
              <h3 className="font-semibold text-white mb-4">Technical Support</h3>
              <p className="text-gray-400 text-sm mb-2">Need help with the platform?</p>
              <a href="mailto:anikhasan1100@gmail.com" className="text-red-500 hover:text-red-400">
                anikhasan1100@gmail.com
              </a>
            </div>

            <div className="bg-[#111] border border-[#222] rounded-lg p-6">
              <h3 className="font-semibold text-white mb-4">Business & Partnerships</h3>
              <p className="text-gray-400 text-sm mb-2">For business opportunities:</p>
              <a href="mailto:anikhasan1100@gmail.com" className="text-red-500 hover:text-red-400">
                anikhasan1100@gmail.com
              </a>
            </div>

            <div className="bg-[#111] border border-[#222] rounded-lg p-6">
              <h3 className="font-semibold text-white mb-4">Response Time</h3>
              <p className="text-gray-400 text-sm">
                We typically respond to all inquiries within 24-48 business hours. For urgent matters, 
                please include "URGENT" in your subject line.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Header Component
const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await axios.get(`${API}/channels?search=${encodeURIComponent(query)}&limit=5`);
      setSearchResults(response.data.channels || []);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const handleSelectResult = (channelId) => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    navigate(`/channel/${channelId}`);
  };

  return (
    <header className="bg-[#0d0d0d] border-b border-[#1a1a1a] sticky top-0 z-50" data-testid="header">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
              <PlayCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white hidden sm:block">TopTube World Pro</span>
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
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
            <Link to="/compare" className="text-gray-300 hover:text-white transition-colors" data-testid="nav-compare">
              Compare
            </Link>
            <Link to="/blog" className="text-gray-300 hover:text-white transition-colors" data-testid="nav-blog">
              Blog
            </Link>
          </nav>
          
          {/* Search & Favorites */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/favorites" className="p-2 text-gray-300 dark:text-gray-300 hover:text-red-500 transition-colors" data-testid="nav-favorites">
              <Heart className="w-5 h-5" />
            </Link>
            <div className="relative">
              <button 
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-gray-300 dark:text-gray-300 hover:text-white transition-colors"
                data-testid="search-toggle"
              >
                <Search className="w-5 h-5" />
              </button>
              
              {/* Search Dropdown */}
              {searchOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-lg shadow-xl overflow-hidden z-50">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search channels..."
                    className="w-full bg-gray-50 dark:bg-[#0d0d0d] px-4 py-3 text-gray-900 dark:text-white focus:outline-none"
                    autoFocus
                    data-testid="global-search-input"
                  />
                  {searchResults.length > 0 && (
                    <div className="max-h-64 overflow-y-auto">
                      {searchResults.map(channel => (
                        <button
                          key={channel.channel_id}
                          onClick={() => handleSelectResult(channel.channel_id)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors text-left"
                        >
                          <img src={channel.thumbnail_url} alt="" className="w-8 h-8 rounded-full" />
                          <div>
                            <div className="text-gray-900 dark:text-white text-sm font-medium">{channel.title}</div>
                            <div className="text-gray-500 text-xs">{formatNumber(channel.subscriber_count)} subs</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-gray-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-[#1a1a1a]">
            <div className="flex flex-col gap-4">
              <Link to="/" className="text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Home</Link>
              <Link to="/leaderboard" className="text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Leaderboard</Link>
              <Link to="/countries" className="text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Countries</Link>
              <Link to="/trending" className="text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Trending</Link>
              <Link to="/compare" className="text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Compare</Link>
              <Link to="/favorites" className="text-gray-300 hover:text-white flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                <Heart className="w-4 h-4" /> Favorites
              </Link>
              <Link to="/blog" className="text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
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
            <li><Link to="/top-100" className="text-gray-400 hover:text-white">Top 100 YouTubers</Link></li>
            <li><Link to="/leaderboard" className="text-gray-400 hover:text-white">Global Leaderboard</Link></li>
            <li><Link to="/trending" className="text-gray-400 hover:text-white">Fastest Growing</Link></li>
            <li><Link to="/countries" className="text-gray-400 hover:text-white">By Country</Link></li>
            <li><Link to="/compare" className="text-gray-400 hover:text-white">Compare Channels</Link></li>
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
          <h4 className="font-semibold text-white mb-4">Resources</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/blog" className="text-gray-400 hover:text-white">Blog & Insights</Link></li>
            <li><Link to="/favorites" className="text-gray-400 hover:text-white">My Favorites</Link></li>
            <li><Link to="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
            <li><Link to="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
            <li><Link to="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
            <li><Link to="/terms" className="text-gray-400 hover:text-white">Terms of Service</Link></li>
          </ul>
        </div>
        
        {/* Newsletter Signup in Footer */}
        <div>
          <h4 className="font-semibold text-white mb-4">Newsletter</h4>
          <p className="text-gray-400 text-sm mb-3">Get weekly ranking updates</p>
          <NewsletterSignup compact={true} />
        </div>
      </div>
      <div className="border-t border-[#1a1a1a] mt-8 pt-8 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} TopTube World Pro. All rights reserved. Data sourced from YouTube Data API.
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
      
      {/* Newsletter Signup */}
      <section className="py-12 bg-[#0a0a0a]">
        <div className="max-w-2xl mx-auto px-4">
          <NewsletterSignup />
        </div>
      </section>
      
      {/* Ad Banner */}
      <section className="max-w-6xl mx-auto px-4">
        <HorizontalAd />
      </section>
    </div>
  );
};

// Global Leaderboard Page
const LeaderboardPage = () => {
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [filteredChannels, setFilteredChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('subscribers');
  const [filterCountry, setFilterCountry] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [channelsRes, countriesRes] = await Promise.all([
          axios.get(`${API}/leaderboard/global?limit=500`),
          axios.get(`${API}/countries`)
        ]);
        setChannels(channelsRes.data.channels || []);
        setFilteredChannels(channelsRes.data.channels || []);
        setCountries(countriesRes.data || []);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter and sort logic
  useEffect(() => {
    let result = [...channels];
    
    // Search filter
    if (searchQuery) {
      result = result.filter(c => 
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.country_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Country filter
    if (filterCountry !== 'all') {
      result = result.filter(c => c.country_code === filterCountry);
    }
    
    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter(c => c.viral_label === filterStatus);
    }
    
    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'subscribers':
          return (b.subscriber_count || 0) - (a.subscriber_count || 0);
        case 'growth':
          return (b.daily_growth_percent || 0) - (a.daily_growth_percent || 0);
        case 'gains':
          return (b.daily_subscriber_gain || 0) - (a.daily_subscriber_gain || 0);
        case 'name':
          return (a.title || '').localeCompare(b.title || '');
        default:
          return 0;
      }
    });
    
    setFilteredChannels(result);
  }, [channels, searchQuery, sortBy, filterCountry, filterStatus]);

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
        
        {/* Search and Filter Bar */}
        <div className="bg-[#111] border border-[#222] rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search channels..."
                className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg pl-10 pr-4 py-2 text-white focus:border-red-500 focus:outline-none"
                data-testid="search-input"
              />
            </div>
            
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#0d0d0d] border border-[#333] rounded-lg px-4 py-2 text-white focus:border-red-500 focus:outline-none"
              data-testid="sort-select"
            >
              <option value="subscribers">Sort: Subscribers</option>
              <option value="growth">Sort: Growth %</option>
              <option value="gains">Sort: 24h Gains</option>
              <option value="name">Sort: Name</option>
            </select>
            
            {/* Country Filter */}
            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="bg-[#0d0d0d] border border-[#333] rounded-lg px-4 py-2 text-white focus:border-red-500 focus:outline-none"
              data-testid="country-filter"
            >
              <option value="all">All Countries</option>
              {countries.filter(c => c.channel_count > 0).map(c => (
                <option key={c.code} value={c.code}>{c.flag_emoji} {c.name}</option>
              ))}
            </select>
            
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[#0d0d0d] border border-[#333] rounded-lg px-4 py-2 text-white focus:border-red-500 focus:outline-none"
              data-testid="status-filter"
            >
              <option value="all">All Status</option>
              <option value="Exploding">🔥 Exploding</option>
              <option value="Rising Fast">📈 Rising Fast</option>
              <option value="Stable">➡️ Stable</option>
              <option value="Slowing">📉 Slowing</option>
            </select>
          </div>
          
          <div className="mt-3 text-sm text-gray-500">
            Showing {filteredChannels.length} of {channels.length} channels
          </div>
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
              {filteredChannels.map((channel, idx) => (
                <React.Fragment key={channel.channel_id}>
                  {/* In-feed ad every 10 rows */}
                  <InFeedAd index={idx} />
                  <tr 
                    className="hover:bg-[#1a1a1a] cursor-pointer transition-colors"
                    onClick={() => navigate(`/channel/${channel.channel_id}`)}
                    data-testid={`leaderboard-row-${idx}`}
                  >
                    <td className="px-4 py-4 font-bold text-gray-400">#{idx + 1}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <img src={channel.thumbnail_url || "https://via.placeholder.com/40"} alt="" className="w-10 h-10 rounded-full" loading="lazy" />
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
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {filteredChannels.map((channel, idx) => (
            <ChannelCard key={channel.channel_id} channel={channel} rank={idx + 1} onClick={() => navigate(`/channel/${channel.channel_id}`)} />
          ))}
        </div>
      </div>
    </div>
  );
};

// ==================== TOP 100 PAGE (High Traffic SEO Page) ====================
const Top100Page = () => {
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API}/leaderboard/global?limit=100`);
        setChannels(response.data.channels || []);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const year = new Date().getFullYear();
  
  // Generate FAQs for this page
  const faqs = channels.length > 0 ? [
    {
      question: `Who is the #1 most subscribed YouTuber in ${year}?`,
      answer: `${channels[0]?.title} is currently the most subscribed YouTube channel with ${formatNumber(channels[0]?.subscriber_count)} subscribers, followed by ${channels[1]?.title} with ${formatNumber(channels[1]?.subscriber_count)} subscribers.`
    },
    {
      question: "How often are the rankings updated?",
      answer: "Our rankings are updated every 10 minutes with live subscriber counts from the YouTube API. Daily growth metrics are calculated hourly."
    },
    {
      question: "What channels are included in the Top 100?",
      answer: "The Top 100 includes all types of YouTube channels - individual creators, music labels, entertainment companies, and brand channels from around the world, ranked purely by subscriber count."
    },
    {
      question: `Which country has the most Top 100 YouTubers in ${year}?`,
      answer: `Based on current rankings, the United States and India have the most channels in the Top 100 list, reflecting the large YouTube creator ecosystems in both countries.`
    }
  ] : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-8" data-testid="top-100-page">
      <Top100SEO channels={channels} />
      <div className="max-w-6xl mx-auto px-4">
        {/* Breadcrumb */}
        <Breadcrumb items={[
          { label: "Home", href: "/" },
          { label: "Leaderboard", href: "/leaderboard" },
          { label: "Top 100" }
        ]} />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Top 100 Most Subscribed YouTube Channels {year}
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            The definitive list of the world's biggest YouTube channels, updated in real-time
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#111] border border-[#222] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{formatNumber(channels.reduce((sum, c) => sum + (c.subscriber_count || 0), 0))}</div>
            <div className="text-gray-500 text-sm">Combined Subscribers</div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">+{formatNumber(channels.reduce((sum, c) => sum + (c.daily_subscriber_gain || 0), 0))}</div>
            <div className="text-gray-500 text-sm">24h Combined Growth</div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{new Set(channels.map(c => c.country_code)).size}</div>
            <div className="text-gray-500 text-sm">Countries Represented</div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{channels.filter(c => c.viral_label === 'Exploding').length}</div>
            <div className="text-gray-500 text-sm">Viral Channels</div>
          </div>
        </div>

        {/* Top 3 Spotlight */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {channels.slice(0, 3).map((channel, idx) => (
            <div
              key={channel.channel_id}
              className={`bg-gradient-to-br ${
                idx === 0 ? 'from-yellow-900/30 to-yellow-600/10 border-yellow-600/50' :
                idx === 1 ? 'from-gray-700/30 to-gray-500/10 border-gray-500/50' :
                'from-orange-900/30 to-orange-600/10 border-orange-600/50'
              } border rounded-xl p-6 cursor-pointer hover:scale-[1.02] transition-transform`}
              onClick={() => navigate(`/channel/${channel.channel_id}`)}
              data-testid={`top3-${idx}`}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img 
                    src={channel.thumbnail_url || "https://via.placeholder.com/80"} 
                    alt={channel.title}
                    className="w-16 h-16 rounded-full border-2 border-white/20"
                  />
                  <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold ${
                    idx === 0 ? 'bg-yellow-500 text-black' :
                    idx === 1 ? 'bg-gray-400 text-black' :
                    'bg-orange-600 text-white'
                  }`}>
                    {idx + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-white text-lg truncate">{channel.title}</h2>
                  <p className="text-gray-400 text-sm">{channel.country_name}</p>
                  <p className="text-2xl font-bold text-white">{formatNumber(channel.subscriber_count)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Full List */}
        <div className="bg-[#111] border border-[#222] rounded-lg overflow-hidden mb-8">
          <div className="px-4 py-3 border-b border-[#222] bg-[#0a0a0a]">
            <h2 className="font-bold text-white">Complete Top 100 Rankings</h2>
          </div>
          <div className="divide-y divide-[#222]">
            {channels.map((channel, idx) => (
              <div
                key={channel.channel_id}
                className="px-4 py-4 hover:bg-[#1a1a1a] cursor-pointer flex items-center gap-4 transition-colors"
                onClick={() => navigate(`/channel/${channel.channel_id}`)}
                data-testid={`rank-${idx + 1}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  idx < 3 ? 'bg-gradient-to-br from-yellow-500 to-yellow-700 text-black' :
                  idx < 10 ? 'bg-gradient-to-br from-red-600 to-red-800 text-white' :
                  'bg-[#222] text-gray-400'
                }`}>
                  {idx + 1}
                </div>
                <img 
                  src={channel.thumbnail_url || "https://via.placeholder.com/48"} 
                  alt={channel.title}
                  className="w-12 h-12 rounded-full"
                  loading="lazy"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{channel.title}</div>
                  <div className="text-sm text-gray-500">{channel.country_name}</div>
                </div>
                <div className="hidden md:block">
                  <ViralBadge label={channel.viral_label} />
                </div>
                <div className="text-right">
                  <div className="font-bold text-white">{formatNumber(channel.subscriber_count)}</div>
                  <div className={`text-sm ${(channel.daily_subscriber_gain || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {channel.daily_subscriber_gain >= 0 ? '+' : ''}{formatNumber(channel.daily_subscriber_gain || 0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        {faqs.length > 0 && (
          <FAQSection faqs={faqs} title="Frequently Asked Questions about Top 100 YouTubers" />
        )}

        {/* Internal Links */}
        <nav className="mt-8 bg-[#111] border border-[#222] rounded-lg p-6" aria-label="Related pages">
          <h2 className="text-lg font-bold text-white mb-4">Explore More Rankings</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/leaderboard" className="text-gray-300 hover:text-red-400 text-sm">Full Global Leaderboard →</Link>
            <Link to="/trending" className="text-gray-300 hover:text-red-400 text-sm">Fastest Growing Channels →</Link>
            <Link to="/countries" className="text-gray-300 hover:text-red-400 text-sm">Rankings by Country →</Link>
            <Link to="/compare" className="text-gray-300 hover:text-red-400 text-sm">Compare Channels →</Link>
          </div>
        </nav>
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
  const [neighbors, setNeighbors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [countryRes, neighborsRes] = await Promise.all([
          axios.get(`${API}/countries/${countryCode}`),
          axios.get(`${API}/countries/${countryCode}/neighbors?limit=8`).catch(() => ({ data: { neighbors: [] } }))
        ]);
        setCountry(countryRes.data);
        setNeighbors(neighborsRes.data.neighbors || []);
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

  // Generate country-specific FAQs
  const countryFaqs = country && country.channels?.length > 0 ? [
    {
      question: `Who is the most subscribed YouTuber in ${country.name}?`,
      answer: `${country.channels[0]?.title} is the most subscribed YouTube channel in ${country.name} with ${formatNumber(country.channels[0]?.subscriber_count)} subscribers${country.channels[1] ? `, followed by ${country.channels[1]?.title} with ${formatNumber(country.channels[1]?.subscriber_count)} subscribers` : ''}.`
    },
    {
      question: `How many YouTube channels are tracked in ${country.name}?`,
      answer: `We currently track ${country.channels?.length || 0} of the top YouTube channels from ${country.name}. Our database is updated every 6 hours with the latest subscriber counts and growth data.`
    },
    {
      question: `Which ${country.name} YouTuber is growing the fastest?`,
      answer: country.channels?.find(c => c.daily_growth_percent > 0) 
        ? `Among tracked channels, those with "Exploding" or "Rising" status are growing fastest. Check the individual channel pages for detailed growth analytics.`
        : `Visit individual channel pages to see detailed growth metrics including daily, weekly, and monthly subscriber gains.`
    }
  ] : [];

  return (
    <div className="py-8" data-testid="country-detail-page">
      <CountrySEO country={country} channels={country.channels} />
      <div className="max-w-6xl mx-auto px-4">
        {/* Breadcrumb */}
        <Breadcrumb items={[
          { label: "Home", href: "/" },
          { label: "Countries", href: "/countries" },
          { label: country.name }
        ]} />

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
        
        {/* Internal Links - SEO Optimized */}
        <nav className="mt-8 space-y-6" aria-label="Related content">
          {/* Neighboring Countries - Same Region */}
          {neighbors.length > 0 && (
            <section className="bg-[#111] border border-[#222] rounded-lg p-6" data-testid="neighboring-countries">
              <h2 className="text-xl font-bold text-white mb-4">
                Top YouTube Channels in {country.region}
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                Explore YouTube statistics from other countries in {country.region}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {neighbors.map((neighbor) => (
                  <Link
                    key={neighbor.code}
                    to={`/country/${neighbor.code}`}
                    className="group bg-[#0a0a0a] border border-[#222] rounded-lg p-4 hover:border-red-600/50 transition-colors"
                    title={`View top YouTube channels in ${neighbor.name}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{neighbor.flag_emoji}</span>
                      <span className="font-medium text-white group-hover:text-red-400 transition-colors">{neighbor.name}</span>
                    </div>
                    {neighbor.top_channel && (
                      <div className="text-xs text-gray-500">
                        Top: {neighbor.top_channel.title?.slice(0, 20)}{neighbor.top_channel.title?.length > 20 ? '...' : ''} ({formatNumber(neighbor.top_channel.subscriber_count)})
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Popular Channels from This Country */}
          {country.channels?.length > 3 && (
            <section className="bg-[#111] border border-[#222] rounded-lg p-6" data-testid="more-channels">
              <h2 className="text-xl font-bold text-white mb-4">
                More YouTubers from {country.name}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {country.channels.slice(3, 9).map((channel) => (
                  <Link
                    key={channel.channel_id}
                    to={`/channel/${channel.channel_id}`}
                    className="group text-center p-3 rounded-lg hover:bg-[#1a1a1a] transition-colors"
                    title={`${channel.title} YouTube channel statistics`}
                  >
                    <img 
                      src={channel.thumbnail_url || "https://via.placeholder.com/48"} 
                      alt={`${channel.title} profile`}
                      className="w-12 h-12 rounded-full mx-auto mb-2"
                      loading="lazy"
                    />
                    <div className="text-sm text-white group-hover:text-red-400 truncate">{channel.title}</div>
                    <div className="text-xs text-gray-500">{formatNumber(channel.subscriber_count)}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* FAQ Section */}
          {countryFaqs.length > 0 && (
            <FAQSection faqs={countryFaqs} title={`FAQs: YouTube in ${country.name}`} />
          )}

          {/* Site Navigation Links */}
          <section className="bg-[#111] border border-[#222] rounded-lg p-6" data-testid="site-navigation">
            <h2 className="text-lg font-bold text-white mb-4">Discover More</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Popular Countries</h3>
                <div className="space-y-1">
                  <Link to="/country/US" className="block text-sm text-gray-300 hover:text-red-400">🇺🇸 United States Channels</Link>
                  <Link to="/country/IN" className="block text-sm text-gray-300 hover:text-red-400">🇮🇳 India Channels</Link>
                  <Link to="/country/BR" className="block text-sm text-gray-300 hover:text-red-400">🇧🇷 Brazil Channels</Link>
                  <Link to="/country/JP" className="block text-sm text-gray-300 hover:text-red-400">🇯🇵 Japan Channels</Link>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Rankings</h3>
                <div className="space-y-1">
                  <Link to="/leaderboard" className="block text-sm text-gray-300 hover:text-red-400">Global Subscriber Leaderboard</Link>
                  <Link to="/trending" className="block text-sm text-gray-300 hover:text-red-400">Fastest Growing Channels</Link>
                  <Link to="/countries" className="block text-sm text-gray-300 hover:text-red-400">All 197 Countries</Link>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Tools</h3>
                <div className="space-y-1">
                  <Link to="/compare" className="block text-sm text-gray-300 hover:text-red-400">Compare YouTube Channels</Link>
                  <Link to="/search" className="block text-sm text-gray-300 hover:text-red-400">Search Channels</Link>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Resources</h3>
                <div className="space-y-1">
                  <Link to="/blog" className="block text-sm text-gray-300 hover:text-red-400">YouTube Insights Blog</Link>
                  <Link to="/about" className="block text-sm text-gray-300 hover:text-red-400">About TopTube World</Link>
                  <Link to="/contact" className="block text-sm text-gray-300 hover:text-red-400">Contact Us</Link>
                </div>
              </div>
            </div>
          </section>
        </nav>
      </div>
    </div>
  );
};

// Channel Detail Page
const ChannelPage = () => {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const [channel, setChannel] = useState(null);
  const [relatedChannels, setRelatedChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [channelRes, relatedRes] = await Promise.all([
          axios.get(`${API}/channels/${channelId}`),
          axios.get(`${API}/channels/${channelId}/related?limit=6`).catch(() => ({ data: { related_channels: [] } }))
        ]);
        setChannel(channelRes.data);
        setRelatedChannels(relatedRes.data.related_channels || []);
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

  // Generate channel-specific FAQs
  const channelFaqs = [
    {
      question: `How many subscribers does ${channel.title} have?`,
      answer: `${channel.title} currently has ${formatNumber(channel.subscriber_count)} subscribers on YouTube, making them ${channel.current_rank ? `#${channel.current_rank} in ${channel.country_name}` : `one of the top channels from ${channel.country_name}`}. They have uploaded ${channel.video_count} videos with a total of ${formatNumber(channel.view_count)} views.`
    },
    {
      question: `Is ${channel.title} growing?`,
      answer: `${channel.title} gained ${channel.daily_subscriber_gain >= 0 ? '+' : ''}${formatNumber(channel.daily_subscriber_gain || 0)} subscribers in the last 24 hours (${channel.daily_growth_percent >= 0 ? '+' : ''}${(channel.daily_growth_percent || 0).toFixed(4)}% growth). Their viral status is "${channel.viral_label || 'Stable'}".`
    },
    {
      question: `What country is ${channel.title} from?`,
      answer: `${channel.title} is a YouTube channel from ${channel.country_name}. You can explore more top YouTube channels from ${channel.country_name} on our country page.`
    }
  ];

  return (
    <div className="py-8" data-testid="channel-detail-page">
      <ChannelSEO channel={channel} />
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <Breadcrumb items={[
          { label: "Home", href: "/" },
          { label: channel.country_name, href: `/country/${channel.country_code}` },
          { label: channel.title }
        ]} />

        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1">
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
                <FavoriteButton 
                  channel={channel}
                  isFavorite={isFavorite(channel.channel_id)}
                  onToggle={toggleFavorite}
                  size="lg"
                />
                <LiveIndicator />
              </div>
              <p className="text-gray-500 mb-3">
                <Link to={`/country/${channel.country_code}`} className="hover:text-white">{channel.country_name}</Link>
                {channel.current_rank && ` • Rank #${channel.current_rank}`}
                <LastUpdatedIndicator timestamp={channel.updated_at} className="ml-3 inline-flex" />
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
              
              {/* Social Sharing */}
              <div className="mt-4 pt-4 border-t border-[#222]">
                <SocialShareButtons 
                  url={`${BACKEND_URL}/channel/${channel.channel_id}`}
                  title={`${channel.title} - ${formatNumber(channel.subscriber_count)} subscribers on YouTube`}
                  description={`Check out ${channel.title}'s YouTube stats: ${formatNumber(channel.subscriber_count)} subscribers, ${formatNumber(channel.view_count)} views`}
                />
              </div>
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
          <div className="bg-[#111] border border-[#222] rounded-lg p-6 mb-8">
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
                  <img src={video.thumbnail_url} alt="" className="w-full rounded-lg mb-2" loading="lazy" />
                  <h4 className="font-medium text-white text-sm line-clamp-2 mb-1">{video.title}</h4>
                  <p className="text-gray-500 text-xs">{formatNumber(video.view_count)} views • {formatShortDate(video.published_at)}</p>
                </a>
              ))}
            </div>
          </div>
        )}
        
        {/* Embed Widget */}
        <EmbedWidget type="channel" data={channel} />

        {/* FAQ Section */}
        <div className="mt-8">
          <FAQSection faqs={channelFaqs} title={`FAQs: ${channel.title}`} />
        </div>
        
        {/* Internal Links Section - SEO Optimized */}
        <nav className="mt-8 space-y-6" aria-label="Related content">
          {/* Related Channels from Same Country */}
          {relatedChannels.length > 0 && (
            <section className="bg-[#111] border border-[#222] rounded-lg p-6" data-testid="related-channels">
              <h2 className="text-xl font-bold text-white mb-4">
                Other Popular YouTubers from {channel.country_name}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {relatedChannels.map((related) => (
                  <Link
                    key={related.channel_id}
                    to={`/channel/${related.channel_id}`}
                    className="group text-center p-3 rounded-lg hover:bg-[#1a1a1a] transition-colors"
                    title={`${related.title} YouTube channel statistics - ${formatNumber(related.subscriber_count)} subscribers`}
                  >
                    <img 
                      src={related.thumbnail_url || "https://via.placeholder.com/56"} 
                      alt={`${related.title} profile`}
                      className="w-14 h-14 rounded-full mx-auto mb-2 border-2 border-[#222] group-hover:border-red-600/50 transition-colors"
                      loading="lazy"
                    />
                    <div className="text-sm text-white group-hover:text-red-400 truncate transition-colors">{related.title}</div>
                    <div className="text-xs text-gray-500">{formatNumber(related.subscriber_count)} subs</div>
                  </Link>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-[#222]">
                <Link 
                  to={`/country/${channel.country_code}`} 
                  className="inline-flex items-center gap-2 text-red-500 hover:text-red-400 text-sm font-medium"
                >
                  View all {channel.country_name} YouTube channels <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </section>
          )}

          {/* Site Navigation */}
          <section className="bg-[#111] border border-[#222] rounded-lg p-6" data-testid="channel-navigation">
            <h2 className="text-lg font-bold text-white mb-4">Explore More</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Country Rankings</h3>
                <div className="space-y-1">
                  <Link to={`/country/${channel.country_code}`} className="block text-sm text-gray-300 hover:text-red-400">
                    Top channels in {channel.country_name}
                  </Link>
                  <Link to="/countries" className="block text-sm text-gray-300 hover:text-red-400">
                    Browse all 197 countries
                  </Link>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Global Rankings</h3>
                <div className="space-y-1">
                  <Link to="/leaderboard" className="block text-sm text-gray-300 hover:text-red-400">Global Subscriber Leaderboard</Link>
                  <Link to="/trending" className="block text-sm text-gray-300 hover:text-red-400">Fastest Growing Channels</Link>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Tools</h3>
                <div className="space-y-1">
                  <Link to={`/compare?ids=${channel.channel_id}`} className="block text-sm text-gray-300 hover:text-red-400">
                    Compare {channel.title?.split(' ')[0]} with others
                  </Link>
                  <Link to="/search" className="block text-sm text-gray-300 hover:text-red-400">Search YouTube Channels</Link>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Resources</h3>
                <div className="space-y-1">
                  <Link to="/blog" className="block text-sm text-gray-300 hover:text-red-400">YouTube Insights Blog</Link>
                  <Link to="/about" className="block text-sm text-gray-300 hover:text-red-400">About TopTube World</Link>
                </div>
              </div>
            </div>
          </section>
        </nav>
        </div>
          
          {/* Sidebar with Ads */}
          <div className="hidden lg:block w-[300px] flex-shrink-0">
            <SidebarAd />
            <div className="mt-6 bg-[#111] border border-[#222] rounded-lg p-4">
              <h3 className="font-semibold text-white mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link to={`/compare?ids=${channel.channel_id}`} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm">
                  <BarChart3 className="w-4 h-4" /> Compare this channel
                </Link>
                <a 
                  href={`https://youtube.com/channel/${channel.channel_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-400 hover:text-white text-sm"
                >
                  <ExternalLink className="w-4 h-4" /> View on YouTube
                </a>
              </div>
            </div>
          </div>
        </div>
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
      <TrendingSEO />
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

// ==================== COMPARE PAGE ====================

const ComparePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [allChannels, setAllChannels] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const channelIds = searchParams.get('ids')?.split(',').filter(Boolean) || [];

  useSEO({
    title: "Compare YouTube Channels - Side by Side Analysis | TopTube World Pro",
    description: "Compare up to 4 YouTube channels side by side. Analyze subscriber counts, growth rates, view counts, and performance metrics with our free comparison tool.",
    keywords: "compare YouTube channels, YouTube comparison tool, channel analytics comparison, YouTuber comparison, subscriber comparison",
    canonical: `${SITE_URL}/compare`
  });

  // How-To Schema for SEO
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Compare YouTube Channels",
    "description": "Learn how to compare YouTube channels side by side using TopTube World Pro's free comparison tool.",
    "totalTime": "PT2M",
    "step": [
      {
        "@type": "HowToStep",
        "position": 1,
        "name": "Search for channels",
        "text": "Use the search box to find YouTube channels you want to compare. Type the channel name and select from results."
      },
      {
        "@type": "HowToStep",
        "position": 2,
        "name": "Add channels to compare",
        "text": "Click on channels from search results to add them to your comparison. You can compare up to 4 channels at once."
      },
      {
        "@type": "HowToStep",
        "position": 3,
        "name": "Analyze the comparison",
        "text": "View side-by-side statistics including subscriber counts, view counts, video counts, and growth metrics."
      },
      {
        "@type": "HowToStep",
        "position": 4,
        "name": "Share your comparison",
        "text": "Copy the share link to save or share your channel comparison with others."
      }
    ]
  };

  useEffect(() => {
    const fetchAllChannels = async () => {
      try {
        const response = await axios.get(`${API}/channels?limit=500`);
        setAllChannels(response.data.channels || []);
      } catch (error) {
        console.error("Error fetching channels:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllChannels();
  }, []);

  useEffect(() => {
    const fetchSelectedChannels = async () => {
      if (channelIds.length === 0) {
        setChannels([]);
        return;
      }
      
      try {
        const promises = channelIds.map(id => axios.get(`${API}/channels/${id}`));
        const responses = await Promise.all(promises);
        setChannels(responses.map(r => r.data));
      } catch (error) {
        console.error("Error fetching channel details:", error);
      }
    };
    fetchSelectedChannels();
  }, [searchParams]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    const filtered = allChannels.filter(c => 
      c.title?.toLowerCase().includes(query.toLowerCase()) &&
      !channelIds.includes(c.channel_id)
    ).slice(0, 8);
    setSearchResults(filtered);
  };

  const addChannel = (channelId) => {
    if (channelIds.length >= 4) return;
    const newIds = [...channelIds, channelId];
    setSearchParams({ ids: newIds.join(',') });
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeChannel = (channelId) => {
    const newIds = channelIds.filter(id => id !== channelId);
    setSearchParams({ ids: newIds.join(',') });
  };

  const shareUrl = `${BACKEND_URL}/compare?ids=${channelIds.join(',')}`;

  // Prepare chart data for comparison
  const chartData = useMemo(() => {
    if (channels.length === 0) return [];
    
    // Get all unique dates from growth history
    const allDates = new Set();
    channels.forEach(ch => {
      ch.growth_history?.forEach(h => {
        allDates.add(formatShortDate(h.timestamp));
      });
    });
    
    return Array.from(allDates).sort().map(date => {
      const point = { date };
      channels.forEach(ch => {
        const historyPoint = ch.growth_history?.find(h => formatShortDate(h.timestamp) === date);
        point[ch.title] = historyPoint?.subscriber_count || null;
      });
      return point;
    });
  }, [channels]);

  const colors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-8" data-testid="compare-page">
      {/* How-To Schema for SEO */}
      <JsonLd data={howToSchema} />
      
      <div className="max-w-6xl mx-auto px-4">
        {/* Breadcrumb */}
        <Breadcrumb items={[
          { label: "Home", href: "/" },
          { label: "Tools", href: null },
          { label: "Compare Channels" }
        ]} />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Compare YouTube Channels</h1>
          <p className="text-gray-500">Compare up to 4 YouTube channels side by side - subscribers, views, growth & more</p>
        </div>

        {/* Channel Search/Add */}
        <div className="bg-[#111] border border-[#222] rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-3 mb-4">
            {channels.map((ch, idx) => (
              <div key={ch.channel_id} className="flex items-center gap-2 bg-[#0d0d0d] rounded-lg px-3 py-2" style={{ borderLeft: `3px solid ${colors[idx]}` }}>
                <img src={ch.thumbnail_url} alt="" className="w-6 h-6 rounded-full" />
                <span className="text-white text-sm">{ch.title}</span>
                <button onClick={() => removeChannel(ch.channel_id)} className="text-gray-500 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {channelIds.length < 4 && (
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Add a channel to compare..."
                  className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:border-red-500 focus:outline-none"
                  data-testid="compare-search"
                />
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#111] border border-[#333] rounded-lg overflow-hidden z-10 max-h-64 overflow-y-auto">
                    {searchResults.map(ch => (
                      <button
                        key={ch.channel_id}
                        onClick={() => addChannel(ch.channel_id)}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#1a1a1a] text-left"
                      >
                        <img src={ch.thumbnail_url} alt="" className="w-8 h-8 rounded-full" />
                        <div>
                          <div className="text-white text-sm">{ch.title}</div>
                          <div className="text-gray-500 text-xs">{formatNumber(ch.subscriber_count)} subs</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {channelIds.length > 0 && (
            <div className="flex items-center gap-3 pt-3 border-t border-[#222]">
              <span className="text-sm text-gray-500">Share comparison:</span>
              <button
                onClick={() => navigator.clipboard.writeText(shareUrl)}
                className="flex items-center gap-1 text-xs px-3 py-1 bg-[#222] rounded hover:bg-[#333]"
              >
                <Copy className="w-3 h-3" /> Copy Link
              </button>
            </div>
          )}
        </div>

        {channels.length === 0 ? (
          <div className="text-center py-16">
            <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No channels selected</h2>
            <p className="text-gray-500">Search and add channels above to compare them</p>
          </div>
        ) : (
          <>
            {/* Stats Comparison Table */}
            <div className="bg-[#111] border border-[#222] rounded-lg overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#222]">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-1/5">Metric</th>
                      {channels.map((ch, idx) => (
                        <th key={ch.channel_id} className="px-4 py-3 text-center" style={{ borderBottom: `3px solid ${colors[idx]}` }}>
                          <img src={ch.thumbnail_url} alt="" className="w-10 h-10 rounded-full mx-auto mb-1" />
                          <div className="text-white text-sm font-medium">{ch.title}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222]">
                    <tr>
                      <td className="px-4 py-3 text-gray-400">Subscribers</td>
                      {channels.map(ch => (
                        <td key={ch.channel_id} className="px-4 py-3 text-center text-white font-bold">{formatNumber(ch.subscriber_count)}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-400">Total Views</td>
                      {channels.map(ch => (
                        <td key={ch.channel_id} className="px-4 py-3 text-center text-white">{formatNumber(ch.view_count)}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-400">Videos</td>
                      {channels.map(ch => (
                        <td key={ch.channel_id} className="px-4 py-3 text-center text-white">{ch.video_count}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-400">24h Growth</td>
                      {channels.map(ch => (
                        <td key={ch.channel_id} className="px-4 py-3 text-center text-green-400">+{formatNumber(ch.daily_subscriber_gain || 0)}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-400">Growth Rate</td>
                      {channels.map(ch => (
                        <td key={ch.channel_id} className="px-4 py-3 text-center text-green-400">{(ch.daily_growth_percent || 0).toFixed(3)}%</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-400">Status</td>
                      {channels.map(ch => (
                        <td key={ch.channel_id} className="px-4 py-3 text-center"><ViralBadge label={ch.viral_label} /></td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-400">Country</td>
                      {channels.map(ch => (
                        <td key={ch.channel_id} className="px-4 py-3 text-center text-white">{ch.country_name}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Growth Chart Overlay */}
            {chartData.length > 0 && (
              <div className="bg-[#111] border border-[#222] rounded-lg p-6">
                <h2 className="text-lg font-bold text-white mb-4">Subscriber Growth Comparison</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis dataKey="date" stroke="#666" tick={{ fill: '#666', fontSize: 11 }} />
                      <YAxis stroke="#666" tick={{ fill: '#666', fontSize: 11 }} tickFormatter={formatNumber} />
                      <Tooltip 
                        contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px' }}
                        labelStyle={{ color: '#999' }}
                        formatter={(value) => [formatNumber(value), "Subscribers"]}
                      />
                      <Legend />
                      {channels.map((ch, idx) => (
                        <Line 
                          key={ch.channel_id}
                          type="monotone" 
                          dataKey={ch.title} 
                          stroke={colors[idx]}
                          strokeWidth={2}
                          dot={false}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ==================== FAVORITES PAGE ====================

const FavoritesPage = () => {
  const navigate = useNavigate();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const [channelDetails, setChannelDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: "My Favorites - TopTube World Pro",
    description: "Your saved favorite YouTube channels for quick access and tracking.",
    keywords: "favorite YouTube channels, saved channels, YouTube watchlist",
    canonical: `${SITE_URL}/favorites`
  });

  useEffect(() => {
    const fetchDetails = async () => {
      if (favorites.length === 0) {
        setChannelDetails([]);
        setLoading(false);
        return;
      }
      
      try {
        const promises = favorites.map(f => axios.get(`${API}/channels/${f.channel_id}`).catch(() => null));
        const responses = await Promise.all(promises);
        const details = responses.filter(r => r?.data).map(r => r.data);
        setChannelDetails(details);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [favorites]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-8" data-testid="favorites-page">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-500" />
            My Favorites
          </h1>
          <p className="text-gray-500">Your saved channels for quick access</p>
        </div>

        {channelDetails.length === 0 ? (
          <div className="text-center py-16 bg-[#111] border border-[#222] rounded-lg">
            <Bookmark className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No favorites yet</h2>
            <p className="text-gray-500 mb-6">Click the heart icon on any channel to save it here</p>
            <Link to="/leaderboard" className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700">
              Browse Channels
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channelDetails.map((channel, idx) => (
              <div 
                key={channel.channel_id}
                className="bg-[#111] border border-[#222] rounded-lg p-4 hover:border-[#333] transition-colors cursor-pointer"
                onClick={() => navigate(`/channel/${channel.channel_id}`)}
                data-testid={`favorite-card-${idx}`}
              >
                <div className="flex items-start gap-4">
                  <img 
                    src={channel.thumbnail_url || "https://via.placeholder.com/64"} 
                    alt={channel.title}
                    className="w-16 h-16 rounded-full"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{channel.title}</h3>
                    <p className="text-gray-500 text-sm">{channel.country_name}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-lg font-bold text-white">{formatNumber(channel.subscriber_count)}</span>
                      <span className="text-green-400 text-sm">+{formatNumber(channel.daily_subscriber_gain || 0)}</span>
                    </div>
                  </div>
                  <FavoriteButton 
                    channel={channel}
                    isFavorite={isFavorite(channel.channel_id)}
                    onToggle={toggleFavorite}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== BLOG PAGE ====================

// Default blog posts (fallback if no posts in database)
const defaultBlogPosts = [
  {
    id: '1',
    slug: 'top-10-rising-youtubers-2025',
    title: 'Top 10 Rising YouTubers to Watch in 2025',
    excerpt: 'Discover the fastest-growing YouTube channels that are set to dominate the platform this year.',
    category: 'Trending',
    created_at: '2025-01-15',
    read_time: '5 min read',
    image: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800&auto=format&fit=crop&q=60',
    status: 'published'
  },
  {
    id: '2',
    slug: 'how-youtube-algorithm-works-2025',
    title: 'How the YouTube Algorithm Works in 2025',
    excerpt: 'An in-depth analysis of YouTube\'s recommendation system and how creators can leverage it.',
    category: 'Guide',
    created_at: '2025-01-10',
    read_time: '8 min read',
    image: 'https://images.unsplash.com/photo-1633114128174-2f8aa49759b0?w=800&auto=format&fit=crop&q=60',
    status: 'published'
  }
];

const BlogPage = () => {
  const [posts, setPosts] = useState([]);
  const [countryPosts, setCountryPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: "Blog - YouTube Trends & Analysis | TopTube World Pro",
    description: "Read the latest articles about YouTube trends, channel growth strategies, and platform analytics. Explore top YouTubers by country.",
    keywords: "YouTube blog, YouTube trends, YouTube growth tips, YouTuber analysis, top YouTubers by country",
    canonical: `${SITE_URL}/blog`
  });

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const [blogRes, countryRes] = await Promise.all([
          axios.get(`${API}/blog/posts?status=published`).catch(() => ({ data: { posts: [] } })),
          axios.get(`${API}/blog/countries`).catch(() => ({ data: { posts: [] } }))
        ]);
        
        if (blogRes.data.posts && blogRes.data.posts.length > 0) {
          setPosts(blogRes.data.posts);
        } else {
          setPosts(defaultBlogPosts);
        }
        
        setCountryPosts(countryRes.data.posts || []);
      } catch (error) {
        console.error("Error fetching blog posts:", error);
        setPosts(defaultBlogPosts);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const featuredPost = posts[0];
  const otherPosts = posts.slice(1);
  
  // Popular countries to highlight
  const popularCountries = ['US', 'IN', 'BR', 'JP', 'KR', 'MX', 'GB', 'ID', 'PH', 'DE', 'FR', 'RU'];
  const featuredCountryPosts = countryPosts.filter(p => popularCountries.includes(p.country_code));

  return (
    <div className="py-8" data-testid="blog-page">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-red-500" />
            Blog & Insights
          </h1>
          <p className="text-gray-500">Latest trends, analysis, and insights from the YouTube world</p>
        </div>

        {featuredPost && (
          <div className="bg-[#111] border border-[#222] rounded-lg overflow-hidden mb-8">
            <div className="md:flex">
              <div className="md:w-1/2">
                <img 
                  src={featuredPost.image || 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800'} 
                  alt={featuredPost.title}
                  className="w-full h-64 md:h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="md:w-1/2 p-6 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-medium">{featuredPost.category}</span>
                  <span className="text-gray-500 text-xs flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    {formatDate(featuredPost.created_at)}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">{featuredPost.title}</h2>
                <p className="text-gray-400 mb-4">{featuredPost.excerpt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {featuredPost.read_time}
                  </span>
                  <Link to={`/blog/${featuredPost.slug}`} className="text-red-500 hover:text-red-400 font-medium flex items-center gap-1">
                    Read More <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        <HorizontalAd />

        {otherPosts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherPosts.map((post) => (
              <article key={post.id} className="bg-[#111] border border-[#222] rounded-lg overflow-hidden hover:border-[#333] transition-colors">
                <img 
                  src={post.image || 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800'} 
                  alt={post.title}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-[#222] text-gray-300 px-2 py-1 rounded text-xs">{post.category}</span>
                    <span className="text-gray-500 text-xs">{formatDate(post.created_at)}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{post.title}</h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-xs">{post.read_time}</span>
                    <Link to={`/blog/${post.slug}`} className="text-red-500 hover:text-red-400 text-sm font-medium">
                      Read →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Country Rankings Blog Posts Section */}
        {featuredCountryPosts.length > 0 && (
          <section className="mt-12" data-testid="country-blog-section">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Globe className="w-6 h-6 text-red-500" />
                  Top YouTubers by Country
                </h2>
                <p className="text-gray-500 mt-1">Explore the most subscribed YouTube channels in each country</p>
              </div>
              <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-medium">
                {countryPosts.length} Countries
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredCountryPosts.map((post) => (
                <Link
                  key={post.country_code}
                  to={post.url}
                  className="group bg-[#111] border border-[#222] rounded-lg p-4 hover:border-red-600/50 transition-all hover:scale-[1.02]"
                  data-testid={`country-blog-${post.country_code}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{post.flag_emoji}</span>
                    <span className="font-medium text-white group-hover:text-red-400 transition-colors">{post.country_name}</span>
                  </div>
                  <p className="text-gray-500 text-xs line-clamp-2">
                    Top 10 Most Subscribed YouTubers in {post.country_name}
                  </p>
                </Link>
              ))}
            </div>
            
            {/* View All Countries Link */}
            <div className="mt-6 text-center">
              <details className="inline-block">
                <summary className="cursor-pointer text-red-500 hover:text-red-400 font-medium">
                  View all {countryPosts.length} countries →
                </summary>
                <div className="mt-4 grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-64 overflow-y-auto p-4 bg-[#0a0a0a] border border-[#222] rounded-lg">
                  {countryPosts.map((post) => (
                    <Link
                      key={post.country_code}
                      to={post.url}
                      className="text-gray-400 hover:text-white text-xs p-2 rounded hover:bg-[#1a1a1a] transition-colors"
                      title={post.country_name}
                    >
                      {post.flag_emoji} {post.country_name.slice(0, 12)}{post.country_name.length > 12 ? '...' : ''}
                    </Link>
                  ))}
                </div>
              </details>
            </div>
          </section>
        )}

        <div className="mt-12">
          <NewsletterSignup />
        </div>
      </div>
    </div>
  );
};

// ==================== BLOG POST DETAIL PAGE ====================

const BlogPostPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`${API}/blog/posts/${slug}`);
        setPost(response.data);
      } catch (error) {
        console.error("Error fetching post:", error);
        // Try to find in default posts
        const defaultPost = defaultBlogPosts.find(p => p.slug === slug);
        if (defaultPost) {
          setPost({ ...defaultPost, content: defaultPost.excerpt });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold text-white mb-2">Post not found</h2>
          <Link to="/blog" className="text-red-500 hover:text-red-400">← Back to Blog</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8" data-testid="blog-post-page">
      <article className="max-w-4xl mx-auto px-4">
        <Link to="/blog" className="text-gray-500 hover:text-white mb-6 inline-flex items-center gap-1">
          ← Back to Blog
        </Link>
        
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-medium">{post.category}</span>
            <span className="text-gray-500 text-sm">{formatDate(post.created_at)}</span>
            <span className="text-gray-500 text-sm">• {post.read_time}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{post.title}</h1>
          <p className="text-xl text-gray-400">{post.excerpt}</p>
        </header>

        {post.image && (
          <img 
            src={post.image} 
            alt={post.title}
            className="w-full h-80 object-cover rounded-lg mb-8"
          />
        )}

        <div className="prose prose-invert prose-lg max-w-none">
          <div 
            className="text-gray-300 leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: post.content?.replace(/\n/g, '<br/>') || post.excerpt }}
          />
        </div>

        <footer className="mt-12 pt-8 border-t border-[#222]">
          <SocialShareButtons url={`${SITE_URL}/blog/${post.slug}`} title={post.title} />
        </footer>
      </article>
    </div>
  );
};

// ==================== COUNTRY BLOG POST PAGE (Auto-Generated) ====================

const CountryBlogSEO = ({ post }) => {
  const title = post?.title || "Top YouTubers by Country";
  const description = post?.excerpt || "Discover the most subscribed YouTube channels by country.";
  const pageUrl = post ? `${SITE_URL}/blog/country/${post.country_code}` : SITE_URL;
  
  useSEO({
    title,
    description,
    keywords: `top YouTubers ${post?.country_name}, most subscribed YouTube channels ${post?.country_name}, ${post?.country_name} YouTubers ${new Date().getFullYear()}, popular YouTubers in ${post?.country_name}`,
    canonical: pageUrl
  });

  if (!post) return null;

  // Schema.org Article structured data
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.excerpt,
    "url": pageUrl,
    "datePublished": post.generated_at,
    "dateModified": post.generated_at,
    "author": {
      "@type": "Organization",
      "name": "TopTube World Pro"
    },
    "publisher": {
      "@type": "Organization",
      "name": "TopTube World Pro",
      "url": SITE_URL
    },
    "mainEntityOfPage": pageUrl
  };

  // FAQ Schema for common questions
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `Who is the most subscribed YouTuber in ${post.country_name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": post.channels?.[0] ? `${post.channels[0].title} is the most subscribed YouTuber in ${post.country_name} with ${formatNumber(post.channels[0].subscriber_count)} subscribers.` : `Visit our rankings to find out.`
        }
      },
      {
        "@type": "Question",
        "name": `How many top YouTubers are from ${post.country_name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `We track ${post.total_channels} top YouTube channels from ${post.country_name}. Our rankings are updated daily with the latest subscriber counts.`
        }
      }
    ]
  };

  return (
    <>
      <JsonLd data={articleSchema} />
      <JsonLd data={faqSchema} />
    </>
  );
};

const CountryBlogPostPage = () => {
  const { countryCode } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`${API}/blog/country/${countryCode}`);
        setPost(response.data);
      } catch (error) {
        console.error("Error fetching country blog:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [countryCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold text-white mb-2">Country not found</h2>
          <Link to="/blog" className="text-red-500 hover:text-red-400">← Back to Blog</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8" data-testid="country-blog-page">
      <CountryBlogSEO post={post} />
      <article className="max-w-4xl mx-auto px-4">
        {/* Breadcrumb */}
        <Breadcrumb items={[
          { label: "Home", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: `${post.country_name} YouTubers` }
        ]} />

        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-medium">{post.category}</span>
            <span className="text-gray-500 text-sm">{post.read_time}</span>
            <span className="text-gray-500 text-sm">• Updated {new Date(post.generated_at).toLocaleDateString()}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {post.flag_emoji} {post.title}
          </h1>
          <p className="text-xl text-gray-400">{post.excerpt}</p>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#111] border border-[#222] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{post.total_channels}</div>
            <div className="text-gray-500 text-sm">Channels Tracked</div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">
              {formatNumber(post.channels?.reduce((sum, c) => sum + (c.subscriber_count || 0), 0) || 0)}
            </div>
            <div className="text-gray-500 text-sm">Total Subscribers</div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              +{formatNumber(post.channels?.reduce((sum, c) => sum + (c.daily_subscriber_gain || 0), 0) || 0)}
            </div>
            <div className="text-gray-500 text-sm">24h Growth</div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{post.region}</div>
            <div className="text-gray-500 text-sm">Region</div>
          </div>
        </div>

        {/* Top 10 Channels */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            The Top {post.channels?.length || 10} YouTubers in {post.country_name}
          </h2>
          <div className="space-y-4">
            {post.channels?.map((channel, idx) => (
              <div 
                key={channel.channel_id}
                className="bg-[#111] border border-[#222] rounded-lg p-5 hover:border-[#333] transition-colors cursor-pointer"
                onClick={() => navigate(`/channel/${channel.channel_id}`)}
                data-testid={`blog-channel-${idx}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    idx === 0 ? 'bg-yellow-500 text-black' :
                    idx === 1 ? 'bg-gray-400 text-black' :
                    idx === 2 ? 'bg-orange-600 text-white' :
                    'bg-[#222] text-gray-400'
                  }`}>
                    {idx + 1}
                  </div>
                  <img 
                    src={channel.thumbnail_url || "https://via.placeholder.com/56"} 
                    alt={channel.title}
                    className="w-14 h-14 rounded-full"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-lg mb-1">{channel.title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      <span><strong className="text-white">{formatNumber(channel.subscriber_count)}</strong> subscribers</span>
                      <span><strong className="text-white">{formatNumber(channel.view_count)}</strong> views</span>
                      <span><strong className="text-white">{channel.video_count}</strong> videos</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-sm ${(channel.daily_subscriber_gain || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {channel.daily_subscriber_gain >= 0 ? '+' : ''}{formatNumber(channel.daily_subscriber_gain || 0)} today
                      </span>
                      <ViralBadge label={channel.viral_label} />
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-red-900/20 to-red-600/10 border border-red-600/30 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-2">Want to explore more?</h3>
          <p className="text-gray-400 mb-4">
            View detailed statistics, compare channels, or explore other countries.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link 
              to={`/country/${post.country_code}`}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              View All {post.country_name} Channels
            </Link>
            <Link 
              to="/compare"
              className="bg-[#222] text-white px-4 py-2 rounded-lg hover:bg-[#333] transition-colors text-sm font-medium"
            >
              Compare Channels
            </Link>
            <Link 
              to="/countries"
              className="bg-[#222] text-white px-4 py-2 rounded-lg hover:bg-[#333] transition-colors text-sm font-medium"
            >
              Browse All Countries
            </Link>
          </div>
        </section>

        {/* Related Countries */}
        <section className="mb-8">
          <h3 className="text-lg font-bold text-white mb-4">Explore Other Countries</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['US', 'IN', 'BR', 'JP', 'KR', 'MX', 'GB', 'ID']
              .filter(code => code !== post.country_code)
              .slice(0, 4)
              .map(code => {
                const names = { US: '🇺🇸 United States', IN: '🇮🇳 India', BR: '🇧🇷 Brazil', JP: '🇯🇵 Japan', KR: '🇰🇷 South Korea', MX: '🇲🇽 Mexico', GB: '🇬🇧 United Kingdom', ID: '🇮🇩 Indonesia' };
                return (
                  <Link 
                    key={code}
                    to={`/blog/country/${code}`}
                    className="bg-[#111] border border-[#222] rounded-lg p-3 text-center hover:border-red-600/50 transition-colors"
                  >
                    <span className="text-white text-sm">{names[code]} YouTubers</span>
                  </Link>
                );
              })}
          </div>
        </section>

        {/* Social Share */}
        <footer className="pt-8 border-t border-[#222]">
          <SocialShareButtons url={`${SITE_URL}/blog/country/${post.country_code}`} title={post.title} />
        </footer>
      </article>
    </div>
  );
};

// ==================== BLOG ADMIN PAGE ====================

const BLOG_CATEGORIES = ['Trending', 'Guide', 'Analysis', 'Case Study', 'Strategy', 'Gaming', 'News', 'Tips'];

const BlogAdminPage = () => {
  const [searchParams] = useSearchParams();
  const adminKey = searchParams.get('key') || '';
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'Trending',
    image: '',
    status: 'draft',
    read_time: '5 min read'
  });

  const verifyAndFetchPosts = async (key) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/admin/blog/posts?admin_key=${key}`);
      setPosts(response.data.posts);
      setIsAuthenticated(true);
      setMessage({ type: 'success', text: 'Authenticated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Invalid admin key' });
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminKey) {
      setInputKey(adminKey);
      verifyAndFetchPosts(adminKey);
    }
  }, [adminKey]);

  const handleLogin = (e) => {
    e.preventDefault();
    verifyAndFetchPosts(inputKey);
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title)
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category: 'Trending',
      image: '',
      status: 'draft',
      read_time: '5 min read'
    });
    setEditingPost(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingPost) {
        await axios.put(`${API}/admin/blog/posts/${editingPost.id}?admin_key=${inputKey}`, formData);
        setMessage({ type: 'success', text: 'Post updated successfully!' });
      } else {
        await axios.post(`${API}/admin/blog/posts?admin_key=${inputKey}`, formData);
        setMessage({ type: 'success', text: 'Post created successfully!' });
      }
      resetForm();
      verifyAndFetchPosts(inputKey);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Error saving post' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (post) => {
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content || '',
      category: post.category,
      image: post.image || '',
      status: post.status,
      read_time: post.read_time
    });
    setEditingPost(post);
    setShowForm(true);
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await axios.delete(`${API}/admin/blog/posts/${postId}?admin_key=${inputKey}`);
      setMessage({ type: 'success', text: 'Post deleted!' });
      verifyAndFetchPosts(inputKey);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error deleting post' });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="blog-admin-login">
        <div className="bg-[#111] border border-[#222] rounded-lg p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Settings className="w-6 h-6 text-red-500" />
            Blog Admin
          </h1>
          
          {message && (
            <div className={`mb-4 p-3 rounded ${message.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
              {message.text}
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            <label className="block text-gray-400 text-sm mb-2">Admin Key</label>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="Enter admin key..."
              className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-4 py-3 text-white mb-4 focus:border-red-500 focus:outline-none"
              required
              data-testid="admin-key-input"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8" data-testid="blog-admin-page">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Settings className="w-8 h-8 text-red-500" />
            Blog Admin
          </h1>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Post
          </button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
            {message.text}
          </div>
        )}

        {/* Post Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#111] border border-[#222] rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">
                    {editingPost ? 'Edit Post' : 'Create New Post'}
                  </h2>
                  <button onClick={resetForm} className="text-gray-500 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={handleTitleChange}
                      className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-4 py-2 text-white focus:border-red-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Slug *</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-4 py-2 text-white focus:border-red-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-4 py-2 text-white focus:border-red-500 focus:outline-none"
                      >
                        {BLOG_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-4 py-2 text-white focus:border-red-500 focus:outline-none"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Read Time</label>
                      <input
                        type="text"
                        value={formData.read_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, read_time: e.target.value }))}
                        placeholder="5 min read"
                        className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-4 py-2 text-white focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Image URL</label>
                      <input
                        type="url"
                        value={formData.image}
                        onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-4 py-2 text-white focus:border-red-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Excerpt *</label>
                    <textarea
                      value={formData.excerpt}
                      onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                      rows={2}
                      className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-4 py-2 text-white focus:border-red-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Content *</label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      rows={12}
                      className="w-full bg-[#0d0d0d] border border-[#333] rounded-lg px-4 py-2 text-white focus:border-red-500 focus:outline-none font-mono text-sm"
                      placeholder="Write your blog post content here..."
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : (editingPost ? 'Update Post' : 'Create Post')}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 bg-[#222] text-white py-3 rounded-lg font-semibold hover:bg-[#333]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Posts List */}
        <div className="bg-[#111] border border-[#222] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#0d0d0d]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Post</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {posts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-12 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    No blog posts yet. Create your first post!
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="hover:bg-[#1a1a1a]">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {post.image && (
                          <img src={post.image} alt="" className="w-12 h-12 rounded object-cover" />
                        )}
                        <div>
                          <div className="font-medium text-white">{post.title}</div>
                          <div className="text-xs text-gray-500">/blog/{post.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="bg-[#222] text-gray-300 px-2 py-1 rounded text-xs">{post.category}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${post.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-500 text-sm">
                      {formatDate(post.created_at)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-500 hover:text-white"
                          title="View"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleEdit(post)}
                          className="p-2 text-gray-500 hover:text-blue-400"
                          title="Edit"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-2 text-gray-500 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Image Upload Help */}
        <div className="mt-6 bg-[#111] border border-[#222] rounded-lg p-4">
          <h3 className="text-white font-semibold mb-2">Image Upload Tips</h3>
          <p className="text-gray-500 text-sm mb-2">
            For blog post images, upload to a free image hosting service and paste the URL:
          </p>
          <div className="flex gap-4 text-sm">
            <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-400">
              Unsplash (Free Photos)
            </a>
            <a href="https://imgur.com/upload" target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-400">
              Imgur
            </a>
            <a href="https://imgbb.com" target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-400">
              ImgBB
            </a>
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
function AppContent() {
  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered:', registration.scope);
        })
        .catch(error => {
          console.log('SW registration failed:', error);
        });
    }
  }, []);

  return (
    <div className="App min-h-screen">
      <BrowserRouter>
        <Header />
        <main className="min-h-[calc(100vh-200px)]">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/top-100" element={<Top100Page />} />
            <Route path="/countries" element={<CountriesPage />} />
            <Route path="/country/:countryCode" element={<CountryPage />} />
            <Route path="/channel/:channelId" element={<ChannelPage />} />
            <Route path="/trending" element={<TrendingPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/country/:countryCode" element={<CountryBlogPostPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/admin/blog" element={<BlogAdminPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </div>
  );
}

// Main App with Theme Provider
function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
