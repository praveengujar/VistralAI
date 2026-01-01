// PayPal Configuration
// Server-side PayPal client

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  mode: 'sandbox' | 'live';
}

function getConfig(): PayPalConfig | null {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn('PayPal credentials not configured - PayPal payments will not work');
    return null;
  }

  return {
    clientId,
    clientSecret,
    mode: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
  };
}

export const paypalConfig = getConfig();

export function getPayPalBaseUrl(): string {
  const mode = paypalConfig?.mode ?? 'sandbox';
  return mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}
