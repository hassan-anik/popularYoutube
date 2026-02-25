import React, { useState, useEffect, useRef } from 'react';
import { formatNumber } from '../../utils/format';

export const AnimatedCounter = ({ value, format = true }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);
  
  useEffect(() => {
    if (value === previousValue.current) return;
    
    const diff = value - previousValue.current;
    const steps = 20;
    const stepValue = diff / steps;
    let current = previousValue.current;
    let step = 0;
    
    const interval = setInterval(() => {
      step++;
      current += stepValue;
      if (step >= steps) {
        current = value;
        clearInterval(interval);
      }
      setDisplayValue(Math.round(current));
    }, 50);
    
    previousValue.current = value;
    
    return () => clearInterval(interval);
  }, [value]);
  
  return (
    <span className="tabular-nums">
      {format ? formatNumber(displayValue) : displayValue.toLocaleString()}
    </span>
  );
};

export const LastUpdatedIndicator = ({ timestamp, className = '' }) => {
  const [timeAgo, setTimeAgo] = useState('');
  
  useEffect(() => {
    const updateTimeAgo = () => {
      if (!timestamp) {
        setTimeAgo('');
        return;
      }
      
      const now = new Date();
      const updated = new Date(timestamp);
      const diffMs = now - updated;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMins < 1) setTimeAgo('Just now');
      else if (diffMins < 60) setTimeAgo(`${diffMins}m ago`);
      else if (diffHours < 24) setTimeAgo(`${diffHours}h ago`);
      else setTimeAgo(`${diffDays}d ago`);
    };
    
    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000);
    return () => clearInterval(interval);
  }, [timestamp]);
  
  if (!timeAgo) return null;
  
  return (
    <span className={`text-xs text-gray-500 ${className}`}>
      Updated {timeAgo}
    </span>
  );
};

export const LiveIndicator = () => (
  <div className="flex items-center gap-1.5">
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
    </span>
    <span className="text-xs text-green-400 font-medium">LIVE</span>
  </div>
);
