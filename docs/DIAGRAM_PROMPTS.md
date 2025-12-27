# VistralAI Diagram Generation Prompts for Claude

Copy any section below and paste it into Claude to generate a visual diagram.

---

## 1. API Route Diagram

**Prompt for Claude:**

```
Create a visual diagram showing the API route structure for VistralAI. Use a tree/hierarchical layout with color-coded groups.

API Routes Structure:

AUTHENTICATION (Blue):
- /api/auth/[...nextauth] - NextAuth handler
- /api/auth/register - User registration

BRAND 360 (Green):
- /api/brand-360 - Get complete brand data
- /api/brand-360/identity - Brand identity CRUD
- /api/brand-360/products - Products CRUD
- /api/brand-360/competitors - Competitors CRUD
- /api/brand-360/market-position - Market position CRUD
- /api/brand-360/analyze-website - Analyze website URL
- /api/brand-360/upload - Document upload
- /api/brand-360/catalog/upload - Catalog upload

AEO ENGINE (Purple):
- /api/aeo/magic-import - Extract brand from website
- /api/aeo/perception-scan - Start/list scans
- /api/aeo/perception-scan/[scanId] - Get scan results
- /api/aeo/insights - Perception insights CRUD
- /api/aeo/insights/[insightId] - Single insight
- /api/aeo/corrections - Correction workflows
- /api/aeo/corrections/[workflowId] - Single workflow
- /api/aeo/prompts - Prompt management
- /api/aeo/prompts/generate - Generate prompts
- /api/aeo/reports/summary - Report summary
- /api/aeo/reports/export - Export reports
- /api/aeo/compare-scans - Compare scans

USER (Orange):
- /api/user/profile - User profile
- /api/user/password - Password management
- /api/user/sessions - Session management
- /api/user/mfa - MFA status
- /api/user/mfa/setup - MFA setup
- /api/user/mfa/verify - MFA verification

ONBOARDING (Teal):
- /api/onboarding/analyze - Analyze URL
- /api/onboarding/status - Check status
- /api/onboarding/confirm - Confirm onboarding
- /api/onboarding/review-queue - Review queue
- /api/onboarding/review-queue/approve - Approve items
- /api/onboarding/products/upload - Upload products

ADMIN (Red):
- /api/admin/queue-stats - Queue statistics
- /api/admin/review-queue - Admin review queue

OTHER (Gray):
- /api/health - Health check
- /api/brand-profile - Brand profile
- /api/reports/brand-story - Brand story report

Show the Client connecting to all route groups. Make it clean and professional.
```

---

## 2. Architecture Diagram

**Prompt for Claude:**

```
Create a system architecture diagram for VistralAI showing the following components and their connections:

EXTERNAL USERS:
- Browser Client (connects via HTTPS)

GOOGLE CLOUD PLATFORM:
  Cloud Run Services:
  - VistralAI (Next.js 14, Port 8080, 2Gi RAM, 2 CPU)
  - Firecrawl Service (Port 3000, 1Gi RAM, 1 CPU, internal only)

  VPC Network:
  - VPC Connector (vistralai-connector)
  - Cloud Memorystore Redis 7.0 (1GB)

  Secret Manager:
  - NEXTAUTH_SECRET
  - ANTHROPIC_API_KEY
  - OPENAI_API_KEY

  Storage:
  - Container Registry (GCR)
  - Cloud Logging

EXTERNAL SERVICES:
- Claude API (Anthropic)
- OpenAI API
- MongoDB Atlas

CONNECTIONS:
- Browser → VistralAI (HTTPS)
- VistralAI → Firecrawl (Internal HTTP)
- VistralAI → VPC Connector → Redis
- VistralAI → Claude API
- VistralAI → OpenAI API
- VistralAI → MongoDB Atlas
- VistralAI reads from Secret Manager
- Firecrawl reads from Secret Manager

Use a layered architecture style with clear boundaries between GCP services and external services.
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
- MongoDB
- Audit Log

FLOW 1 - CREDENTIALS LOGIN:
1. User enters email/password in Browser
2. Browser sends POST /api/auth/signin to Next.js
3. Next.js forwards to NextAuth.js
4. NextAuth.js calls getUserByEmail() on MongoDB
5. MongoDB returns User record
6. NextAuth.js verifies password
7. IF password valid:
   - Generate JWT token
   - Update lastLoginAt in MongoDB
   - Log signin event to Audit Log
   - Return HTTP-only cookie to Browser
   - Browser redirects User to /dashboard
8. IF password invalid:
   - Return error to Browser
   - Browser shows error to User

FLOW 2 - OAUTH LOGIN (Google/GitHub):
1. User clicks OAuth provider button
2. Browser calls GET /api/auth/signin/google
3. NextAuth.js redirects Browser to OAuth provider
4. User sees OAuth consent screen
5. User grants permission
6. Browser receives callback with auth code
7. NextAuth.js exchanges code for tokens
8. NextAuth.js finds or creates user in MongoDB
9. NextAuth.js links OAuth account
10. Log signin event to Audit Log
11. Return HTTP-only cookie
12. Browser redirects to /dashboard

FLOW 3 - SESSION VALIDATION:
1. User accesses protected route
2. Browser sends request with cookie
3. Next.js validates JWT via NextAuth.js
4. IF valid: return session data and protected content
5. IF invalid: redirect to /auth/login

Use different colors for each flow section.
```

---

## 4. Component Hierarchy Diagram

**Prompt for Claude:**

```
Create a component hierarchy diagram for VistralAI React application:

APP ROUTER (Root):
├── RootLayout
│
├── AUTH PAGES:
│   ├── LoginPage → AuthForm
│   ├── RegisterPage → AuthForm
│   └── ErrorPage
│
├── DASHBOARD PAGES:
│   ├── DashboardLayout
│   │   ├── SessionProvider
│   │   └── Sidebar/Navigation
│   │
│   ├── DashboardPage (Home)
│   │   ├── BrandPresenceHero
│   │   ├── BrandHealthIndicator
│   │   ├── BrandMoments
│   │   ├── BrandGrowthOpportunities
│   │   ├── MarketLandscape
│   │   ├── BrandStoryVisualizer
│   │   └── AIPlatformGalaxy
│   │
│   ├── Brand360Page
│   │   ├── WebsiteAnalyzer
│   │   ├── BrandStoryCanvas
│   │   ├── BrandOfferingsShowcase
│   │   ├── ProfileStrengthMeter
│   │   ├── DocumentUpload
│   │   └── ProductCatalogConnector
│   │
│   ├── AEOPage
│   │   ├── QuadrantChart
│   │   ├── MetricsRadarChart
│   │   ├── PerceptionScoreCard
│   │   ├── PlatformComparisonChart
│   │   ├── ScoreTrendChart
│   │   ├── InsightsPriorityMatrix
│   │   └── CorrectionFunnel
│   │
│   ├── ReviewQueuePage
│   │   ├── ReviewQueueBanner
│   │   ├── ReviewModal
│   │   └── FieldReviewCard
│   │
│   ├── SettingsPage
│   │   ├── ThemeSettings
│   │   └── ThemeSelector
│   │
│   └── ReportPage
│       └── BrandStoryReport
│
└── ONBOARDING PAGE:
    ├── OnboardingWizard / NewOnboardingWizard
    ├── UrlAnalyzer
    ├── ProfileReviewCards
    └── ProductIngestionTabs

SHARED UI COMPONENTS:
- ThemeToggle
- MetricCard
- AlertBanner
- OpportunityCard

Use a tree structure with color-coded sections for each page area.
```

---

## 5. Data Flow Diagram

**Prompt for Claude:**

```
Create a data flow diagram for VistralAI showing how data moves through the system:

DATA SOURCES (Left side):
- Website URL (user input)
- CSV Upload (file)
- Manual Entry (forms)
- OAuth Providers (Google, GitHub)

PROCESSING LAYER (Center):
  Web Crawling:
  - Firecrawl Service (primary)
  - WebCrawler (fallback)

  AI Processing:
  - BrandIntelligence (GPT-4o-mini)
  - VibeCheckAgent (personality inference)
  - CompetitorAgent (competitor discovery)
  - PerceptionEvaluatorAgent (LLM-as-a-Judge)

  Job Queue:
  - Bull Queue
  - Redis (backend)

DATA STORAGE (Center-Right):
  MongoDB Collections:
  - users
  - brand_profiles
  - brand360_profiles
  - products
  - perception_scans
  - ai_perception_results

OUTPUT (Right side):
- Dashboard UI
- Reports
- API Responses

DATA FLOWS:
1. Website URL → Firecrawl → BrandIntelligence → brand360_profiles
2. CSV Upload → products collection
3. Manual Entry → brand_profiles
4. OAuth → users collection
5. VibeCheckAgent → brand360_profiles
6. CompetitorAgent → brand360_profiles
7. brand360_profiles → PerceptionEvaluator → ai_perception_results → perception_scans
8. MongoDB → Dashboard/Reports/API

Show data flowing left to right with clear arrows and labels.
```

---

## 6. Database Schema Diagram (ERD)

**Prompt for Claude:**

```
Create an Entity Relationship Diagram (ERD) for VistralAI MongoDB database:

ENTITIES AND RELATIONSHIPS:

User (1) -----> (0..1) BrandProfile
User (1) -----> (0..N) Session
User (1) -----> (0..N) Membership
Organization (1) -----> (0..N) Membership

BrandProfile (1) -----> (0..1) BrandIdentity
BrandProfile (1) -----> (0..1) MarketPosition
BrandProfile (1) -----> (0..N) CompetitorProfile
BrandProfile (1) -----> (0..N) ProductDetail
BrandProfile (1) -----> (0..N) BrandAsset
BrandProfile (1) -----> (0..N) UploadedDocument

Brand360Profile (1) -----> (0..1) EntityHome
Brand360Profile (1) -----> (0..1) OrganizationSchema
Brand360Profile (1) -----> (0..1) BrandIdentityPrism
Brand360Profile (1) -----> (0..1) BrandArchetype
Brand360Profile (1) -----> (0..1) BrandVoiceProfile
Brand360Profile (1) -----> (0..1) ClaimLocker
Brand360Profile (1) -----> (0..1) CompetitorGraph
Brand360Profile (1) -----> (0..1) RiskFactors
Brand360Profile (1) -----> (0..N) CustomerPersona
Brand360Profile (1) -----> (0..N) Product
Brand360Profile (1) -----> (0..N) GeneratedPrompt
Brand360Profile (1) -----> (0..N) PerceptionScan
Brand360Profile (1) -----> (0..N) AIPerceptionResult
Brand360Profile (1) -----> (0..N) PerceptionInsight
Brand360Profile (1) -----> (0..N) CorrectionWorkflow

ClaimLocker (1) -----> (0..N) Claim
CompetitorGraph (1) -----> (0..N) Competitor
PerceptionScan (1) -----> (0..N) AIPerceptionResult
GeneratedPrompt (1) -----> (0..N) AIPerceptionResult
PerceptionInsight (1) -----> (0..1) CorrectionWorkflow

KEY FIELDS:

User: id, email, password, accountType, subscription, mfaEnabled
BrandProfile: id, userId, brandName, domain, category, crawlingStatus
Brand360Profile: id, organizationId, brandName, completionScore, entityHealthScore
PerceptionScan: id, brand360Id, status, platforms[], overallScore, quadrantPosition
AIPerceptionResult: id, promptId, brand360Id, platform, faithfulnessScore, shareOfVoice, hallucinationScore
GeneratedPrompt: id, brand360Id, category, intent, template, renderedPrompt

Use crow's foot notation for cardinality. Group related entities together.
```

---

## 7. Infrastructure and Deployment Diagram

**Prompt for Claude:**

```
Create an infrastructure and deployment diagram for VistralAI:

DEVELOPER ENVIRONMENT (Left):
- Source Code
- Git Repository

CI/CD PIPELINE:
- Cloud Build (triggered by Git)
- Run Tests
- Build Docker Image
- Push to Google Container Registry (GCR)

PRODUCTION ENVIRONMENT - Google Cloud Platform (Center):

  Cloud Run Services:
  - VistralAI Service
    - Region: us-central1
    - Instances: 0-20 (auto-scaling)
    - Resources: 2Gi RAM, 2 CPU
  - Firecrawl Service
    - Region: us-central1
    - Instances: 0-10 (auto-scaling)
    - Resources: 1Gi RAM, 1 CPU

  Networking:
  - Cloud Load Balancer (public entry point)
  - VPC Connector
  - Firewall Rules

  Data Services:
  - Cloud Memorystore (Redis 7.0, 1GB)
  - Secret Manager

  Monitoring:
  - Cloud Logging
  - Cloud Monitoring
  - Alerting

EXTERNAL SERVICES (Right):
- MongoDB Atlas
- Anthropic API (Claude)
- OpenAI API

LOCAL DEVELOPMENT (Bottom):
- Docker Compose
- MongoDB Container (port 27017)
- Redis Container (port 6379)
- Firecrawl Container (port 3002)

DEPLOYMENT FLOW:
Code → Git → Cloud Build → Tests → Docker Build → GCR → Cloud Run

Show the flow from development through deployment to production.
```

---

## 8. AEO Agent Flow Diagram

**Prompt for Claude:**

```
Create a flow diagram showing the AEO (AI Engine Optimization) agent workflow:

INPUT:
- Website URL (from user)

ORCHESTRATOR:
- MagicImportOrchestrator (coordinates all agents)

AGENT SEQUENCE:

1. CrawlerAgent
   - Input: Website URL
   - Process: Web crawling + Schema.org extraction
   - Output: Raw website data

2. BrandIntelligence (GPT-4o-mini)
   - Input: Raw website data
   - Process: Extract brand information
   - Output: Structured brand data

3. VibeCheckAgent
   - Input: Brand data
   - Process: Infer brand personality
   - Output: Personality traits, archetypes

4. CompetitorAgent
   - Input: Brand data
   - Process: Discover competitors
   - Output: Competitor list with analysis

5. Create Brand360Profile
   - Combines all extracted data

6. Generate Prompts
   - Categories: navigational, functional, comparative, voice, adversarial
   - Output: Test prompts for AI platforms

7. PerceptionEvaluatorAgent (LLM-as-a-Judge)
   - Input: Generated prompts
   - Process: Query AI platforms, score responses
   - Output: Perception metrics

PERCEPTION METRICS OUTPUT:
- Faithfulness Score (0-100): Accuracy to ground truth
- Share of Voice (0-100): Brand visibility
- Sentiment (-1 to 1): Overall sentiment
- Voice Alignment (0-100): Matches brand tone
- Hallucination Score (0-100): 100 = no hallucinations

QUADRANT CLASSIFICATION:
- High Accuracy + High Visibility = DOMINANT (green)
- Low Accuracy + High Visibility = VULNERABLE (amber)
- High Accuracy + Low Visibility = NICHE (blue)
- Low Accuracy + Low Visibility = INVISIBLE (red)

Show as a vertical flow with agents as distinct steps.
```

---

## 9. Docker Services Diagram

**Prompt for Claude:**

```
Create a diagram showing Docker services for VistralAI local development:

docker-compose.yml (Main services):
┌─────────────────────────────────────┐
│ Firecrawl        │ Port: 3002      │
│ Redis            │ Port: 6379      │
│ PostgreSQL       │ Port: 5432      │
│ Playwright       │ Port: 3001      │
└─────────────────────────────────────┘

docker-compose.mongodb.yml:
┌─────────────────────────────────────┐
│ MongoDB          │ Port: 27017     │
│ Mongo Express    │ Port: 8081      │
└─────────────────────────────────────┘

Next.js Application:
┌─────────────────────────────────────┐
│ VistralAI        │ Port: 3000      │
└─────────────────────────────────────┘

CONNECTIONS:
- VistralAI → Firecrawl (crawling requests)
- VistralAI → MongoDB (data persistence)
- VistralAI → Redis (job queue)
- Firecrawl → Redis (queue backend)
- Firecrawl → Playwright (browser automation)
- Mongo Express → MongoDB (admin UI)

Show as connected service boxes with port numbers.
```

---

## Quick Reference - Quadrant Chart

**Prompt for Claude:**

```
Create a 2x2 quadrant chart for brand positioning:

X-AXIS: Visibility (Low to High)
Y-AXIS: Accuracy (Low to High)

QUADRANTS:
- Top-Right (High Visibility, High Accuracy): DOMINANT - Green
- Top-Left (Low Visibility, High Accuracy): NICHE - Blue
- Bottom-Right (High Visibility, Low Accuracy): VULNERABLE - Amber/Orange
- Bottom-Left (Low Visibility, Low Accuracy): INVISIBLE - Red

Sample data points:
- Brand A: Position (0.8, 0.85) - Dominant
- Brand B: Position (0.3, 0.7) - Niche
- Brand C: Position (0.2, 0.3) - Invisible
- Brand D: Position (0.75, 0.4) - Vulnerable

Make it a clean 2x2 matrix with labeled quadrants and sample brand positions.
```

---

## Usage

1. Copy the prompt text (everything inside the code block after "Prompt for Claude:")
2. Paste into a new Claude conversation
3. Claude will generate a visual diagram based on the description
4. You can ask Claude to modify colors, layout, or add/remove elements

**Tips:**
- Ask for "SVG format" if you want code you can edit
- Ask for "clean/minimal style" for presentation-ready diagrams
- Request specific colors by name or hex code
- Ask to "add a legend" for complex diagrams
