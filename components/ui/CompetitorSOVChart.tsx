'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CompetitorComparison } from '@/types';
import { CHART_COLORS } from '@/lib/constants';

interface CompetitorSOVChartProps {
  data: CompetitorComparison[];
}

export default function CompetitorSOVChart({ data }: CompetitorSOVChartProps) {
  const chartData = data.map((competitor) => ({
    name: competitor.name,
    sov: competitor.shareOfVoice,
    fill: competitor.name === 'Your Brand' ? CHART_COLORS.primary : CHART_COLORS.neutral,
  }));

  return (
    <div className="rounded-lg shadow p-6" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(var(--foreground))' }}>Competitor Share of Voice</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
          <XAxis
            dataKey="name"
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
            label={{ value: '% Share', angle: -90, position: 'insideLeft' }}
            style={{ color: 'rgb(var(--foreground-muted))' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgb(var(--surface))',
              border: '1px solid rgb(var(--border))',
              borderRadius: '6px',
              color: 'rgb(var(--foreground))',
            }}
            formatter={(value) => [`${value}%`, 'Share of Voice']}
          />
          <Bar dataKey="sov" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
