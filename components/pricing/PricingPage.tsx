'use client';

import { useState } from 'react';
import { Check, X, Star, Zap, Building2 } from 'lucide-react';
import { PRICING_TIERS, TRIAL_DAYS, calculateYearlySavings } from '@/lib/config/pricing';

interface PricingPageProps {
  onSelectTier: (tierId: string, billingCycle: 'monthly' | 'yearly') => void;
  currentTierId?: string;
}

export function PricingPage({ onSelectTier, currentTierId }: PricingPageProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const tierIcons: Record<string, React.ReactNode> = {
    monitor: <Star className="w-6 h-6" />,
    growth: <Zap className="w-6 h-6" />,
    dominance: <Building2 className="w-6 h-6" />,
  };

  const tierColors: Record<string, string> = {
    monitor: 'rgb(var(--foreground-secondary))',
    growth: 'rgb(var(--primary))',
    dominance: '#8b5cf6',
  };

  return (
    <div className="py-12 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4" style={{ color: 'rgb(var(--foreground))' }}>
          Choose Your Plan
        </h1>
        <p className="text-lg max-w-2xl mx-auto" style={{ color: 'rgb(var(--foreground-secondary))' }}>
          Start with a {TRIAL_DAYS}-day free trial. No commitment, cancel anytime.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 mb-10">
        <span
          className={`text-sm ${billingCycle === 'monthly' ? 'font-medium' : ''}`}
          style={{ color: billingCycle === 'monthly' ? 'rgb(var(--foreground))' : 'rgb(var(--foreground-secondary))' }}
        >
          Monthly
        </span>
        <button
          onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
          className="relative w-14 h-7 rounded-full transition-colors"
          style={{ backgroundColor: billingCycle === 'yearly' ? 'rgb(var(--primary))' : 'rgb(var(--border))' }}
        >
          <span
            className="absolute top-1 w-5 h-5 rounded-full bg-white transition-transform"
            style={{ transform: billingCycle === 'yearly' ? 'translateX(32px)' : 'translateX(4px)' }}
          />
        </button>
        <span
          className={`text-sm ${billingCycle === 'yearly' ? 'font-medium' : ''}`}
          style={{ color: billingCycle === 'yearly' ? 'rgb(var(--foreground))' : 'rgb(var(--foreground-secondary))' }}
        >
          Yearly
        </span>
        {billingCycle === 'yearly' && (
          <span
            className="px-2 py-1 text-xs font-medium rounded-full"
            style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'rgb(34, 197, 94)' }}
          >
            Save up to 17%
          </span>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {PRICING_TIERS.map((tier) => {
          const price = billingCycle === 'yearly' ? tier.priceYearly : tier.priceMonthly;
          const monthlyEquivalent = billingCycle === 'yearly' ? Math.round(tier.priceYearly / 12) : tier.priceMonthly;
          const { percentage } = calculateYearlySavings(tier);
          const isCurrentPlan = currentTierId === tier.id;
          const isPopular = tier.isPopular;

          return (
            <div
              key={tier.id}
              className="relative overflow-hidden rounded-lg"
              style={{
                backgroundColor: 'rgb(var(--surface))',
                border: isPopular ? '2px solid rgb(var(--primary))' : '1px solid rgb(var(--border))',
                boxShadow: isPopular ? '0 0 0 4px rgba(var(--primary), 0.1)' : undefined,
              }}
            >
              {/* Popular Badge */}
              {isPopular && (
                <div
                  className="absolute top-0 right-0 px-4 py-1 text-xs font-medium rounded-bl-lg"
                  style={{ backgroundColor: 'rgb(var(--primary))', color: 'white' }}
                >
                  Most Popular
                </div>
              )}

              {/* Header */}
              <div className="p-6" style={{ borderBottom: '1px solid rgb(var(--border))' }}>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${tierColors[tier.id]}20`, color: tierColors[tier.id] }}
                >
                  {tierIcons[tier.id]}
                </div>
                <h3 className="text-xl font-bold" style={{ color: 'rgb(var(--foreground))' }}>
                  {tier.displayName}
                </h3>
                <p className="text-sm mt-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>
                  {tier.tagline}
                </p>

                {/* Price */}
                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold" style={{ color: 'rgb(var(--foreground))' }}>
                      ${monthlyEquivalent}
                    </span>
                    <span style={{ color: 'rgb(var(--foreground-secondary))' }}>/month</span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <p className="text-sm mt-1" style={{ color: 'rgb(34, 197, 94)' }}>
                      ${price}/year (save {percentage}%)
                    </p>
                  )}
                </div>

                {/* Target Audience */}
                <p className="text-xs mt-3" style={{ color: 'rgb(var(--foreground-muted))' }}>
                  {tier.targetAudience}
                </p>
              </div>

              {/* Key Limits */}
              <div className="p-4" style={{ backgroundColor: 'rgb(var(--background))' }}>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p style={{ color: 'rgb(var(--foreground-secondary))' }}>Brands</p>
                    <p className="font-semibold" style={{ color: 'rgb(var(--foreground))' }}>{tier.brandLimit}</p>
                  </div>
                  <div>
                    <p style={{ color: 'rgb(var(--foreground-secondary))' }}>Updates</p>
                    <p className="font-semibold capitalize" style={{ color: 'rgb(var(--foreground))' }}>{tier.updateFrequency}</p>
                  </div>
                  <div>
                    <p style={{ color: 'rgb(var(--foreground-secondary))' }}>Team Seats</p>
                    <p className="font-semibold" style={{ color: 'rgb(var(--foreground))' }}>
                      {tier.teamSeatLimit === -1 ? 'Unlimited' : tier.teamSeatLimit}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: 'rgb(var(--foreground-secondary))' }}>Competitors</p>
                    <p className="font-semibold" style={{ color: 'rgb(var(--foreground))' }}>
                      {tier.competitorLimitPerBrand || 'None'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="p-6">
                <ul className="space-y-3">
                  {tier.features.slice(0, 8).map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check
                          className="w-5 h-5 flex-shrink-0"
                          style={{ color: feature.highlight ? 'rgb(var(--primary))' : 'rgb(34, 197, 94)' }}
                        />
                      ) : (
                        <X className="w-5 h-5 flex-shrink-0" style={{ color: 'rgb(var(--foreground-muted))' }} />
                      )}
                      <div className="flex-1">
                        <span
                          className="text-sm"
                          style={{ color: feature.included ? 'rgb(var(--foreground))' : 'rgb(var(--foreground-muted))' }}
                        >
                          {feature.name}
                        </span>
                        {feature.limit && feature.included && (
                          <span className="text-xs ml-1" style={{ color: 'rgb(var(--primary))' }}>
                            ({feature.limit})
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                {tier.features.length > 8 && (
                  <p className="text-xs mt-3" style={{ color: 'rgb(var(--foreground-muted))' }}>
                    +{tier.features.length - 8} more features
                  </p>
                )}
              </div>

              {/* CTA */}
              <div className="p-6 pt-0">
                <button
                  onClick={() => onSelectTier(tier.id, billingCycle)}
                  disabled={isCurrentPlan}
                  className="w-full py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: isPopular ? 'rgb(var(--primary))' : 'rgb(var(--surface))',
                    color: isPopular ? 'white' : 'rgb(var(--foreground))',
                    border: isPopular ? 'none' : '1px solid rgb(var(--border))',
                  }}
                >
                  {isCurrentPlan ? 'Current Plan' : tier.ctaText}
                </button>
                <p className="text-xs text-center mt-2" style={{ color: 'rgb(var(--foreground-muted))' }}>
                  {TRIAL_DAYS}-day free trial • No credit card charged today
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ / Trust Signals */}
      <div className="mt-16 text-center">
        <p style={{ color: 'rgb(var(--foreground-secondary))' }}>
          Questions? Contact us at{' '}
          <a href="mailto:support@vistral.ai" style={{ color: 'rgb(var(--primary))' }} className="hover:underline">
            support@vistral.ai
          </a>
        </p>
      </div>
    </div>
  );
}

export default PricingPage;
