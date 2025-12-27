import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  format?: 'number' | 'percentage' | 'score';
  icon?: React.ReactNode;
}

export default function MetricCard({
  label,
  value,
  change,
  trend,
  format = 'number',
  icon,
}: MetricCardProps) {
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;

    switch (format) {
      case 'percentage':
        return `${val}%`;
      case 'score':
        return `${val}/100`;
      default:
        return val.toLocaleString();
    }
  };

  const getTrendColor = () => {
    if (!trend) return '';
    switch (trend) {
      case 'up':
        return 'text-success-600';
      case 'down':
        return 'text-error-600';
      default:
        return '';
    }
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className="rounded-lg shadow p-6" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium" style={{ color: 'rgb(var(--foreground-secondary))' }}>{label}</p>
        {icon && <div style={{ color: 'rgb(var(--foreground-muted))' }}>{icon}</div>}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold" style={{ color: 'rgb(var(--foreground))' }}>{formatValue(value)}</p>

          {change !== undefined && trend && (
            <div className={`flex items-center mt-2 ${getTrendColor()}`}>
              <TrendIcon className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">
                {Math.abs(change)}% {trend === 'up' ? 'increase' : trend === 'down' ? 'decrease' : 'no change'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
