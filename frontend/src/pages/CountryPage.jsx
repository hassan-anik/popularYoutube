import React, { lazy, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Check, Home, Search } from 'lucide-react';
import { API } from '../utils/constants';
import { formatNumber } from '../utils/format';
import { Header, ViralBadge } from '../components/common';
import { Breadcrumb, CountrySEO, FAQSection } from '../components/seo';

// Country Detail Page
const CountryPage = () => {
  const { countryCode } = useParams();
  const navigate = useNavigate();
  const [country, setCountry] = useState(null);
  const [neighbors, setNeighbors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [countryRes, neighborsRes] = await Promise.all([
          axios.get(`${API}/countries/${countryCode}`),
          axios.get(`${API}/countries/${countryCode}/neighbors?limit=8`).catch(() => ({ data: { neighbors: [] } }))
        ]);
        setCountry(countryRes.data);
        setNeighbors(neighborsRes.data.neighbors || []);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [countryCode]);

  // Set noindex for 404 pages - must be before any conditional returns
  useEffect(() => {
    if (!loading && !country) {
      let robotsMeta = document.querySelector('meta[name="robots"]');
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.setAttribute('name', 'robots');
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.setAttribute('content', 'noindex, nofollow');
      document.title = 'Country Not Found - TopTube World Pro';
    }
  }, [loading, country]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!country) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" data-testid="country-not-found">
        <div className="text-6xl mb-4">🌍</div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Country Not Found</h1>
        <p className="text-[var(--text-muted)] mb-6 text-center max-w-md">
          The country you're looking for doesn't exist in our database.
        </p>
        <div className="flex gap-4">
          <Link 
            to="/countries" 
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
          >
            Browse All Countries
          </Link>
        </div>
      </div>
    );
  }

  const topThree = country.channels?.slice(0, 3) || [];

  // Generate country-specific FAQs
  const countryFaqs = country && country.channels?.length > 0 ? [
    {
      question: `Who is the most subscribed YouTuber in ${country.name}?`,
      answer: `${country.channels[0]?.title} is the most subscribed YouTube channel in ${country.name} with ${formatNumber(country.channels[0]?.subscriber_count)} subscribers${country.channels[1] ? `, followed by ${country.channels[1]?.title} with ${formatNumber(country.channels[1]?.subscriber_count)} subscribers` : ''}.`
    },
    {
      question: `How many YouTube channels are tracked in ${country.name}?`,
      answer: `We currently track ${country.channels?.length || 0} of the top YouTube channels from ${country.name}. Our database is updated every 6 hours with the latest subscriber counts and growth data.`
    },
    {
      question: `Which ${country.name} YouTuber is growing the fastest?`,
      answer: country.channels?.find(c => c.daily_growth_percent > 0) 
        ? `Among tracked channels, those with "Exploding" or "Rising" status are growing fastest. Check the individual channel pages for detailed growth analytics.`
        : `Visit individual channel pages to see detailed growth metrics including daily, weekly, and monthly subscriber gains.`
    }
  ] : [];

  return (
    <div className="py-8" data-testid="country-detail-page">
      <CountrySEO country={country} channels={country.channels} />
      <div className="max-w-6xl mx-auto px-4">
        {/* Breadcrumb */}
        <Breadcrumb items={[
          { label: "Home", href: "/" },
          { label: "Countries", href: "/countries" },
          { label: country.name }
        ]} />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-5xl">{country.flag_emoji}</span>
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">{country.name}</h1>
              <p className="text-[var(--text-dim)]">{country.region} • {country.channels?.length || 0} channels tracked</p>
            </div>
          </div>
        </div>

        {/* No Data Message */}
        {(!country.channels || country.channels.length === 0) && (
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-12 text-center mb-8" data-testid="no-data-message">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">No Data Available</h2>
            <p className="text-[var(--text-muted)] max-w-md mx-auto">
              We don't have any YouTube channel data for {country.name} yet. 
              This could be because there are no major YouTube creators from this country in our database, 
              or data collection is still in progress.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/countries" className="bg-[var(--border)] text-[var(--text-primary)] px-4 py-2 rounded-lg hover:bg-[var(--border-hover)] transition-colors text-sm">
                Browse Other Countries
              </Link>
              <Link to="/leaderboard" className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm">
                View Global Leaderboard
              </Link>
            </div>
          </div>
        )}

        {/* Top 3 Podium - Only show if channels exist */}
        {topThree.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {topThree.map((channel, idx) => (
            <div
              key={channel.channel_id}
              className={`bg-[var(--bg-card)] border rounded-lg p-6 cursor-pointer hover:border-[#444] transition-colors ${idx === 0 ? 'border-yellow-600' : 'border-[var(--border)]'}`}
              onClick={() => navigate(`/channel/${channel.channel_id}`)}
              data-testid={`podium-${idx}`}
            >
              <div className="text-center mb-4">
                <span className="text-3xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
              </div>
              <img src={channel.thumbnail_url || "https://via.placeholder.com/80"} alt="" loading="lazy" className="w-20 h-20 rounded-full mx-auto mb-4" />
              <h3 className="font-bold text-[var(--text-primary)] text-center mb-1">{channel.title}</h3>
              <p className="text-2xl font-bold text-[var(--text-primary)] text-center">{formatNumber(channel.subscriber_count)}</p>
              <p className="text-[var(--text-dim)] text-sm text-center">subscribers</p>
              <div className="mt-4 text-center">
                <ViralBadge label={channel.viral_label} />
              </div>
            </div>
          ))}
        </div>
        )}

        {/* All Rankings - Only show if channels exist */}
        {country.channels && country.channels.length > 0 && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <h2 className="font-bold text-[var(--text-primary)]">All Rankings</h2>
          </div>
          <div className="divide-y divide-[var(--divide)]">
            {country.channels?.map((channel, idx) => (
              <div
                key={channel.channel_id}
                className="px-4 py-4 hover:bg-[var(--bg-hover)] cursor-pointer flex items-center gap-4"
                onClick={() => navigate(`/channel/${channel.channel_id}`)}
                data-testid={`country-rank-${idx}`}
              >
                <div className="w-8 font-bold text-[var(--text-dim)]">#{idx + 1}</div>
                <img src={channel.thumbnail_url || "https://via.placeholder.com/40"} alt="" loading="lazy" className="w-10 h-10 rounded-full" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[var(--text-primary)] truncate">{channel.title}</div>
                  <div className="text-sm text-[var(--text-dim)]">{formatNumber(channel.view_count)} views</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[var(--text-primary)]">{formatNumber(channel.subscriber_count)}</div>
                  <div className="text-green-400 text-sm">+{formatNumber(channel.daily_subscriber_gain || 0)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Internal Links - SEO Optimized */}
        <nav className="mt-8 space-y-6" aria-label="Related content">
          {/* Neighboring Countries - Same Region */}
          {neighbors.length > 0 && (
            <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6" data-testid="neighboring-countries">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                Top YouTube Channels in {country.region}
              </h2>
              <p className="text-[var(--text-muted)] text-sm mb-4">
                Explore YouTube statistics from other countries in {country.region}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {neighbors.map((neighbor) => (
                  <Link
                    key={neighbor.code}
                    to={`/country/${neighbor.code}`}
                    className="group bg-[var(--bg-page)] border border-[var(--border)] rounded-lg p-4 hover:border-red-600/50 transition-colors"
                    title={`View top YouTube channels in ${neighbor.name}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{neighbor.flag_emoji}</span>
                      <span className="font-medium text-[var(--text-primary)] group-hover:text-red-400 transition-colors">{neighbor.name}</span>
                    </div>
                    {neighbor.top_channel && (
                      <div className="text-xs text-[var(--text-dim)]">
                        Top: {neighbor.top_channel.title?.slice(0, 20)}{neighbor.top_channel.title?.length > 20 ? '...' : ''} ({formatNumber(neighbor.top_channel.subscriber_count)})
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Popular Channels from This Country */}
          {country.channels?.length > 3 && (
            <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6" data-testid="more-channels">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                More YouTubers from {country.name}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {country.channels.slice(3, 9).map((channel) => (
                  <Link
                    key={channel.channel_id}
                    to={`/channel/${channel.channel_id}`}
                    className="group text-center p-3 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                    title={`${channel.title} YouTube channel statistics`}
                  >
                    <img 
                      src={channel.thumbnail_url || "https://via.placeholder.com/48"} 
                      alt={`${channel.title} profile`}
                      className="w-12 h-12 rounded-full mx-auto mb-2"
                      loading="lazy"
                    />
                    <div className="text-sm text-[var(--text-primary)] group-hover:text-red-400 truncate">{channel.title}</div>
                    <div className="text-xs text-[var(--text-dim)]">{formatNumber(channel.subscriber_count)}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Editorial Content Section for AdSense Compliance */}
          {country.channels && country.channels.length > 0 && (
            <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6" data-testid="country-editorial">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">YouTube in {country.name}: Market Overview</h2>
              <div className="space-y-4 text-[var(--text-secondary)] text-sm leading-relaxed">
                <p>
                  {country.name} {country.flag_emoji} represents a {country.channels.length > 50 ? 'significant' : 
                  country.channels.length > 20 ? 'growing' : 'developing'} YouTube market with 
                  <strong className="text-[var(--text-primary)]"> {country.channels.length}</strong> notable channels tracked in our database.
                  The leading creator, <strong className="text-[var(--text-primary)]">{country.channels[0]?.title}</strong>, has accumulated 
                  <strong className="text-[var(--text-primary)]"> {formatNumber(country.channels[0]?.subscriber_count)}</strong> subscribers, 
                  showcasing the country's digital content ecosystem.
                </p>
                
                <p>
                  The YouTube landscape in {country.name} reflects both global trends and local content preferences. 
                  {country.channels.length > 10 ? ` With ${country.channels.length} channels being tracked, there's a diverse 
                  range of content categories represented, from entertainment and music to education and gaming.` : 
                  ` As the market continues to develop, we expect to see more creators emerge from this region.`}
                </p>

                <h3 className="text-lg font-semibold text-[var(--text-primary)] mt-4">Key Statistics</h3>
                <ul className="list-disc list-inside space-y-1 text-[var(--text-muted)]">
                  <li>Total channels tracked: <span className="text-[var(--text-primary)]">{country.channels.length}</span></li>
                  <li>Combined subscribers: <span className="text-[var(--text-primary)]">{formatNumber(country.channels.reduce((sum, ch) => sum + (ch.subscriber_count || 0), 0))}</span></li>
                  <li>Average subscribers per channel: <span className="text-[var(--text-primary)]">{formatNumber(Math.round(country.channels.reduce((sum, ch) => sum + (ch.subscriber_count || 0), 0) / country.channels.length))}</span></li>
                  <li>Top channel growth: <span className="text-green-400">+{formatNumber(country.channels[0]?.daily_subscriber_gain || 0)}</span> daily subscribers</li>
                </ul>

                <p className="text-xs text-[var(--text-dim)] mt-4 border-t border-[var(--border)] pt-4">
                  <em>Data sourced from YouTube Data API. Growth statistics and rankings are calculated by TopTube World Pro 
                  and may vary from other sources. Last updated based on our automated refresh schedule.</em>
                </p>
              </div>
            </section>
          )}

          {/* FAQ Section */}
          {countryFaqs.length > 0 && (
            <FAQSection faqs={countryFaqs} title={`FAQs: YouTube in ${country.name}`} />
          )}

          {/* Site Navigation Links */}
          <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6" data-testid="site-navigation">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Discover More</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-2">Popular Countries</h3>
                <div className="space-y-1">
                  <Link to="/country/US" className="block text-sm text-[var(--text-secondary)] hover:text-red-400">🇺🇸 United States Channels</Link>
                  <Link to="/country/IN" className="block text-sm text-[var(--text-secondary)] hover:text-red-400">🇮🇳 India Channels</Link>
                  <Link to="/country/BR" className="block text-sm text-[var(--text-secondary)] hover:text-red-400">🇧🇷 Brazil Channels</Link>
                  <Link to="/country/JP" className="block text-sm text-[var(--text-secondary)] hover:text-red-400">🇯🇵 Japan Channels</Link>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-2">Rankings</h3>
                <div className="space-y-1">
                  <Link to="/leaderboard" className="block text-sm text-[var(--text-secondary)] hover:text-red-400">Global Subscriber Leaderboard</Link>
                  <Link to="/trending" className="block text-sm text-[var(--text-secondary)] hover:text-red-400">Fastest Growing Channels</Link>
                  <Link to="/countries" className="block text-sm text-[var(--text-secondary)] hover:text-red-400">All 197 Countries</Link>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-2">Tools</h3>
                <div className="space-y-1">
                  <Link to="/compare" className="block text-sm text-[var(--text-secondary)] hover:text-red-400">Compare YouTube Channels</Link>
                  <Link to="/search" className="block text-sm text-[var(--text-secondary)] hover:text-red-400">Search Channels</Link>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-2">Resources</h3>
                <div className="space-y-1">
                  <Link to="/blog" className="block text-sm text-[var(--text-secondary)] hover:text-red-400">YouTube Insights Blog</Link>
                  <Link to="/about" className="block text-sm text-[var(--text-secondary)] hover:text-red-400">About TopTube World</Link>
                  <Link to="/contact" className="block text-sm text-[var(--text-secondary)] hover:text-red-400">Contact Us</Link>
                </div>
              </div>
            </div>
          </section>
        </nav>
      </div>
    </div>
  );
};



export { CountryPage };
