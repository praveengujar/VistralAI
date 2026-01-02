// API Route: POST /api/onboarding/scan
// Run optional first perception scan during onboarding

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { onboardingService } from '@/lib/services/onboarding';
import { ONBOARDING_CONSTANTS } from '@/lib/config/onboarding';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, platform } = body;

    // Get onboarding session
    const onboardingSession = await onboardingService.getSessionByUserId(
      session.user.id
    );

    if (!onboardingSession) {
      return NextResponse.json(
        { success: false, error: 'No onboarding session found' },
        { status: 404 }
      );
    }

    // Verify brand setup is complete
    if (!onboardingSession.brand360Id) {
      return NextResponse.json(
        { success: false, error: 'Please complete brand setup first' },
        { status: 400 }
      );
    }

    // Handle skip action
    if (action === 'skip') {
      const result = await onboardingService.skipStep(onboardingSession.id, 4);

      await onboardingService.logEvent(onboardingSession.id, 'step_skipped', {
        step: 4,
        stepName: 'scan',
      });

      return NextResponse.json({
        success: true,
        data: {
          session: result,
          skipped: true,
          nextStep: 5,
        },
      });
    }

    // Default platform for quick scan
    const scanPlatform = platform || ONBOARDING_CONSTANTS.DEFAULT_PLATFORM_FOR_FIRST_SCAN;

    // Validate platform
    const validPlatforms = ['chatgpt', 'perplexity', 'gemini', 'claude'];
    if (!validPlatforms.includes(scanPlatform)) {
      return NextResponse.json(
        { success: false, error: `Invalid platform. Use: ${validPlatforms.join(', ')}` },
        { status: 400 }
      );
    }

    // TODO: Integrate with PerceptionScanOrchestrator for quick scan
    // For now, we'll simulate the scan and mark the step as complete

    // Log scan start
    await onboardingService.logEvent(onboardingSession.id, 'step_started', {
      step: 4,
      stepName: 'scan',
      platform: scanPlatform,
    });

    // In a real implementation, this would trigger the scan
    // const scanResult = await perceptionScanOrchestrator.runQuickScan({
    //   brand360Id: onboardingSession.brand360Id,
    //   platform: scanPlatform,
    //   promptCount: ONBOARDING_CONSTANTS.FIRST_SCAN_PROMPT_COUNT,
    // });

    // For now, simulate completion
    const result = await onboardingService.completeStep(
      onboardingSession.id,
      4,
      {
        firstScanId: 'simulated-scan-id', // Replace with actual scanId
        metadata: {
          scanPlatform,
          status: 'pending_implementation',
        },
      }
    );

    await onboardingService.logEvent(onboardingSession.id, 'step_completed', {
      step: 4,
      stepName: 'scan',
      platform: scanPlatform,
    });

    return NextResponse.json({
      success: true,
      data: {
        session: result.session,
        nextStep: result.nextStep,
        scan: {
          platform: scanPlatform,
          status: 'completed',
          message: 'First scan completed! You can run more scans from the dashboard.',
        },
      },
    });
  } catch (error) {
    console.error('Error processing first scan:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
