'use client';

import { Calendar, Globe, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/config/pricing';

interface CurrentPlanCardProps {
  subscription: {
    status: string;
    billingCycle: string;
    currentPeriodEnd: string;
    trialDaysRemaining?: number;
    cancelAtPeriodEnd: boolean;
    tier: {
      displayName: string;
      description: string;
      priceMonthly: number;
      priceYearly: number | null;
      brandLimit: number;
      updateFrequency: string;
      features: Array<{ name: string; included: boolean; highlight?: boolean }>;
    };
  };
  onChangePlan: () => void;
}

export function CurrentPlanCard({ subscription, onChangePlan }: CurrentPlanCardProps) {
  const { tier, billingCycle, currentPeriodEnd, status, trialDaysRemaining } = subscription;

  const isTrialing = status === 'trialing';
  const price = billingCycle === 'yearly' ? (tier.priceYearly || 0) : tier.priceMonthly;

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[rgb(var(--border))]">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[rgb(var(--foreground))]">{tier.displayName}</h2>
              {isTrialing && (
                <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 text-xs font-medium rounded-full">
                  Trial ({trialDaysRemaining} days left)
                </span>
              )}
              {status === 'past_due' && (
                <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-xs font-medium rounded-full">
                  Past Due
                </span>
              )}
            </div>
            <p className="text-[rgb(var(--foreground-secondary))] mt-1">{tier.description}</p>
          </div>
          <Button onClick={onChangePlan}>
            Change Plan
          </Button>
        </div>
      </div>

      {/* Plan Details */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Price */}
          <div>
            <p className="text-sm text-[rgb(var(--foreground-secondary))] mb-1">Price</p>
            <p className="text-lg font-semibold text-[rgb(var(--foreground))]">
              {formatPrice(price)}
              <span className="text-sm font-normal text-[rgb(var(--foreground-secondary))]">
                /{billingCycle === 'yearly' ? 'year' : 'month'}
              </span>
            </p>
          </div>

          {/* Next Billing */}
          <div>
            <p className="text-sm text-[rgb(var(--foreground-secondary))] mb-1">
              {subscription.cancelAtPeriodEnd ? 'Access Until' : 'Next Billing'}
            </p>
            <p className="text-lg font-semibold text-[rgb(var(--foreground))] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[rgb(var(--foreground-secondary))]" />
              {new Date(currentPeriodEnd).toLocaleDateString()}
            </p>
          </div>

          {/* Brands */}
          <div>
            <p className="text-sm text-[rgb(var(--foreground-secondary))] mb-1">Brand Limit</p>
            <p className="text-lg font-semibold text-[rgb(var(--foreground))] flex items-center gap-2">
              <Globe className="w-4 h-4 text-[rgb(var(--foreground-secondary))]" />
              {tier.brandLimit} brands
            </p>
          </div>

          {/* Updates */}
          <div>
            <p className="text-sm text-[rgb(var(--foreground-secondary))] mb-1">Update Frequency</p>
            <p className="text-lg font-semibold text-[rgb(var(--foreground))] flex items-center gap-2 capitalize">
              <Clock className="w-4 h-4 text-[rgb(var(--foreground-secondary))]" />
              {tier.updateFrequency}
            </p>
          </div>
        </div>

        {/* Key Features */}
        <div className="mt-6 pt-6 border-t border-[rgb(var(--border))]">
          <p className="text-sm font-medium text-[rgb(var(--foreground))] mb-3">Key Features</p>
          <div className="flex flex-wrap gap-2">
            {tier.features
              .filter(f => f.included && f.highlight)
              .map((feature, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))] text-sm rounded-full"
                >
                  {feature.name}
                </span>
              ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
