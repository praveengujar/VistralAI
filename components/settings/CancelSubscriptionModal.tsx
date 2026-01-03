'use client';

import { useState } from 'react';
import { X, AlertTriangle, Gift, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCancelSubscription } from '@/lib/hooks/useSubscriptionManagement';

interface CancelSubscriptionModalProps {
  subscription: {
    currentPeriodEnd: string;
    tier: {
      displayName: string;
    };
  };
  onClose: () => void;
}

const CANCEL_REASONS = [
  { id: 'too_expensive', label: 'Too expensive' },
  { id: 'not_using', label: 'Not using it enough' },
  { id: 'missing_features', label: 'Missing features I need' },
  { id: 'found_alternative', label: 'Found a better alternative' },
  { id: 'temporary', label: 'Temporary pause (coming back later)' },
  { id: 'other', label: 'Other' },
];

export function CancelSubscriptionModal({
  subscription,
  onClose,
}: CancelSubscriptionModalProps) {
  const [step, setStep] = useState<'reason' | 'offer' | 'confirm'>('reason');
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [feedback, setFeedback] = useState('');

  const { mutate: cancelSubscription, isPending } = useCancelSubscription();

  const handleCancel = () => {
    cancelSubscription(
      { reason: selectedReason, feedback },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const showOffer = selectedReason === 'too_expensive';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <Card className="w-full max-w-lg bg-[rgb(var(--background))]">
        {/* Header */}
        <div className="p-4 border-b border-[rgb(var(--border))] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">Cancel Subscription</h2>
          <button onClick={onClose} className="p-1 hover:bg-[rgb(var(--surface-hover))] rounded">
            <X className="w-5 h-5 text-[rgb(var(--foreground-secondary))]" />
          </button>
        </div>

        {step === 'reason' && (
          <div className="p-6 space-y-6">
            <div className="flex items-start gap-3 p-4 bg-yellow-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-[rgb(var(--foreground))]">We&apos;re sorry to see you go</p>
                <p className="text-sm text-[rgb(var(--foreground-secondary))] mt-1">
                  Your access continues until {new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
                </p>
              </div>
            </div>

            <div>
              <p className="font-medium text-[rgb(var(--foreground))] mb-3">Why are you canceling?</p>
              <div className="space-y-2">
                {CANCEL_REASONS.map((reason) => (
                  <label
                    key={reason.id}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedReason === reason.id
                        ? 'border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/5'
                        : 'border-[rgb(var(--border))] hover:border-[rgb(var(--primary))]/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cancelReason"
                      value={reason.id}
                      checked={selectedReason === reason.id}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="sr-only"
                    />
                    <span className="text-sm text-[rgb(var(--foreground))]">{reason.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-2">
                Additional feedback (optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us more about your experience..."
                className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] resize-none focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Keep Subscription
              </Button>
              <Button
                variant="destructive"
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                disabled={!selectedReason}
                onClick={() => setStep(showOffer ? 'offer' : 'confirm')}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 'offer' && (
          <div className="p-6 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[rgb(var(--primary))]/10 flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-[rgb(var(--primary))]" />
              </div>
              <h3 className="text-xl font-bold text-[rgb(var(--foreground))]">Wait! Special offer for you</h3>
              <p className="text-[rgb(var(--foreground-secondary))] mt-2">
                We&apos;d love to keep you. How about 20% off your next 3 months?
              </p>
            </div>

            <Card className="p-4 bg-[rgb(var(--primary))]/5 border-[rgb(var(--primary))]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[rgb(var(--foreground))]">20% Discount</p>
                  <p className="text-sm text-[rgb(var(--foreground-secondary))]">
                    On your next 3 billing cycles
                  </p>
                </div>
                <p className="text-2xl font-bold text-[rgb(var(--primary))]">20% OFF</p>
              </div>
            </Card>

            <div className="flex gap-3">
              <Button className="flex-1" onClick={onClose}>
                Accept Offer
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-red-500 border-red-500/30"
                onClick={() => setStep('confirm')}
              >
                No thanks, cancel
              </Button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="p-6 space-y-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[rgb(var(--foreground))]">Confirm Cancellation</h3>
              <p className="text-[rgb(var(--foreground-secondary))] mt-2">
                Are you sure you want to cancel your {subscription.tier.displayName} subscription?
              </p>
            </div>

            <div className="p-4 bg-[rgb(var(--surface))] rounded-lg">
              <p className="text-sm text-[rgb(var(--foreground-secondary))]">
                • Your subscription remains active until{' '}
                <span className="font-medium text-[rgb(var(--foreground))]">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              </p>
              <p className="text-sm text-[rgb(var(--foreground-secondary))] mt-2">
                • You won&apos;t be charged again unless you resubscribe
              </p>
              <p className="text-sm text-[rgb(var(--foreground-secondary))] mt-2">
                • You can reactivate anytime before your period ends
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep('reason')}>
                Go Back
              </Button>
              <Button
                variant="destructive"
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                onClick={handleCancel}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Confirm Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
