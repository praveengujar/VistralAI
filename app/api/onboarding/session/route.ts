// API Route: GET/POST /api/onboarding/session
// Get or update onboarding session

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { onboardingService } from '@/lib/services/onboarding';
import { getStepById, getProgressPercentage } from '@/lib/config/onboarding';
import type { OnboardingSessionData, OnboardingStatus } from '@/lib/config/onboarding';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const onboardingSession = await onboardingService.getOrCreateSession(
      session.user.id
    );

    // Calculate progress
    const sessionData: OnboardingSessionData = {
      currentStep: onboardingSession.currentStep,
      completedSteps: onboardingSession.completedSteps,
      status: onboardingSession.status as OnboardingStatus,
    };

    const currentStepConfig = getStepById(onboardingSession.currentStep);
    const progressPercentage = getProgressPercentage(sessionData);

    return NextResponse.json({
      success: true,
      data: {
        session: onboardingSession,
        currentStepConfig,
        progressPercentage,
      },
    });
  } catch (error) {
    console.error('Error fetching onboarding session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch onboarding session' },
      { status: 500 }
    );
  }
}

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
    const { action, step, stepData } = body;

    // Get existing session
    const onboardingSession = await onboardingService.getSessionByUserId(
      session.user.id
    );

    if (!onboardingSession) {
      return NextResponse.json(
        { success: false, error: 'No onboarding session found' },
        { status: 404 }
      );
    }

    let result;

    switch (action) {
      case 'update':
        result = await onboardingService.updateSession(
          onboardingSession.id,
          stepData
        );
        break;

      case 'complete_step':
        if (typeof step !== 'number') {
          return NextResponse.json(
            { success: false, error: 'Step number is required' },
            { status: 400 }
          );
        }
        result = await onboardingService.completeStep(
          onboardingSession.id,
          step,
          stepData
        );
        break;

      case 'skip_step':
        if (typeof step !== 'number') {
          return NextResponse.json(
            { success: false, error: 'Step number is required' },
            { status: 400 }
          );
        }
        result = await onboardingService.skipStep(onboardingSession.id, step);
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: update, complete_step, skip_step' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error updating onboarding session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
