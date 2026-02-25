import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const ViralBadge = ({ label }) => {
  if (!label) return null;
  
  const styles = {
    'Exploding': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Rising': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'Stable': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Slowing': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  };
  
  const icons = {
    'Exploding': <TrendingUp className="w-3 h-3" />,
    'Rising': <TrendingUp className="w-3 h-3" />,
    'Stable': <Minus className="w-3 h-3" />,
    'Slowing': <TrendingDown className="w-3 h-3" />
  };
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${styles[label] || styles['Stable']}`}>
      {icons[label]} {label}
    </span>
  );
};

export const RankChange = ({ current, previous }) => {
  if (!previous || current === previous) return null;
  const isUp = current < previous;
  return (
    <span className={`text-xs ${isUp ? 'text-green-400' : 'text-red-400'}`}>
      {isUp ? '↑' : '↓'} {Math.abs(current - previous)}
    </span>
  );
};
