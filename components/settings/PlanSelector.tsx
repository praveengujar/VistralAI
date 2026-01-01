'use client';

import { useState } from 'react';
import { X, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PRICING_TIERS, formatPrice } from '@/lib/config/pricing';
import { useProrationPreview, useChangeSubscription } from '@/lib/hooks/useSubscriptionManagement';

interface PlanSelectorProps {
  currentTierId: string;
  currentBillingCycle: 'monthly' | 'yearly';
  onClose: () => void;
}

export function PlanSelector({
  currentTierId,
  currentBillingCycle,
  onClose,
}: PlanSelectorProps) {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'yearly'>(currentBillingCycle);
  const [step, setStep] = useState<'select' | 'confirm'>('select');

  const { data: preview, isLoading: isLoadingPreview } = useProrationPreview(
    selectedTier,
    selectedBillingCycle
  );

  const { mutate: changeSubscription, isPending: isChanging } = useChangeSubscription();

  const handleSelectPlan = (tierId: string) => {
    if (tierId === currentTierId && selectedBillingCycle === currentBillingCycle) {
      return; // Same plan
    }
    setSelectedTier(tierId);
    setStep('confirm');
  };

  const handleConfirm = () => {
    if (!selectedTier) return;
    changeSubscription(
      { newTierId: selectedTier, newBillingCycle: selectedBillingCycle },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-[rgb(var(--background))]">
        {/* Header */}
        <div className="p-4 border-b border-[rgb(var(--border))] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">
            {step === 'select' ? 'Change Your Plan' : 'Confirm Change'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-[rgb(var(--surface-hover))] rounded">
            <X className="w-5 h-5 text-[rgb(var(--foreground-secondary))]" />
          </button>
        </div>

        {step === 'select' ? (
          <>
            {/* Billing Toggle */}
            <div className="p-4 border-b border-[rgb(var(--border))]">
              <div className="flex items-center justify-center gap-4">
                <span className={`text-sm ${selectedBillingCycle === 'monthly' ? 'text-[rgb(var(--foreground))] font-medium' : 'text-[rgb(var(--foreground-secondary))]'}`}>
                  Monthly
                </span>
                <button
                  onClick={() => setSelectedBillingCycle(selectedBillingCycle === 'monthly' ? 'yearly' : 'monthly')}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    selectedBillingCycle === 'yearly' ? 'bg-[rgb(var(--primary))]' : 'bg-[rgb(var(--border))]'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                      selectedBillingCycle === 'yearly' ? 'translate-x-8' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm ${selectedBillingCycle === 'yearly' ? 'text-[rgb(var(--foreground))] font-medium' : 'text-[rgb(var(--foreground-secondary))]'}`}>
                  Yearly
                </span>
                {selectedBillingCycle === 'yearly' && (
                  <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-xs font-medium rounded-full">
                    Save ~17%
                  </span>
                )}
              </div>
            </div>

            {/* Plans Grid */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PRICING_TIERS.map((tier) => {
                  const isCurrent = tier.id === currentTierId && selectedBillingCycle === currentBillingCycle;
                  const price = selectedBillingCycle === 'yearly' ? tier.priceYearly : tier.priceMonthly;
                  const monthlyEquivalent = selectedBillingCycle === 'yearly'
                    ? Math.round(tier.priceYearly / 12)
                    : tier.priceMonthly;

                  return (
                    <Card
                      key={tier.id}
                      className={`p-4 cursor-pointer transition-all ${
                        isCurrent
                          ? 'border-2 border-[rgb(var(--foreground-secondary))] bg-[rgb(var(--surface-hover))] opacity-60'
                          : 'hover:border-[rgb(var(--primary))]'
                      } ${tier.isPopular ? 'border-[rgb(var(--primary))]' : ''}`}
                      onClick={() => !isCurrent && handleSelectPlan(tier.id)}
                    >
                      {/* Badge */}
                      <div className="flex items-center justify-between mb-3">
                        {tier.isPopular && (
                          <span className="px-2 py-0.5 bg-[rgb(var(--primary))] text-white text-xs font-medium rounded">
                            Popular
                          </span>
                        )}
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-[rgb(var(--foreground-secondary))]/20 text-[rgb(var(--foreground-secondary))] text-xs font-medium rounded">
                            Current Plan
                          </span>
                        )}
                      </div>

                      {/* Plan Name & Price */}
                      <h3 className="text-lg font-bold text-[rgb(var(--foreground))]">{tier.displayName}</h3>
                      <div className="mt-2">
                        <span className="text-2xl font-bold text-[rgb(var(--foreground))]">${monthlyEquivalent}</span>
                        <span className="text-[rgb(var(--foreground-secondary))]">/month</span>
                      </div>
                      {selectedBillingCycle === 'yearly' && (
                        <p className="text-xs text-[rgb(var(--foreground-secondary))] mt-1">
                          ${price} billed yearly
                        </p>
                      )}

                      {/* Key Limits */}
                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[rgb(var(--foreground-secondary))]">Brands</span>
                          <span className="font-medium text-[rgb(var(--foreground))]">{tier.brandLimit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[rgb(var(--foreground-secondary))]">Updates</span>
                          <span className="font-medium text-[rgb(var(--foreground))] capitalize">{tier.updateFrequency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[rgb(var(--foreground-secondary))]">Team Seats</span>
                          <span className="font-medium text-[rgb(var(--foreground))]">
                            {tier.teamSeatLimit === -1 ? 'Unlimited' : tier.teamSeatLimit}
                          </span>
                        </div>
                      </div>

                      {/* Select Button */}
                      {!isCurrent && (
                        <Button className="w-full mt-4" variant={tier.isPopular ? 'default' : 'secondary'}>
                          Select
                        </Button>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          /* Confirmation Step */
          <div className="p-6">
            {isLoadingPreview ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--primary))]" />
              </div>
            ) : preview ? (
              <div className="space-y-6">
                {/* Change Summary */}
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <p className="text-sm text-[rgb(var(--foreground-secondary))]">Current Plan</p>
                    <p className="font-semibold text-[rgb(var(--foreground))]">{preview.currentPlan.name}</p>
                    <p className="text-sm text-[rgb(var(--foreground-secondary))]">
                      {formatPrice(preview.currentPlan.price)}/{preview.currentPlan.billingCycle}
                    </p>
                  </div>

                  <div className={`p-2 rounded-full ${preview.isUpgrade ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                    {preview.isUpgrade ? (
                      <ArrowUpRight className="w-6 h-6 text-green-500" />
                    ) : (
                      <ArrowDownRight className="w-6 h-6 text-yellow-500" />
                    )}
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-[rgb(var(--foreground-secondary))]">New Plan</p>
                    <p className="font-semibold text-[rgb(var(--foreground))]">{preview.newPlan.name}</p>
                    <p className="text-sm text-[rgb(var(--foreground-secondary))]">
                      {formatPrice(preview.newPlan.price)}/{preview.newPlan.billingCycle}
                    </p>
                  </div>
                </div>

                {/* Proration Details (for upgrades) */}
                {preview.isUpgrade && (
                  <Card className="p-4 bg-[rgb(var(--surface))]">
                    <h4 className="font-medium text-[rgb(var(--foreground))] mb-3">Proration Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[rgb(var(--foreground-secondary))]">Credit from current plan</span>
                        <span className="text-green-500">-{formatPrice(preview.proration.credit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[rgb(var(--foreground-secondary))]">Charge for new plan</span>
                        <span className="text-[rgb(var(--foreground))]">{formatPrice(preview.proration.charge)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-[rgb(var(--border))]">
                        <span className="font-medium text-[rgb(var(--foreground))]">Due Today</span>
                        <span className="font-bold text-[rgb(var(--foreground))]">
                          {formatPrice(preview.proration.immediateCharge)}
                        </span>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Effective Date */}
                <div className={`p-4 rounded-lg ${preview.isUpgrade ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                  <p className="text-sm">
                    {preview.isUpgrade ? (
                      <>
                        <span className="font-medium">Immediate Change:</span>{' '}
                        Your new plan takes effect immediately. You&apos;ll be charged the prorated amount today.
                      </>
                    ) : (
                      <>
                        <span className="font-medium">Scheduled Change:</span>{' '}
                        Your plan will change on {new Date(preview.effectiveDate).toLocaleDateString()}.
                        You&apos;ll continue with your current features until then.
                      </>
                    )}
                  </p>
                </div>

                {/* Next Billing */}
                <div className="text-sm text-[rgb(var(--foreground-secondary))] text-center">
                  Next billing: {formatPrice(preview.nextBillingAmount)} on{' '}
                  {new Date(preview.nextBillingDate).toLocaleDateString()}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setStep('select')}>
                    Back
                  </Button>
                  <Button className="flex-1" onClick={handleConfirm} disabled={isChanging}>
                    {isChanging ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {preview.isUpgrade ? 'Confirm Upgrade' : 'Schedule Change'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-red-500">Unable to calculate preview. Please try again.</p>
                <Button variant="outline" className="mt-4" onClick={() => setStep('select')}>
                  Back
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
