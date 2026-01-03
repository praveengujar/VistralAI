'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useOnboardingSession } from '@/lib/query/onboardingHooks';
import { getStepRoute } from '@/lib/config/onboarding';
import { Loader2 } from 'lucide-react';

export default function OnboardingIndexPage() {
  const router = useRouter();
  const { data: authSession, status: authStatus } = useSession();
  const { data: sessionData, isLoading, error, refetch } = useOnboardingSession();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected) return;

    // Redirect to login if not authenticated
    if (authStatus === 'unauthenticated') {
      router.push('/auth/login');
      setHasRedirected(true);
      return;
    }

    if (authStatus !== 'authenticated') return;

    // Wait for onboarding session data
    if (isLoading) return;

    // Handle error case - try to refetch once
    if (error) {
      console.error('[Onboarding] Error loading session:', error);
      refetch();
      return;
    }

    const session = sessionData?.data?.session;

    if (!session) {
      // No session yet, start at brand setup
      console.log('[Onboarding] No session, redirecting to brand');
      router.push('/onboarding/brand');
      setHasRedirected(true);
      return;
    }

    // If already completed, go to dashboard
    if (session.status === 'completed') {
      console.log('[Onboarding] Session completed, redirecting to dashboard');
      router.push('/dashboard');
      setHasRedirected(true);
      return;
    }

    // Resume at current step
    const stepRoute = getStepRoute(session.currentStep);
    console.log('[Onboarding] Resuming at step:', session.currentStep, stepRoute);
    router.push(stepRoute);
    setHasRedirected(true);

  }, [authStatus, sessionData, isLoading, error, router, hasRedirected, refetch]);

  // Show loading state
  return (
    <div className="min-h-screen bg-[rgb(var(--background))] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--primary))] mx-auto mb-4" />
        <p className="text-[rgb(var(--foreground-secondary))]">
          Loading your onboarding progress...
        </p>
      </div>
    </div>
  );
}
