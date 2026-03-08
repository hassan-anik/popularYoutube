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

        {/* Comprehensive Channel Analysis Guide */}
        <section className="mt-8 bg-[var(--bg-deep)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Complete Guide: Understanding {channel.title}'s YouTube Success</h2>
          
          <article className="space-y-6 text-[var(--text-secondary)] text-sm leading-relaxed">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Channel Overview and Performance Analysis</h3>
              <p className="mb-4">
                {channel.title} represents {channel.subscriber_count > 50000000 ? 'one of the most successful channels on YouTube, with a massive global audience that' : 
                channel.subscriber_count > 10000000 ? 'a major YouTube presence, having built an audience that' :
                channel.subscriber_count > 1000000 ? 'a significant YouTube creator, with an established audience that' :
                'a growing YouTube presence, with an audience that'} demonstrates the channel's ability to create content that resonates with viewers worldwide. With {formatNumber(channel.subscriber_count)} subscribers, this {channel.country_name}-based channel has established itself as a notable creator in the YouTube ecosystem.
              </p>
              <p className="mb-4">
                The channel's total view count of {formatNumber(channel.view_count)} across {channel.video_count} videos reflects {channel.view_count / channel.video_count > 10000000 ? 'exceptional content performance, with videos consistently achieving viral-level viewership' :
                channel.view_count / channel.video_count > 1000000 ? 'strong content performance, with videos regularly reaching millions of viewers' :
                channel.view_count / channel.video_count > 100000 ? 'solid content performance, building a loyal viewership base' :
                'steady content performance as the channel builds its audience'}. The average views per video metric provides insight into typical content engagement beyond the channel's subscriber count.
              </p>
              <p>
                Understanding these metrics in context helps creators, marketers, and YouTube enthusiasts appreciate what success looks like at this scale and what factors contribute to building and maintaining such an audience on the world's largest video platform.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Growth Trajectory and Momentum</h3>
              <p className="mb-4">
                {channel.title}'s growth story is told through its subscriber trajectory. {channel.daily_subscriber_gain > 100000 ? 
                `Currently gaining approximately ${formatNumber(channel.daily_subscriber_gain)} subscribers daily, the channel demonstrates exceptional momentum that places it among YouTube's fastest-growing creators.` :
                channel.daily_subscriber_gain > 10000 ?
                `With daily gains of approximately ${formatNumber(channel.daily_subscriber_gain)} subscribers, the channel shows strong, consistent growth that reflects ongoing content success.` :
                channel.daily_subscriber_gain > 0 ?
                `Adding approximately ${formatNumber(channel.daily_subscriber_gain)} subscribers daily, the channel maintains positive growth momentum.` :
                `The channel's current growth pattern reflects typical fluctuations in the YouTube ecosystem.`}
              </p>
              <p className="mb-4">
                The daily growth rate of {(channel.daily_growth_percent || 0).toFixed(4)}% provides context for this growth relative to channel size. {channel.daily_growth_percent > 0.1 ?
                'This exceptional growth rate suggests viral momentum—content that is being heavily promoted by YouTube\'s algorithm to new audiences.' :
                channel.daily_growth_percent > 0.01 ?
                'This healthy growth rate indicates strong audience retention and successful content discovery through YouTube\'s recommendation system.' :
                'This growth rate reflects the challenges larger channels face in maintaining percentage growth as their subscriber bases expand.'}
              </p>
              <p>
                Weekly and monthly growth metrics provide longer-term perspective. The 7-day gain of {formatNumber(channel.weekly_subscriber_gain || 0)} subscribers and 30-day gain of {formatNumber(channel.monthly_subscriber_gain || 0)} subscribers help smooth out daily fluctuations and reveal underlying trends that aren't apparent from single-day snapshots.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Understanding the Viral Score</h3>
              <p className="mb-4">
                Our proprietary Viral Score of {channel.viral_prediction?.viral_score || 0} for {channel.title} represents our algorithm's assessment of the channel's current growth momentum and potential for continued expansion. This score considers multiple factors including recent subscriber velocity, historical growth patterns, and engagement indicators.
              </p>
              <p className="mb-4">
                {channel.viral_prediction?.viral_score > 70 ?
                'A viral score above 70 indicates exceptional growth momentum. Channels at this level are experiencing the kind of algorithmic promotion and audience discovery that can lead to exponential growth. This often corresponds to viral content, trending topics, or successful format innovations.' :
                channel.viral_prediction?.viral_score > 50 ?
                'A viral score between 50-70 suggests strong, healthy growth. The channel is successfully reaching new audiences while maintaining existing subscriber engagement. This represents sustainable success rather than volatile virality.' :
                channel.viral_prediction?.viral_score > 30 ?
                'A viral score between 30-50 indicates stable performance. The channel maintains its position in the YouTube ecosystem without dramatic growth or decline. Many successful established channels operate at this level.' :
                'A viral score below 30 suggests slower growth momentum. This doesn\'t necessarily indicate problems—many channels naturally reach plateaus after periods of rapid growth, or operate in niches with smaller addressable audiences.'}
              </p>
              <p>
                The viral label "{channel.viral_label || 'Stable'}" provides a quick categorization of current growth status. This classification helps viewers quickly understand where the channel stands in terms of growth trajectory without diving into specific numbers.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Regional Context: YouTube in {channel.country_name}</h3>
              <p className="mb-4">
                As a channel from {channel.country_name}, {channel.title} operates within a specific regional context that shapes its content strategy and growth potential. {channel.country_name}'s YouTube ecosystem reflects the country's internet adoption rates, content preferences, and creator culture.
              </p>
              <p className="mb-4">
                {channel.current_rank ? 
                `Ranked #${channel.current_rank} among ${channel.country_name} YouTube channels in our database, ${channel.title} represents ${channel.current_rank <= 3 ? 'the very top tier of creators from this region' : channel.current_rank <= 10 ? 'elite status among creators from this country' : channel.current_rank <= 50 ? 'significant success within the regional YouTube community' : 'notable achievement in a competitive creator landscape'}.` :
                `The channel contributes to ${channel.country_name}'s presence in the global YouTube ecosystem.`}
              </p>
              <p>
                Regional factors including language, cultural preferences, internet penetration, and advertising market strength all influence how channels from {channel.country_name} grow and monetize. Channels that successfully navigate these regional dynamics while potentially reaching international audiences often achieve the greatest success.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Content Performance Indicators</h3>
              <p className="mb-4">
                Beyond subscriber metrics, content performance reveals how effectively {channel.title} engages its audience. The ratio of total views to video count—approximately {formatNumber(Math.round(channel.view_count / Math.max(channel.video_count, 1)))} views per video on average—provides insight into typical content performance.
              </p>
              <p className="mb-4">
                {channel.view_count / channel.video_count > 10000000 ?
                'An average exceeding 10 million views per video indicates exceptional content performance. This suggests the channel creates content with broad appeal that successfully reaches audiences far beyond its subscriber base through recommendations and search.' :
                channel.view_count / channel.video_count > 1000000 ?
                'Averaging over 1 million views per video demonstrates strong content resonance. Videos consistently attract significant viewership, indicating successful algorithmic promotion and audience engagement.' :
                channel.view_count / channel.video_count > 100000 ?
                'With average views above 100,000 per video, the channel shows solid performance relative to its size. Content successfully reaches both existing subscribers and new viewers through YouTube\'s discovery systems.' :
                'The views-per-video average reflects the channel\'s current audience reach and content performance within its niche.'}
              </p>
              <p>
                Video count of {channel.video_count} indicates the channel's content output strategy. {channel.video_count > 1000 ?
                'With over 1,000 videos, this is a highly prolific channel with an extensive content library that drives ongoing discovery and engagement.' :
                channel.video_count > 100 ?
                'A catalog of 100+ videos provides substantial content for new viewers to explore, supporting subscriber retention and algorithmic recommendations.' :
                'The channel\'s video library is still growing, with potential for increased discovery as more content accumulates.'}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Comparison and Benchmarking</h3>
              <p className="mb-4">
                Understanding {channel.title}'s performance benefits from comparison with similar channels. Our Compare tool allows side-by-side analysis against competitors, collaborators, or channels in similar categories. This comparative analysis can reveal relative strengths, growth differentials, and competitive dynamics.
              </p>
              <p className="mb-4">
                When benchmarking, consider comparing channels within the same content category, target demographic, and geographic market. A gaming channel's metrics should be compared to other gaming channels rather than music or children's content, as each category has different norms for subscriber-to-view ratios, upload frequencies, and growth patterns.
              </p>
              <p>
                The related channels section above shows other popular creators from {channel.country_name}, providing immediate context for how {channel.title} fits within its regional creator community. These connections often reflect collaborative relationships, shared audiences, or simply parallel paths to success within the same market.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Historical Growth Analysis</h3>
              <p className="mb-4">
                The subscriber growth chart above visualizes how {channel.title}'s audience has evolved over the tracked period. This historical perspective reveals patterns that current snapshots alone cannot show: acceleration, deceleration, plateau periods, and breakthrough moments.
              </p>
              <p className="mb-4">
                Successful YouTube channels typically show several distinct growth phases. Early channels often experience slow initial growth before reaching an inflection point where content begins resonating with larger audiences. Established channels may show steady linear growth or periodic spikes corresponding to viral content. Understanding where a channel sits in this lifecycle helps contextualize current metrics.
              </p>
              <p>
                Inflection points in the growth chart often correspond to specific events: viral videos, algorithm changes, collaborations, or external coverage. Identifying these moments—when visible in the data—can reveal what types of content or circumstances drive this channel's growth.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Using This Data</h3>
              <p className="mb-4">
                The statistics and analysis on this page serve various purposes depending on your interest in {channel.title}.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">For Fans:</strong> Track your favorite creator's growth, understand their position in YouTube's competitive landscape, and follow their trajectory over time. Share statistics with friends or communities interested in the channel.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">For Creators:</strong> Benchmark against successful channels in your category, understand what growth rates and engagement levels successful channels achieve, and identify strategies that might inform your own content approach.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">For Marketers:</strong> Evaluate potential partnership opportunities, understand reach and engagement potential, track brand ambassador performance over time, and compare options for influencer marketing campaigns.
              </p>
              <p>
                <strong className="text-[var(--text-primary)]">For Researchers:</strong> Analyze platform dynamics, study creator economics, examine content trends, and understand how attention is distributed on the world's largest video platform.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">The YouTube Creator Economy</h3>
              <p className="mb-4">
                {channel.title}'s success exists within the broader context of YouTube's creator economy—a global ecosystem where content creation has become a viable career path for millions. Understanding this economy helps contextualize individual channel performance.
              </p>
              <p className="mb-4">
                YouTube shares advertising revenue with creators who meet Partner Program requirements, creating financial incentives that have professionalized content creation. Channels at {channel.title}'s scale typically generate significant revenue from advertising alone, though actual earnings depend heavily on audience demographics, content type, and seasonal advertising demand.
              </p>
              <p className="mb-4">
                Beyond advertising, successful channels often diversify into brand partnerships, merchandise, memberships, and business ventures. {channel.subscriber_count > 10000000 ? 
                `A channel with ${formatNumber(channel.subscriber_count)} subscribers like ${channel.title} likely has access to premium partnership opportunities that smaller channels cannot command.` :
                `As channels grow toward and beyond ${channel.title}'s current scale, these additional revenue streams often become increasingly important.`}
              </p>
              <p>
                The creator economy has also spawned supporting industries—talent management agencies, production companies, analytics services (like TopTube World Pro), and platforms built to serve creators. This ecosystem reflects YouTube's transformation from a simple video sharing site into a foundational platform for 21st-century media.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Algorithm and Discovery Factors</h3>
              <p className="mb-4">
                {channel.title}'s audience has been built through YouTube's content discovery systems. Understanding how these systems work provides insight into the channel's success and potential future trajectory.
              </p>
              <p className="mb-4">
                YouTube's recommendation algorithm considers multiple factors when deciding which content to promote: watch time (how long viewers watch), click-through rate (how often viewers click when shown the thumbnail), engagement signals (likes, comments, shares), and session metrics (whether viewers continue watching more YouTube after a video). Channels that optimize for these factors receive amplified algorithmic promotion.
              </p>
              <p className="mb-4">
                Search discovery also plays a role, particularly for educational and how-to content. Channels that rank well for popular search queries receive consistent traffic independent of algorithm recommendations. This search traffic often converts well to subscriptions as viewers find exactly what they were looking for.
              </p>
              <p>
                External traffic from social media, websites, and other platforms can bootstrap algorithmic discovery. Content that performs well initially—regardless of traffic source—signals quality to YouTube's systems and may receive expanded algorithmic promotion.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Future Outlook and Predictions</h3>
              <p className="mb-4">
                While we cannot predict {channel.title}'s exact future trajectory, the metrics and patterns displayed on this page provide indicators of likely direction.
              </p>
              <p className="mb-4">
                {channel.viral_label === 'Exploding' ?
                `With "Exploding" status, ${channel.title} is currently experiencing exceptional growth momentum. If this pace continues, significant subscriber milestones may be achieved relatively quickly. However, explosive growth rates are difficult to maintain indefinitely.` :
                channel.viral_label === 'Rising Fast' ?
                `The "Rising Fast" status indicates strong growth trajectory. ${channel.title} appears well-positioned for continued expansion, though external factors and content strategy decisions will influence actual outcomes.` :
                channel.viral_label === 'Stable' ?
                `A "Stable" status suggests consistent performance without dramatic growth or decline. Many successful established channels maintain stable states for extended periods, representing sustainable success rather than viral volatility.` :
                `Current growth patterns suggest ${channel.title} may benefit from content strategy adjustments or external catalysts to accelerate growth momentum.`}
              </p>
              <p>
                The YouTube landscape continues evolving with new features, algorithm changes, and shifting viewer preferences. Channels that adapt to these changes while maintaining core value propositions tend to sustain long-term success. {channel.title}'s future will depend on both external platform factors and internal content decisions.
              </p>
            </div>

            <div className="pt-4 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--text-dim)]">
                <em>Subscriber counts, view counts, and video counts are sourced from the YouTube Data API and reflect the most recent available data. Growth metrics, viral scores, and predictions are independently calculated by TopTube World Pro based on our historical tracking data. These metrics are estimates intended for informational purposes and may differ from YouTube's internal analytics. This page is not affiliated with or endorsed by {channel.title} or YouTube.</em>
              </p>
            </div>
          </article>
        </section>
        
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
