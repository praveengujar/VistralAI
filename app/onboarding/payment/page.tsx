'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Shield, Clock, CreditCard } from 'lucide-react';
import { PaymentForm } from '@/components/payments/PaymentForm';
import { getTierById, TRIAL_DAYS } from '@/lib/config/pricing';

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tierId = searchParams.get('tier') || 'growth';
  const billingCycle = (searchParams.get('billing') || 'monthly') as 'monthly' | 'yearly';

  const [error, setError] = useState<string | null>(null);
  const tier = getTierById(tierId);

  const handleSuccess = () => {
    router.push('/onboarding/success');
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (!tier) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(var(--background))' }}>
        <p style={{ color: 'rgb(var(--foreground-secondary))' }}>Invalid tier selected</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(var(--background))' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid rgb(var(--border))' }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:opacity-80"
            style={{ color: 'rgb(var(--foreground-secondary))' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'rgb(var(--foreground-secondary))' }}>
            <Shield className="w-4 h-4" />
            Secure checkout
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'rgb(var(--foreground))' }}>
            Complete Your Setup
          </h1>
          <p style={{ color: 'rgb(var(--foreground-secondary))' }}>
            Start your {TRIAL_DAYS}-day free trial of {tier.displayName}
          </p>
        </div>

        {/* Trust Signals */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <div className="flex items-center gap-2 text-sm" style={{ color: 'rgb(var(--foreground-secondary))' }}>
            <Clock className="w-4 h-4" style={{ color: 'rgb(34, 197, 94)' }} />
            <span>{TRIAL_DAYS}-day free trial</span>
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'rgb(var(--foreground-secondary))' }}>
            <CreditCard className="w-4 h-4" style={{ color: 'rgb(34, 197, 94)' }} />
            <span>Cancel anytime</span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div
            className="mb-6 p-4 rounded-lg"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
          >
            <p className="text-sm" style={{ color: 'rgb(239, 68, 68)' }}>{error}</p>
          </div>
        )}

        {/* Payment Form */}
        <PaymentForm
          tierId={tierId}
          billingCycle={billingCycle}
          onSuccess={handleSuccess}
          onError={handleError}
        />

        {/* Additional Info */}
        <div
          className="mt-8 p-4 rounded-lg"
          style={{ backgroundColor: 'rgb(var(--surface))' }}
        >
          <h3 className="font-medium mb-2" style={{ color: 'rgb(var(--foreground))' }}>
            What happens next?
          </h3>
          <ul className="space-y-2 text-sm" style={{ color: 'rgb(var(--foreground-secondary))' }}>
            <li className="flex items-start gap-2">
              <span style={{ color: 'rgb(34, 197, 94)' }}>✓</span>
              Your {TRIAL_DAYS}-day free trial starts immediately
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: 'rgb(34, 197, 94)' }}>✓</span>
              Full access to all {tier.displayName} features
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: 'rgb(34, 197, 94)' }}>✓</span>
              We'll remind you before your trial ends
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: 'rgb(34, 197, 94)' }}>✓</span>
              Cancel anytime with no penalty
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default function OnboardingPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(var(--background))' }}>
          <div
            className="animate-spin w-8 h-8 border-2 rounded-full"
            style={{ borderColor: 'rgb(var(--primary))', borderTopColor: 'transparent' }}
          />
        </div>
      }
    >
      <PaymentPageContent />
    </Suspense>
  );
}
