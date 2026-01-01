'use client';

import { useState, useEffect } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
  Elements,
} from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { CreditCard, Wallet } from 'lucide-react';
import { TRIAL_DAYS, getTierById } from '@/lib/config/pricing';

type PaymentMethod = 'card' | 'paypal';

interface PaymentFormProps {
  tierId: string;
  billingCycle: 'monthly' | 'yearly';
  onSuccess: () => void;
  onError: (error: string) => void;
}

let stripePromise: Promise<Stripe | null> | null = null;

function getStripePromise() {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error('Stripe publishable key not found');
      return null;
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

function PaymentFormContent({ tierId, billingCycle, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card');
  const [isProcessing, setIsProcessing] = useState(false);

  const tier = getTierById(tierId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      if (selectedMethod === 'paypal') {
        // Redirect to PayPal
        const response = await fetch('/api/subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tierId,
            provider: 'paypal',
            billingCycle,
            returnUrl: `${window.location.origin}/onboarding/success`,
            cancelUrl: `${window.location.origin}/onboarding/payment`,
          }),
        });

        const data = await response.json();

        if (data.data?.approvalUrl) {
          window.location.href = data.data.approvalUrl;
        } else {
          onError(data.error || 'Failed to create PayPal subscription');
        }
      } else {
        // Stripe payment
        const { error, setupIntent } = await stripe.confirmSetup({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/onboarding/success`,
          },
          redirect: 'if_required',
        });

        if (error) {
          onError(error.message || 'Payment failed');
        } else if (setupIntent?.status === 'succeeded') {
          // Create subscription with the payment method
          const response = await fetch('/api/subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tierId,
              provider: 'stripe',
              billingCycle,
              paymentMethodId: setupIntent.payment_method,
            }),
          });

          const data = await response.json();

          if (data.success) {
            onSuccess();
          } else {
            onError(data.error || 'Failed to create subscription');
          }
        }
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const paymentMethods = [
    { id: 'card' as const, name: 'Card', icon: CreditCard, available: true },
    { id: 'paypal' as const, name: 'PayPal', icon: Wallet, available: true },
  ];

  const price = tier
    ? (billingCycle === 'yearly' ? tier.priceYearly : tier.priceMonthly)
    : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Summary */}
      <div
        className="p-4 rounded-lg"
        style={{ backgroundColor: 'rgb(var(--background))' }}
      >
        <h3 className="font-semibold mb-3" style={{ color: 'rgb(var(--foreground))' }}>
          Order Summary
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span style={{ color: 'rgb(var(--foreground-secondary))' }}>Plan</span>
            <span className="font-medium" style={{ color: 'rgb(var(--foreground))' }}>
              {tier?.displayName}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'rgb(var(--foreground-secondary))' }}>Billing</span>
            <span className="capitalize" style={{ color: 'rgb(var(--foreground))' }}>
              {billingCycle}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'rgb(var(--foreground-secondary))' }}>Trial Period</span>
            <span style={{ color: 'rgb(34, 197, 94)' }}>{TRIAL_DAYS} days free</span>
          </div>
          <div
            className="pt-2 mt-2"
            style={{ borderTop: '1px solid rgb(var(--border))' }}
          >
            <div className="flex justify-between">
              <span style={{ color: 'rgb(var(--foreground-secondary))' }}>Due Today</span>
              <span className="font-bold" style={{ color: 'rgb(var(--foreground))' }}>$0.00</span>
            </div>
            <div className="flex justify-between text-xs mt-1" style={{ color: 'rgb(var(--foreground-muted))' }}>
              <span>After trial</span>
              <span>${price}/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div>
        <label
          className="block text-sm font-medium mb-3"
          style={{ color: 'rgb(var(--foreground))' }}
        >
          Payment Method
        </label>
        <div className="grid grid-cols-2 gap-2">
          {paymentMethods.filter(m => m.available).map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => setSelectedMethod(method.id)}
              className="flex flex-col items-center gap-2 p-3 rounded-lg transition-all"
              style={{
                border: selectedMethod === method.id
                  ? '2px solid rgb(var(--primary))'
                  : '1px solid rgb(var(--border))',
                backgroundColor: selectedMethod === method.id
                  ? 'rgba(var(--primary), 0.05)'
                  : 'transparent',
              }}
            >
              <method.icon
                className="w-5 h-5"
                style={{
                  color: selectedMethod === method.id
                    ? 'rgb(var(--primary))'
                    : 'rgb(var(--foreground-secondary))',
                }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: 'rgb(var(--foreground))' }}
              >
                {method.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Stripe Payment Element */}
      {selectedMethod === 'card' && (
        <div
          className="p-4 rounded-lg"
          style={{ border: '1px solid rgb(var(--border))' }}
        >
          <PaymentElement
            options={{
              layout: 'tabs',
            }}
          />
        </div>
      )}

      {/* PayPal Notice */}
      {selectedMethod === 'paypal' && (
        <div
          className="p-4 rounded-lg text-center"
          style={{ border: '1px solid rgb(var(--border))' }}
        >
          <Wallet className="w-12 h-12 mx-auto mb-2" style={{ color: '#003087' }} />
          <p className="text-sm" style={{ color: 'rgb(var(--foreground-secondary))' }}>
            You'll be redirected to PayPal to complete your subscription setup.
          </p>
        </div>
      )}

      {/* Terms */}
      <p className="text-xs" style={{ color: 'rgb(var(--foreground-muted))' }}>
        By clicking "Start Free Trial", you agree to our{' '}
        <a href="/terms" style={{ color: 'rgb(var(--primary))' }} className="hover:underline">
          Terms of Service
        </a>
        {' '}and{' '}
        <a href="/privacy" style={{ color: 'rgb(var(--primary))' }} className="hover:underline">
          Privacy Policy
        </a>
        . Your card will be charged ${price} after your {TRIAL_DAYS}-day trial ends unless you cancel.
      </p>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: 'rgb(var(--primary))',
          color: 'white',
        }}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </span>
        ) : (
          'Start Free Trial'
        )}
      </button>
    </form>
  );
}

export function PaymentForm(props: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create setup intent
    fetch('/api/payments/stripe/create-setup-intent', {
      method: 'POST',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.data?.clientSecret) {
          setClientSecret(data.data.clientSecret);
        } else {
          setError(data.error || 'Failed to initialize payment');
        }
      })
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  if (error) {
    return (
      <div
        className="p-4 rounded-lg text-center"
        style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
      >
        <p className="text-sm" style={{ color: 'rgb(239, 68, 68)' }}>{error}</p>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <div
          className="animate-spin w-8 h-8 border-2 rounded-full"
          style={{ borderColor: 'rgb(var(--primary))', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  const stripePromise = getStripePromise();

  if (!stripePromise) {
    return (
      <div
        className="p-4 rounded-lg text-center"
        style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
      >
        <p className="text-sm" style={{ color: 'rgb(239, 68, 68)' }}>
          Payment system is not configured
        </p>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#2563eb',
            colorBackground: '#ffffff',
            colorText: '#1f2937',
            fontFamily: 'Inter, system-ui, sans-serif',
            borderRadius: '8px',
          },
        },
      }}
    >
      <PaymentFormContent {...props} />
    </Elements>
  );
}

export default PaymentForm;
