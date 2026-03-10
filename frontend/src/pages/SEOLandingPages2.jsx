import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { TrendingUp, Users, Globe, Crown, ChevronRight, PlayCircle, Award, Zap, Star } from 'lucide-react';
import { useSEO, JsonLd } from '../hooks/useSEO';
import { API, SITE_URL } from '../utils/constants';
import { formatNumber } from '../utils/format';

// ==================== WHO HAS THE MOST SUBSCRIBERS ON YOUTUBE ====================
export const WhoHasMostSubscribersPage = () => {
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const year = new Date().getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API}/leaderboard/global?limit=20`);
        setChannels(response.data.channels || []);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useSEO({
    title: `Who Has the Most Subscribers on YouTube ${year}? | Live Rankings`,
    description: `Find out who has the most subscribers on YouTube in ${year}. MrBeast leads with 470M+ subscribers. See the complete top 20 most subscribed YouTube channels updated live.`,
    keywords: `who has the most subscribers on youtube, most subscribed youtube channel, most subscribers on youtube, who has the most subs on youtube, youtube most subscribers ${year}`,
    canonical: `${SITE_URL}/who-has-most-subscribers-youtube`
  });

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Who has the most subscribers on YouTube?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": channels[0] ? `${channels[0].title} currently has the most subscribers on YouTube with ${formatNumber(channels[0].subscriber_count)} subscribers as of ${year}.` : "MrBeast currently has the most subscribers on YouTube."
        }
      },
      {
        "@type": "Question",
        "name": "Who is the #1 YouTuber?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": channels[0] ? `The #1 YouTuber by subscriber count is ${channels[0].title} from ${channels[0].country_name}.` : "MrBeast is the #1 YouTuber by subscriber count."
        }
      },
      {
        "@type": "Question",
        "name": "How many subscribers does the most subscribed YouTube channel have?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": channels[0] ? `The most subscribed YouTube channel has ${formatNumber(channels[0].subscriber_count)} subscribers.` : "The most subscribed YouTube channel has over 470 million subscribers."
        }
      }
    ]
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const topChannel = channels[0];

  return (
    <div className="py-8" data-testid="who-most-subscribers-page">
      <JsonLd data={schemaData} />
      <div className="max-w-6xl mx-auto px-4">
        {/* Hero Section */}
        <header className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
            Who Has the Most Subscribers on YouTube?
          </h1>
          <p className="text-xl text-[var(--text-muted)] max-w-3xl mx-auto">
            The definitive answer to one of the internet's most asked questions, updated in real-time
          </p>
        </header>

        {/* The Answer - Featured */}
        {topChannel && (
          <section className="bg-gradient-to-br from-red-500/20 to-red-900/20 border border-red-500/30 rounded-2xl p-8 mb-12">
            <div className="text-center">
              <div className="text-sm text-red-400 uppercase tracking-wider mb-2">The Answer</div>
              <h2 className="text-4xl md:text-6xl font-bold text-[var(--text-primary)] mb-4">
                {topChannel.title}
              </h2>
              <div className="text-5xl md:text-7xl font-black text-red-500 mb-4">
                {formatNumber(topChannel.subscriber_count)}
              </div>
              <div className="text-xl text-[var(--text-muted)] mb-6">Subscribers</div>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <span className="px-4 py-2 bg-[var(--bg-card)] rounded-full text-sm">
                  🏆 #{topChannel.current_rank || 1} Worldwide
                </span>
                <span className="px-4 py-2 bg-[var(--bg-card)] rounded-full text-sm">
                  {topChannel.country_flag || '🌍'} {topChannel.country_name}
                </span>
                <span className="px-4 py-2 bg-[var(--bg-card)] rounded-full text-sm">
                  +{formatNumber(topChannel.daily_subscriber_gain || 0)} today
                </span>
              </div>
            </div>
          </section>
        )}

        {/* SEO Content */}
        <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">The Most Subscribed YouTube Channel in {year}</h2>
          <div className="text-[var(--text-secondary)] text-sm leading-relaxed space-y-4">
            <p>
              <strong>"Who has the most subscribers on YouTube?"</strong> is one of the most frequently searched questions about the platform. 
              The answer as of {year} is <strong>{topChannel?.title || 'MrBeast'}</strong>, with an incredible {formatNumber(topChannel?.subscriber_count || 470000000)} subscribers 
              and counting. This represents a massive achievement in the world of online content creation.
            </p>
            <p>
              The race for YouTube's most subscribers has been one of the platform's most compelling narratives. The current leader surpassed 
              T-Series (the Indian music company that previously held the #1 spot) through a combination of viral content, massive production 
              budgets, and a deep understanding of what audiences want to watch.
            </p>
            <p>
              What makes the most subscribed YouTube channel special isn't just the numbers—it's the consistent ability to create content 
              that captures global attention. From elaborate challenges to philanthropic stunts, the content strategy focuses on creating 
              must-watch moments that drive both views and subscriptions.
            </p>
          </div>
        </section>

        {/* Full Top 20 List */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Complete Top 20 Most Subscribed YouTube Channels</h2>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-[var(--bg-deep)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-dim)] uppercase">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-dim)] uppercase">Channel</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-dim)] uppercase">Subscribers</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-dim)] uppercase hidden md:table-cell">Country</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {channels.map((channel, idx) => (
                  <tr 
                    key={channel.channel_id} 
                    className="hover:bg-[var(--bg-hover)] cursor-pointer transition-colors"
                    onClick={() => navigate(`/channel/${channel.channel_id}`)}
                  >
                    <td className="px-4 py-3">
                      <span className={`font-bold ${idx < 3 ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={channel.thumbnail_url} 
                          alt={channel.title} 
                          className="w-10 h-10 rounded-full"
                          loading="lazy"
                        />
                        <span className="font-medium text-[var(--text-primary)]">{channel.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-[var(--text-primary)]">{formatNumber(channel.subscriber_count)}</span>
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell text-[var(--text-muted)]">
                      {channel.country_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-center mt-4">
            <Link to="/leaderboard" className="text-red-500 hover:text-red-400 font-medium">
              View Full Leaderboard →
            </Link>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-[var(--bg-deep)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Who has the most subscribers on YouTube in {year}?</h3>
              <p className="text-[var(--text-secondary)]">
                {topChannel?.title || 'MrBeast'} currently has the most subscribers on YouTube with {formatNumber(topChannel?.subscriber_count || 470000000)} subscribers.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">When did the current #1 become the most subscribed?</h3>
              <p className="text-[var(--text-secondary)]">
                MrBeast overtook T-Series to become the most subscribed YouTube channel in 2024, ending T-Series's multi-year reign at the top of the leaderboard.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Who was the first YouTuber to reach 100 million subscribers?</h3>
              <p className="text-[var(--text-secondary)]">
                T-Series became the first YouTube channel to reach 100 million subscribers in 2019, followed by PewDiePie shortly after.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Who has the most subscribers excluding corporations?</h3>
              <p className="text-[var(--text-secondary)]">
                Among individual content creators (excluding corporate channels like T-Series, Sony, and YouTube Movies), MrBeast holds the record for most subscribers.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

// ==================== YOUTUBE SUBSCRIBER COUNT LIVE ====================
export const YouTubeSubscriberCountLivePage = () => {
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const year = new Date().getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API}/leaderboard/global?limit=30`);
        setChannels(response.data.channels || []);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useSEO({
    title: `YouTube Subscriber Count Live ${year} - Real-Time Channel Stats`,
    description: `Track YouTube subscriber counts in real-time. Live updating stats for top channels including MrBeast, T-Series, PewDiePie, and more. Updated every minute.`,
    keywords: `youtube subscriber count live, youtube live subscriber count, real time youtube subscriber count, live sub count youtube, youtube subscriber tracker live`,
    canonical: `${SITE_URL}/youtube-subscriber-count-live`
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-8" data-testid="subscriber-count-live-page">
      <div className="max-w-6xl mx-auto px-4">
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-full text-red-400 text-sm mb-4">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            LIVE
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-3">
            YouTube Subscriber Count Live
          </h1>
          <p className="text-[var(--text-muted)] text-lg">
            Real-time subscriber tracking for the world's top YouTube channels
          </p>
        </header>

        {/* SEO Content */}
        <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Live YouTube Subscriber Tracking</h2>
          <div className="text-[var(--text-secondary)] text-sm leading-relaxed space-y-4">
            <p>
              Track <strong>YouTube subscriber counts live</strong> with our real-time monitoring system. Our data is sourced directly from the 
              YouTube Data API and updated continuously throughout the day, giving you the most accurate subscriber statistics available.
            </p>
            <p>
              Whether you're following a subscriber race, monitoring your favorite creator's growth, or researching YouTube channels for 
              business purposes, our live subscriber count tracker provides the data you need. See how channels like MrBeast, T-Series, 
              Cocomelon, and others are performing right now.
            </p>
            <p>
              Our <strong>live sub count</strong> feature shows not just current subscribers, but also daily gains, growth percentages, and 
              historical trends. This comprehensive view helps you understand not just where channels stand, but how quickly they're growing.
            </p>
          </div>
        </section>

        {/* Live Counter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {channels.slice(0, 12).map((channel, idx) => (
            <div 
              key={channel.channel_id}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 hover:border-red-500/50 cursor-pointer transition-all"
              onClick={() => navigate(`/channel/${channel.channel_id}`)}
            >
              <div className="flex items-center gap-3 mb-3">
                <img src={channel.thumbnail_url} alt="" className="w-12 h-12 rounded-full" loading="lazy" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[var(--text-primary)] truncate">{channel.title}</div>
                  <div className="text-xs text-[var(--text-dim)]">#{idx + 1} Worldwide</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-red-500 mb-1">
                {formatNumber(channel.subscriber_count)}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-green-500">+{formatNumber(channel.daily_subscriber_gain || 0)}</span>
                <span className="text-[var(--text-dim)]">today</span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mb-12">
          <Link to="/leaderboard" className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors">
            View All Live Counts <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Additional Content */}
        <section className="bg-[var(--bg-deep)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">How Our Live Subscriber Count Works</h2>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-[var(--text-secondary)]">
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">Real-Time Data</h3>
              <p>Our system connects directly to YouTube's official Data API to fetch the most current subscriber counts available.</p>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">Continuous Updates</h3>
              <p>Subscriber counts are refreshed multiple times per day, ensuring you always see the latest numbers.</p>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">Growth Tracking</h3>
              <p>We calculate daily, weekly, and monthly growth by comparing current counts with historical snapshots.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

// ==================== BIGGEST YOUTUBERS ====================
export const BiggestYouTubersPage = () => {
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const year = new Date().getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API}/leaderboard/global?limit=50`);
        setChannels(response.data.channels || []);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useSEO({
    title: `Biggest YouTubers ${year} - Top 50 Largest YouTube Channels`,
    description: `Meet the biggest YouTubers in ${year}. Complete list of the 50 largest YouTube channels by subscriber count, featuring MrBeast, T-Series, PewDiePie, and more.`,
    keywords: `biggest youtubers, biggest youtube channels, largest youtubers, biggest youtubers ${year}, top biggest youtubers, largest youtube channels`,
    canonical: `${SITE_URL}/biggest-youtubers`
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-8" data-testid="biggest-youtubers-page">
      <div className="max-w-6xl mx-auto px-4">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-3">
            Biggest YouTubers in {year}
          </h1>
          <p className="text-[var(--text-muted)] text-lg">
            The 50 largest YouTube channels ranked by total subscriber count
          </p>
        </header>

        {/* SEO Content */}
        <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">The Biggest YouTubers in the World</h2>
          <div className="text-[var(--text-secondary)] text-sm leading-relaxed space-y-4">
            <p>
              The <strong>biggest YouTubers</strong> have transformed from bedroom content creators into global media empires. These channels 
              command audiences larger than most countries' populations, with the top creators reaching hundreds of millions of subscribers.
            </p>
            <p>
              What makes someone a "big" YouTuber? It's not just about subscriber count—though that's the most visible metric. The biggest 
              YouTubers also generate billions of views, command premium advertising rates, and often build business empires extending far 
              beyond YouTube itself.
            </p>
            <p>
              This list of the <strong>biggest YouTube channels</strong> includes individual creators like MrBeast and PewDiePie, as well as 
              media companies like T-Series and Zee Music. Together, they represent the diverse landscape of YouTube success in {year}.
            </p>
          </div>
        </section>

        {/* Channel List */}
        <div className="space-y-4 mb-8">
          {channels.map((channel, idx) => (
            <div 
              key={channel.channel_id}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 hover:border-[var(--border-hover)] cursor-pointer transition-colors"
              onClick={() => navigate(`/channel/${channel.channel_id}`)}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  idx < 3 ? 'bg-red-500 text-white' : 'bg-[var(--bg-deep)] text-[var(--text-muted)]'
                }`}>
                  {idx + 1}
                </div>
                <img src={channel.thumbnail_url} alt="" className="w-14 h-14 rounded-full" loading="lazy" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[var(--text-primary)] text-lg">{channel.title}</div>
                  <div className="text-sm text-[var(--text-muted)]">{channel.country_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-[var(--text-primary)]">{formatNumber(channel.subscriber_count)}</div>
                  <div className="text-xs text-green-500">+{formatNumber(channel.daily_subscriber_gain || 0)} today</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link to="/leaderboard" className="text-red-500 hover:text-red-400 font-medium">
            View Complete Rankings →
          </Link>
        </div>
      </div>
    </div>
  );
};

// ==================== YOUTUBE RANKINGS ====================
export const YouTubeRankingsPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ channels: 0, countries: 0 });
  const year = new Date().getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API}/admin/stats`);
        setStats(response.data);
      } catch (error) {
        console.error("Error:", error);
      }
    };
    fetchData();
  }, []);

  useSEO({
    title: `YouTube Rankings ${year} - Complete Channel Leaderboards & Statistics`,
    description: `Official YouTube rankings for ${year}. Track subscriber counts, growth rates, and channel statistics for the world's top YouTubers across all categories.`,
    keywords: `youtube rankings, youtube channel rankings, youtube leaderboard, youtuber rankings, youtube subscriber rankings ${year}, youtube statistics`,
    canonical: `${SITE_URL}/youtube-rankings`
  });

  const rankingCategories = [
    { title: "Global Leaderboard", desc: "Top channels worldwide by subscribers", link: "/leaderboard", icon: Crown },
    { title: "By Country", desc: "Rankings for 197 countries", link: "/countries", icon: Globe },
    { title: "Trending Now", desc: "Fastest growing channels", link: "/trending", icon: TrendingUp },
    { title: "Rising Stars", desc: "Emerging creators to watch", link: "/rising-stars", icon: Star },
    { title: "Categories", desc: "Rankings by content type", link: "/categories", icon: PlayCircle },
    { title: "Milestones", desc: "Recent subscriber milestones", link: "/milestones", icon: Award },
  ];

  return (
    <div className="py-8" data-testid="youtube-rankings-page">
      <div className="max-w-6xl mx-auto px-4">
        <header className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
            YouTube Rankings {year}
          </h1>
          <p className="text-xl text-[var(--text-muted)] max-w-3xl mx-auto">
            The most comprehensive YouTube channel ranking and statistics platform
          </p>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm">
            <span className="text-[var(--text-primary)]"><strong>{stats.channels || 800}+</strong> Channels</span>
            <span className="text-[var(--text-dim)]">•</span>
            <span className="text-[var(--text-primary)]"><strong>{stats.countries || 197}</strong> Countries</span>
            <span className="text-[var(--text-dim)]">•</span>
            <span className="text-[var(--text-primary)]">Updated <strong>Daily</strong></span>
          </div>
        </header>

        {/* SEO Content */}
        <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">About Our YouTube Rankings</h2>
          <div className="text-[var(--text-secondary)] text-sm leading-relaxed space-y-4">
            <p>
              TopTube World Pro provides the most comprehensive <strong>YouTube rankings</strong> available. We track over {stats.channels || 800} channels 
              across {stats.countries || 197} countries, updating subscriber counts and statistics multiple times daily using the official YouTube Data API.
            </p>
            <p>
              Our <strong>YouTube channel rankings</strong> go beyond simple subscriber counts. We calculate growth rates, track historical trends, 
              predict viral potential, and provide detailed analytics that help you understand the YouTube landscape. Whether you're a creator 
              benchmarking against competitors, a marketer researching influencers, or simply a YouTube enthusiast, our rankings provide the data you need.
            </p>
            <p>
              Explore our various ranking categories below to discover the <strong>top YouTubers</strong> in your area of interest. From global 
              leaderboards to country-specific rankings, from trending channels to rising stars, we cover every angle of YouTube success.
            </p>
          </div>
        </section>

        {/* Ranking Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {rankingCategories.map((cat) => (
            <Link 
              key={cat.link}
              to={cat.link}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 hover:border-red-500/50 transition-colors group"
            >
              <cat.icon className="w-8 h-8 text-red-500 mb-3" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1 group-hover:text-red-500 transition-colors">
                {cat.title}
              </h3>
              <p className="text-sm text-[var(--text-muted)]">{cat.desc}</p>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-red-500/10 to-red-900/10 border border-red-500/20 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">Start Exploring</h2>
          <p className="text-[var(--text-muted)] mb-6">Dive into our comprehensive YouTube statistics and rankings</p>
          <Link to="/leaderboard" className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors">
            View Global Leaderboard <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

// ==================== MRBEAST SUBSCRIBER COUNT ====================
export const MrBeastSubscriberCountPage = () => {
  const navigate = useNavigate();
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const year = new Date().getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // MrBeast's channel ID
        const response = await axios.get(`${API}/channels/UCX6OQ3DkcsbYNE6H8uQQuVA`);
        setChannel(response.data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useSEO({
    title: `MrBeast Subscriber Count ${year} - Live Stats & Growth Tracker`,
    description: `Track MrBeast's subscriber count live. Currently at ${channel ? formatNumber(channel.subscriber_count) : '470M+'} subscribers. See real-time growth stats and historical data.`,
    keywords: `mrbeast subscriber count, mrbeast subscribers, mrbeast live sub count, mrbeast subscriber count live, how many subscribers does mrbeast have`,
    canonical: `${SITE_URL}/mrbeast-subscriber-count`
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-8" data-testid="mrbeast-subscriber-count-page">
      <div className="max-w-4xl mx-auto px-4">
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-full text-red-400 text-sm mb-4">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            LIVE
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-3">
            MrBeast Subscriber Count
          </h1>
        </header>

        {channel && (
          <>
            {/* Main Stats Card */}
            <div className="bg-gradient-to-br from-red-500/20 to-red-900/20 border border-red-500/30 rounded-2xl p-8 text-center mb-8">
              <img src={channel.thumbnail_url} alt="MrBeast" className="w-24 h-24 rounded-full mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{channel.title}</h2>
              <div className="text-5xl md:text-7xl font-black text-red-500 mb-2">
                {formatNumber(channel.subscriber_count)}
              </div>
              <div className="text-xl text-[var(--text-muted)] mb-4">Subscribers</div>
              <div className="flex items-center justify-center gap-4 flex-wrap text-sm">
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full">
                  +{formatNumber(channel.daily_subscriber_gain || 0)} today
                </span>
                <span className="px-3 py-1 bg-[var(--bg-card)] text-[var(--text-muted)] rounded-full">
                  #{channel.current_rank || 1} Worldwide
                </span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-[var(--text-primary)]">{formatNumber(channel.view_count)}</div>
                <div className="text-xs text-[var(--text-dim)]">Total Views</div>
              </div>
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-[var(--text-primary)]">{channel.video_count}</div>
                <div className="text-xs text-[var(--text-dim)]">Videos</div>
              </div>
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-500">+{formatNumber(channel.weekly_subscriber_gain || 0)}</div>
                <div className="text-xs text-[var(--text-dim)]">This Week</div>
              </div>
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-500">+{formatNumber(channel.monthly_subscriber_gain || 0)}</div>
                <div className="text-xs text-[var(--text-dim)]">This Month</div>
              </div>
            </div>
          </>
        )}

        {/* SEO Content */}
        <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">About MrBeast's Subscriber Count</h2>
          <div className="text-[var(--text-secondary)] text-sm leading-relaxed space-y-4">
            <p>
              <strong>MrBeast</strong> (Jimmy Donaldson) is the most subscribed individual content creator on YouTube with over 
              {channel ? ` ${formatNumber(channel.subscriber_count)}` : ' 470 million'} subscribers. He achieved this milestone by creating 
              viral challenge videos, elaborate stunts, and philanthropic content that consistently generates hundreds of millions of views.
            </p>
            <p>
              MrBeast's rise to the top of YouTube was marked by his innovative approach to content creation. He pioneered the "expensive 
              challenge" format, where he invests millions of dollars into single videos—an approach that no other creator has successfully 
              replicated at his scale. His videos regularly trend globally and set records for view counts.
            </p>
            <p>
              Beyond YouTube, MrBeast has built a business empire including Feastables (a snack company), Beast Burger, and Beast Philanthropy. 
              His subscriber count continues to grow as he expands his content across multiple languages through dubbed channels.
            </p>
          </div>
        </section>

        <div className="text-center">
          <Link to={`/channel/${channel?.channel_id}`} className="text-red-500 hover:text-red-400 font-medium">
            View Full MrBeast Stats →
          </Link>
        </div>
      </div>
    </div>
  );
};
