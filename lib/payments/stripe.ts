// Stripe Configuration
// Server-side Stripe client

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY is not set - Stripe payments will not work');
}

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      // Use the latest API version supported by the SDK
      typescript: true,
    })
  : null;

// Client-side Stripe loader
export const getStripePromise = async () => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
  }
  const { loadStripe } = await import('@stripe/stripe-js');
  return loadStripe(key);
};
