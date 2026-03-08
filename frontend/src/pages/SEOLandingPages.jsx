import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { TrendingUp, Users, Globe, Crown, ChevronRight, PlayCircle } from 'lucide-react';
import { useSEO, JsonLd } from '../hooks/useSEO';
import { API, SITE_URL } from '../utils/constants';
import { formatNumber } from '../utils/format';

// Top YouTube Channels Landing Page
export const TopYouTubeChannelsPage = () => {
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
    title: `Top YouTube Channels ${year} - Most Popular YouTubers Ranked`,
    description: `Discover the top YouTube channels in ${year}. Complete ranking of the most popular YouTubers by subscriber count, including MrBeast, T-Series, Cocomelon, and more.`,
    keywords: `top youtube channels, top youtube channels ${year}, most popular youtube channels, biggest youtube channels, top youtubers, popular youtubers ${year}`,
    canonical: `${SITE_URL}/top-youtube-channels`
  });

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Top YouTube Channels ${year}`,
    "description": `Ranking of the most popular YouTube channels in ${year}`,
    "url": `${SITE_URL}/top-youtube-channels`,
    "numberOfItems": channels.length,
    "itemListElement": channels.slice(0, 50).map((channel, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "name": channel.title || channel.name,
      "url": `https://youtube.com/channel/${channel.channel_id}`
    }))
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-8" data-testid="top-youtube-channels-page">
      <JsonLd data={schemaData} />
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-3">
            Top YouTube Channels {year}
          </h1>
          <p className="text-[var(--text-muted)] text-lg">
            The most popular YouTube channels ranked by subscriber count
          </p>
        </header>

        {/* SEO Introduction */}
        <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Most Popular YouTube Channels in {year}</h2>
          <div className="text-[var(--text-secondary)] text-sm leading-relaxed space-y-4">
            <p>
              Looking for the <strong>top YouTube channels</strong>? You've come to the right place. This comprehensive ranking 
              showcases the most popular YouTubers based on their total subscriber count. From entertainment juggernauts like 
              MrBeast to music powerhouses like T-Series, these channels represent the pinnacle of YouTube success.
            </p>
            <p>
              The <strong>top YouTube channels</strong> have collectively amassed billions of subscribers and hundreds of billions 
              of views. They span diverse content categories including entertainment, music, gaming, education, and kids' content. 
              What unites them is their ability to consistently create content that resonates with massive global audiences.
            </p>
            <p>
              Our ranking is updated in real-time using data from the YouTube Data API, ensuring you always have access to the 
              most current subscriber counts and channel statistics. Whether you're researching competitors, scouting influencers, 
              or simply curious about YouTube's biggest stars, this list has you covered.
            </p>
          </div>
        </section>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-[var(--text-primary)]">{channels.length}</div>
            <div className="text-xs text-[var(--text-dim)]">Channels Ranked</div>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-[var(--text-primary)]">{formatNumber(channels.reduce((sum, c) => sum + (c.subscriber_count || 0), 0))}</div>
            <div className="text-xs text-[var(--text-dim)]">Total Subscribers</div>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">+{formatNumber(channels.reduce((sum, c) => sum + (c.daily_subscriber_gain || 0), 0))}</div>
            <div className="text-xs text-[var(--text-dim)]">Daily Gains</div>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-[var(--text-primary)]">197</div>
            <div className="text-xs text-[var(--text-dim)]">Countries</div>
          </div>
        </div>

        {/* Channel List */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Top 50 YouTube Channels</h2>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg overflow-hidden">
            {channels.slice(0, 50).map((channel, idx) => (
              <div 
                key={channel.channel_id}
                onClick={() => navigate(`/channel/${channel.channel_id}`)}
                className="flex items-center gap-4 p-4 hover:bg-[var(--bg-hover)] cursor-pointer border-b border-[var(--border)] last:border-b-0"
              >
                <div className="w-8 text-center font-bold text-[var(--text-dim)]">#{idx + 1}</div>
                <img src={channel.thumbnail_url} alt={channel.title} className="w-10 h-10 rounded-full" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[var(--text-primary)] truncate">{channel.title || channel.name}</div>
                  <div className="text-xs text-[var(--text-dim)]">{channel.country_name}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[var(--text-primary)]">{formatNumber(channel.subscriber_count)}</div>
                  <div className="text-xs text-green-400">+{formatNumber(channel.daily_subscriber_gain || 0)}/day</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Related Pages */}
        <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Explore More Rankings</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link to="/leaderboard" className="flex items-center gap-3 p-4 bg-[var(--bg-deep)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors">
              <Crown className="w-8 h-8 text-yellow-500" />
              <div>
                <div className="font-medium text-[var(--text-primary)]">Most Subscribed YouTube Channels Leaderboard</div>
                <div className="text-xs text-[var(--text-dim)]">Complete live ranking with filters</div>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--text-dim)] ml-auto" />
            </Link>
            <Link to="/trending" className="flex items-center gap-3 p-4 bg-[var(--bg-deep)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div>
                <div className="font-medium text-[var(--text-primary)]">Fastest Growing YouTube Channels</div>
                <div className="text-xs text-[var(--text-dim)]">See who's trending now</div>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--text-dim)] ml-auto" />
            </Link>
            <Link to="/countries" className="flex items-center gap-3 p-4 bg-[var(--bg-deep)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors">
              <Globe className="w-8 h-8 text-blue-500" />
              <div>
                <div className="font-medium text-[var(--text-primary)]">Top YouTube Channels by Country</div>
                <div className="text-xs text-[var(--text-dim)]">Regional rankings</div>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--text-dim)] ml-auto" />
            </Link>
            <Link to="/top-100" className="flex items-center gap-3 p-4 bg-[var(--bg-deep)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors">
              <PlayCircle className="w-8 h-8 text-red-500" />
              <div>
                <div className="font-medium text-[var(--text-primary)]">Top 100 Most Subscribed YouTubers</div>
                <div className="text-xs text-[var(--text-dim)]">Elite channel list</div>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--text-dim)] ml-auto" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

// Most Subscribed YouTube Channels Landing Page
export const MostSubscribedYouTubeChannelsPage = () => {
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const year = new Date().getFullYear();

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

  useSEO({
    title: `Most Subscribed YouTube Channels ${year} - Live Subscriber Count`,
    description: `See the most subscribed YouTube channels with live subscriber counts. ${channels[0]?.title || 'MrBeast'} leads with ${formatNumber(channels[0]?.subscriber_count || 0)} subscribers. Updated every 10 minutes.`,
    keywords: `most subscribed youtube channels, most subscribed youtube channels ${year}, most subscribed youtubers, youtube subscriber count, highest subscribed youtube channel`,
    canonical: `${SITE_URL}/most-subscribed-youtube-channels`
  });

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Most Subscribed YouTube Channels ${year}`,
    "url": `${SITE_URL}/most-subscribed-youtube-channels`,
    "numberOfItems": channels.length,
    "itemListOrder": "https://schema.org/ItemListOrderDescending",
    "itemListElement": channels.slice(0, 100).map((channel, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "name": channel.title || channel.name,
      "url": `https://youtube.com/channel/${channel.channel_id}`,
      "item": {
        "@type": "Organization",
        "name": channel.title || channel.name,
        "interactionStatistic": {
          "@type": "InteractionCounter",
          "interactionType": "https://schema.org/SubscribeAction",
          "userInteractionCount": channel.subscriber_count
        }
      }
    }))
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-8" data-testid="most-subscribed-page">
      <JsonLd data={schemaData} />
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-3">
            Most Subscribed YouTube Channels {year}
          </h1>
          <p className="text-[var(--text-muted)] text-lg">
            Live subscriber counts for the world's most subscribed YouTubers
          </p>
        </header>

        {/* SEO Content */}
        <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Who Has the Most YouTube Subscribers?</h2>
          <div className="text-[var(--text-secondary)] text-sm leading-relaxed space-y-4">
            <p>
              As of {year}, <strong>{channels[0]?.title || 'MrBeast'}</strong> holds the title of the <strong>most subscribed YouTube channel</strong> with 
              <strong> {formatNumber(channels[0]?.subscriber_count || 0)} subscribers</strong>. This remarkable achievement represents years of 
              consistent content creation and audience engagement, making it the highest subscribed YouTube channel in the world.
            </p>
            <p>
              The race for <strong>most subscribed YouTube channels</strong> has intensified in recent years. What was once dominated by 
              record labels and corporate channels has shifted towards individual creators who have built massive personal brands. 
              The <strong>most subscribed YouTubers</strong> now include entertainment creators, gaming personalities, and educational 
              content providers.
            </p>
            <p>
              Our live tracking system monitors subscriber counts for hundreds of channels, updating every 10 minutes to ensure 
              you always have access to the most current data. Whether you're tracking your favorite creator's growth or researching 
              the <strong>highest subscribed YouTube channels</strong>, this page provides comprehensive, real-time statistics.
            </p>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mt-4">Current Top 5 Most Subscribed</h3>
            <ol className="list-decimal list-inside space-y-2 text-[var(--text-muted)]">
              {channels.slice(0, 5).map((channel, idx) => (
                <li key={channel.channel_id}>
                  <Link to={`/channel/${channel.channel_id}`} className="text-red-400 hover:text-red-300">
                    {channel.title || channel.name}
                  </Link>
                  <span className="text-[var(--text-dim)]"> - {formatNumber(channel.subscriber_count)} subscribers</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Channel Grid */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Complete List of Most Subscribed Channels</h2>
          <div className="grid gap-2">
            {channels.map((channel, idx) => (
              <div 
                key={channel.channel_id}
                onClick={() => navigate(`/channel/${channel.channel_id}`)}
                className="flex items-center gap-4 p-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg-hover)] cursor-pointer"
              >
                <div className="w-8 text-center font-bold text-[var(--text-dim)]">#{idx + 1}</div>
                <img src={channel.thumbnail_url} alt="" className="w-10 h-10 rounded-full" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[var(--text-primary)] truncate">{channel.title || channel.name}</div>
                  <div className="text-xs text-[var(--text-dim)]">{channel.country_name}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[var(--text-primary)]">{formatNumber(channel.subscriber_count)}</div>
                  <div className="text-xs text-[var(--text-dim)]">subscribers</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Internal Links */}
        <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Related Rankings</h2>
          <div className="flex flex-wrap gap-3">
            <Link to="/leaderboard" className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              Most Subscribed YouTube Channels Leaderboard →
            </Link>
            <Link to="/trending" className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm">
              Fastest Growing Channels →
            </Link>
            <Link to="/top-youtube-channels-by-country" className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 text-sm">
              Top Channels by Country →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

// YouTube Subscriber Ranking Landing Page
export const YouTubeSubscriberRankingPage = () => {
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const year = new Date().getFullYear();

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

  useSEO({
    title: `YouTube Subscriber Ranking ${year} - Channel Rankings by Subscribers`,
    description: `Official YouTube subscriber ranking for ${year}. See how YouTube channels rank by subscriber count. Live leaderboard updated every 10 minutes.`,
    keywords: `youtube subscriber ranking, youtube channel ranking, youtube subscriber count ranking, youtube rankings by subscribers, youtube subscriber leaderboard`,
    canonical: `${SITE_URL}/youtube-subscriber-ranking`
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-8" data-testid="subscriber-ranking-page">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-3">
            YouTube Subscriber Ranking {year}
          </h1>
          <p className="text-[var(--text-muted)] text-lg">
            Complete YouTube channel rankings based on subscriber count
          </p>
        </header>

        {/* SEO Content */}
        <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">How YouTube Subscriber Rankings Work</h2>
          <div className="text-[var(--text-secondary)] text-sm leading-relaxed space-y-4">
            <p>
              The <strong>YouTube subscriber ranking</strong> system provides a comprehensive view of how channels compare based on 
              their total subscriber count. This <strong>YouTube channel ranking</strong> is updated in real-time, reflecting the 
              latest data from the YouTube Data API to give you accurate, up-to-the-minute statistics.
            </p>
            <p>
              Understanding <strong>YouTube subscriber count ranking</strong> helps content creators benchmark their performance 
              against competitors, marketers identify potential influencer partners, and researchers study platform dynamics. 
              Our <strong>YouTube rankings by subscribers</strong> cover channels from 197 countries across all content categories.
            </p>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mt-4">Ranking Methodology</h3>
            <ul className="list-disc list-inside space-y-1 text-[var(--text-muted)]">
              <li>Rankings are based purely on total subscriber count</li>
              <li>Data is sourced from the official YouTube Data API v3</li>
              <li>Rankings update every 10 minutes</li>
              <li>Growth metrics are calculated hourly</li>
              <li>Historical data enables trend analysis</li>
            </ul>
          </div>
        </section>

        {/* Top 100 Table */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">YouTube Subscriber Rankings - Top 100</h2>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-[var(--bg-deep)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs text-[var(--text-dim)] font-medium">Rank</th>
                  <th className="px-4 py-3 text-left text-xs text-[var(--text-dim)] font-medium">Channel</th>
                  <th className="px-4 py-3 text-right text-xs text-[var(--text-dim)] font-medium">Subscribers</th>
                  <th className="px-4 py-3 text-right text-xs text-[var(--text-dim)] font-medium hidden md:table-cell">24h Change</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((channel, idx) => (
                  <tr 
                    key={channel.channel_id}
                    onClick={() => navigate(`/channel/${channel.channel_id}`)}
                    className="border-t border-[var(--border)] hover:bg-[var(--bg-hover)] cursor-pointer"
                  >
                    <td className="px-4 py-3 text-[var(--text-dim)] font-bold">#{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={channel.thumbnail_url} alt="" className="w-8 h-8 rounded-full" />
                        <div>
                          <div className="text-[var(--text-primary)] font-medium">{channel.title || channel.name}</div>
                          <div className="text-xs text-[var(--text-dim)]">{channel.country_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--text-primary)] font-bold">{formatNumber(channel.subscriber_count)}</td>
                    <td className="px-4 py-3 text-right text-green-400 hidden md:table-cell">+{formatNumber(channel.daily_subscriber_gain || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Related Links */}
        <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">More YouTube Rankings</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link to="/leaderboard" className="block p-4 bg-[var(--bg-deep)] rounded-lg hover:bg-[var(--bg-hover)]">
              <div className="font-medium text-[var(--text-primary)] mb-1">Most Subscribed YouTube Channels Leaderboard</div>
              <div className="text-xs text-[var(--text-dim)]">Full leaderboard with advanced filters</div>
            </Link>
            <Link to="/top-youtube-channels" className="block p-4 bg-[var(--bg-deep)] rounded-lg hover:bg-[var(--bg-hover)]">
              <div className="font-medium text-[var(--text-primary)] mb-1">Top YouTube Channels</div>
              <div className="text-xs text-[var(--text-dim)]">Most popular YouTubers ranked</div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

// Top YouTube Channels by Country Landing Page
export const TopYouTubeChannelsByCountryPage = () => {
  const navigate = useNavigate();
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const year = new Date().getFullYear();

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

  useSEO({
    title: `Top YouTube Channels by Country ${year} - Regional YouTuber Rankings`,
    description: `Discover the top YouTube channels in every country. Find the most subscribed YouTubers from USA, India, Brazil, UK, and 190+ other countries.`,
    keywords: `top youtube channels by country, youtube channels by country, top youtubers by country, youtube rankings by country, most subscribed youtube channels by country`,
    canonical: `${SITE_URL}/top-youtube-channels-by-country`
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Sort countries by channel count
  const sortedCountries = [...countries].sort((a, b) => (b.channel_count || 0) - (a.channel_count || 0));

  return (
    <div className="py-8" data-testid="channels-by-country-page">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-3">
            Top YouTube Channels by Country {year}
          </h1>
          <p className="text-[var(--text-muted)] text-lg">
            Find the most subscribed YouTubers in any country
          </p>
        </header>

        {/* SEO Content */}
        <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">YouTube Rankings by Country</h2>
          <div className="text-[var(--text-secondary)] text-sm leading-relaxed space-y-4">
            <p>
              YouTube's global reach means that every country has its own unique creator ecosystem. Our 
              <strong> top YouTube channels by country</strong> rankings let you explore the most popular YouTubers in 
              any of the 197 countries we track. From the massive creator economies of the United States and India to 
              emerging markets in Africa and Southeast Asia, discover who dominates YouTube in each region.
            </p>
            <p>
              <strong>YouTube channels by country</strong> vary significantly in content type and style. While the US leads 
              in individual entertainment creators, India's top channels are often music labels and entertainment networks. 
              Understanding these regional differences is crucial for marketers, researchers, and content creators looking 
              to expand their reach.
            </p>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mt-4">Top Countries by Channel Count</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
              {sortedCountries.slice(0, 8).map(country => (
                <Link 
                  key={country.code}
                  to={`/country/${country.code}`}
                  className="p-3 bg-[var(--bg-deep)] rounded-lg hover:bg-[var(--bg-hover)] text-center"
                >
                  <div className="text-2xl mb-1">{country.flag_emoji}</div>
                  <div className="text-[var(--text-primary)] font-medium text-sm">{country.name}</div>
                  <div className="text-xs text-[var(--text-dim)]">{country.channel_count || 0} channels</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Country List */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">All Countries</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedCountries.map(country => (
              <Link
                key={country.code}
                to={`/country/${country.code}`}
                className="flex items-center gap-3 p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg-hover)]"
              >
                <span className="text-2xl">{country.flag_emoji}</span>
                <div className="flex-1">
                  <div className="font-medium text-[var(--text-primary)]">{country.name}</div>
                  <div className="text-xs text-[var(--text-dim)]">{country.channel_count || 0} channels tracked</div>
                </div>
                <ChevronRight className="w-5 h-5 text-[var(--text-dim)]" />
              </Link>
            ))}
          </div>
        </section>

        {/* Internal Links */}
        <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Related Rankings</h2>
          <div className="flex flex-wrap gap-3">
            <Link to="/leaderboard" className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              Most Subscribed YouTube Channels Leaderboard →
            </Link>
            <Link to="/top-youtube-channels" className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 text-sm">
              Top YouTube Channels →
            </Link>
            <Link to="/categories" className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 text-sm">
              Channels by Category →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};
