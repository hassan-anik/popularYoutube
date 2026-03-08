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
      </div>
    </div>
  );
};



export { CategoryListPage };
export { CategoryPage };
