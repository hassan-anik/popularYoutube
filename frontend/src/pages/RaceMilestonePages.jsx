import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bar } from 'recharts';
import { BarChart3, BookOpen, Clock, Flame, Star, Trophy } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { API, SITE_URL } from '../utils/constants';
import { formatNumber } from '../utils/format';
import { Header, LiveIndicator } from '../components/common';

const RacePage = () => {
  const navigate = useNavigate();
  const [races, setRaces] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Define milestone targets
  const milestones = [500000000, 400000000, 300000000, 250000000, 200000000, 150000000, 100000000];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API}/leaderboard/global?limit=100`);
        const channelData = response.data.channels || [];
        setChannels(channelData);
        
        // Generate races based on channels close to milestones
        const generatedRaces = [];
        
        milestones.forEach(milestone => {
          // Find channels approaching this milestone (within 80% of milestone)
          const approaching = channelData.filter(c => 
            c.subscriber_count < milestone && 
            c.subscriber_count >= milestone * 0.7
          ).slice(0, 3);
          
          if (approaching.length >= 2) {
            generatedRaces.push({
              milestone,
              title: `Race to ${formatNumber(milestone)} Subscribers`,
              channels: approaching.map(c => ({
                ...c,
                remaining: milestone - c.subscriber_count,
                daysToReach: c.daily_subscriber_gain > 0 
                  ? Math.ceil((milestone - c.subscriber_count) / c.daily_subscriber_gain)
                  : null,
                progress: (c.subscriber_count / milestone) * 100
              }))
            });
          }
        });
        
        setRaces(generatedRaces);
      } catch (error) {
        console.error("Error fetching race data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const currentYear = new Date().getFullYear();

  useSEO({
    title: `Race to Milestone ${currentYear} - Who Will Hit 500M First? | Live YouTube Subscriber Race`,
    description: `Watch the live race to subscriber milestones! Track which YouTube channels will hit 500M, 300M, 200M subscribers first. Real-time progress tracking with estimated arrival dates.`,
    keywords: `youtube subscriber race ${currentYear}, race to 500 million subscribers, mrbeast vs t-series, who will hit 500m first, youtube milestone tracker, subscriber countdown`,
    canonical: `${SITE_URL}/race`
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Featured race - channels closest to 500M
  const featuredRace = races.find(r => r.milestone === 500000000) || races[0];

  return (
    <div className="py-8" data-testid="race-page">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-10 h-10 text-yellow-500" />
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">Race to Milestone</h1>
          </div>
          <p className="text-[var(--text-muted)] text-lg">Live tracking of YouTube channels racing to subscriber milestones</p>
          <LiveIndicator />
        </div>

        {/* Featured Race */}
        {featuredRace && (
          <div className="bg-gradient-to-r from-yellow-500/10 to-red-500/10 border border-yellow-500/30 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">{featuredRace.title}</h2>
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">LIVE</span>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              {featuredRace.channels.map((channel, idx) => (
                <div 
                  key={channel.channel_id}
                  className={`bg-[var(--bg-card)] border ${idx === 0 ? 'border-yellow-500/50' : 'border-[var(--border-hover)]'} rounded-lg p-4 cursor-pointer hover:border-yellow-500/30 transition-colors`}
                  onClick={() => navigate(`/channel/${channel.channel_id}`)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-2xl font-bold ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-[var(--text-muted)]' : 'text-amber-700'}`}>
                      #{idx + 1}
                    </span>
                    <img src={channel.thumbnail_url} alt={channel.title} className="w-12 h-12 rounded-full" />
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)] text-sm">{channel.title}</h3>
                      <p className="text-[var(--text-dim)] text-xs">{channel.country_name}</p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
                      <span>{formatNumber(channel.subscriber_count)}</span>
                      <span>{formatNumber(featuredRace.milestone)}</span>
                    </div>
                    <div className="h-3 bg-[var(--border)] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-500' : 'bg-amber-700'}`}
                        style={{ width: `${channel.progress}%` }}
                      />
                    </div>
                    <div className="text-center text-xs text-[var(--text-dim)] mt-1">{channel.progress.toFixed(1)}%</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-[var(--bg-deep)] rounded p-2">
                      <div className="text-red-400 font-bold text-sm">{formatNumber(channel.remaining)}</div>
                      <div className="text-[var(--text-dim)] text-xs">Remaining</div>
                    </div>
                    <div className="bg-[var(--bg-deep)] rounded p-2">
                      <div className="text-green-400 font-bold text-sm">
                        {channel.daysToReach ? `~${channel.daysToReach} days` : 'N/A'}
                      </div>
                      <div className="text-[var(--text-dim)] text-xs">Est. Time *</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Active Races */}
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-red-500" />
          All Active Races
        </h2>
        
        <div className="space-y-6">
          {races.filter(r => r !== featuredRace).map(race => (
            <div key={race.milestone} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">{race.title}</h3>
              <div className="space-y-3">
                {race.channels.map((channel, idx) => (
                  <div 
                    key={channel.channel_id}
                    className="flex items-center gap-4 p-3 bg-[var(--bg-deep)] rounded-lg cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
                    onClick={() => navigate(`/channel/${channel.channel_id}`)}
                  >
                    <span className={`text-lg font-bold w-8 ${idx === 0 ? 'text-yellow-500' : 'text-[var(--text-dim)]'}`}>#{idx + 1}</span>
                    <img src={channel.thumbnail_url} alt={channel.title} className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <div className="font-medium text-[var(--text-primary)]">{channel.title}</div>
                      <div className="text-sm text-[var(--text-dim)]">{formatNumber(channel.subscriber_count)} subs</div>
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${channel.progress}%` }} />
                      </div>
                      <div className="text-xs text-[var(--text-dim)] mt-1">{channel.progress.toFixed(1)}% complete</div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 text-sm font-medium">
                        {channel.daysToReach ? `~${channel.daysToReach} days` : 'N/A'}
                      </div>
                      <div className="text-xs text-[var(--text-dim)]">Est. arrival *</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-3 bg-[var(--bg-deep)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-dim)]">
          <span className="text-yellow-500">*</span> Estimated arrival times are calculated based on current daily growth rates and may vary significantly. These are projections by TopTube World Pro, not YouTube data.
        </div>

        {/* SEO Content */}
        <div className="mt-12 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">About YouTube Subscriber Races</h2>
          <div className="text-[var(--text-muted)] space-y-3 text-sm">
            <p>
              The race to major subscriber milestones has become one of the most exciting narratives in YouTube history. 
              From the legendary PewDiePie vs T-Series battle to MrBeast's meteoric rise, these races captivate millions of viewers worldwide.
            </p>
            <p>
              Our live tracker monitors the top YouTube channels and calculates estimated arrival times based on current growth rates. 
              While these predictions are estimates and can change based on viral videos or algorithm changes, they provide an exciting 
              way to follow the competition.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


const MilestonePage = () => {
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [upcomingMilestones, setUpcomingMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  const milestoneValues = [500000000, 400000000, 300000000, 250000000, 200000000, 150000000, 100000000, 75000000, 50000000];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API}/leaderboard/global?limit=200`);
        const channelData = response.data.channels || [];
        setChannels(channelData);
        
        // Calculate upcoming milestones
        const upcoming = [];
        channelData.forEach(channel => {
          milestoneValues.forEach(milestone => {
            if (channel.subscriber_count < milestone && channel.subscriber_count >= milestone * 0.9) {
              const remaining = milestone - channel.subscriber_count;
              const daysToReach = channel.daily_subscriber_gain > 0 
                ? Math.ceil(remaining / channel.daily_subscriber_gain)
                : null;
              
              if (daysToReach && daysToReach <= 365) { // Only show if within a year
                upcoming.push({
                  channel,
                  milestone,
                  remaining,
                  daysToReach,
                  progress: (channel.subscriber_count / milestone) * 100
                });
              }
            }
          });
        });
        
        // Sort by days to reach
        upcoming.sort((a, b) => (a.daysToReach || 9999) - (b.daysToReach || 9999));
        setUpcomingMilestones(upcoming.slice(0, 20));
      } catch (error) {
        console.error("Error fetching milestone data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const currentYear = new Date().getFullYear();

  // Historical milestones (hardcoded significant events)
  const historicalMilestones = [
    { channel: "MrBeast", milestone: "400M", date: "2024", country: "US" },
    { channel: "T-Series", milestone: "300M", date: "2024", country: "IN" },
    { channel: "MrBeast", milestone: "300M", date: "2024", country: "US" },
    { channel: "T-Series", milestone: "250M", date: "2023", country: "IN" },
    { channel: "Cocomelon", milestone: "150M", date: "2023", country: "US" },
    { channel: "T-Series", milestone: "200M", date: "2022", country: "IN" },
    { channel: "PewDiePie", milestone: "100M", date: "2019", country: "SE" },
    { channel: "T-Series", milestone: "100M", date: "2019", country: "IN" },
  ];

  useSEO({
    title: `YouTube Milestone Tracker ${currentYear} - Channels About to Hit 100M, 200M, 500M Subscribers`,
    description: `Track YouTube channels approaching major subscriber milestones. See who's about to hit 100M, 200M, 300M, 500M subscribers next. Historical milestone timeline included.`,
    keywords: `youtube milestones ${currentYear}, channels hitting 100 million, youtube 500m subscribers, subscriber milestone tracker, next youtuber to hit 100m`,
    canonical: `${SITE_URL}/milestones`
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-8" data-testid="milestone-page">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Star className="w-10 h-10 text-yellow-500" />
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">YouTube Milestone Tracker</h1>
          </div>
          <p className="text-[var(--text-muted)] text-lg">Track channels approaching and achieving major subscriber milestones</p>
        </div>

        {/* Editorial Introduction */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3">Understanding YouTube Milestones</h2>
          <div className="text-[var(--text-secondary)] text-sm space-y-3">
            <p>
              YouTube subscriber milestones have become cultural moments in the digital age. When MrBeast hit 100 million subscribers 
              or T-Series became the first channel to reach 200 million, these achievements made headlines worldwide. Our milestone 
              tracker lets you follow these exciting races in real-time.
            </p>
            <p>
              We track channels approaching key thresholds: 50 million, 100 million, 200 million, and beyond. Using our growth data, 
              we estimate when channels might reach their next milestone – though these predictions can change dramatically based on 
              viral content or algorithm shifts.
            </p>
            <p className="text-xs text-[var(--text-dim)] pt-2 border-t border-[var(--border)]">
              <em>Estimated arrival times are calculated by TopTube World Pro based on current growth rates and are speculative projections.</em>
            </p>
          </div>
        </div>

        {/* Upcoming Milestones */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-6 h-6 text-green-500" />
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Upcoming Milestones</h2>
            <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">LIVE</span>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {upcomingMilestones.map((item, idx) => (
              <div 
                key={`${item.channel.channel_id}-${item.milestone}`}
                className={`bg-[var(--bg-card)] border ${idx < 3 ? 'border-yellow-500/30' : 'border-[var(--border)]'} rounded-lg p-4 cursor-pointer hover:border-yellow-500/50 transition-colors`}
                onClick={() => navigate(`/channel/${item.channel.channel_id}`)}
              >
                <div className="flex items-center gap-3 mb-3">
                  {idx < 3 && <Flame className="w-5 h-5 text-yellow-500" />}
                  <img src={item.channel.thumbnail_url} alt={item.channel.title} className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-[var(--text-primary)]">{item.channel.title}</h3>
                    <p className="text-[var(--text-dim)] text-sm">{item.channel.country_name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-500 font-bold">{formatNumber(item.milestone)}</div>
                    <div className="text-[var(--text-dim)] text-xs">Target</div>
                  </div>
                </div>
                
                {/* Progress */}
                <div className="mb-2">
                  <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-500 to-red-500 rounded-full"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">{formatNumber(item.channel.subscriber_count)} current</span>
                  <span className="text-green-400">~{item.daysToReach} days away *</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Historical Timeline */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Milestone History</h2>
          </div>
          
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[var(--border-hover)]" />
              
              <div className="space-y-6">
                {historicalMilestones.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 ml-2">
                    <div className={`w-5 h-5 rounded-full ${idx < 2 ? 'bg-yellow-500' : 'bg-blue-500'} flex-shrink-0 z-10`} />
                    <div className="flex-1 bg-[var(--bg-deep)] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-[var(--text-primary)]">{item.channel}</h3>
                        <span className="text-[var(--text-dim)] text-sm">{item.date}</span>
                      </div>
                      <p className="text-[var(--text-muted)]">
                        Reached <span className="text-yellow-500 font-bold">{item.milestone}</span> subscribers
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Milestone Levels */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="w-6 h-6 text-purple-500" />
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Milestone Levels</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "500M", label: "Diamond", color: "text-cyan-400", bg: "bg-cyan-500/20", count: channels.filter(c => c.subscriber_count >= 500000000).length },
              { value: "200M", label: "Platinum", color: "text-[var(--text-secondary)]", bg: "bg-gray-500/20", count: channels.filter(c => c.subscriber_count >= 200000000).length },
              { value: "100M", label: "Gold", color: "text-yellow-500", bg: "bg-yellow-500/20", count: channels.filter(c => c.subscriber_count >= 100000000).length },
              { value: "50M", label: "Silver", color: "text-[var(--text-muted)]", bg: "bg-gray-400/20", count: channels.filter(c => c.subscriber_count >= 50000000).length },
            ].map(level => (
              <div key={level.value} className={`${level.bg} border border-[var(--border-hover)] rounded-lg p-4 text-center`}>
                <div className={`text-3xl font-bold ${level.color} mb-1`}>{level.value}</div>
                <div className="text-[var(--text-muted)] text-sm">{level.label} Level</div>
                <div className="text-[var(--text-primary)] font-semibold mt-2">{level.count} channels</div>
              </div>
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <div className="mt-6 p-3 bg-[var(--bg-deep)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-dim)]">
          <span className="text-yellow-500">*</span> Estimated arrival times are calculated based on current daily growth rates by TopTube World Pro and may change.
        </div>
      </div>
    </div>
  );
};



export { RacePage };
export { MilestonePage };
