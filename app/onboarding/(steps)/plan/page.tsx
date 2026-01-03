'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingLayout, PlanStep } from '@/components/onboarding/unified';
import { useOnboardingSession, useSavePlanSelection } from '@/lib/query/onboardingHooks';

export default function PlanSelectionPage() {
  const router = useRouter();
  const { data: sessionData, isLoading } = useOnboardingSession();
  const savePlan = useSavePlanSelection();

  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const session = sessionData?.data?.session;
  const completedSteps = session?.completedSteps || [];

  // Redirect to brand if not completed
  useEffect(() => {
    if (!isLoading && session && !completedSteps.includes(1)) {
      router.push('/onboarding/brand');
    }
  }, [session, completedSteps, isLoading, router]);

  // Initialize from existing session data
  useEffect(() => {
    if (session?.selectedTierId) {
      setSelectedTierId(session.selectedTierId);
    }
    if (session?.selectedBillingCycle) {
      setSelectedBillingCycle(session.selectedBillingCycle as 'monthly' | 'yearly');
    }
  }, [session]);

  const handleSelectPlan = (tierId: string, billingCycle: 'monthly' | 'yearly') => {
    setSelectedTierId(tierId);
    setSelectedBillingCycle(billingCycle);
  };

  const handleBack = () => {
    router.push('/onboarding/brand');
  };

  const handleNext = async () => {
    if (!selectedTierId) return;

    try {
      await savePlan.mutateAsync({
        tierId: selectedTierId,
        billingCycle: selectedBillingCycle,
      });
      router.push('/onboarding/payment');
    } catch (error) {
      console.error('Failed to save plan selection:', error);
    }
  };

  if (isLoading) {
    return null; // Layout handles loading state
  }

  return (
    <OnboardingLayout
      currentStep={2}
      completedSteps={completedSteps}
      title="Choose Your Plan"
      description="Select the plan that best fits your needs. Start with a 15-day free trial."
      onBack={handleBack}
      onNext={handleNext}
      isNextDisabled={!selectedTierId}
      isLoading={savePlan.isPending}
      nextLabel="Continue to Payment"
    >
      <PlanStep
        selectedTierId={selectedTierId}
        selectedBillingCycle={selectedBillingCycle}
        onSelectPlan={handleSelectPlan}
      />
    </OnboardingLayout>
  );
}
