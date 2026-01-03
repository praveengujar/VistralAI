'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { OnboardingLayout, CompleteStep } from '@/components/onboarding/unified';
import { useOnboardingSession, useCompleteOnboarding } from '@/lib/query/onboardingHooks';

export default function CompletePage() {
  const router = useRouter();
  const { update: updateAuthSession } = useSession();
  const { data: sessionData, isLoading, refetch } = useOnboardingSession();
  const completeOnboarding = useCompleteOnboarding();

  const session = sessionData?.data?.session;
  const completedSteps = session?.completedSteps || [];

  // Auto-complete onboarding when reaching this page
  useEffect(() => {
    if (isLoading) return;

    // If already completed, redirect to dashboard after a brief moment
    if (session?.status === 'completed') {
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 3000); // 3 second delay to show success message
      return () => clearTimeout(timer);
    }

    if (session && session.status !== 'completed') {
      // Verify required steps are done (1=brand, 2=plan, 3=payment, 4=profile)
      const hasRequiredSteps = completedSteps.includes(1) &&
                               completedSteps.includes(2) &&
                               completedSteps.includes(3) &&
                               completedSteps.includes(4);

      if (hasRequiredSteps) {
        completeOnboarding.mutateAsync()
          .then(async () => {
            await refetch();
            // Refresh NextAuth session to include organization context
            await updateAuthSession();
            // Redirect to dashboard after completion
            setTimeout(() => {
              router.push('/dashboard');
            }, 2000);
          })
          .catch((err) => console.error('Failed to complete onboarding:', err));
      } else {
        // Redirect to first incomplete required step
        if (!completedSteps.includes(1)) {
          router.push('/onboarding/brand');
        } else if (!completedSteps.includes(2)) {
          router.push('/onboarding/plan');
        } else if (!completedSteps.includes(3)) {
          router.push('/onboarding/payment');
        } else if (!completedSteps.includes(4)) {
          router.push('/onboarding/profile');
        }
      }
    }
  }, [session, completedSteps, isLoading, completeOnboarding, refetch, router, updateAuthSession]);

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
