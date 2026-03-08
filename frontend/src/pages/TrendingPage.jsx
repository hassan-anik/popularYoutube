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

        {/* Comprehensive Trending Guide */}
        <div className="mt-8 bg-[var(--bg-deep)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">The Complete Guide to YouTube Growth and Trending Channels</h2>
          
          <article className="space-y-6 text-[var(--text-secondary)] text-sm leading-relaxed">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Understanding YouTube Growth Dynamics</h3>
              <p className="mb-4">
                YouTube channel growth is one of the most fascinating phenomena in digital media. Every day, millions of viewers make decisions about which creators deserve their subscription, collectively shaping the platform's landscape. Understanding what drives this growth—and which channels are experiencing it—provides valuable insights for creators, marketers, and anyone interested in the dynamics of online content.
              </p>
              <p className="mb-4">
                This trending page tracks two distinct dimensions of growth: percentage growth rate and absolute subscriber gains. These metrics tell different stories and are valuable for different purposes. A channel experiencing 10% daily growth is showing remarkable momentum regardless of its size, while a channel gaining 500,000 subscribers daily demonstrates massive reach even if that represents a smaller percentage of its total base.
              </p>
              <p>
                The channels you see on this page represent the cutting edge of YouTube growth. Some are established giants maintaining their momentum through consistent quality. Others are emerging creators whose content has caught fire with audiences. Understanding both categories helps paint a complete picture of what success looks like on the world's largest video platform.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">What Makes a Channel Go Viral?</h3>
              <p className="mb-4">
                Viral growth on YouTube results from a complex interaction of factors, some within creator control and others dependent on external circumstances. Understanding these factors helps contextualize the growth patterns you observe and may inform strategies for those seeking to build their own audiences.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Content Quality and Innovation:</strong> The foundation of viral growth is compelling content. Channels that introduce new formats, tackle trending topics with fresh perspectives, or deliver exceptional production value tend to attract algorithmic promotion. The YouTube algorithm prioritizes content that keeps viewers watching and engaged, so quality remains the most reliable path to growth.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Algorithmic Discovery:</strong> YouTube's recommendation system can amplify content to millions of viewers who never actively searched for it. When a video performs well with initial viewers—high watch time, strong click-through rate, positive engagement signals—the algorithm progressively shows it to larger audiences. This snowball effect can transform a single video into a channel-defining moment.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">External Events and Trends:</strong> Channels that create content around trending topics, news events, or cultural moments can experience sudden growth spurts. A gaming channel covering a new release, a commentary channel discussing viral controversies, or a music channel featuring trending songs can all ride waves of search interest to rapid subscriber growth.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Collaborations and Cross-Promotion:</strong> When popular creators collaborate, they expose their audiences to each other's content. A collaboration between channels with complementary but distinct audiences can produce significant growth for both parties. This network effect partially explains why established creator communities tend to grow together.
              </p>
              <p>
                <strong className="text-[var(--text-primary)]">Platform Features:</strong> YouTube Shorts has become a significant growth driver for many channels. The short-form format reaches different audiences and appears in dedicated feeds, allowing creators to attract subscribers who might never discover their long-form content through traditional recommendations.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Interpreting Growth Metrics</h3>
              <p className="mb-4">
                The two metrics displayed on this page—percentage growth and absolute gains—serve different analytical purposes. Understanding their implications helps you extract meaningful insights from the data.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Percentage Growth Rate:</strong> This metric measures growth relative to current channel size. A 5% daily growth rate means the channel added 5% of its existing subscriber base in 24 hours. This metric is particularly valuable for identifying emerging channels with viral momentum. A channel growing from 100,000 to 150,000 subscribers shows a 50% growth rate—exceptional performance that suggests something special is happening with their content.
              </p>
              <p className="mb-4">
                However, percentage growth naturally decreases as channels get larger. It's much easier to double from 10,000 to 20,000 subscribers than from 10 million to 20 million. This mathematical reality means the "Fastest Growing" list often features smaller channels experiencing breakthrough moments, while mega-channels rarely appear despite adding more subscribers in absolute terms.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Absolute Subscriber Gains:</strong> This metric shows raw numbers—how many actual subscribers joined the channel in 24 hours. Large channels dominate this ranking because their content reaches massive audiences. A channel with 100 million subscribers might add 100,000 new subscribers daily, representing just 0.1% growth but still an enormous number of people.
              </p>
              <p>
                Both metrics have value depending on your purpose. Content creators seeking to identify successful strategies might focus on percentage growth to spot emerging patterns. Marketers evaluating influencer reach might prioritize absolute gains to understand real audience growth. Researchers studying platform dynamics benefit from examining both metrics to understand the full picture.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Categories That Drive Trending Growth</h3>
              <p className="mb-4">
                Certain content categories consistently produce channels with exceptional growth rates. Understanding these categories provides context for the channels you see trending.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Music and Entertainment:</strong> Music channels often dominate absolute gains due to the universal appeal of new releases. When a popular artist drops a new music video, their channel can gain millions of subscribers as fans flock to access the content first. Entertainment channels benefit from similar dynamics around viral moments and trending content.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Gaming:</strong> Game releases, updates, and esports events create predictable growth opportunities for gaming channels. Creators who are early to cover new games or who provide exceptional guides for popular titles often see rapid subscriber growth. The gaming category benefits from highly engaged audiences who watch significant amounts of content.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Children's Content:</strong> Channels creating content for children often show remarkable growth stability. Parents trust familiar channels and allow extended viewing sessions, creating strong retention metrics that the algorithm rewards with continued promotion. Channels like Cocomelon demonstrate how this category can achieve massive scale.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Educational and How-To:</strong> Educational channels can experience growth spikes around relevant events—financial channels during market turbulence, science channels during major discoveries, technology channels around product launches. The evergreen value of educational content also produces steady long-term growth.
              </p>
              <p>
                <strong className="text-[var(--text-primary)]">Shorts-First Creators:</strong> A newer category worth watching includes creators who primarily produce YouTube Shorts. These creators can achieve remarkable growth rates as the format reaches audiences differently than traditional long-form content. Some Shorts creators have grown from zero to millions of subscribers within months.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Regional Growth Patterns</h3>
              <p className="mb-4">
                YouTube growth varies significantly by region, reflecting different stages of platform adoption, internet penetration, and content market maturity. The trending channels you see often reflect these regional dynamics.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">South and Southeast Asia:</strong> India, Indonesia, Philippines, and neighboring countries consistently produce high-growth channels. These markets combine large populations with rapidly expanding internet access, creating enormous audiences hungry for content. Channels serving these markets often appear prominently in growth rankings.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Latin America:</strong> Spanish and Portuguese-speaking channels benefit from linguistically connected populations across multiple countries. A successful Brazilian or Mexican creator can reach audiences throughout the region, creating scale advantages that enable rapid growth.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Global English:</strong> English-language channels access the largest addressable audience, including viewers in non-English speaking countries who consume English content. This creates a ceiling effect where the biggest English channels can maintain large absolute gains indefinitely.
              </p>
              <p>
                <strong className="text-[var(--text-primary)]">Emerging Markets:</strong> As internet access expands in Africa, Central Asia, and other developing regions, new growth opportunities emerge. Creators who establish presence early in these markets may benefit from first-mover advantages as audiences grow.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">What Trending Data Reveals About YouTube</h3>
              <p className="mb-4">
                The trending data on this page offers insights into broader platform dynamics. Patterns in which channels grow fastest reveal what content resonates with audiences, how the algorithm distributes attention, and where the platform is evolving.
              </p>
              <p className="mb-4">
                Consistently high growth among music and entertainment channels confirms YouTube's dominance as an entertainment platform rather than a utility. The presence of children's content channels demonstrates the platform's importance in family life. Gaming channel growth reflects YouTube's status as the primary platform for gaming content consumption.
              </p>
              <p className="mb-4">
                The appearance of Shorts-first creators in trending lists signals the platform's strategic investment in short-form content. Regional patterns in growth reflect global internet adoption trends and the democratization of content creation. The mix of established channels and newcomers demonstrates that YouTube remains a platform where new voices can break through.
              </p>
              <p>
                For creators, trending data provides benchmarks for what "good" growth looks like in their category. For marketers, it highlights which channels are building momentum and might represent partnership opportunities. For platform observers, it offers real-time visibility into how one of the world's most important media platforms evolves.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Using Trending Data Strategically</h3>
              <p className="mb-4">
                Whether you're a content creator, marketer, or researcher, trending data can inform strategic decisions. Here's how different users can extract value from this information.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">For Content Creators:</strong> Study which channels in your category appear in trending lists. What topics are they covering? What formats are they using? How frequently do they upload? This competitive intelligence can inform your own content strategy without requiring direct imitation.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">For Marketers:</strong> Identify rising channels before they become expensive to partner with. Channels experiencing rapid growth today may be tomorrow's major influencers. Early partnerships can establish relationships and secure favorable rates before these creators reach premium pricing.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">For Investors and Analysts:</strong> Trending data provides insights into which content categories and markets are experiencing growth. This information can inform investment decisions in creator-focused businesses, advertising strategies, and platform competitive analysis.
              </p>
              <p>
                <strong className="text-[var(--text-primary)]">For Researchers:</strong> Academic study of platform dynamics, creator economics, and digital culture benefits from quantitative data about growth patterns. Trending metrics provide one lens into how attention is distributed on the world's largest video platform.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">The Psychology of Subscriber Growth</h3>
              <p className="mb-4">
                Understanding why viewers click the subscribe button reveals deeper patterns in YouTube growth. The decision to subscribe represents a psychological commitment—viewers are saying they want more content from this creator in the future. This commitment is influenced by multiple factors that successful channels understand and optimize for.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Content Value Proposition:</strong> Viewers subscribe when they believe future content will provide value—entertainment, information, emotional connection, or utility. Channels that clearly communicate their value proposition and consistently deliver on it build subscriber loyalty. The trending channels on this page have mastered this value exchange.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Social Proof and Momentum:</strong> Subscriber counts themselves influence subscription decisions. Viewers are more likely to subscribe to channels that already have large audiences, interpreting the existing subscriber count as evidence of quality. This creates a virtuous cycle where growth begets more growth.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">FOMO and Exclusivity:</strong> Some channels grow by creating fear of missing out. Limited-time content, exclusive updates, or community-only features incentivize subscriptions. Viewers subscribe not just for content but for membership in a community.
              </p>
              <p>
                <strong className="text-[var(--text-primary)]">Algorithmic Timing:</strong> The moment when viewers decide to subscribe often comes during or immediately after watching compelling content. Channels that optimize their calls-to-action timing—asking for subscriptions at peak emotional moments—tend to convert viewers more effectively.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Sustainable Growth vs. Viral Spikes</h3>
              <p className="mb-4">
                Not all growth is created equal. The trending data on this page captures both sustainable growth patterns and viral spikes. Understanding the difference helps contextualize what you're seeing and predict future trajectories.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Sustainable Growth:</strong> Some channels maintain consistent growth rates over extended periods. These channels have typically found product-market fit—they know their audience, deliver reliable content, and benefit from stable algorithmic promotion. Sustainable growth is often less dramatic but more valuable for long-term channel building.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Viral Spikes:</strong> Other channels experience dramatic growth spikes when individual videos go viral. These spikes can add millions of subscribers in days, but the trajectory afterward varies widely. Some channels successfully retain viral audiences and build upon the momentum. Others see subscriber growth quickly return to baseline levels.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">The Retention Challenge:</strong> Viral growth brings new subscribers who may have different expectations than the channel's core audience. Channels that adapt to serve both new and existing audiences can maintain growth momentum. Those that continue creating content only for their original audience may see viral subscribers drift away.
              </p>
              <p>
                When viewing this trending page, consider whether the growth you're seeing appears sustainable or spike-driven. Channels with consistent day-over-day growth often represent more stable opportunities than those experiencing one-time viral moments.
              </p>
            </div>

            <div className="pt-4 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--text-dim)]">
                <em>All growth metrics displayed on this page are calculated by TopTube World Pro based on our continuous monitoring of YouTube channels. We compare current subscriber counts with historical snapshots to estimate daily changes. These calculations are independent estimates and may differ from data shown in YouTube's native analytics. Growth trends can change rapidly, and past performance does not guarantee future results.</em>
              </p>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};



export { TrendingPage };
