import React, { lazy, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Home, Trophy } from 'lucide-react';
import { API } from '../utils/constants';
import { formatNumber } from '../utils/format';
import { Header, ViralBadge } from '../components/common';
import { Breadcrumb, FAQSection, Top100SEO } from '../components/seo';

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

        {/* Editorial Content Section */}
        <div className="bg-[#111] border border-[#222] rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">About the Top 100 YouTube Channels</h2>
          <div className="text-gray-300 text-sm space-y-3">
            <p>
              The Top 100 Most Subscribed YouTube Channels represents the elite tier of content creators on the world's largest 
              video platform. These channels have achieved subscriber counts that would rival the populations of small countries, 
              with the top channels exceeding hundreds of millions of subscribers each.
            </p>
            <p>
              This list includes a diverse mix of content types: individual creators like MrBeast who built personal brands, 
              music labels like T-Series that aggregate vast catalogs, entertainment networks, children's content providers, 
              and sports organizations. The variety reflects YouTube's evolution from a platform for amateur videos to a 
              global entertainment hub.
            </p>
            <h3 className="text-lg font-semibold text-white mt-4">What It Takes to Reach the Top 100</h3>
            <p>
              Breaking into the Top 100 requires tens of millions of subscribers - a threshold that continues to rise as 
              YouTube's audience grows. Success typically comes from a combination of factors: consistent high-quality content, 
              strategic upload schedules, audience engagement, and often, diversification across multiple content formats 
              including YouTube Shorts.
            </p>
            <p className="text-xs text-gray-500 pt-2 border-t border-[#222]">
              <em>Subscriber counts are sourced from the YouTube Data API. Growth metrics are calculated by TopTube World Pro 
              based on our historical tracking data and are estimates.</em>
            </p>
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



export { Top100Page };
