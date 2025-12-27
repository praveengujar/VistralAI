# VistralAI Diagram Generation Prompts for Claude

Copy any section below and paste it into Claude to generate a visual diagram.

**Last Updated:** December 27, 2024 (v2.0 - includes Redis, WebSocket, React Query, API middleware)

---

## 1. API Route Diagram

**Prompt for Claude:**

```
Create a visual diagram showing the API route structure for VistralAI. Use a tree/hierarchical layout with color-coded groups.

API Routes Structure (43 endpoints):

MIDDLEWARE LAYER (applied to all routes):
- withErrorHandler() - Standardized JSON error responses
- withAuth() - Session validation wrapper
- withRateLimit() - Rate limiting (100 req/min default, configurable)
- successResponse() / errorResponse() - Response helpers

AUTHENTICATION (Blue):
- /api/auth/[...nextauth] - NextAuth handler (credentials, OAuth)
- /api/auth/register - User registration with validation

BRAND 360 (Green):
- /api/brand-360 - GET: Complete brand data, POST: Create profile
- /api/brand-360/identity - Brand identity CRUD (mission, vision, values)
- /api/brand-360/products - Products CRUD with pricing
- /api/brand-360/competitors - Competitors CRUD with threat levels
- /api/brand-360/market-position - Market position CRUD
- /api/brand-360/analyze-website - AI website analysis (GPT-4o-mini)
- /api/brand-360/upload - Document upload & processing
- /api/brand-360/catalog/upload - Product catalog CSV/Excel import

AEO ENGINE (Purple):
- /api/aeo/magic-import - One-click brand extraction from URL
- /api/aeo/perception-scan - POST: Start scan, GET: List scans
- /api/aeo/perception-scan/[scanId] - GET: Scan results with metrics
- /api/aeo/insights - Perception insights CRUD
- /api/aeo/insights/[insightId] - Single insight details
- /api/aeo/insights/[insightId]/dismiss - Dismiss with reason
- /api/aeo/corrections - Correction workflow CRUD
- /api/aeo/corrections/[workflowId] - Workflow details
- /api/aeo/corrections/[workflowId]/approve - Approve fix
- /api/aeo/corrections/[workflowId]/verify - Verify post-fix improvement
- /api/aeo/prompts - Prompt CRUD (5 categories)
- /api/aeo/prompts/generate - AI prompt generation
- /api/aeo/reports/summary - Dashboard summary report
- /api/aeo/reports/[reportId] - Specific report
- /api/aeo/reports/export - Export to PDF/CSV
- /api/aeo/compare-scans - Compare two scans side-by-side

USER (Orange):
- /api/user/profile - User profile CRUD
- /api/user/password - Password change with validation
- /api/user/sessions - Active session management
- /api/user/mfa - MFA status check
- /api/user/mfa/setup - Generate TOTP secret + QR code
- /api/user/mfa/verify - Verify TOTP code

ONBOARDING (Teal):
- /api/onboarding/analyze - Website URL analysis
- /api/onboarding/status - Onboarding completion status
- /api/onboarding/confirm - Confirm extracted brand data
- /api/onboarding/review-queue - Items needing human review
- /api/onboarding/review-queue/approve - Approve/reject items
- /api/onboarding/products/upload - Bulk product upload

ADMIN (Red):
- /api/admin/queue-stats - Job queue statistics
- /api/admin/review-queue - Admin review dashboard

OTHER (Gray):
- /api/health - Health check endpoint
- /api/brand-profile - Legacy brand profile
- /api/reports/brand-story - Brand story narrative report
- /api/debug/db-dump - Database debug (dev only)

CACHING LAYER:
- Redis caching on read-heavy endpoints (5 min TTL default)
- Cache invalidation on mutations
- In-memory fallback when Redis unavailable

Show the Client connecting to all route groups. Make it clean and professional with the middleware layer shown as a horizontal bar at the top.
```

---

## 2. Architecture Diagram

**Prompt for Claude:**

```
Create a system architecture diagram for VistralAI showing the following components and their connections:

EXTERNAL USERS:
- Browser Client (connects via HTTPS)
- WebSocket Client (real-time updates)

FRONTEND LAYER:
- Next.js 14 App (App Router, React 18)
- React Query (client-side cache, staleTime: 5 min)
- Socket.io Client (auto-reconnect, room subscriptions)
- Lazy-loaded components (QuadrantChart, RadarChart, Galaxy)
- Performance hooks (useDebouncedValue, useThrottledCallback)
- Theme system (Morning/Evening/Night modes)

API LAYER:
- Next.js API Routes (43 endpoints)
- API Middleware Stack:
  - withErrorHandler (standardized responses)
  - withAuth (session validation)
  - withRateLimit (100 req/min, token bucket)
- Socket.io Server (room-based subscriptions per brand360Id)

SERVICES LAYER:
- BrandIntelligence (GPT-4o-mini synthesis)
- WebCrawler (Firecrawl integration)
- MagicImportOrchestrator (agent coordination)
- CrawlerAgent (web + Schema.org extraction)
- VibeCheckAgent (brand personality inference)
- CompetitorAgent (competitor discovery)
- PerceptionEvaluatorAgent (LLM-as-a-Judge scoring)

CACHING LAYER:
- Redis 7 (distributed cache, 256MB, LRU eviction)
- Cache key factory (cacheKeys.brand360, cacheKeys.perception, etc.)
- TTL presets (short: 1min, standard: 5min, medium: 15min, long: 1hr)
- In-memory fallback (Map-based, auto-cleanup)
- React Query (client-side, gcTime: 30min)

DATABASE LAYER:
- MongoDB 7.0 (replica set for Prisma transactions)
- Prisma ORM with database adapter pattern
- Composite indexes for query optimization:
  - [brand360Id, category, isActive]
  - [brand360Id, status, priority]
  - [scanId, platform]
- Collections: users, brand_profiles, brand360_profiles, perception_scans, etc.

GOOGLE CLOUD PLATFORM:
- Cloud Run (containerized Next.js, standalone output)
- Cloud Build (CI/CD pipeline)
- Secret Manager (API keys, database URLs)
- Cloud Logging & Monitoring
- Container Registry (GCR)

EXTERNAL SERVICES:
- OpenAI API (GPT-4o-mini, GPT-4o)
- Firecrawl API (web crawling)
- Google Knowledge Graph API (entity verification)
- MongoDB Atlas (managed database)

REAL-TIME EVENTS:
- scan:started, scan:progress, scan:complete, scan:error
- insight:new, correction:update

Use a layered architecture style. Show WebSocket connections with dashed lines. Use subgraphs for each layer.
```

---

## 3. Auth Flow Diagram

**Prompt for Claude:**

```
Create a sequence diagram showing the authentication flows for VistralAI:

PARTICIPANTS:
- User
- Browser
- Next.js App
- NextAuth.js
- API Middleware
- MongoDB
- Redis (session cache)
- Audit Log

FLOW 1 - CREDENTIALS LOGIN:
1. User enters email/password in Browser
2. Browser sends POST /api/auth/signin to Next.js
3. Next.js forwards to NextAuth.js authorize()
4. NextAuth.js calls getUserByEmail() on MongoDB
5. MongoDB returns User record
6. NextAuth.js uses bcrypt.compare() for password
7. IF password valid AND mfaEnabled:
   - Return partial session + MFA challenge
   - Go to FLOW 2
8. IF password valid AND !mfaEnabled:
   - Generate JWT token (1 hour expiry)
   - Cache session in Redis (15 min TTL)
   - Update lastLoginAt in MongoDB
   - Log signin event to Audit Log
   - Return HTTP-only cookie to Browser
   - Browser redirects User to /dashboard
9. IF password invalid:
   - Log failed attempt to Audit Log
   - Return error to Browser
   - Browser shows error to User

FLOW 2 - MFA VERIFICATION:
1. User enters 6-digit TOTP code
2. Browser sends POST /api/user/mfa/verify
3. API validates with speakeasy.totp.verify()
4. IF valid:
   - Upgrade session to full access
   - Cache upgraded session in Redis
   - Update lastLoginAt in MongoDB
   - Log MFA success to Audit Log
   - Return success, redirect to dashboard
5. IF invalid:
   - Log MFA failure to Audit Log
   - Return error, allow retry (3 attempts)

FLOW 3 - SESSION VALIDATION (every request):
1. User accesses protected route
2. Browser sends request with cookie
3. Next.js middleware intercepts
4. Check Redis for cached session (fast path)
5. IF cache hit: validate and proceed
6. IF cache miss: validate JWT via NextAuth.js
7. NextAuth.js jwt callback verifies token
8. Check user still exists in MongoDB
9. IF valid:
   - Cache session in Redis
   - Return session data and protected content
10. IF invalid:
    - Clear Redis cache
    - Redirect to /auth/login

Use different colors for each flow: Blue for credentials, Purple for MFA, Green for session.
Show error paths in red.
```

---

## 4. Component Hierarchy Diagram

**Prompt for Claude:**

```
Create a component hierarchy diagram for VistralAI React application:

APP ROUTER (Root):
├── RootLayout (app/layout.tsx)
│   ├── QueryProvider (@tanstack/react-query)
│   │   └── ThemeProvider (Morning/Evening/Night)
│   │       └── SessionProvider (NextAuth)
│   │           └── Children
│
├── AUTH PAGES (/auth/*):
│   ├── LoginPage → AuthForm (credentials + OAuth)
│   ├── RegisterPage → AuthForm
│   └── ErrorPage
│
├── DASHBOARD PAGES (/dashboard/*):
│   ├── DashboardLayout (components/layout/)
│   │   ├── Sidebar with Navigation
│   │   ├── TopBar with UserMenu
│   │   └── Main Content Area
│   │
│   ├── DashboardPage (/dashboard) - Home
│   │   ├── BrandPresenceHero
│   │   ├── BrandHealthIndicator
│   │   ├── BrandMoments
│   │   ├── BrandGrowthOpportunities
│   │   ├── MarketLandscape [LAZY]
│   │   ├── BrandStoryVisualizer [LAZY]
│   │   └── AIPlatformGalaxy [LAZY]
│   │
│   ├── Brand360Page (/dashboard/brand-profile)
│   │   ├── WebsiteAnalyzer
│   │   ├── BrandStoryCanvas
│   │   ├── BrandOfferingsShowcase
│   │   ├── ProfileStrengthMeter
│   │   ├── DocumentUpload
│   │   └── ProductCatalogConnector
│   │
│   ├── AEOPage (/dashboard/aeo)
│   │   ├── QuadrantChart [LAZY] - Position visualization
│   │   ├── MetricsRadarChart [LAZY] - 5-axis radar
│   │   ├── PerceptionScoreCard
│   │   ├── PlatformComparisonChart
│   │   ├── ScoreTrendChart
│   │   ├── InsightsPriorityMatrix
│   │   └── CorrectionFunnel
│   │
│   ├── ScanDetailPage (/dashboard/aeo/scan/[scanId])
│   │   ├── useScanSocket hook (real-time progress)
│   │   ├── ScanProgressBar
│   │   ├── PlatformResults
│   │   └── MetricsBreakdown
│   │
│   ├── NewScanPage (/dashboard/aeo/scan/new)
│   │   ├── PlatformSelector
│   │   └── ScanConfiguration
│   │
│   ├── ReviewQueuePage (/dashboard/review-queue)
│   │   ├── ReviewQueueBanner
│   │   ├── ReviewModal
│   │   └── FieldReviewCard
│   │
│   ├── SettingsPages (/dashboard/settings/*)
│   │   ├── ProfileSettings
│   │   ├── SecuritySettings (MFA setup)
│   │   ├── AppearanceSettings (ThemeSelector)
│   │   └── OrganizationSettings
│   │
│   └── ReportPage (/dashboard/report)
│       └── BrandStoryReport
│
└── ONBOARDING PAGE (/onboarding):
    ├── NewOnboardingWizard
    ├── UrlAnalyzer
    ├── ProfileReviewCards
    └── ProductIngestionTabs

SHARED UI COMPONENTS (components/ui/):
- Button, Card, Input, Modal, Tabs
- DataTable, Toast, AlertBanner
- MetricCard, OpportunityCard

CHART COMPONENTS (components/aeo/):
- QuadrantChart (Recharts)
- MetricsRadarChart (Recharts)

HOOKS (lib/hooks/):
- useDebouncedValue, useDebouncedCallback
- useThrottledCallback
- useIntersectionObserver
- useLocalStorage

QUERY HOOKS (lib/query/hooks.ts):
- useBrand360Profile
- useAEOPrompts, useAEOScans
- useAEOScan (with polling for in-progress)
- useAEOInsights, useAEOCorrections

SOCKET HOOKS (lib/realtime/socket-client.ts):
- useSocket (base hook)
- useScanSocket (scan progress)
- useInsightSocket (new insights)

Mark [LAZY] for lazy-loaded components. Use a tree structure with color-coded sections.
```

---

## 5. Data Flow Diagram

**Prompt for Claude:**

```
Create a data flow diagram for VistralAI showing how data moves through the system. Use left-to-right flow.

DATA SOURCES (Left):
- Website URL (user input)
- CSV/Excel Upload (file)
- Manual Entry (forms)
- OAuth Providers (Google, GitHub)

PROCESSING LAYER (Center):

  Pipeline 1 - Brand Import (Magic Import):
  Website URL
  → WebCrawler (Firecrawl API)
  → Raw HTML + Schema.org data
  → CrawlerAgent (extract structured data)
  → VibeCheckAgent (infer brand personality)
  → CompetitorAgent (discover competitors)
  → BrandIntelligence (GPT-4o-mini synthesis)
  → Brand360Profile
  → Cache Invalidation (Redis + React Query)
  → WebSocket emit (to connected clients)
  → Dashboard UI refresh

  Pipeline 2 - Perception Scan:
  Brand360Profile
  → Prompt Generation (5 categories)
  → GeneratedPrompt[] stored
  → PerceptionEvaluatorAgent
  → Query AI Platforms (Claude, ChatGPT, Gemini, Perplexity)
  → LLM-as-a-Judge Scoring
  → AIPerceptionResult[] stored
  → WebSocket emit (scan:progress)
  → Insight Generation
  → PerceptionInsight[] stored
  → WebSocket emit (scan:complete, insight:new)
  → Dashboard updates via useScanSocket

  Pipeline 3 - Correction Workflow:
  PerceptionInsight (critical)
  → CorrectionWorkflow created
  → Generate fixes (Schema.org, FAQ, content)
  → Human Review Queue
  → Approve/Reject
  → Implementation tracking
  → Verification scan
  → Score comparison (pre/post)
  → WebSocket emit (correction:update)

CACHING LAYER (parallel flow):
- Request arrives at API
- Check Redis cache (cacheGet)
- IF hit: return cached data (fast path)
- IF miss: execute query → cache result (cacheSet with TTL)
- Mutations invalidate cache (cacheDeletePattern)
- React Query manages client cache (stale-while-revalidate)

DATA STORAGE (Center-Right):
  MongoDB Collections:
  - users, sessions, audit_logs
  - brand_profiles, brand_identities, market_positions
  - brand360_profiles (main AEO entity)
  - entity_homes, organization_schemas
  - brand_identity_prisms, brand_archetypes
  - generated_prompts, perception_scans
  - ai_perception_results, perception_insights
  - correction_workflows

OUTPUT (Right):
- Dashboard UI (React components)
- Real-time updates (WebSocket)
- Reports (PDF, CSV export)
- API Responses (JSON)

Show cache hit/miss paths with different line styles (solid vs dashed).
Show WebSocket events with dotted lines.
```

---

## 6. Database Schema Diagram (ERD)

**Prompt for Claude:**

```
Create an Entity Relationship Diagram (ERD) for VistralAI MongoDB database:

CORE ENTITIES:

User (1) -----> (0..1) BrandProfile
User (1) -----> (0..N) Session [@@index: userId, expires]
User (1) -----> (0..N) Membership

Organization (1) -----> (0..N) Membership
Membership: @@unique([userId, organizationId])

AuditLog [@@index: userId+createdAt, organizationId+createdAt, action+createdAt]

BrandProfile (1) -----> (0..1) BrandIdentity
BrandProfile (1) -----> (0..1) MarketPosition
BrandProfile (1) -----> (0..N) CompetitorProfile [@@index: brandId]
BrandProfile (1) -----> (0..N) ProductDetail [@@index: brandId]
BrandProfile (1) -----> (0..N) BrandAsset [@@index: brandId]
BrandProfile (1) -----> (0..N) UploadedDocument [@@index: brandId]

AEO ENGINE ENTITIES:

Brand360Profile [@@index: organizationId]
Brand360Profile (1) -----> (0..1) EntityHome
Brand360Profile (1) -----> (0..1) OrganizationSchema
Brand360Profile (1) -----> (0..1) BrandIdentityPrism
Brand360Profile (1) -----> (0..1) BrandArchetype
Brand360Profile (1) -----> (0..1) BrandVoiceProfile
Brand360Profile (1) -----> (0..1) ClaimLocker
Brand360Profile (1) -----> (0..1) CompetitorGraph
Brand360Profile (1) -----> (0..1) RiskFactors
Brand360Profile (1) -----> (0..N) CustomerPersona [@@index: brand360Id]
Brand360Profile (1) -----> (0..N) Product [@@index: brand360Id]
Brand360Profile (1) -----> (0..N) GeneratedPrompt
Brand360Profile (1) -----> (0..N) PerceptionScan
Brand360Profile (1) -----> (0..N) AIPerceptionResult
Brand360Profile (1) -----> (0..N) PerceptionInsight
Brand360Profile (1) -----> (0..N) CorrectionWorkflow

ClaimLocker (1) -----> (0..N) Claim [@@index: claimLockerId]
CompetitorGraph (1) -----> (0..N) Competitor [@@index: competitorGraphId]

GeneratedPrompt [@@index: brand360Id, category, [brand360Id+category+isActive]]
PerceptionScan [@@index: brand360Id, status, [brand360Id+status]]
AIPerceptionResult [@@index: brand360Id, promptId, platform, [brand360Id+platform], [scanId+platform]]
PerceptionInsight [@@index: brand360Id, category, priority, [brand360Id+status], [brand360Id+status+priority]]
CorrectionWorkflow [@@index: brand360Id]

PerceptionScan (1) -----> (0..N) AIPerceptionResult
GeneratedPrompt (1) -----> (0..N) AIPerceptionResult
PerceptionInsight (1) -----> (0..1) CorrectionWorkflow

KEY FIELDS:

User: id, email, password (hashed), accountType (brand|agency|enterprise), subscription (free|pro|enterprise), mfaEnabled, mfaSecret

BrandProfile: id, userId (unique FK), brandName, domain, category, crawlingStatus

Brand360Profile: id, organizationId (FK to BrandProfile), brandName, completionScore (0-100), entityHealthScore (0-100)

GeneratedPrompt: id, brand360Id, category (navigational|functional|comparative|voice|adversarial), intent, template, renderedPrompt, isActive

PerceptionScan: id, brand360Id, status (pending|running|completed|failed), platforms[], promptCount, completedCount, overallScore, quadrantPosition

AIPerceptionResult: id, promptId, brand360Id, scanId, platform (claude|chatgpt|gemini|perplexity), faithfulnessScore, shareOfVoice, sentimentScore, voiceAlignmentScore, hallucinationScore

PerceptionInsight: id, brand360Id, category (visibility|accuracy|sentiment|competitive|voice|hallucination), priority (critical|high|medium|low), status (open|in_progress|resolved|dismissed)

CorrectionWorkflow: id, brand360Id, insightId, problemType, status (suggested|approved|implemented|verified), schemaOrgFix, faqPageSuggestion

Use crow's foot notation. Group related entities. Mark composite indexes with double underline.
```

---

## 7. Infrastructure and Deployment Diagram

**Prompt for Claude:**

```
Create an infrastructure and deployment diagram for VistralAI:

DEVELOPER ENVIRONMENT (Left):
- Source Code (TypeScript, Next.js 14)
- Git Repository (GitHub)
  - main branch (production)
  - feature/* branches
  - backup/* branches (pre-optimization snapshots)

CI/CD PIPELINE (Cloud Build):
1. Push to main triggers build
2. npm ci (install dependencies)
3. npm run type-check (TypeScript validation)
4. npm run lint (ESLint)
5. npm test (Jest tests)
6. npm run build (Next.js standalone output)
7. docker build (containerize)
8. docker push to Container Registry (GCR)
9. gcloud run deploy (update Cloud Run service)

PRODUCTION - Google Cloud Platform (Center):

  Cloud Run Service (VistralAI):
  - Region: us-central1
  - Min instances: 0, Max: 10
  - Memory: 512MB-1GB
  - CPU: 1-2 vCPU
  - Concurrency: 80 requests
  - Container: Next.js standalone
  - Auto-scaling on CPU/requests

  Networking:
  - Cloud Load Balancer (HTTPS termination)
  - VPC Connector (for Memorystore)
  - Custom domain + SSL

  Caching:
  - Cloud Memorystore Redis 7.0 (1GB)
  - Or external Redis Cloud

  Secrets:
  - Secret Manager stores:
    - DATABASE_URL
    - NEXTAUTH_SECRET
    - OPENAI_API_KEY
    - FIRECRAWL_API_KEY
    - REDIS_URL

  Observability:
  - Cloud Logging (application logs)
  - Cloud Monitoring (metrics, dashboards)
  - Alerting policies (error rate, latency)

EXTERNAL SERVICES (Right):
- MongoDB Atlas (database, replica set)
- OpenAI API (GPT-4o-mini, GPT-4o)
- Firecrawl API (web crawling)
- Google Knowledge Graph API

LOCAL DEVELOPMENT (Bottom):
Docker Compose Stack:
┌─────────────────────────────────────────────┐
│ docker-compose.mongodb.yml:                 │
│ - MongoDB 7.0 (27017) - replica set rs0     │
│ - Mongo Express (8081) - web UI             │
│ - Redis 7-alpine (6379) - caching           │
│ - Redis Commander (8082) - web UI           │
├─────────────────────────────────────────────┤
│ docker-compose.yml (optional):              │
│ - Firecrawl (3002)                          │
│ - Playwright (3001)                         │
│ - PostgreSQL (5432) - alt database          │
├─────────────────────────────────────────────┤
│ Next.js Dev Server (3000)                   │
│ npm run dev                                 │
└─────────────────────────────────────────────┘

DEPLOYMENT COMMANDS:
# Start local dev stack
docker-compose -f docker-compose.mongodb.yml up -d
npm run dev

# Deploy to production
git push origin main  # triggers Cloud Build

Show deployment flow with arrows. Color-code GCP services (blue) vs external (orange) vs local (green).
```

---

## 8. AEO Agent Flow Diagram

**Prompt for Claude:**

```
Create a flow diagram showing the AEO (AI Engine Optimization) agent workflow with metrics:

INPUT:
- Website URL (from user via /api/aeo/magic-import)

ORCHESTRATOR:
- MagicImportOrchestrator (lib/services/agents/)
- Coordinates agent sequence
- Handles errors and retries

AGENT SEQUENCE:

1. CrawlerAgent
   ├── Input: Website URL
   ├── Process:
   │   ├── Call Firecrawl API (crawl up to 20 pages)
   │   ├── Extract Schema.org markup (JSON-LD, microdata)
   │   ├── Parse meta tags, headings, content
   │   ├── Capture social media links
   │   └── Extract contact information
   ├── Output: CrawlResult {pages[], schemaOrg{}, socialLinks[]}
   └── Metrics: pages_crawled, schema_types_found

2. VibeCheckAgent
   ├── Input: CrawlResult
   ├── Process (GPT-4o-mini):
   │   ├── Analyze brand voice and tone
   │   ├── Infer Kapferer prism (6 facets)
   │   ├── Determine brand archetype (12 Jungian)
   │   ├── Extract personality traits (Big 5)
   │   └── Identify voice spectrums
   ├── Output: BrandVibe {archetype, prism, voice, personality}
   └── Metrics: archetype_confidence (0-100)

3. CompetitorAgent
   ├── Input: Brand name, industry, domain
   ├── Process (GPT-4o):
   │   ├── Search for direct competitors
   │   ├── Identify indirect competitors
   │   ├── Find aspirational competitors
   │   ├── Classify threat levels
   │   └── Extract strengths/weaknesses
   ├── Output: Competitor[] {name, type, threatLevel, strengths[], weaknesses[]}
   └── Metrics: competitors_found (count by type)

4. BrandIntelligence (Synthesis)
   ├── Input: All agent outputs
   ├── Process (GPT-4o-mini):
   │   ├── Synthesize into Brand360Profile
   │   ├── Generate Organization Schema (JSON-LD)
   │   ├── Create customer personas
   │   ├── Build claim locker
   │   └── Calculate completion score
   ├── Output: Complete Brand360Profile
   └── Metrics: completion_score (0-100), entity_health_score (0-100)

5. Save to Database
   ├── Store Brand360Profile + related entities
   ├── Invalidate Redis cache (cacheDeletePattern)
   └── Emit WebSocket: brand360:created

PERCEPTION SCAN FLOW (separate trigger):

6. Prompt Generation
   ├── Input: Brand360Profile
   ├── Generate prompts in 5 categories:
   │   ├── Navigational (The Who) - Brand discovery
   │   ├── Functional (The How) - Features, capabilities
   │   ├── Comparative (The Which) - vs competitors
   │   ├── Voice (The Vibe) - Tone, personality
   │   └── Adversarial (The Risk) - Edge cases, attacks
   ├── Output: GeneratedPrompt[] (50-100 prompts)
   └── Store in database

7. PerceptionEvaluatorAgent (LLM-as-a-Judge)
   ├── Input: GeneratedPrompt[], Brand360Profile
   ├── For each prompt × platform:
   │   ├── Query AI platform (Claude, ChatGPT, Gemini, Perplexity)
   │   ├── Capture response + timing + tokens
   │   ├── Emit WebSocket: scan:progress {percentage}
   │   └── Score with LLM-as-a-Judge:
   │       ├── Faithfulness (0-100): Accuracy to ground truth
   │       ├── Share of Voice (0-100): Brand visibility/position
   │       ├── Sentiment (-1 to 1): Overall sentiment
   │       ├── Voice Alignment (0-100): Matches brand tone
   │       └── Hallucination (0-100): 100 = no hallucinations
   ├── Output: AIPerceptionResult[]
   └── Store in database

8. Insight Generation
   ├── Analyze patterns across results
   ├── Generate PerceptionInsight[] by category
   ├── Prioritize: critical > high > medium > low
   └── Emit WebSocket: scan:complete, insight:new

QUADRANT CALCULATION:
Accuracy = avg(faithfulness, 100 - (100 - hallucinationScore))
Visibility = avg(shareOfVoice, brandPosition adjustment)

Position:
┌────────────────┬────────────────┐
│ NICHE (blue)   │ DOMINANT (green)│
│ High Accuracy  │ High Accuracy   │
│ Low Visibility │ High Visibility │
├────────────────┼────────────────┤
│ INVISIBLE (red)│ VULNERABLE      │
│ Low Accuracy   │ (amber)         │
│ Low Visibility │ Low Accuracy    │
│                │ High Visibility │
└────────────────┴────────────────┘

Show as vertical flow with agents as distinct boxes. Include WebSocket event labels.
```

---

## 9. Docker Services Diagram

**Prompt for Claude:**

```
Create a diagram showing Docker services for VistralAI local development:

DOCKER COMPOSE FILES:

docker-compose.mongodb.yml (Primary for Development):
┌─────────────────────────────────────────────────────────────┐
│ NETWORK: vistralai-mongodb-network (bridge)                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ MongoDB (vistralai-mongodb)                             │ │
│ │ Image: mongo:7.0                                        │ │
│ │ Port: 27017:27017                                       │ │
│ │ Config:                                                 │ │
│ │   - Replica Set: rs0 (single node for Prisma txns)      │ │
│ │   - Auth: vistralai / vistralai_dev_password            │ │
│ │   - Keyfile: /etc/mongo-keyfile                         │ │
│ │ Volumes:                                                │ │
│ │   - mongodb_data:/data/db                               │ │
│ │   - mongodb_config:/data/configdb                       │ │
│ │ Health: rs.status() + auto-init replica set             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                           │                                 │
│                           ▼                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Mongo Express (vistralai-mongo-express)                 │ │
│ │ Image: mongo-express:1.0                                │ │
│ │ Port: 8081:8081                                         │ │
│ │ Purpose: Web UI for MongoDB                             │ │
│ │ Depends: mongodb (healthy)                              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Redis (vistralai-redis)                                 │ │
│ │ Image: redis:7-alpine                                   │ │
│ │ Port: 6379:6379                                         │ │
│ │ Config:                                                 │ │
│ │   - appendonly yes (persistence)                        │ │
│ │   - maxmemory 256mb                                     │ │
│ │   - maxmemory-policy allkeys-lru                        │ │
│ │ Volume: redis_data:/data                                │ │
│ │ Health: redis-cli ping                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                           │                                 │
│                           ▼                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Redis Commander (vistralai-redis-commander)             │ │
│ │ Image: rediscommander/redis-commander:latest            │ │
│ │ Port: 8082:8081                                         │ │
│ │ Purpose: Web UI for Redis                               │ │
│ │ Depends: redis (healthy)                                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘

docker-compose.yml (Optional - Firecrawl Stack):
┌─────────────────────────────────────────────────────────────┐
│ Firecrawl           │ Port: 3002 │ Web crawling service     │
│ Playwright          │ Port: 3001 │ Browser automation       │
│ PostgreSQL          │ Port: 5432 │ Alt DB (DATABASE_MODE)   │
│ Redis               │ Port: 6379 │ Job queue backend        │
└─────────────────────────────────────────────────────────────┘

Next.js Application (Host Machine):
┌─────────────────────────────────────────────────────────────┐
│ VistralAI (npm run dev)                                     │
│ Port: 3000                                                  │
│ Env:                                                        │
│   DATABASE_URL=mongodb://vistralai:vistralai_dev_password   │
│              @localhost:27017/vistralai?authSource=admin    │
│              &replicaSet=rs0                                │
│   REDIS_URL=redis://localhost:6379                          │
│   DATABASE_MODE=mongodb                                     │
└─────────────────────────────────────────────────────────────┘

CONNECTIONS (show with arrows):
- VistralAI (3000) → MongoDB (27017) - data persistence
- VistralAI (3000) → Redis (6379) - caching + sessions
- VistralAI (3000) → Firecrawl (3002) - web crawling [optional]
- Mongo Express (8081) → MongoDB (27017) - admin UI
- Redis Commander (8082) → Redis (6379) - admin UI
- Firecrawl (3002) → Playwright (3001) - browser automation
- Firecrawl (3002) → Redis (6379) - job queue

STARTUP COMMANDS:
# Start MongoDB + Redis stack
docker-compose -f docker-compose.mongodb.yml up -d

# Start Firecrawl stack (optional)
docker-compose up -d

# Start Next.js dev server
npm run dev

# Access points:
# - App: http://localhost:3000
# - Mongo Express: http://localhost:8081
# - Redis Commander: http://localhost:8082
# - Firecrawl API: http://localhost:3002

Color coding:
- Blue: Databases (MongoDB, PostgreSQL)
- Green: Caches (Redis)
- Orange: Admin UIs (Mongo Express, Redis Commander)
- Purple: Services (Firecrawl, Playwright)
- Gray: Application (Next.js)
```

---

## Quick Reference - Quadrant Chart

**Prompt for Claude:**

```
Create a 2x2 quadrant chart for brand positioning:

X-AXIS: Visibility (Low to High) - Share of Voice + Brand Position
Y-AXIS: Accuracy (Low to High) - Faithfulness + Hallucination Score

QUADRANTS:
┌─────────────────────┬─────────────────────┐
│                     │                     │
│       NICHE         │      DOMINANT       │
│     (Blue #3B82F6)  │    (Green #22C55E)  │
│                     │                     │
│  High Accuracy      │  High Accuracy      │
│  Low Visibility     │  High Visibility    │
│                     │                     │
│  "Hidden gem -      │  "Category leader - │
│   needs promotion"  │   maintain position"│
│                     │                     │
├─────────────────────┼─────────────────────┤
│                     │                     │
│     INVISIBLE       │     VULNERABLE      │
│     (Red #EF4444)   │   (Amber #F59E0B)   │
│                     │                     │
│  Low Accuracy       │  Low Accuracy       │
│  Low Visibility     │  High Visibility    │
│                     │                     │
│  "Critical - needs  │  "Dangerous -       │
│   full overhaul"    │   fix misinformation"│
│                     │                     │
└─────────────────────┴─────────────────────┘

Sample brand positions (show as dots):
- Brand A: (0.82, 0.88) - Dominant quadrant
- Brand B: (0.25, 0.75) - Niche quadrant
- Brand C: (0.18, 0.22) - Invisible quadrant
- Brand D: (0.78, 0.35) - Vulnerable quadrant
- Competitor 1: (0.65, 0.70) - Dominant edge
- Competitor 2: (0.55, 0.45) - Center

Add a legend showing:
- Circle size = Overall score
- Color intensity = Confidence level
- Crosshairs at (0.5, 0.5) marking the center
```

---

## Usage Instructions

1. Copy the prompt text (everything inside the code block after "Prompt for Claude:")
2. Paste into a new Claude conversation
3. Claude will generate a visual diagram based on the description
4. You can ask Claude to modify colors, layout, or add/remove elements

**Tips:**
- Ask for "SVG format" if you want code you can edit
- Ask for "clean/minimal style" for presentation-ready diagrams
- Request specific colors by name or hex code
- Ask to "add a legend" for complex diagrams
- For Mermaid output, say "Generate as Mermaid syntax"

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2024-12-27 | Added Redis caching layer, WebSocket support (Socket.io), React Query hooks, API middleware (rate limiting, error handling), composite database indexes, split database operations, lazy loading, performance hooks |
| 1.0 | 2024-12-26 | Initial architecture diagrams |
