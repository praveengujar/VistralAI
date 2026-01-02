'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingLayout, BrandStep } from '@/components/onboarding/unified';
import {
  useOnboardingSession,
  useStartMagicImport,
  useRetryMagicImport,
  useBrandStatus,
} from '@/lib/query/onboardingHooks';

export default function BrandSetupPage() {
  const router = useRouter();
  const { data: sessionData, isLoading, refetch } = useOnboardingSession();
  const startMagicImport = useStartMagicImport();
  const retryMagicImport = useRetryMagicImport();

  const session = sessionData?.data?.session;
  const completedSteps = session?.completedSteps || [];

  // Poll brand status when running
  const [isImportRunning, setIsImportRunning] = useState(false);
  const { data: brandStatus } = useBrandStatus(isImportRunning);

  const [importStatus, setImportStatus] = useState<'idle' | 'running' | 'complete' | 'failed'>('idle');
  const [importError, setImportError] = useState<string | undefined>();

  // Brand is now step 1 - no prerequisite checks needed

  // Initialize status from session
  useEffect(() => {
    if (session?.brand360Id) {
      setImportStatus('complete');
    }
  }, [session?.brand360Id]);

  // Watch brand status polling
  useEffect(() => {
    if (brandStatus?.data?.status === 'complete') {
      setImportStatus('complete');
      setIsImportRunning(false);
      refetch();
    } else if (brandStatus?.data?.status === 'failed') {
      setImportStatus('failed');
      setImportError(brandStatus.data.error);
      setIsImportRunning(false);
    } else if (brandStatus?.data?.status === 'running') {
      setImportStatus('running');
    }
  }, [brandStatus, refetch]);

  const handleNext = () => {
    router.push('/onboarding/plan');
  };

  const handleStartImport = async (websiteUrl: string, brandName: string) => {
    setImportError(undefined);
    setImportStatus('running');
    setIsImportRunning(true);

    try {
      await startMagicImport.mutateAsync({ websiteUrl, brandName });
    } catch (err) {
      setImportStatus('failed');
      setImportError(err instanceof Error ? err.message : 'Import failed');
      setIsImportRunning(false);
    }
  };

  const handleRetry = async () => {
    setImportError(undefined);
    setImportStatus('running');
    setIsImportRunning(true);

    try {
      await retryMagicImport.mutateAsync();
    } catch (err) {
      setImportStatus('failed');
      setImportError(err instanceof Error ? err.message : 'Retry failed');
      setIsImportRunning(false);
    }
  };

  if (isLoading || !session) {
    return null;
  }

  const canProceed = importStatus === 'complete';

  return (
    <OnboardingLayout
      currentStep={1}
      completedSteps={completedSteps}
      title="Set Up Your Brand"
      description="Enter your website URL and we'll create your brand profile automatically."
      onNext={canProceed ? handleNext : undefined}
      isNextDisabled={!canProceed}
      isLoading={importStatus === 'running'}
      nextLabel="Continue"
      hideNavigation={importStatus === 'idle' || importStatus === 'running'}
    >
      <BrandStep
        sessionId={session.id}
        onStartImport={handleStartImport}
        onRetry={handleRetry}
        isStarting={startMagicImport.isPending}
        importStatus={importStatus}
        importError={importError}
      />
    </OnboardingLayout>
  );
}
