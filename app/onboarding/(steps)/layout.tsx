'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useOnboardingSession } from '@/lib/query/onboardingHooks';
import { Loader2 } from 'lucide-react';

interface OnboardingStepsLayoutProps {
  children: ReactNode;
}

export default function OnboardingStepsLayout({ children }: OnboardingStepsLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status: authStatus } = useSession();
  const { data: onboardingData, isLoading } = useOnboardingSession();

  // Don't auto-redirect from complete page - it handles its own redirect with a delay
  const isCompletePage = pathname === '/onboarding/complete';

  useEffect(() => {
    // Redirect to login if not authenticated
    if (authStatus === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    // Redirect to dashboard if onboarding is already complete
    // Skip this check on complete page to allow success message to show
    if (!isCompletePage && onboardingData?.data?.session?.status === 'completed') {
      router.push('/dashboard');
    }
  }, [authStatus, onboardingData, router, isCompletePage]);

  // Show loading state
  if (authStatus === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-[rgb(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--primary))] mx-auto mb-4" />
          <p className="text-[rgb(var(--foreground-secondary))]">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (authStatus === 'unauthenticated') {
    return null;
  }

  return <>{children}</>;
}
