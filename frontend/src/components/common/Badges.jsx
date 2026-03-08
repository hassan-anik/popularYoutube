import React from 'react';
import { TrendingUp, TrendingDown, Minus, Flame, ArrowUp, ArrowDown } from 'lucide-react';

export const ViralBadge = ({ label }) => {
  const styles = {
    "Exploding": "bg-red-500/20 text-red-400 border-red-500/30",
    "Rising Fast": "bg-green-500/20 text-green-400 border-green-500/30",
    "Stable": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Slowing": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
  };
  
  const icons = {
    "Exploding": <Flame className="w-3 h-3" />,
    "Rising Fast": <TrendingUp className="w-3 h-3" />,
    "Stable": <Minus className="w-3 h-3" />,
    "Slowing": <TrendingDown className="w-3 h-3" />
  };

  return (
    <span 
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${styles[label] || styles["Stable"]}`} 
      data-testid={`viral-badge-${label?.toLowerCase()}`}
      title="Estimated status by TopTube World Pro"
    >
      {icons[label]} {label || "Stable"}
    </span>
  );
};

export const EstimatedLabel = ({ children, tooltip = "Estimated by TopTube World Pro" }) => (
  <span className="group relative" title={tooltip}>
    {children}
    <span className="ml-1 text-[10px] text-gray-500 align-super">*</span>
  </span>
);

export const RankChange = ({ current, previous }) => {
  const change = previous - current;
  if (change > 0) {
    return <span className="text-green-400 flex items-center gap-1 text-sm"><ArrowUp className="w-3 h-3" /> {change}</span>;
  }
  if (change < 0) {
    return <span className="text-red-400 flex items-center gap-1 text-sm"><ArrowDown className="w-3 h-3" /> {Math.abs(change)}</span>;
  }
  return <span className="text-gray-500 text-sm">-</span>;
};
