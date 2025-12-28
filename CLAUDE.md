# VistralAI Development Reference

## Quick Reference

### Start Development
```bash
docker-compose -f docker-compose.mongodb.yml up -d
npm run dev
```

### Key Directories
```
lib/db/operations/    - Database operations (10 files, includes review-website-ops.ts)
lib/cache/            - Redis caching layer
lib/realtime/         - WebSocket support
lib/query/            - React Query hooks (hooks.ts, audienceHooks.ts)
lib/api/              - API middleware
lib/hooks/            - Performance hooks
lib/utils/            - Lazy loading utilities
components/ui/        - State components (EmptyState, LoadingState, ErrorState, DataWrapper)
components/audience/  - PersonaCard, PersonaForm
components/positioning/ - PositioningStatement, ValuePropositionCards, ProofPointsList
components/aeo/       - ReviewSiteSelector, CategoryMappingManager
lib/services/         - ReviewWebsiteService.ts (review site integration)
```

---

## Architecture

### Data Flow
```
Website URL → Firecrawl → BrandIntelligence → Brand360Profile → MongoDB → Redis Cache

Magic Import Flow:
  CrawlerAgent → VibeCheckAgent → CompetitorAgent → ProductExtractorAgent → AudiencePositioningAgent
                                                                              ↓
                                                    TargetAudience + CustomerPersonas + MarketPositioning
```

### Database Adapter
```typescript
// lib/db/index.ts - Switch via DATABASE_MODE env var
DATABASE_MODE = 'mongodb' | 'postgres' | 'mock'
```

---

## Caching Layer

### Redis (lib/cache/)
| File | Purpose |
|------|---------|
| `redis.ts` | Client with in-memory fallback |
| `keys.ts` | Key generators + TTL presets |

### TTL Presets
| Preset | Duration | Use Case |
|--------|----------|----------|
| short | 1 min | Frequently changing |
| standard | 5 min | Default |
| medium | 15 min | Moderately stable |
| long | 1 hour | Stable data |
| extended | 24 hours | Rarely changing |

### Usage
```typescript
import { cacheGet, cacheSet, withCache } from '@/lib/cache/redis';
import { cacheKeys, cacheTTL } from '@/lib/cache/keys';

// Cache wrapper
const data = await withCache(cacheKeys.brand360.profile(orgId), fetchFn, { ttl: cacheTTL.standard });
```

---

## API Middleware (lib/api/middleware.ts)

| Function | Purpose |
|----------|---------|
| `withErrorHandler` | Standardized error responses |
| `withAuth` | Session validation wrapper |
| `withRateLimit` | Rate limiting (100 req/min default) |
| `successResponse` | JSON success helper |
| `errorResponse` | JSON error helper |

### Usage
```typescript
import { withMiddleware, successResponse, errorResponse } from '@/lib/api/middleware';

export const GET = withMiddleware(async (req) => {
  const data = await fetchData();
  return successResponse(data);
}, { requireAuth: true, rateLimit: { maxRequests: 50 } });
```

---

## Real-Time Updates (lib/realtime/)

### Server Events
| Event | Direction | Purpose |
|-------|-----------|---------|
| `scan:started` | Server → Client | Scan initiated |
| `scan:progress` | Server → Client | Progress update (%) |
| `scan:complete` | Server → Client | Scan finished |
| `scan:error` | Server → Client | Scan failed |
| `insight:new` | Server → Client | New insight created |
| `correction:update` | Server → Client | Correction workflow update |

### Client Hooks
```typescript
import { useSocket, useScanSocket, useInsightSocket } from '@/lib/realtime/socket-client';

// Track scan progress
const { progress, isComplete } = useScanSocket({ brand360Id, scanId });

// Listen for new insights
const { latestInsight } = useInsightSocket({ brand360Id });
```

---

## React Query (lib/query/)

### Query Hooks
| Hook | Purpose |
|------|---------|
| `useBrand360Profile(orgId)` | Fetch brand profile |
| `useAEOScans(brand360Id)` | List perception scans |
| `useAEOScan(scanId)` | Single scan with polling |
| `useAEOInsights(brand360Id)` | Perception insights |
| `useAEOPrompts(brand360Id)` | Generated prompts |

### Audience & Positioning Hooks (lib/query/audienceHooks.ts)
| Hook | Purpose |
|------|---------|
| `useTargetAudience(brand360Id)` | Fetch target audience with personas |
| `usePersonas(brand360Id)` | List customer personas |
| `usePersona(personaId)` | Single persona details |
| `useMarketPositioning(brand360Id)` | Fetch positioning data |
| `useUpdateTargetAudience()` | Mutation for audience updates |
| `useCreatePersona()` | Mutation to create persona |
| `useUpdatePersona()` | Mutation to update persona |
| `useDeletePersona()` | Mutation to delete persona |
| `useUpdatePositioning()` | Mutation for positioning updates |

### Query Keys
```typescript
import { queryKeys } from '@/lib/query/hooks';
import { audienceQueryKeys } from '@/lib/query/audienceHooks';

queryKeys.brand360.profile(orgId)
queryKeys.aeo.scans(brand360Id)
queryKeys.aeo.insights(brand360Id)

// Audience & Positioning
audienceQueryKeys.audience(brand360Id)
audienceQueryKeys.personas(brand360Id)
audienceQueryKeys.positioning(brand360Id)
```

---

## Performance Patterns

### Lazy Loading (lib/utils/lazy.tsx)
```typescript
import { LazyQuadrantChart, LazyMetricsRadarChart } from '@/lib/utils/lazy';

// Components load on demand with skeleton
<LazyQuadrantChart data={data} />
```

Available lazy components:
- `LazyQuadrantChart`
- `LazyMetricsRadarChart`
- `LazyBrandStoryVisualizer`
- `LazyAIPlatformGalaxy`
- `LazyMarketLandscape`

### Performance Hooks (lib/hooks/useOptimized.ts)
```typescript
import { useDebouncedValue, useThrottledCallback } from '@/lib/hooks/useOptimized';

const debouncedSearch = useDebouncedValue(searchTerm, 300);
const throttledScroll = useThrottledCallback(handleScroll, 100);
```

---

## Docker Services

| Service | Port | Compose File |
|---------|------|--------------|
| MongoDB | 27017 | docker-compose.mongodb.yml |
| Mongo Express | 8081 | docker-compose.mongodb.yml |
| Redis | 6379 | docker-compose.mongodb.yml |
| Redis Commander | 8082 | docker-compose.mongodb.yml |
| Firecrawl | 3002 | docker-compose.yml |

---

## AEO Metrics

| Metric | Range | Meaning |
|--------|-------|---------|
| Faithfulness | 0-100 | Accuracy to ground truth |
| Share of Voice | 0-100 | Brand visibility |
| Sentiment | -1 to 1 | Overall sentiment |
| Voice Alignment | 0-100 | Matches brand tone |
| Hallucination | 0-100 | 100 = no hallucinations |

### Quadrant Logic
```
High Accuracy + High Visibility = DOMINANT (green)
Low Accuracy + High Visibility = VULNERABLE (amber)
High Accuracy + Low Visibility = NICHE (blue)
Low Accuracy + Low Visibility = INVISIBLE (red)
```

---

## AEO Agents

| Agent | Path | Purpose |
|-------|------|---------|
| CrawlerAgent | `lib/services/agents/CrawlerAgent.ts` | Web crawl + Schema.org |
| VibeCheckAgent | `lib/services/agents/VibeCheckAgent.ts` | Brand personality |
| CompetitorAgent | `lib/services/agents/CompetitorAgent.ts` | Competitor discovery |
| ProductExtractorAgent | `lib/services/agents/ProductExtractorAgent.ts` | Product/service extraction |
| AudiencePositioningAgent | `lib/services/agents/AudiencePositioningAgent.ts` | Target audience & positioning |
| PromptGeneratorAgent | `lib/services/agents/PromptGeneratorAgent.ts` | AI prompt generation |
| PerceptionEvaluatorAgent | `lib/services/agents/PerceptionEvaluatorAgent.ts` | LLM-as-a-Judge |
| PerceptionScanOrchestrator | `lib/services/agents/PerceptionScanOrchestrator.ts` | Coordinates scan flow |
| CorrectionGeneratorAgent | `lib/services/agents/CorrectionGeneratorAgent.ts` | Fix suggestions |
| MagicImportOrchestrator | `lib/services/agents/MagicImportOrchestrator.ts` | Coordinates onboarding |

---

## Review Website Integration

Industry-specific review site references for AI prompts (G2, Trustpilot, CNET, etc.).

### Database Models
| Model | Purpose |
|-------|---------|
| `ReviewCategory` | Industry categories (B2B Software, Consumer Electronics, etc.) |
| `ReviewWebsite` | Review sites with domain, priority, citation format |
| `BrandCategoryMapping` | Links brands to relevant categories |
| `PromptReviewSiteUsage` | Tracks which review sites used in prompts |

### Service Layer
```typescript
import { reviewWebsiteService } from '@/lib/services/ReviewWebsiteService';

// Auto-detect categories for a brand
const detected = await reviewWebsiteService.autoDetectCategories(brand360Id, brandData);

// Get relevant websites for a brand
const websites = await reviewWebsiteService.getRelevantWebsites(brand360Id);

// Map brand to category
await reviewWebsiteService.mapBrandToCategory(brand360Id, categoryId, { isPrimary: true });
```

### API Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/review-sites/categories` | GET | List all categories |
| `/api/review-sites/websites` | GET | List websites by category |
| `/api/review-sites/brand-mapping` | GET/POST/DELETE | Manage brand-category mappings |
| `/api/review-sites/auto-detect` | POST | Auto-detect categories for brand |

### Categories (15 total)
B2B Software, Consumer Electronics, E-commerce & Retail, Financial Services, Healthcare, Travel & Hospitality, Restaurants & Food, Automotive, Home Services, Real Estate, Legal Services, Education, Marketing & Agencies, HR & Recruiting, Cybersecurity

### Seeding
```bash
npx ts-node prisma/seed-review-sites.ts
```

---

## Prisma Patterns

### Embedded Documents (MongoDB)
```typescript
// CORRECT
brandVoice: { tone: ['professional'], keywords: ['innovative'], avoidWords: [] }
pricing: { currency: 'USD', amount: 99, billingPeriod: 'monthly' }

// WRONG - causes "Unknown argument" errors
voiceTone: ['professional']
pricingCurrency: 'USD'
```

---

## Theme CSS Variables

```css
background: rgb(var(--background));
background: rgb(var(--surface));
color: rgb(var(--foreground));
color: rgb(var(--foreground-secondary));
border-color: rgb(var(--border));
```

| Theme | Class | Background |
|-------|-------|------------|
| Morning | `.light` | #FFFFFF |
| Evening | `.dim` | #15202B |
| Night | `.lights-out` | #000000 |

---

## Debugging

```bash
# MongoDB shell
docker exec vistralai-mongodb mongosh -u vistralai -p vistralai_dev_password --authenticationDatabase admin vistralai

# View container logs
docker-compose -f docker-compose.mongodb.yml logs -f

# View Cloud Run logs
gcloud run logs read vistralai --region us-central1 --limit 50
```

---

## Feature Flags (lib/config/features.ts)

| Flag | Default | Purpose |
|------|---------|---------|
| `USE_FIRECRAWL` | true | Use Firecrawl for web crawling |
| `USE_REAL_API` | true | Use real LLM API calls (not mocks) |
| `CONFIDENCE_THRESHOLD` | 0.85 | Minimum confidence for auto-approval |
| `FIRECRAWL_MAX_PAGES` | 20 | Max pages to crawl per domain |

---

## State Components (components/ui/)

| Component | Purpose |
|-----------|---------|
| `EmptyState` | Display when no data exists |
| `LoadingState` | Display during data fetching |
| `ErrorState` | Display on error with retry |
| `DataWrapper` | Combines all states in one wrapper |

### Usage
```typescript
import DataWrapper from '@/components/ui/DataWrapper';

<DataWrapper
  data={profile}
  isLoading={isLoading}
  error={error}
  emptyState={{ title: 'No data', description: 'Create profile first' }}
  onRetry={refetch}
>
  {(data) => <ProfileView profile={data} />}
</DataWrapper>
```

---

## Common Issues

| Issue | Solution |
|-------|----------|
| `Unknown argument voiceTone` | Use nested `brandVoice: { tone, keywords, avoidWords }` |
| `Unknown argument pricingCurrency` | Use nested `pricing: { currency, amount, billingPeriod }` |
| Database not persisting | Set `DATABASE_MODE=mongodb` in `.env.local` |
| Redis connection failed | Check Redis container: `docker ps` |
| Firecrawl not working | Start Firecrawl: `docker-compose up -d` |
| Auth redirect loop | Verify `NEXTAUTH_URL` matches actual URL |
| AEO dashboard empty | Complete Magic Import first |
| Dashboard shows zeros | Run a perception scan to populate metrics |
