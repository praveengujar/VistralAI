'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import { format } from 'date-fns';
import { QuadrantPosition } from '@/lib/services/agents/types';

interface TrendDataPoint {
  date: Date;
  score: number;
  quadrant?: QuadrantPosition;
  scanId?: string;
}

interface ScoreTrendChartProps {
  data: TrendDataPoint[];
  benchmark?: number;
  showQuadrantZones?: boolean;
  height?: number;
  onPointClick?: (scanId: string) => void;
}

const QUADRANT_COLORS = {
  dominant: '#10b981',
  niche: '#06b6d4',
  vulnerable: '#f59e0b',
  invisible: '#ef4444',
};

export function ScoreTrendChart({
  data,
  benchmark,
  showQuadrantZones = false,
  height = 200,
  onPointClick,
}: ScoreTrendChartProps) {
  const chartData = data.map((point) => ({
    date: format(point.date, 'MMM d'),
    fullDate: format(point.date, 'PPp'),
    score: point.score,
    quadrant: point.quadrant,
    scanId: point.scanId,
    color: point.quadrant ? QUADRANT_COLORS[point.quadrant] : '#8b5cf6',
  }));

  const handleClick = (data: { activePayload?: Array<{ payload: { scanId?: string } }> }) => {
    if (onPointClick && data?.activePayload?.[0]?.payload?.scanId) {
      onPointClick(data.activePayload[0].payload.scanId);
    }
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          onClick={handleClick}
        >
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />

          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
            tickFormatter={(value) => `${value}`}
          />

          {/* Quadrant zone lines */}
          {showQuadrantZones && (
            <>
              <ReferenceLine
                y={70}
                stroke="#10b981"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
              />
              <ReferenceLine
                y={50}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
              />
            </>
          )}

          {/* Benchmark line */}
          {benchmark && (
            <ReferenceLine
              y={benchmark}
              stroke="#94a3b8"
              strokeDasharray="8 4"
              label={{
                value: `Benchmark`,
                fill: '#94a3b8',
                fontSize: 10,
                position: 'right',
              }}
            />
          )}

          {/* Area fill under the line */}
          <Area
            type="monotone"
            dataKey="score"
            stroke="none"
            fill="url(#scoreGradient)"
          />

          {/* Main score line */}
          <Line
            type="monotone"
            dataKey="score"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{
              fill: '#8b5cf6',
              strokeWidth: 2,
              r: 4,
              stroke: '#fff',
            }}
            activeDot={{
              r: 6,
              fill: '#8b5cf6',
              stroke: '#fff',
              strokeWidth: 2,
              cursor: 'pointer',
            }}
          />

          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg shadow-lg p-3" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
                    <p className="text-xs" style={{ color: 'rgb(var(--foreground-muted))' }}>{data.fullDate}</p>
                    <p className="text-lg font-semibold mt-1" style={{ color: 'rgb(var(--foreground))' }}>
                      Score: {data.score.toFixed(0)}
                    </p>
                    {data.quadrant && (
                      <p
                        className="text-sm font-medium mt-1"
                        style={{ color: QUADRANT_COLORS[data.quadrant as QuadrantPosition] }}
                      >
                        {data.quadrant.charAt(0).toUpperCase() + data.quadrant.slice(1)}
                      </p>
                    )}
                    {data.scanId && (
                      <p className="text-xs text-primary-600 mt-2 cursor-pointer">
                        Click to view details
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend for quadrant zones */}
      {showQuadrantZones && (
        <div className="flex justify-center gap-6 mt-4 text-xs" style={{ color: 'rgb(var(--foreground-muted))' }}>
          <div className="flex items-center gap-1">
            <div className="w-3 h-px bg-success-500" style={{ borderStyle: 'dashed' }} />
            <span>&gt;70: Dominant</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-px bg-warning-500" style={{ borderStyle: 'dashed' }} />
            <span>50-70: Vulnerable/Niche</span>
          </div>
          <div className="flex items-center gap-1">
            <span>&lt;50: Invisible</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScoreTrendChart;
