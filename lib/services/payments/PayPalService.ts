// PayPal Payment Service
// Handles all PayPal-related operations using REST API

import { paypalConfig, getPayPalBaseUrl } from '@/lib/payments/paypal';
import prisma from '@/lib/db/prisma';
import { PRICING_TIERS, TRIAL_DAYS } from '@/lib/config/pricing';

interface PayPalAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface PayPalPlan {
  id: string;
  name: string;
  status: string;
}

interface PayPalSubscription {
  id: string;
  status: string;
  links: Array<{ rel: string; href: string }>;
}

export class PayPalService {
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.baseUrl = getPayPalBaseUrl();
  }

  private getConfig() {
    if (!paypalConfig) {
      throw new Error('PayPal is not configured');
    }
    return paypalConfig;
  }

  /**
   * Get access token for PayPal API
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const config = this.getConfig();
    const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(`Failed to get PayPal access token: ${response.statusText}`);
    }

    const data: PayPalAccessToken = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // Refresh 1 min before expiry

    return this.accessToken;
  }

  /**
   * Create PayPal product (run once per tier)
   */
  async createProduct(tierId: string, tierName: string): Promise<string> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/v1/catalogs/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `VistralAI ${tierName}`,
        description: `VistralAI ${tierName} Subscription`,
        type: 'SERVICE',
        category: 'SOFTWARE',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create PayPal product: ${error}`);
    }

    const product = await response.json();
    return product.id;
  }

  /**
   * Create PayPal subscription plan (run once per tier)
   */
  async createPlan(
    productId: string,
    tierName: string,
    priceMonthly: number,
    priceYearly: number
  ): Promise<{ monthlyPlanId: string; yearlyPlanId: string }> {
    const accessToken = await this.getAccessToken();

    // Create monthly plan with trial
    const monthlyPlanResponse = await fetch(`${this.baseUrl}/v1/billing/plans`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: productId,
        name: `${tierName} Monthly`,
        billing_cycles: [
          {
            frequency: {
              interval_unit: 'DAY',
              interval_count: TRIAL_DAYS,
            },
            tenure_type: 'TRIAL',
            sequence: 1,
            total_cycles: 1,
            pricing_scheme: {
              fixed_price: {
                value: '0',
                currency_code: 'USD',
              },
            },
          },
          {
            frequency: {
              interval_unit: 'MONTH',
              interval_count: 1,
            },
            tenure_type: 'REGULAR',
            sequence: 2,
            total_cycles: 0, // Infinite
            pricing_scheme: {
              fixed_price: {
                value: priceMonthly.toString(),
                currency_code: 'USD',
              },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: 'CONTINUE',
          payment_failure_threshold: 3,
        },
      }),
    });

    if (!monthlyPlanResponse.ok) {
      const error = await monthlyPlanResponse.text();
      throw new Error(`Failed to create monthly plan: ${error}`);
    }

    const monthlyPlan: PayPalPlan = await monthlyPlanResponse.json();

    // Create yearly plan with trial
    const yearlyPlanResponse = await fetch(`${this.baseUrl}/v1/billing/plans`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: productId,
        name: `${tierName} Yearly`,
        billing_cycles: [
          {
            frequency: {
              interval_unit: 'DAY',
              interval_count: TRIAL_DAYS,
            },
            tenure_type: 'TRIAL',
            sequence: 1,
            total_cycles: 1,
            pricing_scheme: {
              fixed_price: {
                value: '0',
                currency_code: 'USD',
              },
            },
          },
          {
            frequency: {
              interval_unit: 'YEAR',
              interval_count: 1,
            },
            tenure_type: 'REGULAR',
            sequence: 2,
            total_cycles: 0,
            pricing_scheme: {
              fixed_price: {
                value: priceYearly.toString(),
                currency_code: 'USD',
              },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: 'CONTINUE',
          payment_failure_threshold: 3,
        },
      }),
    });

    if (!yearlyPlanResponse.ok) {
      const error = await yearlyPlanResponse.text();
      throw new Error(`Failed to create yearly plan: ${error}`);
    }

    const yearlyPlan: PayPalPlan = await yearlyPlanResponse.json();

    return {
      monthlyPlanId: monthlyPlan.id,
      yearlyPlanId: yearlyPlan.id,
    };
  }

  /**
   * Sync all pricing tiers to PayPal
   */
  async syncPlansToPayPal(): Promise<void> {
    for (const tier of PRICING_TIERS) {
      console.log(`Syncing ${tier.displayName} to PayPal...`);

      // Create product
      const productId = await this.createProduct(tier.id, tier.displayName);

      // Create plans
      const { monthlyPlanId, yearlyPlanId } = await this.createPlan(
        productId,
        tier.displayName,
        tier.priceMonthly,
        tier.priceYearly
      );

      // Update database
      await prisma.pricingTier.update({
        where: { name: tier.name },
        data: {
          paypalProductId: productId,
          paypalPlanIdMonthly: monthlyPlanId,
          paypalPlanIdYearly: yearlyPlanId,
        },
      });

      console.log(`  ✓ ${tier.displayName}: ${monthlyPlanId} / ${yearlyPlanId}`);
    }
  }

  /**
   * Create PayPal subscription
   */
  async createSubscription(
    planId: string,
    userId: string,
    returnUrl: string,
    cancelUrl: string
  ): Promise<{ subscriptionId: string; approvalUrl: string }> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: planId,
        custom_id: userId,
        application_context: {
          brand_name: 'VistralAI',
          locale: 'en-US',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create subscription: ${error}`);
    }

    const subscription: PayPalSubscription = await response.json();

    const approvalLink = subscription.links.find(
      (link) => link.rel === 'approve'
    );

    return {
      subscriptionId: subscription.id,
      approvalUrl: approvalLink?.href || '',
    };
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<PayPalSubscription> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(
      `${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get subscription: ${error}`);
    }

    return response.json();
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, reason: string): Promise<void> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(
      `${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}/cancel`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to cancel subscription: ${error}`);
    }
  }

  /**
   * Suspend subscription
   */
  async suspendSubscription(subscriptionId: string, reason: string): Promise<void> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(
      `${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}/suspend`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to suspend subscription: ${error}`);
    }
  }

  /**
   * Reactivate subscription
   */
  async reactivateSubscription(subscriptionId: string, reason: string): Promise<void> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(
      `${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}/activate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to reactivate subscription: ${error}`);
    }
  }

  /**
   * Verify webhook signature
   */
  async verifyWebhookSignature(
    webhookId: string,
    headers: Record<string, string>,
    body: string
  ): Promise<boolean> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(
      `${this.baseUrl}/v1/notifications/verify-webhook-signature`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth_algo: headers['paypal-auth-algo'],
          cert_url: headers['paypal-cert-url'],
          transmission_id: headers['paypal-transmission-id'],
          transmission_sig: headers['paypal-transmission-sig'],
          transmission_time: headers['paypal-transmission-time'],
          webhook_id: webhookId,
          webhook_event: JSON.parse(body),
        }),
      }
    );

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result.verification_status === 'SUCCESS';
  }
}

// Export singleton instance
export const paypalService = new PayPalService();
