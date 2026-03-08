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
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Compare YouTube Channels</h1>
          <p className="text-[var(--text-dim)]">Compare up to 4 YouTube channels side by side - subscribers, views, growth & more</p>
        </div>

        {/* Channel Search/Add */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-3 mb-4">
            {channels.map((ch, idx) => (
              <div key={ch.channel_id} className="flex items-center gap-2 bg-[var(--bg-deep)] rounded-lg px-3 py-2" style={{ borderLeft: `3px solid ${colors[idx]}` }}>
                <img src={ch.thumbnail_url} alt="" loading="lazy" className="w-6 h-6 rounded-full" />
                <span className="text-[var(--text-primary)] text-sm">{ch.title}</span>
                <button onClick={() => removeChannel(ch.channel_id)} className="text-[var(--text-dim)] hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {channelIds.length < 4 && (
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-dim)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Add a channel to compare..."
                  className="w-full bg-[var(--bg-deep)] border border-[var(--border-hover)] rounded-lg pl-9 pr-4 py-2 text-[var(--text-primary)] text-sm focus:border-red-500 focus:outline-none"
                  data-testid="compare-search"
                />
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-card)] border border-[var(--border-hover)] rounded-lg overflow-hidden z-10 max-h-64 overflow-y-auto">
                    {searchResults.map(ch => (
                      <button
                        key={ch.channel_id}
                        onClick={() => addChannel(ch.channel_id)}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[var(--bg-hover)] text-left"
                      >
                        <img src={ch.thumbnail_url} alt="" loading="lazy" className="w-8 h-8 rounded-full" />
                        <div>
                          <div className="text-[var(--text-primary)] text-sm">{ch.title}</div>
                          <div className="text-[var(--text-dim)] text-xs">{formatNumber(ch.subscriber_count)} subs</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {channelIds.length > 0 && (
            <div className="flex items-center gap-3 pt-3 border-t border-[var(--border)]">
              <span className="text-sm text-[var(--text-dim)]">Share comparison:</span>
              <button
                onClick={() => navigator.clipboard.writeText(shareUrl)}
                className="flex items-center gap-1 text-xs px-3 py-1 bg-[var(--border)] rounded hover:bg-[var(--border-hover)]"
              >
                <Copy className="w-3 h-3" /> Copy Link
              </button>
            </div>
          )}
        </div>

        {channels.length === 0 ? (
          <div className="space-y-8">
            {/* Empty State with Instructions */}
            <div className="text-center py-12 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg">
              <BarChart3 className="w-16 h-16 text-[var(--text-dim)] mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Compare YouTube Channels Side by Side</h2>
              <p className="text-[var(--text-dim)] mb-6">Search and add up to 4 channels above to compare their statistics</p>
              
              {/* Quick Start Suggestions */}
              <div className="max-w-2xl mx-auto">
                <p className="text-sm text-[var(--text-muted)] mb-3">Popular comparisons:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <button 
                    onClick={() => setSearchParams({ ids: 'UCX6OQ3DkcsbYNE6H8uQQuVA,UCq-Fj5jknLsUf-MWSy4_brA' })}
                    className="px-3 py-1 bg-[var(--border)] hover:bg-[var(--border-hover)] rounded text-sm text-[var(--text-secondary)]"
                  >
                    MrBeast vs T-Series
                  </button>
                </div>
              </div>
            </div>

            {/* Educational Content */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">How to Use the Channel Comparison Tool</h2>
              <div className="text-[var(--text-secondary)] text-sm space-y-4">
                <p>
                  Our free YouTube channel comparison tool lets you analyze multiple channels side by side. Whether you're 
                  researching competitors, scouting influencers for partnerships, or simply curious about how your favorite 
                  creators stack up, this tool provides valuable insights.
                </p>
                
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mt-4">What You Can Compare</h3>
                <ul className="list-disc list-inside space-y-1 text-[var(--text-muted)]">
                  <li><strong className="text-[var(--text-primary)]">Subscriber Counts:</strong> See exact subscriber numbers side by side</li>
                  <li><strong className="text-[var(--text-primary)]">Total Views:</strong> Compare cumulative view counts across all videos</li>
                  <li><strong className="text-[var(--text-primary)]">Video Output:</strong> See how many videos each channel has published</li>
                  <li><strong className="text-[var(--text-primary)]">Growth Metrics:</strong> Compare daily subscriber gains and growth rates</li>
                  <li><strong className="text-[var(--text-primary)]">Viral Status:</strong> See which channels are experiencing momentum</li>
                  <li><strong className="text-[var(--text-primary)]">Growth Charts:</strong> Visualize subscriber trends over the past 30 days</li>
                </ul>

                <h3 className="text-lg font-semibold text-[var(--text-primary)] mt-4">Use Cases</h3>
                <div className="grid md:grid-cols-2 gap-4 mt-2">
                  <div className="bg-[var(--bg-deep)] rounded p-3">
                    <h4 className="font-medium text-[var(--text-primary)] mb-1">For Content Creators</h4>
                    <p className="text-xs text-[var(--text-dim)]">Benchmark against competitors in your niche. Understand what growth rates are realistic and identify successful strategies.</p>
                  </div>
                  <div className="bg-[var(--bg-deep)] rounded p-3">
                    <h4 className="font-medium text-[var(--text-primary)] mb-1">For Marketers</h4>
                    <p className="text-xs text-[var(--text-dim)]">Evaluate potential influencer partners. Compare reach, engagement, and growth trends before making partnership decisions.</p>
                  </div>
                  <div className="bg-[var(--bg-deep)] rounded p-3">
                    <h4 className="font-medium text-[var(--text-primary)] mb-1">For Researchers</h4>
                    <p className="text-xs text-[var(--text-dim)]">Analyze platform dynamics and creator economics. Study how different content types and strategies perform.</p>
                  </div>
                  <div className="bg-[var(--bg-deep)] rounded p-3">
                    <h4 className="font-medium text-[var(--text-primary)] mb-1">For Fans</h4>
                    <p className="text-xs text-[var(--text-dim)]">Follow the subscriber races between your favorite creators. Share comparisons with friends and communities.</p>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-dim)] mt-4 pt-4 border-t border-[var(--border)]">
                  <em>Data sourced from YouTube Data API. Growth metrics are calculated by TopTube World Pro based on historical tracking and are estimates.</em>
                </p>
              </div>
            </div>

            {/* Comprehensive Compare Guide */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">The Complete Guide to YouTube Channel Comparison</h2>
              
              <article className="space-y-6 text-[var(--text-secondary)] text-sm leading-relaxed">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Why Compare YouTube Channels?</h3>
                  <p className="mb-4">
                    Comparing YouTube channels side by side provides insights that raw numbers alone cannot deliver. Whether you're a content creator benchmarking against competitors, a marketer evaluating influencer partnerships, or simply a YouTube enthusiast following your favorite creator rivalries, comparative analysis reveals patterns and context that single-channel views obscure.
                  </p>
                  <p className="mb-4">
                    Our channel comparison tool allows you to analyze up to four YouTube channels simultaneously across multiple dimensions: subscriber counts, view totals, video output, growth rates, and trend indicators. This multi-dimensional comparison helps you understand not just who's "bigger," but who's growing faster, who's more efficient, and who might represent the best opportunities for various purposes.
                  </p>
                  <p>
                    The tool also provides historical growth charts that visualize how channels' subscriber counts have changed over time. These visualizations can reveal growth patterns that aren't apparent from current statistics alone—showing which channels are accelerating, plateauing, or experiencing volatility.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Understanding Comparison Metrics</h3>
                  <p className="mb-4">
                    Each metric in our comparison table tells a different story about channel performance. Understanding these metrics helps you extract meaningful insights from the data.
                  </p>
                  <p className="mb-4">
                    <strong className="text-[var(--text-primary)]">Subscriber Count:</strong> The total number of channel subscribers represents overall audience size and social proof. However, subscriber counts alone don't tell the full story—a channel with 10 million subscribers might have less engaged audiences than one with 1 million highly active subscribers.
                  </p>
                  <p className="mb-4">
                    <strong className="text-[var(--text-primary)]">Total Views:</strong> Cumulative view counts across all videos show historical content performance. High view counts relative to subscriber counts suggest strong content discoverability and replay value. Views also directly correlate with advertising revenue potential.
                  </p>
                  <p className="mb-4">
                    <strong className="text-[var(--text-primary)]">Video Count:</strong> The total number of published videos indicates content output and channel maturity. Some channels succeed with high-volume strategies (multiple uploads daily), while others build audiences with fewer, higher-quality productions. Neither approach is inherently superior—it depends on the content category and creator resources.
                  </p>
                  <p className="mb-4">
                    <strong className="text-[var(--text-primary)]">24-Hour Growth:</strong> Daily subscriber gains show current momentum. This metric helps identify which channels are "hot" right now, regardless of their total size. A smaller channel gaining 50,000 subscribers daily might represent a more interesting growth story than a massive channel adding 100,000 from a much larger base.
                  </p>
                  <p className="mb-4">
                    <strong className="text-[var(--text-primary)]">Growth Rate:</strong> The percentage growth rate normalizes daily gains by channel size, allowing fair comparison between channels of different scales. A 1% daily growth rate is exceptional for any channel—it would mean doubling subscribers in about 70 days.
                  </p>
                  <p>
                    <strong className="text-[var(--text-primary)]">Viral Status:</strong> Our proprietary classification indicates each channel's growth trajectory. "Exploding" channels show exceptional momentum, "Rising Fast" channels demonstrate strong growth, "Stable" channels maintain consistent positions, and "Slowing" channels show declining growth rates.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Common Comparison Scenarios</h3>
                  <p className="mb-4">
                    Different users approach channel comparisons with different goals. Here are some common scenarios and what to look for in each.
                  </p>
                  <p className="mb-4">
                    <strong className="text-[var(--text-primary)]">Creator Competitive Analysis:</strong> Content creators often compare their channels against competitors in their niche. Look beyond raw subscriber counts to growth rates and engagement patterns. A competitor growing faster than you might be worth studying—what content are they creating? How often do they upload? What's different about their approach?
                  </p>
                  <p className="mb-4">
                    <strong className="text-[var(--text-primary)]">Influencer Marketing Evaluation:</strong> Marketers comparing potential influencer partners should consider multiple factors. Total subscribers indicate reach, but growth rates suggest momentum. View counts per video (total views divided by video count) reveal typical content performance. Channels with strong growth rates may offer better value as their influence expands post-partnership.
                  </p>
                  <p className="mb-4">
                    <strong className="text-[var(--text-primary)]">Subscriber Race Tracking:</strong> YouTube subscriber races between popular creators generate significant community interest. Our comparison tool lets you track these races with real-time data and historical charts. Compare current standings, daily gains, and growth trajectories to see who's closing gaps or pulling ahead.
                  </p>
                  <p>
                    <strong className="text-[var(--text-primary)]">Category Benchmarking:</strong> Comparing top channels within a category reveals what "success" looks like in that space. Gaming channel metrics differ significantly from music channel metrics differ from children's content metrics. Understanding category-specific benchmarks helps contextualize individual channel performance.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Reading Growth Charts</h3>
                  <p className="mb-4">
                    The subscriber growth chart provides visual representation of how channels' audiences have evolved over time. Understanding how to read these charts helps you extract deeper insights from the comparison.
                  </p>
                  <p className="mb-4">
                    <strong className="text-[var(--text-primary)]">Trend Direction:</strong> Is the line going up, staying flat, or declining? Upward trends indicate healthy growth. Flat lines suggest stagnation—the channel isn't losing subscribers, but isn't gaining either. Declining lines are rare (YouTube doesn't remove subscribers often) but can indicate problems.
                  </p>
                  <p className="mb-4">
                    <strong className="text-[var(--text-primary)]">Slope Steepness:</strong> Steeper upward slopes indicate faster growth. Compare slopes between channels to see who's growing more rapidly. A channel with a steeper recent slope might be gaining momentum that could continue.
                  </p>
                  <p className="mb-4">
                    <strong className="text-[var(--text-primary)]">Inflection Points:</strong> Look for sudden changes in trajectory—points where growth suddenly accelerated or slowed. These inflection points often correspond to specific events: viral videos, controversies, algorithm changes, or external coverage. Identifying what caused these changes can provide insights into growth drivers.
                  </p>
                  <p>
                    <strong className="text-[var(--text-primary)]">Convergence and Divergence:</strong> When comparing multiple channels, watch for lines that are converging (getting closer together) or diverging (spreading apart). Convergence suggests the smaller channel is gaining ground; divergence suggests the larger channel is extending its lead.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Limitations of Channel Comparisons</h3>
                  <p className="mb-4">
                    While our comparison tool provides valuable insights, it's important to understand its limitations and avoid drawing conclusions that the data doesn't support.
                  </p>
                  <p className="mb-4">
                    <strong className="text-[var(--text-primary)]">Different Categories, Different Norms:</strong> Comparing channels across different content categories can be misleading. A children's content channel with 50 million subscribers operates very differently from a tech review channel with 50 million subscribers. View patterns, engagement styles, and monetization differ significantly. Compare within categories for meaningful insights.
                  </p>
                  <p className="mb-4">
                    <strong className="text-[var(--text-primary)]">Subscribers ≠ Views ≠ Revenue:</strong> Subscriber count doesn't directly correlate with views or revenue. A channel with fewer subscribers but highly engaged audiences might generate more views per video and higher advertising revenue than a larger channel with dormant subscribers. Our tool shows multiple metrics to provide fuller context.
                  </p>
                  <p className="mb-4">
                    <strong className="text-[var(--text-primary)]">Historical Data Limitations:</strong> Our growth charts show data from our tracking period, which may not extend to a channel's full history. Channels we started tracking recently will show shorter histories. This doesn't affect current metrics but limits historical analysis.
                  </p>
                  <p>
                    <strong className="text-[var(--text-primary)]">Estimated Metrics:</strong> Growth calculations are based on our historical tracking and represent estimates, not official YouTube data. While we strive for accuracy, our figures may differ from YouTube's internal analytics. Treat growth metrics as indicative rather than definitive.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Famous YouTube Channel Rivalries</h3>
                  <p className="mb-4">
                    Some YouTube channel comparisons have become cultural phenomena, attracting millions of viewers who follow subscriber races and compare their favorite creators. These rivalries demonstrate the platform's unique ability to create competitive narratives around content creation.
                  </p>
                  <p className="mb-4">
                    <strong className="text-[var(--text-primary)]">PewDiePie vs T-Series:</strong> The legendary battle for YouTube's most-subscribed channel captivated millions. PewDiePie, representing individual creators, faced off against T-Series, representing corporate media. The race produced viral songs, coordinated subscriber campaigns, and global media coverage before T-Series ultimately claimed the top spot—only to later be surpassed by MrBeast.
                  </p>
                  <p className="mb-4">
                    <strong className="text-[var(--text-primary)]">MrBeast vs T-Series:</strong> The current race for #1 pits MrBeast's blockbuster entertainment format against T-Series's music content factory. MrBeast's overtaking of T-Series represented a symbolic victory for individual creators and demonstrated that a single person's vision could compete with corporate resources.
                  </p>
                  <p>
                    <strong className="text-[var(--text-primary)]">Children's Content Battle:</strong> Cocomelon, Vlad and Niki, Kids Diana Show, and Like Nastya compete for the children's content crown. These channels' growth trajectories and competitive dynamics reveal much about how families consume YouTube content and how the platform serves young audiences.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Tips for Effective Channel Comparisons</h3>
                  <p className="mb-4">
                    To get the most value from our comparison tool, follow these best practices.
                  </p>
                  <p className="mb-4">
                    <strong className="text-[var(--text-primary)]">Compare Similar Channels:</strong> The most meaningful comparisons involve channels in similar categories, target demographics, or content styles. Comparing a gaming channel to a music channel produces data but limited insights.
                  </p>
                  <p className="mb-4">
                    <strong className="text-[var(--text-primary)]">Look at Multiple Metrics:</strong> Don't focus on a single number. A channel might lead in subscribers but trail in growth rate. Another might have fewer subscribers but higher views per video. Multi-dimensional analysis reveals fuller pictures.
                  </p>
                  <p className="mb-4">
                    <strong className="text-[var(--text-primary)]">Consider Time Periods:</strong> Current standings matter, but so do trends. A channel that's #2 but growing faster than #1 might overtake soon. Use our growth charts to understand trajectories, not just current positions.
                  </p>
                  <p>
                    <strong className="text-[var(--text-primary)]">Save and Share:</strong> Use the share link feature to bookmark comparisons or share them with others. The URL encodes your selected channels, so you can return to the same comparison later or discuss it with colleagues.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Advanced Comparison Strategies</h3>
                  <p className="mb-4">
                    Beyond basic metric comparisons, sophisticated users can extract deeper insights by considering context and derived metrics.
                  </p>
                  <p className="mb-4">
                    <strong className="text-[var(--text-primary)]">Views Per Video Analysis:</strong> Divide total views by video count to estimate average video performance. This derived metric reveals content efficiency—how many views each piece of content generates on average. Channels with high views-per-video may create fewer but more impactful pieces, while high-volume channels might succeed through quantity.
                  </p>
                  <p className="mb-4">
                    <strong className="text-[var(--text-primary)]">Subscriber-to-View Ratio:</strong> Compare total subscribers to total views. Some channels have many subscribers but relatively low view counts—potentially indicating dormant subscribers or declining engagement. Others have fewer subscribers but exceptional view totals—suggesting strong content discoverability or viral hits.
                  </p>
                  <p className="mb-4">
                    <strong className="text-[var(--text-primary)]">Growth Efficiency:</strong> Consider how quickly channels have reached their current subscriber levels. A channel that achieved 10 million subscribers in 2 years demonstrates different efficiency than one that took 10 years. While our tool doesn't show channel age directly, you can research this context externally.
                  </p>
                  <p>
                    <strong className="text-[var(--text-primary)]">Momentum Comparison:</strong> Use viral status indicators to compare growth momentum. A "Stable" channel with 50 million subscribers might be less interesting than a "Rising Fast" channel with 10 million, depending on your analysis goals.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Comparison Data in Business Contexts</h3>
                  <p className="mb-4">
                    Channel comparison data serves practical business purposes beyond casual interest. Here's how professionals use this information.
                  </p>
                  <p className="mb-4">
                    <strong className="text-[var(--text-primary)]">Influencer Marketing ROI:</strong> Marketers compare potential partners' metrics to estimate partnership value. Subscriber counts indicate reach, but growth rates suggest momentum that could amplify campaign impact. Views per video help estimate actual content exposure beyond subscriber counts.
                  </p>
                  <p className="mb-4">
                    <strong className="text-[var(--text-primary)]">Competitive Benchmarking:</strong> Brands and creators use comparisons to benchmark their own performance against competitors. Understanding where you stand relative to similar channels helps set realistic goals and identify improvement opportunities.
                  </p>
                  <p className="mb-4">
                    <strong className="text-[var(--text-primary)]">Investment Due Diligence:</strong> Investors evaluating creator-economy opportunities use comparison data to assess market positions and growth potential. Understanding how a creator compares to peers informs valuation and risk assessment.
                  </p>
                  <p>
                    <strong className="text-[var(--text-primary)]">Partnership Negotiations:</strong> When negotiating collaborations or sponsorships, both parties benefit from objective data. Comparisons provide common ground for discussions about reach, engagement, and value exchange.
                  </p>
                </div>

                <div className="pt-4 border-t border-[var(--border)]">
                  <p className="text-xs text-[var(--text-dim)]">
                    <em>All data displayed in channel comparisons is sourced from the YouTube Data API for subscriber counts, view counts, and video counts. Growth metrics and viral status indicators are independently calculated by TopTube World Pro based on our historical tracking data. These calculations are estimates and may differ from YouTube's internal analytics. For methodology details, visit our dedicated Methodology page.</em>
                  </p>
                </div>
              </article>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Comparison Table */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-dim)] uppercase w-1/5">Metric</th>
                      {channels.map((ch, idx) => (
                        <th key={ch.channel_id} className="px-4 py-3 text-center" style={{ borderBottom: `3px solid ${colors[idx]}` }}>
                          <img src={ch.thumbnail_url} alt="" loading="lazy" className="w-10 h-10 rounded-full mx-auto mb-1" />
                          <div className="text-[var(--text-primary)] text-sm font-medium">{ch.title}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--divide)]">
                    <tr>
                      <td className="px-4 py-3 text-[var(--text-muted)]">Subscribers</td>
                      {channels.map(ch => (
                        <td key={ch.channel_id} className="px-4 py-3 text-center text-[var(--text-primary)] font-bold">{formatNumber(ch.subscriber_count)}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-[var(--text-muted)]">Total Views</td>
                      {channels.map(ch => (
                        <td key={ch.channel_id} className="px-4 py-3 text-center text-[var(--text-primary)]">{formatNumber(ch.view_count)}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-[var(--text-muted)]">Videos</td>
                      {channels.map(ch => (
                        <td key={ch.channel_id} className="px-4 py-3 text-center text-[var(--text-primary)]">{ch.video_count}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-[var(--text-muted)]">24h Growth</td>
                      {channels.map(ch => (
                        <td key={ch.channel_id} className="px-4 py-3 text-center text-green-400">+{formatNumber(ch.daily_subscriber_gain || 0)}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-[var(--text-muted)]">Growth Rate</td>
                      {channels.map(ch => (
                        <td key={ch.channel_id} className="px-4 py-3 text-center text-green-400">{(ch.daily_growth_percent || 0).toFixed(3)}%</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-[var(--text-muted)]">Status</td>
                      {channels.map(ch => (
                        <td key={ch.channel_id} className="px-4 py-3 text-center"><ViralBadge label={ch.viral_label} /></td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-[var(--text-muted)]">Country</td>
                      {channels.map(ch => (
                        <td key={ch.channel_id} className="px-4 py-3 text-center text-[var(--text-primary)]">{ch.country_name}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Growth Chart Overlay */}
            {chartData.length > 0 && (
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Subscriber Growth Comparison</h2>
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
