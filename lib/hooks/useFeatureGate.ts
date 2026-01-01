// Feature Gate Hook
// Check if user can access specific features based on subscription

'use client';

import { useQuery } from '@tanstack/react-query';

interface FeatureGateResult {
  allowed: boolean;
  reason?: string;
  limit?: number;
  used?: number;
  upgradeUrl?: string;
}

interface SubscriptionData {
  subscription: {
    id: string;
    status: string;
    tier: {
      name: string;
      displayName: string;
      brandLimit: number;
      teamSeatLimit: number;
      competitorLimitPerBrand: number;
      customTopicsPerBrand: number;
      updateFrequency: string;
      features: Array<{ name: string; included: boolean; limit?: string }>;
    };
    trialDaysRemaining?: number;
  } | null;
  usage: {
    brands: { used: number; limit: number; percentage: number };
    teamSeats: { used: number; limit: number | 'Unlimited'; percentage: number };
    customTopicsPerBrand: number;
    competitorsPerBrand: number;
    updateFrequency: string;
  } | null;
}

export function useFeatureGate(featureName: string): FeatureGateResult & { isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['featureGate', featureName],
    queryFn: async () => {
      const response = await fetch(`/api/features/check?feature=${encodeURIComponent(featureName)}`);
      if (!response.ok) {
        throw new Error('Failed to check feature access');
      }
      return response.json();
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return { allowed: false, isLoading: true };
  }

  return {
    allowed: data?.data?.allowed ?? false,
    reason: data?.data?.reason,
    upgradeUrl: data?.data?.upgradeUrl || `/pricing?upgrade=true&feature=${encodeURIComponent(featureName)}`,
    isLoading: false,
  };
}

export function useSubscriptionLimits() {
  const { data, isLoading, error, refetch } = useQuery<{ success: boolean; data: SubscriptionData }>({
    queryKey: ['subscriptionLimits'],
    queryFn: async () => {
      const response = await fetch('/api/subscription');
      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }
      return response.json();
    },
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: true,
  });

  return {
    subscription: data?.data?.subscription ?? null,
    usage: data?.data?.usage ?? null,
    isLoading,
    error,
    refetch,
  };
}

export function useCanAddBrand() {
  const { subscription, usage, isLoading } = useSubscriptionLimits();

  if (isLoading || !subscription || !usage) {
    return { allowed: false, isLoading, reason: 'Loading...' };
  }

  const allowed = usage.brands.used < usage.brands.limit;
  const reason = allowed
    ? undefined
    : `Brand limit reached (${usage.brands.used}/${usage.brands.limit}). Upgrade to add more brands.`;

  return {
    allowed,
    isLoading: false,
    reason,
    used: usage.brands.used,
    limit: usage.brands.limit,
  };
}

export function useTrialStatus() {
  const { subscription, isLoading } = useSubscriptionLimits();

  if (isLoading || !subscription) {
    return { isTrialing: false, daysRemaining: 0, isLoading };
  }

  const isTrialing = subscription.status === 'trialing';
  const daysRemaining = subscription.trialDaysRemaining ?? 0;

  return {
    isTrialing,
    daysRemaining,
    isLoading: false,
    isExpiringSoon: isTrialing && daysRemaining <= 3,
  };
}
