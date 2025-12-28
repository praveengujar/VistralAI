'use client';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useChartTheme } from '@/lib/hooks/useChartTheme';

interface MetricsData {
  faithfulness: number;
  shareOfVoice: number;
  sentiment: number; // -1 to 1, will be normalized to 0-100
  voiceAlignment: number;
  hallucinationRisk: number; // This is inverted: 100 = no hallucinations
}

interface MetricsRadarChartProps {
  currentMetrics: MetricsData;
  previousMetrics?: MetricsData;
  benchmarkMetrics?: MetricsData;
  platformName?: string;
  showLegend?: boolean;
  height?: number;
}

const METRIC_LABELS = {
  faithfulness: 'Faithfulness',
  shareOfVoice: 'Visibility',
  sentiment: 'Sentiment',
  voiceAlignment: 'Voice Match',
  hallucinationRisk: 'Accuracy',
};

const METRIC_DESCRIPTIONS = {
  faithfulness: 'How accurately AI represents your brand',
  shareOfVoice: 'How often your brand is mentioned',
  sentiment: 'Tone of mentions (positive/negative)',
  voiceAlignment: 'Alignment with brand voice',
  hallucinationRisk: 'Freedom from false claims',
};

function normalizeMetrics(metrics: MetricsData) {
  return {
    faithfulness: metrics.faithfulness,
    shareOfVoice: metrics.shareOfVoice,
    sentiment: ((metrics.sentiment + 1) / 2) * 100, // -1 to 1 -> 0 to 100
    voiceAlignment: metrics.voiceAlignment,
    hallucinationRisk: metrics.hallucinationRisk,
  };
}

function formatMetricsForChart(
  current: MetricsData,
  previous?: MetricsData,
  benchmark?: MetricsData
) {
  const currentNorm = normalizeMetrics(current);
  const previousNorm = previous ? normalizeMetrics(previous) : null;
  const benchmarkNorm = benchmark ? normalizeMetrics(benchmark) : null;

  return Object.entries(METRIC_LABELS).map(([key, label]) => {
    const metricKey = key as keyof MetricsData;
    return {
      metric: label,
      fullMark: 100,
      current: currentNorm[metricKey],
      previous: previousNorm ? previousNorm[metricKey] : undefined,
      benchmark: benchmarkNorm ? benchmarkNorm[metricKey] : undefined,
      description: METRIC_DESCRIPTIONS[metricKey],
    };
  });
}

export function MetricsRadarChart({
  currentMetrics,
  previousMetrics,
  benchmarkMetrics,
  platformName,
  showLegend = true,
  height = 300,
}: MetricsRadarChartProps) {
  const data = formatMetricsForChart(currentMetrics, previousMetrics, benchmarkMetrics);
  const chartTheme = useChartTheme();

  return (
    <div className="w-full">
      {platformName && (
        <h3 className="text-center text-sm font-medium mb-2" style={{ color: 'rgb(var(--foreground-secondary))' }}>
          {platformName}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={data} margin={{ top: 20, right: 50, bottom: 20, left: 50 }}>
          <PolarGrid stroke={chartTheme.gridColor} />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: chartTheme.axisLabelColor, fontSize: 11 }}
            tickLine={false}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: chartTheme.axisColor, fontSize: 10 }}
            tickCount={5}
          />

          {/* Benchmark area (if provided) */}
          {benchmarkMetrics && (
            <Radar
              name="Industry Benchmark"
              dataKey="benchmark"
              stroke={chartTheme.neutralColor}
              fill={chartTheme.neutralColor}
              fillOpacity={0.1}
              strokeDasharray="4 4"
            />
          )}

          {/* Previous metrics (if provided) */}
          {previousMetrics && (
            <Radar
              name="Previous Scan"
              dataKey="previous"
              stroke={chartTheme.colors[1]}
              fill={chartTheme.colors[1]}
              fillOpacity={0.2}
              strokeWidth={1}
            />
          )}

          {/* Current metrics */}
          <Radar
            name="Current"
            dataKey="current"
            stroke={chartTheme.colors[0]}
            fill={chartTheme.colors[0]}
            fillOpacity={0.4}
            strokeWidth={2}
          />

          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg shadow-lg p-3" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
                    <p className="font-medium" style={{ color: 'rgb(var(--foreground))' }}>{data.metric}</p>
                    <p className="text-xs mb-2" style={{ color: 'rgb(var(--foreground-muted))' }}>{data.description}</p>
                    {payload.map((entry) => (
                      <p
                        key={entry.name}
                        className="text-sm"
                        style={{ color: entry.color }}
                      >
                        {entry.name}: {(entry.value as number)?.toFixed(1)}%
                      </p>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />

          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="circle"
            />
          )}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default MetricsRadarChart;
