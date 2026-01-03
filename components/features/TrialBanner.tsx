'use client';

import { Clock, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useTrialStatus } from '@/lib/hooks/useFeatureGate';

interface TrialBannerProps {
  dismissible?: boolean;
}

export function TrialBanner({ dismissible = true }: TrialBannerProps) {
  const { isTrialing, daysRemaining, isExpiringSoon, isLoading } = useTrialStatus();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isLoading || !isTrialing || isDismissed) {
    return null;
  }

  const bgColor = isExpiringSoon ? 'rgba(245, 158, 11, 0.1)' : 'rgba(var(--primary), 0.1)';
  const borderColor = isExpiringSoon ? 'rgba(245, 158, 11, 0.3)' : 'rgba(var(--primary), 0.3)';
  const iconColor = isExpiringSoon ? 'rgb(245, 158, 11)' : 'rgb(var(--primary))';

  return (
    <div
      className="relative px-4 py-3 flex items-center justify-between gap-4"
      style={{ backgroundColor: bgColor, borderBottom: `1px solid ${borderColor}` }}
    >
      <div className="flex items-center gap-3">
        <Clock className="w-5 h-5 flex-shrink-0" style={{ color: iconColor }} />
        <div>
          <p className="text-sm font-medium" style={{ color: 'rgb(var(--foreground))' }}>
            {isExpiringSoon
              ? `Your trial expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}!`
              : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left in your free trial`}
          </p>
          <p className="text-xs" style={{ color: 'rgb(var(--foreground-secondary))' }}>
            {isExpiringSoon
              ? 'Add a payment method to keep your access.'
              : 'Enjoying VistralAI? Upgrade anytime to continue after your trial.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link href="/pricing">
          <button
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
            style={{ backgroundColor: 'rgb(var(--primary))', color: 'white' }}
          >
            {isExpiringSoon ? 'Add Payment Method' : 'View Plans'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </Link>

        {dismissible && (
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-lg hover:opacity-70 transition-opacity"
            style={{ color: 'rgb(var(--foreground-secondary))' }}
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default TrialBanner;
