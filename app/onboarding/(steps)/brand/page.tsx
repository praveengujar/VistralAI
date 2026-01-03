'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingLayout, BrandStep } from '@/components/onboarding/unified';
import { useOnboardingSession, useSaveBrand } from '@/lib/query/onboardingHooks';

export default function BrandSetupPage() {
  const router = useRouter();
  const { data: sessionData, isLoading } = useOnboardingSession();
  const saveBrand = useSaveBrand();

  const session = sessionData?.data?.session;
  const completedSteps = session?.completedSteps || [];

  const [error, setError] = useState<string | undefined>();

  // If brand step already completed, allow navigation to next step
  const isCompleted = completedSteps.includes(1);

  const handleSubmit = async (websiteUrl: string, brandName: string) => {
    setError(undefined);

    try {
      await saveBrand.mutateAsync({ websiteUrl, brandName });
      router.push('/onboarding/plan');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save brand info');
    }
  };

  const handleNext = () => {
    router.push('/onboarding/plan');
  };

  if (isLoading || !session) {
    return null;
  }

  return (
    <OnboardingLayout
      currentStep={1}
      completedSteps={completedSteps}
      title="Set Up Your Brand"
      description="Enter your website URL and brand name to get started."
      onNext={isCompleted ? handleNext : undefined}
      isNextDisabled={!isCompleted}
      nextLabel="Continue to Choose Plan"
      hideNavigation={!isCompleted}
    >
      <BrandStep
        onSubmit={handleSubmit}
        isSubmitting={saveBrand.isPending}
        error={error}
        defaultUrl={session.websiteUrl || ''}
        defaultBrandName={session.brandName || ''}
      />
    </OnboardingLayout>
  );
}
