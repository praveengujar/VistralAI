'use client';

import { CreditCard, Calendar, Package, Users, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useSubscriptionLimits } from '@/lib/hooks/useFeatureGate';
import { UsageLimitBar } from './UsageLimitBar';

export function SubscriptionPanel() {
  const { subscription, usage, isLoading, error } = useSubscriptionLimits();

  if (isLoading) {
    return (
      <div
        className="rounded-lg p-6 animate-pulse"
        style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}
      >
        <div className="h-6 w-32 rounded mb-4" style={{ backgroundColor: 'rgb(var(--background))' }} />
        <div className="space-y-3">
          <div className="h-4 w-full rounded" style={{ backgroundColor: 'rgb(var(--background))' }} />
          <div className="h-4 w-3/4 rounded" style={{ backgroundColor: 'rgb(var(--background))' }} />
        </div>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div
        className="rounded-lg p-6"
        style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}
      >
        <h3 className="font-semibold mb-4" style={{ color: 'rgb(var(--foreground))' }}>
          Subscription
        </h3>
        <p className="text-sm mb-4" style={{ color: 'rgb(var(--foreground-secondary))' }}>
          No active subscription found.
        </p>
        <Link href="/pricing">
          <button
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: 'rgb(var(--primary))', color: 'white' }}
          >
            View Plans
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </Link>
      </div>
    );
  }

  const tier = subscription.tier;
  const isTrialing = subscription.status === 'trialing';

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}
    >
      {/* Header */}
      <div className="p-6" style={{ borderBottom: '1px solid rgb(var(--border))' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold" style={{ color: 'rgb(var(--foreground))' }}>
            Subscription
          </h3>
          <span
            className="px-2 py-1 text-xs font-medium rounded-full capitalize"
            style={{
              backgroundColor: isTrialing ? 'rgba(245, 158, 11, 0.1)' : 'rgba(34, 197, 94, 0.1)',
              color: isTrialing ? 'rgb(245, 158, 11)' : 'rgb(34, 197, 94)',
            }}
          >
            {subscription.status}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'rgba(var(--primary), 0.1)' }}
          >
            <Package className="w-5 h-5" style={{ color: 'rgb(var(--primary))' }} />
          </div>
          <div>
            <p className="font-medium" style={{ color: 'rgb(var(--foreground))' }}>
              {tier.displayName}
            </p>
            <p className="text-sm" style={{ color: 'rgb(var(--foreground-secondary))' }}>
              {isTrialing && subscription.trialDaysRemaining !== undefined
                ? `${subscription.trialDaysRemaining} days left in trial`
                : 'Active subscription'}
            </p>
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      {usage && (
        <div className="p-6 space-y-4" style={{ borderBottom: '1px solid rgb(var(--border))' }}>
          <h4 className="text-sm font-medium" style={{ color: 'rgb(var(--foreground-secondary))' }}>
            Usage
          </h4>
          <UsageLimitBar
            label="Brands"
            used={usage.brands.used}
            limit={usage.brands.limit}
          />
          <UsageLimitBar
            label="Team Seats"
            used={usage.teamSeats.used}
            limit={usage.teamSeats.limit}
          />
        </div>
      )}

      {/* Plan Details */}
      <div className="p-6 space-y-3">
        <h4 className="text-sm font-medium" style={{ color: 'rgb(var(--foreground-secondary))' }}>
          Plan Limits
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" style={{ color: 'rgb(var(--foreground-muted))' }} />
            <span style={{ color: 'rgb(var(--foreground))' }}>
              {tier.brandLimit} brand{tier.brandLimit !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: 'rgb(var(--foreground-muted))' }} />
            <span style={{ color: 'rgb(var(--foreground))' }}>
              {tier.teamSeatLimit === -1 ? 'Unlimited' : tier.teamSeatLimit} seat{tier.teamSeatLimit !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" style={{ color: 'rgb(var(--foreground-muted))' }} />
            <span className="capitalize" style={{ color: 'rgb(var(--foreground))' }}>
              {usage?.updateFrequency ?? tier.updateFrequency} updates
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-6 flex gap-3" style={{ backgroundColor: 'rgb(var(--background))' }}>
        <Link href="/pricing" className="flex-1">
          <button
            className="w-full py-2 px-4 rounded-lg text-sm font-medium"
            style={{ backgroundColor: 'rgb(var(--primary))', color: 'white' }}
          >
            {isTrialing ? 'Upgrade Now' : 'Change Plan'}
          </button>
        </Link>
        <Link href="/settings/billing" className="flex-1">
          <button
            className="w-full py-2 px-4 rounded-lg text-sm font-medium"
            style={{ backgroundColor: 'rgb(var(--surface))', color: 'rgb(var(--foreground))', border: '1px solid rgb(var(--border))' }}
          >
            Manage Billing
          </button>
        </Link>
      </div>
    </div>
  );
}

export default SubscriptionPanel;
