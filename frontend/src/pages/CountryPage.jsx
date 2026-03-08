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

          {/* Comprehensive Country YouTube Guide */}
          <section className="bg-[var(--bg-deep)] border border-[var(--border)] rounded-lg p-6" data-testid="country-guide">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Complete Guide: YouTube in {country.name}</h2>
            
            <article className="space-y-6 text-[var(--text-secondary)] text-sm leading-relaxed">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">The YouTube Landscape in {country.name}</h3>
                <p className="mb-4">
                  {country.name} represents a {country.channels?.length > 100 ? 'major' : country.channels?.length > 30 ? 'significant' : country.channels?.length > 10 ? 'growing' : 'developing'} market in the global YouTube ecosystem. With {country.channels?.length || 0} channels currently tracked in our database, the country's creator community reflects both local content preferences and global YouTube trends. Understanding this market provides valuable insights for creators, marketers, and researchers interested in regional content dynamics.
                </p>
                <p className="mb-4">
                  YouTube's presence in {country.name} is shaped by multiple factors including internet penetration rates, smartphone adoption, local content preferences, and advertising market conditions. {country.region === 'Asia' ? 'As one of Asia\'s digital markets, ' : country.region === 'Europe' ? 'As a European market, ' : country.region === 'Americas' ? 'In the Americas region, ' : 'In this region, '}{country.name} contributes to YouTube's global diversity of content and creators.
                </p>
                <p>
                  The channels tracked from {country.name} span various content categories, from entertainment and music to education and lifestyle. Each successful creator has found ways to connect with both local audiences and, in many cases, international viewers who discover their content through YouTube's global recommendation system.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Leading Creators from {country.name}</h3>
                <p className="mb-4">
                  {country.channels && country.channels.length > 0 ? 
                    `At the top of ${country.name}'s YouTube rankings, ${country.channels[0]?.title} leads with ${formatNumber(country.channels[0]?.subscriber_count)} subscribers. This achievement places them among the most successful creators from the country, demonstrating the potential reach of ${country.name}-based content on the global platform.` :
                    `As ${country.name}'s YouTube ecosystem develops, we continue monitoring for notable creators to add to our tracking database.`}
                </p>
                <p className="mb-4">
                  {country.channels && country.channels.length > 1 ? 
                    `The second-ranked channel, ${country.channels[1]?.title}, has accumulated ${formatNumber(country.channels[1]?.subscriber_count)} subscribers, while ${country.channels[2] ? `${country.channels[2]?.title} follows with ${formatNumber(country.channels[2]?.subscriber_count)} subscribers` : 'other creators continue building their audiences'}. This competitive landscape reflects the opportunities and challenges facing content creators in this market.` :
                    `As more creators from ${country.name} reach significant scale, our database will expand to include additional channels.`}
                </p>
                <p>
                  The growth patterns of top {country.name} creators reveal insights into what content resonates with local audiences. {country.channels && country.channels[0]?.daily_subscriber_gain > 10000 ? 
                    `The leading channel's daily growth of ${formatNumber(country.channels[0]?.daily_subscriber_gain || 0)} subscribers indicates strong ongoing momentum and successful content strategy.` :
                    `Understanding these patterns helps aspiring creators develop effective strategies for building audiences in this market.`}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Content Categories and Trends</h3>
                <p className="mb-4">
                  YouTube content preferences in {country.name} reflect both global trends and local cultural factors. While international content categories like gaming, music, and entertainment resonate worldwide, creators from {country.name} often find success by blending global formats with local relevance.
                </p>
                <p className="mb-4">
                  Language plays a significant role in shaping content strategy for {country.name}-based creators. Those creating content in local languages build strong connections with domestic audiences, while English-language content can access broader international viewership. Many successful creators navigate both approaches, sometimes creating content in multiple languages or using visual formats that transcend language barriers.
                </p>
                <p>
                  The evolution of YouTube features like Shorts, Live streaming, and Community posts creates new opportunities for creators in {country.name}. Early adoption of these features can provide competitive advantages, as the algorithm often promotes content that utilizes new platform capabilities.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Economic Factors and Monetization</h3>
                <p className="mb-4">
                  YouTube monetization in {country.name} depends on local advertising market conditions, viewer demographics, and content type. CPM (cost per thousand impressions) rates vary significantly by country, affecting how many subscribers and views a creator needs to generate meaningful revenue.
                </p>
                <p className="mb-4">
                  Creators from {country.name} can diversify revenue beyond advertising through brand partnerships, merchandise, channel memberships, and Super Chat donations. Those who build dedicated audiences often find these alternative revenue streams more lucrative than advertising alone, especially in markets with lower CPM rates.
                </p>
                <p>
                  The growth of {country.name}'s digital economy creates opportunities for YouTube creators to participate in the broader creator economy. Successful channels can leverage their audiences for business opportunities that extend beyond the YouTube platform itself.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Regional Context: {country.region}</h3>
                <p className="mb-4">
                  {country.name} sits within {country.region}'s broader YouTube ecosystem, where creators from neighboring countries may compete for similar audiences while also creating collaboration opportunities. Understanding regional dynamics helps contextualize {country.name}'s position in the global YouTube landscape.
                </p>
                <p className="mb-4">
                  {country.region === 'Asia' ? 
                    'Asian YouTube markets represent some of the fastest-growing and most competitive in the world. From the K-pop phenomenon in South Korea to India\'s massive music and entertainment industry, Asia drives significant platform growth. Creators in this region operate within a highly dynamic environment.' :
                    country.region === 'Europe' ? 
                    'European YouTube markets combine diverse languages and cultures within a relatively affluent advertising environment. Creators from European countries often benefit from strong CPM rates while navigating fragmented linguistic markets.' :
                    country.region === 'Americas' ? 
                    'The Americas region spans from the massive U.S. market to rapidly growing Latin American audiences. Spanish and Portuguese content reaches large, linguistically connected populations across multiple countries.' :
                    country.region === 'Africa' ? 
                    'African YouTube markets represent significant growth potential as internet access expands across the continent. Creators who establish presence in these emerging markets may benefit from first-mover advantages as audiences grow.' :
                    'This regional context shapes opportunities and challenges for creators from ' + country.name + '.'}
                </p>
                <p>
                  Cross-border collaboration between creators from {country.name} and neighboring countries can expand audience reach while creating content that resonates across regional boundaries. These collaborations often introduce viewers to new creators and content styles.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Opportunities for Aspiring Creators</h3>
                <p className="mb-4">
                  The YouTube landscape in {country.name} presents opportunities for new creators willing to invest in quality content and consistent publishing. While established channels have advantages in subscriber base and algorithmic momentum, the platform's recommendation system continues to surface new voices who create compelling content.
                </p>
                <p className="mb-4">
                  Aspiring creators from {country.name} should study the successful channels tracked on this page to understand what works in this market. Consider content categories with proven demand, optimal upload frequencies, and engagement strategies that build community. The data on this page provides benchmarks for what success looks like in this market.
                </p>
                <p>
                  YouTube Shorts offers particularly accessible entry points for new creators. The short-form format requires less production investment while reaching audiences through dedicated recommendation feeds. Many successful creators now use Shorts to grow their subscriber bases before transitioning to longer-form content.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Using This Data</h3>
                <p className="mb-4">
                  The rankings and statistics on this page serve multiple purposes. Creators can benchmark against successful channels in their market. Marketers can identify potential partners for campaigns targeting {country.name} audiences. Researchers can analyze market dynamics and creator economics in this regional context.
                </p>
                <p className="mb-4">
                  Each channel listed includes detailed statistics accessible through their individual profile pages, including subscriber counts, view totals, growth metrics, and viral score indicators. These profiles provide deeper insights than the summary rankings shown here.
                </p>
                <p>
                  Our Compare tool allows side-by-side analysis of multiple channels, useful for understanding competitive dynamics or evaluating partnership options. The data updates regularly as we track changes across the YouTube ecosystem.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">The Future of YouTube in {country.name}</h3>
                <p className="mb-4">
                  The YouTube landscape in {country.name} will continue evolving as the platform introduces new features, local creator communities mature, and internet access patterns change. Understanding potential future directions helps creators, marketers, and analysts position themselves strategically.
                </p>
                <p className="mb-4">
                  {country.region === 'Asia' || country.region === 'Africa' ?
                  `As internet penetration continues expanding in ${country.name} and ${country.region} more broadly, the addressable audience for YouTube content will grow. This expansion creates opportunities for both established creators and newcomers who can serve new viewer segments.` :
                  `YouTube's mature presence in ${country.name} means growth will likely come from increased engagement depth rather than new user acquisition. Creators who build strong community connections and diversify content offerings may outperform those relying solely on subscriber growth.`}
                </p>
                <p className="mb-4">
                  Platform feature evolution will shape local opportunities. YouTube Shorts, live shopping integrations, membership features, and other new capabilities create differentiation opportunities for creators who adopt them early. {country.name}'s creators who leverage these features strategically may gain competitive advantages.
                </p>
                <p>
                  Competitive pressures from other platforms including TikTok, Instagram, and local alternatives will influence YouTube strategy in {country.name}. Creators who build audiences across multiple platforms while maintaining strong YouTube presence may be best positioned for long-term success regardless of platform shifts.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Building a YouTube Career in {country.name}</h3>
                <p className="mb-4">
                  For aspiring creators in {country.name}, the channels on this page represent both inspiration and competitive benchmarks. Building a successful YouTube channel requires understanding local market dynamics while applying universal best practices.
                </p>
                <p className="mb-4">
                  <strong className="text-[var(--text-primary)]">Content Strategy:</strong> Study what works for successful {country.name} creators. What content categories are represented? What formats resonate with local audiences? How do top channels balance local relevance with broader appeal? These patterns can inform your own content decisions.
                </p>
                <p className="mb-4">
                  <strong className="text-[var(--text-primary)]">Consistency and Quality:</strong> The channels ranking highest in {country.name} didn't achieve success overnight. Consistent content publishing over extended periods, combined with continuous quality improvement, builds the foundation for YouTube success. Set realistic expectations for timeline to significant audience building.
                </p>
                <p className="mb-4">
                  <strong className="text-[var(--text-primary)]">Community Building:</strong> Beyond subscriber numbers, successful creators build engaged communities. Comments, social media interaction, and community features help transform passive viewers into active fans who promote content organically.
                </p>
                <p>
                  <strong className="text-[var(--text-primary)]">Monetization Planning:</strong> While advertising revenue varies by market, creators in {country.name} can build sustainable careers through diversified income streams. Plan for brand partnerships, merchandise, memberships, and other revenue sources alongside advertising.
                </p>
              </div>

              <div className="pt-4 border-t border-[var(--border)]">
                <p className="text-xs text-[var(--text-dim)]">
                  <em>All data is sourced from the YouTube Data API and our proprietary tracking systems. Subscriber counts and view totals are provided by YouTube; growth metrics and viral scores are independently calculated by TopTube World Pro. Country assignments reflect each channel's primary geographic association based on available data. This page is updated regularly as our automated systems capture new data.</em>
                </p>
              </div>
            </article>
          </section>

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
