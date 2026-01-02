'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Loader2, Shield, CreditCard, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TRIAL_DAYS, getTierById, formatPriceDollars } from '@/lib/config/pricing';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentStepProps {
  tierId: string;
  billingCycle: 'monthly' | 'yearly';
  clientSecret: string | null;
  onPaymentSuccess: (paymentMethodId: string) => void;
  onError: (error: string) => void;
  isProcessing: boolean;
}

function PaymentForm({
  tierId,
  billingCycle,
  onPaymentSuccess,
  onError,
  isProcessing,
}: Omit<PaymentStepProps, 'clientSecret'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tier = getTierById(tierId);
  const price = tier
    ? billingCycle === 'monthly'
      ? tier.priceMonthly
      : tier.priceYearly
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/onboarding/brand`,
        },
        redirect: 'if_required',
      });

      if (error) {
        onError(error.message || 'Payment failed');
        setIsSubmitting(false);
        return;
      }

      if (setupIntent?.payment_method) {
        onPaymentSuccess(setupIntent.payment_method as string);
      } else {
        onError('Failed to setup payment method');
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Summary */}
      <Card className="p-4 bg-[rgb(var(--surface-hover))]">
        <h3 className="font-medium text-[rgb(var(--foreground))] mb-3">Order Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[rgb(var(--foreground-secondary))]">
              {tier?.displayName} Plan
            </span>
            <span className="text-[rgb(var(--foreground))]">
              {formatPriceDollars(price)}/{billingCycle === 'monthly' ? 'mo' : 'yr'}
            </span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>{TRIAL_DAYS}-day free trial</span>
            <span>-{formatPriceDollars(billingCycle === 'monthly' ? price : price / 12)}</span>
          </div>
          <div className="pt-2 border-t border-[rgb(var(--border))] flex justify-between font-medium">
            <span className="text-[rgb(var(--foreground))]">Due today</span>
            <span className="text-[rgb(var(--foreground))]">$0.00</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-[rgb(var(--foreground-secondary))]">
          Your card will be charged {formatPriceDollars(price)} after your {TRIAL_DAYS}-day trial ends.
        </p>
      </Card>

      {/* Payment Element */}
      <div className="space-y-4">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {/* Security Info */}
      <div className="flex items-center gap-4 p-4 bg-[rgb(var(--surface-hover))] rounded-lg">
        <Shield className="w-5 h-5 text-green-500 flex-shrink-0" />
        <div className="text-sm">
          <p className="text-[rgb(var(--foreground))] font-medium">Secure Payment</p>
          <p className="text-[rgb(var(--foreground-secondary))]">
            Your payment info is encrypted and secure. Cancel anytime.
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!stripe || isSubmitting || isProcessing}
      >
        {isSubmitting || isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 mr-2" />
            Start Free Trial
          </>
        )}
      </Button>

      <p className="text-center text-xs text-[rgb(var(--foreground-secondary))]">
        By confirming, you agree to our Terms of Service and Privacy Policy.
      </p>
    </form>
  );
}

export function PaymentStep({
  tierId,
  billingCycle,
  clientSecret,
  onPaymentSuccess,
  onError,
  isProcessing,
}: PaymentStepProps) {
  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--primary))]" />
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary: 'rgb(99, 102, 241)',
            colorBackground: 'rgb(30, 41, 59)',
            colorText: 'rgb(248, 250, 252)',
            colorTextSecondary: 'rgb(148, 163, 184)',
            colorDanger: 'rgb(239, 68, 68)',
            fontFamily: 'system-ui, sans-serif',
            borderRadius: '8px',
            spacingUnit: '4px',
          },
          rules: {
            '.Input': {
              backgroundColor: 'rgb(30, 41, 59)',
              border: '1px solid rgb(71, 85, 105)',
              color: 'rgb(248, 250, 252)',
            },
            '.Input:focus': {
              border: '1px solid rgb(99, 102, 241)',
              boxShadow: '0 0 0 1px rgb(99, 102, 241)',
            },
            '.Label': {
              color: 'rgb(148, 163, 184)',
            },
            '.Tab': {
              backgroundColor: 'rgb(30, 41, 59)',
              border: '1px solid rgb(71, 85, 105)',
              color: 'rgb(248, 250, 252)',
            },
            '.Tab--selected': {
              backgroundColor: 'rgb(51, 65, 85)',
              border: '1px solid rgb(99, 102, 241)',
            },
            '.Tab:hover': {
              backgroundColor: 'rgb(51, 65, 85)',
            },
          },
        },
      }}
    >
      <PaymentForm
        tierId={tierId}
        billingCycle={billingCycle}
        onPaymentSuccess={onPaymentSuccess}
        onError={onError}
        isProcessing={isProcessing}
      />
    </Elements>
  );
}

export default PaymentStep;
