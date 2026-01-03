// Subscription Management Hooks
// React Query hooks for subscription management

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Types
interface ProrationPreview {
  currentPlan: { name: string; price: number; billingCycle: string };
  newPlan: { name: string; price: number; billingCycle: string };
  proration: {
    credit: number;
    charge: number;
    netAmount: number;
    immediateCharge: number;
  };
  isUpgrade: boolean;
  changeType: 'upgrade' | 'downgrade';
  effectiveDate: string;
  effectiveDescription: string;
  nextBillingDate: string;
  nextBillingAmount: number;
}

interface SubscriptionData {
  subscription: {
    id: string;
    status: string;
    billingCycle: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    trialDaysRemaining?: number;
    tier: {
      id: string;
      name: string;
      displayName: string;
      description: string;
      priceMonthly: number;
      priceYearly: number | null;
      brandLimit: number;
      teamSeatLimit: number;
      updateFrequency: string;
      features: Array<{ name: string; included: boolean; highlight?: boolean; limit?: string }>;
    };
    scheduledTier?: {
      id: string;
      name: string;
      displayName: string;
    } | null;
    scheduledBillingCycle?: string | null;
    scheduledChange?: {
      scheduledFor: string;
    } | null;
  } | null;
  usage: {
    brands: { used: number; limit: number; percentage: number };
    teamSeats: { used: number; limit: number | 'Unlimited'; percentage: number };
    customTopicsPerBrand: number;
    competitorsPerBrand: number;
    updateFrequency: string;
  } | null;
}

interface StripeInvoice {
  id: string;
  number: string;
  status: string;
  total: number;
  currency: string;
  date: string;
  pdfUrl: string | null;
  hostedUrl: string | null;
}

// Get current subscription
export function useCurrentSubscription() {
  return useQuery<SubscriptionData>({
    queryKey: ['currentSubscription'],
    queryFn: async () => {
      const response = await fetch('/api/settings/subscription');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch subscription');
      }
      const data = await response.json();
      return data.data;
    },
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: true,
  });
}

// Get proration preview
export function useProrationPreview(
  newTierId: string | null,
  newBillingCycle: 'monthly' | 'yearly' | null
) {
  return useQuery<ProrationPreview>({
    queryKey: ['prorationPreview', newTierId, newBillingCycle],
    queryFn: async () => {
      const response = await fetch('/api/settings/subscription/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newTierId, newBillingCycle }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get preview');
      }
      const data = await response.json();
      return data.data;
    },
    enabled: !!newTierId && !!newBillingCycle,
    staleTime: 30000, // 30 seconds
  });
}

// Change subscription (upgrade/downgrade)
export function useChangeSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      newTierId,
      newBillingCycle,
    }: {
      newTierId: string;
      newBillingCycle: 'monthly' | 'yearly';
    }) => {
      const response = await fetch('/api/settings/subscription/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newTierId, newBillingCycle }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to change subscription');
      }
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['currentSubscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptionLimits'] });
      toast.success(data.message);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Cancel scheduled change
export function useCancelScheduledChange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/settings/subscription/cancel-change', {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel change');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentSubscription'] });
      toast.success('Scheduled change canceled');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Cancel subscription
export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reason,
      feedback,
    }: {
      reason?: string;
      feedback?: string;
    }) => {
      const response = await fetch('/api/settings/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, feedback }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['currentSubscription'] });
      toast.success(data.message);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Reactivate subscription
export function useReactivateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/settings/subscription/reactivate', {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reactivate');
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['currentSubscription'] });
      toast.success(data.message);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Get invoices
export function useInvoices() {
  return useQuery<{ invoices: any[]; stripeInvoices: StripeInvoice[] }>({
    queryKey: ['invoices'],
    queryFn: async () => {
      const response = await fetch('/api/settings/invoices');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch invoices');
      }
      const data = await response.json();
      return data.data;
    },
    staleTime: 300000, // 5 minutes
  });
}
