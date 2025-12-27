// App-wide constants

export const APP_NAME = 'VistralAI';
export const APP_DESCRIPTION = 'AI Exposure Optimization Platform';

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  ONBOARDING: '/onboarding',
  DASHBOARD: '/dashboard',
  BRAND_PROFILE: '/dashboard/brand-profile',
  BRAND_PROFILE_REVIEW: '/dashboard/brand-profile/review',
  INSIGHTS: '/dashboard/insights',
  ANALYTICS: '/dashboard/analytics',
  ALERTS: '/dashboard/alerts',
  REPORT: '/dashboard/report',
  PROFILE: '/dashboard/profile',
  SETTINGS: '/dashboard/settings',
  AGENCY: '/agency',
  // AEO Routes
  AEO: '/dashboard/aeo',
  AEO_INSIGHTS: '/dashboard/aeo/insights',
  AEO_CORRECTIONS: '/dashboard/aeo/corrections',
  AEO_SCAN: '/dashboard/aeo/scan',
} as const;

// Onboarding Steps (Old Flow - Legacy)
export const ONBOARDING_STEPS = [
  { id: 1, title: 'Brand Information', description: 'Tell us about your brand' },
  { id: 2, title: 'Domain & Category', description: 'Add your website details' },
  { id: 3, title: 'Product Catalog', description: 'Upload or connect your catalog' },
  { id: 4, title: 'Competitors', description: 'Add competitor brands' },
  { id: 5, title: 'Integrations', description: 'Connect your tools (optional)' },
] as const;

// New Onboarding Steps (AI-Powered Flow)
export const NEW_ONBOARDING_STEPS = [
  { id: 1, title: 'Analyze Website', description: 'Enter your website URL for AI analysis' },
  { id: 2, title: 'Add Products', description: 'Import your product catalog' },
  { id: 3, title: 'Review Profile', description: 'Review and edit AI-generated data' },
  { id: 4, title: 'Confirm Setup', description: 'Complete your brand profile' },
] as const;

// Categories
export const BRAND_CATEGORIES = [
  'Technology & Software',
  'SaaS & Cloud Services',
  'E-commerce & Retail',
  'Financial Services',
  'Healthcare & Life Sciences',
  'Education & EdTech',
  'Media & Entertainment',
  'Food & Beverage',
  'Travel & Hospitality',
  'Fashion & Beauty',
  'Real Estate & Property',
  'Automotive & Transportation',
  'Professional Services',
  'Manufacturing & Industrial',
  'Other',
] as const;

// Alert Types
export const ALERT_TYPES = {
  competitor_spike: {
    label: 'Competitor Visibility Spike',
    description: 'A competitor has gained significant visibility',
  },
  hallucination_detected: {
    label: 'Hallucination Detected',
    description: 'AI model generated incorrect information about your brand',
  },
  visibility_drop: {
    label: 'Visibility Drop',
    description: 'Your brand visibility has decreased significantly',
  },
  high_crawler_activity: {
    label: 'High Crawler Activity',
    description: 'Unusual AI crawler activity detected on your site',
  },
} as const;

// Chart Colors
export const CHART_COLORS = {
  primary: '#0ea5e9',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  neutral: '#6b7280',
  purple: '#8b5cf6',
  pink: '#ec4899',
} as const;

// AEO Chart Colors
export const AEO_CHART_COLORS = {
  // Quadrant colors
  dominant: '#10b981',    // Green - success
  vulnerable: '#f59e0b',  // Amber - warning
  niche: '#0ea5e9',       // Blue - primary
  invisible: '#ef4444',   // Red - danger
  // Platform colors
  chatgpt: '#10a37f',     // OpenAI green
  claude: '#d97706',      // Anthropic amber
  gemini: '#4285f4',      // Google blue
  perplexity: '#6366f1',  // Indigo
  // Metric colors
  faithfulness: '#10b981',
  shareOfVoice: '#0ea5e9',
  sentiment: '#8b5cf6',
  voiceAlignment: '#f59e0b',
  hallucinationRisk: '#ef4444',
} as const;
