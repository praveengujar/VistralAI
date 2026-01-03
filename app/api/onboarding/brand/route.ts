// API Route: POST /api/onboarding/brand
// Save brand website URL and name during onboarding (Step 1)
// Magic Import is deferred to Step 4 (Build Profile)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { onboardingService } from '@/lib/services/onboarding';
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
    const { websiteUrl, brandName } = body;

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

    const validation = validateStepData(1, sessionData);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Save brand info and complete step 1
    await onboardingService.completeStep(
      onboardingSession.id,
      1,
      {
        websiteUrl: normalizedUrl,
        brandName,
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        websiteUrl: normalizedUrl,
        brandName,
        message: 'Brand info saved. Proceed to choose your plan.',
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

// GET endpoint to check brand info
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
        websiteUrl: onboardingSession.websiteUrl,
        brandName: onboardingSession.brandName,
        completed: onboardingSession.completedSteps.includes(1),
      },
    });
  } catch (error) {
    console.error('Error getting brand info:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get brand info' },
      { status: 500 }
    );
  }
}
