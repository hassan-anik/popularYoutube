import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Filter, Home } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { API, SITE_URL } from '../utils/constants';
import { formatNumber } from '../utils/format';
import { Header } from '../components/common';
import { Breadcrumb } from '../components/seo';

// ==================== CHANNEL CATEGORY PAGES ====================

const CHANNEL_CATEGORIES = [
  { slug: 'music', name: 'Music', icon: '🎵', keywords: ['music', 'vevo', 'records', 'songs', 'official artist'] },
  { slug: 'gaming', name: 'Gaming', icon: '🎮', keywords: ['gaming', 'games', 'gameplay', 'gamer', 'plays'] },
  { slug: 'entertainment', name: 'Entertainment', icon: '🎬', keywords: ['entertainment', 'comedy', 'funny', 'vlog', 'challenge'] },
  { slug: 'education', name: 'Education', icon: '📚', keywords: ['education', 'learn', 'tutorial', 'how to', 'explained', 'science'] },
  { slug: 'sports', name: 'Sports', icon: '⚽', keywords: ['sports', 'football', 'basketball', 'soccer', 'nba', 'fifa'] },
  { slug: 'news', name: 'News & Politics', icon: '📰', keywords: ['news', 'politics', 'media', 'tv', 'broadcast'] },
  { slug: 'kids', name: 'Kids & Family', icon: '👶', keywords: ['kids', 'children', 'nursery', 'cartoon', 'family', 'baby'] },
  { slug: 'tech', name: 'Technology', icon: '💻', keywords: ['tech', 'technology', 'review', 'unboxing', 'gadget'] },
];



const CategoryListPage = () => {
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API}/leaderboard/global?limit=500`);
        const channelData = response.data.channels || [];
        setChannels(channelData);
        
        // Categorize channels
        const stats = CHANNEL_CATEGORIES.map(cat => {
          const categoryChannels = channelData.filter(ch => {
            const title = (ch.title || '').toLowerCase();
            const desc = (ch.description || '').toLowerCase();
            return cat.keywords.some(kw => title.includes(kw) || desc.includes(kw));
          });
          
          return {
            ...cat,
            channelCount: categoryChannels.length,
            topChannel: categoryChannels[0],
            totalSubs: categoryChannels.reduce((sum, c) => sum + (c.subscriber_count || 0), 0)
          };
        });
        
        setCategoryStats(stats.sort((a, b) => b.totalSubs - a.totalSubs));
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const currentYear = new Date().getFullYear();

  useSEO({
    title: `YouTube Channel Categories ${currentYear} - Top Gaming, Music, Entertainment YouTubers`,
    description: `Browse YouTube channels by category. Find the top Gaming, Music, Entertainment, Education, Sports, and Tech YouTubers ranked by subscribers.`,
    keywords: `youtube categories ${currentYear}, top gaming youtubers, best music channels, entertainment youtube, youtube by category`,
    canonical: `${SITE_URL}/categories`
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-8" data-testid="categories-page">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">YouTube Channel Categories</h1>
          <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto">
            Discover top YouTube creators organized by content type - from Gaming and Music to Education and Technology
          </p>
        </div>

        {/* Editorial Introduction */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3">Explore YouTube by Content Type</h2>
          <div className="text-[var(--text-secondary)] text-sm space-y-3">
            <p>
              YouTube hosts an incredible diversity of content, from music videos and gaming streams to educational tutorials 
              and news coverage. Our category rankings help you discover the top creators in each content vertical, making it 
              easier to find channels that match your interests or research needs.
            </p>
            <p>
              Channels are categorized using keyword analysis of their titles and descriptions. Each category page shows 
              subscriber rankings, growth trends, and detailed statistics. Note that some channels may appear in multiple 
              categories if their content spans different topics.
            </p>
            <p className="text-xs text-[var(--text-dim)] pt-2 border-t border-[var(--border)]">
              <em>Category assignments are automated based on channel metadata and may not perfectly reflect all content types 
              covered by a channel.</em>
            </p>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">All Categories</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categoryStats.map(cat => (
            <div
              key={cat.slug}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5 cursor-pointer hover:border-red-500/50 transition-colors group"
              onClick={() => navigate(`/category/${cat.slug}`)}
            >
              <div className="text-4xl mb-3">{cat.icon}</div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] group-hover:text-red-500 transition-colors">{cat.name}</h2>
              <p className="text-[var(--text-dim)] text-sm mt-1">{cat.channelCount} channels tracked</p>
              <p className="text-[var(--text-muted)] text-sm">{formatNumber(cat.totalSubs)} total subs</p>
              
              {cat.topChannel && (
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                  <p className="text-[var(--text-dim)] text-xs mb-2">Top Channel</p>
                  <div className="flex items-center gap-2">
                    <img src={cat.topChannel.thumbnail_url} alt="" className="w-8 h-8 rounded-full" />
                    <div>
                      <div className="text-[var(--text-primary)] text-sm font-medium truncate">{cat.topChannel.title}</div>
                      <div className="text-[var(--text-dim)] text-xs">{formatNumber(cat.topChannel.subscriber_count)} subs</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


const CategoryPage = () => {
  const { categorySlug } = useParams();
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  const category = CHANNEL_CATEGORIES.find(c => c.slug === categorySlug);

  useEffect(() => {
    const fetchData = async () => {
      if (!category) return;
      
      try {
        const response = await axios.get(`${API}/leaderboard/global?limit=500`);
        const channelData = response.data.channels || [];
        
        // Filter by category keywords
        const categoryChannels = channelData.filter(ch => {
          const title = (ch.title || '').toLowerCase();
          const desc = (ch.description || '').toLowerCase();
          return category.keywords.some(kw => title.includes(kw) || desc.includes(kw));
        });
        
        setChannels(categoryChannels);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [categorySlug, category]);

  const currentYear = new Date().getFullYear();

  useSEO({
    title: category ? `Top ${category.name} YouTube Channels ${currentYear} - Best ${category.name} YouTubers Ranked` : "Category Not Found",
    description: category ? `Ranking of the most subscribed ${category.name} YouTube channels in ${currentYear}. See the top ${category.name} YouTubers with live subscriber counts and growth stats.` : "",
    keywords: category ? `top ${category.name.toLowerCase()} youtubers ${currentYear}, best ${category.name.toLowerCase()} youtube channels, ${category.name.toLowerCase()} youtube ranking` : "",
    canonical: `${SITE_URL}/category/${categorySlug}`
  });

  // Set noindex for 404 pages
  useEffect(() => {
    if (!category) {
      let robotsMeta = document.querySelector('meta[name="robots"]');
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.setAttribute('name', 'robots');
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.setAttribute('content', 'noindex, nofollow');
    }
  }, [category]);

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" data-testid="category-not-found">
        <div className="text-6xl mb-4">📁</div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Category Not Found</h1>
        <p className="text-[var(--text-muted)] mb-6 text-center">The category you're looking for doesn't exist.</p>
        <Link to="/categories" className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg">
          Browse All Categories
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-8" data-testid="category-page">
      <div className="max-w-6xl mx-auto px-4">
        {/* Breadcrumb */}
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Categories', href: '/categories' },
          { label: category.name }
        ]} />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{category.icon}</span>
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">Top {category.name} YouTubers</h1>
          </div>
          <p className="text-[var(--text-muted)]">Ranking of the most subscribed {category.name} channels • {channels.length} channels</p>
        </div>

        {/* Top 3 Podium */}
        {channels.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[1, 0, 2].map((position) => {
              const channel = channels[position];
              if (!channel) return null;
              const isFirst = position === 0;
              return (
                <div 
                  key={channel.channel_id}
                  className={`bg-[var(--bg-card)] border ${isFirst ? 'border-yellow-500/50 -mt-4' : 'border-[var(--border)]'} rounded-lg p-4 text-center cursor-pointer hover:border-yellow-500/30 transition-colors`}
                  onClick={() => navigate(`/channel/${channel.channel_id}`)}
                >
                  <div className={`text-2xl font-bold mb-2 ${isFirst ? 'text-yellow-500' : position === 1 ? 'text-[var(--text-muted)]' : 'text-amber-700'}`}>
                    #{position + 1}
                  </div>
                  <img src={channel.thumbnail_url} alt={channel.title} className="w-16 h-16 rounded-full mx-auto mb-2" />
                  <h3 className="font-semibold text-[var(--text-primary)] truncate">{channel.title}</h3>
                  <p className="text-[var(--text-dim)] text-sm">{formatNumber(channel.subscriber_count)} subs</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Channel List */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--bg-deep)] border-b border-[var(--border)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-dim)] uppercase">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-dim)] uppercase">Channel</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-dim)] uppercase">Subscribers</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-dim)] uppercase">Country</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-dim)] uppercase">24h Gain *</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--divide)]">
              {channels.slice(0, 50).map((channel, idx) => (
                <tr 
                  key={channel.channel_id}
                  className="hover:bg-[var(--bg-hover)] cursor-pointer transition-colors"
                  onClick={() => navigate(`/channel/${channel.channel_id}`)}
                >
                  <td className="px-4 py-3 font-bold text-[var(--text-muted)]">#{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={channel.thumbnail_url} alt="" className="w-10 h-10 rounded-full" />
                      <span className="font-medium text-[var(--text-primary)]">{channel.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-primary)] font-semibold">{formatNumber(channel.subscriber_count)}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{channel.country_name}</td>
                  <td className="px-4 py-3 text-green-400">+{formatNumber(channel.daily_subscriber_gain || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Disclaimer */}
        <div className="mt-4 p-3 bg-[var(--bg-deep)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-dim)]">
          <span className="text-yellow-500">*</span> 24h Gains are estimated by TopTube World Pro. Category assignments are based on channel metadata and may not be 100% accurate.
        </div>

        {/* Editorial Content */}
        <div className="mt-8 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">About {category?.name} Channels on YouTube</h2>
          <div className="text-[var(--text-secondary)] text-sm space-y-3">
            <p>
              The {category?.name?.toLowerCase()} category represents one of the most {channels.length > 100 ? 'popular' : 'diverse'} content 
              verticals on YouTube. With {channels.length} channels tracked in our database, this category showcases creators ranging from 
              emerging talents to established industry leaders with hundreds of millions of subscribers.
            </p>
            <p>
              {category?.name} content on YouTube has evolved significantly over the years, with top creators developing increasingly 
              sophisticated production values and content strategies. The category's top channel boasts {formatNumber(channels[0]?.subscriber_count || 0)} subscribers, 
              demonstrating the massive audience potential in this space.
            </p>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mt-4">Key Insights</h3>
            <ul className="list-disc list-inside text-[var(--text-muted)] space-y-1">
              <li>Total channels tracked: <span className="text-[var(--text-primary)]">{channels.length}</span></li>
              <li>Combined subscribers: <span className="text-[var(--text-primary)]">{formatNumber(channels.reduce((sum, c) => sum + (c.subscriber_count || 0), 0))}</span></li>
              <li>Top country representation: <span className="text-[var(--text-primary)]">{channels[0]?.country_name || 'Various'}</span></li>
            </ul>
            <p className="text-xs text-[var(--text-dim)] pt-2 border-t border-[var(--border)]">
              <em>Channels are categorized using automated keyword analysis of titles and descriptions. Some channels may appear in 
              multiple categories if their content spans different topics.</em>
            </p>
          </div>
        </div>

        {/* Comprehensive Category Guide */}
        <section className="mt-8 bg-[var(--bg-deep)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Complete Guide: {category?.name} Content on YouTube</h2>
          
          <article className="space-y-6 text-[var(--text-secondary)] text-sm leading-relaxed">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Understanding the {category?.name} Category</h3>
              <p className="mb-4">
                The {category?.name?.toLowerCase()} category on YouTube encompasses a diverse range of content creators who focus on this particular niche. This category has grown significantly as YouTube has matured, evolving from simple uploads to sophisticated productions that rival traditional media. Understanding this category's landscape helps viewers discover quality content and provides aspiring creators with benchmarks for success.
              </p>
              <p className="mb-4">
                With {channels.length} channels tracked in our database for {category?.name?.toLowerCase()}, this category represents {channels.length > 100 ? 'one of YouTube\'s most competitive spaces' : channels.length > 50 ? 'a significant portion of YouTube\'s content ecosystem' : 'a specialized niche with dedicated audiences'}. The combined subscriber count of {formatNumber(channels.reduce((sum, c) => sum + (c.subscriber_count || 0), 0))} demonstrates the substantial audience interest in this type of content.
              </p>
              <p>
                Success in the {category?.name?.toLowerCase()} category requires understanding audience expectations, production standards, and content strategies specific to this niche. The channels ranking highest in this category have typically found unique angles or exceptional execution that sets them apart from competitors.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Top Performers and Success Patterns</h3>
              <p className="mb-4">
                {channels[0] ? `Leading the ${category?.name?.toLowerCase()} category, ${channels[0].title} has accumulated ${formatNumber(channels[0].subscriber_count)} subscribers, establishing themselves as the definitive voice in this space. Their success demonstrates the potential reach of high-quality ${category?.name?.toLowerCase()} content on YouTube.` : `The top channels in ${category?.name?.toLowerCase()} have built substantial audiences through consistent content quality and audience engagement.`}
              </p>
              <p className="mb-4">
                {channels[1] && channels[2] ? `Following closely are ${channels[1].title} with ${formatNumber(channels[1].subscriber_count)} subscribers and ${channels[2].title} with ${formatNumber(channels[2].subscriber_count)} subscribers. These channels represent different approaches to ${category?.name?.toLowerCase()} content, demonstrating that multiple content strategies can succeed within the same category.` : 'The competition within this category continues to intensify as more creators recognize the audience potential.'}
              </p>
              <p>
                Common success factors among top {category?.name?.toLowerCase()} channels include consistent upload schedules, distinctive presentation styles, strong audience engagement through comments and community features, and evolution of content formats to match changing viewer preferences.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Content Strategies in {category?.name}</h3>
              <p className="mb-4">
                Successful {category?.name?.toLowerCase()} creators typically employ several key strategies that differentiate them from competitors. Content quality remains paramount—viewers in this category have become increasingly sophisticated and expect high production values, accurate information, and engaging presentation.
              </p>
              <p className="mb-4">
                SEO optimization plays a crucial role in {category?.name?.toLowerCase()} content discovery. Top channels carefully craft titles, descriptions, and tags to match viewer search intent. They understand which topics drive search traffic and create content that addresses specific viewer needs and questions.
              </p>
              <p className="mb-4">
                Community building separates successful {category?.name?.toLowerCase()} channels from those that plateau. Engaging with comments, creating community posts, hosting live streams, and building presence across multiple platforms helps maintain audience loyalty and drives organic growth through word-of-mouth recommendations.
              </p>
              <p>
                Content diversification within the {category?.name?.toLowerCase()} niche allows top creators to reach different audience segments. This might include varying video lengths, experimenting with formats like shorts, creating series versus standalone videos, or addressing topics at different expertise levels.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Audience Demographics and Engagement</h3>
              <p className="mb-4">
                The {category?.name?.toLowerCase()} audience on YouTube spans diverse demographics, though certain patterns emerge. Understanding these patterns helps creators tailor content effectively and helps advertisers evaluate partnership opportunities.
              </p>
              <p className="mb-4">
                Engagement patterns in {category?.name?.toLowerCase()} content often differ from YouTube averages. {category?.name} viewers tend to {channels.length > 100 ? 'watch videos for longer durations, comment more frequently, and show higher subscription rates after watching' : 'demonstrate strong loyalty to channels they follow and actively participate in community discussions'}.
              </p>
              <p>
                Geographic distribution of {category?.name?.toLowerCase()} audiences varies by channel and specific content focus. The international nature of YouTube means successful {category?.name?.toLowerCase()} creators often attract viewers from multiple countries, though language and cultural factors influence reach in different markets.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Monetization in {category?.name}</h3>
              <p className="mb-4">
                {category?.name} channels benefit from multiple monetization opportunities beyond standard YouTube advertising. The category's characteristics influence which revenue streams prove most effective for creators.
              </p>
              <p className="mb-4">
                Brand partnerships are particularly prevalent in {category?.name?.toLowerCase()} content, where companies seek to reach the category's engaged audiences. Top {category?.name?.toLowerCase()} creators command premium sponsorship rates due to their audience quality and engagement metrics.
              </p>
              <p className="mb-4">
                Merchandise and product lines often complement {category?.name?.toLowerCase()} content. Creators who build strong personal brands can leverage their audiences for direct-to-consumer product sales, creating revenue streams independent of platform monetization.
              </p>
              <p>
                Channel memberships and Patreon-style support allow {category?.name?.toLowerCase()} audiences to directly support creators they value. This recurring revenue provides stability that advertising alone cannot match, especially for creators addressing niche topics within the broader category.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Future Trends in {category?.name}</h3>
              <p className="mb-4">
                The {category?.name?.toLowerCase()} category continues evolving as YouTube introduces new features and viewer preferences shift. Understanding emerging trends helps both creators and viewers anticipate where the category is heading.
              </p>
              <p className="mb-4">
                Short-form content through YouTube Shorts has created new opportunities in {category?.name?.toLowerCase()}. Creators who successfully adapt their content for the shorts format can reach new audiences and drive subscription growth beyond what long-form content alone achieves.
              </p>
              <p className="mb-4">
                Live streaming and interactive content are growing within {category?.name?.toLowerCase()}. Real-time engagement creates deeper connections with audiences and opens monetization through Super Chat and channel memberships.
              </p>
              <p>
                Competition within {category?.name?.toLowerCase()} will likely intensify as more creators recognize the category's potential. Success will increasingly depend on differentiation, quality, and authentic audience connection rather than simply being present in the space.
              </p>
            </div>

            <div className="pt-4 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--text-dim)]">
                <em>Category data is compiled by TopTube World Pro through automated analysis of channel metadata. Rankings are based on subscriber counts from the YouTube Data API. Category assignments may not perfectly match YouTube's internal categorization. Some channels may appear in multiple categories if their content spans different topics.</em>
              </p>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
};



export { CategoryListPage };
export { CategoryPage };
