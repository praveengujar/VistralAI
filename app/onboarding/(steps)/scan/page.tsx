'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingLayout, ScanStep } from '@/components/onboarding/unified';
import {
  useOnboardingSession,
  useRunFirstScan,
  useSkipFirstScan,
} from '@/lib/query/onboardingHooks';

export default function ScanPage() {
  const router = useRouter();
  const { data: sessionData, isLoading, refetch } = useOnboardingSession();
  const runFirstScan = useRunFirstScan();
  const skipFirstScan = useSkipFirstScan();

  const session = sessionData?.data?.session;
  const completedSteps = session?.completedSteps || [];

  const [scanStatus, setScanStatus] = useState<'idle' | 'running' | 'complete' | 'skipped'>('idle');

  // Redirect if prerequisites not met
  useEffect(() => {
    if (!isLoading && session) {
      if (!completedSteps.includes(1)) {
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

  // Check if scan was already done/skipped
  useEffect(() => {
    if (completedSteps.includes(4)) {
      if (session?.firstScanId) {
        setScanStatus('complete');
      } else {
        setScanStatus('skipped');
      }
    }
  }, [completedSteps, session?.firstScanId]);

  const handleBack = () => {
    router.push('/onboarding/payment');
  };

  const handleNext = () => {
    router.push('/onboarding/complete');
  };

  const handleRunScan = async (platform: string) => {
    setScanStatus('running');
    try {
      await runFirstScan.mutateAsync({ platform });
      setScanStatus('complete');
      await refetch();
      // Auto-advance after short delay
      setTimeout(() => {
        router.push('/onboarding/complete');
      }, 1500);
    } catch (error) {
      console.error('Scan failed:', error);
      setScanStatus('idle');
    }
  };

  const handleSkip = async () => {
    try {
      await skipFirstScan.mutateAsync();
      setScanStatus('skipped');
      await refetch();
      router.push('/onboarding/complete');
    } catch (error) {
      console.error('Skip failed:', error);
    }
  };

  if (isLoading || !session?.brand360Id) {
    return null;
  }

  const canProceed = scanStatus === 'complete' || scanStatus === 'skipped';

  return (
    <OnboardingLayout
      currentStep={4}
      completedSteps={completedSteps}
      title="Run Your First Scan"
      description="See how AI platforms perceive your brand. This step is optional."
      onBack={handleBack}
      onNext={canProceed ? handleNext : undefined}
      isNextDisabled={!canProceed}
      isLoading={scanStatus === 'running'}
      nextLabel="Continue"
      hideNavigation={scanStatus === 'idle'}
    >
      <ScanStep
        onRunScan={handleRunScan}
        onSkip={handleSkip}
        isRunning={runFirstScan.isPending}
        scanStatus={scanStatus}
      />
    </OnboardingLayout>
  );
}
