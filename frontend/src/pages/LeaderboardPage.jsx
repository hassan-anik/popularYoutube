import React, { lazy, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bar } from 'recharts';
import { BarChart3, Filter, RefreshCw, Search, TrendingUp } from 'lucide-react';
import { API } from '../utils/constants';
import { formatNumber } from '../utils/format';
import { ChannelCard, Header, InFeedAd, RankChange, ViralBadge } from '../components/common';
import { LeaderboardSEO } from '../components/seo';

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

  const year = new Date().getFullYear();

  return (
    <div className="py-8" data-testid="leaderboard-page">
      <LeaderboardSEO channels={filteredChannels} totalChannels={channels.length} />
      <div className="max-w-6xl mx-auto px-4">
        {/* SEO-Optimized Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Top 100 Most Subscribed YouTube Channels (Live Leaderboard)
          </h1>
          <p className="text-gray-400 text-lg">
            Real-time YouTube subscriber leaderboard tracking the world's most popular channels. Updated every 10 minutes.
          </p>
        </header>

        {/* SEO Introduction Section */}
        <section className="bg-[#111] border border-[#222] rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Most Subscribed YouTube Channels {year}</h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-4">
            <p>
              Welcome to the definitive <strong>YouTube subscriber leaderboard</strong> – your source for tracking the 
              <strong> most subscribed YouTube channels</strong> in real-time. This live ranking displays the <strong>top YouTube channels</strong> worldwide, 
              sorted by their total subscriber count. Whether you're a content creator benchmarking your growth, a marketer 
              researching influencers, or simply curious about YouTube's biggest stars, our <strong>YouTube channel ranking</strong> provides 
              comprehensive, up-to-date statistics.
            </p>
            <p>
              Currently, <Link to="/channel/UCX6OQ3DkcsbYNE6H8uQQuVA" className="text-red-400 hover:text-red-300">MrBeast</Link> leads 
              the global rankings with over 460 million subscribers, followed by Indian music giant T-Series. The battle for 
              YouTube supremacy continues as creators worldwide compete for the top positions on this <strong>YouTube subscriber leaderboard</strong>.
            </p>
          </div>
        </section>

        {/* How Ranking Works Section */}
        <section className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">How the Ranking System Works</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Data Collection</h3>
              <p className="text-gray-400 text-sm">
                Our system fetches subscriber counts directly from the official YouTube Data API v3. This ensures accuracy 
                and reliability for all <strong>top YouTube channels</strong> displayed in our rankings.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Ranking Methodology</h3>
              <p className="text-gray-400 text-sm">
                Channels are ranked purely by total subscriber count. We track over {channels.length} channels across 197 
                countries, making this one of the most comprehensive <strong>YouTube channel rankings</strong> available.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Growth Metrics</h3>
              <p className="text-gray-400 text-sm">
                Daily subscriber gains and growth percentages are calculated by comparing current counts with our historical 
                snapshots. These metrics help identify which <strong>most subscribed YouTube channels</strong> are trending.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Viral Status</h3>
              <p className="text-gray-400 text-sm">
                Our proprietary algorithm assigns viral status labels (Exploding, Rising Fast, Stable, Slowing) based on 
                recent growth patterns, helping you identify momentum in the <strong>YouTube subscriber leaderboard</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* Update Frequency Section */}
        <section className="bg-gradient-to-r from-red-500/10 to-transparent border border-red-500/20 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-3">How Often Subscriber Counts Update</h2>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <div className="text-white font-semibold">Every 10 Minutes</div>
                <div className="text-gray-500 text-sm">Ranking updates</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="text-white font-semibold">Hourly</div>
                <div className="text-gray-500 text-sm">Growth calculations</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-white font-semibold">Every 6 Hours</div>
                <div className="text-gray-500 text-sm">Full data refresh</div>
              </div>
            </div>
          </div>
        </section>
        
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
        
        {/* Most Popular YouTube Channels Section */}
        <section className="mt-8 bg-[#111] border border-[#222] rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Most Popular YouTube Channels Worldwide</h2>
          <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
            <p>
              The <strong>most subscribed YouTube channels</strong> represent the pinnacle of digital content creation. These channels 
              have attracted hundreds of millions of subscribers through exceptional content, consistent uploads, and strong audience 
              engagement. From entertainment giants to educational powerhouses, the <strong>top YouTube channels</strong> span every 
              content category imaginable.
            </p>
            
            <h3 className="text-lg font-semibold text-white mt-6 mb-3">What Makes These Channels Popular?</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[#0d0d0d] rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">Content Quality</h4>
                <p className="text-xs text-gray-400">
                  The <strong>most subscribed YouTube channels</strong> consistently produce high-quality content that resonates with 
                  global audiences. Production values range from professional studio setups to authentic personal vlogs.
                </p>
              </div>
              <div className="bg-[#0d0d0d] rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">Upload Consistency</h4>
                <p className="text-xs text-gray-400">
                  Regular upload schedules keep audiences engaged. Top creators on this <strong>YouTube channel ranking</strong> often 
                  post multiple times per week to maintain algorithmic visibility.
                </p>
              </div>
              <div className="bg-[#0d0d0d] rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">Audience Engagement</h4>
                <p className="text-xs text-gray-400">
                  Building community through comments, live streams, and social media interaction helps 
                  <strong> top YouTube channels</strong> convert viewers into loyal subscribers.
                </p>
              </div>
              <div className="bg-[#0d0d0d] rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">Global Appeal</h4>
                <p className="text-xs text-gray-400">
                  Many channels on the <strong>YouTube subscriber leaderboard</strong> create content that transcends language barriers, 
                  including music, gaming, and visual entertainment.
                </p>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-white mt-6 mb-3">Related Rankings</h3>
            <div className="flex flex-wrap gap-3">
              <Link to="/top-100" className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm transition-colors">
                Top 100 YouTubers
              </Link>
              <Link to="/trending" className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm transition-colors">
                Fastest Growing Channels
              </Link>
              <Link to="/countries" className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 text-sm transition-colors">
                Rankings by Country
              </Link>
              <Link to="/categories" className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 text-sm transition-colors">
                Rankings by Category
              </Link>
            </div>
            
            <p className="text-xs text-gray-500 mt-6 pt-4 border-t border-[#222]">
              <em>Data for this <strong>YouTube subscriber leaderboard</strong> is sourced from the YouTube Data API. Growth statistics 
              and viral predictions are calculated by TopTube World Pro. See our <Link to="/methodology" className="text-red-400 hover:text-red-300">Methodology</Link> page for details.</em>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

// ==================== TOP 100 PAGE (High Traffic SEO Page) ====================



export { LeaderboardPage };
