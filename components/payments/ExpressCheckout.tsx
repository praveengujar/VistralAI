'use client';

import { useState, useCallback } from 'react';
import {
  ExpressCheckoutElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import type {
  StripeExpressCheckoutElementConfirmEvent,
  StripeExpressCheckoutElementReadyEvent,
} from '@stripe/stripe-js';

interface ExpressCheckoutProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  tierId: string;
  billingCycle: 'monthly' | 'yearly';
}

export function ExpressCheckout({
  onSuccess,
  onError,
  tierId,
  billingCycle,
}: ExpressCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const onReady = useCallback((event: StripeExpressCheckoutElementReadyEvent) => {
    // Check if any wallets are available
    if (event.availablePaymentMethods) {
      const hasWallets =
        event.availablePaymentMethods.applePay ||
        event.availablePaymentMethods.googlePay ||
        event.availablePaymentMethods.link;
      setIsReady(hasWallets);
    }
  }, []);

  const onConfirm = useCallback(
    async (event: StripeExpressCheckoutElementConfirmEvent) => {
      if (!stripe || !elements) return;

      setIsProcessing(true);

      try {
        // Confirm the setup with the wallet payment method
        const { error, setupIntent } = await stripe.confirmSetup({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/onboarding/success`,
          },
          redirect: 'if_required',
        });

        if (error) {
          onError(error.message || 'Payment failed');
          return;
        }

        if (setupIntent?.status === 'succeeded') {
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
      } catch (err) {
        onError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsProcessing(false);
      }
    },
    [stripe, elements, tierId, billingCycle, onSuccess, onError]
  );

  // Don't render if no wallets available
  if (!isReady && !isProcessing) {
    return (
      <div className="mb-4">
        <ExpressCheckoutElement
          onReady={onReady}
          onConfirm={onConfirm}
          options={{
            buttonType: {
              applePay: 'subscribe',
              googlePay: 'subscribe',
            },
            buttonHeight: 48,
            layout: {
              maxRows: 1,
              maxColumns: 2,
            },
          }}
        />
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div
        className="p-4 rounded-lg"
        style={{ border: '1px solid rgb(var(--border))' }}
      >
        <ExpressCheckoutElement
          onReady={onReady}
          onConfirm={onConfirm}
          options={{
            buttonType: {
              applePay: 'subscribe',
              googlePay: 'subscribe',
            },
            buttonHeight: 48,
            layout: {
              maxRows: 1,
              maxColumns: 2,
            },
          }}
        />
        {isProcessing && (
          <div className="mt-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" style={{ color: 'rgb(var(--primary))' }} viewBox="0 0 24 24">
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
              <span className="text-sm" style={{ color: 'rgb(var(--foreground-secondary))' }}>
                Processing...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px" style={{ backgroundColor: 'rgb(var(--border))' }} />
        <span className="text-sm" style={{ color: 'rgb(var(--foreground-muted))' }}>
          or pay with card
        </span>
        <div className="flex-1 h-px" style={{ backgroundColor: 'rgb(var(--border))' }} />
      </div>
    </div>
  );
}

export default ExpressCheckout;
