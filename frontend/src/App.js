import React, { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense, memo } from "react";
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import axios from "axios";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  HelpCircle,
  LogIn,
  LogOut,
  User,
  Vote,
  ThumbsUp,
  LinkIcon,
  Bell
} from "lucide-react";
import "@/App.css";

// Lazy load heavy components (react-simple-maps ~8MB, recharts ~8MB)
const LazyWorldMap = lazy(() => import('./components/LazyWorldMap'));
const LazyGrowthChart = lazy(() => import('./components/LazyGrowthChart'));

// Import from modular structure
import { API, API_URL, BACKEND_URL, SITE_NAME, SITE_URL, geoUrl, COUNTRY_SLUGS, BLOG_CATEGORIES, FAVORITES_KEY, THEME_KEY } from './utils/constants';
import { formatNumber, formatDate, formatShortDate } from './utils/format';

// Import theme context
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Import auth context
import { AuthProvider, useAuth } from './context/AuthContext';

// Import i18n
import { useTranslation } from 'react-i18next';
import './i18n';
import { SUPPORTED_LANGUAGES } from './i18n';

// Import modular pages
import { AboutPage, MethodologyPage, PrivacyPage, TermsPage, ContactPage } from './pages';

// Loading fallback component
const LoadingFallback = memo(() => (
  <div className="flex items-center justify-center p-8">
    <div className="w-8 h-8 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
  </div>
));

// Theme Toggle Button Component
const ThemeToggle = memo(() => {
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
});

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
  const currentYear = new Date().getFullYear();
  useSEO({
    title: `Most Subscribed YouTube Channels ${currentYear} - Live Rankings & Stats`,
    description: `#1 MrBeast (468M) vs #2 T-Series (310M) - Who is the second most subscribed YouTuber ${currentYear}? Live rankings of most subscribed YouTube channels updated in real-time for 197 countries.`,
    keywords: `most subscribed youtube channel ${currentYear}, second most subscribed youtuber ${currentYear}, most subscribed youtubers ${currentYear}, most subscribed youtube channel worldwide ${currentYear}, most popular youtubers worldwide ${currentYear}, mrbeast subscribers, t-series subscribers, youtube ranking ${currentYear}`,
    canonical: SITE_URL
  });
  
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": SITE_NAME,
    "url": SITE_URL,
    "description": `Live rankings of the most subscribed YouTube channels in ${currentYear}. Track MrBeast, T-Series, Cocomelon and top YouTubers worldwide.`,
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
  const currentYear = new Date().getFullYear();
  const topChannel = channels?.[0];
  const channelCount = channels?.length || 0;
  
  const title = country ? `Most Subscribed YouTube Channels in ${country.name} ${currentYear} ${country.flag_emoji} Top ${channelCount} YouTubers` : "";
  const description = country ? `Top YouTubers in ${country.name} ${currentYear}: ${topChannel ? `#1 ${topChannel.title} (${formatNumber(topChannel.subscriber_count)} subs)` : 'See rankings'}. Live subscriber counts, growth stats & trending ${country.name} YouTube channels updated daily.` : "";
  const keywords = country ? `most subscribed youtube channels ${country.name.toLowerCase()} ${currentYear}, top youtubers ${country.name.toLowerCase()} ${currentYear}, trending youtube channels ${country.name.toLowerCase()}, popular youtubers ${country.name.toLowerCase()}, ${country.name.toLowerCase()} youtube rankings, best youtubers ${country.name.toLowerCase()} ${currentYear}` : "";
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
  const currentYear = new Date().getFullYear();
  const channelTitle = channel?.title || channel?.name || 'Unknown Channel';
  const countryName = channel?.country_name || 'Unknown';
  const title = channel ? `${channelTitle} YouTube Stats ${currentYear} - ${formatNumber(channel.subscriber_count)} Subscribers Live Count` : "";
  const description = channel ? `${channelTitle} live subscriber count: ${formatNumber(channel.subscriber_count)} subs, ${formatNumber(channel.view_count)} views, ${channel.video_count} videos. Ranked #${channel.current_rank || '?'} in ${countryName}. Real-time ${channelTitle} YouTube stats ${currentYear}.` : "";
  const keywords = channel ? `${channelTitle} youtube stats, ${channelTitle} subscribers ${currentYear}, ${channelTitle} subscriber count, ${channelTitle} total views, ${channelTitle} youtube channel, ${countryName.toLowerCase()} youtuber` : "";
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
    "name": channelTitle,
    "url": `https://youtube.com/channel/${channel.channel_id}`,
    "description": channel.description?.substring(0, 500) || `YouTube channel from ${countryName}`,
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
  const currentYear = new Date().getFullYear();
  const title = `YouTube Rankings ${currentYear} - Most Subscribed Channels Live Leaderboard`;
  const description = `Live YouTube rankings ${currentYear}: MrBeast vs T-Series subscriber battle! Track ${totalChannels || 100}+ most subscribed YouTube channels with real-time counts, daily growth & viral status.`;
  const pageUrl = `${SITE_URL}/leaderboard`;
  
  useSEO({
    title,
    description,
    keywords: `youtube ranking ${currentYear}, most subscribed youtube channels ${currentYear}, youtube leaderboard ${currentYear}, top youtubers worldwide, mrbeast subscribers, t-series subscribers, pewdiepie youtube stats`,
    canonical: pageUrl
  });
  
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `YouTube Channel Rankings ${currentYear}`,
    "description": description,
    "url": pageUrl,
    "numberOfItems": totalChannels || 100
  };
  
  return <JsonLd data={schemaData} />;
};

// Countries List Page SEO
const CountriesListSEO = ({ totalCountries }) => {
  const currentYear = new Date().getFullYear();
  const title = `YouTube Rankings by Country ${currentYear} - Top YouTubers in ${totalCountries || 197} Countries`;
  const description = `Find top YouTubers in any country ${currentYear}. Browse YouTube channel rankings for ${totalCountries || 197} countries - India, USA, Brazil, Indonesia & more. Live subscriber counts.`;
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
  const currentYear = new Date().getFullYear();
  useSEO({
    title: `Fastest Growing YouTube Channels ${currentYear} - Trending YouTubers Right Now`,
    description: `See which YouTubers are exploding in ${currentYear}! Live tracking of the fastest growing YouTube channels right now. Daily subscriber gains, viral predictions & growth rates updated hourly.`,
    keywords: `fastest growing youtube channels ${currentYear}, fastest growing youtubers ${currentYear}, trending youtube channels ${currentYear}, fastest growing youtube channels right now ${currentYear}, viral youtube channels, rising youtubers ${currentYear}`,
    canonical: `${SITE_URL}/trending`
  });
  
  return null;
};

// Top 100 Page SEO
const Top100SEO = ({ channels }) => {
  const year = new Date().getFullYear();
  const title = `Top 100 Most Subscribed YouTube Channels ${year} - Complete List`;
  const description = `Official ${year} ranking: #1 ${channels?.[0]?.title || 'MrBeast'} (${formatNumber(channels?.[0]?.subscriber_count || 0)}), #2 T-Series, #3 Cocomelon. Full list of 100 most subscribed YouTubers with live subscriber counts.`;
  
  useSEO({
    title,
    description,
    keywords: `top 100 youtube channels ${year}, most subscribed youtube channels ${year}, most subscribed youtubers ${year}, top 100 youtubers ${year}, biggest youtube channels, youtube rankings ${year}`,
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
  // Google requires "item" field for all items except the last (current page)
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, idx) => {
      const isLastItem = idx === items.length - 1;
      const listItem = {
        "@type": "ListItem",
        "position": idx + 1,
        "name": item.label
      };
      
      // Add "item" URL for all items except the last one (current page)
      if (!isLastItem && item.href) {
        listItem.item = `${SITE_URL}${item.href}`;
      } else if (!isLastItem) {
        // If no href but not last item, use SITE_URL as fallback
        listItem.item = SITE_URL;
      }
      // Last item should NOT have "item" field per Google guidelines
      
      return listItem;
    })
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

// ==================== SEO-FRIENDLY COUNTRY SLUG REDIRECT ====================

const CountrySlugRedirect = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    const countryCode = COUNTRY_SLUGS[slug?.toLowerCase()];
    if (countryCode) {
      navigate(`/country/${countryCode}`, { replace: true });
    } else {
      navigate('/countries', { replace: true });
    }
  }, [slug, navigate]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

// ==================== HREFLANG COMPONENT ====================
// Adds hreflang tags for international SEO
const HreflangTags = () => {
  useEffect(() => {
    // Add hreflang tags to head
    const head = document.head;
    const existingHreflangs = head.querySelectorAll('link[hreflang]');
    existingHreflangs.forEach(el => el.remove());
    
    // Default language is English
    const hreflangs = [
      { lang: 'x-default', href: SITE_URL },
      { lang: 'en', href: SITE_URL },
    ];
    
    hreflangs.forEach(({ lang, href }) => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = lang;
      link.href = href;
      head.appendChild(link);
    });
    
    return () => {
      const tags = head.querySelectorAll('link[hreflang]');
      tags.forEach(el => el.remove());
    };
  }, []);
  
  return null;
};

// Header Component
const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();
  const { t } = useTranslation();

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
              {t('common.home')}
            </Link>
            <Link to="/leaderboard" className="text-gray-300 hover:text-white transition-colors" data-testid="nav-leaderboard">
              {t('common.leaderboard')}
            </Link>
            <Link to="/countries" className="text-gray-300 hover:text-white transition-colors" data-testid="nav-countries">
              {t('common.countries')}
            </Link>
            <Link to="/trending" className="text-gray-300 hover:text-white transition-colors" data-testid="nav-trending">
              {t('common.trending')}
            </Link>
            <Link to="/compare" className="text-gray-300 hover:text-white transition-colors" data-testid="nav-compare">
              {t('common.compare')}
            </Link>
            <Link to="/blog" className="text-gray-300 hover:text-white transition-colors" data-testid="nav-blog">
              {t('common.blog')}
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
                          <img src={channel.thumbnail_url} alt="" loading="lazy" className="w-8 h-8 rounded-full" />
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

            {/* Language Selector */}
            <LanguageSelector />

            {/* User Menu */}
            <UserMenu />

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
            <li><Link to="/rising-stars" className="text-gray-400 hover:text-white">Rising Stars</Link></li>
            <li><Link to="/race" className="text-gray-400 hover:text-white">Race to Milestone</Link></li>
            <li><Link to="/milestones" className="text-gray-400 hover:text-white">Milestone Tracker</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-4">Browse</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/countries" className="text-gray-400 hover:text-white">By Country</Link></li>
            <li><Link to="/categories" className="text-gray-400 hover:text-white">By Category</Link></li>
            <li><Link to="/compare" className="text-gray-400 hover:text-white">Compare Channels</Link></li>
            <li><Link to="/country/US" className="text-gray-400 hover:text-white">United States</Link></li>
            <li><Link to="/country/IN" className="text-gray-400 hover:text-white">India</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-4">Resources</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/blog" className="text-gray-400 hover:text-white">Blog & Insights</Link></li>
            <li><Link to="/favorites" className="text-gray-400 hover:text-white">My Favorites</Link></li>
            <li><Link to="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
            <li><Link to="/methodology" className="text-gray-400 hover:text-white">Data & Methodology</Link></li>
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
        <p className="mb-2">© {new Date().getFullYear()} TopTube World Pro. All rights reserved.</p>
        <p className="text-xs text-gray-600">
          Data sourced from YouTube Data API. Growth statistics, viral scores, and predictions are estimated by TopTube World Pro.
          <br />
          By using this site, you agree to the <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-400">YouTube Terms of Service</a> and <a href="http://www.google.com/policies/privacy" target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-400">Google Privacy Policy</a>.
        </p>
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
    <span 
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${styles[label] || styles["Stable"]}`} 
      data-testid={`viral-badge-${label?.toLowerCase()}`}
      title="Estimated status by TopTube World Pro"
    >
      {icons[label]} {label || "Stable"}
    </span>
  );
};

// Estimated Metric Label Component - Shows disclaimer for derived data
const EstimatedLabel = ({ children, tooltip = "Estimated by TopTube World Pro" }) => (
  <span className="group relative" title={tooltip}>
    {children}
    <span className="ml-1 text-[10px] text-gray-500 align-super">*</span>
  </span>
);

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
  const { t } = useTranslation();
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
            {t('home.title')}
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            {t('home.subtitle', { count: stats?.total_countries || 0 })}
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/leaderboard" className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors" data-testid="cta-leaderboard">
              {t('home.viewLeaderboard')}
            </Link>
            <Link to="/countries" className="bg-[#222] px-6 py-3 rounded-lg font-semibold hover:bg-[#333] transition-colors" style={{color: 'white'}} data-testid="cta-countries">
              {t('home.browseCountries')}
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
              <div className="text-gray-500 text-sm">{t('home.countriesTracked')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">{stats?.total_channels || 0}</div>
              <div className="text-gray-500 text-sm">{t('home.channelsTracked')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">{formatNumber(stats?.total_stats_records || 0)}</div>
              <div className="text-gray-500 text-sm">{t('home.dataPoints')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400">{t('common.live')}</div>
              <div className="text-gray-500 text-sm">{t('home.realTimeUpdates')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* World Map Section */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-white mb-2">{t('home.topChannelsByCountry')}</h2>
          <p className="text-gray-500 mb-6">{t('home.clickCountry')}</p>
          <Suspense fallback={<LoadingFallback />}>
            <LazyWorldMap mapData={mapData} onCountryClick={(code) => navigate(`/country/${code}`)} />
          </Suspense>
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

      {/* Second Most Subscribed - SEO Section */}
      {globalTop.length >= 2 && (
        <section className="py-12" data-testid="second-most-subscribed-section">
          <div className="max-w-6xl mx-auto px-4">
            <div className="bg-gradient-to-r from-orange-600/10 to-red-600/10 border border-orange-500/20 rounded-xl p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <img 
                      src={globalTop[1].thumbnail_url} 
                      alt={globalTop[1].title}
                      className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-orange-500/50"
                    />
                    <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-sm font-bold px-2 py-1 rounded-full">
                      #2
                    </div>
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                    Who is the Second Most Subscribed YouTuber in {new Date().getFullYear()}?
                  </h2>
                  <h3 className="text-2xl md:text-3xl font-bold text-orange-400 mb-2">
                    {globalTop[1].title}
                  </h3>
                  <p className="text-gray-400 mb-4">
                    With <span className="text-white font-semibold">{formatNumber(globalTop[1].subscriber_count)}</span> subscribers, 
                    {globalTop[1].title} from <span className="text-white">{globalTop[1].country_name}</span> holds 
                    the #2 spot globally, just behind {globalTop[0].title} ({formatNumber(globalTop[0].subscriber_count)} subs).
                  </p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    <Link 
                      to={`/channel/${globalTop[1].channel_id}`}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      data-testid="view-second-channel"
                    >
                      View {globalTop[1].title} Stats
                    </Link>
                    <Link 
                      to="/top-100"
                      className="bg-[#222] hover:bg-[#333] px-4 py-2 rounded-lg font-medium transition-colors"
                      style={{color: 'white'}}
                    >
                      See Full Top 100
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

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
                  <img src={channel.thumbnail_url || "https://via.placeholder.com/48"} alt="" loading="lazy" className="w-12 h-12 rounded-full" />
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">24h Gain <span className="text-[10px]" title="Estimated">*</span></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status <span className="text-[10px]" title="Estimated">*</span></th>
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
                        <img src={channel.thumbnail_url || "https://via.placeholder.com/40"} alt="" loading="lazy" className="w-10 h-10 rounded-full" loading="lazy" />
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
        
        {/* Estimated Data Disclaimer */}
        <div className="mt-4 p-3 bg-[#0d0d0d] border border-[#222] rounded-lg text-xs text-gray-500">
          <span className="text-yellow-500">*</span> 24h Gains, Growth %, and Status are estimated by TopTube World Pro based on historical tracking. These metrics are not provided by YouTube.
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
                    <img src={country.top_channel.thumbnail_url || "https://via.placeholder.com/32"} alt="" loading="lazy" className="w-8 h-8 rounded-full" />
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

  // Set noindex for 404 pages - must be before any conditional returns
  useEffect(() => {
    if (!loading && !country) {
      let robotsMeta = document.querySelector('meta[name="robots"]');
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.setAttribute('name', 'robots');
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.setAttribute('content', 'noindex, nofollow');
      document.title = 'Country Not Found - TopTube World Pro';
    }
  }, [loading, country]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!country) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" data-testid="country-not-found">
        <div className="text-6xl mb-4">🌍</div>
        <h1 className="text-2xl font-bold text-white mb-2">Country Not Found</h1>
        <p className="text-gray-400 mb-6 text-center max-w-md">
          The country you're looking for doesn't exist in our database.
        </p>
        <div className="flex gap-4">
          <Link 
            to="/countries" 
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
          >
            Browse All Countries
          </Link>
        </div>
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

        {/* No Data Message */}
        {(!country.channels || country.channels.length === 0) && (
          <div className="bg-[#111] border border-[#222] rounded-lg p-12 text-center mb-8" data-testid="no-data-message">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-white mb-2">No Data Available</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              We don't have any YouTube channel data for {country.name} yet. 
              This could be because there are no major YouTube creators from this country in our database, 
              or data collection is still in progress.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/countries" className="bg-[#222] text-white px-4 py-2 rounded-lg hover:bg-[#333] transition-colors text-sm">
                Browse Other Countries
              </Link>
              <Link to="/leaderboard" className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm">
                View Global Leaderboard
              </Link>
            </div>
          </div>
        )}

        {/* Top 3 Podium - Only show if channels exist */}
        {topThree.length > 0 && (
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
              <img src={channel.thumbnail_url || "https://via.placeholder.com/80"} alt="" loading="lazy" className="w-20 h-20 rounded-full mx-auto mb-4" />
              <h3 className="font-bold text-white text-center mb-1">{channel.title}</h3>
              <p className="text-2xl font-bold text-white text-center">{formatNumber(channel.subscriber_count)}</p>
              <p className="text-gray-500 text-sm text-center">subscribers</p>
              <div className="mt-4 text-center">
                <ViralBadge label={channel.viral_label} />
              </div>
            </div>
          ))}
        </div>
        )}

        {/* All Rankings - Only show if channels exist */}
        {country.channels && country.channels.length > 0 && (
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
                <img src={channel.thumbnail_url || "https://via.placeholder.com/40"} alt="" loading="lazy" className="w-10 h-10 rounded-full" />
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
        )}

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

  // Set noindex for 404 pages
  useEffect(() => {
    if (!loading && !channel) {
      // Add noindex meta tag
      let robotsMeta = document.querySelector('meta[name="robots"]');
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.setAttribute('name', 'robots');
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.setAttribute('content', 'noindex, nofollow');
      document.title = 'Channel Not Found - TopTube World Pro';
      
      return () => {
        // Clean up - remove noindex when leaving page
        if (robotsMeta) {
          robotsMeta.setAttribute('content', 'index, follow');
        }
      };
    }
  }, [loading, channel]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" data-testid="channel-not-found">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-white mb-2">Channel Not Found</h1>
        <p className="text-gray-400 mb-6 text-center max-w-md">
          The YouTube channel you're looking for doesn't exist in our database or may have been removed.
        </p>
        <div className="flex gap-4">
          <Link 
            to="/leaderboard" 
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
          >
            View Leaderboard
          </Link>
          <Link 
            to="/request-channel" 
            className="px-4 py-2 bg-[#222] hover:bg-[#333] text-white rounded-lg"
          >
            Request a Channel
          </Link>
        </div>
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
            <div className="text-gray-500 text-sm">Viral Score <span className="text-[10px]" title="Estimated by TopTube World Pro">*</span></div>
          </div>
        </div>

        {/* Estimated Data Disclaimer */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4 text-sm text-yellow-200/80">
          <strong>*</strong> Growth statistics, predictions, and viral scores are estimated by TopTube World Pro based on historical tracking and are not provided by YouTube.
        </div>

        {/* Growth Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#111] border border-[#222] rounded-lg p-5">
            <h3 className="text-gray-500 text-sm mb-2">24-Hour Growth <span className="text-[10px]" title="Estimated">*</span></h3>
            <div className={`text-3xl font-bold ${(channel.daily_subscriber_gain || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {channel.daily_subscriber_gain >= 0 ? '+' : ''}{formatNumber(channel.daily_subscriber_gain || 0)}
            </div>
            <div className="text-gray-500 text-sm">
              {channel.daily_growth_percent >= 0 ? '+' : ''}{channel.daily_growth_percent?.toFixed(4) || 0}%
            </div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-lg p-5">
            <h3 className="text-gray-500 text-sm mb-2">7-Day Growth <span className="text-[10px]" title="Estimated">*</span></h3>
            <div className={`text-3xl font-bold ${(channel.weekly_subscriber_gain || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {channel.weekly_subscriber_gain >= 0 ? '+' : ''}{formatNumber(channel.weekly_subscriber_gain || 0)}
            </div>
            <div className="text-gray-500 text-sm">
              {channel.weekly_growth_percent >= 0 ? '+' : ''}{channel.weekly_growth_percent?.toFixed(4) || 0}%
            </div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-lg p-5">
            <h3 className="text-gray-500 text-sm mb-2">30-Day Growth <span className="text-[10px]" title="Estimated">*</span></h3>
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
            <Suspense fallback={<LoadingFallback />}>
              <LazyGrowthChart data={channel.growth_history} />
            </Suspense>
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
                  <img src={video.thumbnail_url} alt="" loading="lazy" className="w-full rounded-lg mb-2" loading="lazy" />
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
                  <img src={channel.thumbnail_url || "https://via.placeholder.com/40"} alt="" loading="lazy" className="w-10 h-10 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">{channel.title || channel.name}</div>
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
                  <img src={channel.thumbnail_url || "https://via.placeholder.com/40"} alt="" loading="lazy" className="w-10 h-10 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">{channel.title || channel.name}</div>
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

// ==================== RACE TO MILESTONE PAGE ====================

const RacePage = () => {
  const navigate = useNavigate();
  const [races, setRaces] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Define milestone targets
  const milestones = [500000000, 400000000, 300000000, 250000000, 200000000, 150000000, 100000000];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API}/leaderboard/global?limit=100`);
        const channelData = response.data.channels || [];
        setChannels(channelData);
        
        // Generate races based on channels close to milestones
        const generatedRaces = [];
        
        milestones.forEach(milestone => {
          // Find channels approaching this milestone (within 80% of milestone)
          const approaching = channelData.filter(c => 
            c.subscriber_count < milestone && 
            c.subscriber_count >= milestone * 0.7
          ).slice(0, 3);
          
          if (approaching.length >= 2) {
            generatedRaces.push({
              milestone,
              title: `Race to ${formatNumber(milestone)} Subscribers`,
              channels: approaching.map(c => ({
                ...c,
                remaining: milestone - c.subscriber_count,
                daysToReach: c.daily_subscriber_gain > 0 
                  ? Math.ceil((milestone - c.subscriber_count) / c.daily_subscriber_gain)
                  : null,
                progress: (c.subscriber_count / milestone) * 100
              }))
            });
          }
        });
        
        setRaces(generatedRaces);
      } catch (error) {
        console.error("Error fetching race data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const currentYear = new Date().getFullYear();

  useSEO({
    title: `Race to Milestone ${currentYear} - Who Will Hit 500M First? | Live YouTube Subscriber Race`,
    description: `Watch the live race to subscriber milestones! Track which YouTube channels will hit 500M, 300M, 200M subscribers first. Real-time progress tracking with estimated arrival dates.`,
    keywords: `youtube subscriber race ${currentYear}, race to 500 million subscribers, mrbeast vs t-series, who will hit 500m first, youtube milestone tracker, subscriber countdown`,
    canonical: `${SITE_URL}/race`
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Featured race - channels closest to 500M
  const featuredRace = races.find(r => r.milestone === 500000000) || races[0];

  return (
    <div className="py-8" data-testid="race-page">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-10 h-10 text-yellow-500" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">Race to Milestone</h1>
          </div>
          <p className="text-gray-400 text-lg">Live tracking of YouTube channels racing to subscriber milestones</p>
          <LiveIndicator />
        </div>

        {/* Featured Race */}
        {featuredRace && (
          <div className="bg-gradient-to-r from-yellow-500/10 to-red-500/10 border border-yellow-500/30 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-bold text-white">{featuredRace.title}</h2>
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">LIVE</span>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              {featuredRace.channels.map((channel, idx) => (
                <div 
                  key={channel.channel_id}
                  className={`bg-[#111] border ${idx === 0 ? 'border-yellow-500/50' : 'border-[#333]'} rounded-lg p-4 cursor-pointer hover:border-yellow-500/30 transition-colors`}
                  onClick={() => navigate(`/channel/${channel.channel_id}`)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-2xl font-bold ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : 'text-amber-700'}`}>
                      #{idx + 1}
                    </span>
                    <img src={channel.thumbnail_url} alt={channel.title} className="w-12 h-12 rounded-full" />
                    <div>
                      <h3 className="font-semibold text-white text-sm">{channel.title}</h3>
                      <p className="text-gray-500 text-xs">{channel.country_name}</p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{formatNumber(channel.subscriber_count)}</span>
                      <span>{formatNumber(featuredRace.milestone)}</span>
                    </div>
                    <div className="h-3 bg-[#222] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-500' : 'bg-amber-700'}`}
                        style={{ width: `${channel.progress}%` }}
                      />
                    </div>
                    <div className="text-center text-xs text-gray-500 mt-1">{channel.progress.toFixed(1)}%</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-[#0d0d0d] rounded p-2">
                      <div className="text-red-400 font-bold text-sm">{formatNumber(channel.remaining)}</div>
                      <div className="text-gray-500 text-xs">Remaining</div>
                    </div>
                    <div className="bg-[#0d0d0d] rounded p-2">
                      <div className="text-green-400 font-bold text-sm">
                        {channel.daysToReach ? `~${channel.daysToReach} days` : 'N/A'}
                      </div>
                      <div className="text-gray-500 text-xs">Est. Time *</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Active Races */}
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-red-500" />
          All Active Races
        </h2>
        
        <div className="space-y-6">
          {races.filter(r => r !== featuredRace).map(race => (
            <div key={race.milestone} className="bg-[#111] border border-[#222] rounded-lg p-5">
              <h3 className="text-lg font-semibold text-white mb-4">{race.title}</h3>
              <div className="space-y-3">
                {race.channels.map((channel, idx) => (
                  <div 
                    key={channel.channel_id}
                    className="flex items-center gap-4 p-3 bg-[#0d0d0d] rounded-lg cursor-pointer hover:bg-[#1a1a1a] transition-colors"
                    onClick={() => navigate(`/channel/${channel.channel_id}`)}
                  >
                    <span className={`text-lg font-bold w-8 ${idx === 0 ? 'text-yellow-500' : 'text-gray-500'}`}>#{idx + 1}</span>
                    <img src={channel.thumbnail_url} alt={channel.title} className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <div className="font-medium text-white">{channel.title}</div>
                      <div className="text-sm text-gray-500">{formatNumber(channel.subscriber_count)} subs</div>
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-[#222] rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${channel.progress}%` }} />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{channel.progress.toFixed(1)}% complete</div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 text-sm font-medium">
                        {channel.daysToReach ? `~${channel.daysToReach} days` : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">Est. arrival *</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-3 bg-[#0d0d0d] border border-[#222] rounded-lg text-xs text-gray-500">
          <span className="text-yellow-500">*</span> Estimated arrival times are calculated based on current daily growth rates and may vary significantly. These are projections by TopTube World Pro, not YouTube data.
        </div>

        {/* SEO Content */}
        <div className="mt-12 bg-[#111] border border-[#222] rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">About YouTube Subscriber Races</h2>
          <div className="text-gray-400 space-y-3 text-sm">
            <p>
              The race to major subscriber milestones has become one of the most exciting narratives in YouTube history. 
              From the legendary PewDiePie vs T-Series battle to MrBeast's meteoric rise, these races captivate millions of viewers worldwide.
            </p>
            <p>
              Our live tracker monitors the top YouTube channels and calculates estimated arrival times based on current growth rates. 
              While these predictions are estimates and can change based on viral videos or algorithm changes, they provide an exciting 
              way to follow the competition.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== MILESTONE TIMELINE PAGE ====================

const MilestonePage = () => {
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [upcomingMilestones, setUpcomingMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  const milestoneValues = [500000000, 400000000, 300000000, 250000000, 200000000, 150000000, 100000000, 75000000, 50000000];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API}/leaderboard/global?limit=200`);
        const channelData = response.data.channels || [];
        setChannels(channelData);
        
        // Calculate upcoming milestones
        const upcoming = [];
        channelData.forEach(channel => {
          milestoneValues.forEach(milestone => {
            if (channel.subscriber_count < milestone && channel.subscriber_count >= milestone * 0.9) {
              const remaining = milestone - channel.subscriber_count;
              const daysToReach = channel.daily_subscriber_gain > 0 
                ? Math.ceil(remaining / channel.daily_subscriber_gain)
                : null;
              
              if (daysToReach && daysToReach <= 365) { // Only show if within a year
                upcoming.push({
                  channel,
                  milestone,
                  remaining,
                  daysToReach,
                  progress: (channel.subscriber_count / milestone) * 100
                });
              }
            }
          });
        });
        
        // Sort by days to reach
        upcoming.sort((a, b) => (a.daysToReach || 9999) - (b.daysToReach || 9999));
        setUpcomingMilestones(upcoming.slice(0, 20));
      } catch (error) {
        console.error("Error fetching milestone data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const currentYear = new Date().getFullYear();

  // Historical milestones (hardcoded significant events)
  const historicalMilestones = [
    { channel: "MrBeast", milestone: "400M", date: "2024", country: "US" },
    { channel: "T-Series", milestone: "300M", date: "2024", country: "IN" },
    { channel: "MrBeast", milestone: "300M", date: "2024", country: "US" },
    { channel: "T-Series", milestone: "250M", date: "2023", country: "IN" },
    { channel: "Cocomelon", milestone: "150M", date: "2023", country: "US" },
    { channel: "T-Series", milestone: "200M", date: "2022", country: "IN" },
    { channel: "PewDiePie", milestone: "100M", date: "2019", country: "SE" },
    { channel: "T-Series", milestone: "100M", date: "2019", country: "IN" },
  ];

  useSEO({
    title: `YouTube Milestone Tracker ${currentYear} - Channels About to Hit 100M, 200M, 500M Subscribers`,
    description: `Track YouTube channels approaching major subscriber milestones. See who's about to hit 100M, 200M, 300M, 500M subscribers next. Historical milestone timeline included.`,
    keywords: `youtube milestones ${currentYear}, channels hitting 100 million, youtube 500m subscribers, subscriber milestone tracker, next youtuber to hit 100m`,
    canonical: `${SITE_URL}/milestones`
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-8" data-testid="milestone-page">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Star className="w-10 h-10 text-yellow-500" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">Milestone Tracker</h1>
          </div>
          <p className="text-gray-400 text-lg">Track channels approaching and achieving major subscriber milestones</p>
        </div>

        {/* Upcoming Milestones */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-6 h-6 text-green-500" />
            <h2 className="text-2xl font-bold text-white">Upcoming Milestones</h2>
            <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">LIVE</span>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {upcomingMilestones.map((item, idx) => (
              <div 
                key={`${item.channel.channel_id}-${item.milestone}`}
                className={`bg-[#111] border ${idx < 3 ? 'border-yellow-500/30' : 'border-[#222]'} rounded-lg p-4 cursor-pointer hover:border-yellow-500/50 transition-colors`}
                onClick={() => navigate(`/channel/${item.channel.channel_id}`)}
              >
                <div className="flex items-center gap-3 mb-3">
                  {idx < 3 && <Flame className="w-5 h-5 text-yellow-500" />}
                  <img src={item.channel.thumbnail_url} alt={item.channel.title} className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{item.channel.title}</h3>
                    <p className="text-gray-500 text-sm">{item.channel.country_name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-500 font-bold">{formatNumber(item.milestone)}</div>
                    <div className="text-gray-500 text-xs">Target</div>
                  </div>
                </div>
                
                {/* Progress */}
                <div className="mb-2">
                  <div className="h-2 bg-[#222] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-500 to-red-500 rounded-full"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{formatNumber(item.channel.subscriber_count)} current</span>
                  <span className="text-green-400">~{item.daysToReach} days away *</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Historical Timeline */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-white">Milestone History</h2>
          </div>
          
          <div className="bg-[#111] border border-[#222] rounded-lg p-6">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#333]" />
              
              <div className="space-y-6">
                {historicalMilestones.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 ml-2">
                    <div className={`w-5 h-5 rounded-full ${idx < 2 ? 'bg-yellow-500' : 'bg-blue-500'} flex-shrink-0 z-10`} />
                    <div className="flex-1 bg-[#0d0d0d] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-white">{item.channel}</h3>
                        <span className="text-gray-500 text-sm">{item.date}</span>
                      </div>
                      <p className="text-gray-400">
                        Reached <span className="text-yellow-500 font-bold">{item.milestone}</span> subscribers
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Milestone Levels */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="w-6 h-6 text-purple-500" />
            <h2 className="text-2xl font-bold text-white">Milestone Levels</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "500M", label: "Diamond", color: "text-cyan-400", bg: "bg-cyan-500/20", count: channels.filter(c => c.subscriber_count >= 500000000).length },
              { value: "200M", label: "Platinum", color: "text-gray-300", bg: "bg-gray-500/20", count: channels.filter(c => c.subscriber_count >= 200000000).length },
              { value: "100M", label: "Gold", color: "text-yellow-500", bg: "bg-yellow-500/20", count: channels.filter(c => c.subscriber_count >= 100000000).length },
              { value: "50M", label: "Silver", color: "text-gray-400", bg: "bg-gray-400/20", count: channels.filter(c => c.subscriber_count >= 50000000).length },
            ].map(level => (
              <div key={level.value} className={`${level.bg} border border-[#333] rounded-lg p-4 text-center`}>
                <div className={`text-3xl font-bold ${level.color} mb-1`}>{level.value}</div>
                <div className="text-gray-400 text-sm">{level.label} Level</div>
                <div className="text-white font-semibold mt-2">{level.count} channels</div>
              </div>
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <div className="mt-6 p-3 bg-[#0d0d0d] border border-[#222] rounded-lg text-xs text-gray-500">
          <span className="text-yellow-500">*</span> Estimated arrival times are calculated based on current daily growth rates by TopTube World Pro and may change.
        </div>
      </div>
    </div>
  );
};

// ==================== CHANNEL CATEGORY PAGES ====================

const CHANNEL_CATEGORIES = [
  { slug: 'music', name: 'Music', icon: '🎵', keywords: ['music', 'vevo', 'records', 'songs', 'official artist'] },
  { slug: 'gaming', name: 'Gaming', icon: '🎮', keywords: ['gaming', 'games', 'gameplay', 'gamer', 'plays'] },
  { slug: 'entertainment', name: 'Entertainment', icon: '🎬', keywords: ['entertainment', 'comedy', 'funny', 'vlog', 'challenge'] },
  { slug: 'education', name: 'Education', icon: '📚', keywords: ['education', 'learn', 'tutorial', 'how to', 'explained', 'science'] },
  { slug: 'sports', name: 'Sports', icon: '⚽', keywords: ['sports', 'football', 'basketball', 'soccer', 'nba', 'fifa'] },
  { slug: 'news', name: 'News & Politics', icon: '📰', keywords: ['news', 'politics', 'media', 'tv', 'broadcast'] },
  { slug: 'kids', name: 'Kids & Family', icon: '👶', keywords: ['kids', 'children', 'nursery', 'cartoon', 'family', 'baby'] },
  { slug: 'tech', name: 'Technology', icon: '💻', keywords: ['tech', 'technology', 'review', 'unboxing', 'gadget'] },
];

const CategoryListPage = () => {
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API}/leaderboard/global?limit=500`);
        const channelData = response.data.channels || [];
        setChannels(channelData);
        
        // Categorize channels
        const stats = CHANNEL_CATEGORIES.map(cat => {
          const categoryChannels = channelData.filter(ch => {
            const title = (ch.title || '').toLowerCase();
            const desc = (ch.description || '').toLowerCase();
            return cat.keywords.some(kw => title.includes(kw) || desc.includes(kw));
          });
          
          return {
            ...cat,
            channelCount: categoryChannels.length,
            topChannel: categoryChannels[0],
            totalSubs: categoryChannels.reduce((sum, c) => sum + (c.subscriber_count || 0), 0)
          };
        });
        
        setCategoryStats(stats.sort((a, b) => b.totalSubs - a.totalSubs));
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const currentYear = new Date().getFullYear();

  useSEO({
    title: `YouTube Channel Categories ${currentYear} - Top Gaming, Music, Entertainment YouTubers`,
    description: `Browse YouTube channels by category. Find the top Gaming, Music, Entertainment, Education, Sports, and Tech YouTubers ranked by subscribers.`,
    keywords: `youtube categories ${currentYear}, top gaming youtubers, best music channels, entertainment youtube, youtube by category`,
    canonical: `${SITE_URL}/categories`
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-8" data-testid="categories-page">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Browse by Category</h1>
          <p className="text-gray-400 text-lg">Explore top YouTube channels across different content categories</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categoryStats.map(cat => (
            <div
              key={cat.slug}
              className="bg-[#111] border border-[#222] rounded-lg p-5 cursor-pointer hover:border-red-500/50 transition-colors group"
              onClick={() => navigate(`/category/${cat.slug}`)}
            >
              <div className="text-4xl mb-3">{cat.icon}</div>
              <h2 className="text-xl font-bold text-white group-hover:text-red-500 transition-colors">{cat.name}</h2>
              <p className="text-gray-500 text-sm mt-1">{cat.channelCount} channels tracked</p>
              <p className="text-gray-400 text-sm">{formatNumber(cat.totalSubs)} total subs</p>
              
              {cat.topChannel && (
                <div className="mt-4 pt-4 border-t border-[#222]">
                  <p className="text-gray-500 text-xs mb-2">Top Channel</p>
                  <div className="flex items-center gap-2">
                    <img src={cat.topChannel.thumbnail_url} alt="" className="w-8 h-8 rounded-full" />
                    <div>
                      <div className="text-white text-sm font-medium truncate">{cat.topChannel.title}</div>
                      <div className="text-gray-500 text-xs">{formatNumber(cat.topChannel.subscriber_count)} subs</div>
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

const CategoryPage = () => {
  const { categorySlug } = useParams();
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  const category = CHANNEL_CATEGORIES.find(c => c.slug === categorySlug);

  useEffect(() => {
    const fetchData = async () => {
      if (!category) return;
      
      try {
        const response = await axios.get(`${API}/leaderboard/global?limit=500`);
        const channelData = response.data.channels || [];
        
        // Filter by category keywords
        const categoryChannels = channelData.filter(ch => {
          const title = (ch.title || '').toLowerCase();
          const desc = (ch.description || '').toLowerCase();
          return category.keywords.some(kw => title.includes(kw) || desc.includes(kw));
        });
        
        setChannels(categoryChannels);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [categorySlug, category]);

  const currentYear = new Date().getFullYear();

  useSEO({
    title: category ? `Top ${category.name} YouTube Channels ${currentYear} - Best ${category.name} YouTubers Ranked` : "Category Not Found",
    description: category ? `Ranking of the most subscribed ${category.name} YouTube channels in ${currentYear}. See the top ${category.name} YouTubers with live subscriber counts and growth stats.` : "",
    keywords: category ? `top ${category.name.toLowerCase()} youtubers ${currentYear}, best ${category.name.toLowerCase()} youtube channels, ${category.name.toLowerCase()} youtube ranking` : "",
    canonical: `${SITE_URL}/category/${categorySlug}`
  });

  // Set noindex for 404 pages
  useEffect(() => {
    if (!category) {
      let robotsMeta = document.querySelector('meta[name="robots"]');
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.setAttribute('name', 'robots');
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.setAttribute('content', 'noindex, nofollow');
    }
  }, [category]);

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" data-testid="category-not-found">
        <div className="text-6xl mb-4">📁</div>
        <h1 className="text-2xl font-bold text-white mb-2">Category Not Found</h1>
        <p className="text-gray-400 mb-6 text-center">The category you're looking for doesn't exist.</p>
        <Link to="/categories" className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg">
          Browse All Categories
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-8" data-testid="category-page">
      <div className="max-w-6xl mx-auto px-4">
        {/* Breadcrumb */}
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Categories', href: '/categories' },
          { label: category.name }
        ]} />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{category.icon}</span>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Top {category.name} YouTubers</h1>
          </div>
          <p className="text-gray-400">Ranking of the most subscribed {category.name} channels • {channels.length} channels</p>
        </div>

        {/* Top 3 Podium */}
        {channels.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[1, 0, 2].map((position) => {
              const channel = channels[position];
              if (!channel) return null;
              const isFirst = position === 0;
              return (
                <div 
                  key={channel.channel_id}
                  className={`bg-[#111] border ${isFirst ? 'border-yellow-500/50 -mt-4' : 'border-[#222]'} rounded-lg p-4 text-center cursor-pointer hover:border-yellow-500/30 transition-colors`}
                  onClick={() => navigate(`/channel/${channel.channel_id}`)}
                >
                  <div className={`text-2xl font-bold mb-2 ${isFirst ? 'text-yellow-500' : position === 1 ? 'text-gray-400' : 'text-amber-700'}`}>
                    #{position + 1}
                  </div>
                  <img src={channel.thumbnail_url} alt={channel.title} className="w-16 h-16 rounded-full mx-auto mb-2" />
                  <h3 className="font-semibold text-white truncate">{channel.title}</h3>
                  <p className="text-gray-500 text-sm">{formatNumber(channel.subscriber_count)} subs</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Channel List */}
        <div className="bg-[#111] border border-[#222] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#0d0d0d] border-b border-[#222]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Channel</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Subscribers</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Country</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">24h Gain *</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {channels.slice(0, 50).map((channel, idx) => (
                <tr 
                  key={channel.channel_id}
                  className="hover:bg-[#1a1a1a] cursor-pointer transition-colors"
                  onClick={() => navigate(`/channel/${channel.channel_id}`)}
                >
                  <td className="px-4 py-3 font-bold text-gray-400">#{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={channel.thumbnail_url} alt="" className="w-10 h-10 rounded-full" />
                      <span className="font-medium text-white">{channel.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white font-semibold">{formatNumber(channel.subscriber_count)}</td>
                  <td className="px-4 py-3 text-gray-400">{channel.country_name}</td>
                  <td className="px-4 py-3 text-green-400">+{formatNumber(channel.daily_subscriber_gain || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Disclaimer */}
        <div className="mt-4 p-3 bg-[#0d0d0d] border border-[#222] rounded-lg text-xs text-gray-500">
          <span className="text-yellow-500">*</span> 24h Gains are estimated by TopTube World Pro. Category assignments are based on channel metadata and may not be 100% accurate.
        </div>
      </div>
    </div>
  );
};

// ==================== RISING STARS PAGE ====================

const RisingStarsPage = () => {
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('growth'); // growth, gains, viral

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API}/leaderboard/global?limit=500`);
        const channelData = response.data.channels || [];
        
        // Filter for "rising stars" - channels under 50M (since most top channels are large) with any data
        const risingStars = channelData
          .filter(c => c.subscriber_count < 50000000 && c.subscriber_count >= 100000);
        
        setChannels(risingStars);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const sortedChannels = useMemo(() => {
    const sorted = [...channels];
    switch (filter) {
      case 'growth':
        return sorted.sort((a, b) => (b.daily_growth_percent || 0) - (a.daily_growth_percent || 0));
      case 'gains':
        return sorted.sort((a, b) => (b.daily_subscriber_gain || 0) - (a.daily_subscriber_gain || 0));
      case 'viral':
        return sorted.filter(c => c.viral_label === 'Exploding' || c.viral_label === 'Rising Fast');
      default:
        return sorted;
    }
  }, [channels, filter]);

  const currentYear = new Date().getFullYear();

  useSEO({
    title: `Rising YouTube Stars ${currentYear} - Fastest Growing Small Channels to Watch`,
    description: `Discover the next big YouTubers! Track the fastest growing small YouTube channels under 10M subscribers. Find rising stars before they blow up.`,
    keywords: `rising youtube stars ${currentYear}, fastest growing small youtubers, upcoming youtubers, youtube rising stars, small channels growing fast, next big youtuber`,
    canonical: `${SITE_URL}/rising-stars`
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-8" data-testid="rising-stars-page">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="w-10 h-10 text-yellow-500" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">Rising Stars</h1>
          </div>
          <p className="text-gray-400 text-lg">Discover the fastest growing YouTube channels under 50M subscribers</p>
          <p className="text-gray-500 text-sm mt-2">Find the next big YouTubers before they blow up</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          <button
            onClick={() => setFilter('growth')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'growth' ? 'bg-red-500 text-white' : 'bg-[#222] text-gray-400 hover:bg-[#333]'}`}
          >
            <TrendingUp className="w-4 h-4 inline mr-1" /> Fastest Growth %
          </button>
          <button
            onClick={() => setFilter('gains')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'gains' ? 'bg-red-500 text-white' : 'bg-[#222] text-gray-400 hover:bg-[#333]'}`}
          >
            <Users className="w-4 h-4 inline mr-1" /> Most Daily Gains
          </button>
          <button
            onClick={() => setFilter('viral')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'viral' ? 'bg-red-500 text-white' : 'bg-[#222] text-gray-400 hover:bg-[#333]'}`}
          >
            <Flame className="w-4 h-4 inline mr-1" /> Going Viral
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[#111] border border-[#222] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{channels.length}</div>
            <div className="text-gray-500 text-sm">Rising Channels</div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              {channels.filter(c => c.viral_label === 'Exploding').length}
            </div>
            <div className="text-gray-500 text-sm">Exploding Now</div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {channels.filter(c => c.viral_label === 'Rising Fast').length}
            </div>
            <div className="text-gray-500 text-sm">Rising Fast</div>
          </div>
        </div>

        {/* Channel Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedChannels.slice(0, 30).map((channel, idx) => (
            <div
              key={channel.channel_id}
              className="bg-[#111] border border-[#222] rounded-lg p-4 cursor-pointer hover:border-yellow-500/50 transition-colors"
              onClick={() => navigate(`/channel/${channel.channel_id}`)}
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-lg font-bold text-gray-500">#{idx + 1}</span>
                <img src={channel.thumbnail_url} alt={channel.title} className="w-12 h-12 rounded-full" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{channel.title}</h3>
                  <p className="text-gray-500 text-sm">{channel.country_name}</p>
                </div>
                <ViralBadge label={channel.viral_label} />
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#0d0d0d] rounded p-2">
                  <div className="text-white font-bold text-sm">{formatNumber(channel.subscriber_count)}</div>
                  <div className="text-gray-500 text-xs">Subs</div>
                </div>
                <div className="bg-[#0d0d0d] rounded p-2">
                  <div className="text-green-400 font-bold text-sm">+{formatNumber(channel.daily_subscriber_gain || 0)}</div>
                  <div className="text-gray-500 text-xs">24h *</div>
                </div>
                <div className="bg-[#0d0d0d] rounded p-2">
                  <div className="text-yellow-400 font-bold text-sm">{(channel.daily_growth_percent || 0).toFixed(2)}%</div>
                  <div className="text-gray-500 text-xs">Growth *</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {sortedChannels.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No rising stars found matching your criteria</p>
          </div>
        )}

        {/* SEO Content */}
        <div className="mt-12 bg-[#111] border border-[#222] rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">About Rising Stars</h2>
          <div className="text-gray-400 space-y-3 text-sm">
            <p>
              The Rising Stars page showcases YouTube channels that are experiencing exceptional growth relative to their size. 
              These are the channels to watch - future internet superstars in the making.
            </p>
            <p>
              We track channels between 100K and 10M subscribers that show above-average daily growth rates. 
              Many of today's biggest YouTubers were once "rising stars" before breaking into the mainstream.
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-4 p-3 bg-[#0d0d0d] border border-[#222] rounded-lg text-xs text-gray-500">
          <span className="text-yellow-500">*</span> Growth statistics are estimated by TopTube World Pro based on historical tracking.
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
                <img src={ch.thumbnail_url} alt="" loading="lazy" className="w-6 h-6 rounded-full" />
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
                        <img src={ch.thumbnail_url} alt="" loading="lazy" className="w-8 h-8 rounded-full" />
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
                          <img src={ch.thumbnail_url} alt="" loading="lazy" className="w-10 h-10 rounded-full mx-auto mb-1" />
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

// ==================== AUTH CALLBACK PAGE ====================

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);
  const { setUser, setIsAuthenticated, checkAuth } = useAuth();

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = location.hash;
      const sessionId = hash.split('session_id=')[1]?.split('&')[0];
      
      if (!sessionId) {
        navigate('/');
        return;
      }

      try {
        const response = await axios.post(`${API}/auth/session`, 
          { session_id: sessionId },
          { withCredentials: true }
        );
        
        if (response.data.success) {
          setUser(response.data.user);
          setIsAuthenticated(true);
          // Clear the hash and redirect to home
          navigate('/', { replace: true, state: { user: response.data.user } });
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Auth error:', error);
        navigate('/');
      }
    };

    processAuth();
  }, [location.hash, navigate, setUser, setIsAuthenticated]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Signing you in...</p>
      </div>
    </div>
  );
};

// ==================== LANGUAGE SELECTOR COMPONENT ====================

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === i18n.language) || SUPPORTED_LANGUAGES[0];

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('toptube_language', langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1 bg-[#222] hover:bg-[#333] rounded-lg text-sm transition-colors"
        title="Change Language"
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="hidden md:inline text-gray-300">{currentLanguage.code.toUpperCase()}</span>
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-10 w-40 bg-[#111] border border-[#333] rounded-lg shadow-xl z-50 overflow-hidden">
            {SUPPORTED_LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[#222] transition-colors ${
                  currentLanguage.code === lang.code ? 'bg-[#222] text-white' : 'text-gray-300'
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span>{lang.name}</span>
                {currentLanguage.code === lang.code && <Check className="w-4 h-4 ml-auto text-green-500" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ==================== USER MENU COMPONENT ====================

const UserMenu = () => {
  const { user, isAuthenticated, login, logout, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  if (loading) {
    return <div className="w-8 h-8 bg-[#222] rounded-full animate-pulse"></div>;
  }

  if (!isAuthenticated) {
    return (
      <button
        onClick={login}
        className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
      >
        <LogIn className="w-4 h-4" />
        <span className="hidden md:inline">Sign In</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-[#222] transition-colors"
      >
        {user?.picture ? (
          <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
        ) : (
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-12 w-56 bg-[#111] border border-[#333] rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="p-3 border-b border-[#333]">
              <p className="font-medium text-white truncate">{user?.name}</p>
              <p className="text-gray-500 text-sm truncate">{user?.email}</p>
            </div>
            <div className="py-1">
              <button
                onClick={() => { navigate('/favorites'); setMenuOpen(false); }}
                className="w-full px-4 py-2 text-left text-gray-300 hover:bg-[#222] flex items-center gap-2"
              >
                <Heart className="w-4 h-4" /> My Favorites
              </button>
              <button
                onClick={() => { navigate('/request-channel'); setMenuOpen(false); }}
                className="w-full px-4 py-2 text-left text-gray-300 hover:bg-[#222] flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Request Channel
              </button>
              <button
                onClick={() => { navigate('/polls'); setMenuOpen(false); }}
                className="w-full px-4 py-2 text-left text-gray-300 hover:bg-[#222] flex items-center gap-2"
              >
                <Vote className="w-4 h-4" /> Prediction Polls
              </button>
              <button
                onClick={() => { navigate('/alerts'); setMenuOpen(false); }}
                className="w-full px-4 py-2 text-left text-gray-300 hover:bg-[#222] flex items-center gap-2"
              >
                <Bell className="w-4 h-4" /> My Alerts
              </button>
            </div>
            <div className="border-t border-[#333] py-1">
              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className="w-full px-4 py-2 text-left text-red-400 hover:bg-[#222] flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ==================== CHANNEL REQUEST PAGE ====================

const ChannelRequestPage = () => {
  const { isAuthenticated, login } = useAuth();
  const [formData, setFormData] = useState({
    channel_url: '',
    channel_name: '',
    country_code: '',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requests, setRequests] = useState([]);
  const [countries, setCountries] = useState([]);

  useSEO({
    title: "Request a Channel - TopTube World Pro",
    description: "Submit a YouTube channel to be tracked on TopTube World Pro. Help us expand our database with channels from your country.",
    canonical: `${SITE_URL}/request-channel`
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [requestsRes, countriesRes] = await Promise.all([
          axios.get(`${API}/channel-requests?limit=10`),
          axios.get(`${API}/countries`)
        ]);
        setRequests(requestsRes.data.requests || []);
        setCountries(countriesRes.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await axios.post(`${API}/channel-requests`, formData, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setSubmitted(true);
        setFormData({ channel_url: '', channel_name: '', country_code: '', reason: '' });
      }
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (requestId) => {
    if (!isAuthenticated) {
      login();
      return;
    }

    try {
      await axios.post(`${API}/channel-requests/${requestId}/vote`, {}, {
        withCredentials: true
      });
      // Refresh requests
      const response = await axios.get(`${API}/channel-requests?limit=10`);
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error('Vote error:', error);
    }
  };

  return (
    <div className="py-8" data-testid="channel-request-page">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Plus className="w-10 h-10 text-green-500" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">Request a Channel</h1>
          </div>
          <p className="text-gray-400">Help us expand our database! Submit channels you'd like us to track.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Submit Form */}
          <div className="bg-[#111] border border-[#222] rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-green-500" />
              Submit a Channel
            </h2>

            {submitted ? (
              <div className="text-center py-8">
                <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Request Submitted!</h3>
                <p className="text-gray-400 mb-4">We'll review your request and add the channel if it meets our criteria.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
                >
                  Submit Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Channel URL *</label>
                  <input
                    type="url"
                    required
                    value={formData.channel_url}
                    onChange={(e) => setFormData({ ...formData, channel_url: e.target.value })}
                    placeholder="https://youtube.com/@channelname"
                    className="w-full px-4 py-2 bg-[#0d0d0d] border border-[#333] rounded-lg text-white focus:border-green-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-1">Channel Name (optional)</label>
                  <input
                    type="text"
                    value={formData.channel_name}
                    onChange={(e) => setFormData({ ...formData, channel_name: e.target.value })}
                    placeholder="MrBeast"
                    className="w-full px-4 py-2 bg-[#0d0d0d] border border-[#333] rounded-lg text-white focus:border-green-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-1">Country</label>
                  <select
                    value={formData.country_code}
                    onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                    className="w-full px-4 py-2 bg-[#0d0d0d] border border-[#333] rounded-lg text-white focus:border-green-500 focus:outline-none"
                  >
                    <option value="">Select country...</option>
                    {countries.map(c => (
                      <option key={c.code} value={c.code}>{c.flag_emoji} {c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-1">Why should we track this channel?</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="This channel is growing fast and represents..."
                    rows={3}
                    className="w-full px-4 py-2 bg-[#0d0d0d] border border-[#333] rounded-lg text-white focus:border-green-500 focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-medium rounded-lg flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Request
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Popular Requests */}
          <div className="bg-[#111] border border-[#222] rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-yellow-500" />
              Popular Requests
            </h2>
            <p className="text-gray-500 text-sm mb-4">Vote for channels you want us to add!</p>

            {requests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No pending requests yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map(req => (
                  <div key={req.request_id} className="bg-[#0d0d0d] rounded-lg p-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{req.channel_name || req.channel_url}</p>
                      <p className="text-gray-500 text-sm truncate">{req.channel_url}</p>
                    </div>
                    <button
                      onClick={() => handleVote(req.request_id)}
                      className="flex items-center gap-1 px-3 py-1 bg-[#222] hover:bg-[#333] rounded-lg text-sm ml-2"
                    >
                      <ThumbsUp className="w-4 h-4 text-green-500" />
                      <span className="text-white">{req.votes || 0}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== PREDICTION POLLS PAGE ====================

const PollsPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votedPolls, setVotedPolls] = useState(new Set());

  useSEO({
    title: "Prediction Polls - Who Will Gain More Subscribers? | TopTube World Pro",
    description: "Vote in YouTube channel prediction polls! Guess which channels will gain more subscribers this month and see how your predictions compare.",
    keywords: "youtube predictions, subscriber predictions, channel polls, who will gain more subscribers",
    canonical: `${SITE_URL}/polls`
  });

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const response = await axios.get(`${API}/polls?status=active`);
        setPolls(response.data.polls || []);
      } catch (error) {
        console.error('Error fetching polls:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPolls();
  }, []);

  const handleVote = async (pollId, choice) => {
    if (!isAuthenticated) {
      login();
      return;
    }

    try {
      await axios.post(`${API}/polls/${pollId}/vote`, { choice }, {
        withCredentials: true
      });
      setVotedPolls(prev => new Set([...prev, pollId]));
      // Refresh polls
      const response = await axios.get(`${API}/polls?status=active`);
      setPolls(response.data.polls || []);
    } catch (error) {
      console.error('Vote error:', error);
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
    <div className="py-8" data-testid="polls-page">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Vote className="w-10 h-10 text-purple-500" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">Prediction Polls</h1>
          </div>
          <p className="text-gray-400">Vote on which YouTube channels will perform better!</p>
          {!isAuthenticated && (
            <button
              onClick={login}
              className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg inline-flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Sign in to vote
            </button>
          )}
        </div>

        {polls.length === 0 ? (
          <div className="text-center py-12 bg-[#111] border border-[#222] rounded-lg">
            <Vote className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No Active Polls</h2>
            <p className="text-gray-500">Check back soon for new prediction polls!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {polls.map(poll => (
              <div key={poll.poll_id} className="bg-[#111] border border-[#222] rounded-lg overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-[#222]">
                  <h2 className="text-lg font-bold text-white">{poll.question}</h2>
                  <p className="text-gray-500 text-sm">
                    Ends: {new Date(poll.end_date).toLocaleDateString()} • {poll.total_votes} votes
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 p-4">
                  {/* Option A */}
                  <div
                    className={`bg-[#0d0d0d] rounded-lg p-4 cursor-pointer border-2 transition-colors ${
                      votedPolls.has(poll.poll_id) ? 'border-[#333] cursor-default' : 'border-transparent hover:border-purple-500/50'
                    }`}
                    onClick={() => !votedPolls.has(poll.poll_id) && handleVote(poll.poll_id, 'a')}
                  >
                    {poll.channel_a && (
                      <div className="flex items-center gap-3 mb-3">
                        <img src={poll.channel_a.thumbnail_url} alt="" className="w-12 h-12 rounded-full" />
                        <div>
                          <h3 className="font-semibold text-white">{poll.channel_a.title}</h3>
                          <p className="text-gray-500 text-sm">{formatNumber(poll.channel_a.subscriber_count)} subs</p>
                        </div>
                      </div>
                    )}
                    <div className="relative h-8 bg-[#222] rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-purple-500 rounded-full transition-all"
                        style={{ width: `${poll.percent_a}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
                        {poll.percent_a}%
                      </span>
                    </div>
                    <p className="text-center text-gray-500 text-sm mt-2">{poll.votes_a || 0} votes</p>
                  </div>

                  {/* Option B */}
                  <div
                    className={`bg-[#0d0d0d] rounded-lg p-4 cursor-pointer border-2 transition-colors ${
                      votedPolls.has(poll.poll_id) ? 'border-[#333] cursor-default' : 'border-transparent hover:border-pink-500/50'
                    }`}
                    onClick={() => !votedPolls.has(poll.poll_id) && handleVote(poll.poll_id, 'b')}
                  >
                    {poll.channel_b && (
                      <div className="flex items-center gap-3 mb-3">
                        <img src={poll.channel_b.thumbnail_url} alt="" className="w-12 h-12 rounded-full" />
                        <div>
                          <h3 className="font-semibold text-white">{poll.channel_b.title}</h3>
                          <p className="text-gray-500 text-sm">{formatNumber(poll.channel_b.subscriber_count)} subs</p>
                        </div>
                      </div>
                    )}
                    <div className="relative h-8 bg-[#222] rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-pink-500 rounded-full transition-all"
                        style={{ width: `${poll.percent_b}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
                        {poll.percent_b}%
                      </span>
                    </div>
                    <p className="text-center text-gray-500 text-sm mt-2">{poll.votes_b || 0} votes</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SEO Content */}
        <div className="mt-12 bg-[#111] border border-[#222] rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">About Prediction Polls</h2>
          <div className="text-gray-400 space-y-3 text-sm">
            <p>
              Test your YouTube knowledge with our prediction polls! Vote on which channels you think will 
              perform better - whether it's gaining more subscribers, reaching a milestone first, or growing faster.
            </p>
            <p>
              New polls are added regularly based on upcoming YouTube milestones and trending channel rivalries.
              Sign in to vote and track your prediction accuracy!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== NOTIFICATION ALERTS PAGE ====================

const AlertsPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated, login, user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [alertType, setAlertType] = useState('milestone');
  const [threshold, setThreshold] = useState('');
  const [creating, setCreating] = useState(false);

  useSEO({
    title: "Notification Alerts - TopTube World Pro",
    description: "Set up custom alerts to get notified when your favorite YouTube channels reach milestones or experience significant growth.",
    canonical: `${SITE_URL}/alerts`
  });

  const fetchAlerts = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    
    try {
      const [alertsRes, triggeredRes] = await Promise.all([
        axios.get(`${API}/user/alerts`, { withCredentials: true }),
        axios.get(`${API}/user/alerts/check`, { withCredentials: true })
      ]);
      setAlerts(alertsRes.data.alerts || []);
      setTriggeredAlerts(triggeredRes.data.triggered_alerts || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [isAuthenticated]);

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
      console.error('Search error:', error);
    }
  };

  const handleCreateAlert = async () => {
    if (!selectedChannel) return;
    
    setCreating(true);
    try {
      await axios.post(`${API}/user/alerts`, {
        channel_id: selectedChannel.channel_id,
        alert_type: alertType,
        threshold: threshold ? parseInt(threshold) : null,
        notify_email: true
      }, { withCredentials: true });
      
      setShowCreateModal(false);
      setSelectedChannel(null);
      setSearchQuery('');
      setThreshold('');
      fetchAlerts();
    } catch (error) {
      console.error('Error creating alert:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAlert = async (alertId) => {
    try {
      await axios.delete(`${API}/user/alerts/${alertId}`, { withCredentials: true });
      fetchAlerts();
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const handleToggleAlert = async (alertId, enabled) => {
    try {
      await axios.put(`${API}/user/alerts/${alertId}`, { enabled: !enabled }, { withCredentials: true });
      fetchAlerts();
    } catch (error) {
      console.error('Error updating alert:', error);
    }
  };

  const getAlertTypeInfo = (type) => {
    switch (type) {
      case 'milestone':
        return { icon: <Trophy className="w-5 h-5 text-yellow-500" />, label: t('alerts.milestone'), color: 'yellow' };
      case 'daily_gain':
        return { icon: <TrendingUp className="w-5 h-5 text-green-500" />, label: t('alerts.dailyGain'), color: 'green' };
      case 'rank_change':
        return { icon: <ArrowUp className="w-5 h-5 text-blue-500" />, label: t('alerts.rankChange'), color: 'blue' };
      default:
        return { icon: <Bell className="w-5 h-5 text-gray-500" />, label: type, color: 'gray' };
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="py-12" data-testid="alerts-page">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-4">{t('alerts.title')}</h1>
          <p className="text-gray-400 mb-8">{t('alerts.subtitle')}</p>
          <button
            onClick={login}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg inline-flex items-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            {t('common.signIn')} to Create Alerts
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-8" data-testid="alerts-page">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Bell className="w-8 h-8 text-yellow-500" />
              {t('alerts.title')}
            </h1>
            <p className="text-gray-400 mt-1">{t('alerts.subtitle')}</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t('alerts.createAlert')}
          </button>
        </div>

        {/* Triggered Alerts Banner */}
        {triggeredAlerts.length > 0 && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-green-500" />
              <h2 className="font-bold text-white">{triggeredAlerts.length} Alert(s) Triggered!</h2>
            </div>
            <div className="space-y-2">
              {triggeredAlerts.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-[#111] rounded-lg p-3">
                  <img src={item.channel?.thumbnail_url} alt="" className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <p className="text-white font-medium">{item.channel?.title}</p>
                    <p className="text-green-400 text-sm">{item.reason}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/channel/${item.alert.channel_id}`)}
                    className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-sm"
                  >
                    View Channel
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alert Types Overview */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { type: 'milestone', icon: <Trophy className="w-6 h-6" />, count: alerts.filter(a => a.alert_type === 'milestone').length },
            { type: 'daily_gain', icon: <TrendingUp className="w-6 h-6" />, count: alerts.filter(a => a.alert_type === 'daily_gain').length },
            { type: 'rank_change', icon: <ArrowUp className="w-6 h-6" />, count: alerts.filter(a => a.alert_type === 'rank_change').length }
          ].map(item => (
            <div key={item.type} className="bg-[#111] border border-[#222] rounded-lg p-4 text-center">
              <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                item.type === 'milestone' ? 'bg-yellow-500/20 text-yellow-500' :
                item.type === 'daily_gain' ? 'bg-green-500/20 text-green-500' :
                'bg-blue-500/20 text-blue-500'
              }`}>
                {item.icon}
              </div>
              <div className="text-2xl font-bold text-white">{item.count}</div>
              <div className="text-gray-500 text-sm">{getAlertTypeInfo(item.type).label}</div>
            </div>
          ))}
        </div>

        {/* Alerts List */}
        <div className="bg-[#111] border border-[#222] rounded-lg">
          <div className="p-4 border-b border-[#222]">
            <h2 className="font-bold text-white">{t('alerts.myAlerts')} ({alerts.length})</h2>
          </div>
          
          {alerts.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">{t('alerts.noAlerts')}</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {t('alerts.createAlert')}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#222]">
              {alerts.map(alert => {
                const typeInfo = getAlertTypeInfo(alert.alert_type);
                return (
                  <div key={alert.alert_id} className="p-4 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-${typeInfo.color}-500/20`}>
                      {typeInfo.icon}
                    </div>
                    
                    {alert.channel && (
                      <img 
                        src={alert.channel.thumbnail_url} 
                        alt="" 
                        className="w-12 h-12 rounded-full cursor-pointer"
                        onClick={() => navigate(`/channel/${alert.channel_id}`)}
                      />
                    )}
                    
                    <div className="flex-1">
                      <p className="text-white font-medium">{alert.channel?.title || alert.channel_id}</p>
                      <p className="text-gray-500 text-sm">
                        {typeInfo.label} • Threshold: {formatNumber(alert.threshold)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleAlert(alert.alert_id, alert.enabled)}
                        className={`px-3 py-1 rounded text-sm ${
                          alert.enabled 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {alert.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                      <button
                        onClick={() => handleDeleteAlert(alert.alert_id)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded"
                        title={t('alerts.deleteAlert')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Alert Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#111] border border-[#333] rounded-xl w-full max-w-md">
              <div className="p-4 border-b border-[#333] flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">{t('alerts.createAlert')}</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Channel Search */}
                <div>
                  <label className="block text-gray-400 text-sm mb-1">{t('common.channel')}</label>
                  {selectedChannel ? (
                    <div className="flex items-center gap-3 bg-[#0d0d0d] rounded-lg p-3">
                      <img src={selectedChannel.thumbnail_url} alt="" className="w-10 h-10 rounded-full" />
                      <div className="flex-1">
                        <p className="text-white font-medium">{selectedChannel.title}</p>
                        <p className="text-gray-500 text-sm">{formatNumber(selectedChannel.subscriber_count)} {t('common.subs')}</p>
                      </div>
                      <button onClick={() => setSelectedChannel(null)} className="text-gray-400 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder={t('leaderboard.searchPlaceholder')}
                        className="w-full px-4 py-2 bg-[#0d0d0d] border border-[#333] rounded-lg text-white focus:border-red-500 focus:outline-none"
                      />
                      {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-[#333] rounded-lg overflow-hidden z-10">
                          {searchResults.map(ch => (
                            <div
                              key={ch.channel_id}
                              className="flex items-center gap-3 p-3 hover:bg-[#222] cursor-pointer"
                              onClick={() => {
                                setSelectedChannel(ch);
                                setSearchResults([]);
                                setSearchQuery('');
                              }}
                            >
                              <img src={ch.thumbnail_url} alt="" className="w-8 h-8 rounded-full" />
                              <div>
                                <p className="text-white text-sm">{ch.title}</p>
                                <p className="text-gray-500 text-xs">{formatNumber(ch.subscriber_count)} {t('common.subs')}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Alert Type */}
                <div>
                  <label className="block text-gray-400 text-sm mb-1">{t('alerts.alertTypes')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['milestone', 'daily_gain', 'rank_change'].map(type => {
                      const info = getAlertTypeInfo(type);
                      return (
                        <button
                          key={type}
                          onClick={() => setAlertType(type)}
                          className={`p-3 rounded-lg border text-center transition-colors ${
                            alertType === type 
                              ? 'border-red-500 bg-red-500/10' 
                              : 'border-[#333] hover:border-[#444]'
                          }`}
                        >
                          <div className="flex justify-center mb-1">{info.icon}</div>
                          <div className="text-xs text-gray-400">{info.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Threshold */}
                <div>
                  <label className="block text-gray-400 text-sm mb-1">
                    Threshold {alertType === 'milestone' ? '(Target Subscribers)' : alertType === 'daily_gain' ? '(Min Daily Gain)' : '(Rank Change)'}
                  </label>
                  <input
                    type="number"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    placeholder={alertType === 'milestone' ? '100000000' : alertType === 'daily_gain' ? '100000' : '1'}
                    className="w-full px-4 py-2 bg-[#0d0d0d] border border-[#333] rounded-lg text-white focus:border-red-500 focus:outline-none"
                  />
                  <p className="text-gray-500 text-xs mt-1">Leave empty for automatic default</p>
                </div>
              </div>
              
              <div className="p-4 border-t border-[#333] flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 bg-[#222] hover:bg-[#333] text-white rounded-lg"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleCreateAlert}
                  disabled={!selectedChannel || creating}
                  className="flex-1 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Bell className="w-4 h-4" />
                      {t('alerts.createAlert')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
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

        <div className="prose prose-invert prose-lg max-w-none markdown-content">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              table: ({node, ...props}) => (
                <div className="overflow-x-auto my-4">
                  <table className="min-w-full border border-[#333] rounded-lg" {...props} />
                </div>
              ),
              thead: ({node, ...props}) => (
                <thead className="bg-[#1a1a1a]" {...props} />
              ),
              th: ({node, ...props}) => (
                <th className="px-4 py-2 text-left text-white font-semibold border-b border-[#333]" {...props} />
              ),
              td: ({node, ...props}) => (
                <td className="px-4 py-2 text-gray-300 border-b border-[#222]" {...props} />
              ),
              h2: ({node, ...props}) => (
                <h2 className="text-2xl font-bold text-white mt-8 mb-4" {...props} />
              ),
              h3: ({node, ...props}) => (
                <h3 className="text-xl font-semibold text-white mt-6 mb-3" {...props} />
              ),
              p: ({node, ...props}) => (
                <p className="text-gray-300 mb-4" {...props} />
              ),
              ul: ({node, ...props}) => (
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1" {...props} />
              ),
              li: ({node, ...props}) => (
                <li className="text-gray-300" {...props} />
              ),
              strong: ({node, ...props}) => (
                <strong className="text-white font-semibold" {...props} />
              ),
              hr: ({node, ...props}) => (
                <hr className="border-[#333] my-6" {...props} />
              ),
              em: ({node, ...props}) => (
                <em className="text-gray-400 italic" {...props} />
              ),
            }}
          >
            {post.content || post.excerpt}
          </ReactMarkdown>
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

        {/* No Data Message */}
        {(!post.channels || post.channels.length === 0) && (
          <section className="bg-[#111] border border-[#222] rounded-lg p-12 text-center mb-8" data-testid="no-data-message">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-white mb-2">No Data Available</h2>
            <p className="text-gray-400 max-w-md mx-auto mb-6">
              We don't have any YouTube channel data for {post.country_name} yet. 
              This could be because there are no major YouTube creators from this country in our database.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/countries" className="bg-[#222] text-white px-4 py-2 rounded-lg hover:bg-[#333] transition-colors text-sm">
                Browse Other Countries
              </Link>
              <Link to="/leaderboard" className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm">
                View Global Leaderboard
              </Link>
            </div>
          </section>
        )}

        {/* Top 10 Channels - Only show if channels exist */}
        {post.channels && post.channels.length > 0 && (
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
        )}

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
                          <img src={post.image} alt="" loading="lazy" className="w-12 h-12 rounded object-cover" />
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
                  <img src={result.thumbnail_url} alt="" loading="lazy" className="w-10 h-10 rounded-full" />
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
        {/* Hreflang tags for international SEO */}
        <HreflangTags />
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
            <Route path="/race" element={<RacePage />} />
            <Route path="/milestones" element={<MilestonePage />} />
            <Route path="/categories" element={<CategoryListPage />} />
            <Route path="/category/:categorySlug" element={<CategoryPage />} />
            <Route path="/rising-stars" element={<RisingStarsPage />} />
            <Route path="/request-channel" element={<ChannelRequestPage />} />
            <Route path="/polls" element={<PollsPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/country/:countryCode" element={<CountryBlogPostPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/admin/blog" element={<BlogAdminPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/methodology" element={<MethodologyPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            {/* SEO-friendly country slug redirects */}
            <Route path="/:slug" element={<CountrySlugRedirect />} />
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
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
