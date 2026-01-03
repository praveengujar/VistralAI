'use client';

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface UsageLimitBarProps {
  label: string;
  used: number;
  limit: number | 'Unlimited';
  showWarning?: boolean;
  warningThreshold?: number; // Percentage at which to show warning
}

export function UsageLimitBar({
  label,
  used,
  limit,
  showWarning = true,
  warningThreshold = 80,
}: UsageLimitBarProps) {
  const isUnlimited = limit === 'Unlimited';
  const percentage = isUnlimited ? 0 : (used / (limit as number)) * 100;
  const isNearLimit = percentage >= warningThreshold;
  const isAtLimit = percentage >= 100;

  const getBarColor = () => {
    if (isAtLimit) return 'rgb(239, 68, 68)'; // red
    if (isNearLimit) return 'rgb(245, 158, 11)'; // amber
    return 'rgb(var(--primary))';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span style={{ color: 'rgb(var(--foreground-secondary))' }}>{label}</span>
        <span
          className="font-medium"
          style={{ color: isAtLimit ? 'rgb(239, 68, 68)' : 'rgb(var(--foreground))' }}
        >
          {used} / {isUnlimited ? '∞' : limit}
        </span>
      </div>

      {!isUnlimited && (
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: 'rgb(var(--background))' }}
        >
          <div
            className="h-full transition-all rounded-full"
            style={{
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: getBarColor(),
            }}
          />
        </div>
      )}

      {showWarning && isNearLimit && !isAtLimit && (
        <div
          className="flex items-center gap-2 text-xs"
          style={{ color: 'rgb(245, 158, 11)' }}
        >
          <AlertTriangle className="w-3 h-3" />
          <span>Approaching limit</span>
        </div>
      )}

      {isAtLimit && (
        <div className="flex items-center justify-between text-xs">
          <span
            className="flex items-center gap-1"
            style={{ color: 'rgb(239, 68, 68)' }}
          >
            <AlertTriangle className="w-3 h-3" />
            Limit reached
          </span>
          <Link
            href="/pricing"
            className="hover:underline"
            style={{ color: 'rgb(var(--primary))' }}
          >
            Upgrade
          </Link>
        </div>
      )}
    </div>
  );
}

export default UsageLimitBar;
