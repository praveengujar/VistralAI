'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TimeSeriesDataPoint } from '@/types';
import { CHART_COLORS } from '@/lib/constants';

interface VisibilityScoreChartProps {
  data: TimeSeriesDataPoint[];
}

export default function VisibilityScoreChart({ data }: VisibilityScoreChartProps) {
  const chartData = data.map((point) => ({
    date: point.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: Math.round(point.value),
  }));

  return (
    <div className="rounded-lg shadow p-6" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(var(--foreground))' }}>AI Visibility Score Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
          <XAxis
            dataKey="date"
            stroke="currentColor"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            style={{ color: 'rgb(var(--foreground-muted))' }}
          />
          <YAxis
            stroke="currentColor"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            style={{ color: 'rgb(var(--foreground-muted))' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgb(var(--surface))',
              border: '1px solid rgb(var(--border))',
              borderRadius: '6px',
              color: 'rgb(var(--foreground))',
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke={CHART_COLORS.primary}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
