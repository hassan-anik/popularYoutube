import React, { lazy, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3, Copy, Home, Search, X } from 'lucide-react';
import { useSEO, JsonLd } from '../hooks/useSEO';
import { API, BACKEND_URL, SITE_URL } from '../utils/constants';
import { formatNumber, formatShortDate } from '../utils/format';
import { ViralBadge } from '../components/common';
import { Breadcrumb } from '../components/seo';

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
          <div className="space-y-8">
            {/* Empty State with Instructions */}
            <div className="text-center py-12 bg-[#111] border border-[#222] rounded-lg">
              <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Compare YouTube Channels Side by Side</h2>
              <p className="text-gray-500 mb-6">Search and add up to 4 channels above to compare their statistics</p>
              
              {/* Quick Start Suggestions */}
              <div className="max-w-2xl mx-auto">
                <p className="text-sm text-gray-400 mb-3">Popular comparisons:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <button 
                    onClick={() => setSearchParams({ ids: 'UCX6OQ3DkcsbYNE6H8uQQuVA,UCq-Fj5jknLsUf-MWSy4_brA' })}
                    className="px-3 py-1 bg-[#222] hover:bg-[#333] rounded text-sm text-gray-300"
                  >
                    MrBeast vs T-Series
                  </button>
                </div>
              </div>
            </div>

            {/* Educational Content */}
            <div className="bg-[#111] border border-[#222] rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">How to Use the Channel Comparison Tool</h2>
              <div className="text-gray-300 text-sm space-y-4">
                <p>
                  Our free YouTube channel comparison tool lets you analyze multiple channels side by side. Whether you're 
                  researching competitors, scouting influencers for partnerships, or simply curious about how your favorite 
                  creators stack up, this tool provides valuable insights.
                </p>
                
                <h3 className="text-lg font-semibold text-white mt-4">What You Can Compare</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-400">
                  <li><strong className="text-white">Subscriber Counts:</strong> See exact subscriber numbers side by side</li>
                  <li><strong className="text-white">Total Views:</strong> Compare cumulative view counts across all videos</li>
                  <li><strong className="text-white">Video Output:</strong> See how many videos each channel has published</li>
                  <li><strong className="text-white">Growth Metrics:</strong> Compare daily subscriber gains and growth rates</li>
                  <li><strong className="text-white">Viral Status:</strong> See which channels are experiencing momentum</li>
                  <li><strong className="text-white">Growth Charts:</strong> Visualize subscriber trends over the past 30 days</li>
                </ul>

                <h3 className="text-lg font-semibold text-white mt-4">Use Cases</h3>
                <div className="grid md:grid-cols-2 gap-4 mt-2">
                  <div className="bg-[#0d0d0d] rounded p-3">
                    <h4 className="font-medium text-white mb-1">For Content Creators</h4>
                    <p className="text-xs text-gray-500">Benchmark against competitors in your niche. Understand what growth rates are realistic and identify successful strategies.</p>
                  </div>
                  <div className="bg-[#0d0d0d] rounded p-3">
                    <h4 className="font-medium text-white mb-1">For Marketers</h4>
                    <p className="text-xs text-gray-500">Evaluate potential influencer partners. Compare reach, engagement, and growth trends before making partnership decisions.</p>
                  </div>
                  <div className="bg-[#0d0d0d] rounded p-3">
                    <h4 className="font-medium text-white mb-1">For Researchers</h4>
                    <p className="text-xs text-gray-500">Analyze platform dynamics and creator economics. Study how different content types and strategies perform.</p>
                  </div>
                  <div className="bg-[#0d0d0d] rounded p-3">
                    <h4 className="font-medium text-white mb-1">For Fans</h4>
                    <p className="text-xs text-gray-500">Follow the subscriber races between your favorite creators. Share comparisons with friends and communities.</p>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-[#222]">
                  <em>Data sourced from YouTube Data API. Growth metrics are calculated by TopTube World Pro based on historical tracking and are estimates.</em>
                </p>
              </div>
            </div>
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



export { ComparePage };
