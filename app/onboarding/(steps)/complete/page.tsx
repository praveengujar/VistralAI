'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingLayout, CompleteStep } from '@/components/onboarding/unified';
import { useOnboardingSession, useCompleteOnboarding } from '@/lib/query/onboardingHooks';

export default function CompletePage() {
  const router = useRouter();
  const { data: sessionData, isLoading, refetch } = useOnboardingSession();
  const completeOnboarding = useCompleteOnboarding();

  const session = sessionData?.data?.session;
  const completedSteps = session?.completedSteps || [];

  // Auto-complete onboarding when reaching this page
  useEffect(() => {
    if (!isLoading && session && session.status !== 'completed') {
      // Verify required steps are done
      const hasRequiredSteps = completedSteps.includes(1) &&
                               completedSteps.includes(2) &&
                               completedSteps.includes(3);

      if (hasRequiredSteps) {
        completeOnboarding.mutateAsync()
          .then(() => refetch())
          .catch((err) => console.error('Failed to complete onboarding:', err));
      } else {
        // Redirect to first incomplete required step
        if (!completedSteps.includes(1)) {
          router.push('/onboarding/plan');
        } else if (!completedSteps.includes(2)) {
          router.push('/onboarding/payment');
        } else if (!completedSteps.includes(3)) {
          router.push('/onboarding/brand');
        }
      }
    }
  }, [session, completedSteps, isLoading]);

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  if (isLoading) {
    return null;
  }

  return (
    <OnboardingLayout
      currentStep={5}
      completedSteps={completedSteps}
      title="You're All Set!"
      hideNavigation={true}
    >
      <CompleteStep
        brandName={session?.brandName ?? undefined}
        tierId={session?.selectedTierId ?? undefined}
        hasFirstScan={!!session?.firstScanId}
        onGoToDashboard={handleGoToDashboard}
      />
    </OnboardingLayout>
  );
}
