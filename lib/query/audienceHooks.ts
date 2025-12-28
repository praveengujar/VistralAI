// React Query Hooks for Audience & Positioning
// Custom hooks for target audience, personas, and market positioning data

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ============================================
// Query Keys Factory
// ============================================

export const audienceQueryKeys = {
  // Target Audience
  audience: {
    all: ['audience'] as const,
    byBrand: (brand360Id: string) => ['audience', brand360Id] as const,
  },

  // Personas
  personas: {
    all: ['personas'] as const,
    byBrand: (brand360Id: string) => ['personas', brand360Id] as const,
    single: (personaId: string) => ['persona', personaId] as const,
  },

  // Market Positioning
  positioning: {
    all: ['positioning'] as const,
    byBrand: (brand360Id: string) => ['positioning', brand360Id] as const,
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
// Types
// ============================================

export interface TargetAudience {
  id: string;
  brand360Id: string;
  primaryMarket?: string;
  geographicFocus?: string;
  targetIndustries: string[];
  targetCompanySize: string[];
  targetJobTitles: string[];
  targetDepartments: string[];
  ageRangeMin?: number;
  ageRangeMax?: number;
  incomeLevel?: string;
}

export interface PainPoint {
  id: string;
  personaId: string;
  title: string;
  description?: string;
  category?: string;
  severity: string;
  frequency?: string;
  businessImpact?: string;
  emotionalImpact?: string;
  currentWorkaround?: string;
  addressedByProduct?: boolean;
  solutionDescription?: string;
}

export interface CustomerPersona {
  id: string;
  brand360Id: string;
  name: string;
  title?: string;
  archetype?: string;
  avatarUrl?: string;
  type: string;
  ageRange?: string;
  gender?: string;
  location?: string;
  companySize?: string;
  industry?: string;
  seniorityLevel?: string;
  personality?: string;
  values: string[];
  motivations: string[];
  frustrations: string[];
  aspirations: string[];
  primaryGoals: string[];
  secondaryGoals: string[];
  kpis: string[];
  buyingRole?: string;
  buyingCriteria: string[];
  purchaseTimeline?: string;
  budgetRange?: string;
  informationSources: string[];
  socialPlatforms: string[];
  communities: string[];
  currentSolution?: string;
  satisfactionLevel?: number;
  switchingBarriers: string[];
  commonObjections: string[];
  purchaseBarriers: string[];
  keyMessages: string[];
  toneThatResonates?: string;
  triggerWords: string[];
  avoidWords: string[];
  priority: number;
  revenueImpact?: number;
  strategicFit?: number;
  needsReview: boolean;
  painPoints: PainPoint[];
}

export interface ValueProposition {
  id: string;
  positioningId: string;
  headline: string;
  subheadline?: string;
  description?: string;
  type: string;
  functionalValue?: string;
  emotionalValue?: string;
  socialValue?: string;
  economicValue?: string;
  supportingProof: string[];
  customerQuote?: string;
  metricValue?: string;
}

export interface ProofPoint {
  id: string;
  positioningId: string;
  type: string;
  title: string;
  description?: string;
  metricValue?: string;
  source?: string;
  sourceUrl?: string;
  isVerified: boolean;
  primaryClaimSupported?: string;
}

export interface PositioningAxis {
  id: string;
  positioningId: string;
  name: string;
  lowEndLabel?: string;
  highEndLabel?: string;
  brandPosition: number;
  competitorPositions?: Record<string, number>;
  importance?: number;
  isDefining: boolean;
}

export interface MarketPositioning {
  id: string;
  brand360Id: string;
  positioningStatement?: string;
  targetAudienceSummary?: string;
  categoryDefinition?: string;
  primaryBenefit?: string;
  competitiveAlternative?: string;
  reasonToBelieve?: string;
  categoryType?: string;
  categoryPosition?: string;
  competitiveStance?: string;
  primaryDifferentiator?: string;
  secondaryDifferentiators: string[];
  beforeState?: string;
  afterState?: string;
  transformationStory?: string;
  elevatorPitch?: string;
  boilerplate?: string;
  headlines: string[];
  pricingPosition?: string;
  pricingRationale?: string;
  valuePropositions: ValueProposition[];
  proofPoints: ProofPoint[];
  positioningAxes: PositioningAxis[];
}

// ============================================
// Target Audience Hooks
// ============================================

export function useTargetAudience(brand360Id: string | undefined) {
  return useQuery({
    queryKey: audienceQueryKeys.audience.byBrand(brand360Id || ''),
    queryFn: () => apiFetch<{ success: boolean; data: { audience: TargetAudience | null; personas: CustomerPersona[] } }>(
      `/api/brand-360/audience?brand360Id=${brand360Id}`
    ),
    enabled: !!brand360Id,
  });
}

export function useUpdateTargetAudience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<TargetAudience> & { brand360Id: string }) =>
      apiFetch<{ success: boolean; data: TargetAudience }>('/api/brand-360/audience', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: audienceQueryKeys.audience.byBrand(variables.brand360Id) });
    },
  });
}

// ============================================
// Persona Hooks
// ============================================

export function usePersonas(brand360Id: string | undefined) {
  return useQuery({
    queryKey: audienceQueryKeys.personas.byBrand(brand360Id || ''),
    queryFn: () => apiFetch<{ success: boolean; data: CustomerPersona[] }>(
      `/api/brand-360/personas?brand360Id=${brand360Id}`
    ),
    enabled: !!brand360Id,
  });
}

export function usePersona(personaId: string | undefined) {
  return useQuery({
    queryKey: audienceQueryKeys.personas.single(personaId || ''),
    queryFn: () => apiFetch<{ success: boolean; data: CustomerPersona }>(
      `/api/brand-360/personas/${personaId}`
    ),
    enabled: !!personaId,
  });
}

export function useCreatePersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<CustomerPersona> & { brand360Id: string; painPoints?: Partial<PainPoint>[] }) =>
      apiFetch<{ success: boolean; data: CustomerPersona }>('/api/brand-360/personas', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: audienceQueryKeys.personas.byBrand(variables.brand360Id) });
      queryClient.invalidateQueries({ queryKey: audienceQueryKeys.audience.byBrand(variables.brand360Id) });
    },
  });
}

export function useUpdatePersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; brand360Id: string; painPoints?: Partial<PainPoint>[] } & Partial<CustomerPersona>) =>
      apiFetch<{ success: boolean; data: CustomerPersona }>(`/api/brand-360/personas/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: audienceQueryKeys.personas.single(variables.id) });
      queryClient.invalidateQueries({ queryKey: audienceQueryKeys.personas.byBrand(variables.brand360Id) });
      queryClient.invalidateQueries({ queryKey: audienceQueryKeys.audience.byBrand(variables.brand360Id) });
    },
  });
}

export function useDeletePersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; brand360Id: string }) =>
      apiFetch<{ success: boolean; message: string }>(`/api/brand-360/personas/${data.id}`, {
        method: 'DELETE',
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: audienceQueryKeys.personas.byBrand(variables.brand360Id) });
      queryClient.invalidateQueries({ queryKey: audienceQueryKeys.audience.byBrand(variables.brand360Id) });
    },
  });
}

// ============================================
// Market Positioning Hooks
// ============================================

export function useMarketPositioning(brand360Id: string | undefined) {
  return useQuery({
    queryKey: audienceQueryKeys.positioning.byBrand(brand360Id || ''),
    queryFn: () => apiFetch<{ success: boolean; data: MarketPositioning | null }>(
      `/api/brand-360/positioning?brand360Id=${brand360Id}`
    ),
    enabled: !!brand360Id,
  });
}

export function useUpdatePositioning() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<MarketPositioning> & {
      brand360Id: string;
      valuePropositions?: Partial<ValueProposition>[];
      proofPoints?: Partial<ProofPoint>[];
      positioningAxes?: Partial<PositioningAxis>[];
    }) =>
      apiFetch<{ success: boolean; data: MarketPositioning }>('/api/brand-360/positioning', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: audienceQueryKeys.positioning.byBrand(variables.brand360Id) });
    },
  });
}

// ============================================
// Cache Invalidation Utilities
// ============================================

export function useInvalidateAudienceQueries() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: audienceQueryKeys.audience.all });
      queryClient.invalidateQueries({ queryKey: audienceQueryKeys.personas.all });
      queryClient.invalidateQueries({ queryKey: audienceQueryKeys.positioning.all });
    },
    invalidateAudience: (brand360Id: string) =>
      queryClient.invalidateQueries({ queryKey: audienceQueryKeys.audience.byBrand(brand360Id) }),
    invalidatePersonas: (brand360Id: string) =>
      queryClient.invalidateQueries({ queryKey: audienceQueryKeys.personas.byBrand(brand360Id) }),
    invalidatePositioning: (brand360Id: string) =>
      queryClient.invalidateQueries({ queryKey: audienceQueryKeys.positioning.byBrand(brand360Id) }),
  };
}
