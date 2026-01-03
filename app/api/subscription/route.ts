// API Route: GET/POST /api/subscription
// Manage user subscriptions

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { subscriptionService, PaymentProvider, BillingCycle } from '@/lib/services/SubscriptionService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await subscriptionService.getActiveSubscription(session.user.id);
    const usage = await subscriptionService.getUsageStats(session.user.id);

    return NextResponse.json({
      success: true,
      data: {
        subscription,
        usage,
      },
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tierId, provider, billingCycle, paymentMethodId, returnUrl, cancelUrl } = body;

    // Validate required fields
    if (!tierId || !provider || !billingCycle) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: tierId, provider, billingCycle' },
        { status: 400 }
      );
    }

    // Validate provider
    if (!['stripe', 'paypal'].includes(provider)) {
      return NextResponse.json(
        { success: false, error: 'Invalid provider. Must be "stripe" or "paypal"' },
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

    const result = await subscriptionService.createSubscription({
      userId: session.user.id,
      tierId,
      provider: provider as PaymentProvider,
      billingCycle: billingCycle as BillingCycle,
      paymentMethodId,
      returnUrl,
      cancelUrl,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('id');
    const immediately = searchParams.get('immediately') === 'true';

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'Missing subscription ID' },
        { status: 400 }
      );
    }

    const result = await subscriptionService.cancelSubscription(subscriptionId, immediately);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: immediately ? 'Subscription canceled immediately' : 'Subscription will cancel at period end',
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
