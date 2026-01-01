// VistralAI Pricing Configuration
// Three-tier pricing: Monitor ($99), Growth ($299), Dominance ($999)

export interface PricingFeature {
  name: string;
  description: string;
  included: boolean;
  limit?: number | string;
  highlight?: boolean;
}

export interface PricingTierConfig {
  id: string;
  name: string;
  displayName: string;
  tagline: string;
  description: string;

  // Pricing
  priceMonthly: number; // in dollars
  priceYearly: number;  // in dollars (with discount)

  // Target audience
  targetAudience: string;

  // Limits
  brandLimit: number;
  teamSeatLimit: number; // -1 = unlimited
  competitorLimitPerBrand: number;
  customTopicsPerBrand: number;

  // Update frequency
  updateFrequency: 'weekly' | 'daily' | 'realtime';

  // Platforms
  platforms: string[];

  // Features
  features: PricingFeature[];

  // UI
  isPopular: boolean;
  ctaText: string;
  color: string;
}

export const PRICING_TIERS: PricingTierConfig[] = [
  {
    id: 'monitor',
    name: 'monitor',
    displayName: 'Monitor',
    tagline: 'Perfect for testing the waters',
    description: 'Essential visibility tracking for individuals and small brands',

    priceMonthly: 99,
    priceYearly: 990, // ~17% discount

    targetAudience: 'Freelancers, Solopreneurs, In-House Brand Managers',

    brandLimit: 1,
    teamSeatLimit: 1,
    competitorLimitPerBrand: 0,
    customTopicsPerBrand: 0,

    updateFrequency: 'weekly',

    platforms: ['chatgpt', 'perplexity', 'gemini'],

    features: [
      { name: 'Brand Monitoring', description: 'Track 1 brand across AI platforms', included: true, limit: '1 brand' },
      { name: 'Sentiment Analysis', description: 'Positive, Neutral, Negative tracking', included: true },
      { name: 'Visibility Score', description: 'Share of Voice metric', included: true },
      { name: 'Platform Coverage', description: 'ChatGPT, Perplexity, Gemini', included: true, limit: '3 platforms' },
      { name: 'Update Frequency', description: 'Weekly data refreshes', included: true, limit: 'Weekly' },
      { name: 'Basic Dashboard', description: 'Essential metrics view', included: true },
      { name: 'Email Alerts', description: 'Weekly summary emails', included: true },
      { name: 'Actionable Insights', description: 'AI-powered recommendations', included: false },
      { name: 'Competitor Benchmarking', description: 'Compare against competitors', included: false },
      { name: 'Custom Topics', description: 'Track specific products/topics', included: false },
      { name: 'API Access', description: 'Integrate with your tools', included: false },
      { name: 'White-Label Reports', description: 'Branded PDF exports', included: false },
    ],

    isPopular: false,
    ctaText: 'Start Free Trial',
    color: 'slate',
  },
  {
    id: 'growth',
    name: 'growth',
    displayName: 'Growth',
    tagline: 'Most popular for serious brands',
    description: 'Full-featured monitoring with actionable insights for growing teams',

    priceMonthly: 299,
    priceYearly: 2990, // ~17% discount

    targetAudience: 'SMB Agencies, Growth Marketers, Mid-Market Brands',

    brandLimit: 10,
    teamSeatLimit: 2,
    competitorLimitPerBrand: 3,
    customTopicsPerBrand: 20,

    updateFrequency: 'daily',

    platforms: ['all'],

    features: [
      { name: 'Brand Monitoring', description: 'Track multiple brands', included: true, limit: '10 brands', highlight: true },
      { name: 'Sentiment Analysis', description: 'Positive, Neutral, Negative tracking', included: true },
      { name: 'Visibility Score', description: 'Share of Voice metric', included: true },
      { name: 'Platform Coverage', description: 'All AI platforms', included: true, limit: 'All platforms', highlight: true },
      { name: 'Update Frequency', description: 'Daily data refreshes', included: true, limit: 'Daily', highlight: true },
      { name: 'Advanced Dashboard', description: 'Full analytics suite', included: true },
      { name: 'Real-Time Alerts', description: 'Instant notifications', included: true, highlight: true },
      { name: 'Actionable Insights', description: 'AI-powered recommendations', included: true, highlight: true },
      { name: 'Competitor Benchmarking', description: 'Compare against 3 competitors', included: true, limit: '3 per brand' },
      { name: 'Custom Topics', description: 'Track specific products/topics', included: true, limit: '20 per brand' },
      { name: 'Team Seats', description: 'Collaborate with your team', included: true, limit: '2 seats' },
      { name: 'API Access', description: 'Integrate with your tools', included: false },
      { name: 'White-Label Reports', description: 'Branded PDF exports', included: false },
    ],

    isPopular: true,
    ctaText: 'Start Free Trial',
    color: 'primary',
  },
  {
    id: 'dominance',
    name: 'dominance',
    displayName: 'Dominance',
    tagline: 'For agencies & enterprise',
    description: 'Enterprise-grade solution with API access and white-label capabilities',

    priceMonthly: 999,
    priceYearly: 9990, // ~17% discount

    targetAudience: 'Large Agencies, Enterprise Aggregators, Multi-Brand Conglomerates',

    brandLimit: 50,
    teamSeatLimit: -1, // Unlimited
    competitorLimitPerBrand: 10,
    customTopicsPerBrand: 50,

    updateFrequency: 'realtime',

    platforms: ['all'],

    features: [
      { name: 'Brand Monitoring', description: 'Track unlimited brands', included: true, limit: '50 brands', highlight: true },
      { name: 'Sentiment Analysis', description: 'Positive, Neutral, Negative tracking', included: true },
      { name: 'Visibility Score', description: 'Share of Voice metric', included: true },
      { name: 'Platform Coverage', description: 'All AI platforms + early access', included: true, limit: 'All + Beta' },
      { name: 'Update Frequency', description: 'Real-time on demand', included: true, limit: 'Real-time', highlight: true },
      { name: 'Enterprise Dashboard', description: 'Multi-brand analytics', included: true },
      { name: 'Real-Time Alerts', description: 'Instant notifications', included: true },
      { name: 'Actionable Insights', description: 'AI-powered recommendations', included: true },
      { name: 'Competitor Benchmarking', description: 'Compare against 10 competitors', included: true, limit: '10 per brand' },
      { name: 'Custom Topics', description: 'Track specific products/topics', included: true, limit: '50 per brand' },
      { name: 'Team Seats', description: 'Unlimited team members', included: true, limit: 'Unlimited', highlight: true },
      { name: 'API Access', description: 'Full API integration', included: true, highlight: true },
      { name: 'White-Label Reports', description: 'Branded PDF/CSV exports', included: true, highlight: true },
      { name: 'Dedicated Support', description: 'Priority email & Slack', included: true, highlight: true },
      { name: 'Custom Integrations', description: 'Tailored solutions', included: true },
    ],

    isPopular: false,
    ctaText: 'Start Free Trial',
    color: 'violet',
  },
];

export const TRIAL_DAYS = 15;

export const FAIR_USE_POLICY = {
  description: 'Unlimited prompts refers to the automated monitoring of our standard "Brand Health" topic set.',
  customTopicsCap: {
    monitor: 0,
    growth: 20,
    dominance: 50,
  },
  standardTopicsPerBrand: 50, // Internal: standard topics we run per brand
};

export function getTierById(tierId: string): PricingTierConfig | undefined {
  return PRICING_TIERS.find(t => t.id === tierId);
}

export function getTierByName(name: string): PricingTierConfig | undefined {
  return PRICING_TIERS.find(t => t.name === name);
}

export function formatPrice(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatPriceDollars(dollars: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(dollars);
}

export function calculateYearlySavings(tier: PricingTierConfig): { saved: number; percentage: number } {
  const yearlyFromMonthly = tier.priceMonthly * 12;
  const saved = yearlyFromMonthly - tier.priceYearly;
  const percentage = Math.round((saved / yearlyFromMonthly) * 100);
  return { saved, percentage };
}

export function getFeatureByName(tier: PricingTierConfig, featureName: string): PricingFeature | undefined {
  return tier.features.find(f => f.name === featureName);
}

export function isFeatureIncluded(tier: PricingTierConfig, featureName: string): boolean {
  const feature = getFeatureByName(tier, featureName);
  return feature?.included ?? false;
}
