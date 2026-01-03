# VistralAI System Diagrams

All diagrams below are in Mermaid format. You can use them with:
- **Claude**: Paste the mermaid code block directly in a Claude conversation
- **Mermaid.live**: Copy code to [mermaid.live](https://mermaid.live) for editing/export
- **GitHub/GitLab**: Renders automatically in markdown files

---

## 1. API Route Diagram

```mermaid
flowchart TB
    subgraph Auth["Authentication Routes"]
        A1["/api/auth/[...nextauth]"]
        A2["/api/auth/register"]
    end

    subgraph Brand360["Brand 360 Routes"]
        B1["/api/brand-360"]
        B2["/api/brand-360/identity"]
        B3["/api/brand-360/products"]
        B4["/api/brand-360/competitors"]
        B5["/api/brand-360/market-position"]
        B6["/api/brand-360/analyze-website"]
        B7["/api/brand-360/upload"]
        B8["/api/brand-360/catalog/upload"]
    end

    subgraph AEO["AEO Engine Routes"]
        C1["/api/aeo/magic-import"]
        C2["/api/aeo/perception-scan"]
        C3["/api/aeo/perception-scan/[scanId]"]
        C4["/api/aeo/insights"]
        C5["/api/aeo/insights/[insightId]"]
        C6["/api/aeo/corrections"]
        C7["/api/aeo/corrections/[workflowId]"]
        C8["/api/aeo/prompts"]
        C9["/api/aeo/prompts/generate"]
        C10["/api/aeo/reports/summary"]
        C11["/api/aeo/reports/export"]
        C12["/api/aeo/compare-scans"]
    end

    subgraph User["User Routes"]
        D1["/api/user/profile"]
        D2["/api/user/password"]
        D3["/api/user/sessions"]
        D4["/api/user/mfa"]
        D5["/api/user/mfa/setup"]
        D6["/api/user/mfa/verify"]
    end

    subgraph Onboarding["Onboarding Routes"]
        E1["/api/onboarding/session"]
        E2["/api/onboarding/brand"]
        E3["/api/onboarding/plan"]
        E4["/api/onboarding/payment"]
        E5["/api/onboarding/complete"]
        E6["/api/onboarding/status"]
        E7["/api/onboarding/analyze"]
    end

    subgraph Admin["Admin Routes"]
        F1["/api/admin/queue-stats"]
        F2["/api/admin/review-queue"]
    end

    subgraph Other["Other Routes"]
        G1["/api/health"]
        G2["/api/brand-profile"]
        G3["/api/reports/brand-story"]
        G4["/api/debug/db-dump"]
    end

    Client((Client)) --> Auth
    Client --> Brand360
    Client --> AEO
    Client --> User
    Client --> Onboarding
    Client --> Admin
    Client --> Other
```

---

## 2. System Architecture Diagram

> **Architecture Pattern**: 3-Tier with BFF (Backend for Frontend)
> - **Tier 1 - Frontend**: Browser-based React UI (never directly accesses databases or external APIs)
> - **Tier 2 - Mid-Tier/BFF**: Next.js API Routes (handles auth, validation, orchestration)
> - **Tier 3 - Backend**: Services, Databases, External APIs

```mermaid
flowchart TB
    subgraph Tier1["TIER 1: FRONTEND (Browser)"]
        Browser["🌐 Browser Client<br/>React 18 + React Query v5<br/>Tailwind CSS"]
        WSClient["🔌 WebSocket Client<br/>Socket.io-client"]
    end

    subgraph Tier2["TIER 2: MID-TIER / BFF (Next.js API Routes)"]
        subgraph Presentation["Presentation Layer"]
            Pages["App Router Pages<br/>/dashboard, /onboarding<br/>/brand-360, /aeo, /settings"]
            Components["React Components<br/>UI, Charts, Forms"]
        end

        subgraph APILayer["API Layer (/api)"]
            AuthRoutes["🔐 Auth Routes<br/>/auth/[...nextauth]<br/>/auth/register"]
            OnboardingRoutes["📋 Onboarding Routes<br/>/onboarding/session<br/>/onboarding/brand<br/>/onboarding/plan<br/>/onboarding/payment<br/>/onboarding/complete"]
            Brand360Routes["🎯 Brand 360 Routes<br/>/brand-360/*<br/>/brand-360/audience<br/>/brand-360/personas<br/>/brand-360/positioning"]
            AEORoutes["📊 AEO Routes<br/>/aeo/magic-import<br/>/aeo/perception-scan<br/>/aeo/insights<br/>/aeo/prompts"]
            PaymentRoutes["💳 Payment Routes<br/>/payments/stripe/*<br/>/webhooks/stripe"]
        end

        subgraph ServiceLayer["Service Layer (lib/services)"]
            subgraph CoreServices["Core Services"]
                OnboardingSvc["📋 OnboardingService<br/>Session management<br/>Step validation<br/>Event logging"]
                StripeSvc["💳 StripeService<br/>SetupIntent<br/>Subscriptions<br/>Payment methods"]
                SubSvc["📦 SubscriptionService<br/>Trial management<br/>Plan changes<br/>Cancellation"]
            end

            subgraph AIAgents["AI Agent Pipeline"]
                MIO["🎭 MagicImportOrchestrator<br/>Coordinates all agents"]
                CA["🕷️ CrawlerAgent<br/>Web scraping<br/>Schema.org extraction"]
                VCA["✨ VibeCheckAgent<br/>Brand personality<br/>Tone analysis"]
                CMA["🎯 CompetitorAgent<br/>Competitor discovery<br/>Market positioning"]
                PEA["📦 ProductExtractorAgent<br/>Products/Services<br/>Pricing extraction"]
                APA["👥 AudiencePositioningAgent<br/>Personas generation<br/>Value propositions"]
                PGA["📝 PromptGeneratorAgent<br/>Test prompt creation<br/>Category coverage"]
                PEvA["⚖️ PerceptionEvaluatorAgent<br/>LLM-as-Judge<br/>Multi-platform scoring"]
                CGA["🔧 CorrectionGeneratorAgent<br/>Fix suggestions<br/>Schema corrections"]
            end
        end

        subgraph DataAccess["Data Access Layer"]
            Prisma["Prisma ORM<br/>Type-safe queries"]
            CacheLayer["Cache Layer<br/>withCache wrapper"]
            DBOps["DB Operations<br/>/lib/db/operations/*"]
        end

        subgraph RealtimeLayer["Real-time Layer"]
            SocketIO["🔌 Socket.io Server<br/>Port 3000"]
            OnboardingEvt["Onboarding Events<br/>progress, complete, error"]
            ScanEvt["Scan Events<br/>started, progress, complete"]
        end

        Middleware["🛡️ Middleware Stack<br/>Auth → RateLimit → ErrorHandler"]
    end

    subgraph Tier3["TIER 3: BACKEND (Services, Databases, External APIs)"]
        subgraph MongoDB["MongoDB 7.0<br/>mongodb://localhost:27017"]
            UsersCol[("👤 users<br/>email, password<br/>onboardingCompleted")]
            SessionsCol[("🔑 sessions<br/>NextAuth sessions")]
            Brand360Col[("🎯 brand360_profiles<br/>brandIdentity, competitors<br/>products, personas")]
            OnboardingCol[("📋 onboarding_sessions<br/>currentStep, completedSteps<br/>selectedTierId, subscriptionId")]
            OnboardingEvtCol[("📊 onboarding_events<br/>eventType, step<br/>eventData, errorMessage")]
            SubscriptionsCol[("💳 subscriptions<br/>stripeCustomerId<br/>status, currentPeriodEnd")]
            ScansCol[("📈 perception_scans<br/>platforms, overallScore<br/>quadrantPosition")]
            PromptsCol[("📝 generated_prompts<br/>category, intent<br/>renderedPrompt")]
            InsightsCol[("💡 perception_insights<br/>issueType, severity<br/>recommendation")]
        end

        subgraph Redis["Redis 7.0<br/>redis://localhost:6379"]
            SessionCache["🔐 Session Cache<br/>TTL: 24h"]
            ProfileCache["📦 Profile Cache<br/>TTL: 5min"]
            RateLimitStore["⏱️ Rate Limit<br/>100 req/min"]
            JobQueue["📋 Job Queue<br/>Bull queues"]
        end

        subgraph ExternalServices["EXTERNAL SERVICES"]
        subgraph AIProviders["AI/LLM Providers"]
            OpenAI["🤖 OpenAI API<br/>GPT-4o-mini<br/>Brand analysis"]
            Anthropic["🧠 Anthropic API<br/>Claude 3<br/>Perception eval"]
            Gemini["💎 Google Gemini<br/>Perception eval"]
            Perplexity["🔍 Perplexity AI<br/>Perception eval"]
        end

            subgraph PaymentProviders["Payment Providers"]
                Stripe["💳 Stripe API<br/>Subscriptions<br/>Apple Pay, Google Pay"]
                PayPal["🅿️ PayPal API<br/>Alternative payments"]
            end
        end

        subgraph FirecrawlStack["FIRECRAWL OPEN SOURCE STACK (Self-Hosted)"]
        subgraph FirecrawlAPI["Firecrawl API Service"]
            FCApi["🕷️ Firecrawl API<br/>Port 3002 → 3000<br/>/v1/crawl, /v1/scrape"]
            FCWorkers["👷 Crawl Workers<br/>NUM_WORKERS: 4<br/>Parallel processing"]
        end

        subgraph FirecrawlData["Firecrawl Data Layer"]
            FCPostgres[("🐘 PostgreSQL 17<br/>Port 5432<br/>NUQ Job Queue<br/>postgres/postgres")]
            FCRabbitMQ["🐰 RabbitMQ 3<br/>Port 5672/15672<br/>Extract Worker Queue<br/>guest/guest"]
        end

        subgraph FirecrawlBrowser["Browser Automation"]
            FCPlaywright["🎭 Playwright Service<br/>Internal Port 3000<br/>Headless Chrome<br/>JS Rendering"]
        end

            TargetSites["🌐 Target Websites<br/>HTTPS crawling"]
        end

        subgraph Infrastructure["INFRASTRUCTURE (GCP)"]
            CloudRun["☁️ Cloud Run<br/>0-20 instances<br/>2Gi/2CPU"]
            SecretMgr["🔒 Secret Manager<br/>API keys<br/>DB credentials"]
            Memorystore["📦 Memorystore<br/>Redis 7.0<br/>1GB"]
            CloudLog["📊 Cloud Logging<br/>Structured logs"]
            VPC["🔗 VPC Connector<br/>Private networking"]
        end
    end

    %% ===== TIER 1 → TIER 2 CONNECTIONS (Frontend → Mid-Tier) =====
    %% Frontend NEVER directly accesses Tier 3 (databases, external APIs)
    Browser -->|"HTTPS :3000<br/>REST API calls"| APILayer
    Browser -->|"HTTPS :3000<br/>Page requests"| Presentation
    WSClient <-->|"WS :3000<br/>Real-time events"| SocketIO

    %% ===== TIER 2 INTERNAL (API Routes → Services) =====
    AuthRoutes -->|"Validate session"| Middleware
    OnboardingRoutes -->|"Session ops"| OnboardingSvc
    OnboardingRoutes -->|"Start import"| MIO
    OnboardingRoutes -->|"Create sub"| StripeSvc
    Brand360Routes -->|"Profile CRUD"| DBOps
    AEORoutes -->|"Generate prompts"| PGA
    AEORoutes -->|"Run scans"| PEvA
    AEORoutes -->|"Start import"| MIO
    PaymentRoutes -->|"Setup intents"| StripeSvc
    PaymentRoutes -->|"Webhook events"| SubSvc

    %% ===== TIER 2 → TIER 3 CONNECTIONS (Mid-Tier → Backend) =====
    AuthRoutes -->|"CRUD users"| UsersCol
    AuthRoutes -->|"Manage sessions"| SessionsCol
    Brand360Routes -->|"Query profiles"| Brand360Col
    OnboardingSvc -->|"R/W sessions"| OnboardingCol
    OnboardingSvc -->|"Log events"| OnboardingEvtCol
    StripeSvc -->|"Store payment"| SubscriptionsCol
    SubSvc -->|"Update status"| SubscriptionsCol
    SubSvc -->|"Update user"| UsersCol

    %% ===== TIER 2 → TIER 3: EXTERNAL SERVICES =====
    StripeSvc -->|"API calls"| Stripe
    SubSvc -->|"Webhook handling"| Stripe

    %% ===== TIER 2 → TIER 3: AI AGENT PIPELINE =====
    MIO -->|"1. Crawl website"| CA
    CA -->|"2. Analyze brand"| VCA
    VCA -->|"3. Find competitors"| CMA
    CMA -->|"4. Extract products"| PEA
    PEA -->|"5. Build personas"| APA
    APA -->|"Save profile"| Brand360Col

    CA -->|"HTTP :3002<br/>POST /v1/crawl"| FCApi

    %% ===== FIRECRAWL INTERNAL CONNECTIONS =====
    FCApi -->|"TCP :5432<br/>Job queue storage"| FCPostgres
    FCApi -->|"TCP :6379<br/>Cache + Rate limit"| Redis
    FCApi -->|"AMQP :5672<br/>Worker messages"| FCRabbitMQ
    FCApi --> FCWorkers
    FCWorkers -->|"HTTP :3000<br/>JS rendering"| FCPlaywright
    FCPlaywright -->|"HTTPS<br/>Headless browse"| TargetSites
    FCRabbitMQ --> FCWorkers

    VCA -->|"POST /chat/completions"| OpenAI
    CMA -->|"POST /chat/completions"| OpenAI
    PEA -->|"POST /chat/completions"| OpenAI
    APA -->|"POST /chat/completions"| OpenAI

    PGA -->|"Generate prompts"| OpenAI
    PGA -->|"Store prompts"| PromptsCol

    PEvA -->|"Query ChatGPT"| OpenAI
    PEvA -->|"Query Claude"| Anthropic
    PEvA -->|"Query Gemini"| Gemini
    PEvA -->|"Query Perplexity"| Perplexity
    PEvA -->|"Store results"| ScansCol
    PEvA -->|"Create insights"| InsightsCol

    CGA -->|"Generate fixes"| OpenAI

    %% ===== TIER 2: REAL-TIME EVENT FLOW =====
    MIO -.->|"Emit progress"| OnboardingEvt
    PEvA -.->|"Emit progress"| ScanEvt
    OnboardingEvt -.->|"Broadcast"| SocketIO
    ScanEvt -.->|"Broadcast"| SocketIO
    SocketIO -.->|"Push to client"| WSClient

    %% ===== DATA ACCESS PATTERNS =====
    Prisma -->|"TCP :27017"| MongoDB
    CacheLayer -->|"TCP :6379<br/>GET/SET"| Redis
    DBOps --> Prisma
    DBOps --> CacheLayer

    Middleware -->|"Check session"| SessionCache
    Middleware -->|"Check rate"| RateLimitStore

    %% ===== TIER 2 → INFRASTRUCTURE CONNECTIONS =====
    Tier2 -.->|"Deployed to"| CloudRun
    CloudRun -.->|"Read secrets"| SecretMgr
    CloudRun -.->|"VPC access"| VPC
    VPC -.->|"Connect"| Memorystore
    Tier2 -.->|"Send logs"| CloudLog

    %% ===== STYLING =====
    classDef client fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef api fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef service fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    classDef agent fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef database fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef external fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef infra fill:#eceff1,stroke:#546e7a,stroke-width:2px
    classDef firecrawl fill:#fff8e1,stroke:#f57c00,stroke-width:2px
    classDef fcdata fill:#e0f2f1,stroke:#00695c,stroke-width:2px

    class Browser,WSClient client
    class AuthRoutes,OnboardingRoutes,Brand360Routes,AEORoutes,PaymentRoutes api
    class OnboardingSvc,StripeSvc,SubSvc service
    class MIO,CA,VCA,CMA,PEA,APA,PGA,PEvA,CGA agent
    class UsersCol,SessionsCol,Brand360Col,OnboardingCol,SubscriptionsCol,ScansCol,PromptsCol,InsightsCol,OnboardingEvtCol database
    class OpenAI,Anthropic,Gemini,Perplexity,Stripe,PayPal external
    class CloudRun,SecretMgr,Memorystore,CloudLog,VPC infra
    class FCApi,FCWorkers,FCPlaywright,TargetSites firecrawl
    class FCPostgres,FCRabbitMQ fcdata
```

---

## 2b. Service Interconnection Details

### API Routes → Services

| API Route | Calls Service | Database Writes | External Calls |
|-----------|---------------|-----------------|----------------|
| `/api/auth/*` | NextAuth.js | `users`, `sessions` | - |
| `/api/onboarding/session` | OnboardingService | `onboarding_sessions` | - |
| `/api/onboarding/brand` | MagicImportOrchestrator | `brand360_profiles`, `onboarding_sessions` | Firecrawl, OpenAI |
| `/api/onboarding/plan` | OnboardingService | `onboarding_sessions` | - |
| `/api/onboarding/payment` | StripeService, SubscriptionService | `subscriptions`, `onboarding_sessions` | Stripe API |
| `/api/onboarding/complete` | OnboardingService | `users`, `onboarding_sessions` | - |
| `/api/brand-360/*` | DBOps (Prisma) | `brand360_profiles` | - |
| `/api/aeo/magic-import` | MagicImportOrchestrator | `brand360_profiles` | Firecrawl, OpenAI |
| `/api/aeo/perception-scan` | PerceptionEvaluatorAgent | `perception_scans`, `ai_perception_results` | OpenAI, Anthropic, Gemini, Perplexity |
| `/api/aeo/prompts/generate` | PromptGeneratorAgent | `generated_prompts` | OpenAI |
| `/api/payments/stripe/*` | StripeService | `subscriptions` | Stripe API |
| `/api/webhooks/stripe` | SubscriptionService | `subscriptions`, `users` | - |

### AI Agent Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MagicImportOrchestrator                               │
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │ CrawlerAgent │───▶│VibeCheckAgent│───▶│CompetitorAgent│                  │
│  │              │    │              │    │              │                  │
│  │ Firecrawl    │    │ OpenAI       │    │ OpenAI       │                  │
│  │ Schema.org   │    │ Personality  │    │ 3 competitors│                  │
│  └──────────────┘    └──────────────┘    └──────────────┘                  │
│         │                   │                   │                           │
│         ▼                   ▼                   ▼                           │
│  ┌──────────────────────────────────────────────────────┐                  │
│  │              ProductExtractorAgent                    │                  │
│  │              OpenAI │ Products + Pricing              │                  │
│  └──────────────────────────────────────────────────────┘                  │
│                              │                                              │
│                              ▼                                              │
│  ┌──────────────────────────────────────────────────────┐                  │
│  │           AudiencePositioningAgent                    │                  │
│  │           OpenAI │ Personas + Positioning             │                  │
│  └──────────────────────────────────────────────────────┘                  │
│                              │                                              │
│                              ▼                                              │
│                     brand360_profiles (MongoDB)                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Database Collection Dependencies

| Collection | Written By | Read By |
|------------|------------|---------|
| `users` | AuthRoutes, SubscriptionService, OnboardingService | AuthRoutes, all authenticated routes |
| `sessions` | NextAuth.js | Middleware (auth check) |
| `brand360_profiles` | MagicImportOrchestrator, Brand360Routes | AEORoutes, Dashboard, all brand queries |
| `onboarding_sessions` | OnboardingService | OnboardingRoutes, complete page |
| `onboarding_events` | OnboardingService | Analytics, debugging |
| `subscriptions` | StripeService, SubscriptionService | PaymentRoutes, feature gating |
| `perception_scans` | PerceptionEvaluatorAgent | AEORoutes, Dashboard |
| `generated_prompts` | PromptGeneratorAgent | PerceptionEvaluatorAgent, Prompts page |
| `perception_insights` | PerceptionEvaluatorAgent | Insights page, Dashboard |

### External Service Dependencies

| Internal Service | External Service | Data Exchanged | Rate Limits |
|------------------|------------------|----------------|-------------|
| CrawlerAgent | Firecrawl API | URLs → HTML/Markdown | 20 pages/domain |
| VibeCheckAgent | OpenAI API | Brand data → Personality | 10K TPM |
| CompetitorAgent | OpenAI API | Brand data → Competitors | 10K TPM |
| ProductExtractorAgent | OpenAI API | Page content → Products | 10K TPM |
| AudiencePositioningAgent | OpenAI API | Brand data → Personas | 10K TPM |
| PromptGeneratorAgent | OpenAI API | Brand data → Prompts | 10K TPM |
| PerceptionEvaluatorAgent | OpenAI, Anthropic, Gemini, Perplexity | Prompts → Responses → Scores | Varies |
| StripeService | Stripe API | Payment data | 100 req/sec |
| SubscriptionService | Stripe Webhooks | Event notifications | - |

### Firecrawl Internal Connections

| Firecrawl Component | Connects To | Protocol | Purpose |
|---------------------|-------------|----------|---------|
| Firecrawl API | PostgreSQL | TCP :5432 | NUQ job queue storage |
| Firecrawl API | Redis | TCP :6379 | Caching, rate limiting |
| Firecrawl API | RabbitMQ | AMQP :5672 | Worker message queue |
| Crawl Workers | RabbitMQ | AMQP :5672 | Receive job messages |
| Crawl Workers | Playwright | HTTP :3000 | JS page rendering |
| Playwright | Target Sites | HTTPS | Headless browsing |

### Real-time Event Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ MagicImport     │────▶│ OnboardingEvents│────▶│ Socket.io Server│
│ Orchestrator    │     │ - progress      │     │                 │
│                 │     │ - complete      │     │   Broadcast to  │
│ Perception      │────▶│ ScanEvents      │────▶│   room members  │
│ Evaluator       │     │ - started       │     │                 │
│                 │     │ - progress      │     │                 │
└─────────────────┘     │ - complete      │     └────────┬────────┘
                        └─────────────────┘              │
                                                         ▼
                                               ┌─────────────────┐
                                               │ Browser Client  │
                                               │ (useSocket hook)│
                                               └─────────────────┘
```

### Cache Strategy

| Cache Key Pattern | TTL | Purpose |
|-------------------|-----|---------|
| `session:{userId}` | 24h | User session data |
| `brand360:{orgId}` | 5min | Brand profile |
| `scans:{brand360Id}` | 5min | Perception scans |
| `insights:{brand360Id}` | 5min | Perception insights |
| `pricing:tiers` | 1h | Pricing tiers |
| `ratelimit:{ip}:{route}` | 1min | Rate limiting |

---

## 2c. Firecrawl Open Source Stack

Firecrawl is self-hosted as an integrated service within the VistralAI infrastructure, providing web scraping capabilities with JavaScript rendering support.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FIRECRAWL OPEN SOURCE STACK                               │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     Firecrawl API (Port 3002)                        │   │
│  │                     /v1/crawl, /v1/scrape, /v1/map                   │   │
│  └───────────┬─────────────────┬─────────────────┬─────────────────────┘   │
│              │                 │                 │                          │
│              ▼                 ▼                 ▼                          │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────┐                  │
│  │ PostgreSQL 17 │  │   Redis 7    │  │   RabbitMQ 3    │                  │
│  │  Port: 5432   │  │  Port: 6379  │  │  Port: 5672     │                  │
│  │  NUQ Queue    │  │  Cache/Rate  │  │  Worker Queue   │                  │
│  └───────────────┘  └──────────────┘  └────────┬────────┘                  │
│                                                 │                           │
│                                                 ▼                           │
│                                      ┌─────────────────┐                   │
│                                      │  Crawl Workers  │                   │
│                                      │  (4 parallel)   │                   │
│                                      └────────┬────────┘                   │
│                                               │                             │
│                                               ▼                             │
│                                    ┌───────────────────┐                   │
│                                    │ Playwright Service│                   │
│                                    │  Internal :3000   │                   │
│                                    │  Headless Chrome  │                   │
│                                    └────────┬──────────┘                   │
│                                             │                               │
└─────────────────────────────────────────────┼───────────────────────────────┘
                                              │
                                              ▼
                                    ┌───────────────────┐
                                    │  Target Websites  │
                                    │     (HTTPS)       │
                                    └───────────────────┘
```

### Service Components

| Service | Container | Port | Purpose |
|---------|-----------|------|---------|
| **Firecrawl API** | vistralai-firecrawl | 3002 → 3000 | Main scraping API, job management |
| **PostgreSQL** | vistralai-postgres | 5432 | NUQ job queue persistence |
| **Redis** | vistralai-redis | 6379 | Caching, rate limiting (shared with VistralAI) |
| **RabbitMQ** | vistralai-rabbitmq | 5672, 15672 | Extract worker message queue |
| **Playwright** | vistralai-playwright | 3000 (internal) | Headless browser for JS rendering |

### Environment Configuration

| Variable | Value | Purpose |
|----------|-------|---------|
| `REDIS_URL` | `redis://redis:6379` | Cache connection |
| `REDIS_RATE_LIMIT_URL` | `redis://redis:6379` | Rate limit storage |
| `NUQ_DATABASE_URL` | `postgresql://postgres:postgres@postgres:5432/postgres` | Job queue DB |
| `NUQ_RABBITMQ_URL` | `amqp://guest:guest@rabbitmq:5672` | Worker messaging |
| `PLAYWRIGHT_MICROSERVICE_URL` | `http://playwright:3000/scrape` | JS rendering |
| `NUM_WORKERS_PER_QUEUE` | `4` | Parallel crawl workers |
| `USE_DB_AUTHENTICATION` | `false` | Auth disabled for local |
| `RATE_LIMIT_TEST_MODE` | `true` | Generous limits for dev |

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/crawl` | POST | Start async crawl job |
| `/v1/crawl/{id}` | GET | Get crawl job status/results |
| `/v1/scrape` | POST | Single page scrape |
| `/v1/map` | POST | Get site map |
| `/` | GET | Health check |

### Data Flow

1. **VistralAI CrawlerAgent** calls `POST /v1/crawl` with target URL
2. **Firecrawl API** creates job in PostgreSQL, returns job ID
3. **Workers** pick up job from RabbitMQ queue
4. **Playwright Service** renders JavaScript-heavy pages
5. **Results** stored in PostgreSQL, status cached in Redis
6. **CrawlerAgent** polls `/v1/crawl/{id}` until complete
7. **Markdown content** returned to agent pipeline

### Docker Network

All Firecrawl services run on `vistralai-network` (bridge driver):
- Internal DNS resolution (e.g., `redis:6379`, `postgres:5432`)
- Isolated from host network except exposed ports
- Shared Redis instance with VistralAI application

### Starting Firecrawl Stack

```bash
# Start all services
docker-compose up -d

# Check service health
docker-compose ps

# View Firecrawl logs
docker-compose logs -f firecrawl

# Access RabbitMQ management UI
open http://localhost:15672  # guest/guest
```

---

## 3. Auth Flow Diagram

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant B as Browser
    participant N as Next.js App
    participant NA as NextAuth.js
    participant DB as MongoDB
    participant AL as Audit Log

    rect rgb(240, 248, 255)
        Note over U,AL: Credentials Login Flow
        U->>B: Enter email/password
        B->>N: POST /api/auth/signin
        N->>NA: Validate credentials
        NA->>DB: getUserByEmail()
        DB-->>NA: User record
        NA->>NA: verifyPassword()
        alt Password Valid
            NA->>NA: Generate JWT token
            NA->>DB: Update lastLoginAt
            NA->>AL: Log signin event
            NA-->>B: Set HTTP-only cookie
            B-->>U: Redirect to /dashboard
        else Password Invalid
            NA-->>B: Error response
            B-->>U: Show error message
        end
    end

    rect rgb(255, 248, 240)
        Note over U,AL: OAuth Login Flow (Google/GitHub)
        U->>B: Click OAuth provider
        B->>NA: GET /api/auth/signin/google
        NA->>B: Redirect to OAuth provider
        B->>U: OAuth consent screen
        U->>B: Grant permission
        B->>NA: OAuth callback with code
        NA->>NA: Exchange code for tokens
        NA->>DB: Find or create user
        NA->>DB: Link OAuth account
        NA->>AL: Log signin event
        NA-->>B: Set HTTP-only cookie
        B-->>U: Redirect to /dashboard
    end

    rect rgb(248, 255, 240)
        Note over U,AL: Session Validation
        U->>B: Access protected route
        B->>N: Request with cookie
        N->>NA: Validate JWT token
        alt Token Valid
            NA-->>N: Session data
            N-->>B: Protected content
        else Token Invalid/Expired
            NA-->>N: null session
            N-->>B: Redirect to /auth/login
        end
    end
```

---

## 4. Component Hierarchy Diagram

```mermaid
flowchart TB
    subgraph App["App Router"]
        Layout["RootLayout"]

        subgraph AuthPages["Auth Pages"]
            Login["LoginPage"]
            Register["RegisterPage"]
            Error["ErrorPage"]
        end

        subgraph Dashboard["Dashboard Pages"]
            DashLayout["DashboardLayout"]
            DashHome["DashboardPage"]
            Brand360Page["Brand360Page"]
            AEOPage["AEOPage"]
            ScanPage["ScanPage"]
            InsightsPage["InsightsPage"]
            SettingsPage["SettingsPage"]
            ReviewQueue["ReviewQueuePage"]
            ReportPage["ReportPage"]
        end

        Onboarding["OnboardingPage"]
    end

    subgraph Components["Shared Components"]
        subgraph LayoutComps["Layout"]
            DashboardLayoutComp["DashboardLayout"]
            SessionProvider["SessionProvider"]
        end

        subgraph AuthComps["Auth"]
            AuthForm["AuthForm"]
        end

        subgraph Brand360Comps["Brand 360"]
            WebsiteAnalyzer["WebsiteAnalyzer"]
            BrandStoryCanvas["BrandStoryCanvas"]
            BrandOfferingsShowcase["BrandOfferingsShowcase"]
            ProfileStrengthMeter["ProfileStrengthMeter"]
            DocumentUpload["DocumentUpload"]
            ProductCatalogConnector["ProductCatalogConnector"]
        end

        subgraph AEOComps["AEO Engine"]
            QuadrantChart["QuadrantChart"]
            MetricsRadarChart["MetricsRadarChart"]
            PerceptionScoreCard["PerceptionScoreCard"]
            PlatformComparisonChart["PlatformComparisonChart"]
            ScoreTrendChart["ScoreTrendChart"]
            InsightsPriorityMatrix["InsightsPriorityMatrix"]
            CorrectionFunnel["CorrectionFunnel"]
        end

        subgraph DashboardComps["Dashboard"]
            BrandPresenceHero["BrandPresenceHero"]
            BrandHealthIndicator["BrandHealthIndicator"]
            BrandMoments["BrandMoments"]
            BrandGrowthOpportunities["BrandGrowthOpportunities"]
            MarketLandscape["MarketLandscape"]
            BrandStoryVisualizer["BrandStoryVisualizer"]
            AIPlatformGalaxy["AIPlatformGalaxy"]
        end

        subgraph OnboardingComps["Onboarding"]
            OnboardingWizard["OnboardingWizard"]
            NewOnboardingWizard["NewOnboardingWizard"]
            UrlAnalyzer["UrlAnalyzer"]
            ProfileReviewCards["ProfileReviewCards"]
            ProductIngestionTabs["ProductIngestionTabs"]
        end

        subgraph UIComps["UI Components"]
            ThemeToggle["ThemeToggle"]
            ThemeSelector["ThemeSelector"]
            MetricCard["MetricCard"]
            AlertBanner["AlertBanner"]
            OpportunityCard["OpportunityCard"]
        end

        subgraph ReviewComps["Review Queue"]
            ReviewQueueBanner["ReviewQueueBanner"]
            ReviewModal["ReviewModal"]
            FieldReviewCard["FieldReviewCard"]
        end
    end

    Layout --> AuthPages
    Layout --> Dashboard
    Layout --> Onboarding
    DashLayout --> DashboardComps
    DashLayout --> LayoutComps
    Login --> AuthComps
    Register --> AuthComps
    Brand360Page --> Brand360Comps
    AEOPage --> AEOComps
    DashHome --> DashboardComps
    Onboarding --> OnboardingComps
    ReviewQueue --> ReviewComps
```

---

## 5. Data Flow Diagram

```mermaid
flowchart LR
    subgraph Input["Data Sources"]
        URL["Website URL"]
        CSV["CSV Upload"]
        Manual["Manual Entry"]
        OAuth["OAuth Providers"]
    end

    subgraph Processing["Processing Layer"]
        subgraph Crawling["Web Crawling"]
            FC["Firecrawl Service"]
            WC["WebCrawler Fallback"]
        end

        subgraph AI["AI Processing"]
            BI["BrandIntelligence<br/>GPT-4o-mini"]
            VC["VibeCheckAgent"]
            CA["CompetitorAgent"]
            PE["PerceptionEvaluatorAgent"]
        end

        subgraph Queue["Job Queue"]
            Bull["Bull Queue"]
            Redis["Redis"]
        end
    end

    subgraph Storage["Data Storage"]
        MongoDB[(MongoDB)]

        subgraph Collections["Collections"]
            Users["users"]
            BrandProfiles["brand_profiles"]
            Brand360["brand360_profiles"]
            Products["products"]
            Scans["perception_scans"]
            Results["ai_perception_results"]
        end
    end

    subgraph Output["Output"]
        Dashboard["Dashboard UI"]
        Reports["Reports"]
        API["API Response"]
    end

    URL --> FC
    FC --> BI
    WC --> BI
    BI --> Brand360

    CSV --> Products
    Manual --> BrandProfiles

    OAuth --> Users

    VC --> Brand360
    CA --> Brand360

    Brand360 --> PE
    PE --> Results
    Results --> Scans

    MongoDB --> Dashboard
    MongoDB --> Reports
    MongoDB --> API

    Bull <--> Redis
    FC --> Bull
    BI --> Bull
```

---

## 6. Database Schema Diagram (ERD)

```mermaid
erDiagram
    User ||--o| BrandProfile : has
    User ||--o{ Session : has
    User ||--o{ Membership : has
    Organization ||--o{ Membership : has

    BrandProfile ||--o| BrandIdentity : has
    BrandProfile ||--o| MarketPosition : has
    BrandProfile ||--o{ CompetitorProfile : has
    BrandProfile ||--o{ ProductDetail : has
    BrandProfile ||--o{ BrandAsset : has
    BrandProfile ||--o{ UploadedDocument : has

    Brand360Profile ||--o| EntityHome : has
    Brand360Profile ||--o| OrganizationSchema : has
    Brand360Profile ||--o| BrandIdentityPrism : has
    Brand360Profile ||--o| BrandArchetype : has
    Brand360Profile ||--o| BrandVoiceProfile : has
    Brand360Profile ||--o| ClaimLocker : has
    Brand360Profile ||--o| CompetitorGraph : has
    Brand360Profile ||--o| RiskFactors : has
    Brand360Profile ||--o{ CustomerPersona : has
    Brand360Profile ||--o{ Product : has
    Brand360Profile ||--o{ GeneratedPrompt : has
    Brand360Profile ||--o{ PerceptionScan : has
    Brand360Profile ||--o{ AIPerceptionResult : has
    Brand360Profile ||--o{ PerceptionInsight : has
    Brand360Profile ||--o{ CorrectionWorkflow : has

    ClaimLocker ||--o{ Claim : contains
    CompetitorGraph ||--o{ Competitor : contains
    PerceptionScan ||--o{ AIPerceptionResult : has
    GeneratedPrompt ||--o{ AIPerceptionResult : has
    PerceptionInsight ||--o| CorrectionWorkflow : creates

    User {
        string id PK
        string email UK
        string password
        string accountType
        string subscription
        boolean mfaEnabled
        datetime createdAt
    }

    BrandProfile {
        string id PK
        string userId FK
        string brandName
        string domain
        string category
        string crawlingStatus
    }

    Brand360Profile {
        string id PK
        string organizationId FK
        string brandName
        int completionScore
        int entityHealthScore
        datetime lastAnalyzedAt
    }

    BrandIdentity {
        string id PK
        string brandId FK
        string mission
        string vision
        string[] values
        string brandStory
    }

    PerceptionScan {
        string id PK
        string brand360Id FK
        string status
        string[] platforms
        float overallScore
        string quadrantPosition
    }

    AIPerceptionResult {
        string id PK
        string promptId FK
        string brand360Id FK
        string platform
        string response
        float faithfulnessScore
        float shareOfVoice
        float hallucinationScore
    }

    GeneratedPrompt {
        string id PK
        string brand360Id FK
        string category
        string intent
        string template
        string renderedPrompt
    }
```

---

## 7. Infrastructure and Deployment Diagram

```mermaid
flowchart TB
    subgraph Developer["Developer Environment"]
        Code["Source Code"]
        Git["Git Repository"]
    end

    subgraph CI["CI/CD Pipeline"]
        CloudBuild["Cloud Build"]
        Tests["Run Tests"]
        Docker["Build Docker Image"]
    end

    subgraph Registry["Container Registry"]
        GCR["Google Container Registry"]
    end

    subgraph Production["Production Environment (GCP)"]
        subgraph CloudRunServices["Cloud Run"]
            VistralAI["VistralAI Service<br/>us-central1<br/>0-20 instances<br/>2Gi/2CPU"]
            FirecrawlSvc["Firecrawl Service<br/>us-central1<br/>0-10 instances<br/>1Gi/1CPU"]
        end

        subgraph Networking["Networking"]
            LB["Cloud Load Balancer"]
            VPCConn["VPC Connector"]
            Firewall["Firewall Rules"]
        end

        subgraph DataServices["Data Services"]
            Memorystore["Cloud Memorystore<br/>Redis 7.0<br/>1GB"]
            SecretMgr["Secret Manager"]
        end

        subgraph Monitoring["Monitoring & Logging"]
            CloudLog["Cloud Logging"]
            CloudMon["Cloud Monitoring"]
            Alerts["Alerting"]
        end
    end

    subgraph External["External Services"]
        MongoDB["MongoDB Atlas"]
        Anthropic["Anthropic API"]
        OpenAI["OpenAI API"]
    end

    subgraph LocalDev["Local Development"]
        DockerCompose["Docker Compose"]
        LocalMongo["MongoDB Container"]
        LocalRedis["Redis Container"]
        LocalFirecrawl["Firecrawl Container"]
    end

    Code --> Git
    Git --> CloudBuild
    CloudBuild --> Tests
    Tests --> Docker
    Docker --> GCR
    GCR --> VistralAI
    GCR --> FirecrawlSvc

    LB --> VistralAI
    VistralAI --> VPCConn
    VPCConn --> Memorystore
    VistralAI --> FirecrawlSvc
    VistralAI -.-> SecretMgr
    FirecrawlSvc -.-> SecretMgr

    VistralAI --> MongoDB
    VistralAI --> Anthropic
    VistralAI --> OpenAI

    VistralAI --> CloudLog
    CloudLog --> CloudMon
    CloudMon --> Alerts

    DockerCompose --> LocalMongo
    DockerCompose --> LocalRedis
    DockerCompose --> LocalFirecrawl
```

---

## Docker Services Diagram

```mermaid
flowchart LR
    subgraph MainCompose["docker-compose.yml"]
        Firecrawl["Firecrawl<br/>Port: 3002"]
        FCRedis["Redis<br/>Port: 6379"]
        Postgres["PostgreSQL<br/>Port: 5432"]
        Playwright["Playwright<br/>Port: 3001"]
    end

    subgraph MongoCompose["docker-compose.mongodb.yml"]
        MongoDB["MongoDB<br/>Port: 27017"]
        MongoExpress["Mongo Express<br/>Port: 8081"]
    end

    subgraph App["Next.js App"]
        NextApp["VistralAI<br/>Port: 3000"]
    end

    NextApp --> Firecrawl
    NextApp --> MongoDB
    NextApp --> FCRedis
    Firecrawl --> FCRedis
    Firecrawl --> Playwright
    MongoExpress --> MongoDB
```

---

## AEO Agent Flow Diagram

```mermaid
flowchart TB
    subgraph Input["User Input"]
        URL["Website URL"]
    end

    subgraph Orchestrator["MagicImportOrchestrator"]
        MIO["Coordinates Agent Flow"]
    end

    subgraph Agents["AEO Agents"]
        CA["CrawlerAgent<br/>Web crawling + Schema.org"]
        VCA["VibeCheckAgent<br/>Brand personality inference"]
        CMA["CompetitorAgent<br/>Competitor discovery"]
        PEA["PerceptionEvaluatorAgent<br/>LLM-as-a-Judge scoring"]
    end

    subgraph Processing["Data Processing"]
        BI["BrandIntelligence<br/>GPT-4o-mini"]
    end

    subgraph Output["Generated Output"]
        B360["Brand360Profile"]
        Prompts["Generated Prompts"]
        Metrics["Perception Metrics"]
    end

    subgraph MetricsDetail["Perception Metrics"]
        Faith["Faithfulness<br/>0-100"]
        SOV["Share of Voice<br/>0-100"]
        Sent["Sentiment<br/>-1 to 1"]
        Voice["Voice Alignment<br/>0-100"]
        Hall["Hallucination<br/>0-100"]
    end

    URL --> MIO
    MIO --> CA
    CA --> BI
    BI --> VCA
    VCA --> CMA
    CMA --> B360
    B360 --> Prompts
    Prompts --> PEA
    PEA --> Metrics
    Metrics --> MetricsDetail
```

---

## Quadrant Position Logic

```mermaid
quadrantChart
    title Brand Position Quadrant
    x-axis Low Visibility --> High Visibility
    y-axis Low Accuracy --> High Accuracy
    quadrant-1 DOMINANT
    quadrant-2 NICHE
    quadrant-3 INVISIBLE
    quadrant-4 VULNERABLE

    Brand A: [0.8, 0.85]
    Brand B: [0.3, 0.7]
    Brand C: [0.2, 0.3]
    Brand D: [0.75, 0.4]
```

---

## Usage Instructions

### Using with Claude
1. Copy the entire mermaid code block (including the triple backticks)
2. Paste directly into Claude conversation
3. Ask Claude to "render this diagram" or "show this diagram"
4. Claude will display the rendered diagram

### Using with Mermaid.live
1. Copy the code between the triple backticks (without the backticks)
2. Go to [mermaid.live](https://mermaid.live)
3. Paste in the editor - diagram renders automatically
4. Export as PNG, SVG, or share via link

### Using in Documentation
- GitHub/GitLab automatically render mermaid blocks in markdown
- VS Code with Mermaid extension previews diagrams
- Notion, Confluence support mermaid via plugins

---

## Payment & Subscription Flow Diagram

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant PF as PaymentForm
    participant API as Next.js API
    participant S as Stripe
    participant DB as MongoDB

    rect rgb(240, 248, 255)
        Note over U,DB: Setup Intent Flow
        U->>PF: Select plan & billing cycle
        PF->>API: POST /api/payments/stripe/create-setup-intent
        API->>S: createSetupIntent()
        S-->>API: clientSecret
        API-->>PF: { clientSecret }
        PF->>PF: Initialize PaymentElement
    end

    rect rgb(255, 248, 240)
        Note over U,DB: Payment Confirmation
        U->>PF: Enter payment details / Tap Apple Pay
        PF->>S: confirmSetup(elements)
        S-->>PF: setupIntent (succeeded)
    end

    rect rgb(248, 255, 240)
        Note over U,DB: Subscription Creation
        PF->>API: POST /api/subscription
        API->>S: createSubscription(trial: 15 days)
        S-->>API: subscription object
        API->>DB: Create UserSubscription
        DB-->>API: saved
        API-->>PF: { success: true }
        PF-->>U: Redirect to success page
    end
```

---

## Pricing Tier Comparison

```mermaid
graph TB
    subgraph Monitor["Monitor - $99/mo"]
        M1[1 Brand]
        M2[Weekly Updates]
        M3[3 Platforms]
        M4[Basic Dashboard]
    end

    subgraph Growth["Growth - $299/mo (Most Popular)"]
        G1[10 Brands]
        G2[Daily Updates]
        G3[All Platforms]
        G4[3 Competitors/Brand]
        G5[Real-Time Alerts]
    end

    subgraph Dominance["Dominance - $999/mo"]
        D1[50 Brands]
        D2[Real-time Updates]
        D3[All Platforms + Beta]
        D4[10 Competitors/Brand]
        D5[API Access]
        D6[White-Label Reports]
    end
```

---

## Unified Onboarding Flow Diagram

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant B as Browser
    participant API as Next.js API
    participant MI as MagicImportOrchestrator
    participant S as Stripe
    participant DB as MongoDB

    rect rgb(240, 248, 255)
        Note over U,DB: Step 1: Brand Setup
        U->>B: Enter website URL
        B->>API: POST /api/onboarding/brand
        API->>MI: Start Magic Import
        MI-->>B: WebSocket: progress updates
        MI->>DB: Create Brand360Profile
        MI-->>B: WebSocket: complete
        B->>API: Mark step 1 complete
    end

    rect rgb(255, 248, 240)
        Note over U,DB: Step 2: Choose Plan
        U->>B: Select tier + billing cycle
        B->>API: POST /api/onboarding/plan
        API->>DB: Save plan selection
        API-->>B: Step 2 complete
    end

    rect rgb(248, 255, 240)
        Note over U,DB: Step 3: Payment
        B->>API: POST /api/payments/stripe/create-setup-intent
        API->>S: createSetupIntent()
        S-->>B: clientSecret
        U->>B: Enter payment / Apple Pay
        B->>S: confirmSetup(elements)
        S-->>B: setupIntent succeeded
        B->>API: POST /api/onboarding/payment
        API->>S: createSubscription(trial: 15 days)
        S-->>API: subscription object
        API->>DB: Create subscription record
        API-->>B: Step 3 complete
    end

    rect rgb(255, 240, 248)
        Note over U,DB: Step 4: First Scan (Optional)
        U->>B: Click "Start Scan" or "Skip"
        alt Start Scan
            B->>API: POST /api/aeo/perception-scan
            API-->>B: Scan started
        else Skip
            B->>API: Skip step 4
        end
    end

    rect rgb(248, 240, 255)
        Note over U,DB: Step 5: Complete
        B->>API: POST /api/onboarding/complete
        API->>DB: Mark onboarding complete
        API-->>B: Redirect to dashboard
    end
```

---

## Subscription State Machine

```mermaid
stateDiagram-v2
    [*] --> trialing: User signs up
    trialing --> active: Trial ends + Payment succeeds
    trialing --> canceled: User cancels during trial
    active --> past_due: Payment fails
    active --> canceled: User cancels
    past_due --> active: Payment succeeds
    past_due --> canceled: Grace period expires
    active --> paused: User pauses
    paused --> active: User resumes
    canceled --> [*]
```

---

**Last Updated**: January 2026
**Version**: 1.1
