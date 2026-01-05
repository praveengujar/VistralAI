'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { OnboardingLayout, CompleteStep } from '@/components/onboarding/unified';
import { useOnboardingSession, useCompleteOnboarding } from '@/lib/query/onboardingHooks';

export default function CompletePage() {
  const router = useRouter();
  const { update: updateAuthSession } = useSession();
  const { data: sessionData, isLoading, refetch } = useOnboardingSession();
  const completeOnboarding = useCompleteOnboarding();
  const completionAttempted = useRef(false);
  const justCompletedHere = useRef(false); // Track if we completed during this page visit

  const session = sessionData?.data?.session;
  const completedSteps = session?.completedSteps || [];

  // Auto-complete onboarding when reaching this page
  useEffect(() => {
    if (isLoading) return;

    // If already completed when landing on this page, just show the success screen
    if (session?.status === 'completed' && !justCompletedHere.current) {
      console.log('[Complete] Session was already completed before landing here, showing success screen');
      // No auto-redirect
    }

    // If we just completed here, don't auto-redirect - let user see the success screen
    if (justCompletedHere.current) {
      console.log('[Complete] Just completed here, showing success screen');
      return;
    }

    // Prevent duplicate completion attempts
    if (completionAttempted.current) {
      console.log('[Complete] Completion already attempted');
      return;
    }
    if (completeOnboarding.isPending) {
      console.log('[Complete] Completion in progress');
      return;
    }
    if (completeOnboarding.isSuccess) {
      console.log('[Complete] Completion already succeeded');
      return;
    }

    if (session && session.status !== 'completed') {
      // Verify required steps are done (1=brand, 2=plan, 3=payment, 4=profile)
      const hasRequiredSteps = completedSteps.includes(1) &&
        completedSteps.includes(2) &&
        completedSteps.includes(3) &&
        completedSteps.includes(4);

      if (hasRequiredSteps) {
        console.log('[Complete] All steps complete, marking onboarding complete');
        completionAttempted.current = true;
        completeOnboarding.mutateAsync()
          .then(async () => {
            console.log('[Complete] Completion successful, refreshing session');
            justCompletedHere.current = true; // Mark that we completed here to prevent auto-redirect
            await refetch();
            // Refresh NextAuth session to include organization context
            await updateAuthSession();
            console.log('[Complete] Session updated, user can now click Go to Dashboard');
            // Don't auto-redirect - let user see success screen and click the button
          })
          .catch((err) => {
            completionAttempted.current = false;
            console.error('[Complete] Failed to complete onboarding:', err);
          });
      } else {
        // Redirect to first incomplete required step
        console.log('[Complete] Missing required steps, redirecting');
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
  }, [session, completedSteps, isLoading, completeOnboarding.isPending, completeOnboarding.isSuccess, refetch, router, updateAuthSession]);

  const handleGoToDashboard = () => {
    // Use window.location.href instead of router.push to force a full page reload
    // This ensures the browser sends the updated JWT cookie (avoiding race condition)
    window.location.href = '/dashboard';
  };

  if (isLoading) {
    return null;
  }

  return (
    <OnboardingLayout
      currentStep={6}
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
