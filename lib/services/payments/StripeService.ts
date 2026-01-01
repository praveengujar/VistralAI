// Stripe Payment Service
// Handles all Stripe-related operations

import { stripe } from '@/lib/payments/stripe';
import prisma from '@/lib/db/prisma';
import { PRICING_TIERS, TRIAL_DAYS } from '@/lib/config/pricing';
import Stripe from 'stripe';

export class StripeService {
  private getStripe(): Stripe {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }
    return stripe;
  }

  /**
   * Create or get Stripe customer
   */
  async getOrCreateCustomer(userId: string, email: string, name?: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (user?.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await this.getStripe().customers.create({
      email,
      name: name || undefined,
      metadata: {
        userId,
      },
    });

    // Save customer ID
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  /**
   * Create setup intent for collecting payment method
   */
  async createSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
    return this.getStripe().setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
    });
  }

  /**
   * Create payment intent for immediate payment
   */
  async createPaymentIntent(
    customerId: string,
    amount: number,
    currency: string = 'usd'
  ): Promise<Stripe.PaymentIntent> {
    return this.getStripe().paymentIntents.create({
      customer: customerId,
      amount,
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });
  }

  /**
   * Create subscription with trial
   */
  async createSubscription(
    customerId: string,
    priceId: string,
    userId: string,
    tierId: string
  ): Promise<Stripe.Subscription> {
    const subscription = await this.getStripe().subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      trial_period_days: TRIAL_DAYS,
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId,
        tierId,
      },
    });

    return subscription;
  }

  /**
   * Create subscription without trial (immediate charge)
   */
  async createSubscriptionImmediate(
    customerId: string,
    priceId: string,
    paymentMethodId: string,
    userId: string,
    tierId: string
  ): Promise<Stripe.Subscription> {
    // Set default payment method
    await this.getStripe().customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    const subscription = await this.getStripe().subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId,
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId,
        tierId,
      },
    });

    return subscription;
  }

  /**
   * Create checkout session (alternative flow)
   */
  async createCheckoutSession(
    customerId: string,
    priceId: string,
    userId: string,
    tierId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session> {
    return this.getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: TRIAL_DAYS,
        metadata: {
          userId,
          tierId,
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    });
  }

  /**
   * Get or create Stripe prices for tiers
   */
  async syncPricesToStripe(): Promise<void> {
    const stripeInstance = this.getStripe();

    for (const tier of PRICING_TIERS) {
      // Create or get product
      let product: Stripe.Product;
      const existingProducts = await stripeInstance.products.list({
        limit: 100,
      });

      const existingProduct = existingProducts.data.find(
        (p) => p.metadata.tierId === tier.id
      );

      if (existingProduct) {
        product = existingProduct;
      } else {
        product = await stripeInstance.products.create({
          name: `VistralAI ${tier.displayName}`,
          description: tier.description,
          metadata: {
            tierId: tier.id,
          },
        });
      }

      // Create monthly price
      const monthlyPrice = await stripeInstance.prices.create({
        product: product.id,
        unit_amount: tier.priceMonthly * 100,
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
        metadata: {
          tierId: tier.id,
          billingCycle: 'monthly',
        },
      });

      // Create yearly price
      const yearlyPrice = await stripeInstance.prices.create({
        product: product.id,
        unit_amount: tier.priceYearly * 100,
        currency: 'usd',
        recurring: {
          interval: 'year',
        },
        metadata: {
          tierId: tier.id,
          billingCycle: 'yearly',
        },
      });

      // Update database
      await prisma.pricingTier.update({
        where: { name: tier.name },
        data: {
          stripeProductId: product.id,
          stripePriceIdMonthly: monthlyPrice.id,
          stripePriceIdYearly: yearlyPrice.id,
        },
      });

      console.log(`Synced ${tier.displayName}: ${monthlyPrice.id} / ${yearlyPrice.id}`);
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, immediately = false): Promise<Stripe.Subscription> {
    if (immediately) {
      return this.getStripe().subscriptions.cancel(subscriptionId);
    }

    return this.getStripe().subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }

  /**
   * Resume canceled subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.getStripe().subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
  }

  /**
   * Update subscription tier
   */
  async updateSubscriptionTier(
    subscriptionId: string,
    newPriceId: string
  ): Promise<Stripe.Subscription> {
    const subscription = await this.getStripe().subscriptions.retrieve(subscriptionId);

    return this.getStripe().subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations',
    });
  }

  /**
   * Get subscription status
   */
  async getSubscriptionStatus(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.getStripe().subscriptions.retrieve(subscriptionId);
  }

  /**
   * List customer payment methods
   */
  async listPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    const methods = await this.getStripe().paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
    return methods.data;
  }

  /**
   * Attach payment method to customer
   */
  async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string
  ): Promise<Stripe.PaymentMethod> {
    return this.getStripe().paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<Stripe.Customer> {
    return this.getStripe().customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    }) as Promise<Stripe.Customer>;
  }

  /**
   * Get upcoming invoice preview
   */
  async getUpcomingInvoice(customerId: string): Promise<Stripe.UpcomingInvoice | null> {
    try {
      return await this.getStripe().invoices.createPreview({
        customer: customerId,
      });
    } catch {
      return null;
    }
  }

  /**
   * List customer invoices
   */
  async listInvoices(customerId: string, limit = 10): Promise<Stripe.Invoice[]> {
    const invoices = await this.getStripe().invoices.list({
      customer: customerId,
      limit,
    });
    return invoices.data;
  }

  /**
   * Construct webhook event
   */
  constructWebhookEvent(body: string, signature: string, secret: string): Stripe.Event {
    return this.getStripe().webhooks.constructEvent(body, signature, secret);
  }
}

// Export singleton instance
export const stripeService = new StripeService();
