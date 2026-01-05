// React Query hooks for onboarding flow

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { OnboardingSession } from '@prisma/client';
import type { OnboardingStepConfig } from '@/lib/config/onboarding';
import type { PricingTierConfig } from '@/lib/config/pricing';

// ============================================
// Types
// ============================================

interface OnboardingSessionResponse {
  success: boolean;
  data?: {
    session: OnboardingSession;
    currentStepConfig?: OnboardingStepConfig;
    progressPercentage: number;
  };
  error?: string;
}

interface PlanSelectionResponse {
  success: boolean;
  data?: {
    session: OnboardingSession;
    nextStep: number | null;
    tierDetails: {
      tier: PricingTierConfig;
      price: number;
      priceDisplay: string;
      billingPeriod: string;
      trialDays: number;
      trialEndDate: string;
    };
  };
  error?: string;
}

interface PaymentResponse {
  success: boolean;
  data?: {
    clientSecret?: string;
    customerId?: string;
    session?: OnboardingSession;
    nextStep?: number | null;
    subscription?: {
      id: string;
      status: string;
      trialDays: number;
      trialEndsAt: string;
    };
  };
  error?: string;
}

interface BrandSetupResponse {
  success: boolean;
  data?: {
    status: 'idle' | 'running' | 'complete' | 'failed';
    message?: string;
    websiteUrl?: string;
    brandName?: string;
    brand360Id?: string;
    error?: string;
  };
  error?: string;
}

interface ScanResponse {
  success: boolean;
  data?: {
    session?: OnboardingSession;
    nextStep?: number;
    skipped?: boolean;
    scan?: {
      platform: string;
      status: string;
      message: string;
    };
  };
  error?: string;
}

interface ProfileBuildResponse {
  success: boolean;
  data?: {
    status: 'pending' | 'running' | 'completed' | 'already_completed' | 'failed';
    brand360Id?: string;
    completionScore?: number;
    entityHealthScore?: number;
    discoveries?: {
      entityHome: boolean;
      organizationSchema: boolean;
      brandIdentity: boolean;
      competitors: number;
      products: number;
      personas: number;
      positioning: boolean;
    };
    stages?: Array<{ name: string; status: string; confidence?: number }>;
    totalDuration?: number;
    nextStep?: number;
    message?: string;
    profile?: {
      id: string;
      completionScore: number;
      entityHealthScore: number;
    };
  };
  error?: string;
}

interface CompleteResponse {
  success: boolean;
  data?: {
    completed: boolean;
    progressPercentage: number;
    redirectUrl: string;
    session: OnboardingSession;
    summary: {
      tierId: string;
      billingCycle: string;
      brand360Id: string;
      brandName: string;
      websiteUrl: string;
      hasFirstScan: boolean;
    };
  };
  error?: string;
}

// ============================================
// Query Keys
// ============================================

export const onboardingQueryKeys = {
  session: () => ['onboarding', 'session'] as const,
  brandStatus: () => ['onboarding', 'brand', 'status'] as const,
  profileStatus: () => ['onboarding', 'profile', 'status'] as const,
  completionStatus: () => ['onboarding', 'completion', 'status'] as const,
};

// ============================================
// API Functions
// ============================================

async function fetchJson<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// ============================================
// Query Hooks
// ============================================

/**
 * Fetch current onboarding session
 */
export function useOnboardingSession() {
  return useQuery({
    queryKey: onboardingQueryKeys.session(),
    queryFn: () => fetchJson<OnboardingSessionResponse>('/api/onboarding/session'),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Check brand setup status (polling during import)
 */
export function useBrandStatus(enabled: boolean = true) {
  return useQuery({
    queryKey: onboardingQueryKeys.brandStatus(),
    queryFn: () => fetchJson<BrandSetupResponse>('/api/onboarding/brand'),
    enabled,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Poll every 2 seconds while running
      if (data?.data?.status === 'running') {
        return 2000;
      }
      return false;
    },
  });
}

/**
 * Check completion status
 */
export function useCompletionStatus() {
  return useQuery({
    queryKey: onboardingQueryKeys.completionStatus(),
    queryFn: () => fetchJson<CompleteResponse>('/api/onboarding/complete'),
  });
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Save plan selection
 */
export function useSavePlanSelection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { tierId: string; billingCycle: 'monthly' | 'yearly' }) =>
      fetchJson<PlanSelectionResponse>('/api/onboarding/plan', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

/**
 * Create Stripe SetupIntent
 */
export function useCreateSetupIntent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetchJson<PaymentResponse>('/api/onboarding/payment', {
        method: 'POST',
        body: JSON.stringify({ action: 'create_setup_intent' }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

/**
 * Confirm payment and create subscription
 */
export function useConfirmPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { paymentMethodId: string }) =>
      fetchJson<PaymentResponse>('/api/onboarding/payment', {
        method: 'POST',
        body: JSON.stringify({ action: 'confirm_payment', ...data }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

/**
 * Save brand info only (Step 1 - no Magic Import)
 */
export function useSaveBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { websiteUrl: string; brandName: string }) =>
      fetchJson<BrandSetupResponse>('/api/onboarding/brand', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

/**
 * Start MagicImport for brand setup (legacy - kept for compatibility)
 */
export function useStartMagicImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { websiteUrl: string; brandName: string }) =>
      fetchJson<BrandSetupResponse>('/api/onboarding/brand', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

/**
 * Retry failed MagicImport (legacy - kept for compatibility)
 */
export function useRetryMagicImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetchJson<BrandSetupResponse>('/api/onboarding/brand', {
        method: 'POST',
        body: JSON.stringify({ action: 'retry' }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

// ============================================
// Profile Build Hooks (Step 4)
// ============================================

/**
 * Check profile build status
 */
export function useProfileStatus(enabled: boolean = true) {
  return useQuery({
    queryKey: onboardingQueryKeys.profileStatus(),
    queryFn: () => fetchJson<ProfileBuildResponse>('/api/onboarding/profile'),
    enabled,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Poll every 3 seconds while running
      if (data?.data?.status === 'running') {
        return 3000;
      }
      return false;
    },
  });
}

/**
 * Start profile build (Magic Import on Step 4)
 */
export function useStartBuildProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetchJson<ProfileBuildResponse>('/api/onboarding/profile', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

/**
 * Retry failed profile build
 */
export function useRetryBuildProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetchJson<ProfileBuildResponse>('/api/onboarding/profile', {
        method: 'POST',
        body: JSON.stringify({ action: 'retry' }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

/**
 * Run first perception scan (legacy)
 */
export function useRunFirstScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data?: { platform?: string }) =>
      fetchJson<ScanResponse>('/api/onboarding/scan', {
        method: 'POST',
        body: JSON.stringify(data || {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

/**
 * Skip first scan step (legacy)
 */
export function useSkipFirstScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetchJson<ScanResponse>('/api/onboarding/scan', {
        method: 'POST',
        body: JSON.stringify({ action: 'skip' }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

// ============================================
// Step 5: AI Perception Scan Hooks
// ============================================

interface OnboardingScanResponse {
  success: boolean;
  data?: {
    status: string;
    scanId?: string;
    promptCount?: number;
    platforms?: string[];
    message?: string;
  };
  error?: string;
}

/**
 * Start onboarding perception scan (Step 5)
 */
export function useStartOnboardingScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { scanType: 'quick' | 'comprehensive'; brand360Id: string }) =>
      fetchJson<OnboardingScanResponse>('/api/onboarding/scan', {
        method: 'POST',
        body: JSON.stringify({ action: 'start', ...data }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

/**
 * Skip onboarding scan step (Step 5)
 */
export function useSkipOnboardingScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetchJson<OnboardingScanResponse>('/api/onboarding/scan', {
        method: 'POST',
        body: JSON.stringify({ action: 'skip' }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

/**
 * Complete onboarding
 */
export function useCompleteOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetchJson<CompleteResponse>('/api/onboarding/complete', {
        method: 'POST',
      }),
    onSuccess: () => {
      // Invalidate all onboarding queries
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      // Also invalidate session to refresh auth state
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
  });
}

/**
 * Update session data
 */
export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { action: string; step?: number; stepData?: Record<string, unknown> }) =>
      fetchJson<OnboardingSessionResponse>('/api/onboarding/session', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}
