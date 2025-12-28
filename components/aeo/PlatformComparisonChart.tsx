'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { LLMPlatform } from '@/lib/services/agents/types';
import { useChartTheme } from '@/lib/hooks/useChartTheme';

interface PlatformScore {
  platform: LLMPlatform;
  score: number;
  previousScore?: number;
}

interface PlatformComparisonChartProps {
  data: PlatformScore[];
  benchmark?: number;
  showComparison?: boolean;
  height?: number;
}

const PLATFORM_LABELS: Record<LLMPlatform, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  perplexity: 'Perplexity',
  google_aio: 'Google AIO',
};

const PLATFORM_COLORS: Record<LLMPlatform, string> = {
  chatgpt: '#10b981',
  claude: '#f97316',
  gemini: '#3b82f6',
  perplexity: '#8b5cf6',
  google_aio: '#ec4899',
};

function getScoreColor(score: number): string {
  if (score >= 70) return '#10b981'; // success green
  if (score >= 50) return '#f59e0b'; // warning amber
  return '#ef4444'; // error red
}

export function PlatformComparisonChart({
  data,
  benchmark,
  showComparison = false,
  height = 250,
}: PlatformComparisonChartProps) {
  const chartTheme = useChartTheme();
  const chartData = data.map((item) => ({
    name: PLATFORM_LABELS[item.platform],
    platform: item.platform,
    score: item.score,
    previousScore: item.previousScore,
    change: item.previousScore ? item.score - item.previousScore : 0,
  }));

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: chartTheme.axisLabelColor, fontSize: 12 }}
            axisLine={{ stroke: chartTheme.gridColor }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: chartTheme.axisColor, fontSize: 11 }}
            axisLine={{ stroke: chartTheme.gridColor }}
            tickLine={false}
            tickFormatter={(value) => `${value}`}
          />

          {benchmark && (
            <ReferenceLine
              y={benchmark}
              stroke={chartTheme.neutralColor}
              strokeDasharray="4 4"
              label={{
                value: `Benchmark: ${benchmark}`,
                fill: chartTheme.neutralColor,
                fontSize: 10,
                position: 'right',
              }}
            />
          )}

          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg shadow-lg p-3" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
                    <p className="font-medium" style={{ color: 'rgb(var(--foreground))' }}>{data.name}</p>
                    <p className="text-sm" style={{ color: 'rgb(var(--foreground-secondary))' }}>
                      Score: <span className="font-semibold">{data.score.toFixed(0)}</span>
                    </p>
                    {showComparison && data.previousScore !== undefined && (
                      <>
                        <p className="text-sm" style={{ color: 'rgb(var(--foreground-muted))' }}>
                          Previous: {data.previousScore.toFixed(0)}
                        </p>
                        <p
                          className={`text-sm font-medium ${
                            data.change > 0
                              ? 'text-success-600'
                              : data.change < 0
                                ? 'text-error-600'
                                : ''
                          }`}
                          style={data.change === 0 ? { color: 'rgb(var(--foreground-muted))' } : {}}
                        >
                          {data.change > 0 ? '+' : ''}
                          {data.change.toFixed(1)} pts
                        </p>
                      </>
                    )}
                    {benchmark && (
                      <p className="text-xs mt-1" style={{ color: 'rgb(var(--foreground-muted))' }}>
                        {data.score >= benchmark
                          ? `${(data.score - benchmark).toFixed(0)} above benchmark`
                          : `${(benchmark - data.score).toFixed(0)} below benchmark`}
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />

          {/* Previous score bars (if showing comparison) */}
          {showComparison && (
            <Bar
              dataKey="previousScore"
              fill={chartTheme.gridColor}
              radius={[4, 4, 0, 0]}
              name="Previous"
            />
          )}

          {/* Current score bars */}
          <Bar dataKey="score" radius={[4, 4, 0, 0]} name="Current">
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={PLATFORM_COLORS[entry.platform] || getScoreColor(entry.score)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend with score changes */}
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {chartData.map((item) => (
          <div
            key={item.platform}
            className="flex items-center gap-2 text-sm"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: PLATFORM_COLORS[item.platform] }}
            />
            <span style={{ color: 'rgb(var(--foreground-secondary))' }}>{item.name}</span>
            <span className="font-semibold" style={{ color: 'rgb(var(--foreground))' }}>{item.score.toFixed(0)}</span>
            {showComparison && item.change !== 0 && (
              <span
                className={`text-xs ${
                  item.change > 0 ? 'text-success-600' : 'text-error-600'
                }`}
              >
                ({item.change > 0 ? '+' : ''}
                {item.change.toFixed(0)})
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PlatformComparisonChart;
