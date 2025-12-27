# VistralAI Architecture Guide

**In-depth technical architecture, design decisions, and system components.**

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Service Components](#service-components)
3. [Data Flow](#data-flow)
4. [Technology Stack](#technology-stack)
5. [Design Patterns](#design-patterns)
6. [Scalability](#scalability)
7. [Security Architecture](#security-architecture)
8. [Future Architecture](#future-architecture)

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  External Users (Browser)                   │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS
                     ▼
        ┌────────────────────────────────┐
        │  Next.js 14 (App Router)       │
        │  - SSR/SSG pages               │
        │  - API routes                  │
        │  - Authentication (NextAuth.js)│
        │  Cloud Run (2Gi/2CPU)          │
        └────────┬─────────────┬─────────┘
                 │             │
        ┌────────▼────┐  ┌─────▼──────────┐
        │ Services    │  │ External APIs  │
        ├─────────────┤  ├────────────────┤
        │ Crawler     │  │ Firecrawl      │
        │ Intelligence│  │ Claude API     │
        │ Queue       │  │ Google Search? │
        │ Reviews     │  │                │
        └────┬────────┘  └────────────────┘
             │
      ┌──────┴──────┐
      │             │
      ▼             ▼
   ┌────────┐   ┌─────────────┐
   │ Redis  │   │ Secret Mgr  │
   │(Queue) │   │(Keys/Tokens)│
   └────────┘   └─────────────┘
      │
      └── Memorystore (VPC-native)
```

### Multi-Service Topology

**Service Boundary**:
```
┌──────────────────────────────────────────────────────────┐
│  Google Cloud Platform (Project: vistralai)             │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────┐  ┌──────────────────────┐ │
│  │ VistralAI Main Service  │  │ Firecrawl Service    │ │
│  │ (Cloud Run)             │  │ (Cloud Run)          │ │
│  │ • Port: 8080 (HTTPS)    │  │ • Port: 3000 (HTTP) │ │
│  │ • Public endpoint       │  │ • Internal only      │ │
│  │ • 2Gi/2CPU              │  │ • 1Gi/1CPU           │ │
│  │ • 0-20 instances        │  │ • 0-10 instances     │ │
│  └──────────┬──────────────┘  └──────────┬───────────┘ │
│             │                           │              │
│  ┌──────────┴───────────────────────────┴──────────┐  │
│  │ VPC Connector (vistralai-connector)             │  │
│  │ • Connects Cloud Run to private services       │  │
│  │ • Enables Redis communication                   │  │
│  └──────────────────────────────────────────────────┘  │
│             │                                            │
│  ┌──────────▼─────────────────────────────────────┐   │
│  │ Cloud Memorystore for Redis                    │   │
│  │ • 1GB memory, Redis 7.0                        │   │
│  │ • VPC-native (private access only)             │   │
│  │ • Bull queue backend                           │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  ┌────────────────────────────────────────────────┐   │
│  │ Secret Manager                                 │   │
│  │ • NEXTAUTH_SECRET                              │   │
│  │ • ANTHROPIC_API_KEY                            │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
└──────────────────────────────────────────────────────────┘
```

---

## Service Components

### 1. VistralAI Main Service

**Purpose**: Core web application handling user requests

**Technology**:
- Next.js 14 with App Router
- React 18 for UI
- TypeScript for type safety
- NextAuth.js for authentication

**Responsibilities**:
- User authentication and session management
- Dashboard and UI serving
- API endpoint routing
- Request validation with Zod
- Business logic orchestration

**Endpoints**:
- `/api/auth/*` - Authentication (login, register, verify)
- `/api/brand-360/*` - Brand profile management
- `/api/onboarding/*` - Onboarding workflow
- `/api/admin/*` - Admin operations (queue stats, reviews)
- `/dashboard/*` - UI pages

**Resources**: 2Gi memory, 2 vCPU, 0-20 instances

### 2. Firecrawl Service

**Purpose**: Website crawling and content extraction

**Technology**:
- Official Firecrawl Docker image
- Node.js runtime
- Headless browser for JS-rendered content

**Responsibilities**:
- Website URL validation
- Multi-page crawling (up to 20 pages)
- JavaScript rendering
- HTML to Markdown conversion
- Metadata extraction

**Communication**:
- Receives HTTP POST requests from VistralAI
- Returns structured crawl result (markdown, HTML, metadata)
- Internal endpoint: `http://firecrawl-service:3000`

**Resources**: 1Gi memory, 1 vCPU, 0-10 instances

### 3. Cloud Memorystore for Redis

**Purpose**: Async job queue and caching

**Technology**:
- Redis 7.0 (VPC-native)
- Bull queue library (Node.js)
- Automatic persistence

**Responsibilities**:
- Bull queue management (crawl, extract, analyze)
- Job persistence and retries
- Progress tracking
- Dead-letter queue for failures

**Usage**:
- Crawl queue: Website analysis jobs
- Extract queue: Brand intelligence extraction
- Analyze queue: Competitive analysis and reviews

**Resources**: 1GB memory, fixed allocation

---

## Data Flow

### User Onboarding Flow

```
User Action: Click "Start Onboarding"
    │
    ▼
POST /api/onboarding/analyze
  └─ Validates domain
  └─ Creates job (jobId)
  └─ Enqueues crawl job to Bull queue
    │
    ▼
Crawl Worker processes job
  └─ Calls Firecrawl service (HTTP)
  └─ Returns CrawlResult { markdown, html, metadata }
  └─ Updates progress: 30%
  └─ Moves job to extract queue
    │
    ▼
Extract Worker processes job
  └─ Calls BrandIntelligence.extractBrandIdentity()
  └─ Uses Claude API (if USE_REAL_API=true)
  └─ Returns { mission, vision, values, confidence }
  └─ Updates progress: 60%
  └─ Moves job to analyze queue
    │
    ▼
Analyze Worker processes job
  └─ Identifies competitors
  └─ Categorizes products
  └─ Checks confidence scores
  └─ Creates ReviewQueueService items for <85% confidence
  └─ Updates progress: 100%
  └─ Job marked completed
    │
    ▼
GET /api/onboarding/analyze?jobId
  └─ Returns completed result to user
  └─ User sees Brand 360 profile populated
  └─ User sees review queue items (if any)
```

### Review Queue Flow

```
Low-confidence extraction detected
    │
    ▼
Create ExtractionReview in ReviewQueueService
  └─ { jobId, dataType, extractedData, confidence, fieldReviews }
  └─ Stored in memory Map (in-memory) or DB (future)
    │
    ▼
User navigates to Review Queue page
    │
    ▼
GET /api/admin/review-queue
  └─ Returns all pending reviews
    │
    ▼
User reviews field by field
    │
    ├─ Approve: Accept AI extraction as-is
    │
    ├─ Edit: Change value and provide feedback
    │   └─ Feedback helps improve AI prompts
    │
    └─ Reject: Mark as wrong, re-extract needed
    │
    ▼
POST /api/onboarding/review-queue/approve
  └─ Mark review as approved/partially_approved/rejected
  └─ Build userApprovedData from approvals
  └─ Update Brand 360 profile with approved data
  └─ Mark job as complete
    │
    ▼
Dashboard updated with final data
```

---

## Technology Stack

### Frontend

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 14 | App Router, SSR, API routes |
| UI | React 18 | Component library |
| Styling | Tailwind CSS | Utility-first CSS |
| Type Safety | TypeScript | Compile-time type checking |
| Icons | Lucide React | Icon components |
| Charts | Recharts | Data visualization |
| Form State | React Hook Form | Form management (future) |
| Validation | Zod | Schema validation |

### Backend

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Node.js 18 | Server runtime |
| Framework | Next.js | API routes |
| Type Safety | TypeScript | Type checking |
| Auth | NextAuth.js | Session management |
| Validation | Zod | Request validation |
| Job Queue | Bull | Async job processing |
| Cache/Queue | Redis | In-memory data store |
| AI | Anthropic SDK | Claude API integration |
| HTTP Client | Built-in fetch | API calls |
| Testing | Jest | Unit/integration tests |

### Infrastructure

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Compute | Cloud Run | Containerized services |
| Queue | Memorystore (Redis) | Async jobs |
| Secrets | Secret Manager | Key/token storage |
| Logs | Cloud Logging | Log aggregation |
| Monitoring | Cloud Monitoring | Metrics & alerts |
| Container Registry | GCR | Docker images |
| CI/CD | Cloud Build | Automated deployment |

---

## Design Patterns

### 1. Service Factory Pattern

**Problem**: Switching between mock and real implementations for testing

**Solution**: Factory pattern with feature flags

```typescript
// lib/services/crawler/index.ts
export function getCrawler(): ICrawler {
  if (FEATURES.USE_FIRECRAWL) {
    return new FirecrawlService(firecrawlConfig);
  } else {
    return new WebCrawler(); // mock
  }
}
```

**Benefits**:
- Easy feature rollout (one environment variable)
- Testable without external dependencies
- Reversible (disable feature if issues)

### 2. Queue Factory Pattern

**Problem**: Support both Bull (production) and in-memory (testing) queues

**Solution**: Factory returning unified interface

```typescript
// lib/services/queue/QueueFactory.ts
export async function getQueueService(): Promise<IQueueService> {
  if (FEATURES.USE_BULL_QUEUE) {
    return BullQueueService.getInstance();
  } else {
    return createMemoryQueueAdapter(new JobQueue());
  }
}
```

**Benefits**:
- Single interface for both implementations
- Easy switching via environment variable
- Tests use fast in-memory version

### 3. Singleton Pattern

**Problem**: Ensure only one instance of expensive resources (Redis connection, Bull queues)

**Solution**: Singleton pattern

```typescript
// lib/services/queue/BullQueueService.ts
class BullQueueService {
  private static instance: BullQueueService;

  private constructor() { /* ... */ }

  static getInstance(): BullQueueService {
    if (!BullQueueService.instance) {
      BullQueueService.instance = new BullQueueService();
    }
    return BullQueueService.instance;
  }
}
```

**Benefits**:
- One connection per service
- Efficient resource usage
- Thread-safe initialization

### 4. Service-Oriented Architecture (SOA)

**Problem**: Monolithic structure hard to scale

**Solution**: Separate services with clear boundaries

```
VistralAI (main app) → {
  ├─ CrawlerService: Website analysis
  ├─ BrandIntelligenceService: AI extraction
  ├─ QueueService: Job management
  ├─ ReviewQueueService: Quality assurance
  └─ External: Firecrawl, Claude API
}
```

**Benefits**:
- Each service has single responsibility
- Easy to test in isolation
- Can scale/replace individually

### 5. Graceful Degradation

**Problem**: External API failures should not block users

**Solution**: Fallback chains

```
Try real Firecrawl → Fallback to WebCrawler (mock)
Try Claude API → Fallback to mock BrandIntelligence
Try Redis/Bull → Fallback to in-memory queue
```

---

## Scalability

### Horizontal Scaling

**Cloud Run Auto-Scaling**:
```yaml
Min instances: 0      # Scale down to zero when idle
Max instances: 20     # Limit to 20 concurrent instances
CPU target: 70%       # Scale up when CPU > 70%
Memory: 2Gi          # Per instance
Concurrency: 80      # Requests per instance
```

**Firecrawl Auto-Scaling**:
```yaml
Min instances: 0      # Cost optimization
Max instances: 10     # Don't need many crawlers
Concurrency: 1        # One crawl per instance
```

### Load Balancing

Cloud Run automatically:
1. Distributes requests across instances
2. Scales up during traffic spikes
3. Scales down during idle periods
4. Routes failed requests to healthy instances

### Queue Scaling

Bull queue handles concurrent job processing:
```typescript
// lib/services/queue/BullQueueService.ts
const crawlQueue = new Queue('crawl', redisConnection, {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: true
  }
});

// Multiple workers process jobs in parallel
crawlQueue.process(3, crawlWorker); // 3 concurrent crawls
```

### Database Scaling (Future)

When transitioning from in-memory to database:
- Use connection pooling for efficient connections
- Implement caching layer (Redis for hot data)
- Shard data by brand/region for global scale
- Read replicas for analytics queries

---

## Security Architecture

### Authentication & Authorization

**NextAuth.js Session-Based**:
```typescript
// Authentication flow
POST /api/auth/signin
  ├─ Validate credentials
  ├─ Create JWT session token
  ├─ Set HTTP-only cookie
  └─ Return session

// Protected routes
const session = await auth();
if (!session) redirect('/auth/login');
```

**Benefits**:
- HTTP-only cookies prevent XSS access
- JWT tokens are stateless
- Automatic session refresh
- Secure by default

### Secrets Management

All sensitive data in Google Secret Manager:
```bash
NEXTAUTH_SECRET      # NextAuth.js signing key
ANTHROPIC_API_KEY    # Claude API access
```

Referenced securely:
```yaml
# cloudbuild.yaml
--set-secrets NEXTAUTH_SECRET=nextauth-secret:latest
--set-secrets ANTHROPIC_API_KEY=anthropic-api-key:latest
```

### Network Security

**VPC-Native Architecture**:
- Firecrawl: Internal only (no public access)
- Redis: Private VPC access
- VPC Connector: Private network communication
- No direct internet exposure of infrastructure

**SSL/TLS**:
- All traffic HTTPS (Cloud Run default)
- HTTP-only cookies with Secure flag
- SameSite=Strict for CSRF protection

### Input Validation

**Zod Schema Validation**:
```typescript
// Every API route validates input
const createBrandSchema = z.object({
  name: z.string().min(1).max(255),
  domain: z.string().url(),
  industryVertical: z.enum(['tech', 'ecommerce', 'finance'])
});

export async function POST(request: NextRequest) {
  const data = createBrandSchema.parse(await request.json());
  // Safe to use data
}
```

### Rate Limiting

**DDoS Protection**:
- 100 requests/minute per IP (general)
- 10 requests/minute for heavy operations
- Cloud Run automatic request queuing

### Data Protection

**Encryption**:
- In transit: HTTPS/TLS
- At rest: GCP default encryption
- Secrets: Secret Manager encryption

**Privacy**:
- No PII stored unnecessarily
- User data isolated by brand
- Session data cleared on logout

---

## Future Architecture

### Phase 11: Multi-Tenant Enhancement

```
Current: Single tenant (one brand per account)
Future: Multi-tenant (multiple brands per account)

├─ Tenant isolation layer
├─ Brand-based access control
├─ Shared infrastructure
└─ Scaled pricing model
```

### Phase 12: Database Migration

```
Current: In-memory (testing), no persistence
Future: PostgreSQL + Prisma ORM

├─ User data persistence
├─ Brand profiles (permanent storage)
├─ Review queue (persistent)
├─ Analytics data warehouse
└─ Backup & recovery capabilities
```

### Phase 13: Real-Time Updates

```
Add WebSocket support:
├─ Live dashboard updates
├─ Real-time job progress
├─ Push notifications
└─ Live team collaboration
```

### Phase 14: Advanced Analytics

```
Data warehouse integration:
├─ BigQuery for historical analysis
├─ ML model training
├─ Predictive insights
└─ Custom reporting API
```

### Phase 15: Global Scale

```
Multi-region deployment:
├─ Regional Cloud Run instances
├─ Global load balancing
├─ Data replication
├─ Low-latency serving
└─ Disaster recovery
```

---

## Performance Optimization

### Code Level

1. **Server Components**: Reduce client bundle size
2. **Code Splitting**: Load code only when needed
3. **Image Optimization**: Modern formats (WebP, AVIF)
4. **Lazy Loading**: Defer non-critical resources

### Infrastructure Level

1. **Caching**: Redis for hot data
2. **CDN**: Cloud CDN for static assets
3. **Compression**: Gzip/Brotli compression
4. **Connection Pooling**: Efficient database connections

### Monitoring

1. **Web Vitals**: LCP, FID, CLS tracking
2. **Performance Metrics**: Response time, error rate
3. **Infrastructure Metrics**: CPU, memory, disk I/O
4. **Business Metrics**: Users, conversions, churn

---

## Summary

VistralAI's architecture is designed for:

✅ **Scalability**: Auto-scaling, microservices, load balancing
✅ **Reliability**: Graceful degradation, retry logic, job persistence
✅ **Security**: VPC isolation, encryption, secret management
✅ **Maintainability**: Clean separation of concerns, testability
✅ **Cost-Efficiency**: Serverless, scale-to-zero, managed services

The system can handle 100+ concurrent users with ease and is ready to scale to thousands.

---

**Last Updated**: November 2024
**Version**: 1.0
**Audience**: Engineering, DevOps, architects
