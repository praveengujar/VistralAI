// API Route: POST /api/webhooks/paypal
// Handle PayPal webhook events

import { NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/services/SubscriptionService';
import prisma from '@/lib/db/prisma';
import { TRIAL_DAYS } from '@/lib/config/pricing';

interface PayPalWebhookEvent {
  event_type: string;
  resource: {
    id: string;
    status?: string;
    custom_id?: string;
    billing_info?: {
      next_billing_time?: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as PayPalWebhookEvent;
    const eventType = body.event_type;

    console.log('PayPal webhook received:', eventType);

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        const subscriptionId = body.resource.id;
        await handleSubscriptionActivated(subscriptionId, body.resource.custom_id);
        break;
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED': {
        const subscriptionId = body.resource.id;
        await subscriptionService.handleSubscriptionCanceled(subscriptionId, 'paypal');
        break;
      }

      case 'BILLING.SUBSCRIPTION.SUSPENDED': {
        const subscriptionId = body.resource.id;
        await handleSubscriptionSuspended(subscriptionId);
        break;
      }

      case 'BILLING.SUBSCRIPTION.UPDATED': {
        const subscriptionId = body.resource.id;
        await handleSubscriptionUpdated(subscriptionId, body.resource);
        break;
      }

      case 'PAYMENT.SALE.COMPLETED': {
        // Handle successful payment
        console.log('Payment completed:', body.resource.id);
        break;
      }

      case 'PAYMENT.SALE.DENIED':
      case 'PAYMENT.SALE.REFUNDED': {
        // Handle payment issues
        console.log('Payment issue:', eventType, body.resource.id);
        break;
      }

      default:
        console.log(`Unhandled PayPal event type: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionActivated(paypalSubscriptionId: string, userId?: string) {
  const subscription = await prisma.userSubscription.findUnique({
    where: { paypalSubscriptionId },
    include: { tier: true },
  });

  if (!subscription) {
    console.log('Subscription not found:', paypalSubscriptionId);
    return;
  }

  const trialEndDate = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.userSubscription.update({
    where: { id: subscription.id },
    data: {
      status: 'trialing',
      trialStartDate: new Date(),
      trialEndDate,
      trialDaysRemaining: TRIAL_DAYS,
      currentPeriodStart: new Date(),
      currentPeriodEnd: trialEndDate,
    },
  });

  console.log(`PayPal subscription activated: ${paypalSubscriptionId}`);
}

async function handleSubscriptionSuspended(paypalSubscriptionId: string) {
  await prisma.userSubscription.updateMany({
    where: { paypalSubscriptionId },
    data: { status: 'paused' },
  });
}

async function handleSubscriptionUpdated(
  paypalSubscriptionId: string,
  resource: PayPalWebhookEvent['resource']
) {
  const statusMap: Record<string, string> = {
    ACTIVE: 'active',
    SUSPENDED: 'paused',
    CANCELLED: 'canceled',
    EXPIRED: 'canceled',
  };

  if (resource.status) {
    const newStatus = statusMap[resource.status];
    if (newStatus) {
      await prisma.userSubscription.updateMany({
        where: { paypalSubscriptionId },
        data: { status: newStatus },
      });
    }
  }

  // Update billing period if available
  if (resource.billing_info?.next_billing_time) {
    await prisma.userSubscription.updateMany({
      where: { paypalSubscriptionId },
      data: {
        currentPeriodEnd: new Date(resource.billing_info.next_billing_time),
      },
    });
  }
}
