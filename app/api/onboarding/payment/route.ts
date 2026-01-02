// API Route: POST /api/onboarding/payment
// Process payment and create subscription during onboarding

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { onboardingService } from '@/lib/services/onboarding';
import { stripeService } from '@/lib/services/payments/StripeService';
import { subscriptionService } from '@/lib/services/SubscriptionService';
import { getSelectedTierDetails, TRIAL_DAYS } from '@/lib/config/onboarding';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, paymentMethodId, setupIntentId } = body;

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

    // Verify plan is selected
    if (!onboardingSession.selectedTierId || !onboardingSession.selectedBillingCycle) {
      return NextResponse.json(
        { success: false, error: 'Please select a plan first' },
        { status: 400 }
      );
    }

    // Handle different payment actions
    if (action === 'create_setup_intent') {
      // Create or get Stripe customer
      const customerId = await stripeService.getOrCreateCustomer(
        session.user.id,
        session.user.email
      );

      // Create SetupIntent for collecting payment method
      const setupIntent = await stripeService.createSetupIntent(customerId);

      // Update session with Stripe customer ID
      await onboardingService.updateSession(onboardingSession.id, {
        stripeCustomerId: customerId,
      });

      return NextResponse.json({
        success: true,
        data: {
          clientSecret: setupIntent.client_secret,
          customerId,
        },
      });
    }

    if (action === 'confirm_payment') {
      // Validate payment method is provided
      if (!paymentMethodId) {
        return NextResponse.json(
          { success: false, error: 'Payment method ID is required' },
          { status: 400 }
        );
      }

      // Get customer ID
      let customerId = onboardingSession.stripeCustomerId;
      if (!customerId) {
        customerId = await stripeService.getOrCreateCustomer(
          session.user.id,
          session.user.email
        );
      }

      // Attach payment method to customer
      await stripeService.attachPaymentMethod(paymentMethodId, customerId);

      // Set as default payment method
      await stripeService.setDefaultPaymentMethod(customerId, paymentMethodId);

      // Get tier details
      const tierDetails = getSelectedTierDetails(
        onboardingSession.selectedTierId,
        onboardingSession.selectedBillingCycle as 'monthly' | 'yearly'
      );

      if (!tierDetails) {
        return NextResponse.json(
          { success: false, error: 'Invalid tier' },
          { status: 400 }
        );
      }

      // Create subscription with trial
      const subscriptionResult = await subscriptionService.createSubscription({
        userId: session.user.id,
        tierId: onboardingSession.selectedTierId,
        provider: 'stripe',
        billingCycle: onboardingSession.selectedBillingCycle as 'monthly' | 'yearly',
        paymentMethodId,
      });

      if (!subscriptionResult.success) {
        return NextResponse.json(
          { success: false, error: subscriptionResult.error },
          { status: 400 }
        );
      }

      // Complete the payment step (step 3)
      const result = await onboardingService.completeStep(
        onboardingSession.id,
        3,
        {
          paymentMethodId,
          stripeCustomerId: customerId,
          subscriptionId: subscriptionResult.subscription?.id,
        }
      );

      // Log the event
      await onboardingService.logEvent(onboardingSession.id, 'step_completed', {
        step: 3,
        stepName: 'payment',
        subscriptionId: subscriptionResult.subscription?.id,
        trialDays: TRIAL_DAYS,
      });

      return NextResponse.json({
        success: true,
        data: {
          session: result.session,
          nextStep: result.nextStep,
          subscription: {
            id: subscriptionResult.subscription?.id,
            status: 'trialing',
            trialDays: TRIAL_DAYS,
            trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
          },
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use: create_setup_intent, confirm_payment' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
