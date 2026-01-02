// API Route: POST /api/onboarding/brand
// Run MagicImport for brand setup during onboarding

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { onboardingService, onboardingMagicImport } from '@/lib/services/onboarding';
import { normalizeUrl, validateStepData } from '@/lib/config/onboarding';
import type { OnboardingSessionData, OnboardingStatus } from '@/lib/config/onboarding';

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
    const { websiteUrl, brandName, action } = body;

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

    // Verify payment is complete
    if (!onboardingSession.subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'Please complete payment first' },
        { status: 400 }
      );
    }

    // Handle status check
    if (action === 'status') {
      const status = await onboardingMagicImport.getStatus(onboardingSession.id);
      return NextResponse.json({
        success: true,
        data: status,
      });
    }

    // Handle retry
    if (action === 'retry') {
      const savedUrl = onboardingSession.websiteUrl;
      const savedBrandName = onboardingSession.brandName;

      if (!savedUrl || !savedBrandName) {
        return NextResponse.json(
          { success: false, error: 'No previous brand setup to retry' },
          { status: 400 }
        );
      }

      // Execute retry in background
      onboardingMagicImport.retry({
        sessionId: onboardingSession.id,
        userId: session.user.id,
        websiteUrl: savedUrl,
        brandName: savedBrandName,
      }).catch(err => {
        console.error('MagicImport retry error:', err);
      });

      return NextResponse.json({
        success: true,
        data: {
          status: 'running',
          message: 'Retrying brand import...',
        },
      });
    }

    // Validate required fields
    if (!websiteUrl || !brandName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: websiteUrl, brandName' },
        { status: 400 }
      );
    }

    // Normalize URL
    const normalizedUrl = normalizeUrl(websiteUrl);

    // Validate step data
    const sessionData: OnboardingSessionData = {
      currentStep: onboardingSession.currentStep,
      completedSteps: onboardingSession.completedSteps,
      status: onboardingSession.status as OnboardingStatus,
      websiteUrl: normalizedUrl,
      brandName,
    };

    const validation = validateStepData(3, sessionData);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Start MagicImport in background (non-blocking)
    // The client will poll for status or receive WebSocket updates
    onboardingMagicImport.execute({
      sessionId: onboardingSession.id,
      userId: session.user.id,
      websiteUrl: normalizedUrl,
      brandName,
      onProgress: (progressData) => {
        // Progress will be emitted via WebSocket
        console.log('MagicImport progress:', progressData);
      },
      onComplete: async (completeData) => {
        // Complete the brand step (step 1)
        try {
          await onboardingService.completeStep(
            onboardingSession.id,
            1,
            {
              websiteUrl: normalizedUrl,
              brandName,
              brand360Id: completeData.brand360Id,
            }
          );
        } catch (err) {
          console.error('Error completing brand step:', err);
        }
      },
      onError: (errorData) => {
        console.error('MagicImport error:', errorData);
      },
    }).catch(err => {
      console.error('MagicImport execution error:', err);
    });

    // Return immediately with running status
    return NextResponse.json({
      success: true,
      data: {
        status: 'running',
        message: 'Brand import started. You will receive real-time updates.',
        websiteUrl: normalizedUrl,
        brandName,
      },
    });
  } catch (error) {
    console.error('Error processing brand setup:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// GET endpoint to check status
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

    const status = await onboardingMagicImport.getStatus(onboardingSession.id);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error getting brand status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get status' },
      { status: 500 }
    );
  }
}
