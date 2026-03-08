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
              We track channels between 100K and 50M subscribers that show above-average daily growth rates. 
              Many of today's biggest YouTubers were once "rising stars" before breaking into the mainstream.
            </p>
          </div>
        </div>

        {/* Comprehensive Rising Stars Guide */}
        <section className="mt-8 bg-[var(--bg-deep)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">The Complete Guide to YouTube Rising Stars</h2>
          
          <article className="space-y-6 text-[var(--text-secondary)] text-sm leading-relaxed">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">What Makes a Rising Star?</h3>
              <p className="mb-4">
                A "rising star" on YouTube is a channel experiencing exceptional growth relative to its current size. While established channels with 100 million subscribers might add millions of new subscribers daily, that represents a small percentage of their base. A rising star channel might add tens of thousands of subscribers daily, but from a much smaller base—representing percentage growth rates that signal breakout potential.
              </p>
              <p className="mb-4">
                We identify rising stars by analyzing growth patterns across hundreds of channels under 50 million subscribers. Channels that show consistent above-average daily growth, high engagement rates, or sudden viral momentum are flagged as potential rising stars worth watching. These creators are often on the cusp of mainstream breakthrough.
              </p>
              <p>
                The rising star designation isn't permanent—it reflects current growth momentum. Some channels sustain their trajectory and become major players. Others experience temporary viral growth before returning to baseline. Understanding this dynamic helps viewers and industry observers interpret what they see on this page.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Why Rising Stars Matter</h3>
              <p className="mb-4">
                Every YouTube giant started as a small channel. MrBeast was once a rising star himself, gaining recognition through creative content before achieving the scale he has today. PewDiePie, T-Series, Cocomelon—all experienced rising star phases where they grew faster than typical channels before reaching massive scale.
              </p>
              <p className="mb-4">
                For viewers, rising stars represent an opportunity to discover quality content before it becomes mainstream. Following a creator during their growth phase creates a sense of connection and participation in their journey. Many dedicated fan communities form during this rising star phase when creators are more accessible and communities more intimate.
              </p>
              <p className="mb-4">
                For marketers and brands, rising stars offer partnership opportunities at favorable economics. Sponsorship rates correlate with subscriber counts, so partnering with rising stars before they reach premium scale can deliver exceptional value. The audience growth means campaign reach often expands beyond initial projections.
              </p>
              <p>
                For aspiring creators, studying rising stars provides insight into what content strategies and formats currently resonate with YouTube audiences. The tactics that drive rising star growth often represent the cutting edge of YouTube content strategy.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Understanding the Metrics</h3>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Growth Percentage:</strong> This metric shows daily subscriber growth as a percentage of total subscribers. A 0.5% daily growth rate is exceptional—it would mean doubling subscribers in about 140 days. Rising stars often show growth rates multiple times higher than category averages, sometimes exceeding 1-2% daily during peak periods.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Daily Gains:</strong> The absolute number of subscribers added in the last 24 hours. While percentage growth provides normalized comparison, absolute gains show scale of impact. A channel gaining 50,000 subscribers daily is adding significant audience regardless of its current size.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Viral Status:</strong> Our classification system categorizes channels based on growth momentum. "Exploding" channels show exceptional recent growth that stands out even among rising stars. "Rising Fast" channels demonstrate strong, sustained growth above typical patterns. These labels help quickly identify the most dynamic channels.
              </p>
              <p>
                All growth metrics are estimates calculated by TopTube World Pro based on our historical tracking data. We compare current subscriber counts with stored historical values to calculate changes. These estimates may differ from YouTube's internal analytics but provide reliable directional indicators.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Common Rising Star Patterns</h3>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Viral Video Breakthrough:</strong> Many rising stars emerge when a single video achieves viral status. The algorithm promotes the content to massive new audiences, driving subscription spikes. The key question afterward is whether the creator can convert viral viewers into sustained audience through subsequent content.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Shorts Success:</strong> YouTube Shorts has created a new pathway to rising star status. Creators who master the short-form format can build subscriber bases rapidly, then potentially transition viewers to long-form content. Many current rising stars have leveraged Shorts as their primary growth engine.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Collaboration Effect:</strong> Collaborations with established creators can launch rising star trajectories. When a major YouTuber features a smaller creator, the exposure can drive significant subscription growth. Smart rising stars seek collaboration opportunities strategically.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Algorithm Discovery:</strong> Sometimes YouTube's algorithm begins heavily promoting a creator's content for reasons that aren't immediately apparent. These algorithm-driven growth spurts can transform small channels into rising stars within weeks. Understanding this phenomenon helps contextualize sudden growth patterns.
              </p>
              <p>
                <strong className="text-[var(--text-primary)]">Trend Riding:</strong> Creators who successfully create content around trending topics, news events, or viral moments can experience rising star growth. The key is moving quickly while maintaining content quality—first-mover advantage in trending content can drive substantial subscriber gains.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Categories That Produce Rising Stars</h3>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Gaming:</strong> New game releases and gaming trends regularly produce rising stars. Creators who are early to cover popular new games, provide exceptional guides, or offer unique entertainment perspectives can experience rapid growth. The gaming community actively seeks new voices.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Entertainment and Commentary:</strong> Commentary channels that offer fresh perspectives on pop culture, internet drama, or current events can achieve rising star status when their takes resonate with audiences. The format's low production barrier enables rapid content creation around trending topics.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Educational Content:</strong> Creators who explain complex topics accessibly can build dedicated audiences relatively quickly. Once YouTube's algorithm recognizes a channel as a quality educational resource, it may promote content to viewers searching for related information.
              </p>
              <p>
                <strong className="text-[var(--text-primary)]">Challenge and Experiment Content:</strong> Channels creating unique challenges, experiments, or stunts can achieve viral momentum that drives rising star growth. This category requires creativity and often investment, but successful execution can yield outsized subscriber gains.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">From Rising Star to Established Creator</h3>
              <p className="mb-4">
                The transition from rising star to established creator represents a critical phase in channel development. Not all rising stars maintain their trajectory—some plateau after viral growth fades, while others build upon their momentum to achieve lasting success.
              </p>
              <p className="mb-4">
                Successful transitions typically require adapting content strategy as audience size increases. What works for a channel of 500,000 subscribers may not scale to 5 million. Rising stars who recognize this evolution and adjust accordingly tend to sustain their growth trajectories.
              </p>
              <p className="mb-4">
                Building team support becomes necessary as channels scale. Rising stars often operate solo or with minimal help, but sustained growth requires delegation of editing, management, and business functions. Channels that successfully build teams can handle increased content demands without sacrificing quality.
              </p>
              <p>
                Diversifying content and revenue streams helps rising stars weather the transition. Dependency on a single content format or revenue source creates vulnerability. Successful rising stars typically expand their approaches as they grow, building more resilient businesses.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Using This Data</h3>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">For Viewers:</strong> Discover tomorrow's stars today. Following rising stars during their growth phase provides access to quality content before mainstream attention arrives. You might find your next favorite creator among the channels listed here.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">For Creators:</strong> Study what's working for rising stars in your category. Their success indicates current audience preferences and effective content strategies. Learning from rising stars can inform your own content development.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">For Marketers:</strong> Identify partnership opportunities before rising stars reach premium pricing. The channels on this page represent potential influencer partners with strong growth trajectories and engaged audiences.
              </p>
              <p>
                <strong className="text-[var(--text-primary)]">For Analysts:</strong> Track emerging trends in YouTube content through rising star patterns. The creators experiencing exceptional growth often represent the vanguard of content trends that will shape the broader platform.
              </p>
            </div>

            <div className="pt-4 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--text-dim)]">
                <em>Rising star status is determined by TopTube World Pro based on growth metrics and viral indicators. All statistics are estimates calculated from our historical tracking data. Rising star designation reflects current momentum and does not guarantee future growth. The YouTube landscape changes rapidly, and channel trajectories can shift based on content, algorithm changes, and external factors.</em>
              </p>
            </div>
          </article>
        </section>

        {/* Disclaimer */}
        <div className="mt-4 p-3 bg-[var(--bg-deep)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-dim)]">
          <span className="text-yellow-500">*</span> Growth statistics are estimated by TopTube World Pro based on historical tracking.
        </div>
      </div>
    </div>
  );
};



export { RisingStarsPage };
