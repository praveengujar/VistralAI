'use client';

import { useState } from 'react';
import {
  CreditCard,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  RefreshCw
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  useCurrentSubscription,
  useReactivateSubscription,
  useCancelScheduledChange
} from '@/lib/hooks/useSubscriptionManagement';
import { CurrentPlanCard } from '@/components/settings/CurrentPlanCard';
import { PlanSelector } from '@/components/settings/PlanSelector';
import { UsageOverview } from '@/components/settings/UsageOverview';
import { InvoiceHistory } from '@/components/settings/InvoiceHistory';
import { CancelSubscriptionModal } from '@/components/settings/CancelSubscriptionModal';

export default function SubscriptionSettingsPage() {
  const { data, isLoading, error } = useCurrentSubscription();
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-[rgb(var(--surface-hover))] rounded" />
          <div className="h-40 bg-[rgb(var(--surface-hover))] rounded-lg" />
          <div className="h-60 bg-[rgb(var(--surface-hover))] rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-6 border-red-500/20 bg-red-500/5">
          <p className="text-red-500">Failed to load subscription details</p>
        </Card>
      </div>
    );
  }

  const { subscription, usage } = data || {};

  if (!subscription) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-[rgb(var(--foreground))] mb-2">No Active Subscription</h2>
          <p className="text-[rgb(var(--foreground-secondary))] mb-6">
            Choose a plan to get started with VistralAI
          </p>
          <Button onClick={() => window.location.href = '/pricing'}>
            View Plans
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">Subscription</h1>
        <p className="text-[rgb(var(--foreground-secondary))]">Manage your plan, billing, and usage</p>
      </div>

      {/* Cancellation Warning */}
      {subscription.cancelAtPeriodEnd && (
        <Card className="p-4 border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-[rgb(var(--foreground))]">
                Your subscription is scheduled to cancel
              </p>
              <p className="text-sm text-[rgb(var(--foreground-secondary))] mt-1">
                You&apos;ll lose access to {subscription.tier.displayName} features on{' '}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
              </p>
            </div>
            <ReactivateButton />
          </div>
        </Card>
      )}

      {/* Scheduled Change Warning */}
      {subscription.scheduledTier && !subscription.cancelAtPeriodEnd && (
        <Card className="p-4 border-blue-500/30 bg-blue-500/5">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-[rgb(var(--foreground))]">
                Plan change scheduled
              </p>
              <p className="text-sm text-[rgb(var(--foreground-secondary))] mt-1">
                Your plan will change to {subscription.scheduledTier.displayName} ({subscription.scheduledBillingCycle}) on{' '}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
              </p>
            </div>
            <CancelChangeButton />
          </div>
        </Card>
      )}

      {/* Current Plan */}
      <CurrentPlanCard
        subscription={subscription}
        onChangePlan={() => setShowPlanSelector(true)}
      />

      {/* Usage Overview */}
      {usage && <UsageOverview usage={usage} tier={subscription.tier} />}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className="p-4 hover:border-[rgb(var(--primary))]/30 cursor-pointer transition-colors"
          onClick={() => setShowPlanSelector(true)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[rgb(var(--primary))]/10 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-[rgb(var(--primary))]" />
            </div>
            <div>
              <p className="font-medium text-[rgb(var(--foreground))]">Change Plan</p>
              <p className="text-sm text-[rgb(var(--foreground-secondary))]">Upgrade or downgrade your subscription</p>
            </div>
          </div>
        </Card>

        <Card
          className="p-4 hover:border-[rgb(var(--primary))]/30 cursor-pointer transition-colors"
          onClick={() => window.location.href = '/settings/billing'}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[rgb(var(--primary))]/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[rgb(var(--primary))]" />
            </div>
            <div>
              <p className="font-medium text-[rgb(var(--foreground))]">Payment Methods</p>
              <p className="text-sm text-[rgb(var(--foreground-secondary))]">Manage your payment details</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Invoice History */}
      <InvoiceHistory />

      {/* Danger Zone */}
      {!subscription.cancelAtPeriodEnd && (
        <Card className="p-6 border-red-500/20">
          <h3 className="font-semibold text-[rgb(var(--foreground))] mb-2">Danger Zone</h3>
          <p className="text-sm text-[rgb(var(--foreground-secondary))] mb-4">
            Once you cancel your subscription, you&apos;ll lose access to premium features at the end of your billing period.
          </p>
          <Button
            variant="outline"
            className="text-red-500 border-red-500/30 hover:bg-red-500/10"
            onClick={() => setShowCancelModal(true)}
          >
            Cancel Subscription
          </Button>
        </Card>
      )}

      {/* Plan Selector Modal */}
      {showPlanSelector && (
        <PlanSelector
          currentTierId={subscription.tier.name}
          currentBillingCycle={subscription.billingCycle as 'monthly' | 'yearly'}
          onClose={() => setShowPlanSelector(false)}
        />
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <CancelSubscriptionModal
          subscription={subscription}
          onClose={() => setShowCancelModal(false)}
        />
      )}
    </div>
  );
}

function ReactivateButton() {
  const { mutate, isPending } = useReactivateSubscription();

  return (
    <Button
      size="sm"
      onClick={() => mutate()}
      disabled={isPending}
    >
      <RefreshCw className={`w-4 h-4 mr-1 ${isPending ? 'animate-spin' : ''}`} />
      Reactivate
    </Button>
  );
}

function CancelChangeButton() {
  const { mutate, isPending } = useCancelScheduledChange();

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => mutate()}
      disabled={isPending}
    >
      Keep Current Plan
    </Button>
  );
}
