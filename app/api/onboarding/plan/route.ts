// API Route: POST /api/onboarding/plan
// Save plan selection during onboarding

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { onboardingService } from '@/lib/services/onboarding';
import { getSelectedTierDetails, validateStepData } from '@/lib/config/onboarding';
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
    const { tierId, billingCycle } = body;

    // Validate required fields
    if (!tierId || !billingCycle) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: tierId, billingCycle' },
        { status: 400 }
      );
    }

    // Validate billing cycle
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json(
        { success: false, error: 'Invalid billing cycle. Must be "monthly" or "yearly"' },
        { status: 400 }
      );
    }

    // Validate tier exists
    const tierDetails = getSelectedTierDetails(tierId, billingCycle);
    if (!tierDetails) {
      return NextResponse.json(
        { success: false, error: 'Invalid tier ID' },
        { status: 400 }
      );
    }

    // Get or create onboarding session
    const onboardingSession = await onboardingService.getOrCreateSession(
      session.user.id
    );

    // Validate step data
    const sessionData: OnboardingSessionData = {
      currentStep: onboardingSession.currentStep,
      completedSteps: onboardingSession.completedSteps,
      status: onboardingSession.status as OnboardingStatus,
      selectedTierId: tierId,
      selectedBillingCycle: billingCycle,
    };

    const validation = validateStepData(1, sessionData);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Complete the plan selection step (step 2)
    const result = await onboardingService.completeStep(
      onboardingSession.id,
      2,
      {
        selectedTierId: tierId,
        selectedBillingCycle: billingCycle,
      }
    );

    // Log the event
    await onboardingService.logEvent(onboardingSession.id, 'step_completed', {
      step: 2,
      stepName: 'plan',
      tierId,
      billingCycle,
      price: tierDetails.price,
    });

    return NextResponse.json({
      success: true,
      data: {
        session: result.session,
        nextStep: result.nextStep,
        tierDetails: {
          tier: tierDetails.tier,
          price: tierDetails.price,
          priceDisplay: tierDetails.priceDisplay,
          billingPeriod: tierDetails.billingPeriod,
          trialDays: tierDetails.trialDays,
          trialEndDate: tierDetails.trialEndDate.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Error saving plan selection:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
