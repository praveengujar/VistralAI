// API Route: POST /api/onboarding/complete
// Finalize onboarding and redirect to dashboard

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { onboardingService } from '@/lib/services/onboarding';
import { ONBOARDING_STEPS, getProgressPercentage } from '@/lib/config/onboarding';
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

    // Verify all required steps are complete
    const requiredSteps = ONBOARDING_STEPS.filter(s => !s.optional && s.id < 5);
    const completedRequiredSteps = requiredSteps.filter(
      s => onboardingSession.completedSteps.includes(s.id)
    );

    if (completedRequiredSteps.length < requiredSteps.length) {
      const missingSteps = requiredSteps.filter(
        s => !onboardingSession.completedSteps.includes(s.id)
      );
      return NextResponse.json(
        {
          success: false,
          error: `Please complete the following steps: ${missingSteps.map(s => s.label).join(', ')}`,
          missingSteps: missingSteps.map(s => s.id),
        },
        { status: 400 }
      );
    }

    // Mark onboarding as complete
    await onboardingService.markComplete(session.user.id);

    // Get final session state
    const finalSession = await onboardingService.getSessionByUserId(session.user.id);
    const sessionData: OnboardingSessionData = {
      currentStep: finalSession?.currentStep || ONBOARDING_STEPS.length,
      completedSteps: finalSession?.completedSteps || [],
      status: (finalSession?.status || 'completed') as OnboardingStatus,
    };

    return NextResponse.json({
      success: true,
      data: {
        completed: true,
        progressPercentage: getProgressPercentage(sessionData),
        redirectUrl: '/dashboard',
        session: finalSession,
        summary: {
          tierId: onboardingSession.selectedTierId,
          billingCycle: onboardingSession.selectedBillingCycle,
          brand360Id: onboardingSession.brand360Id,
          brandName: onboardingSession.brandName,
          websiteUrl: onboardingSession.websiteUrl,
          hasFirstScan: !!onboardingSession.firstScanId,
        },
      },
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// GET endpoint to check completion status
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
      return NextResponse.json({
        success: true,
        data: {
          hasSession: false,
          completed: false,
        },
      });
    }

    const sessionData: OnboardingSessionData = {
      currentStep: onboardingSession.currentStep,
      completedSteps: onboardingSession.completedSteps,
      status: onboardingSession.status as OnboardingStatus,
    };

    const requiredSteps = ONBOARDING_STEPS.filter(s => !s.optional && s.id < 5);
    const isComplete = onboardingSession.status === 'completed' ||
      requiredSteps.every(s => onboardingSession.completedSteps.includes(s.id));

    return NextResponse.json({
      success: true,
      data: {
        hasSession: true,
        completed: isComplete,
        status: onboardingSession.status,
        progressPercentage: getProgressPercentage(sessionData),
        currentStep: onboardingSession.currentStep,
        completedSteps: onboardingSession.completedSteps,
      },
    });
  } catch (error) {
    console.error('Error checking completion status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
