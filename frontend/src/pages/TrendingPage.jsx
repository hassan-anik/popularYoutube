import React, { lazy, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Flame, Zap } from 'lucide-react';
import { API } from '../utils/constants';
import { formatNumber } from '../utils/format';
import { TrendingSEO } from '../components/seo';

const TrendingPage = () => {
  const navigate = useNavigate();
  const [fastestGrowing, setFastestGrowing] = useState([]);
  const [biggestGainers, setBiggestGainers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [growingRes, gainersRes] = await Promise.all([
          axios.get(`${API}/leaderboard/fastest-growing?limit=20`),
          axios.get(`${API}/leaderboard/biggest-gainers?limit=20`)
        ]);
        setFastestGrowing(growingRes.data.channels || []);
        setBiggestGainers(gainersRes.data.channels || []);
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
    <div className="py-8" data-testid="trending-page">
      <TrendingSEO />
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Trending</h1>
          <p className="text-[var(--text-dim)]">Channels with the fastest growth and biggest gains</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Fastest Growing */}
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" /> Fastest Growing (by %)
            </h2>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg divide-y divide-[var(--divide)]">
              {fastestGrowing.map((channel, idx) => (
                <div
                  key={channel.channel_id}
                  className="p-4 hover:bg-[var(--bg-hover)] cursor-pointer flex items-center gap-4"
                  onClick={() => navigate(`/channel/${channel.channel_id}`)}
                  data-testid={`fastest-${idx}`}
                >
                  <div className="w-6 font-bold text-[var(--text-dim)]">{idx + 1}</div>
                  <img src={channel.thumbnail_url || "https://via.placeholder.com/40"} alt="" loading="lazy" className="w-10 h-10 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[var(--text-primary)] truncate">{channel.title || channel.name}</div>
                    <div className="text-xs text-[var(--text-dim)]">{channel.country_name}</div>
                  </div>
                  <div className="text-green-400 font-bold">+{channel.daily_growth_percent?.toFixed(2) || 0}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Biggest Gainers */}
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500" /> Biggest 24h Gains
            </h2>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg divide-y divide-[var(--divide)]">
              {biggestGainers.map((channel, idx) => (
                <div
                  key={channel.channel_id}
                  className="p-4 hover:bg-[var(--bg-hover)] cursor-pointer flex items-center gap-4"
                  onClick={() => navigate(`/channel/${channel.channel_id}`)}
                  data-testid={`gainer-${idx}`}
                >
                  <div className="w-6 font-bold text-[var(--text-dim)]">{idx + 1}</div>
                  <img src={channel.thumbnail_url || "https://via.placeholder.com/40"} alt="" loading="lazy" className="w-10 h-10 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[var(--text-primary)] truncate">{channel.title || channel.name}</div>
                    <div className="text-xs text-[var(--text-dim)]">{channel.country_name}</div>
                  </div>
                  <div className="text-green-400 font-bold">+{formatNumber(channel.daily_subscriber_gain || 0)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Editorial Content Section for AdSense Compliance */}
        <div className="mt-8 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Understanding YouTube Growth Trends</h2>
          <div className="space-y-4 text-[var(--text-secondary)] text-sm leading-relaxed">
            <p>
              YouTube growth is influenced by numerous factors including content quality, upload consistency, algorithm changes, 
              and viral moments. This trending page showcases channels experiencing significant momentum, whether through percentage 
              growth rates or absolute subscriber gains.
            </p>
            
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mt-4">Fastest Growing vs. Biggest Gains</h3>
            <p>
              <strong className="text-[var(--text-primary)]">Fastest Growing (by percentage)</strong> highlights channels with the highest 
              daily growth rate relative to their current size. A smaller channel gaining 10,000 subscribers from 100,000 shows 
              a 10% growth rate, while a mega-channel gaining 100,000 from 100 million shows only 0.1%. This metric helps 
              identify emerging creators with viral momentum.
            </p>
            <p>
              <strong className="text-[var(--text-primary)]">Biggest 24h Gains (absolute numbers)</strong> shows channels gaining the most 
              subscribers in raw numbers. This metric typically favors established creators who maintain consistent audience 
              growth through their massive reach and content output.
            </p>
            
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mt-4">What Drives YouTube Growth?</h3>
            <p>
              Several factors contribute to rapid channel growth: viral videos that appear in recommendations, collaborations 
              with other popular creators, trending topics or news events, algorithm-friendly content formats, and consistent 
              audience engagement. Understanding these patterns helps creators optimize their content strategy.
            </p>
            
            <p className="text-xs text-[var(--text-dim)] mt-4 border-t border-[var(--border)] pt-4">
              <em><strong>Disclaimer:</strong> All growth metrics shown are estimated by TopTube World Pro based on our 
              historical tracking data. These calculations compare current subscriber counts with stored historical values 
              and may differ from actual YouTube analytics. Growth trends can change rapidly.</em>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};



export { TrendingPage };
