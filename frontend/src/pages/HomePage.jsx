import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { Bar } from 'recharts';
import { ChevronRight, Crown, Globe, TrendingUp, Users, Zap } from 'lucide-react';
import { API } from '../utils/constants';
import { formatNumber } from '../utils/format';
import { ChannelCard, HorizontalAd, LoadingFallback, NewsletterSignup } from '../components/common';
import { HomeSEO } from '../components/seo';
const LazyWorldMap = lazy(() => import('../components/LazyWorldMap'));

const HomePage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState([]);
  const [globalTop, setGlobalTop] = useState([]);
  const [fastestGrowing, setFastestGrowing] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mapRes, globalRes, growingRes, statsRes] = await Promise.all([
          axios.get(`${API}/stats/map-data`),
          axios.get(`${API}/leaderboard/global?limit=5`),
          axios.get(`${API}/leaderboard/fastest-growing?limit=5`),
          axios.get(`${API}/admin/stats`)
        ]);
        setMapData(mapRes.data.map_data || []);
        setGlobalTop(globalRes.data.channels || []);
        setFastestGrowing(growingRes.data.channels || []);
        setStats(statsRes.data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div data-testid="home-page">
      <HomeSEO />
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#111] to-[#0a0a0a] py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('home.title')}
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            {t('home.subtitle', { count: stats?.total_countries || 0 })}
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/leaderboard" className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors" data-testid="cta-leaderboard">
              {t('home.viewLeaderboard')}
            </Link>
            <Link to="/countries" className="bg-[#222] px-6 py-3 rounded-lg font-semibold hover:bg-[#333] transition-colors" style={{color: 'white'}} data-testid="cta-countries">
              {t('home.browseCountries')}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-[#0d0d0d] border-y border-[#1a1a1a] py-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-white">{stats?.total_countries || 0}</div>
              <div className="text-gray-500 text-sm">{t('home.countriesTracked')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">{stats?.total_channels || 0}</div>
              <div className="text-gray-500 text-sm">{t('home.channelsTracked')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">{formatNumber(stats?.total_stats_records || 0)}</div>
              <div className="text-gray-500 text-sm">{t('home.dataPoints')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400">{t('common.live')}</div>
              <div className="text-gray-500 text-sm">{t('home.realTimeUpdates')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* World Map Section */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-white mb-2">{t('home.topChannelsByCountry')}</h2>
          <p className="text-gray-500 mb-6">{t('home.clickCountry')}</p>
          <Suspense fallback={<LoadingFallback />}>
            <LazyWorldMap mapData={mapData} onCountryClick={(code) => navigate(`/country/${code}`)} />
          </Suspense>
        </div>
      </section>

      {/* Top Channels Section */}
      <section className="py-12 bg-[#0d0d0d]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Top 5 Worldwide</h2>
              <p className="text-gray-500">Most subscribed YouTube channels globally</p>
            </div>
            <Link to="/leaderboard" className="text-red-500 hover:text-red-400 flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {globalTop.map((channel, idx) => (
              <ChannelCard 
                key={channel.channel_id}
                channel={channel}
                rank={idx + 1}
                onClick={() => navigate(`/channel/${channel.channel_id}`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Second Most Subscribed - SEO Section */}
      {globalTop.length >= 2 && (
        <section className="py-12" data-testid="second-most-subscribed-section">
          <div className="max-w-6xl mx-auto px-4">
            <div className="bg-gradient-to-r from-orange-600/10 to-red-600/10 border border-orange-500/20 rounded-xl p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <img 
                      src={globalTop[1].thumbnail_url} 
                      alt={globalTop[1].title}
                      className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-orange-500/50"
                    />
                    <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-sm font-bold px-2 py-1 rounded-full">
                      #2
                    </div>
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                    Who is the Second Most Subscribed YouTuber in {new Date().getFullYear()}?
                  </h2>
                  <h3 className="text-2xl md:text-3xl font-bold text-orange-400 mb-2">
                    {globalTop[1].title}
                  </h3>
                  <p className="text-gray-400 mb-4">
                    With <span className="text-white font-semibold">{formatNumber(globalTop[1].subscriber_count)}</span> subscribers, 
                    {globalTop[1].title} from <span className="text-white">{globalTop[1].country_name}</span> holds 
                    the #2 spot globally, just behind {globalTop[0].title} ({formatNumber(globalTop[0].subscriber_count)} subs).
                  </p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    <Link 
                      to={`/channel/${globalTop[1].channel_id}`}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      data-testid="view-second-channel"
                    >
                      View {globalTop[1].title} Stats
                    </Link>
                    <Link 
                      to="/top-100"
                      className="bg-[#222] hover:bg-[#333] px-4 py-2 rounded-lg font-medium transition-colors"
                      style={{color: 'white'}}
                    >
                      See Full Top 100
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trending Section */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-500" /> Fastest Growing
              </h2>
              <p className="text-gray-500">Channels with highest daily growth rate</p>
            </div>
            <Link to="/trending" className="text-red-500 hover:text-red-400 flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fastestGrowing.map((channel, idx) => (
              <div 
                key={channel.channel_id}
                className="bg-[#111] border border-[#222] rounded-lg p-4 hover:border-[#333] cursor-pointer"
                onClick={() => navigate(`/channel/${channel.channel_id}`)}
                data-testid={`trending-card-${idx}`}
              >
                <div className="flex items-center gap-3">
                  <img src={channel.thumbnail_url || "https://via.placeholder.com/48"} alt="" loading="lazy" className="w-12 h-12 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white truncate">{channel.title}</h4>
                    <p className="text-gray-500 text-sm">{channel.country_name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold">+{channel.daily_growth_percent?.toFixed(2) || 0}%</div>
                    <div className="text-gray-500 text-xs">daily</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Editorial Content Section - Required for AdSense */}
      <section className="py-12 bg-[#0d0d0d]">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-white mb-6">Understanding YouTube Channel Rankings</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 mb-4">
              The YouTube landscape is constantly evolving, with creators from around the world competing for subscribers and views. 
              TopTube World Pro provides comprehensive analytics and real-time tracking of the most subscribed YouTube channels across 
              197 countries, helping content creators, marketers, and enthusiasts understand the dynamics of the platform.
            </p>
            <p className="text-gray-300 mb-4">
              Our platform tracks key metrics including subscriber counts, view statistics, and growth rates. We calculate daily, 
              weekly, and monthly growth percentages to identify trending channels and predict future milestones. This data helps 
              content creators benchmark their performance against competitors and identify successful content strategies.
            </p>
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">How We Track YouTube Channels</h3>
            <p className="text-gray-300 mb-4">
              We use the official YouTube Data API v3 to fetch publicly available channel statistics. Our systems refresh data 
              multiple times daily and store historical snapshots to calculate growth trends. This approach ensures accuracy while 
              providing valuable insights that aren't available on YouTube itself.
            </p>
            <p className="text-gray-300 mb-4">
              <strong className="text-yellow-400">Important Note:</strong> Growth statistics, viral scores, and predictions are 
              calculated by TopTube World Pro based on historical data analysis. These are estimates and should not be confused 
              with official YouTube metrics. For more details, visit our <Link to="/methodology" className="text-red-400 hover:text-red-300">Data Sources & Methodology</Link> page.
            </p>
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Why Channel Rankings Matter</h3>
            <p className="text-gray-300 mb-4">
              Understanding channel rankings provides valuable insights for multiple purposes: content creators can identify 
              trends and successful niches, marketers can find influencers for campaigns, researchers can study digital media 
              patterns, and fans can follow their favorite creators' growth journeys.
            </p>
            
            {/* SEO Internal Links */}
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Explore YouTube Rankings</h3>
            <div className="grid md:grid-cols-2 gap-3 mt-4">
              <Link to="/leaderboard" className="flex items-center gap-3 p-3 bg-[#111] border border-[#222] rounded-lg hover:border-red-500/50 transition-colors">
                <Crown className="w-6 h-6 text-yellow-500" />
                <span className="text-gray-300 hover:text-white">Most Subscribed YouTube Channels Leaderboard</span>
              </Link>
              <Link to="/top-youtube-channels" className="flex items-center gap-3 p-3 bg-[#111] border border-[#222] rounded-lg hover:border-red-500/50 transition-colors">
                <TrendingUp className="w-6 h-6 text-green-500" />
                <span className="text-gray-300 hover:text-white">Top YouTube Channels {new Date().getFullYear()}</span>
              </Link>
              <Link to="/most-subscribed-youtube-channels" className="flex items-center gap-3 p-3 bg-[#111] border border-[#222] rounded-lg hover:border-red-500/50 transition-colors">
                <Users className="w-6 h-6 text-blue-500" />
                <span className="text-gray-300 hover:text-white">Most Subscribed YouTube Channels</span>
              </Link>
              <Link to="/top-youtube-channels-by-country" className="flex items-center gap-3 p-3 bg-[#111] border border-[#222] rounded-lg hover:border-red-500/50 transition-colors">
                <Globe className="w-6 h-6 text-purple-500" />
                <span className="text-gray-300 hover:text-white">Top YouTube Channels by Country</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-12 bg-[#0a0a0a]">
        <div className="max-w-2xl mx-auto px-4">
          <NewsletterSignup />
        </div>
      </section>
      
      {/* Ad Banner */}
      <section className="max-w-6xl mx-auto px-4">
        <HorizontalAd />
      </section>
    </div>
  );
};

// Global Leaderboard Page



export { HomePage };
