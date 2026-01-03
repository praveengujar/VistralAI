// API Route: POST /api/webhooks/stripe
// Handle Stripe webhook events

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripeService } from '@/lib/services/payments/StripeService';
import { subscriptionService } from '@/lib/services/SubscriptionService';
import { subscriptionManagementService } from '@/lib/services/SubscriptionManagementService';
import prisma from '@/lib/db/prisma';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripeService.constructWebhookEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await subscriptionService.handleSubscriptionCanceled(subscription.id, 'stripe');
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleTrialEnding(subscription);
        break;
      }

      case 'subscription_schedule.completed': {
        const schedule = event.data.object as Stripe.SubscriptionSchedule;
        await subscriptionManagementService.handleScheduleCompleted(schedule.id);
        break;
      }

      case 'subscription_schedule.canceled': {
        const schedule = event.data.object as Stripe.SubscriptionSchedule;
        await subscriptionManagementService.handleScheduleCanceled(schedule.id);
        break;
      }

      case 'payment_method.attached': {
        const paymentMethod = event.data.object as Stripe.PaymentMethod;
        await handlePaymentMethodAttached(paymentMethod);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionUpdate(stripeSubscription: Stripe.Subscription) {
  const subscription = await prisma.userSubscription.findUnique({
    where: { stripeSubscriptionId: stripeSubscription.id },
  });

  if (!subscription) {
    console.log('Subscription not found in database:', stripeSubscription.id);
    return;
  }

  const statusMap: Record<string, string> = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'past_due',
    incomplete: 'pending',
    incomplete_expired: 'canceled',
    paused: 'paused',
  };

  // Access properties with type assertion for Stripe API compatibility
  const subData = stripeSubscription as unknown as {
    current_period_start: number;
    current_period_end: number;
    cancel_at_period_end: boolean;
    status: string;
  };

  await prisma.userSubscription.update({
    where: { id: subscription.id },
    data: {
      status: statusMap[subData.status] || subData.status,
      currentPeriodStart: new Date(subData.current_period_start * 1000),
      currentPeriodEnd: new Date(subData.current_period_end * 1000),
      cancelAtPeriodEnd: subData.cancel_at_period_end,
    },
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Type assertion for Stripe API compatibility
  const invoiceData = invoice as unknown as {
    subscription?: string | null;
    number?: string | null;
    subtotal: number;
    tax?: number | null;
    total: number;
    amount_paid: number;
    created: number;
    id: string;
    hosted_invoice_url?: string | null;
    invoice_pdf?: string | null;
    lines: { data: Array<{ description?: string | null; amount: number; quantity?: number | null }> };
  };

  if (!invoiceData.subscription) return;

  const subscription = await prisma.userSubscription.findUnique({
    where: { stripeSubscriptionId: invoiceData.subscription },
  });

  if (!subscription) return;

  // Create invoice record
  await prisma.invoice.create({
    data: {
      subscriptionId: subscription.id,
      userId: subscription.userId,
      invoiceNumber: invoiceData.number || `INV-${Date.now()}`,
      status: 'paid',
      subtotal: invoiceData.subtotal,
      tax: invoiceData.tax || 0,
      total: invoiceData.total,
      amountPaid: invoiceData.amount_paid,
      amountDue: 0,
      invoiceDate: new Date(invoiceData.created * 1000),
      paidAt: new Date(),
      stripeInvoiceId: invoiceData.id,
      stripeInvoiceUrl: invoiceData.hosted_invoice_url || undefined,
      stripePdfUrl: invoiceData.invoice_pdf || undefined,
      lineItems: invoiceData.lines.data.map((line) => ({
        description: line.description,
        amount: line.amount,
        quantity: line.quantity,
      })),
    },
  });

  // Update subscription status to active if it was trialing
  if (subscription.status === 'trialing') {
    await prisma.userSubscription.update({
      where: { id: subscription.id },
      data: { status: 'active' },
    });
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Type assertion for Stripe API compatibility
  const invoiceData = invoice as unknown as { subscription?: string | null };

  if (!invoiceData.subscription) return;

  await subscriptionService.handlePaymentFailure(invoiceData.subscription, 'stripe');

  // TODO: Send payment failed email notification
  console.log('Payment failed for subscription:', invoiceData.subscription);
}

async function handleTrialEnding(stripeSubscription: Stripe.Subscription) {
  const subscription = await prisma.userSubscription.findUnique({
    where: { stripeSubscriptionId: stripeSubscription.id },
    include: { user: true },
  });

  if (!subscription) return;

  // TODO: Send trial ending email notification
  console.log(`Trial ending for user ${subscription.user.email}`);
}

async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  // Detect wallet type from card metadata
  const walletType = paymentMethod.card?.wallet?.type;
  const customer = paymentMethod.customer as string;

  if (!customer) return;

  // Find user by Stripe customer ID
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customer },
  });

  if (!user) {
    console.log('User not found for Stripe customer:', customer);
    return;
  }

  // Determine payment method type for storage
  let methodType: string = 'card';
  if (walletType === 'apple_pay') {
    methodType = 'apple_pay';
  } else if (walletType === 'google_pay') {
    methodType = 'google_pay';
  } else if (walletType === 'link') {
    methodType = 'link';
  }

  // Check if payment method already exists
  const existing = await prisma.paymentMethod.findFirst({
    where: { stripePaymentMethodId: paymentMethod.id },
  });

  if (existing) {
    console.log('Payment method already exists:', paymentMethod.id);
    return;
  }

  // Create payment method record
  await prisma.paymentMethod.create({
    data: {
      userId: user.id,
      type: methodType,
      provider: 'stripe',
      stripePaymentMethodId: paymentMethod.id,
      walletType: walletType || null,
      cardBrand: paymentMethod.card?.brand || null,
      cardLast4: paymentMethod.card?.last4 || null,
      cardExpMonth: paymentMethod.card?.exp_month || null,
      cardExpYear: paymentMethod.card?.exp_year || null,
      isActive: true,
    },
  });

  console.log(`Payment method attached: ${methodType} for user ${user.id}`);
}
