'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingLayout, PaymentStep } from '@/components/onboarding/unified';
import {
  useOnboardingSession,
  useCreateSetupIntent,
  useConfirmPayment,
} from '@/lib/query/onboardingHooks';
import { AlertCircle } from 'lucide-react';

export default function PaymentPage() {
  const router = useRouter();
  const { data: sessionData, isLoading, refetch } = useOnboardingSession();
  const createSetupIntent = useCreateSetupIntent();
  const confirmPayment = useConfirmPayment();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const session = sessionData?.data?.session;
  const completedSteps = session?.completedSteps || [];

  // Redirect to plan if no plan selected
  useEffect(() => {
    if (!isLoading && session) {
      if (!completedSteps.includes(1)) {
        router.push('/onboarding/brand');
        return;
      }
      if (!session.selectedTierId) {
        router.push('/onboarding/plan');
        return;
      }
    }
  }, [session, completedSteps, isLoading, router]);

  // Create SetupIntent on mount
  useEffect(() => {
    if (session?.selectedTierId && !clientSecret && !createSetupIntent.isPending) {
      console.log('[Payment] Creating SetupIntent for tier:', session.selectedTierId);
      createSetupIntent.mutateAsync()
        .then((response) => {
          console.log('[Payment] SetupIntent response:', response);
          if (response.data?.clientSecret) {
            console.log('[Payment] Got clientSecret, length:', response.data.clientSecret.length);
            setClientSecret(response.data.clientSecret);
          } else {
            console.error('[Payment] No clientSecret in response:', response);
            setError('Failed to initialize payment. Please try again.');
          }
        })
        .catch((err) => {
          console.error('[Payment] SetupIntent error:', err);
          setError(err.message || 'Failed to initialize payment');
        });
    }
  }, [session?.selectedTierId, clientSecret, createSetupIntent.isPending]);

  const handleBack = () => {
    router.push('/onboarding/plan');
  };

  const handlePaymentSuccess = async (paymentMethodId: string) => {
    setError(null);
    try {
      await confirmPayment.mutateAsync({ paymentMethodId });
      await refetch();
      router.push('/onboarding/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (isLoading || !session?.selectedTierId) {
    return null;
  }

  return (
    <OnboardingLayout
      currentStep={3}
      completedSteps={completedSteps}
      title="Set Up Payment"
      description="Add your payment method to start your free trial. You won't be charged today."
      onBack={handleBack}
      hideNavigation={true} // Payment form has its own submit button
    >
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Payment Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <PaymentStep
        tierId={session.selectedTierId}
        billingCycle={(session.selectedBillingCycle as 'monthly' | 'yearly') || 'monthly'}
        clientSecret={clientSecret}
        onPaymentSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
        isProcessing={confirmPayment.isPending}
      />
    </OnboardingLayout>
  );
}
