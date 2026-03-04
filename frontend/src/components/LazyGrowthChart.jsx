import React, { memo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { formatNumber, formatShortDate } from '../utils/format';

const LazyGrowthChart = memo(({ data }) => {
  const chartData = data?.map(item => ({
    date: formatShortDate(item.timestamp),
    subscribers: item.subscriber_count
  })) || [];

  return (
    <div className="h-64" data-testid="growth-chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorSubs" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
          <XAxis dataKey="date" stroke="#666" tick={{ fill: '#666', fontSize: 11 }} />
          <YAxis stroke="#666" tick={{ fill: '#666', fontSize: 11 }} tickFormatter={formatNumber} />
          <Tooltip 
            contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px' }}
            labelStyle={{ color: '#999' }}
            formatter={(value) => [formatNumber(value), "Subscribers"]}
          />
          <Area type="monotone" dataKey="subscribers" stroke="#22c55e" fill="url(#colorSubs)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

export default LazyGrowthChart;
