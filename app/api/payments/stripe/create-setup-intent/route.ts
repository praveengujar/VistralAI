// API Route: POST /api/payments/stripe/create-setup-intent
// Create a Stripe SetupIntent for collecting payment method

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { stripeService } from '@/lib/services/payments/StripeService';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create customer
    const customerId = await stripeService.getOrCreateCustomer(
      session.user.id,
      session.user.email,
      session.user.name || undefined
    );

    // Create setup intent
    const setupIntent = await stripeService.createSetupIntent(customerId);

    return NextResponse.json({
      success: true,
      data: {
        clientSecret: setupIntent.client_secret,
        customerId,
      },
    });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create setup intent' },
      { status: 500 }
    );
  }
}
