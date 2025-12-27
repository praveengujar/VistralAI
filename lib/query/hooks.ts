// React Query Hooks
// Custom hooks for data fetching with automatic caching and deduplication

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';

// ============================================
// Query Keys Factory
// Centralized query key management for cache invalidation
// ============================================

export const queryKeys = {
  // Brand 360 data
  brand360: {
    all: ['brand360'] as const,
    profile: (organizationId: string) => ['brand360', 'profile', organizationId] as const,
    data: (brandId: string) => ['brand360', 'data', brandId] as const,
  },

  // AEO data
  aeo: {
    all: ['aeo'] as const,
    prompts: (brand360Id: string) => ['aeo', 'prompts', brand360Id] as const,
    promptsByCategory: (brand360Id: string, category: string) =>
      ['aeo', 'prompts', brand360Id, category] as const,
    scans: (brand360Id: string) => ['aeo', 'scans', brand360Id] as const,
    scan: (scanId: string) => ['aeo', 'scan', scanId] as const,
    insights: (brand360Id: string) => ['aeo', 'insights', brand360Id] as const,
    corrections: (brand360Id: string) => ['aeo', 'corrections', brand360Id] as const,
    reports: (brand360Id: string) => ['aeo', 'reports', brand360Id] as const,
    metrics: (brand360Id: string) => ['aeo', 'metrics', brand360Id] as const,
  },

  // User data
  user: {
    all: ['user'] as const,
    profile: () => ['user', 'profile'] as const,
    sessions: () => ['user', 'sessions'] as const,
    settings: () => ['user', 'settings'] as const,
  },

  // Competitors
  competitors: {
    all: ['competitors'] as const,
    byBrand: (brandId: string) => ['competitors', brandId] as const,
  },

  // Products
  products: {
    all: ['products'] as const,
    byBrand: (brandId: string) => ['products', brandId] as const,
  },

  // Onboarding
  onboarding: {
    status: (jobId?: string) => ['onboarding', 'status', jobId] as const,
  },
};

// ============================================
// API Fetch Utility
// ============================================

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

async function apiFetch<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Build URL with query params
  const urlWithParams = new URL(url, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        urlWithParams.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(urlWithParams.toString(), {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============================================
// Brand 360 Hooks
// ============================================

export function useBrand360Profile(organizationId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.brand360.profile(organizationId || ''),
    queryFn: () => apiFetch<any>(`/api/aeo/brand360?organizationId=${organizationId}`),
    enabled: !!organizationId,
  });
}

export function useBrand360Data(brandId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.brand360.data(brandId || ''),
    queryFn: () => apiFetch<any>(`/api/brand-360?brandId=${brandId}`),
    enabled: !!brandId,
  });
}

// ============================================
// AEO Hooks
// ============================================

export function useAEOPrompts(brand360Id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.aeo.prompts(brand360Id || ''),
    queryFn: () => apiFetch<any>(`/api/aeo/prompts?brand360Id=${brand360Id}`),
    enabled: !!brand360Id,
  });
}

export function useAEOPromptsByCategory(brand360Id: string | undefined, category: string) {
  return useQuery({
    queryKey: queryKeys.aeo.promptsByCategory(brand360Id || '', category),
    queryFn: () => apiFetch<any>(`/api/aeo/prompts?brand360Id=${brand360Id}&category=${category}`),
    enabled: !!brand360Id && !!category,
  });
}

export function useAEOScans(brand360Id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.aeo.scans(brand360Id || ''),
    queryFn: () => apiFetch<any>(`/api/aeo/perception-scan?brand360Id=${brand360Id}`),
    enabled: !!brand360Id,
  });
}

export function useAEOScan(scanId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.aeo.scan(scanId || ''),
    queryFn: () => apiFetch<any>(`/api/aeo/perception-scan/${scanId}`),
    enabled: !!scanId,
    // Poll while scan is in progress
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.scan?.status === 'running' || data?.scan?.status === 'pending') {
        return 5000; // Poll every 5 seconds
      }
      return false; // Stop polling
    },
  });
}

export function useAEOInsights(brand360Id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.aeo.insights(brand360Id || ''),
    queryFn: () => apiFetch<any>(`/api/aeo/insights?brand360Id=${brand360Id}`),
    enabled: !!brand360Id,
  });
}

export function useAEOCorrections(brand360Id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.aeo.corrections(brand360Id || ''),
    queryFn: () => apiFetch<any>(`/api/aeo/corrections?brand360Id=${brand360Id}`),
    enabled: !!brand360Id,
  });
}

export function useAEOMetrics(brand360Id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.aeo.metrics(brand360Id || ''),
    queryFn: () => apiFetch<any>(`/api/aeo/reports/summary?brand360Id=${brand360Id}`),
    enabled: !!brand360Id,
  });
}

// ============================================
// User Hooks
// ============================================

export function useUserProfile() {
  return useQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: () => apiFetch<any>('/api/user/profile'),
  });
}

export function useUserSessions() {
  return useQuery({
    queryKey: queryKeys.user.sessions(),
    queryFn: () => apiFetch<any>('/api/user/sessions'),
  });
}

// ============================================
// Onboarding Hooks
// ============================================

export function useOnboardingStatus(jobId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.onboarding.status(jobId),
    queryFn: () => apiFetch<any>(`/api/onboarding/status?jobId=${jobId}`),
    enabled: !!jobId,
    // Poll while job is running
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === 'running' || data?.status === 'pending') {
        return 3000; // Poll every 3 seconds
      }
      return false;
    },
  });
}

// ============================================
// Mutation Hooks
// ============================================

export function useStartPerceptionScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { brand360Id: string; scanType?: string }) =>
      apiFetch<any>('/api/aeo/perception-scan', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      // Invalidate scans list to trigger refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.aeo.scans(variables.brand360Id) });
    },
  });
}

export function useGeneratePrompts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { brand360Id: string; category?: string }) =>
      apiFetch<any>('/api/aeo/prompts/generate', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aeo.prompts(variables.brand360Id) });
    },
  });
}

export function useApproveCorrection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { workflowId: string; brand360Id: string }) =>
      apiFetch<any>(`/api/aeo/corrections/${data.workflowId}/approve`, {
        method: 'POST',
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aeo.corrections(variables.brand360Id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.aeo.insights(variables.brand360Id) });
    },
  });
}

export function useDismissInsight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { insightId: string; brand360Id: string }) =>
      apiFetch<any>(`/api/aeo/insights/${data.insightId}/dismiss`, {
        method: 'POST',
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aeo.insights(variables.brand360Id) });
    },
  });
}

// ============================================
// Cache Invalidation Utilities
// ============================================

export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries(),
    invalidateBrand360: (brandId: string) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.brand360.data(brandId) }),
    invalidateAEO: (brand360Id: string) =>
      queryClient.invalidateQueries({ queryKey: ['aeo'] }),
    invalidateUser: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.user.all }),
  };
}
