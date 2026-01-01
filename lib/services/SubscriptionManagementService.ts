// Subscription Management Service
// Handles upgrade/downgrade, proration, scheduled changes

import { stripe } from '@/lib/payments/stripe';
import prisma from '@/lib/db/prisma';
import { PRICING_TIERS } from '@/lib/config/pricing';
import Stripe from 'stripe';

export interface ProrationPreview {
  currentPlan: {
    name: string;
    price: number;
    billingCycle: string;
  };
  newPlan: {
    name: string;
    price: number;
    billingCycle: string;
  };
  proration: {
    credit: number;        // Credit from unused time on current plan
    charge: number;        // Charge for new plan (prorated)
    netAmount: number;     // Net amount to charge (can be negative = credit)
    immediateCharge: number; // Amount charged today
  };
  effectiveDate: Date;
  nextBillingDate: Date;
  nextBillingAmount: number;
}

export interface ChangeResult {
  success: boolean;
  error?: string;
  change?: any;
  requiresPayment?: boolean;
  paymentIntentClientSecret?: string;
}

export class SubscriptionManagementService {
  private getStripe(): Stripe {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }
    return stripe;
  }

  // ============================================
  // PRORATION PREVIEW
  // ============================================

  /**
   * Get proration preview for plan change
   */
  async getProrationPreview(
    subscriptionId: string,
    newTierId: string,
    newBillingCycle: 'monthly' | 'yearly'
  ): Promise<ProrationPreview | null> {
    const subscription = await prisma.userSubscription.findUnique({
      where: { id: subscriptionId },
      include: { tier: true },
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      return null;
    }

    const newTier = await prisma.pricingTier.findUnique({
      where: { name: newTierId },
    });

    if (!newTier) {
      return null;
    }

    // Get new price ID
    const newPriceId = newBillingCycle === 'yearly'
      ? newTier.stripePriceIdYearly
      : newTier.stripePriceIdMonthly;

    if (!newPriceId) {
      return null;
    }

    try {
      const stripeInstance = this.getStripe();

      // Get Stripe subscription
      const stripeSubscription = await stripeInstance.subscriptions.retrieve(
        subscription.stripeSubscriptionId
      );

      // Get proration preview from Stripe
      const prorationPreview = await stripeInstance.invoices.createPreview({
        customer: subscription.stripeCustomerId!,
        subscription: subscription.stripeSubscriptionId,
        subscription_details: {
          items: [
            {
              id: stripeSubscription.items.data[0].id,
              price: newPriceId,
            },
          ],
          proration_behavior: 'create_prorations',
        },
      });

      // Calculate proration details
      const currentPrice = subscription.billingCycle === 'yearly'
        ? subscription.tier.priceYearly || 0
        : subscription.tier.priceMonthly;

      const newPrice = newBillingCycle === 'yearly'
        ? newTier.priceYearly || 0
        : newTier.priceMonthly;

      // Find proration line items (use type assertion for Stripe API compatibility)
      const prorationLines = prorationPreview.lines.data.filter(
        (line) => (line as unknown as { proration: boolean }).proration
      );

      let credit = 0;
      let charge = 0;

      for (const line of prorationLines) {
        if (line.amount < 0) {
          credit += Math.abs(line.amount);
        } else {
          charge += line.amount;
        }
      }

      const netAmount = charge - credit;
      const subscriptionData = stripeSubscription as unknown as {
        current_period_end: number;
      };

      return {
        currentPlan: {
          name: subscription.tier.displayName,
          price: currentPrice,
          billingCycle: subscription.billingCycle,
        },
        newPlan: {
          name: newTier.displayName,
          price: newPrice,
          billingCycle: newBillingCycle,
        },
        proration: {
          credit,
          charge,
          netAmount,
          immediateCharge: Math.max(0, netAmount),
        },
        effectiveDate: new Date(),
        nextBillingDate: new Date(subscriptionData.current_period_end * 1000),
        nextBillingAmount: newPrice,
      };
    } catch (error) {
      console.error('Proration preview error:', error);
      return null;
    }
  }

  // ============================================
  // UPGRADE SUBSCRIPTION
  // ============================================

  /**
   * Upgrade subscription (immediate with proration)
   */
  async upgradeSubscription(
    subscriptionId: string,
    newTierId: string,
    newBillingCycle: 'monthly' | 'yearly'
  ): Promise<ChangeResult> {
    const subscription = await prisma.userSubscription.findUnique({
      where: { id: subscriptionId },
      include: { tier: true },
    });

    if (!subscription) {
      return { success: false, error: 'Subscription not found' };
    }

    const newTier = await prisma.pricingTier.findUnique({
      where: { name: newTierId },
    });

    if (!newTier) {
      return { success: false, error: 'New tier not found' };
    }

    // Verify this is actually an upgrade
    const currentTierIndex = PRICING_TIERS.findIndex(t => t.id === subscription.tier.name);
    const newTierIndex = PRICING_TIERS.findIndex(t => t.id === newTierId);

    if (newTierIndex <= currentTierIndex && newBillingCycle === subscription.billingCycle) {
      return { success: false, error: 'This is not an upgrade. Use downgrade endpoint.' };
    }

    try {
      // Cancel any scheduled changes
      await this.cancelScheduledChange(subscriptionId);

      // Get new price ID
      const newPriceId = newBillingCycle === 'yearly'
        ? newTier.stripePriceIdYearly
        : newTier.stripePriceIdMonthly;

      if (!newPriceId || !subscription.stripeSubscriptionId) {
        return { success: false, error: 'Stripe configuration missing' };
      }

      const stripeInstance = this.getStripe();

      // Get current Stripe subscription
      const stripeSubscription = await stripeInstance.subscriptions.retrieve(
        subscription.stripeSubscriptionId
      );

      // Update subscription with proration
      const updatedSubscription = await stripeInstance.subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          items: [
            {
              id: stripeSubscription.items.data[0].id,
              price: newPriceId,
            },
          ],
          proration_behavior: 'create_prorations',
          payment_behavior: 'pending_if_incomplete',
          expand: ['latest_invoice.payment_intent'],
        }
      );

      // Check if payment is required (use type assertion for Stripe API compatibility)
      const invoice = updatedSubscription.latest_invoice as Stripe.Invoice | null;
      const invoiceData = invoice as unknown as { payment_intent?: Stripe.PaymentIntent | null } | null;
      const paymentIntent = invoiceData?.payment_intent;

      if (paymentIntent?.status === 'requires_action' || paymentIntent?.status === 'requires_payment_method') {
        // Payment needs confirmation
        return {
          success: true,
          requiresPayment: true,
          paymentIntentClientSecret: paymentIntent.client_secret!,
        };
      }

      // Record the change
      const change = await prisma.subscriptionChange.create({
        data: {
          subscriptionId,
          userId: subscription.userId,
          changeType: 'upgrade',
          fromTierId: subscription.tierId,
          fromTierName: subscription.tier.displayName,
          fromBillingCycle: subscription.billingCycle,
          fromPrice: subscription.billingCycle === 'yearly'
            ? subscription.tier.priceYearly
            : subscription.tier.priceMonthly,
          toTierId: newTier.id,
          toTierName: newTier.displayName,
          toBillingCycle: newBillingCycle,
          toPrice: newBillingCycle === 'yearly' ? newTier.priceYearly : newTier.priceMonthly,
          effectiveDate: new Date(),
          isImmediate: true,
          status: 'completed',
          completedAt: new Date(),
        },
      });

      // Update subscription in database
      await prisma.userSubscription.update({
        where: { id: subscriptionId },
        data: {
          tierId: newTier.id,
          billingCycle: newBillingCycle,
          scheduledTierId: null,
          scheduledBillingCycle: null,
        },
      });

      return { success: true, change };
    } catch (error: any) {
      console.error('Upgrade error:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // DOWNGRADE SUBSCRIPTION
  // ============================================

  /**
   * Downgrade subscription (takes effect at period end)
   */
  async downgradeSubscription(
    subscriptionId: string,
    newTierId: string,
    newBillingCycle: 'monthly' | 'yearly'
  ): Promise<ChangeResult> {
    const subscription = await prisma.userSubscription.findUnique({
      where: { id: subscriptionId },
      include: { tier: true },
    });

    if (!subscription) {
      return { success: false, error: 'Subscription not found' };
    }

    const newTier = await prisma.pricingTier.findUnique({
      where: { name: newTierId },
    });

    if (!newTier) {
      return { success: false, error: 'New tier not found' };
    }

    // Verify this is actually a downgrade
    const currentTierIndex = PRICING_TIERS.findIndex(t => t.id === subscription.tier.name);
    const newTierIndex = PRICING_TIERS.findIndex(t => t.id === newTierId);

    if (newTierIndex >= currentTierIndex && newBillingCycle === subscription.billingCycle) {
      return { success: false, error: 'This is not a downgrade. Use upgrade endpoint.' };
    }

    try {
      // Get new price ID
      const newPriceId = newBillingCycle === 'yearly'
        ? newTier.stripePriceIdYearly
        : newTier.stripePriceIdMonthly;

      if (!newPriceId || !subscription.stripeSubscriptionId) {
        return { success: false, error: 'Stripe configuration missing' };
      }

      const stripeInstance = this.getStripe();

      // Get current Stripe subscription
      const stripeSubscription = await stripeInstance.subscriptions.retrieve(
        subscription.stripeSubscriptionId
      );

      const subscriptionData = stripeSubscription as unknown as {
        current_period_end: number;
      };

      // Schedule the downgrade for period end using subscription schedules
      const schedule = await stripeInstance.subscriptionSchedules.create({
        from_subscription: subscription.stripeSubscriptionId,
      });

      // Update the schedule to change at period end
      await stripeInstance.subscriptionSchedules.update(schedule.id, {
        phases: [
          {
            items: [
              {
                price: stripeSubscription.items.data[0].price.id,
                quantity: 1,
              },
            ],
            start_date: schedule.phases[0].start_date,
            end_date: subscriptionData.current_period_end,
          },
          {
            items: [
              {
                price: newPriceId,
                quantity: 1,
              },
            ],
            start_date: subscriptionData.current_period_end,
          },
        ],
      });

      // Record scheduled change
      await prisma.scheduledChange.upsert({
        where: { subscriptionId },
        create: {
          subscriptionId,
          newTierId: newTier.id,
          newBillingCycle,
          scheduledFor: new Date(subscriptionData.current_period_end * 1000),
        },
        update: {
          newTierId: newTier.id,
          newBillingCycle,
          scheduledFor: new Date(subscriptionData.current_period_end * 1000),
          status: 'scheduled',
        },
      });

      // Record the change
      const change = await prisma.subscriptionChange.create({
        data: {
          subscriptionId,
          userId: subscription.userId,
          changeType: 'downgrade',
          fromTierId: subscription.tierId,
          fromTierName: subscription.tier.displayName,
          fromBillingCycle: subscription.billingCycle,
          fromPrice: subscription.billingCycle === 'yearly'
            ? subscription.tier.priceYearly
            : subscription.tier.priceMonthly,
          toTierId: newTier.id,
          toTierName: newTier.displayName,
          toBillingCycle: newBillingCycle,
          toPrice: newBillingCycle === 'yearly' ? newTier.priceYearly : newTier.priceMonthly,
          effectiveDate: new Date(subscriptionData.current_period_end * 1000),
          isImmediate: false,
          status: 'pending',
          stripeSubscriptionScheduleId: schedule.id,
        },
      });

      // Update subscription with scheduled change
      await prisma.userSubscription.update({
        where: { id: subscriptionId },
        data: {
          scheduledTierId: newTier.id,
          scheduledBillingCycle: newBillingCycle,
        },
      });

      return { success: true, change };
    } catch (error: any) {
      console.error('Downgrade error:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // CANCEL SCHEDULED CHANGE
  // ============================================

  /**
   * Cancel a scheduled downgrade
   */
  async cancelScheduledChange(subscriptionId: string): Promise<ChangeResult> {
    const scheduledChange = await prisma.scheduledChange.findUnique({
      where: { subscriptionId },
    });

    if (!scheduledChange || scheduledChange.status !== 'scheduled') {
      return { success: true }; // No change to cancel
    }

    const subscription = await prisma.userSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription?.stripeSubscriptionId) {
      return { success: false, error: 'Subscription not found' };
    }

    try {
      const stripeInstance = this.getStripe();

      // Find and cancel the schedule
      const schedules = await stripeInstance.subscriptionSchedules.list({
        customer: subscription.stripeCustomerId!,
      });

      const activeSchedule = schedules.data.find(
        s => s.subscription === subscription.stripeSubscriptionId && s.status === 'active'
      );

      if (activeSchedule) {
        await stripeInstance.subscriptionSchedules.release(activeSchedule.id);
      }

      // Update database
      await prisma.scheduledChange.update({
        where: { subscriptionId },
        data: { status: 'canceled' },
      });

      await prisma.userSubscription.update({
        where: { id: subscriptionId },
        data: {
          scheduledTierId: null,
          scheduledBillingCycle: null,
        },
      });

      // Update pending change record
      await prisma.subscriptionChange.updateMany({
        where: {
          subscriptionId,
          status: 'pending',
        },
        data: {
          status: 'canceled',
        },
      });

      return { success: true };
    } catch (error: any) {
      console.error('Cancel scheduled change error:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // CANCEL SUBSCRIPTION
  // ============================================

  /**
   * Cancel subscription (at period end)
   */
  async cancelSubscription(
    subscriptionId: string,
    reason?: string,
    feedback?: string
  ): Promise<ChangeResult> {
    const subscription = await prisma.userSubscription.findUnique({
      where: { id: subscriptionId },
      include: { tier: true },
    });

    if (!subscription) {
      return { success: false, error: 'Subscription not found' };
    }

    try {
      if (subscription.stripeSubscriptionId) {
        const stripeInstance = this.getStripe();
        await stripeInstance.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
          metadata: {
            cancelReason: reason || '',
            cancelFeedback: feedback || '',
          },
        });
      }

      // Record the change
      const change = await prisma.subscriptionChange.create({
        data: {
          subscriptionId,
          userId: subscription.userId,
          changeType: 'cancel',
          fromTierId: subscription.tierId,
          fromTierName: subscription.tier.displayName,
          fromBillingCycle: subscription.billingCycle,
          fromPrice: subscription.billingCycle === 'yearly'
            ? subscription.tier.priceYearly
            : subscription.tier.priceMonthly,
          effectiveDate: subscription.currentPeriodEnd || new Date(),
          isImmediate: false,
          status: 'pending',
        },
      });

      // Update subscription
      await prisma.userSubscription.update({
        where: { id: subscriptionId },
        data: {
          cancelAtPeriodEnd: true,
          canceledAt: new Date(),
        },
      });

      return { success: true, change };
    } catch (error: any) {
      console.error('Cancel subscription error:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // REACTIVATE SUBSCRIPTION
  // ============================================

  /**
   * Reactivate a canceled subscription
   */
  async reactivateSubscription(subscriptionId: string): Promise<ChangeResult> {
    const subscription = await prisma.userSubscription.findUnique({
      where: { id: subscriptionId },
      include: { tier: true },
    });

    if (!subscription) {
      return { success: false, error: 'Subscription not found' };
    }

    if (!subscription.cancelAtPeriodEnd) {
      return { success: false, error: 'Subscription is not scheduled for cancellation' };
    }

    try {
      if (subscription.stripeSubscriptionId) {
        const stripeInstance = this.getStripe();
        await stripeInstance.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: false,
        });
      }

      // Record the change
      const change = await prisma.subscriptionChange.create({
        data: {
          subscriptionId,
          userId: subscription.userId,
          changeType: 'reactivate',
          toTierId: subscription.tierId,
          toTierName: subscription.tier.displayName,
          toBillingCycle: subscription.billingCycle,
          toPrice: subscription.billingCycle === 'yearly'
            ? subscription.tier.priceYearly
            : subscription.tier.priceMonthly,
          effectiveDate: new Date(),
          isImmediate: true,
          status: 'completed',
          completedAt: new Date(),
        },
      });

      // Update subscription
      await prisma.userSubscription.update({
        where: { id: subscriptionId },
        data: {
          cancelAtPeriodEnd: false,
          canceledAt: null,
        },
      });

      // Cancel the pending cancel change record
      await prisma.subscriptionChange.updateMany({
        where: {
          subscriptionId,
          changeType: 'cancel',
          status: 'pending',
        },
        data: {
          status: 'canceled',
        },
      });

      return { success: true, change };
    } catch (error: any) {
      console.error('Reactivate subscription error:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // CHANGE BILLING CYCLE ONLY
  // ============================================

  /**
   * Change billing cycle without changing tier
   */
  async changeBillingCycle(
    subscriptionId: string,
    newBillingCycle: 'monthly' | 'yearly'
  ): Promise<ChangeResult> {
    const subscription = await prisma.userSubscription.findUnique({
      where: { id: subscriptionId },
      include: { tier: true },
    });

    if (!subscription) {
      return { success: false, error: 'Subscription not found' };
    }

    if (subscription.billingCycle === newBillingCycle) {
      return { success: false, error: 'Already on this billing cycle' };
    }

    // Switching to yearly is treated as upgrade (immediate with proration)
    // Switching to monthly is treated as downgrade (at period end)
    if (newBillingCycle === 'yearly') {
      return this.upgradeSubscription(subscriptionId, subscription.tier.name, newBillingCycle);
    } else {
      return this.downgradeSubscription(subscriptionId, subscription.tier.name, newBillingCycle);
    }
  }

  // ============================================
  // GET CHANGE HISTORY
  // ============================================

  /**
   * Get subscription change history
   */
  async getChangeHistory(subscriptionId: string, limit = 10) {
    return prisma.subscriptionChange.findMany({
      where: { subscriptionId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // ============================================
  // CHECK IF CHANGE IS UPGRADE
  // ============================================

  /**
   * Determine if a plan change is an upgrade or downgrade
   */
  isUpgrade(
    currentTierId: string,
    currentBillingCycle: string,
    newTierId: string,
    newBillingCycle: string
  ): boolean {
    const currentIndex = PRICING_TIERS.findIndex(t => t.id === currentTierId);
    const newIndex = PRICING_TIERS.findIndex(t => t.id === newTierId);

    // Higher tier = upgrade
    if (newIndex > currentIndex) return true;

    // Same tier, monthly to yearly = upgrade
    if (newIndex === currentIndex && currentBillingCycle === 'monthly' && newBillingCycle === 'yearly') {
      return true;
    }

    return false;
  }

  // ============================================
  // HANDLE WEBHOOK EVENTS
  // ============================================

  /**
   * Handle subscription schedule completed (downgrade executed)
   */
  async handleScheduleCompleted(scheduleId: string): Promise<void> {
    const change = await prisma.subscriptionChange.findFirst({
      where: {
        stripeSubscriptionScheduleId: scheduleId,
        status: 'pending',
      },
    });

    if (!change) return;

    // Update the change record
    await prisma.subscriptionChange.update({
      where: { id: change.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });

    // Update the subscription
    await prisma.userSubscription.update({
      where: { id: change.subscriptionId },
      data: {
        tierId: change.toTierId!,
        billingCycle: change.toBillingCycle!,
        scheduledTierId: null,
        scheduledBillingCycle: null,
      },
    });

    // Update scheduled change record
    await prisma.scheduledChange.updateMany({
      where: { subscriptionId: change.subscriptionId },
      data: { status: 'executed' },
    });
  }

  /**
   * Handle subscription schedule canceled
   */
  async handleScheduleCanceled(scheduleId: string): Promise<void> {
    await prisma.subscriptionChange.updateMany({
      where: {
        stripeSubscriptionScheduleId: scheduleId,
        status: 'pending',
      },
      data: {
        status: 'canceled',
      },
    });
  }
}

// Export singleton instance
export const subscriptionManagementService = new SubscriptionManagementService();
