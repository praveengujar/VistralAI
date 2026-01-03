'use client';

import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import {
  PRICING_TIERS,
  TRIAL_DAYS,
  calculateYearlySavings,
  formatPriceDollars,
  type PricingTierConfig,
} from '@/lib/config/pricing';

interface PlanStepProps {
  selectedTierId: string | null;
  selectedBillingCycle: 'monthly' | 'yearly';
  onSelectPlan: (tierId: string, billingCycle: 'monthly' | 'yearly') => void;
}

export function PlanStep({
  selectedTierId,
  selectedBillingCycle,
  onSelectPlan,
}: PlanStepProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(selectedBillingCycle);

  const handleTierSelect = (tier: PricingTierConfig) => {
    onSelectPlan(tier.id, billingCycle);
  };

  const handleBillingToggle = (cycle: 'monthly' | 'yearly') => {
    setBillingCycle(cycle);
    if (selectedTierId) {
      onSelectPlan(selectedTierId, cycle);
    }
  };

  return (
    <div className="space-y-8">
      {/* Trial Banner */}
      <div className="bg-gradient-to-r from-[rgb(var(--primary))]/10 to-[rgb(var(--primary))]/5 border border-[rgb(var(--primary))]/20 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-[rgb(var(--primary))]" />
          <div>
            <p className="font-medium text-[rgb(var(--foreground))]">
              Start with a {TRIAL_DAYS}-day free trial
            </p>
            <p className="text-sm text-[rgb(var(--foreground-secondary))]">
              No charges until your trial ends. Cancel anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => handleBillingToggle('monthly')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            billingCycle === 'monthly'
              ? 'bg-[rgb(var(--primary))] text-white'
              : 'bg-[rgb(var(--surface-hover))] text-[rgb(var(--foreground-secondary))] hover:text-[rgb(var(--foreground))]'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => handleBillingToggle('yearly')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            billingCycle === 'yearly'
              ? 'bg-[rgb(var(--primary))] text-white'
              : 'bg-[rgb(var(--surface-hover))] text-[rgb(var(--foreground-secondary))] hover:text-[rgb(var(--foreground))]'
          }`}
        >
          Yearly
          <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
            Save up to 18%
          </span>
        </button>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PRICING_TIERS.map((tier) => {
          const isSelected = selectedTierId === tier.id;
          const price = billingCycle === 'monthly' ? tier.priceMonthly : tier.priceYearly;
          const savings = calculateYearlySavings(tier);
          const monthlyEquivalent = billingCycle === 'yearly'
            ? Math.round(tier.priceYearly / 12)
            : tier.priceMonthly;

          return (
            <Card
              key={tier.id}
              className={`relative p-6 cursor-pointer transition-all hover:shadow-lg ${
                isSelected
                  ? 'ring-2 ring-[rgb(var(--primary))] border-[rgb(var(--primary))]'
                  : 'hover:border-[rgb(var(--primary))]/50'
              } ${tier.isPopular ? 'border-[rgb(var(--primary))]' : ''}`}
              onClick={() => handleTierSelect(tier)}
            >
              {/* Popular Badge */}
              {tier.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-[rgb(var(--primary))] text-white text-xs font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Selected Check */}
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 rounded-full bg-[rgb(var(--primary))] flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              {/* Tier Name */}
              <h3 className="text-lg font-bold text-[rgb(var(--foreground))] mb-1">
                {tier.displayName}
              </h3>
              <p className="text-sm text-[rgb(var(--foreground-secondary))] mb-4">
                {tier.tagline}
              </p>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-[rgb(var(--foreground))]">
                    {formatPriceDollars(monthlyEquivalent)}
                  </span>
                  <span className="text-[rgb(var(--foreground-secondary))]">/mo</span>
                </div>
                {billingCycle === 'yearly' && (
                  <p className="text-sm text-green-600 mt-1">
                    Save {savings.percentage}% ({formatPriceDollars(savings.saved)}/year)
                  </p>
                )}
              </div>

              {/* Key Features */}
              <ul className="space-y-3">
                {tier.features.slice(0, 6).filter(f => f.included).map((feature) => (
                  <li key={feature.name} className="flex items-start gap-2">
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      feature.highlight ? 'text-[rgb(var(--primary))]' : 'text-green-500'
                    }`} />
                    <span className="text-sm text-[rgb(var(--foreground-secondary))]">
                      {feature.name}
                      {feature.limit && (
                        <span className="text-[rgb(var(--foreground))] font-medium ml-1">
                          ({feature.limit})
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Target Audience */}
              <p className="mt-4 pt-4 border-t border-[rgb(var(--border))] text-xs text-[rgb(var(--foreground-secondary))]">
                Best for: {tier.targetAudience}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default PlanStep;
