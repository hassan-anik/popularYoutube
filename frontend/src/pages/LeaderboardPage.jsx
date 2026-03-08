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
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-3">
            Top 100 Most Subscribed YouTube Channels (Live Leaderboard)
          </h1>
          <p className="text-[var(--text-muted)] text-lg">
            Real-time YouTube subscriber leaderboard tracking the world's most popular channels. Updated every 10 minutes.
          </p>
        </header>

        {/* SEO Introduction Section */}
        <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Most Subscribed YouTube Channels {year}</h2>
          <div className="text-[var(--text-secondary)] text-sm leading-relaxed space-y-4">
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
        <section className="bg-[var(--bg-deep)] border border-[var(--border)] rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">How the Ranking System Works</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Data Collection</h3>
              <p className="text-[var(--text-muted)] text-sm">
                Our system fetches subscriber counts directly from the official YouTube Data API v3. This ensures accuracy 
                and reliability for all <strong>top YouTube channels</strong> displayed in our rankings.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Ranking Methodology</h3>
              <p className="text-[var(--text-muted)] text-sm">
                Channels are ranked purely by total subscriber count. We track over {channels.length} channels across 197 
                countries, making this one of the most comprehensive <strong>YouTube channel rankings</strong> available.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Growth Metrics</h3>
              <p className="text-[var(--text-muted)] text-sm">
                Daily subscriber gains and growth percentages are calculated by comparing current counts with our historical 
                snapshots. These metrics help identify which <strong>most subscribed YouTube channels</strong> are trending.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Viral Status</h3>
              <p className="text-[var(--text-muted)] text-sm">
                Our proprietary algorithm assigns viral status labels (Exploding, Rising Fast, Stable, Slowing) based on 
                recent growth patterns, helping you identify momentum in the <strong>YouTube subscriber leaderboard</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* Update Frequency Section */}
        <section className="bg-gradient-to-r from-red-500/10 to-transparent border border-red-500/20 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3">How Often Subscriber Counts Update</h2>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <div className="text-[var(--text-primary)] font-semibold">Every 10 Minutes</div>
                <div className="text-[var(--text-dim)] text-sm">Ranking updates</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="text-[var(--text-primary)] font-semibold">Hourly</div>
                <div className="text-[var(--text-dim)] text-sm">Growth calculations</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-[var(--text-primary)] font-semibold">Every 6 Hours</div>
                <div className="text-[var(--text-dim)] text-sm">Full data refresh</div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Search and Filter Bar */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-dim)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search channels..."
                className="w-full bg-[var(--bg-deep)] border border-[var(--border-hover)] rounded-lg pl-10 pr-4 py-2 text-[var(--text-primary)] focus:border-red-500 focus:outline-none"
                data-testid="search-input"
              />
            </div>
            
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[var(--bg-deep)] border border-[var(--border-hover)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:border-red-500 focus:outline-none"
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
              className="bg-[var(--bg-deep)] border border-[var(--border-hover)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:border-red-500 focus:outline-none"
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
              className="bg-[var(--bg-deep)] border border-[var(--border-hover)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:border-red-500 focus:outline-none"
              data-testid="status-filter"
            >
              <option value="all">All Status</option>
              <option value="Exploding">🔥 Exploding</option>
              <option value="Rising Fast">📈 Rising Fast</option>
              <option value="Stable">➡️ Stable</option>
              <option value="Slowing">📉 Slowing</option>
            </select>
          </div>
          
          <div className="mt-3 text-sm text-[var(--text-dim)]">
            Showing {filteredChannels.length} of {channels.length} channels
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-[var(--bg-card)] border border-[var(--border)] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--bg-deep)] border-b border-[var(--border)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-dim)] uppercase">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-dim)] uppercase">Channel</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-dim)] uppercase">Subscribers</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-dim)] uppercase">Change</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-dim)] uppercase">24h Gain <span className="text-[10px]" title="Estimated">*</span></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-dim)] uppercase">Status <span className="text-[10px]" title="Estimated">*</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--divide)]">
              {filteredChannels.map((channel, idx) => (
                <React.Fragment key={channel.channel_id}>
                  {/* In-feed ad every 10 rows */}
                  <InFeedAd index={idx} />
                  <tr 
                    className="hover:bg-[var(--bg-hover)] cursor-pointer transition-colors"
                    onClick={() => navigate(`/channel/${channel.channel_id}`)}
                    data-testid={`leaderboard-row-${idx}`}
                  >
                    <td className="px-4 py-4 font-bold text-[var(--text-muted)]">#{idx + 1}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <img src={channel.thumbnail_url || "https://via.placeholder.com/40"} alt="" loading="lazy" className="w-10 h-10 rounded-full" loading="lazy" />
                        <div>
                          <div className="font-medium text-[var(--text-primary)]">{channel.title}</div>
                          <div className="text-xs text-[var(--text-dim)]">{channel.country_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-bold text-[var(--text-primary)]">{formatNumber(channel.subscriber_count)}</td>
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
        <div className="mt-4 p-3 bg-[var(--bg-deep)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-dim)]">
          <span className="text-yellow-500">*</span> 24h Gains, Growth %, and Status are estimated by TopTube World Pro based on historical tracking. These metrics are not provided by YouTube.
        </div>
        
        {/* Most Popular YouTube Channels Section */}
        <section className="mt-8 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Most Popular YouTube Channels Worldwide</h2>
          <div className="space-y-4 text-[var(--text-secondary)] text-sm leading-relaxed">
            <p>
              The <strong>most subscribed YouTube channels</strong> represent the pinnacle of digital content creation. These channels 
              have attracted hundreds of millions of subscribers through exceptional content, consistent uploads, and strong audience 
              engagement. From entertainment giants to educational powerhouses, the <strong>top YouTube channels</strong> span every 
              content category imaginable.
            </p>
            
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mt-6 mb-3">What Makes These Channels Popular?</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[var(--bg-deep)] rounded-lg p-4">
                <h4 className="font-medium text-[var(--text-primary)] mb-2">Content Quality</h4>
                <p className="text-xs text-[var(--text-muted)]">
                  The <strong>most subscribed YouTube channels</strong> consistently produce high-quality content that resonates with 
                  global audiences. Production values range from professional studio setups to authentic personal vlogs.
                </p>
              </div>
              <div className="bg-[var(--bg-deep)] rounded-lg p-4">
                <h4 className="font-medium text-[var(--text-primary)] mb-2">Upload Consistency</h4>
                <p className="text-xs text-[var(--text-muted)]">
                  Regular upload schedules keep audiences engaged. Top creators on this <strong>YouTube channel ranking</strong> often 
                  post multiple times per week to maintain algorithmic visibility.
                </p>
              </div>
              <div className="bg-[var(--bg-deep)] rounded-lg p-4">
                <h4 className="font-medium text-[var(--text-primary)] mb-2">Audience Engagement</h4>
                <p className="text-xs text-[var(--text-muted)]">
                  Building community through comments, live streams, and social media interaction helps 
                  <strong> top YouTube channels</strong> convert viewers into loyal subscribers.
                </p>
              </div>
              <div className="bg-[var(--bg-deep)] rounded-lg p-4">
                <h4 className="font-medium text-[var(--text-primary)] mb-2">Global Appeal</h4>
                <p className="text-xs text-[var(--text-muted)]">
                  Many channels on the <strong>YouTube subscriber leaderboard</strong> create content that transcends language barriers, 
                  including music, gaming, and visual entertainment.
                </p>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-[var(--text-primary)] mt-6 mb-3">Related Rankings</h3>
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
          </div>
        </section>

        {/* Comprehensive YouTube Leaderboard Guide */}
        <section className="mt-8 bg-[var(--bg-deep)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">The Definitive Guide to YouTube Subscriber Rankings</h2>
          
          <article className="space-y-6 text-[var(--text-secondary)] text-sm leading-relaxed">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Understanding the YouTube Subscriber Leaderboard</h3>
              <p className="mb-4">
                The YouTube subscriber leaderboard represents more than just numbers—it's a living document of digital culture, showing which creators and content types resonate most with global audiences. Every day, millions of viewers make the decision to click the subscribe button, signaling their intent to return for more content. These collective choices shape the rankings you see on this page, creating a constantly evolving picture of YouTube's most influential voices.
              </p>
              <p className="mb-4">
                Our leaderboard tracks over {channels.length} of the world's most subscribed YouTube channels, updated regularly using official data from the YouTube Data API. Unlike unofficial tracking tools that rely on estimates or delayed data, TopTube World Pro provides accurate, timely subscriber counts that reflect the current state of YouTube's competitive landscape. We've designed this leaderboard to serve creators, marketers, researchers, and YouTube enthusiasts who need reliable data for decision-making.
              </p>
              <p>
                The channels on this leaderboard span every major content category: music, entertainment, children's content, gaming, education, sports, and more. They represent creators from dozens of countries, speaking numerous languages, yet all competing for the same prize—the attention and loyalty of YouTube's 2.7 billion monthly active users. Understanding who succeeds on this leaderboard, and why, provides invaluable insights into the forces shaping digital entertainment.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">How YouTube Channels Gain Subscribers</h3>
              <p className="mb-4">
                Subscriber growth on YouTube results from a complex interplay of content quality, algorithmic promotion, external marketing, and audience psychology. The most successful channels understand that subscribers aren't just passive viewers—they're community members who've chosen to form an ongoing relationship with a creator. Building that relationship requires consistency, authenticity, and a deep understanding of what audiences value.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Content Strategy:</strong> Top channels develop distinctive content strategies that set them apart from competitors. MrBeast, for example, built his empire on expensive, elaborate challenges that no one else could replicate at scale. T-Series leverages India's prolific film industry to publish multiple music videos daily. Cocomelon perfected the formula for educational children's content that parents trust and kids love. Each successful channel found its unique angle and executed relentlessly.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Algorithm Optimization:</strong> YouTube's recommendation algorithm significantly influences which channels grow fastest. The algorithm favors content that keeps viewers on the platform—videos with high watch time, strong click-through rates, and patterns of viewer retention. Channels that understand these metrics can optimize their thumbnails, titles, video lengths, and content pacing to maximize algorithmic promotion. However, over-optimization can backfire if it comes at the expense of genuine viewer satisfaction.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Cross-Platform Promotion:</strong> Many top channels leverage other social media platforms to drive YouTube subscribers. TikTok, Instagram, Twitter, and even traditional media coverage can expose new audiences to a creator's content. Short clips that go viral on other platforms often funnel viewers back to YouTube, where they discover the full content library and choose to subscribe.
              </p>
              <p>
                <strong className="text-[var(--text-primary)]">Collaboration and Networking:</strong> Collaborations between popular creators expose each channel's audience to the other, creating mutual growth opportunities. Strategic collaborations can introduce creators to demographics they might never reach organically. The YouTube creator community, despite its competitive nature, often functions as an ecosystem where rising tides lift all boats.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">The Battle for #1: MrBeast vs. T-Series</h3>
              <p className="mb-4">
                The competition for YouTube's top spot represents one of the platform's most compelling narratives. For years, the question of "who has the most subscribers" has captivated millions, spawning dedicated tracking websites, viral campaigns, and intense community engagement. The rivalry between individual creators and corporate entities raises fundamental questions about the nature of YouTube stardom.
              </p>
              <p className="mb-4">
                T-Series, the Indian music and film production company, dominated the #1 position for an extended period. Their success stems from India's massive population, widespread adoption of mobile internet, and the cultural importance of Bollywood music. With a back catalog spanning decades of content and a steady stream of new releases, T-Series built subscriber growth into their business model. Every new movie soundtrack, every music video release, drives viewers to subscribe for more.
              </p>
              <p className="mb-4">
                MrBeast (Jimmy Donaldson) represents a different kind of success story. Starting from humble beginnings making gaming videos, he reinvented himself as an entertainment entrepreneur who treats each video as a major production. His formula combines viral-worthy concepts, genuine philanthropy, and relentless quality improvement. Unlike T-Series, which succeeds through volume and catalog depth, MrBeast succeeds through the individual impact of each upload.
              </p>
              <p>
                The rivalry between MrBeast and T-Series illustrates the diversity of paths to YouTube success. Both approaches—the content factory model and the blockbuster creator model—can achieve massive scale, but they represent fundamentally different philosophies. Understanding these approaches helps aspiring creators choose strategies that match their resources, talents, and goals.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Children's Content: The Billion-View Phenomenon</h3>
              <p className="mb-4">
                Some of YouTube's most-subscribed channels create content for children, a phenomenon that deserves special attention. Channels like Cocomelon, Vlad and Niki, Kids Diana Show, and Like Nastya have amassed hundreds of millions of subscribers and generate view counts that dwarf even the most popular adult content. Understanding this category provides crucial context for interpreting the leaderboard.
              </p>
              <p className="mb-4">
                Children's content benefits from unique viewing patterns. Young children often watch the same videos repeatedly—a behavior rare among adult viewers but perfectly normal for toddlers learning through repetition. This drives extraordinary view counts for individual videos; some Cocomelon nursery rhymes have exceeded 5 billion views each. The sheer volume of these repeat views pushes children's channels to the top of various metrics.
              </p>
              <p className="mb-4">
                Parents often use YouTube as a tool to occupy children during meal times, car rides, or when they need focused work time. This "babysitter" function creates extended viewing sessions that boost watch time metrics. YouTube's autoplay feature keeps content flowing, and the platform's kid-friendly content algorithms ensure children see more of what they've already watched.
              </p>
              <p>
                The economics of children's content differ from adult-focused channels. While CPM rates (cost per thousand views) are often lower for children's content due to advertising restrictions, the sheer volume of views compensates. Additionally, these channels often build merchandising empires around their characters, creating revenue streams that extend far beyond YouTube ad revenue. Cocomelon's character merchandise, for example, generates substantial income independent of the channel itself.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Music Channels and the Entertainment Industry</h3>
              <p className="mb-4">
                Music dominates YouTube viewership, and music-focused channels feature prominently in subscriber rankings. From official artist channels like BLACKPINK and BANGTANTV to record label compilation channels like T-Series and Zee Music Company, music content drives billions of daily views. YouTube has effectively become the world's largest music streaming platform, competing with Spotify, Apple Music, and other dedicated services.
              </p>
              <p className="mb-4">
                The music industry's relationship with YouTube has evolved dramatically. Initially skeptical of free streaming that might cannibalize sales, labels now embrace YouTube as a promotional and revenue-generating platform. Music videos serve as marketing tools for albums and tours while generating substantial advertising revenue. The platform's Content ID system allows rights holders to monetize fan uploads, turning user-generated content into an additional revenue stream.
              </p>
              <p className="mb-4">
                K-pop (Korean pop music) deserves special mention for its mastery of YouTube strategy. Groups like BTS (BANGTANTV) and BLACKPINK have built global fanbases through YouTube, using the platform for music video premieres, behind-the-scenes content, and direct fan engagement. K-pop fans are notoriously dedicated, organizing streaming parties to boost view counts and competing to break YouTube records. This organized fandom activity creates viewership spikes that few other content categories can match.
              </p>
              <p>
                Indian music channels like T-Series, Zee Music Company, and Sony Music India benefit from the prolific output of Bollywood and regional film industries. India produces more films annually than any other country, and each film's soundtrack becomes YouTube content. This creates an almost industrial-scale content production pipeline that drives steady subscriber growth independent of viral hits.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Geographic Distribution of Top Channels</h3>
              <p className="mb-4">
                The geographic distribution of top YouTube channels reflects broader patterns in internet adoption, content creation infrastructure, and cultural factors. While American creators have historically dominated English-language content, the global nature of YouTube means channels from any country can achieve worldwide success if their content transcends language barriers.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">United States:</strong> American channels benefit from early YouTube adoption, established creator networks, and access to capital for high-production content. MrBeast, Cocomelon, and many children's content channels operate from the US. The American advertising market also offers higher CPM rates, making US-based channels more economically sustainable.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">India:</strong> India represents YouTube's largest and fastest-growing market. Channels like T-Series, SET India, Zee Music Company, Sony SAB, and Goldmines have built massive subscriber bases serving India's 1.4 billion population. The combination of widespread smartphone adoption, affordable mobile data, and cultural affinity for video entertainment has made India crucial to YouTube's global strategy.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">South Korea:</strong> South Korea punches far above its population weight in YouTube rankings. K-pop channels like BLACKPINK, BANGTANTV, and HYBE LABELS have global audiences that dwarf the country's 52 million population. South Korea's sophisticated entertainment industry, combined with highly organized international fan communities, creates a unique success pattern.
              </p>
              <p>
                <strong className="text-[var(--text-primary)]">Brazil and Latin America:</strong> Portuguese and Spanish-speaking channels benefit from large, linguistically connected populations. Brazilian channel Canal KondZilla pioneered the funk music video genre, while creators from Mexico, Argentina, and other Latin American countries have built substantial audiences. The shared language across multiple countries creates natural advantages for content distribution.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">What Our Metrics Mean</h3>
              <p className="mb-4">
                This leaderboard displays several metrics designed to give you a complete picture of each channel's performance. Understanding these metrics helps you interpret the data effectively and identify meaningful patterns.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Subscriber Count:</strong> The total number of subscribers to the channel, sourced from the YouTube Data API. This represents the primary ranking metric—channels are sorted by subscriber count from highest to lowest. Note that YouTube occasionally rounds subscriber counts for display purposes, particularly for very large channels.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Rank Change:</strong> The change in ranking position since our last update. A green upward arrow indicates improved ranking (the channel has climbed the leaderboard), while a red downward arrow indicates declined ranking. This metric helps identify channels with momentum—those gaining ground on competitors.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">24h Gain:</strong> The estimated number of new subscribers gained in the last 24 hours. This metric is calculated by comparing current subscriber counts with historical data from our tracking system. Note that this is an estimate based on our data capture intervals and may differ slightly from actual gains.
              </p>
              <p>
                <strong className="text-[var(--text-primary)]">Viral Status:</strong> Our proprietary classification system that categorizes channels based on their recent growth patterns. "Exploding" channels show exceptional growth momentum, "Rising Fast" channels demonstrate strong upward trends, "Stable" channels maintain consistent positions, and "Slowing" channels show declining growth rates. This predictive indicator helps identify channels poised for breakout success or those losing momentum.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Tips for Content Creators</h3>
              <p className="mb-4">
                Studying this leaderboard offers valuable lessons for aspiring and established YouTube creators. While simply copying what top channels do rarely works, understanding the principles behind their success can inform your own content strategy.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Find Your Niche:</strong> Every top channel occupies a specific niche, even if that niche is quite broad. MrBeast owns "expensive stunts and philanthropy." Cocomelon owns "3D animated nursery rhymes." Rather than competing directly with established leaders, find underserved niches where you can become the dominant player.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Prioritize Quality Over Quantity:</strong> While some channels succeed through high-volume posting (T-Series), most individual creators benefit from focusing on fewer, higher-quality videos. A single viral video can drive more subscribers than months of mediocre uploads. Invest time in research, production, and editing.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Study Thumbnail and Title Patterns:</strong> Click-through rate significantly influences algorithmic promotion. Study how top channels craft thumbnails and titles that generate curiosity without resorting to clickbait. Notice patterns in color usage, facial expressions, text overlays, and emotional hooks.
              </p>
              <p>
                <strong className="text-[var(--text-primary)]">Build Community:</strong> Subscribers are more valuable when they're engaged community members rather than passive numbers. Respond to comments, create content that encourages discussion, and make viewers feel like participants in your channel's journey. Engaged communities drive the early views and engagement that trigger algorithmic promotion.
              </p>
            </div>

            <div className="pt-4 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--text-dim)]">
                <em>Data for this <strong>YouTube subscriber leaderboard</strong> is sourced from the YouTube Data API. Growth statistics 
                and viral predictions are calculated by TopTube World Pro using proprietary algorithms. Rankings are updated multiple times daily to ensure accuracy. See our <Link to="/methodology" className="text-red-400 hover:text-red-300">Methodology</Link> page for complete details on our data collection and analysis processes.</em>
              </p>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
};

// ==================== TOP 100 PAGE (High Traffic SEO Page) ====================



export { LeaderboardPage };
