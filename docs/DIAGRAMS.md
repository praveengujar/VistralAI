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
        E1["/api/onboarding/analyze"]
        E2["/api/onboarding/status"]
        E3["/api/onboarding/confirm"]
        E4["/api/onboarding/review-queue"]
        E5["/api/onboarding/review-queue/approve"]
        E6["/api/onboarding/products/upload"]
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

## 2. Architecture Diagram

```mermaid
flowchart TB
    subgraph Users["External Users"]
        Browser["Browser Client"]
    end

    subgraph GCP["Google Cloud Platform"]
        subgraph CloudRun["Cloud Run Services"]
            NextJS["VistralAI<br/>Next.js 14<br/>Port 8080<br/>2Gi/2CPU"]
            Firecrawl["Firecrawl Service<br/>Port 3000<br/>1Gi/1CPU"]
        end

        subgraph VPC["VPC Network"]
            Connector["VPC Connector<br/>vistralai-connector"]
            Redis["Cloud Memorystore<br/>Redis 7.0<br/>1GB"]
        end

        subgraph Secrets["Secret Manager"]
            S1["NEXTAUTH_SECRET"]
            S2["ANTHROPIC_API_KEY"]
            S3["OPENAI_API_KEY"]
        end

        subgraph Storage["Cloud Storage"]
            GCR["Container Registry"]
            Logs["Cloud Logging"]
        end
    end

    subgraph External["External Services"]
        Claude["Claude API<br/>Anthropic"]
        OpenAI["OpenAI API"]
        MongoDB["MongoDB Atlas"]
    end

    Browser -->|HTTPS| NextJS
    NextJS -->|HTTP Internal| Firecrawl
    NextJS --> Connector
    Connector --> Redis
    NextJS --> Claude
    NextJS --> OpenAI
    NextJS --> MongoDB
    NextJS -.->|Reads| Secrets
    Firecrawl -.->|Reads| Secrets
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

**Last Updated**: December 2024
**Version**: 1.0
