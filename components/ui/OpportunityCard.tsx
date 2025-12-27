import { OpportunityInsight } from '@/types';
import { AlertCircle, TrendingUp } from 'lucide-react';

interface OpportunityCardProps {
  opportunity: OpportunityInsight;
  onToggleComplete?: (id: string) => void;
}

export default function OpportunityCard({ opportunity, onToggleComplete }: OpportunityCardProps) {
  const priorityColors = {
    high: 'bg-error-500/10 text-error-700 border-error-500/30 dark:text-error-300',
    medium: 'bg-warning-500/10 text-warning-700 border-warning-500/30 dark:text-warning-300',
    low: 'bg-info-500/10 text-info-700 border-info-500/30 dark:text-info-300',
  };

  const categoryIcons = {
    Technical: '🔧',
    Content: '📝',
    Product: '📦',
  };

  return (
    <div className="rounded-lg p-4 hover:shadow-md transition-shadow" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{categoryIcons[opportunity.category]}</span>
            <h4 className="font-semibold" style={{ color: 'rgb(var(--foreground))' }}>{opportunity.title}</h4>
          </div>
          <p className="text-sm" style={{ color: 'rgb(var(--foreground-secondary))' }}>{opportunity.description}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
              priorityColors[opportunity.priority]
            }`}
          >
            {opportunity.priority.toUpperCase()}
          </span>

          <div className="flex items-center text-sm" style={{ color: 'rgb(var(--foreground-secondary))' }}>
            <TrendingUp className="h-4 w-4 mr-1 text-success-600" />
            <span className="font-medium">{opportunity.impact}%</span>
            <span className="ml-1" style={{ color: 'rgb(var(--foreground-muted))' }}>impact</span>
          </div>
        </div>

        {onToggleComplete && (
          <button
            onClick={() => onToggleComplete(opportunity.id)}
            className={`text-sm font-medium px-3 py-1 rounded-md transition-colors ${
              opportunity.completed
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {opportunity.completed ? 'Completed' : 'Mark Complete'}
          </button>
        )}
      </div>
    </div>
  );
}
