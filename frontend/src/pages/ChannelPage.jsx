import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { BarChart3, Check, ChevronRight, ExternalLink, Eye, Home, PlayCircle, Search, Users, Zap } from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites';
import { API, BACKEND_URL } from '../utils/constants';
import { formatNumber, formatShortDate } from '../utils/format';
import { EmbedWidget, FavoriteButton, Header, LastUpdatedIndicator, LiveIndicator, LoadingFallback, SidebarAd, SocialShareButtons, ViralBadge } from '../components/common';
import { Breadcrumb, ChannelSEO, FAQSection } from '../components/seo';
const LazyGrowthChart = lazy(() => import('../components/LazyGrowthChart'));

const ChannelPage = () => {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const [channel, setChannel] = useState(null);
  const [relatedChannels, setRelatedChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [channelRes, relatedRes] = await Promise.all([
          axios.get(`${API}/channels/${channelId}`),
          axios.get(`${API}/channels/${channelId}/related?limit=6`).catch(() => ({ data: { related_channels: [] } }))
        ]);
        setChannel(channelRes.data);
        setRelatedChannels(relatedRes.data.related_channels || []);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [channelId]);

  // Set noindex for 404 pages
  useEffect(() => {
    if (!loading && !channel) {
      // Add noindex meta tag
      let robotsMeta = document.querySelector('meta[name="robots"]');
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.setAttribute('name', 'robots');
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.setAttribute('content', 'noindex, nofollow');
      document.title = 'Channel Not Found - TopTube World Pro';
      
      return () => {
        // Clean up - remove noindex when leaving page
        if (robotsMeta) {
          robotsMeta.setAttribute('content', 'index, follow');
        }
      };
    }
  }, [loading, channel]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" data-testid="channel-not-found">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Channel Not Found</h1>
        <p className="text-[var(--text-muted)] mb-6 text-center max-w-md">
          The YouTube channel you're looking for doesn't exist in our database or may have been removed.
        </p>
        <div className="flex gap-4">
          <Link 
            to="/leaderboard" 
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
          >
            View Leaderboard
          </Link>
          <Link 
            to="/request-channel" 
            className="px-4 py-2 bg-[var(--border)] hover:bg-[var(--border-hover)] text-[var(--text-primary)] rounded-lg"
          >
            Request a Channel
          </Link>
        </div>
      </div>
    );
  }

  // Generate channel-specific FAQs
  const channelFaqs = [
    {
      question: `How many subscribers does ${channel.title} have?`,
      answer: `${channel.title} currently has ${formatNumber(channel.subscriber_count)} subscribers on YouTube, making them ${channel.current_rank ? `#${channel.current_rank} in ${channel.country_name}` : `one of the top channels from ${channel.country_name}`}. They have uploaded ${channel.video_count} videos with a total of ${formatNumber(channel.view_count)} views.`
    },
    {
      question: `Is ${channel.title} growing?`,
      answer: `${channel.title} gained ${channel.daily_subscriber_gain >= 0 ? '+' : ''}${formatNumber(channel.daily_subscriber_gain || 0)} subscribers in the last 24 hours (${channel.daily_growth_percent >= 0 ? '+' : ''}${(channel.daily_growth_percent || 0).toFixed(4)}% growth). Their viral status is "${channel.viral_label || 'Stable'}".`
    },
    {
      question: `What country is ${channel.title} from?`,
      answer: `${channel.title} is a YouTube channel from ${channel.country_name}. You can explore more top YouTube channels from ${channel.country_name} on our country page.`
    }
  ];

  return (
    <div className="py-8" data-testid="channel-detail-page">
      <ChannelSEO channel={channel} />
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <Breadcrumb items={[
          { label: "Home", href: "/" },
          { label: channel.country_name, href: `/country/${channel.country_code}` },
          { label: channel.title }
        ]} />

        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Channel Header */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <img 
              src={channel.thumbnail_url || "https://via.placeholder.com/120"} 
              alt={channel.title}
              className="w-24 h-24 rounded-full border-4 border-[var(--border)]"
            />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">{channel.title}</h1>
                <ViralBadge label={channel.viral_label} />
                <FavoriteButton 
                  channel={channel}
                  isFavorite={isFavorite(channel.channel_id)}
                  onToggle={toggleFavorite}
                  size="lg"
                />
                <LiveIndicator />
              </div>
              <p className="text-[var(--text-dim)] mb-3">
                <Link to={`/country/${channel.country_code}`} className="hover:text-[var(--text-primary)]">{channel.country_name}</Link>
                {channel.current_rank && ` • Rank #${channel.current_rank}`}
                <LastUpdatedIndicator timestamp={channel.updated_at} className="ml-3 inline-flex" />
              </p>
              <p className="text-[var(--text-muted)] text-sm line-clamp-2">{channel.description}</p>
              <a 
                href={`https://youtube.com/channel/${channel.channel_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-red-500 hover:text-red-400 mt-3 text-sm"
              >
                View on YouTube <ExternalLink className="w-3 h-3" />
              </a>
              
              {/* Social Sharing */}
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <SocialShareButtons 
                  url={`${BACKEND_URL}/channel/${channel.channel_id}`}
                  title={`${channel.title} - ${formatNumber(channel.subscriber_count)} subscribers on YouTube`}
                  description={`Check out ${channel.title}'s YouTube stats: ${formatNumber(channel.subscriber_count)} subscribers, ${formatNumber(channel.view_count)} views`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-center">
            <Users className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-[var(--text-primary)]">{formatNumber(channel.subscriber_count)}</div>
            <div className="text-[var(--text-dim)] text-sm">Subscribers</div>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-center">
            <Eye className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-[var(--text-primary)]">{formatNumber(channel.view_count)}</div>
            <div className="text-[var(--text-dim)] text-sm">Total Views</div>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-center">
            <PlayCircle className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-[var(--text-primary)]">{channel.video_count}</div>
            <div className="text-[var(--text-dim)] text-sm">Videos</div>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-center">
            <Zap className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-[var(--text-primary)]">{channel.viral_prediction?.viral_score || 0}</div>
            <div className="text-[var(--text-dim)] text-sm">Viral Score <span className="text-[10px]" title="Estimated by TopTube World Pro">*</span></div>
          </div>
        </div>

        {/* Estimated Data Disclaimer */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4 text-sm text-yellow-200/80">
          <strong>*</strong> Growth statistics, predictions, and viral scores are estimated by TopTube World Pro based on historical tracking and are not provided by YouTube.
        </div>

        {/* Growth Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5">
            <h3 className="text-[var(--text-dim)] text-sm mb-2">24-Hour Growth <span className="text-[10px]" title="Estimated">*</span></h3>
            <div className={`text-3xl font-bold ${(channel.daily_subscriber_gain || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {channel.daily_subscriber_gain >= 0 ? '+' : ''}{formatNumber(channel.daily_subscriber_gain || 0)}
            </div>
            <div className="text-[var(--text-dim)] text-sm">
              {channel.daily_growth_percent >= 0 ? '+' : ''}{channel.daily_growth_percent?.toFixed(4) || 0}%
            </div>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5">
            <h3 className="text-[var(--text-dim)] text-sm mb-2">7-Day Growth <span className="text-[10px]" title="Estimated">*</span></h3>
            <div className={`text-3xl font-bold ${(channel.weekly_subscriber_gain || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {channel.weekly_subscriber_gain >= 0 ? '+' : ''}{formatNumber(channel.weekly_subscriber_gain || 0)}
            </div>
            <div className="text-[var(--text-dim)] text-sm">
              {channel.weekly_growth_percent >= 0 ? '+' : ''}{channel.weekly_growth_percent?.toFixed(4) || 0}%
            </div>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5">
            <h3 className="text-[var(--text-dim)] text-sm mb-2">30-Day Growth <span className="text-[10px]" title="Estimated">*</span></h3>
            <div className={`text-3xl font-bold ${(channel.monthly_subscriber_gain || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {channel.monthly_subscriber_gain >= 0 ? '+' : ''}{formatNumber(channel.monthly_subscriber_gain || 0)}
            </div>
            <div className="text-[var(--text-dim)] text-sm">
              {channel.monthly_growth_percent >= 0 ? '+' : ''}{channel.monthly_growth_percent?.toFixed(4) || 0}%
            </div>
          </div>
        </div>

        {/* Growth Chart */}
        {channel.growth_history?.length > 0 && (
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Subscriber Growth (30 Days)</h2>
            <Suspense fallback={<LoadingFallback />}>
              <LazyGrowthChart data={channel.growth_history} />
            </Suspense>
          </div>
        )}
        
        {/* Editorial Channel Analysis Section - Required for AdSense */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Channel Analysis</h2>
          <div className="space-y-4 text-[var(--text-secondary)] text-sm leading-relaxed">
            <p>
              <strong className="text-[var(--text-primary)]">{channel.title || channel.name}</strong> is a YouTube channel from {channel.country_name} 
              with <strong className="text-[var(--text-primary)]">{formatNumber(channel.subscriber_count)}</strong> subscribers, making it 
              {channel.current_rank ? ` ranked #${channel.current_rank} in ${channel.country_name}` : ' one of the top channels in its region'}.
              The channel has accumulated <strong className="text-[var(--text-primary)]">{formatNumber(channel.view_count)}</strong> total views 
              across <strong className="text-[var(--text-primary)]">{channel.video_count}</strong> videos.
            </p>
            
            {channel.daily_subscriber_gain > 0 && (
              <p>
                In terms of growth, {channel.title || channel.name} is gaining approximately <strong className="text-green-400">
                {formatNumber(channel.daily_subscriber_gain)}</strong> subscribers per day, 
                representing a daily growth rate of <strong className="text-green-400">{channel.daily_growth_percent?.toFixed(2) || 0}%</strong>. 
                This growth pattern indicates {channel.viral_label === 'Exploding' ? 'exceptional viral momentum' : 
                channel.viral_label === 'Rising Fast' ? 'strong upward trajectory' : 
                channel.viral_label === 'Stable' ? 'consistent and steady performance' : 'fluctuating growth patterns'}.
              </p>
            )}
            
            <p>
              The channel's viral score of <strong className="text-yellow-400">{channel.viral_prediction?.viral_score || 0}</strong> reflects 
              our algorithm's assessment of its current growth momentum and potential for continued expansion. This score is calculated 
              based on multiple factors including subscriber growth velocity, engagement patterns, and historical performance trends.
            </p>
            
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mt-4">Performance Context</h3>
            <p>
              With an average of <strong className="text-[var(--text-primary)]">{channel.video_count > 0 ? formatNumber(Math.round(channel.view_count / channel.video_count)) : 0}</strong> views 
              per video, {channel.title || channel.name} demonstrates {channel.view_count / channel.video_count > 1000000 ? 'exceptional' : 
              channel.view_count / channel.video_count > 100000 ? 'strong' : 'moderate'} content engagement relative to its subscriber base.
              This metric helps contextualize the channel's performance beyond raw subscriber numbers.
            </p>
            
            <p className="text-xs text-[var(--text-dim)] mt-4 border-t border-[var(--border)] pt-4">
              <em><strong>Disclaimer:</strong> Growth statistics, viral scores, and predictions displayed on this page are independently 
              calculated by TopTube World Pro based on our historical tracking data. These metrics are estimates and are not provided 
              by or endorsed by YouTube. Subscriber counts and view statistics are sourced from the YouTube Data API.</em>
            </p>
          </div>
        </div>

        {/* Top Videos */}
        {channel.top_videos?.length > 0 && (
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Top Videos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {channel.top_videos.map((video) => (
                <a
                  key={video.video_id}
                  href={`https://youtube.com/watch?v=${video.video_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:opacity-80 transition-opacity"
                  data-testid={`video-${video.video_id}`}
                >
                  <img src={video.thumbnail_url} alt="" loading="lazy" className="w-full rounded-lg mb-2" loading="lazy" />
                  <h4 className="font-medium text-[var(--text-primary)] text-sm line-clamp-2 mb-1">{video.title}</h4>
                  <p className="text-[var(--text-dim)] text-xs">{formatNumber(video.view_count)} views • {formatShortDate(video.published_at)}</p>
                </a>
              ))}
            </div>
          </div>
        )}
        
        {/* Embed Widget */}
        <EmbedWidget type="channel" data={channel} />

        {/* FAQ Section */}
        <div className="mt-8">
          <FAQSection faqs={channelFaqs} title={`FAQs: ${channel.title}`} />
        </div>
        
        {/* Internal Links Section - SEO Optimized */}
        <nav className="mt-8 space-y-6" aria-label="Related content">
          {/* Related Channels from Same Country */}
          {relatedChannels.length > 0 && (
            <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6" data-testid="related-channels">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                Other Popular YouTubers from {channel.country_name}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {relatedChannels.map((related) => (
                  <Link
                    key={related.channel_id}
                    to={`/channel/${related.channel_id}`}
                    className="group text-center p-3 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                    title={`${related.title} YouTube channel statistics - ${formatNumber(related.subscriber_count)} subscribers`}
                  >
                    <img 
                      src={related.thumbnail_url || "https://via.placeholder.com/56"} 
                      alt={`${related.title} profile`}
                      className="w-14 h-14 rounded-full mx-auto mb-2 border-2 border-[var(--border)] group-hover:border-red-600/50 transition-colors"
                      loading="lazy"
                    />
                    <div className="text-sm text-[var(--text-primary)] group-hover:text-red-400 truncate transition-colors">{related.title}</div>
                    <div className="text-xs text-[var(--text-dim)]">{formatNumber(related.subscriber_count)} subs</div>
                  </Link>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <Link 
                  to={`/country/${channel.country_code}`} 
                  className="inline-flex items-center gap-2 text-red-500 hover:text-red-400 text-sm font-medium"
                >
                  View all {channel.country_name} YouTube channels <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </section>
          )}

          {/* Site Navigation */}
          <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6" data-testid="channel-navigation">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Explore More</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-2">Country Rankings</h3>
                <div className="space-y-1">
                  <Link to={`/country/${channel.country_code}`} className="block text-sm text-[var(--text-secondary)] hover:text-red-400">
                    Top channels in {channel.country_name}
                  </Link>
                  <Link to="/countries" className="block text-sm text-[var(--text-secondary)] hover:text-red-400">
                    Browse all 197 countries
                  </Link>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-2">Global Rankings</h3>
                <div className="space-y-1">
                  <Link to="/leaderboard" className="block text-sm text-[var(--text-secondary)] hover:text-red-400">Global Subscriber Leaderboard</Link>
                  <Link to="/trending" className="block text-sm text-[var(--text-secondary)] hover:text-red-400">Fastest Growing Channels</Link>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-2">Tools</h3>
                <div className="space-y-1">
                  <Link to={`/compare?ids=${channel.channel_id}`} className="block text-sm text-[var(--text-secondary)] hover:text-red-400">
                    Compare {channel.title?.split(' ')[0]} with others
                  </Link>
                  <Link to="/search" className="block text-sm text-[var(--text-secondary)] hover:text-red-400">Search YouTube Channels</Link>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-2">Resources</h3>
                <div className="space-y-1">
                  <Link to="/blog" className="block text-sm text-[var(--text-secondary)] hover:text-red-400">YouTube Insights Blog</Link>
                  <Link to="/about" className="block text-sm text-[var(--text-secondary)] hover:text-red-400">About TopTube World</Link>
                </div>
              </div>
            </div>
          </section>
        </nav>
        </div>
          
          {/* Sidebar with Ads */}
          <div className="hidden lg:block w-[300px] flex-shrink-0">
            <SidebarAd />
            <div className="mt-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
              <h3 className="font-semibold text-[var(--text-primary)] mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link to={`/compare?ids=${channel.channel_id}`} className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">
                  <BarChart3 className="w-4 h-4" /> Compare this channel
                </Link>
                <a 
                  href={`https://youtube.com/channel/${channel.channel_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm"
                >
                  <ExternalLink className="w-4 h-4" /> View on YouTube
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



export { ChannelPage };
