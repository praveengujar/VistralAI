'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useOnboardingSession } from '@/lib/query/onboardingHooks';
import { getStepRoute } from '@/lib/config/onboarding';
import { Loader2 } from 'lucide-react';

export default function OnboardingIndexPage() {
  const router = useRouter();
  const { data: authSession, status: authStatus } = useSession();
  const { data: sessionData, isLoading } = useOnboardingSession();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (authStatus === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (authStatus !== 'authenticated') return;

    // Wait for onboarding session data
    if (isLoading) return;

    const session = sessionData?.data?.session;

    if (!session) {
      // No session yet, start at brand setup
      router.push('/onboarding/brand');
      return;
    }

    // If already completed, go to dashboard
    if (session.status === 'completed') {
      router.push('/dashboard');
      return;
    }

    // Resume at current step
    const stepRoute = getStepRoute(session.currentStep);
    router.push(stepRoute);

  }, [authStatus, sessionData, isLoading, router]);

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
