import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Filter, Flame, TrendingUp, Users, Zap } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { API, SITE_URL } from '../utils/constants';
import { formatNumber } from '../utils/format';
import { Header, ViralBadge } from '../components/common';

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
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">Rising Stars</h1>
          </div>
          <p className="text-[var(--text-muted)] text-lg">Discover the fastest growing YouTube channels under 50M subscribers</p>
          <p className="text-[var(--text-dim)] text-sm mt-2">Find the next big YouTubers before they blow up</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          <button
            onClick={() => setFilter('growth')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'growth' ? 'bg-red-500 text-white' : 'bg-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--border-hover)]'}`}
          >
            <TrendingUp className="w-4 h-4 inline mr-1" /> Fastest Growth %
          </button>
          <button
            onClick={() => setFilter('gains')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'gains' ? 'bg-red-500 text-white' : 'bg-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--border-hover)]'}`}
          >
            <Users className="w-4 h-4 inline mr-1" /> Most Daily Gains
          </button>
          <button
            onClick={() => setFilter('viral')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'viral' ? 'bg-red-500 text-white' : 'bg-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--border-hover)]'}`}
          >
            <Flame className="w-4 h-4 inline mr-1" /> Going Viral
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-[var(--text-primary)]">{channels.length}</div>
            <div className="text-[var(--text-dim)] text-sm">Rising Channels</div>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              {channels.filter(c => c.viral_label === 'Exploding').length}
            </div>
            <div className="text-[var(--text-dim)] text-sm">Exploding Now</div>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {channels.filter(c => c.viral_label === 'Rising Fast').length}
            </div>
            <div className="text-[var(--text-dim)] text-sm">Rising Fast</div>
          </div>
        </div>

        {/* Channel Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedChannels.slice(0, 30).map((channel, idx) => (
            <div
              key={channel.channel_id}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 cursor-pointer hover:border-yellow-500/50 transition-colors"
              onClick={() => navigate(`/channel/${channel.channel_id}`)}
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-lg font-bold text-[var(--text-dim)]">#{idx + 1}</span>
                <img src={channel.thumbnail_url} alt={channel.title} className="w-12 h-12 rounded-full" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[var(--text-primary)] truncate">{channel.title}</h3>
                  <p className="text-[var(--text-dim)] text-sm">{channel.country_name}</p>
                </div>
                <ViralBadge label={channel.viral_label} />
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[var(--bg-deep)] rounded p-2">
                  <div className="text-[var(--text-primary)] font-bold text-sm">{formatNumber(channel.subscriber_count)}</div>
                  <div className="text-[var(--text-dim)] text-xs">Subs</div>
                </div>
                <div className="bg-[var(--bg-deep)] rounded p-2">
                  <div className="text-green-400 font-bold text-sm">+{formatNumber(channel.daily_subscriber_gain || 0)}</div>
                  <div className="text-[var(--text-dim)] text-xs">24h *</div>
                </div>
                <div className="bg-[var(--bg-deep)] rounded p-2">
                  <div className="text-yellow-400 font-bold text-sm">{(channel.daily_growth_percent || 0).toFixed(2)}%</div>
                  <div className="text-[var(--text-dim)] text-xs">Growth *</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {sortedChannels.length === 0 && (
          <div className="text-center py-12 text-[var(--text-dim)]">
            <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No rising stars found matching your criteria</p>
          </div>
        )}

        {/* SEO Content */}
        <div className="mt-12 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">About Rising Stars</h2>
          <div className="text-[var(--text-muted)] space-y-3 text-sm">
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
        <div className="mt-4 p-3 bg-[var(--bg-deep)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-dim)]">
          <span className="text-yellow-500">*</span> Growth statistics are estimated by TopTube World Pro based on historical tracking.
        </div>
      </div>
    </div>
  );
};



export { RisingStarsPage };
