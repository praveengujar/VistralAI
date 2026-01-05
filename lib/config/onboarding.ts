// VistralAI Onboarding Configuration
// Unified onboarding flow: Brand → Plan → Payment → Build Profile → First Scan → Complete

import { TRIAL_DAYS, PRICING_TIERS, type PricingTierConfig } from './pricing';

// ============================================
// Step Definitions
// ============================================

export interface OnboardingStepConfig {
  id: number;
  name: string;
  route: string;
  label: string;
  description: string;
  icon: string; // Lucide icon name
  optional: boolean;
  requiredFields?: string[];
}

export const ONBOARDING_STEPS: OnboardingStepConfig[] = [
  {
    id: 1,
    name: 'brand',
    route: '/onboarding/brand',
    label: 'Set Up Your Brand',
    description: 'Enter your website URL and brand name',
    icon: 'Globe',
    optional: false,
    requiredFields: ['websiteUrl', 'brandName'],
  },
  {
    id: 2,
    name: 'plan',
    route: '/onboarding/plan',
    label: 'Choose Plan',
    description: 'Select your subscription tier and billing cycle',
    icon: 'CreditCard',
    optional: false,
    requiredFields: ['selectedTierId', 'selectedBillingCycle'],
  },
  {
    id: 3,
    name: 'payment',
    route: '/onboarding/payment',
    label: 'Payment',
    description: 'Add your payment method to start your free trial',
    icon: 'Wallet',
    optional: false,
    requiredFields: ['paymentMethodId', 'subscriptionId'],
  },
  {
    id: 4,
    name: 'profile',
    route: '/onboarding/profile',
    label: 'Build Profile',
    description: 'We\'ll analyze your website to create your brand profile',
    icon: 'Sparkles',
    optional: false,
    requiredFields: ['brand360Id'],
  },
  {
    id: 5,
    name: 'scan',
    route: '/onboarding/scan',
    label: 'First Scan',
    description: 'Run your first AI perception scan',
    icon: 'Zap',
    optional: true, // Can be skipped
    requiredFields: [],
  },
  {
    id: 6,
    name: 'complete',
    route: '/onboarding/complete',
    label: 'Complete',
    description: 'You\'re all set! Welcome to VistralAI',
    icon: 'Rocket',
    optional: false,
    requiredFields: [],
  },
];

// ============================================
// Step Status & Navigation
// ============================================

export type OnboardingStatus = 'in_progress' | 'completed' | 'abandoned';

export type OnboardingEventType =
  | 'session_started'
  | 'step_started'
  | 'step_completed'
  | 'step_skipped'
  | 'error'
  | 'retry'
  | 'abandoned'
  | 'completed';

export interface OnboardingSessionData {
  currentStep: number;
  completedSteps: number[];
  status: OnboardingStatus;
  selectedTierId?: string;
  selectedBillingCycle?: 'monthly' | 'yearly';
  paymentMethodId?: string;
  stripeCustomerId?: string;
  subscriptionId?: string;
  brand360Id?: string;
  firstScanId?: string;
  firstScanType?: 'quick' | 'comprehensive' | 'skipped';
  websiteUrl?: string;
  brandName?: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// Validation & Navigation Helpers
// ============================================

export function getStepById(stepId: number): OnboardingStepConfig | undefined {
  return ONBOARDING_STEPS.find(s => s.id === stepId);
}

export function getStepByName(name: string): OnboardingStepConfig | undefined {
  return ONBOARDING_STEPS.find(s => s.name === name);
}

export function getStepByRoute(route: string): OnboardingStepConfig | undefined {
  return ONBOARDING_STEPS.find(s => s.route === route);
}

export function getStepRoute(stepId: number): string {
  const step = getStepById(stepId);
  return step?.route || '/onboarding/plan';
}

export function getNextStep(currentStep: number): OnboardingStepConfig | undefined {
  return ONBOARDING_STEPS.find(s => s.id === currentStep + 1);
}

export function getPreviousStep(currentStep: number): OnboardingStepConfig | undefined {
  return ONBOARDING_STEPS.find(s => s.id === currentStep - 1);
}

export function isStepComplete(
  session: OnboardingSessionData,
  stepId: number
): boolean {
  return session.completedSteps.includes(stepId);
}

export function canAccessStep(
  session: OnboardingSessionData,
  targetStep: number
): { allowed: boolean; reason?: string } {
  // Can always access completed steps
  if (session.completedSteps.includes(targetStep)) {
    return { allowed: true };
  }

  // Can access current step
  if (session.currentStep === targetStep) {
    return { allowed: true };
  }

  // Can't skip ahead (except for optional steps)
  if (targetStep > session.currentStep) {
    const stepsToComplete = ONBOARDING_STEPS.filter(
      s => s.id > session.currentStep && s.id < targetStep && !s.optional
    );

    if (stepsToComplete.length > 0) {
      return {
        allowed: false,
        reason: `Complete step "${stepsToComplete[0].label}" first`,
      };
    }
  }

  return { allowed: true };
}

export function getResumeStep(session: OnboardingSessionData): number {
  // Resume from last incomplete step
  const lastCompleted = Math.max(0, ...session.completedSteps);
  const nextStep = lastCompleted + 1;

  // Don't exceed total steps
  if (nextStep > ONBOARDING_STEPS.length) {
    return ONBOARDING_STEPS.length;
  }

  return nextStep;
}

export function getProgressPercentage(session: OnboardingSessionData): number {
  const totalRequired = ONBOARDING_STEPS.filter(s => !s.optional).length;
  const completedRequired = session.completedSteps.filter(stepId => {
    const step = getStepById(stepId);
    return step && !step.optional;
  }).length;

  return Math.round((completedRequired / totalRequired) * 100);
}

// ============================================
// Step Validation
// ============================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateStepData(
  stepId: number,
  data: Partial<OnboardingSessionData>
): ValidationResult {
  const step = getStepById(stepId);
  if (!step) {
    return { valid: false, errors: ['Invalid step'] };
  }

  const errors: string[] = [];

  switch (step.name) {
    case 'plan':
      if (!data.selectedTierId) {
        errors.push('Please select a plan');
      } else if (!PRICING_TIERS.find(t => t.id === data.selectedTierId)) {
        errors.push('Invalid plan selected');
      }
      if (!data.selectedBillingCycle) {
        errors.push('Please select a billing cycle');
      } else if (!['monthly', 'yearly'].includes(data.selectedBillingCycle)) {
        errors.push('Invalid billing cycle');
      }
      break;

    case 'payment':
      if (!data.paymentMethodId) {
        errors.push('Payment method is required');
      }
      break;

    case 'brand':
      if (!data.websiteUrl) {
        errors.push('Website URL is required');
      } else if (!isValidUrl(data.websiteUrl)) {
        errors.push('Please enter a valid URL');
      }
      if (!data.brandName) {
        errors.push('Brand name is required');
      } else if (data.brandName.length < 2) {
        errors.push('Brand name must be at least 2 characters');
      }
      break;

    case 'profile':
      // Brand profile must be created (Magic Import complete)
      if (!data.brand360Id) {
        errors.push('Brand profile creation is required');
      }
      break;

    case 'scan':
      // Scan step is optional, no validation required
      break;

    case 'complete':
      // Final step, check all required steps are complete (steps 1-4 are required, step 5 scan is optional)
      const requiredSteps = ONBOARDING_STEPS.filter(s => !s.optional && s.id < 6);
      const incompleteSteps = requiredSteps.filter(
        s => !data.completedSteps?.includes(s.id)
      );
      if (incompleteSteps.length > 0) {
        errors.push(`Please complete: ${incompleteSteps.map(s => s.label).join(', ')}`);
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function normalizeUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}

// ============================================
// Pricing Integration
// ============================================

export function getSelectedTierDetails(
  tierId: string,
  billingCycle: 'monthly' | 'yearly'
): {
  tier: PricingTierConfig;
  price: number;
  priceDisplay: string;
  billingPeriod: string;
  trialDays: number;
  trialEndDate: Date;
} | null {
  const tier = PRICING_TIERS.find(t => t.id === tierId);
  if (!tier) return null;

  const price = billingCycle === 'yearly' ? tier.priceYearly : tier.priceMonthly;
  const priceDisplay = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(price);

  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DAYS);

  return {
    tier,
    price,
    priceDisplay,
    billingPeriod: billingCycle === 'yearly' ? 'per year' : 'per month',
    trialDays: TRIAL_DAYS,
    trialEndDate,
  };
}

// ============================================
// Magic Import Progress Stages
// ============================================

export interface MagicImportStage {
  id: string;
  name: string;
  description: string;
  percentage: { start: number; end: number };
}

export const MAGIC_IMPORT_STAGES: MagicImportStage[] = [
  {
    id: 'crawler',
    name: 'Crawling Website',
    description: 'Extracting content and Schema.org data',
    percentage: { start: 0, end: 20 },
  },
  {
    id: 'vibecheck',
    name: 'Analyzing Identity',
    description: 'Understanding your brand personality',
    percentage: { start: 20, end: 40 },
  },
  {
    id: 'competitors',
    name: 'Discovering Competitors',
    description: 'Identifying your competitive landscape',
    percentage: { start: 40, end: 55 },
  },
  {
    id: 'products',
    name: 'Extracting Products',
    description: 'Cataloging your products and services',
    percentage: { start: 55, end: 70 },
  },
  {
    id: 'audience',
    name: 'Analyzing Audience',
    description: 'Building customer personas and positioning',
    percentage: { start: 70, end: 90 },
  },
  {
    id: 'scoring',
    name: 'Calculating Scores',
    description: 'Measuring profile completeness',
    percentage: { start: 90, end: 100 },
  },
];

export function getMagicImportStage(stageId: string): MagicImportStage | undefined {
  return MAGIC_IMPORT_STAGES.find(s => s.id === stageId);
}

export function calculateOverallProgress(
  currentStage: string,
  stageProgress: number
): number {
  const stage = getMagicImportStage(currentStage);
  if (!stage) {
    // For unknown stages (from sub-agents), return -1 to indicate "ignore this update"
    // Caller should check for -1 and skip the progress update
    return -1;
  }

  const stageRange = stage.percentage.end - stage.percentage.start;
  const progressWithinStage = (stageProgress / 100) * stageRange;

  return Math.round(stage.percentage.start + progressWithinStage);
}

// ============================================
// Constants
// ============================================

export const ONBOARDING_CONSTANTS = {
  TRIAL_DAYS,
  SESSION_TIMEOUT_HOURS: 24,
  MAX_BRAND_NAME_LENGTH: 100,
  MAX_URL_LENGTH: 500,
  DEFAULT_PLATFORM_FOR_FIRST_SCAN: 'chatgpt',
  FIRST_SCAN_PROMPT_COUNT: 10, // Quick scan with top 10 prompts
};

export { TRIAL_DAYS, PRICING_TIERS };
