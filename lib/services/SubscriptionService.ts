// Unified Subscription Management Service
// Handles subscriptions across Stripe and PayPal

import { StripeService } from './payments/StripeService';
import { PayPalService } from './payments/PayPalService';
import prisma from '@/lib/db/prisma';
import { TRIAL_DAYS, getTierById } from '@/lib/config/pricing';

export type PaymentProvider = 'stripe' | 'paypal';
export type BillingCycle = 'monthly' | 'yearly';

export interface CreateSubscriptionParams {
  userId: string;
  tierId: string;
  provider: PaymentProvider;
  billingCycle: BillingCycle;
  paymentMethodId?: string; // For Stripe
  returnUrl?: string; // For PayPal
  cancelUrl?: string; // For PayPal
}

export interface SubscriptionResult {
  success: boolean;
  subscription?: {
    id: string;
    status: string;
    tierId: string;
    trialEndDate?: Date;
  };
  clientSecret?: string; // For Stripe
  approvalUrl?: string; // For PayPal
  error?: string;
}

export interface UsageStats {
  brands: {
    used: number;
    limit: number;
    percentage: number;
  };
  teamSeats: {
    used: number;
    limit: number | 'Unlimited';
    percentage: number;
  };
  customTopicsPerBrand: number;
  competitorsPerBrand: number;
  updateFrequency: string;
}

export class SubscriptionService {
  private stripeService: StripeService;
  private paypalService: PayPalService;

  constructor() {
    this.stripeService = new StripeService();
    this.paypalService = new PayPalService();
  }

  /**
   * Create a new subscription
   */
  async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult> {
    const { userId, tierId, provider, billingCycle, paymentMethodId, returnUrl, cancelUrl } = params;

    try {
      // Get user and tier
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const tier = await prisma.pricingTier.findUnique({
        where: { name: tierId },
      });

      if (!tier) {
        return { success: false, error: 'Pricing tier not found' };
      }

      // Check for existing active subscription
      const existingSubscription = await prisma.userSubscription.findFirst({
        where: {
          userId,
          status: { in: ['active', 'trialing'] },
        },
      });

      if (existingSubscription) {
        return { success: false, error: 'User already has an active subscription' };
      }

      if (provider === 'stripe') {
        return this.createStripeSubscription(user, tier, billingCycle, paymentMethodId);
      } else if (provider === 'paypal') {
        if (!returnUrl || !cancelUrl) {
          return { success: false, error: 'Return and cancel URLs required for PayPal' };
        }
        return this.createPayPalSubscription(user, tier, billingCycle, returnUrl, cancelUrl);
      }

      return { success: false, error: 'Invalid payment provider' };
    } catch (error) {
      console.error('Create subscription error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Create Stripe subscription
   */
  private async createStripeSubscription(
    user: { id: string; email: string; name?: string | null },
    tier: { id: string; name: string; stripePriceIdMonthly?: string | null; stripePriceIdYearly?: string | null },
    billingCycle: BillingCycle,
    paymentMethodId?: string
  ): Promise<SubscriptionResult> {
    // Get or create Stripe customer
    const customerId = await this.stripeService.getOrCreateCustomer(
      user.id,
      user.email,
      user.name || undefined
    );

    const priceId = billingCycle === 'yearly'
      ? tier.stripePriceIdYearly
      : tier.stripePriceIdMonthly;

    if (!priceId) {
      return { success: false, error: 'Stripe price not configured for this tier' };
    }

    // Create subscription
    const stripeSubscription = await this.stripeService.createSubscription(
      customerId,
      priceId,
      user.id,
      tier.id
    );

    const trialEndDate = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    // Save to database
    const subscription = await prisma.userSubscription.create({
      data: {
        userId: user.id,
        tierId: tier.id,
        status: 'trialing',
        billingCycle,
        stripeSubscriptionId: stripeSubscription.id,
        stripeCustomerId: customerId,
        trialStartDate: new Date(),
        trialEndDate,
        trialDaysRemaining: TRIAL_DAYS,
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEndDate,
      },
    });

    // Get client secret for payment confirmation
    const invoice = stripeSubscription.latest_invoice as { payment_intent?: { client_secret?: string } } | null;
    const clientSecret = invoice?.payment_intent?.client_secret;

    return {
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        tierId: tier.id,
        trialEndDate,
      },
      clientSecret: clientSecret || undefined,
    };
  }

  /**
   * Create PayPal subscription
   */
  private async createPayPalSubscription(
    user: { id: string },
    tier: { id: string; name: string; paypalPlanIdMonthly?: string | null; paypalPlanIdYearly?: string | null },
    billingCycle: BillingCycle,
    returnUrl: string,
    cancelUrl: string
  ): Promise<SubscriptionResult> {
    const planId = billingCycle === 'yearly'
      ? tier.paypalPlanIdYearly
      : tier.paypalPlanIdMonthly;

    if (!planId) {
      return { success: false, error: 'PayPal plan not configured for this tier' };
    }

    const { subscriptionId, approvalUrl } = await this.paypalService.createSubscription(
      planId,
      user.id,
      returnUrl,
      cancelUrl
    );

    // Save pending subscription
    const subscription = await prisma.userSubscription.create({
      data: {
        userId: user.id,
        tierId: tier.id,
        status: 'pending', // Will be updated via webhook
        billingCycle,
        paypalSubscriptionId: subscriptionId,
      },
    });

    return {
      success: true,
      subscription: {
        id: subscription.id,
        status: 'pending',
        tierId: tier.id,
      },
      approvalUrl,
    };
  }

  /**
   * Get user's active subscription
   */
  async getActiveSubscription(userId: string) {
    return prisma.userSubscription.findFirst({
      where: {
        userId,
        status: { in: ['active', 'trialing'] },
      },
      include: {
        tier: true,
      },
    });
  }

  /**
   * Get subscription by ID
   */
  async getSubscription(subscriptionId: string) {
    return prisma.userSubscription.findUnique({
      where: { id: subscriptionId },
      include: {
        tier: true,
        user: true,
      },
    });
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    immediately = false
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const subscription = await prisma.userSubscription.findUnique({
        where: { id: subscriptionId },
      });

      if (!subscription) {
        return { success: false, error: 'Subscription not found' };
      }

      if (subscription.stripeSubscriptionId) {
        await this.stripeService.cancelSubscription(
          subscription.stripeSubscriptionId,
          immediately
        );
      } else if (subscription.paypalSubscriptionId) {
        await this.paypalService.cancelSubscription(
          subscription.paypalSubscriptionId,
          'User requested cancellation'
        );
      }

      await prisma.userSubscription.update({
        where: { id: subscriptionId },
        data: {
          status: immediately ? 'canceled' : 'active',
          cancelAtPeriodEnd: !immediately,
          canceledAt: new Date(),
        },
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Change subscription tier
   */
  async changeTier(
    subscriptionId: string,
    newTierId: string,
    billingCycle: BillingCycle
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const subscription = await prisma.userSubscription.findUnique({
        where: { id: subscriptionId },
      });

      const newTier = await prisma.pricingTier.findUnique({
        where: { name: newTierId },
      });

      if (!subscription || !newTier) {
        return { success: false, error: 'Subscription or tier not found' };
      }

      if (subscription.stripeSubscriptionId) {
        const priceId = billingCycle === 'yearly'
          ? newTier.stripePriceIdYearly
          : newTier.stripePriceIdMonthly;

        if (!priceId) {
          return { success: false, error: 'Stripe price not configured' };
        }

        await this.stripeService.updateSubscriptionTier(
          subscription.stripeSubscriptionId,
          priceId
        );
      }
      // Note: PayPal tier changes would require canceling and creating new subscription

      await prisma.userSubscription.update({
        where: { id: subscriptionId },
        data: {
          tierId: newTier.id,
          billingCycle,
        },
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Check if user can add more brands
   */
  async canAddBrand(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    const subscription = await this.getActiveSubscription(userId);

    if (!subscription) {
      return { allowed: false, reason: 'No active subscription' };
    }

    const brandCount = await prisma.brand360Profile.count({
      where: { organizationId: userId },
    });

    if (brandCount >= subscription.tier.brandLimit) {
      return {
        allowed: false,
        reason: `Brand limit reached (${brandCount}/${subscription.tier.brandLimit}). Upgrade to add more brands.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Check if user can use a specific feature
   */
  async canUseFeature(
    userId: string,
    featureName: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    const subscription = await this.getActiveSubscription(userId);

    if (!subscription) {
      return { allowed: false, reason: 'No active subscription' };
    }

    const features = subscription.tier.features as Array<{ name: string; included: boolean }>;
    const feature = features.find(f => f.name === featureName);

    if (!feature || !feature.included) {
      return {
        allowed: false,
        reason: `${featureName} is not available in your current plan. Upgrade to access this feature.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(userId: string): Promise<UsageStats | null> {
    const subscription = await this.getActiveSubscription(userId);

    if (!subscription) {
      return null;
    }

    const brandCount = await prisma.brand360Profile.count({
      where: { organizationId: userId },
    });

    // Count team members (via memberships)
    const teamMemberCount = await prisma.membership.count({
      where: {
        user: { id: userId },
      },
    }) || 1;

    return {
      brands: {
        used: brandCount,
        limit: subscription.tier.brandLimit,
        percentage: (brandCount / subscription.tier.brandLimit) * 100,
      },
      teamSeats: {
        used: teamMemberCount,
        limit: subscription.tier.teamSeatLimit === -1 ? 'Unlimited' : subscription.tier.teamSeatLimit,
        percentage: subscription.tier.teamSeatLimit === -1
          ? 0
          : (teamMemberCount / subscription.tier.teamSeatLimit) * 100,
      },
      customTopicsPerBrand: subscription.tier.customTopicsPerBrand,
      competitorsPerBrand: subscription.tier.competitorLimitPerBrand,
      updateFrequency: subscription.tier.updateFrequency,
    };
  }

  /**
   * Update trial days remaining (run daily via cron)
   */
  async updateTrialDaysRemaining(): Promise<void> {
    const trialingSubscriptions = await prisma.userSubscription.findMany({
      where: { status: 'trialing' },
    });

    for (const sub of trialingSubscriptions) {
      if (!sub.trialEndDate) continue;

      const now = new Date();
      const daysRemaining = Math.max(
        0,
        Math.ceil((sub.trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );

      await prisma.userSubscription.update({
        where: { id: sub.id },
        data: { trialDaysRemaining: daysRemaining },
      });

      // If trial has ended but no payment, pause the subscription
      if (daysRemaining === 0 && sub.status === 'trialing') {
        await prisma.userSubscription.update({
          where: { id: sub.id },
          data: { status: 'paused' },
        });
      }
    }
  }

  /**
   * Handle successful payment (called from webhooks)
   */
  async handlePaymentSuccess(
    subscriptionId: string,
    provider: 'stripe' | 'paypal'
  ): Promise<void> {
    const whereClause = provider === 'stripe'
      ? { stripeSubscriptionId: subscriptionId }
      : { paypalSubscriptionId: subscriptionId };

    await prisma.userSubscription.updateMany({
      where: whereClause,
      data: {
        status: 'active',
        trialDaysRemaining: null,
      },
    });
  }

  /**
   * Handle payment failure (called from webhooks)
   */
  async handlePaymentFailure(
    subscriptionId: string,
    provider: 'stripe' | 'paypal'
  ): Promise<void> {
    const whereClause = provider === 'stripe'
      ? { stripeSubscriptionId: subscriptionId }
      : { paypalSubscriptionId: subscriptionId };

    await prisma.userSubscription.updateMany({
      where: whereClause,
      data: { status: 'past_due' },
    });
  }

  /**
   * Handle subscription canceled (called from webhooks)
   */
  async handleSubscriptionCanceled(
    subscriptionId: string,
    provider: 'stripe' | 'paypal'
  ): Promise<void> {
    const whereClause = provider === 'stripe'
      ? { stripeSubscriptionId: subscriptionId }
      : { paypalSubscriptionId: subscriptionId };

    await prisma.userSubscription.updateMany({
      where: whereClause,
      data: {
        status: 'canceled',
        canceledAt: new Date(),
      },
    });
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();
