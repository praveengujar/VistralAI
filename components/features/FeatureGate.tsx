'use client';

import { ReactNode } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useFeatureGate } from '@/lib/hooks/useFeatureGate';

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

export function FeatureGate({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
}: FeatureGateProps) {
  const { allowed, reason, upgradeUrl, isLoading } = useFeatureGate(feature);

  if (isLoading) {
    return (
      <div
        className="animate-pulse rounded-lg h-20"
        style={{ backgroundColor: 'rgb(var(--surface))' }}
      />
    );
  }

  if (allowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgradePrompt) {
    return (
      <div
        className="p-6 rounded-lg text-center"
        style={{ border: '1px dashed rgb(var(--border))' }}
      >
        <Lock
          className="w-8 h-8 mx-auto mb-3"
          style={{ color: 'rgb(var(--foreground-muted))' }}
        />
        <h3 className="font-medium mb-1" style={{ color: 'rgb(var(--foreground))' }}>
          Feature Locked
        </h3>
        <p className="text-sm mb-4" style={{ color: 'rgb(var(--foreground-secondary))' }}>
          {reason || 'Upgrade your plan to access this feature.'}
        </p>
        <Link href={upgradeUrl || '/pricing'}>
          <button
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: 'rgb(var(--primary))', color: 'white' }}
          >
            Upgrade Now
            <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </div>
    );
  }

  return null;
}

export default FeatureGate;
