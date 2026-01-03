'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingLayout, BuildProfileStep } from '@/components/onboarding/unified';
import {
  useOnboardingSession,
  useStartBuildProfile,
  useRetryBuildProfile,
} from '@/lib/query/onboardingHooks';

export default function BuildProfilePage() {
  const router = useRouter();
  const { data: sessionData, isLoading, refetch } = useOnboardingSession();
  const startBuildProfile = useStartBuildProfile();
  const retryBuildProfile = useRetryBuildProfile();

  const session = sessionData?.data?.session;
  const completedSteps = session?.completedSteps || [];

  const [importStatus, setImportStatus] = useState<'idle' | 'running' | 'complete' | 'failed'>('idle');
  const [importError, setImportError] = useState<string | undefined>();
  const [completionScore, setCompletionScore] = useState<number | undefined>();

  // Redirect if prerequisites not met
  useEffect(() => {
    if (!isLoading && session) {
      if (!completedSteps.includes(1) || !session.websiteUrl) {
        router.push('/onboarding/brand');
        return;
      }
      if (!session.selectedTierId || !completedSteps.includes(2)) {
        router.push('/onboarding/plan');
        return;
      }
      if (!completedSteps.includes(3)) {
        router.push('/onboarding/payment');
        return;
      }
    }
  }, [session, completedSteps, isLoading, router]);

  // Check if profile was already created
  useEffect(() => {
    if (session?.brand360Id && completedSteps.includes(4)) {
      setImportStatus('complete');
    }
  }, [session?.brand360Id, completedSteps]);

  const handleBack = () => {
    router.push('/onboarding/payment');
  };

  const handleNext = () => {
    router.push('/onboarding/complete');
  };

  const handleStartImport = useCallback(async () => {
    if (importStatus !== 'idle' && importStatus !== 'failed') return;

    setImportError(undefined);
    setImportStatus('running');

    try {
      const result = await startBuildProfile.mutateAsync();

      if (result.success && result.data) {
        if (result.data.status === 'completed' || result.data.status === 'already_completed') {
          setImportStatus('complete');
          setCompletionScore(result.data.completionScore);
          await refetch();
          // Auto-advance after short delay
          setTimeout(() => {
            router.push('/onboarding/complete');
          }, 2000);
        } else if (result.data.status === 'failed') {
          setImportStatus('failed');
          setImportError(result.error || 'Profile creation failed');
        }
      }
    } catch (err) {
      setImportStatus('failed');
      setImportError(err instanceof Error ? err.message : 'Profile creation failed');
    }
  }, [importStatus, startBuildProfile, refetch, router]);

  const handleRetry = async () => {
    setImportError(undefined);
    setImportStatus('running');

    try {
      const result = await retryBuildProfile.mutateAsync();

      if (result.success && result.data) {
        if (result.data.status === 'completed' || result.data.status === 'already_completed') {
          setImportStatus('complete');
          setCompletionScore(result.data.completionScore);
          await refetch();
          setTimeout(() => {
            router.push('/onboarding/complete');
          }, 2000);
        } else if (result.data.status === 'failed') {
          setImportStatus('failed');
          setImportError(result.error || 'Profile creation failed');
        }
      }
    } catch (err) {
      setImportStatus('failed');
      setImportError(err instanceof Error ? err.message : 'Retry failed');
    }
  };

  if (isLoading || !session) {
    return null;
  }

  const canProceed = importStatus === 'complete';

  return (
    <OnboardingLayout
      currentStep={4}
      completedSteps={completedSteps}
      title="Build Your Brand Profile"
      description="We're analyzing your website to create a comprehensive brand profile."
      onBack={handleBack}
      onNext={canProceed ? handleNext : undefined}
      isNextDisabled={!canProceed}
      isLoading={importStatus === 'running'}
      nextLabel="Continue"
      hideNavigation={importStatus === 'idle' || importStatus === 'running'}
    >
      <BuildProfileStep
        sessionId={session.id}
        websiteUrl={session.websiteUrl || ''}
        brandName={session.brandName || ''}
        onStartImport={handleStartImport}
        onRetry={handleRetry}
        isStarting={startBuildProfile.isPending || retryBuildProfile.isPending}
        importStatus={importStatus}
        importError={importError}
        completionScore={completionScore}
      />
    </OnboardingLayout>
  );
}
