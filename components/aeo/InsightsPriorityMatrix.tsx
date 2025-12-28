'use client';

import { InsightPriority, CorrectionEffort, InsightCategory } from '@/lib/services/agents/types';

interface InsightItem {
  id: string;
  title: string;
  category: InsightCategory;
  priority: InsightPriority;
  effort?: CorrectionEffort;
  impact: string;
}

interface InsightsPriorityMatrixProps {
  insights: InsightItem[];
  maxItems?: number;
  onInsightClick?: (insightId: string) => void;
}

const PRIORITY_CONFIG = {
  critical: { color: 'bg-error-500', text: 'text-error-700', badge: 'bg-error-100' },
  high: { color: 'bg-warning-500', text: 'text-warning-700', badge: 'bg-warning-100' },
  medium: { color: 'bg-accent-500', text: 'text-accent-700', badge: 'bg-accent-100' },
  low: { color: 'bg-foreground-muted', text: 'text-foreground-secondary', badge: 'bg-background-secondary' },
};

const EFFORT_CONFIG = {
  low: { label: 'Low Effort', color: 'text-success-600' },
  medium: { label: 'Med Effort', color: 'text-warning-600' },
  high: { label: 'High Effort', color: 'text-error-600' },
};

const CATEGORY_ICONS: Record<InsightCategory, string> = {
  hallucination: '🎭',
  accuracy: '🎯',
  missing_info: '📝',
  visibility: '👁️',
  sentiment: '💭',
  voice: '🗣️',
  competitive: '🏁',
  competitor_confusion: '🔄',
};

export function InsightsPriorityMatrix({
  insights,
  maxItems = 5,
  onInsightClick,
}: InsightsPriorityMatrixProps) {
  // Sort by priority (critical first) then by effort (low first)
  const sortedInsights = [...insights]
    .sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const effortOrder = { low: 0, medium: 1, high: 2 };

      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      if (a.effort && b.effort) {
        return effortOrder[a.effort] - effortOrder[b.effort];
      }
      return 0;
    })
    .slice(0, maxItems);

  if (insights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-foreground-muted">
        <span className="text-2xl mb-2">✨</span>
        <p className="text-sm">No active insights</p>
        <p className="text-xs text-foreground-muted">Run a perception scan to generate insights</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sortedInsights.map((insight) => {
        const priorityConfig = PRIORITY_CONFIG[insight.priority];
        const effortConfig = insight.effort ? EFFORT_CONFIG[insight.effort] : null;

        return (
          <div
            key={insight.id}
            className={`flex items-start gap-3 p-3 rounded-lg border border-border hover:border-border-secondary hover:bg-surface-hover transition-colors ${
              onInsightClick ? 'cursor-pointer' : ''
            }`}
            onClick={() => onInsightClick?.(insight.id)}
          >
            {/* Priority indicator */}
            <div className={`w-1.5 h-full min-h-[40px] rounded-full ${priorityConfig.color}`} />

            {/* Category icon */}
            <span className="text-lg">{CATEGORY_ICONS[insight.category]}</span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{insight.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${priorityConfig.badge} ${priorityConfig.text}`}
                >
                  {insight.priority.charAt(0).toUpperCase() + insight.priority.slice(1)}
                </span>
                {effortConfig && (
                  <span className={`text-xs ${effortConfig.color}`}>
                    {effortConfig.label}
                  </span>
                )}
              </div>
            </div>

            {/* Arrow */}
            {onInsightClick && (
              <svg
                className="w-4 h-4 text-foreground-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </div>
        );
      })}

      {/* View all link */}
      {insights.length > maxItems && (
        <button className="w-full text-center text-sm text-primary-600 hover:text-primary-700 py-2">
          View all {insights.length} insights
        </button>
      )}
    </div>
  );
}

export default InsightsPriorityMatrix;
