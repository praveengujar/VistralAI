// Cache Key Generators
// Centralized cache key management for consistency

const PREFIX = 'vistral';

// ============================================
// Cache Keys Factory
// ============================================

export const cacheKeys = {
  // Brand 360 Profile
  brand360: {
    profile: (organizationId: string) => `${PREFIX}:brand360:profile:${organizationId}`,
    byId: (brand360Id: string) => `${PREFIX}:brand360:id:${brand360Id}`,
    invalidateOrg: (organizationId: string) => `${PREFIX}:brand360:*:${organizationId}*`,
  },

  // AEO Perception
  perception: {
    scans: (brand360Id: string) => `${PREFIX}:perception:scans:${brand360Id}`,
    scan: (scanId: string) => `${PREFIX}:perception:scan:${scanId}`,
    insights: (brand360Id: string) => `${PREFIX}:perception:insights:${brand360Id}`,
    metrics: (brand360Id: string) => `${PREFIX}:perception:metrics:${brand360Id}`,
    invalidateBrand: (brand360Id: string) => `${PREFIX}:perception:*:${brand360Id}*`,
  },

  // Prompts
  prompts: {
    list: (brand360Id: string) => `${PREFIX}:prompts:list:${brand360Id}`,
    byCategory: (brand360Id: string, category: string) =>
      `${PREFIX}:prompts:cat:${brand360Id}:${category}`,
    invalidateBrand: (brand360Id: string) => `${PREFIX}:prompts:*:${brand360Id}*`,
  },

  // Corrections
  corrections: {
    list: (brand360Id: string) => `${PREFIX}:corrections:list:${brand360Id}`,
    workflow: (workflowId: string) => `${PREFIX}:corrections:workflow:${workflowId}`,
    invalidateBrand: (brand360Id: string) => `${PREFIX}:corrections:*:${brand360Id}*`,
  },

  // User
  user: {
    profile: (userId: string) => `${PREFIX}:user:profile:${userId}`,
    sessions: (userId: string) => `${PREFIX}:user:sessions:${userId}`,
    settings: (userId: string) => `${PREFIX}:user:settings:${userId}`,
    invalidate: (userId: string) => `${PREFIX}:user:*:${userId}*`,
  },

  // Reports
  reports: {
    summary: (brand360Id: string) => `${PREFIX}:reports:summary:${brand360Id}`,
    trends: (brand360Id: string, period: string) =>
      `${PREFIX}:reports:trends:${brand360Id}:${period}`,
    invalidateBrand: (brand360Id: string) => `${PREFIX}:reports:*:${brand360Id}*`,
  },

  // Competitors
  competitors: {
    list: (brandId: string) => `${PREFIX}:competitors:list:${brandId}`,
    graph: (brand360Id: string) => `${PREFIX}:competitors:graph:${brand360Id}`,
    invalidateBrand: (brandId: string) => `${PREFIX}:competitors:*:${brandId}*`,
  },

  // Products
  products: {
    list: (brandId: string) => `${PREFIX}:products:list:${brandId}`,
    aeoList: (brand360Id: string) => `${PREFIX}:products:aeo:${brand360Id}`,
    invalidateBrand: (brandId: string) => `${PREFIX}:products:*:${brandId}*`,
  },

  // Onboarding Progress (for SSE real-time updates)
  onboarding: {
    progress: (sessionId: string) => `${PREFIX}:onboarding:progress:${sessionId}`,
    complete: (sessionId: string) => `${PREFIX}:onboarding:complete:${sessionId}`,
    error: (sessionId: string) => `${PREFIX}:onboarding:error:${sessionId}`,
  },
};

// ============================================
// TTL Presets (in seconds)
// ============================================

export const cacheTTL = {
  // Progress (30 seconds) - real-time progress data
  progress: 30,

  // Short-lived (1 minute) - frequently changing data
  short: 60,

  // Standard (5 minutes) - default for most data
  standard: 5 * 60,

  // Medium (15 minutes) - moderately stable data
  medium: 15 * 60,

  // Long (1 hour) - stable data
  long: 60 * 60,

  // Extended (24 hours) - rarely changing data
  extended: 24 * 60 * 60,
};

// ============================================
// Cache Invalidation Helpers
// ============================================

export const invalidationPatterns = {
  // Invalidate all cache for a brand
  brand: (brand360Id: string) => [
    cacheKeys.brand360.invalidateOrg(brand360Id),
    cacheKeys.perception.invalidateBrand(brand360Id),
    cacheKeys.prompts.invalidateBrand(brand360Id),
    cacheKeys.corrections.invalidateBrand(brand360Id),
    cacheKeys.reports.invalidateBrand(brand360Id),
    cacheKeys.competitors.invalidateBrand(brand360Id),
    cacheKeys.products.invalidateBrand(brand360Id),
  ],

  // Invalidate perception-related cache
  perception: (brand360Id: string) => [
    cacheKeys.perception.invalidateBrand(brand360Id),
    cacheKeys.reports.invalidateBrand(brand360Id),
  ],

  // Invalidate user cache
  user: (userId: string) => [cacheKeys.user.invalidate(userId)],
};
