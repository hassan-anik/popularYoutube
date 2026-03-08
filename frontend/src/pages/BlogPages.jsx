import React, { lazy, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BookOpen, CalendarDays, ChevronRight, Clock, FileText, Globe, Home } from 'lucide-react';
import { useSEO, JsonLd } from '../hooks/useSEO';
import { API, SITE_URL } from '../utils/constants';
import { formatDate, formatNumber } from '../utils/format';
import { HorizontalAd, NewsletterSignup, SocialShareButtons, ViralBadge } from '../components/common';
import { Breadcrumb } from '../components/seo';

// Default blog posts when API returns empty
const defaultBlogPosts = [
  {
    id: '1',
    slug: 'top-10-rising-youtubers-2025',
    title: 'Top 10 Rising YouTubers to Watch in 2025',
    excerpt: 'Discover the fastest-growing YouTube channels that are set to dominate the platform this year.',
    category: 'Trending',
    created_at: '2025-01-15',
    read_time: '5 min read',
    image: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800&auto=format&fit=crop&q=60',
    status: 'published'
  },
  {
    id: '2',
    slug: 'how-youtube-algorithm-works-2025',
    title: 'How the YouTube Algorithm Works in 2025',
    excerpt: 'An in-depth analysis of YouTube\'s recommendation system and how creators can leverage it.',
    category: 'Guide',
    created_at: '2025-01-10',
    read_time: '8 min read',
    image: 'https://images.unsplash.com/photo-1633114128174-2f8aa49759b0?w=800&auto=format&fit=crop&q=60',
    status: 'published'
  }
];

const BlogPage = () => {
  const [posts, setPosts] = useState([]);
  const [countryPosts, setCountryPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: "Blog - YouTube Trends & Analysis | TopTube World Pro",
    description: "Read the latest articles about YouTube trends, channel growth strategies, and platform analytics. Explore top YouTubers by country.",
    keywords: "YouTube blog, YouTube trends, YouTube growth tips, YouTuber analysis, top YouTubers by country",
    canonical: `${SITE_URL}/blog`
  });

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const [blogRes, countryRes] = await Promise.all([
          axios.get(`${API}/blog/posts?status=published`).catch(() => ({ data: { posts: [] } })),
          axios.get(`${API}/blog/countries`).catch(() => ({ data: { posts: [] } }))
        ]);
        
        if (blogRes.data.posts && blogRes.data.posts.length > 0) {
          setPosts(blogRes.data.posts);
        } else {
          setPosts(defaultBlogPosts);
        }
        
        setCountryPosts(countryRes.data.posts || []);
      } catch (error) {
        console.error("Error fetching blog posts:", error);
        setPosts(defaultBlogPosts);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const featuredPost = posts[0];
  const otherPosts = posts.slice(1);
  
  // Popular countries to highlight
  const popularCountries = ['US', 'IN', 'BR', 'JP', 'KR', 'MX', 'GB', 'ID', 'PH', 'DE', 'FR', 'RU'];
  const featuredCountryPosts = countryPosts.filter(p => popularCountries.includes(p.country_code));

  return (
    <div className="py-8" data-testid="blog-page">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-red-500" />
            Blog & Insights
          </h1>
          <p className="text-gray-500">Latest trends, analysis, and insights from the YouTube world</p>
        </div>

        {featuredPost && (
          <div className="bg-[#111] border border-[#222] rounded-lg overflow-hidden mb-8">
            <div className="md:flex">
              <div className="md:w-1/2">
                <img 
                  src={featuredPost.image || 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800'} 
                  alt={featuredPost.title}
                  className="w-full h-64 md:h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="md:w-1/2 p-6 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-medium">{featuredPost.category}</span>
                  <span className="text-gray-500 text-xs flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    {formatDate(featuredPost.created_at)}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">{featuredPost.title}</h2>
                <p className="text-gray-400 mb-4">{featuredPost.excerpt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {featuredPost.read_time}
                  </span>
                  <Link to={`/blog/${featuredPost.slug}`} className="text-red-500 hover:text-red-400 font-medium flex items-center gap-1">
                    Read More <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        <HorizontalAd />

        {otherPosts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherPosts.map((post) => (
              <article key={post.id} className="bg-[#111] border border-[#222] rounded-lg overflow-hidden hover:border-[#333] transition-colors">
                <img 
                  src={post.image || 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800'} 
                  alt={post.title}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-[#222] text-gray-300 px-2 py-1 rounded text-xs">{post.category}</span>
                    <span className="text-gray-500 text-xs">{formatDate(post.created_at)}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{post.title}</h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-xs">{post.read_time}</span>
                    <Link to={`/blog/${post.slug}`} className="text-red-500 hover:text-red-400 text-sm font-medium">
                      Read →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Country Rankings Blog Posts Section */}
        {featuredCountryPosts.length > 0 && (
          <section className="mt-12" data-testid="country-blog-section">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Globe className="w-6 h-6 text-red-500" />
                  Top YouTubers by Country
                </h2>
                <p className="text-gray-500 mt-1">Explore the most subscribed YouTube channels in each country</p>
              </div>
              <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-medium">
                {countryPosts.length} Countries
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredCountryPosts.map((post) => (
                <Link
                  key={post.country_code}
                  to={post.url}
                  className="group bg-[#111] border border-[#222] rounded-lg p-4 hover:border-red-600/50 transition-all hover:scale-[1.02]"
                  data-testid={`country-blog-${post.country_code}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{post.flag_emoji}</span>
                    <span className="font-medium text-white group-hover:text-red-400 transition-colors">{post.country_name}</span>
                  </div>
                  <p className="text-gray-500 text-xs line-clamp-2">
                    Top 10 Most Subscribed YouTubers in {post.country_name}
                  </p>
                </Link>
              ))}
            </div>
            
            {/* View All Countries Link */}
            <div className="mt-6 text-center">
              <details className="inline-block">
                <summary className="cursor-pointer text-red-500 hover:text-red-400 font-medium">
                  View all {countryPosts.length} countries →
                </summary>
                <div className="mt-4 grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-64 overflow-y-auto p-4 bg-[#0a0a0a] border border-[#222] rounded-lg">
                  {countryPosts.map((post) => (
                    <Link
                      key={post.country_code}
                      to={post.url}
                      className="text-gray-400 hover:text-white text-xs p-2 rounded hover:bg-[#1a1a1a] transition-colors"
                      title={post.country_name}
                    >
                      {post.flag_emoji} {post.country_name.slice(0, 12)}{post.country_name.length > 12 ? '...' : ''}
                    </Link>
                  ))}
                </div>
              </details>
            </div>
          </section>
        )}

        <div className="mt-12">
          <NewsletterSignup />
        </div>
      </div>
    </div>
  );
};

// ==================== BLOG POST DETAIL PAGE ====================



const BlogPostPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`${API}/blog/posts/${slug}`);
        setPost(response.data);
      } catch (error) {
        console.error("Error fetching post:", error);
        // Try to find in default posts
        const defaultPost = defaultBlogPosts.find(p => p.slug === slug);
        if (defaultPost) {
          setPost({ ...defaultPost, content: defaultPost.excerpt });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold text-white mb-2">Post not found</h2>
          <Link to="/blog" className="text-red-500 hover:text-red-400">← Back to Blog</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8" data-testid="blog-post-page">
      <article className="max-w-4xl mx-auto px-4">
        <Link to="/blog" className="text-gray-500 hover:text-white mb-6 inline-flex items-center gap-1">
          ← Back to Blog
        </Link>
        
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-medium">{post.category}</span>
            <span className="text-gray-500 text-sm">{formatDate(post.created_at)}</span>
            <span className="text-gray-500 text-sm">• {post.read_time}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{post.title}</h1>
          <p className="text-xl text-gray-400">{post.excerpt}</p>
        </header>

        {post.image && (
          <img 
            src={post.image} 
            alt={post.title}
            className="w-full h-80 object-cover rounded-lg mb-8"
          />
        )}

        <div className="prose prose-invert prose-lg max-w-none markdown-content">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              table: ({node, ...props}) => (
                <div className="overflow-x-auto my-4">
                  <table className="min-w-full border border-[#333] rounded-lg" {...props} />
                </div>
              ),
              thead: ({node, ...props}) => (
                <thead className="bg-[#1a1a1a]" {...props} />
              ),
              th: ({node, ...props}) => (
                <th className="px-4 py-2 text-left text-white font-semibold border-b border-[#333]" {...props} />
              ),
              td: ({node, ...props}) => (
                <td className="px-4 py-2 text-gray-300 border-b border-[#222]" {...props} />
              ),
              h2: ({node, ...props}) => (
                <h2 className="text-2xl font-bold text-white mt-8 mb-4" {...props} />
              ),
              h3: ({node, ...props}) => (
                <h3 className="text-xl font-semibold text-white mt-6 mb-3" {...props} />
              ),
              p: ({node, ...props}) => (
                <p className="text-gray-300 mb-4" {...props} />
              ),
              ul: ({node, ...props}) => (
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1" {...props} />
              ),
              li: ({node, ...props}) => (
                <li className="text-gray-300" {...props} />
              ),
              strong: ({node, ...props}) => (
                <strong className="text-white font-semibold" {...props} />
              ),
              hr: ({node, ...props}) => (
                <hr className="border-[#333] my-6" {...props} />
              ),
              em: ({node, ...props}) => (
                <em className="text-gray-400 italic" {...props} />
              ),
            }}
          >
            {post.content || post.excerpt}
          </ReactMarkdown>
        </div>

        <footer className="mt-12 pt-8 border-t border-[#222]">
          <SocialShareButtons url={`${SITE_URL}/blog/${post.slug}`} title={post.title} />
        </footer>
      </article>
    </div>
  );
};

// ==================== COUNTRY BLOG POST PAGE (Auto-Generated) ====================

const CountryBlogSEO = ({ post }) => {
  const title = post?.title || "Top YouTubers by Country";
  const description = post?.excerpt || "Discover the most subscribed YouTube channels by country.";
  const pageUrl = post ? `${SITE_URL}/blog/country/${post.country_code}` : SITE_URL;
  
  useSEO({
    title,
    description,
    keywords: `top YouTubers ${post?.country_name}, most subscribed YouTube channels ${post?.country_name}, ${post?.country_name} YouTubers ${new Date().getFullYear()}, popular YouTubers in ${post?.country_name}`,
    canonical: pageUrl
  });

  if (!post) return null;

  // Schema.org Article structured data
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.excerpt,
    "url": pageUrl,
    "datePublished": post.generated_at,
    "dateModified": post.generated_at,
    "author": {
      "@type": "Organization",
      "name": "TopTube World Pro"
    },
    "publisher": {
      "@type": "Organization",
      "name": "TopTube World Pro",
      "url": SITE_URL
    },
    "mainEntityOfPage": pageUrl
  };

  // FAQ Schema for common questions
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `Who is the most subscribed YouTuber in ${post.country_name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": post.channels?.[0] ? `${post.channels[0].title} is the most subscribed YouTuber in ${post.country_name} with ${formatNumber(post.channels[0].subscriber_count)} subscribers.` : `Visit our rankings to find out.`
        }
      },
      {
        "@type": "Question",
        "name": `How many top YouTubers are from ${post.country_name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `We track ${post.total_channels} top YouTube channels from ${post.country_name}. Our rankings are updated daily with the latest subscriber counts.`
        }
      }
    ]
  };

  return (
    <>
      <JsonLd data={articleSchema} />
      <JsonLd data={faqSchema} />
    </>
  );
};



const CountryBlogPostPage = () => {
  const { countryCode } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`${API}/blog/country/${countryCode}`);
        setPost(response.data);
      } catch (error) {
        console.error("Error fetching country blog:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [countryCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold text-white mb-2">Country not found</h2>
          <Link to="/blog" className="text-red-500 hover:text-red-400">← Back to Blog</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8" data-testid="country-blog-page">
      <CountryBlogSEO post={post} />
      <article className="max-w-4xl mx-auto px-4">
        {/* Breadcrumb */}
        <Breadcrumb items={[
          { label: "Home", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: `${post.country_name} YouTubers` }
        ]} />

        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-medium">{post.category}</span>
            <span className="text-gray-500 text-sm">{post.read_time}</span>
            <span className="text-gray-500 text-sm">• Updated {new Date(post.generated_at).toLocaleDateString()}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {post.flag_emoji} {post.title}
          </h1>
          <p className="text-xl text-gray-400">{post.excerpt}</p>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#111] border border-[#222] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{post.total_channels}</div>
            <div className="text-gray-500 text-sm">Channels Tracked</div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">
              {formatNumber(post.channels?.reduce((sum, c) => sum + (c.subscriber_count || 0), 0) || 0)}
            </div>
            <div className="text-gray-500 text-sm">Total Subscribers</div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              +{formatNumber(post.channels?.reduce((sum, c) => sum + (c.daily_subscriber_gain || 0), 0) || 0)}
            </div>
            <div className="text-gray-500 text-sm">24h Growth</div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{post.region}</div>
            <div className="text-gray-500 text-sm">Region</div>
          </div>
        </div>

        {/* No Data Message */}
        {(!post.channels || post.channels.length === 0) && (
          <section className="bg-[#111] border border-[#222] rounded-lg p-12 text-center mb-8" data-testid="no-data-message">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-white mb-2">No Data Available</h2>
            <p className="text-gray-400 max-w-md mx-auto mb-6">
              We don't have any YouTube channel data for {post.country_name} yet. 
              This could be because there are no major YouTube creators from this country in our database.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/countries" className="bg-[#222] text-white px-4 py-2 rounded-lg hover:bg-[#333] transition-colors text-sm">
                Browse Other Countries
              </Link>
              <Link to="/leaderboard" className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm">
                View Global Leaderboard
              </Link>
            </div>
          </section>
        )}

        {/* Top 10 Channels - Only show if channels exist */}
        {post.channels && post.channels.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            The Top {post.channels?.length || 10} YouTubers in {post.country_name}
          </h2>
          <div className="space-y-4">
            {post.channels?.map((channel, idx) => (
              <div 
                key={channel.channel_id}
                className="bg-[#111] border border-[#222] rounded-lg p-5 hover:border-[#333] transition-colors cursor-pointer"
                onClick={() => navigate(`/channel/${channel.channel_id}`)}
                data-testid={`blog-channel-${idx}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    idx === 0 ? 'bg-yellow-500 text-black' :
                    idx === 1 ? 'bg-gray-400 text-black' :
                    idx === 2 ? 'bg-orange-600 text-white' :
                    'bg-[#222] text-gray-400'
                  }`}>
                    {idx + 1}
                  </div>
                  <img 
                    src={channel.thumbnail_url || "https://via.placeholder.com/56"} 
                    alt={channel.title}
                    className="w-14 h-14 rounded-full"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-lg mb-1">{channel.title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      <span><strong className="text-white">{formatNumber(channel.subscriber_count)}</strong> subscribers</span>
                      <span><strong className="text-white">{formatNumber(channel.view_count)}</strong> views</span>
                      <span><strong className="text-white">{channel.video_count}</strong> videos</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-sm ${(channel.daily_subscriber_gain || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {channel.daily_subscriber_gain >= 0 ? '+' : ''}{formatNumber(channel.daily_subscriber_gain || 0)} today
                      </span>
                      <ViralBadge label={channel.viral_label} />
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </section>
        )}

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-red-900/20 to-red-600/10 border border-red-600/30 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-2">Want to explore more?</h3>
          <p className="text-gray-400 mb-4">
            View detailed statistics, compare channels, or explore other countries.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link 
              to={`/country/${post.country_code}`}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              View All {post.country_name} Channels
            </Link>
            <Link 
              to="/compare"
              className="bg-[#222] text-white px-4 py-2 rounded-lg hover:bg-[#333] transition-colors text-sm font-medium"
            >
              Compare Channels
            </Link>
            <Link 
              to="/countries"
              className="bg-[#222] text-white px-4 py-2 rounded-lg hover:bg-[#333] transition-colors text-sm font-medium"
            >
              Browse All Countries
            </Link>
          </div>
        </section>

        {/* Related Countries */}
        <section className="mb-8">
          <h3 className="text-lg font-bold text-white mb-4">Explore Other Countries</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['US', 'IN', 'BR', 'JP', 'KR', 'MX', 'GB', 'ID']
              .filter(code => code !== post.country_code)
              .slice(0, 4)
              .map(code => {
                const names = { US: '🇺🇸 United States', IN: '🇮🇳 India', BR: '🇧🇷 Brazil', JP: '🇯🇵 Japan', KR: '🇰🇷 South Korea', MX: '🇲🇽 Mexico', GB: '🇬🇧 United Kingdom', ID: '🇮🇩 Indonesia' };
                return (
                  <Link 
                    key={code}
                    to={`/blog/country/${code}`}
                    className="bg-[#111] border border-[#222] rounded-lg p-3 text-center hover:border-red-600/50 transition-colors"
                  >
                    <span className="text-white text-sm">{names[code]} YouTubers</span>
                  </Link>
                );
              })}
          </div>
        </section>

        {/* Social Share */}
        <footer className="pt-8 border-t border-[#222]">
          <SocialShareButtons url={`${SITE_URL}/blog/country/${post.country_code}`} title={post.title} />
        </footer>
      </article>
    </div>
  );
};

// ==================== BLOG ADMIN PAGE ====================




export { BlogPage };
export { BlogPostPage };
export { CountryBlogPostPage };
