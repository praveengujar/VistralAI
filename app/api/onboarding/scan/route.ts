// API Route: POST /api/onboarding/scan
// Start or skip AI Perception Scan during onboarding (Step 5)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { onboardingService } from '@/lib/services/onboarding';
import { PerceptionScanOrchestrator } from '@/lib/services/agents/PerceptionScanOrchestrator';

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
    const { action, scanType } = body;
    // action: 'start' | 'skip'
    // scanType: 'quick' | 'comprehensive' (only for action='start')

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

    // Verify profile step is complete (step 4)
    if (!onboardingSession.completedSteps.includes(4)) {
      return NextResponse.json(
        { success: false, error: 'Please complete profile step first' },
        { status: 400 }
      );
    }

    // Verify brand360Id exists
    if (!onboardingSession.brand360Id) {
      return NextResponse.json(
        { success: false, error: 'Brand profile not found. Please complete profile step.' },
        { status: 400 }
      );
    }

    // Handle skip action
    if (action === 'skip') {
      await onboardingService.completeStep(onboardingSession.id, 5, {
        firstScanType: 'skipped',
      });

      await onboardingService.logEvent(onboardingSession.id, 'step_skipped', {
        step: 5,
        stepName: 'scan',
      });

      return NextResponse.json({
        success: true,
        data: {
          status: 'skipped',
          message: 'Scan step skipped. You can run scans from the dashboard.',
        },
      });
    }

    // Handle start action
    if (action !== 'start') {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "start" or "skip".' },
        { status: 400 }
      );
    }

    // Validate scan type
    if (!['quick', 'comprehensive'].includes(scanType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid scan type. Use "quick" or "comprehensive".' },
        { status: 400 }
      );
    }

    // Check if scan already exists for this session
    if (onboardingSession.firstScanId) {
      return NextResponse.json({
        success: true,
        data: {
          status: 'already_started',
          scanId: onboardingSession.firstScanId,
          message: 'Scan already started for this session.',
        },
      });
    }

    // Log step start
    await onboardingService.logEvent(onboardingSession.id, 'step_started', {
      step: 5,
      stepName: 'scan',
      scanType,
    });

    // Configure scan options based on scan type
    const orchestrator = new PerceptionScanOrchestrator();
    const options =
      scanType === 'quick'
        ? {
            platforms: ['chatgpt'] as const,
            maxPrompts: 10,
            mockExternalPlatforms: process.env.NODE_ENV === 'development',
          }
        : {
            platforms: ['chatgpt', 'perplexity', 'claude'] as const,
            maxPrompts: 50,
            mockExternalPlatforms: process.env.NODE_ENV === 'development',
          };

    // Start the scan (this runs asynchronously)
    const result = await orchestrator.execute(
      onboardingSession.brand360Id,
      options
    );

    // Update onboarding session with scan info
    await onboardingService.completeStep(onboardingSession.id, 5, {
      firstScanId: result.scanId,
      firstScanType: scanType,
    });

    // Log completion
    await onboardingService.logEvent(onboardingSession.id, 'step_completed', {
      step: 5,
      stepName: 'scan',
      scanId: result.scanId,
      scanType,
    });

    return NextResponse.json({
      success: true,
      data: {
        status: result.status,
        scanId: result.scanId,
        promptCount: result.promptCount,
        platforms: result.platforms,
        message: 'Scan started successfully!',
      },
    });
  } catch (error) {
    console.error('Error processing scan request:', error);

    // Log error to onboarding session if we have one
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        const onboardingSession = await onboardingService.getSessionByUserId(
          session.user.id
        );
        if (onboardingSession) {
          await onboardingService.logError(
            onboardingSession.id,
            5,
            error instanceof Error ? error.message : 'Unknown error',
            { stack: error instanceof Error ? error.stack : undefined }
          );
        }
      }
    } catch {
      // Ignore logging errors
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// GET endpoint to check scan status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const onboardingSession = await onboardingService.getSessionByUserId(
      session.user.id
    );

    if (!onboardingSession) {
      return NextResponse.json(
        { success: false, error: 'No onboarding session found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        brand360Id: onboardingSession.brand360Id,
        firstScanId: onboardingSession.firstScanId,
        completed: onboardingSession.completedSteps.includes(5),
      },
    });
  } catch (error) {
    console.error('Error getting scan status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get scan status' },
      { status: 500 }
    );
  }
}
