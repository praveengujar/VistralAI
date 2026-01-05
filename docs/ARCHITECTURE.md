# VistralAI Architecture Documentation

## 1. Overview

VistralAI is an advanced AI Engine Optimization (AEO) platform designed to help businesses understand how AI systems perceive their brand. The system leverages autonomous AI agents to crawl the web, analyze brand content, evaluate AI perception across multiple LLM platforms, and generate strategic insights.

## 2. Technology Stack

### Frontend & Application Layer
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Lucide React (Icons)
- **UI Components**: Radix UI primitives, Custom Design System
- **State Management**: React Query (TanStack Query v5)
- **Real-time**: Socket.io for live updates
- **Authentication**: NextAuth.js (Credentials & OAuth)

### Backend & API Layer
- **Runtime**: Node.js (via Next.js API Routes)
- **API Architecture**: RESTful endpoints (`app/api/*`)
- **Validation**: Zod schemas
- **Middleware**: Custom middleware for auth, rate limiting, error handling

### Database Layer
- **Primary Database**: MongoDB 7.0 (with Prisma ORM)
- **Database Adapter**: Supports MongoDB, PostgreSQL, Mock modes via `DATABASE_MODE`
- **Caching**: Redis 7 with in-memory fallback
- **Session Storage**: NextAuth with database sessions

### AI & Data Services
- **Web Scraping**: Firecrawl (Self-hosted microservices)
  - **API Service**: Manages crawl jobs, queues, and rate limits
  - **Playwright Service**: Headless browser automation for JS-heavy sites
- **LLM Provider**: Anthropic Claude (via SDK)
- **Multi-Platform Evaluation**: Claude, ChatGPT, Gemini, Perplexity, Google AIO

### Infrastructure (Google Cloud Platform)
- **Compute**: Google Cloud Run (Serverless Containers)
- **Build System**: Google Cloud Build
- **Database**: MongoDB Atlas or self-hosted
- **Caching**: Redis (Memorystore or self-hosted)
- **Networking**: Serverless VPC Access Connector
- **Secrets**: Google Secret Manager

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Frontend (Next.js)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Dashboard  │  │  Brand 360  │  │  AEO Panel  │  │  Reports    │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         └─────────────────┼─────────────────┼───────────────┘           │
│                           │                 │                            │
│                    React Query Hooks    Socket.io Client                 │
└───────────────────────────┼─────────────────┼────────────────────────────┘
                            │                 │
┌───────────────────────────┼─────────────────┼────────────────────────────┐
│                       API Layer (Next.js API Routes)                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Middleware: Auth → Rate Limit → Error Handler                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ /brand-360  │  │    /aeo     │  │ /onboarding │  │   /admin    │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
└─────────┼────────────────┼────────────────┼────────────────┼─────────────┘
          │                │                │                │
┌─────────┼────────────────┼────────────────┼────────────────┼─────────────┐
│         │           Agent System (lib/services/agents/)     │             │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐    │
│  │   Crawler   │  │  VibeCheck  │  │ Perception  │  │ Correction  │    │
│  │    Agent    │  │    Agent    │  │  Evaluator  │  │  Generator  │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐     │
│  │  Competitor │  │   Prompt    │  │    Magic Import              │     │
│  │    Agent    │  │  Generator  │  │    Orchestrator              │     │
│  └─────────────┘  └─────────────┘  └─────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
          │                │                │                │
┌─────────┼────────────────┼────────────────┼────────────────┼─────────────┐
│                        Data Layer                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │    MongoDB      │  │     Redis       │  │   Firecrawl     │          │
│  │  (Primary DB)   │  │   (Cache)       │  │  (Web Scraping) │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Core Components

### A. Database Layer (`lib/db/`)

**Database Adapter Pattern**
```typescript
// lib/db/index.ts - Switch via DATABASE_MODE env var
DATABASE_MODE = 'mongodb' | 'postgres' | 'mock'
```

**Operations Structure** (`lib/db/operations/`)
| File | Purpose |
|------|---------|
| `brand360-ops.ts` | Brand360 profile CRUD |
| `perception-ops.ts` | AEO perception scans and insights |
| `product-ops.ts` | Product management |
| `competitor-ops.ts` | Competitor data |
| `asset-ops.ts` | Asset/media management |
| `aggregate-ops.ts` | Aggregation queries |
| `user-ops.ts` | User account operations |
| `transforms.ts` | Data transformation utilities |

### B. Agent System (`lib/services/agents/`)

| Agent | Purpose |
|-------|---------|
| `CrawlerAgent` | Web crawling + Schema.org extraction |
| `VibeCheckAgent` | Brand personality analysis |
| `CompetitorAgent` | Competitor discovery and positioning |
| `ProductExtractorAgent` | Product/service extraction with pricing |
| `AudiencePositioningAgent` | Target audience & market positioning extraction |
| `PromptGeneratorAgent` | AI prompt generation for testing |
| `PerceptionEvaluatorAgent` | LLM-as-a-Judge evaluation |
| `PerceptionScanOrchestrator` | Coordinates full scan workflow |
| `CorrectionGeneratorAgent` | Generates fix suggestions for issues |
| `MagicImportOrchestrator` | Coordinates brand onboarding flow |

### C. Caching Layer (`lib/cache/`)

**Redis with In-Memory Fallback**
```typescript
import { cacheGet, cacheSet, withCache } from '@/lib/cache/redis';
import { cacheKeys, cacheTTL } from '@/lib/cache/keys';

const data = await withCache(
  cacheKeys.brand360.profile(orgId),
  fetchFn,
  { ttl: cacheTTL.standard }
);
```

**TTL Presets**
| Preset | Duration | Use Case |
|--------|----------|----------|
| short | 1 min | Frequently changing |
| standard | 5 min | Default |
| medium | 15 min | Moderately stable |
| long | 1 hour | Stable data |
| extended | 24 hours | Rarely changing |

### D. Feature Flags (`lib/config/features.ts`)

| Flag | Default | Purpose |
|------|---------|---------|
| `USE_FIRECRAWL` | true | Use Firecrawl for web crawling |
| `USE_REAL_API` | true | Use real LLM API calls |
| `CONFIDENCE_THRESHOLD` | 0.85 | Minimum confidence for auto-approval |
| `FIRECRAWL_MAX_PAGES` | 20 | Max pages to crawl per domain |
| `FIRECRAWL_TIMEOUT_MS` | 30000 | Crawl timeout in milliseconds |

### E. UI State Components (`components/ui/`)

| Component | Purpose |
|-----------|---------|
| `EmptyState` | Display when no data exists |
| `LoadingState` | Display during data fetching |
| `ErrorState` | Display on error with retry |
| `DataWrapper` | Combines all states in one wrapper |

### F. Real-time Updates (`lib/realtime/`)

**Socket.io Server Events**
| Event | Direction | Purpose |
|-------|-----------|---------|
| `scan:started` | Server → Client | Scan initiated |
| `scan:progress` | Server → Client | Progress update (%) |
| `scan:complete` | Server → Client | Scan finished |
| `scan:error` | Server → Client | Scan failed |
| `insight:new` | Server → Client | New insight created |
| `correction:update` | Server → Client | Correction workflow update |

**Client Hooks**
```typescript
import { useSocket } from '@/lib/realtime/socket-client';

const { socket, isConnected } = useSocket({
  brand360Id,
  onScanProgress: (data) => { /* handle progress */ },
  onScanComplete: (data) => { /* handle completion */ }
});
```

### E. API Middleware (`lib/api/middleware.ts`)

```typescript
import { withMiddleware, successResponse, errorResponse } from '@/lib/api/middleware';

export const GET = withMiddleware(
  async (req) => {
    const data = await fetchData();
    return successResponse(data);
  },
  { requireAuth: true, rateLimit: { maxRequests: 50 } }
);
```

---

## 5. Key Workflows

### A. Unified Onboarding Flow

```
Step 1: Brand Setup     → Enter website URL and brand name
Step 2: Choose Plan     → Select tier + billing cycle
Step 3: Payment         → Stripe PaymentElement → Start trial
Step 4: Build Profile   → Magic Import creates brand profile
Step 5: First Scan      → Optional perception scan (Quick/Comprehensive/Skip)
Step 6: Complete        → Redirect to dashboard
```

**OnboardingService** (`lib/services/onboarding/OnboardingService.ts`)
- Session management (create, resume, complete)
- Step validation and progression
- Event logging for analytics

### B. Magic Import (Brand Import)

```
Website URL
    │
    ▼
┌───────────────────┐
│   CrawlerAgent    │ ─── Scrape website + Schema.org
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  VibeCheckAgent   │ ─── Analyze brand personality
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ CompetitorAgent   │ ─── Discover competitors
└─────────┬─────────┘
          │
          ▼
┌─────────────────────────┐
│ ProductExtractorAgent   │ ─── Extract products/services with pricing
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────────┐
│ AudiencePositioningAgent    │ ─── Generate personas + positioning
└─────────┬───────────────────┘
          │
          ▼
┌───────────────────────────────────────────┐
│            Brand360 Profile               │
│  ┌─────────────┐  ┌─────────────────────┐│
│  │ Personas    │  │ Market Positioning  ││
│  │ Pain Points │  │ Value Propositions  ││
│  └─────────────┘  └─────────────────────┘│
└───────────────────────────────────────────┘
```

### C. AEO Perception Scan

```
Brand360 Profile
    │
    ▼
┌───────────────────┐
│ PromptGenerator   │ ─── Create test prompts
└─────────┬─────────┘
          │
          ▼
┌───────────────────────────────────────────────┐
│         Multi-Platform Query Execution         │
│  Claude │ ChatGPT │ Gemini │ Perplexity │ AIO │
└────────────────────┬──────────────────────────┘
                     │
                     ▼
┌───────────────────────────────────────────────┐
│          PerceptionEvaluatorAgent             │
│  ┌─────────────┐ ┌─────────────┐             │
│  │ Faithfulness│ │Share of Voice│             │
│  ├─────────────┤ ├─────────────┤             │
│  │  Sentiment  │ │Voice Alignment│            │
│  ├─────────────┤ ├─────────────┤             │
│  │Hallucination│ │   Quadrant  │             │
│  └─────────────┘ └─────────────┘             │
└────────────────────┬──────────────────────────┘
                     │
                     ▼
┌───────────────────────────────────────────────┐
│              Perception Insights              │
│   DOMINANT │ VULNERABLE │ NICHE │ INVISIBLE   │
└───────────────────────────────────────────────┘
```

### D. Corrections Workflow

```
Perception Insight (issue detected)
    │
    ▼
┌───────────────────────────────────────────────┐
│        CorrectionGeneratorAgent               │
│  ┌─────────────┐ ┌─────────────┐             │
│  │ Schema.org  │ │     FAQ     │             │
│  ├─────────────┤ ├─────────────┤             │
│  │   Content   │ │  Wikipedia  │             │
│  └─────────────┘ └─────────────┘             │
└────────────────────┬──────────────────────────┘
                     │
                     ▼
┌───────────────────────────────────────────────┐
│           Correction Workflow                  │
│   pending → verified → approved                │
└───────────────────────────────────────────────┘
```

---

## 6. AEO Metrics

| Metric | Range | Meaning |
|--------|-------|---------|
| Faithfulness | 0-100 | Accuracy to ground truth |
| Share of Voice | 0-100 | Brand visibility in responses |
| Sentiment | -1 to 1 | Overall sentiment |
| Voice Alignment | 0-100 | Matches brand tone |
| Hallucination | 0-100 | 100 = no hallucinations |

### Quadrant Positioning
```
              HIGH VISIBILITY
                    │
         VULNERABLE │ DOMINANT
      (amber)       │    (green)
                    │
LOW ACCURACY ───────┼─────── HIGH ACCURACY
                    │
        INVISIBLE   │   NICHE
           (red)    │   (blue)
                    │
              LOW VISIBILITY
```

---

## 7. Deployment & Infrastructure

### Docker Services (Local Development)

**docker-compose.mongodb.yml** (Data Layer)
| Service | Port | Description |
|---------|------|-------------|
| MongoDB | 27017 | Primary database |
| Mongo Express | 8081 | MongoDB admin UI |
| Redis | 6379 | Cache and queue |
| Redis Commander | 8082 | Redis admin UI |

**docker-compose.yml** (Firecrawl Services)
| Service | Port | Description |
|---------|------|-------------|
| Firecrawl API | 3002 | Web scraping API |
| Playwright | 3000 | Browser automation |
| PostgreSQL | 5432 | Firecrawl queue storage |

### Cloud Run Services (Production)
| Service | Port | Public |
|---------|------|--------|
| vistralai | 3000 | Yes |
| firecrawl-api | 3002 | Protected |
| firecrawl-playwright | 3000 | Internal |

---

## 8. Local Development

```bash
# Start data services
docker-compose -f docker-compose.mongodb.yml up -d

# Run application
npm run dev

# Optional: Start Firecrawl for web crawling
docker-compose up -d
```

**Environment Variables**
```env
DATABASE_MODE=mongodb
DATABASE_URL=mongodb://vistralai:vistralai_dev_password@localhost:27017/vistralai?authSource=admin&replicaSet=rs0
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=sk-ant-...
NEXTAUTH_URL=http://localhost:3000
```

---

## 10. Payment System Architecture

### Payment Flow
```
User selects plan
    │
    ▼
┌─────────────────────┐
│   Payment Form      │ ─── PaymentElement (card) or Express Checkout (wallets)
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Create SetupIntent │ ─── /api/payments/stripe/create-setup-intent
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Confirm Payment    │ ─── Stripe.js confirmSetup()
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Create Subscription│ ─── /api/subscription (with 15-day trial)
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Webhook Events     │ ─── /api/webhooks/stripe
└─────────────────────┘
```

### Pricing Tiers

| Tier | Monthly | Yearly | Discount | Features |
|------|---------|--------|----------|----------|
| Monitor | $99 | $1,045 | 12% | 1 brand, weekly updates |
| Growth | $299 | $3,050 | 15% | 10 brands, daily updates |
| Dominance | $999 | $9,830 | 18% | 50 brands, real-time, API |

### Subscription States

| State | Meaning |
|-------|---------|
| trialing | In 15-day free trial |
| active | Paying subscription |
| past_due | Payment failed, grace period |
| canceled | User canceled |
| paused | Temporarily paused |

### Payment Services

| Service | Location | Purpose |
|---------|----------|---------|
| StripeService | `lib/services/payments/StripeService.ts` | Stripe API wrapper |
| PayPalService | `lib/services/payments/PayPalService.ts` | PayPal integration |
| SubscriptionService | `lib/services/SubscriptionService.ts` | Subscription business logic |
| SubscriptionManagementService | `lib/services/SubscriptionManagementService.ts` | Upgrades/downgrades |

### Supported Payment Methods

- **Card payments**: Stripe PaymentElement
- **Apple Pay**: Safari on macOS/iOS (via `automatic_payment_methods`)
- **Google Pay**: Chrome browser (via `automatic_payment_methods`)
- **Link**: Stripe's one-click checkout
- **PayPal**: Alternative payment provider

### Webhook Events Handled

| Event | Handler |
|-------|---------|
| `customer.subscription.created` | Create subscription record |
| `customer.subscription.updated` | Update status/period |
| `customer.subscription.deleted` | Mark as canceled |
| `invoice.paid` | Create invoice record |
| `invoice.payment_failed` | Handle payment failure |
| `payment_method.attached` | Store payment method |

---

## 11. Directory Structure

```
lib/
├── api/              # API middleware
├── auth/             # Authentication (NextAuth, MFA)
├── cache/            # Redis caching layer
├── config/           # Configuration files
│   ├── pricing.ts    # Pricing tiers & trial config
│   ├── onboarding.ts # Onboarding steps & validation
│   └── features.ts   # Feature flags
├── db/               # Database adapter & operations
│   └── operations/   # Domain-specific DB operations
├── hooks/            # Performance & custom hooks
│   └── useOnboardingSocket.ts # Onboarding WebSocket hook
├── query/            # React Query hooks
│   ├── hooks.ts      # Core query hooks
│   ├── audienceHooks.ts # Audience & positioning hooks
│   └── onboardingHooks.ts # Onboarding session hooks
├── realtime/         # Socket.io client/server
│   └── onboarding-events.ts # Onboarding WebSocket events
├── services/
│   ├── agents/       # AI agent system
│   │   ├── MagicImportOrchestrator.ts
│   │   ├── ProductExtractorAgent.ts
│   │   └── AudiencePositioningAgent.ts
│   ├── onboarding/   # Onboarding session management
│   │   └── OnboardingService.ts
│   ├── payments/     # Payment services
│   │   ├── StripeService.ts
│   │   └── SubscriptionService.ts
│   ├── crawler/      # Web crawling
│   ├── llm/          # LLM integration
│   └── queue/        # Job queue system
├── theme/            # Theme management
└── utils/            # Lazy loading utilities

app/
├── api/              # API routes
│   ├── aeo/          # AEO/perception endpoints
│   ├── brand-360/    # Brand profile endpoints
│   │   ├── audience/ # Target audience API
│   │   ├── personas/ # Customer personas CRUD
│   │   └── positioning/ # Market positioning API
│   ├── onboarding/   # Unified onboarding API
│   │   ├── session/  # Session management
│   │   ├── brand/    # Brand name + URL save
│   │   ├── plan/     # Plan selection
│   │   ├── payment/  # Subscription creation
│   │   ├── profile/  # Magic Import trigger
│   │   ├── scan/     # First perception scan
│   │   └── complete/ # Finalization
│   ├── payments/     # Payment API
│   │   └── stripe/   # Stripe integration
│   └── admin/        # Admin endpoints
├── onboarding/       # Onboarding pages
│   └── (steps)/      # Route group for steps
│       ├── brand/    # Step 1: Brand Setup
│       ├── plan/     # Step 2: Choose Plan
│       ├── payment/  # Step 3: Payment
│       ├── profile/  # Step 4: Build Profile
│       ├── scan/     # Step 5: First Scan
│       └── complete/ # Step 6: Complete
└── dashboard/
    └── brand-profile/
        ├── audience/     # Audience page
        └── positioning/  # Positioning page

components/
├── audience/         # Audience UI components
│   ├── PersonaCard.tsx
│   └── PersonaForm.tsx
├── onboarding/unified/ # Unified onboarding components
│   ├── OnboardingLayout.tsx
│   ├── BrandStep.tsx
│   ├── PlanStep.tsx
│   ├── PaymentStep.tsx
│   ├── BuildProfileStep.tsx
│   ├── ScanStep.tsx
│   └── CompleteStep.tsx
├── payments/         # Payment components
│   ├── PaymentForm.tsx
│   └── ExpressCheckout.tsx
└── positioning/      # Positioning UI components
    └── PositioningStatement.tsx
```

---

**Last Updated**: January 2026
