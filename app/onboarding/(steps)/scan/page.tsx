'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingLayout, ScanStep } from '@/components/onboarding/unified';
import {
  useOnboardingSession,
  useStartOnboardingScan,
  useSkipOnboardingScan,
} from '@/lib/query/onboardingHooks';
import { useAEOScan } from '@/lib/query/hooks';

export default function ScanPage() {
  const router = useRouter();
  const { data: sessionData, isLoading, refetch } = useOnboardingSession();
  const startScan = useStartOnboardingScan();
  const skipScan = useSkipOnboardingScan();

  const session = sessionData?.data?.session;
  const completedSteps = session?.completedSteps || [];

  const [scanStatus, setScanStatus] = useState<'idle' | 'running' | 'complete' | 'skipped'>('idle');
  const [scanId, setScanId] = useState<string | null>(null);
  const scanStartedRef = useRef(false);

  // Poll scan progress when running
  const { data: scanData } = useAEOScan(scanId || '', {
    enabled: !!scanId && scanStatus === 'running',
  });

  // Redirect if prerequisites not met (steps 1-4 required)
  useEffect(() => {
    if (!isLoading && session) {
      if (!completedSteps.includes(1)) {
        router.push('/onboarding/brand');
        return;
      }
      if (!completedSteps.includes(2)) {
        router.push('/onboarding/plan');
        return;
      }
      if (!completedSteps.includes(3)) {
        router.push('/onboarding/payment');
        return;
      }
      if (!completedSteps.includes(4) || !session.brand360Id) {
        router.push('/onboarding/profile');
        return;
      }
    }
  }, [session, completedSteps, isLoading, router]);

  // Check if scan already completed or skipped
  useEffect(() => {
    if (session && completedSteps.includes(5)) {
      if (session.firstScanId) {
        setScanStatus('complete');
        setScanId(session.firstScanId);
      } else {
        // Step 5 completed but no scanId means it was skipped
        setScanStatus('skipped');
      }
    }
  }, [session, completedSteps]);

  // Monitor scan completion from polling
  useEffect(() => {
    if (scanData?.scan?.status === 'completed' && scanStatus === 'running') {
      setScanStatus('complete');
      refetch();
    }
  }, [scanData?.scan?.status, scanStatus, refetch]);

  const handleStartScan = async (type: 'quick' | 'comprehensive') => {
    // Prevent duplicate scans
    if (scanStartedRef.current) return;
    scanStartedRef.current = true;

    setScanStatus('running');

    try {
      const result = await startScan.mutateAsync({
        scanType: type,
        brand360Id: session?.brand360Id || '',
      });

      if (result.success && result.data?.scanId) {
        setScanId(result.data.scanId);
      } else {
        // If scan failed to start, reset
        setScanStatus('idle');
        scanStartedRef.current = false;
      }
    } catch (error) {
      console.error('[Scan] Failed to start scan:', error);
      setScanStatus('idle');
      scanStartedRef.current = false;
    }
  };

  const handleSkip = async () => {
    try {
      await skipScan.mutateAsync();
      setScanStatus('skipped');
      await refetch();
      router.push('/onboarding/complete');
    } catch (error) {
      console.error('[Scan] Failed to skip:', error);
    }
  };

  const handleNext = () => {
    router.push('/onboarding/complete');
  };

  const handleBack = () => {
    router.push('/onboarding/profile');
  };

  if (isLoading || !session) {
    return null;
  }

  const canProceed = scanStatus === 'complete' || scanStatus === 'skipped';

  return (
    <OnboardingLayout
      currentStep={5}
      completedSteps={completedSteps}
      title="Run Your First AI Perception Scan"
      description="See how AI platforms perceive your brand"
      onBack={handleBack}
      onNext={canProceed ? handleNext : undefined}
      isNextDisabled={scanStatus === 'running'}
      nextLabel="Continue"
      hideNavigation={scanStatus === 'idle'}
    >
      <ScanStep
        brand360Id={session.brand360Id}
        brandName={session.brandName}
        scanStatus={scanStatus}
        scanData={scanData?.scan}
        onStartScan={handleStartScan}
        onSkip={handleSkip}
        isStarting={startScan.isPending}
        isSkipping={skipScan.isPending}
      />
    </OnboardingLayout>
  );
}
