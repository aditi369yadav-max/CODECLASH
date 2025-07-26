// client/app/components/dashboard/PerformanceTrendChart.tsx
'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Corrected: Only define MonthlyPerformanceData once
interface MonthlyPerformanceData {
  monthYear: string;
  solvedCount: number;
}

// Corrected: Define PerformanceTrendChartProps correctly
interface PerformanceTrendChartProps {
  data: MonthlyPerformanceData[];
}

const PerformanceTrendChart: React.FC<PerformanceTrendChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="card performance-graph flex items-center justify-center text-gray-400">
        No performance trend data available.
      </div>
    );
  }

  // Map data to ensure 'monthYear' is correctly formatted for display if needed
  const chartData = data.map(item => ({
    ...item,
    // Example: Format "2024-01" to "Jan 2024" if you wish, or keep as is
    // For XAxis, a simple "Jan" or "Feb" might be better
    name: new Date(item.monthYear + '-01').toLocaleString('default', { month: 'short', year: '2-digit' }),
  }));

  return (
    <div className="card performance-graph">
      <h3 className="card-title">Performance Trend</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="name" stroke="#999" />
          <YAxis stroke="#999" />
          <Tooltip
            contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: '4px' }}
            itemStyle={{ color: '#fff' }}
            labelStyle={{ color: '#ccc' }}
            formatter={(value: number, name: string) => [`${value} problems`, 'Solved']}
          />
          <Line type="monotone" dataKey="solvedCount" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
      {/* You can remove the old graph-placeholder image and divs here */}
    </div>
  );
};

export default PerformanceTrendChart;