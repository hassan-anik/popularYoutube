import React from 'react';
import { ViralBadge } from './Badges';
import { formatNumber } from '../../utils/format';

export const ChannelCard = ({ channel, rank, onClick }) => (
  <div 
    className="bg-[#111] border border-[#222] rounded-lg p-4 hover:border-[#333] transition-colors cursor-pointer"
    onClick={onClick}
    data-testid={`channel-card-${channel.channel_id}`}
  >
    <div className="flex items-start gap-4">
      <div className="text-2xl font-bold text-gray-600">#{rank}</div>
      <img 
        src={channel.thumbnail_url || "https://via.placeholder.com/64"} 
        alt={channel.title}
        className="w-16 h-16 rounded-full"
        onError={(e) => e.target.src = "https://via.placeholder.com/64"}
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-white truncate">{channel.title}</h3>
        <p className="text-gray-500 text-sm">{channel.country_name}</p>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-lg font-bold text-white">{formatNumber(channel.subscriber_count)}</span>
          <span className="text-green-400 text-sm">+{formatNumber(channel.daily_subscriber_gain || 0)}/day</span>
        </div>
      </div>
      <ViralBadge label={channel.viral_label} />
    </div>
  </div>
);
