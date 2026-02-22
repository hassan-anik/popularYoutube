import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate } from "react-router-dom";
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
  BarChart,
  Bar
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
  ArrowUpRight,
  X
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
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const getViralBadgeClass = (label) => {
  switch (label) {
    case "Exploding": return "badge-exploding";
    case "Rising Fast": return "badge-rising";
    case "Stable": return "badge-stable";
    case "Slowing": return "badge-slowing";
    default: return "badge-stable";
  }
};

const getViralIcon = (label) => {
  switch (label) {
    case "Exploding": return <Flame className="w-3 h-3" />;
    case "Rising Fast": return <TrendingUp className="w-3 h-3" />;
    case "Stable": return <Minus className="w-3 h-3" />;
    case "Slowing": return <TrendingDown className="w-3 h-3" />;
    default: return null;
  }
};

// Components

const Header = () => (
  <header className="glass sticky top-0 z-50 border-b border-[var(--border)]" data-testid="header">
    <div className="container flex items-center justify-between h-16">
      <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
        <div className="w-10 h-10 bg-[var(--primary)] rounded-lg flex items-center justify-center">
          <PlayCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">TopTube World Pro</h1>
          <p className="text-xs text-[#71717a]">Global YouTube Rankings</p>
        </div>
      </Link>
      <nav className="flex items-center gap-6">
        <Link to="/" className="nav-link flex items-center gap-2" data-testid="nav-dashboard">
          <Globe className="w-4 h-4" /> Dashboard
        </Link>
        <Link to="/leaderboard" className="nav-link flex items-center gap-2" data-testid="nav-leaderboard">
          <Crown className="w-4 h-4" /> Global Top 100
        </Link>
        <Link to="/admin" className="nav-link flex items-center gap-2" data-testid="nav-admin">
          <Settings className="w-4 h-4" /> Admin
        </Link>
      </nav>
    </div>
  </header>
);

const LiveIndicator = () => (
  <div className="flex items-center gap-2 text-xs" data-testid="live-indicator">
    <span className="w-2 h-2 bg-[var(--accent)] rounded-full live-pulse"></span>
    <span className="text-[#71717a]">Live Data</span>
  </div>
);

const ViralBadge = ({ label }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getViralBadgeClass(label)}`} data-testid={`viral-badge-${label?.toLowerCase()}`}>
    {getViralIcon(label)}
    {label}
  </span>
);

const RankChange = ({ current, previous }) => {
  const change = previous - current;
  if (change > 0) {
    return (
      <span className="rank-up flex items-center gap-1 text-sm font-mono" data-testid="rank-up">
        <TrendingUp className="w-3 h-3" /> +{change}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="rank-down flex items-center gap-1 text-sm font-mono" data-testid="rank-down">
        <TrendingDown className="w-3 h-3" /> {change}
      </span>
    );
  }
  return (
    <span className="rank-same flex items-center gap-1 text-sm font-mono" data-testid="rank-same">
      <Minus className="w-3 h-3" /> 0
    </span>
  );
};

const StatCard = ({ label, value, icon: Icon, trend, color = "var(--foreground)" }) => (
  <div className="card p-4 stat-card" data-testid={`stat-card-${label?.toLowerCase().replace(/\s/g, '-')}`}>
    <div className="flex items-center justify-between">
      <span className="stat-label">{label}</span>
      {Icon && <Icon className="w-4 h-4 text-[#71717a]" />}
    </div>
    <div className="stat-value font-mono" style={{ color }}>{value}</div>
    {trend !== undefined && (
      <div className={`text-xs ${trend >= 0 ? 'text-[var(--growth)]' : 'text-[var(--decline)]'}`}>
        {trend >= 0 ? '+' : ''}{trend}% today
      </div>
    )}
  </div>
);

const ChannelRow = ({ channel, rank, onClick }) => (
  <tr className="cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-colors" onClick={onClick} data-testid={`channel-row-${channel.channel_id}`}>
    <td className="font-mono font-bold text-lg">#{rank}</td>
    <td>
      <div className="flex items-center gap-3">
        <img 
          src={channel.thumbnail_url || "https://via.placeholder.com/48"} 
          alt={channel.title} 
          className="channel-thumbnail"
          onError={(e) => e.target.src = "https://via.placeholder.com/48"}
        />
        <div>
          <div className="font-medium">{channel.title}</div>
          <div className="text-xs text-[#71717a]">{channel.country_name}</div>
        </div>
      </div>
    </td>
    <td className="font-mono text-lg">{formatNumber(channel.subscriber_count)}</td>
    <td><RankChange current={channel.current_rank || rank} previous={channel.previous_rank || rank} /></td>
    <td className="font-mono text-[var(--growth)]">+{formatNumber(channel.daily_subscriber_gain || 0)}</td>
    <td><ViralBadge label={channel.viral_label || "Stable"} /></td>
    <td><ChevronRight className="w-4 h-4 text-[#71717a]" /></td>
  </tr>
);

const WorldMap = ({ mapData, onCountryClick }) => {
  const [tooltipContent, setTooltipContent] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const countryDataMap = {};
  mapData?.forEach(item => {
    countryDataMap[item.country_code] = item;
  });

  const handleMouseEnter = (geo, evt) => {
    const countryCode = geo.properties.ISO_A2;
    const data = countryDataMap[countryCode];
    if (data) {
      setTooltipContent(data);
      setTooltipPos({ x: evt.clientX, y: evt.clientY });
    }
  };

  const handleMouseLeave = () => {
    setTooltipContent(null);
  };

  return (
    <div className="world-map-container relative" data-testid="world-map">
      <ComposableMap projectionConfig={{ scale: 147 }}>
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
                    className={`country-path ${hasData ? 'has-data' : ''}`}
                    onClick={() => hasData && onCountryClick(countryCode)}
                    onMouseEnter={(evt) => handleMouseEnter(geo, evt)}
                    onMouseLeave={handleMouseLeave}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none' },
                      pressed: { outline: 'none' }
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      
      {tooltipContent && (
        <div 
          className="tooltip"
          style={{ 
            left: tooltipPos.x + 10, 
            top: tooltipPos.y - 60,
            position: 'fixed'
          }}
        >
          <div className="font-bold mb-1">{tooltipContent.flag_emoji} {tooltipContent.country_name}</div>
          <div className="flex items-center gap-2 mt-2">
            <img 
              src={tooltipContent.top_channel?.thumbnail_url} 
              alt="" 
              className="w-8 h-8 rounded-full"
            />
            <div>
              <div className="text-sm font-medium">{tooltipContent.top_channel?.title}</div>
              <div className="text-xs text-[#71717a] font-mono">{formatNumber(tooltipContent.top_channel?.subscriber_count)} subs</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const GrowthChart = ({ data, dataKey = "subscriber_count", color = "var(--accent)" }) => {
  const chartData = data?.map(item => ({
    ...item,
    date: formatDate(item.timestamp),
    value: item[dataKey]
  })) || [];

  return (
    <div className="h-[200px]" data-testid="growth-chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis 
            dataKey="date" 
            stroke="#71717a" 
            tick={{ fill: '#71717a', fontSize: 11 }}
            axisLine={{ stroke: '#27272a' }}
          />
          <YAxis 
            stroke="#71717a" 
            tick={{ fill: '#71717a', fontSize: 11 }}
            axisLine={{ stroke: '#27272a' }}
            tickFormatter={formatNumber}
          />
          <Tooltip 
            contentStyle={{ 
              background: 'rgba(18, 18, 18, 0.95)', 
              border: '1px solid #27272a',
              borderRadius: '8px',
              fontFamily: 'JetBrains Mono, monospace'
            }}
            formatter={(value) => [formatNumber(value), "Subscribers"]}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            fillOpacity={1} 
            fill="url(#colorGrowth)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Pages

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState([]);
  const [globalTop, setGlobalTop] = useState([]);
  const [fastestGrowing, setFastestGrowing] = useState([]);
  const [biggestGainers, setBiggestGainers] = useState([]);
  const [adminStats, setAdminStats] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [mapRes, globalRes, growingRes, gainersRes, statsRes] = await Promise.all([
        axios.get(`${API}/stats/map-data`),
        axios.get(`${API}/leaderboard/global?limit=10`),
        axios.get(`${API}/leaderboard/fastest-growing?limit=5`),
        axios.get(`${API}/leaderboard/biggest-gainers?limit=5`),
        axios.get(`${API}/admin/stats`)
      ]);
      
      setMapData(mapRes.data.map_data || []);
      setGlobalTop(globalRes.data.channels || []);
      setFastestGrowing(growingRes.data.channels || []);
      setBiggestGainers(gainersRes.data.channels || []);
      setAdminStats(statsRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleCountryClick = (countryCode) => {
    navigate(`/country/${countryCode}`);
  };

  if (loading && !globalTop.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" data-testid="dashboard-page">
      <div className="hero-glow">
        <div className="container py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Global YouTube Rankings</h1>
              <p className="text-[#71717a]">Track the world's most subscribed channels in real-time</p>
            </div>
            <div className="flex items-center gap-4">
              <LiveIndicator />
              <button 
                onClick={fetchData} 
                className="btn-secondary flex items-center gap-2"
                data-testid="refresh-btn"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard 
              label="Countries Tracked" 
              value={adminStats?.total_countries || 0} 
              icon={Globe}
            />
            <StatCard 
              label="Channels Tracked" 
              value={adminStats?.total_channels || 0} 
              icon={Users}
            />
            <StatCard 
              label="Data Points" 
              value={formatNumber(adminStats?.total_stats_records || 0)} 
              icon={BarChart3}
            />
            <StatCard 
              label="Last Updated" 
              value={adminStats?.last_update ? formatDate(adminStats.last_update) : "N/A"} 
              icon={RefreshCw}
            />
          </div>

          {/* Bento Grid Layout */}
          <div className="bento-grid">
            {/* World Map - spans 8 columns */}
            <div className="bento-item col-span-12 lg:col-span-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Top Channel by Country</h2>
                <span className="text-xs text-[#71717a]">Click a country to view details</span>
              </div>
              <WorldMap mapData={mapData} onCountryClick={handleCountryClick} />
            </div>

            {/* Fastest Growing - spans 4 columns */}
            <div className="bento-item col-span-12 lg:col-span-4">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-[var(--viral)]" />
                <h2 className="text-lg font-bold">Fastest Growing</h2>
              </div>
              <div className="space-y-3">
                {fastestGrowing.map((channel, idx) => (
                  <div 
                    key={channel.channel_id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--muted)] cursor-pointer transition-colors"
                    onClick={() => navigate(`/channel/${channel.channel_id}`)}
                    data-testid={`fastest-growing-${idx}`}
                  >
                    <span className="font-mono text-sm text-[#71717a]">#{idx + 1}</span>
                    <img 
                      src={channel.thumbnail_url || "https://via.placeholder.com/32"} 
                      alt="" 
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{channel.title}</div>
                      <div className="text-xs text-[#71717a]">{channel.country_name}</div>
                    </div>
                    <span className="text-[var(--growth)] font-mono text-sm">
                      +{channel.daily_growth_percent?.toFixed(2) || 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Global Top 10 - spans 8 columns */}
            <div className="bento-item col-span-12 lg:col-span-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-[var(--viral)]" />
                  <h2 className="text-lg font-bold">Global Top 10</h2>
                </div>
                <Link to="/leaderboard" className="text-xs text-[var(--secondary)] hover:underline flex items-center gap-1">
                  View All <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Channel</th>
                      <th>Subscribers</th>
                      <th>Change</th>
                      <th>24h Gain</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {globalTop.map((channel, idx) => (
                      <ChannelRow 
                        key={channel.channel_id} 
                        channel={channel} 
                        rank={idx + 1}
                        onClick={() => navigate(`/channel/${channel.channel_id}`)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Biggest 24h Gainers - spans 4 columns */}
            <div className="bento-item col-span-12 lg:col-span-4">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-[var(--primary)]" />
                <h2 className="text-lg font-bold">24h Subscriber Gain</h2>
              </div>
              <div className="space-y-3">
                {biggestGainers.map((channel, idx) => (
                  <div 
                    key={channel.channel_id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--muted)] cursor-pointer transition-colors"
                    onClick={() => navigate(`/channel/${channel.channel_id}`)}
                    data-testid={`biggest-gainer-${idx}`}
                  >
                    <span className="font-mono text-sm text-[#71717a]">#{idx + 1}</span>
                    <img 
                      src={channel.thumbnail_url || "https://via.placeholder.com/32"} 
                      alt="" 
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{channel.title}</div>
                      <div className="text-xs text-[#71717a]">{channel.country_name}</div>
                    </div>
                    <span className="text-[var(--growth)] font-mono text-sm">
                      +{formatNumber(channel.daily_subscriber_gain || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GlobalLeaderboard = () => {
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get(`${API}/leaderboard/global?limit=100`);
        setChannels(response.data.channels || []);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" data-testid="leaderboard-page">
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Global Top 100</h1>
            <p className="text-[#71717a]">The most subscribed YouTube channels worldwide</p>
          </div>
          <LiveIndicator />
        </div>

        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Channel</th>
                  <th>Subscribers</th>
                  <th>Change</th>
                  <th>24h Gain</th>
                  <th>Weekly</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {channels.map((channel, idx) => (
                  <tr 
                    key={channel.channel_id}
                    className="cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                    onClick={() => navigate(`/channel/${channel.channel_id}`)}
                    data-testid={`leaderboard-row-${idx}`}
                  >
                    <td className="font-mono font-bold text-lg">#{idx + 1}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <img 
                          src={channel.thumbnail_url || "https://via.placeholder.com/48"} 
                          alt={channel.title} 
                          className="channel-thumbnail"
                        />
                        <div>
                          <div className="font-medium">{channel.title}</div>
                          <div className="text-xs text-[#71717a]">{channel.country_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-lg">{formatNumber(channel.subscriber_count)}</td>
                    <td><RankChange current={channel.current_rank || idx + 1} previous={channel.previous_rank || idx + 1} /></td>
                    <td className="font-mono text-[var(--growth)]">+{formatNumber(channel.daily_subscriber_gain || 0)}</td>
                    <td className={`font-mono ${(channel.weekly_growth_percent || 0) >= 0 ? 'text-[var(--growth)]' : 'text-[var(--decline)]'}`}>
                      {channel.weekly_growth_percent >= 0 ? '+' : ''}{channel.weekly_growth_percent?.toFixed(2) || 0}%
                    </td>
                    <td><ViralBadge label={channel.viral_label || "Stable"} /></td>
                    <td><ChevronRight className="w-4 h-4 text-[#71717a]" /></td>
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

const CountryPage = () => {
  const { countryCode } = useParams();
  const navigate = useNavigate();
  const [country, setCountry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCountry = async () => {
      try {
        const response = await axios.get(`${API}/countries/${countryCode}`);
        setCountry(response.data);
      } catch (error) {
        console.error("Error fetching country:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCountry();
  }, [countryCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!country) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Country not found</p>
      </div>
    );
  }

  const topChannels = country.channels?.slice(0, 3) || [];

  return (
    <div className="min-h-screen" data-testid="country-page">
      <div className="container py-8">
        {/* Country Header */}
        <div className="card p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{country.flag_emoji}</span>
            <div>
              <h1 className="text-3xl font-bold">{country.name}</h1>
              <p className="text-[#71717a]">{country.region} • {country.channels?.length || 0} channels tracked</p>
            </div>
          </div>
        </div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {topChannels.map((channel, idx) => (
            <div 
              key={channel.channel_id}
              className={`card p-6 cursor-pointer ${idx === 0 ? 'border-[var(--viral)]' : ''}`}
              onClick={() => navigate(`/channel/${channel.channel_id}`)}
              data-testid={`top-channel-${idx}`}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                </span>
                <span className="font-bold">#{idx + 1}</span>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={channel.thumbnail_url || "https://via.placeholder.com/64"} 
                  alt={channel.title}
                  className="channel-thumbnail-lg"
                />
                <div>
                  <h3 className="font-bold text-lg">{channel.title}</h3>
                  <p className="text-[#71717a] text-sm">{formatNumber(channel.subscriber_count)} subscribers</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-[#71717a]">Views</div>
                  <div className="font-mono">{formatNumber(channel.view_count)}</div>
                </div>
                <div>
                  <div className="text-[#71717a]">Videos</div>
                  <div className="font-mono">{channel.video_count}</div>
                </div>
              </div>
              <div className="mt-4">
                <ViralBadge label={channel.viral_label || "Stable"} />
              </div>
            </div>
          ))}
        </div>

        {/* Full Rankings Table */}
        <div className="card">
          <div className="p-4 border-b border-[var(--border)]">
            <h2 className="text-xl font-bold">All Rankings</h2>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Channel</th>
                  <th>Subscribers</th>
                  <th>Views</th>
                  <th>Daily Gain</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {country.channels?.map((channel, idx) => (
                  <tr 
                    key={channel.channel_id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/channel/${channel.channel_id}`)}
                    data-testid={`country-channel-${idx}`}
                  >
                    <td className="font-mono font-bold">#{idx + 1}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <img 
                          src={channel.thumbnail_url || "https://via.placeholder.com/40"} 
                          alt="" 
                          className="w-10 h-10 rounded-full"
                        />
                        <span className="font-medium">{channel.title}</span>
                      </div>
                    </td>
                    <td className="font-mono">{formatNumber(channel.subscriber_count)}</td>
                    <td className="font-mono">{formatNumber(channel.view_count)}</td>
                    <td className="font-mono text-[var(--growth)]">+{formatNumber(channel.daily_subscriber_gain || 0)}</td>
                    <td><ViralBadge label={channel.viral_label || "Stable"} /></td>
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

const ChannelPage = () => {
  const { channelId } = useParams();
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChannel = async () => {
      try {
        const response = await axios.get(`${API}/channels/${channelId}`);
        setChannel(response.data);
      } catch (error) {
        console.error("Error fetching channel:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchChannel();
  }, [channelId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Channel not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" data-testid="channel-page">
      <div className="container py-8">
        {/* Channel Header */}
        <div className="card p-8 mb-8">
          <div className="flex items-start gap-6">
            <img 
              src={channel.thumbnail_url || "https://via.placeholder.com/120"} 
              alt={channel.title}
              className="w-24 h-24 rounded-full border-4 border-[var(--border)]"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{channel.title}</h1>
                <ViralBadge label={channel.viral_label || "Stable"} />
              </div>
              <p className="text-[#71717a] mb-4">{channel.country_name} • Rank #{channel.current_rank || "N/A"}</p>
              <p className="text-sm text-[#a1a1aa] line-clamp-2">{channel.description}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard 
            label="Subscribers" 
            value={formatNumber(channel.subscriber_count)} 
            icon={Users}
            color="var(--primary)"
          />
          <StatCard 
            label="Total Views" 
            value={formatNumber(channel.view_count)} 
            icon={Eye}
          />
          <StatCard 
            label="Videos" 
            value={channel.video_count} 
            icon={PlayCircle}
          />
          <StatCard 
            label="Viral Score" 
            value={channel.viral_prediction?.viral_score || 0} 
            icon={Zap}
            color="var(--viral)"
          />
        </div>

        {/* Growth Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card p-6">
            <div className="text-[#71717a] text-sm mb-1">24h Growth</div>
            <div className={`text-2xl font-mono font-bold ${(channel.daily_subscriber_gain || 0) >= 0 ? 'text-[var(--growth)]' : 'text-[var(--decline)]'}`}>
              {channel.daily_subscriber_gain >= 0 ? '+' : ''}{formatNumber(channel.daily_subscriber_gain || 0)}
            </div>
            <div className="text-xs text-[#71717a]">
              {channel.daily_growth_percent >= 0 ? '+' : ''}{channel.daily_growth_percent?.toFixed(4) || 0}%
            </div>
          </div>
          <div className="card p-6">
            <div className="text-[#71717a] text-sm mb-1">7-Day Growth</div>
            <div className={`text-2xl font-mono font-bold ${(channel.weekly_subscriber_gain || 0) >= 0 ? 'text-[var(--growth)]' : 'text-[var(--decline)]'}`}>
              {channel.weekly_subscriber_gain >= 0 ? '+' : ''}{formatNumber(channel.weekly_subscriber_gain || 0)}
            </div>
            <div className="text-xs text-[#71717a]">
              {channel.weekly_growth_percent >= 0 ? '+' : ''}{channel.weekly_growth_percent?.toFixed(4) || 0}%
            </div>
          </div>
          <div className="card p-6">
            <div className="text-[#71717a] text-sm mb-1">30-Day Growth</div>
            <div className={`text-2xl font-mono font-bold ${(channel.monthly_subscriber_gain || 0) >= 0 ? 'text-[var(--growth)]' : 'text-[var(--decline)]'}`}>
              {channel.monthly_subscriber_gain >= 0 ? '+' : ''}{formatNumber(channel.monthly_subscriber_gain || 0)}
            </div>
            <div className="text-xs text-[#71717a]">
              {channel.monthly_growth_percent >= 0 ? '+' : ''}{channel.monthly_growth_percent?.toFixed(4) || 0}%
            </div>
          </div>
        </div>

        {/* Growth Chart */}
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Subscriber Growth (30 Days)</h2>
          <GrowthChart data={channel.growth_history || []} />
        </div>

        {/* Top Videos */}
        {channel.top_videos?.length > 0 && (
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-4">Top Videos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {channel.top_videos.map((video) => (
                <a 
                  key={video.video_id}
                  href={`https://youtube.com/watch?v=${video.video_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:bg-[var(--muted)] rounded-lg p-3 transition-colors"
                  data-testid={`video-${video.video_id}`}
                >
                  <img 
                    src={video.thumbnail_url} 
                    alt={video.title}
                    className="w-full rounded-lg mb-2"
                  />
                  <h4 className="font-medium text-sm line-clamp-2 mb-1">{video.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-[#71717a]">
                    <span className="font-mono">{formatNumber(video.view_count)} views</span>
                    <span>{formatDate(video.published_at)}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [addingChannel, setAddingChannel] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, countriesRes] = await Promise.all([
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/countries`)
      ]);
      setStats(statsRes.data);
      setCountries(countriesRes.data);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const response = await axios.post(`${API}/admin/seed`);
      setMessage({ type: "success", text: response.data.message });
      fetchData();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.detail || "Failed to seed database" });
    } finally {
      setSeeding(false);
    }
  };

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      const response = await axios.post(`${API}/admin/refresh-all`);
      setMessage({ type: "success", text: response.data.message });
      fetchData();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.detail || "Failed to refresh channels" });
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    setSearching(true);
    try {
      const response = await axios.get(`${API}/search/channels?query=${encodeURIComponent(searchQuery)}&max_results=10`);
      setSearchResults(response.data.results || []);
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.detail || "Search failed" });
    } finally {
      setSearching(false);
    }
  };

  const handleAddChannel = async (channelId) => {
    if (!selectedCountry) {
      setMessage({ type: "error", text: "Please select a country first" });
      return;
    }
    setAddingChannel(true);
    try {
      const response = await axios.post(`${API}/channels`, {
        channel_id: channelId,
        country_code: selectedCountry
      });
      setMessage({ type: "success", text: `Added: ${response.data.channel.title}` });
      setSearchResults([]);
      setSearchQuery("");
      fetchData();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.detail || "Failed to add channel" });
    } finally {
      setAddingChannel(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" data-testid="admin-page">
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center justify-between ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-500' : 'bg-red-500/10 border border-red-500/20 text-red-500'}`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Countries" value={stats?.total_countries || 0} icon={Globe} />
          <StatCard label="Channels" value={stats?.total_channels || 0} icon={Users} />
          <StatCard label="Data Points" value={formatNumber(stats?.total_stats_records || 0)} icon={BarChart3} />
          <StatCard label="Last Update" value={stats?.last_update ? formatDate(stats.last_update) : "Never"} icon={RefreshCw} />
        </div>

        {/* Actions */}
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="flex gap-4">
            <button 
              onClick={handleSeed} 
              disabled={seeding}
              className="btn-primary flex items-center gap-2"
              data-testid="seed-btn"
            >
              {seeding ? <div className="spinner w-4 h-4"></div> : null}
              Seed Initial Data
            </button>
            <button 
              onClick={handleRefreshAll} 
              disabled={refreshing}
              className="btn-secondary flex items-center gap-2"
              data-testid="refresh-all-btn"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh All Channels
            </button>
          </div>
        </div>

        {/* Add Channel */}
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Add Channel</h2>
          <div className="flex gap-4 mb-4">
            <select 
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="input max-w-xs"
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
                className="input"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                data-testid="search-input"
              />
              <button 
                onClick={handleSearch}
                disabled={searching}
                className="btn-primary"
                data-testid="search-btn"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="border border-[var(--border)] rounded-lg divide-y divide-[var(--border)]">
              {searchResults.map(result => (
                <div key={result.channel_id} className="p-4 flex items-center gap-4">
                  <img 
                    src={result.thumbnail_url} 
                    alt="" 
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{result.title}</div>
                    <div className="text-xs text-[#71717a] line-clamp-1">{result.description}</div>
                  </div>
                  <button 
                    onClick={() => handleAddChannel(result.channel_id)}
                    disabled={addingChannel}
                    className="btn-secondary text-sm"
                    data-testid={`add-channel-${result.channel_id}`}
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Countries Overview */}
        <div className="card">
          <div className="p-4 border-b border-[var(--border)]">
            <h2 className="text-xl font-bold">Countries Overview</h2>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Country</th>
                  <th>Channels</th>
                  <th>Top Channel</th>
                  <th>Top Subscribers</th>
                </tr>
              </thead>
              <tbody>
                {countries.map(country => (
                  <tr key={country.code} data-testid={`country-row-${country.code}`}>
                    <td>
                      <span className="mr-2">{country.flag_emoji}</span>
                      {country.name}
                    </td>
                    <td className="font-mono">{country.channel_count}</td>
                    <td>{country.top_channel?.title || "-"}</td>
                    <td className="font-mono">{country.top_channel ? formatNumber(country.top_channel.subscriber_count) : "-"}</td>
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
    <div className="App">
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leaderboard" element={<GlobalLeaderboard />} />
          <Route path="/country/:countryCode" element={<CountryPage />} />
          <Route path="/channel/:channelId" element={<ChannelPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
