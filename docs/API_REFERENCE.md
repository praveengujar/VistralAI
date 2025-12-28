# VistralAI API Reference

**Complete REST API documentation for VistralAI backend services.**

---

## Table of Contents

1. [Authentication](#authentication)
2. [Base URL & Rate Limiting](#base-url--rate-limiting)
3. [Error Handling](#error-handling)
4. [Core Resources](#core-resources)
5. [Brand 360° API](#brand-360-api)
6. [AEO (Perception) API](#aeo-perception-api)
7. [Onboarding API](#onboarding-api)
8. [Queue Management API](#queue-management-api)
9. [Admin API](#admin-api)

---

## Authentication

### Overview

VistralAI uses **JWT (JSON Web Token)** authentication via NextAuth.js. All API requests require a valid session.

### Session-Based Authentication

Sessions are managed via HTTP-only cookies. Authentication happens automatically for:
- Browser-based requests (cookies sent automatically)
- NextAuth.js client methods
- Server-to-server calls with session header

### API Key Authentication (Future)

Coming in Phase 11: API keys for programmatic access without browser sessions.

---

## Base URL & Rate Limiting

### Base URL

```
Development: http://localhost:3000/api
Production: https://vistralai.run.app/api
```

### Rate Limiting

**Limits** (per IP address):
- 100 requests per minute (general)
- 10 requests per minute (heavy operations: crawl, extract)
- 1000 requests per hour (per user)

**Response Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1699564800
```

**Rate Limit Exceeded**:
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

---

## Error Handling

### Response Format

**Success** (2xx):
```json
{
  "success": true,
  "data": { /* response payload */ }
}
```

**Error** (4xx/5xx):
```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": { /* additional error details */ }
}
```

### Error Codes

| Status | Code | Meaning |
|--------|------|---------|
| 400 | INVALID_INPUT | Validation error in request body |
| 400 | MISSING_REQUIRED_FIELD | Required field is missing |
| 401 | UNAUTHORIZED | Not authenticated or session expired |
| 403 | FORBIDDEN | Authenticated but not authorized |
| 404 | NOT_FOUND | Resource doesn't exist |
| 409 | CONFLICT | Resource already exists |
| 422 | VALIDATION_ERROR | Data validation failed |
| 429 | RATE_LIMITED | Too many requests |
| 500 | INTERNAL_ERROR | Server error |
| 503 | SERVICE_UNAVAILABLE | Service temporarily unavailable |

### Example Error Response

```json
{
  "success": false,
  "error": "Invalid domain format",
  "code": "INVALID_INPUT",
  "details": {
    "field": "domain",
    "value": "not-a-domain",
    "expectedFormat": "example.com"
  }
}
```

---

## Core Resources

### Authentication Endpoints

#### Register User
```
POST /auth/register
```

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe",
  "companyName": "Acme Corp"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-11-28T10:00:00Z"
  }
}
```

#### Login
```
POST /auth/login
```

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "sessionToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Note**: Session cookie automatically set in response headers.

#### Logout
```
POST /auth/logout
```

**Response** (200):
```json
{
  "success": true,
  "data": { "message": "Logged out successfully" }
}
```

#### Reset Password
```
POST /auth/reset-password
```

**Request**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": { "message": "Password reset link sent to email" }
}
```

#### Verify Email
```
POST /auth/verify-email
```

**Request**:
```json
{
  "token": "verification_token_from_email"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": { "verified": true }
}
```

---

## Brand 360° API

### Brand Identity

#### Create/Update Brand Identity
```
POST /brand-360/identity
PUT /brand-360/identity
```

**Request**:
```json
{
  "brandId": "brand_123",
  "mission": "Help businesses grow through AI",
  "vision": "To be the world's leading AI visibility platform",
  "coreValues": [
    "Innovation",
    "Transparency",
    "Customer-first"
  ],
  "brandStory": "Founded in 2024 to solve a critical problem...",
  "uniqueSellingPoints": [
    "Real-time AI tracking",
    "Competitive benchmarking",
    "AI-powered insights"
  ],
  "tagline": "Know How AI Sees You",
  "foundedYear": 2024,
  "headquarters": "San Francisco, CA"
}
```

**Response** (201/200):
```json
{
  "success": true,
  "data": {
    "id": "identity_123",
    "brandId": "brand_123",
    "mission": "Help businesses grow through AI",
    "completionScore": 85,
    "updatedAt": "2024-11-28T10:00:00Z"
  }
}
```

#### Get Brand Identity
```
GET /brand-360/identity?brandId=brand_123
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "identity_123",
    "brandId": "brand_123",
    "mission": "Help businesses grow through AI",
    "vision": "To be the world's leading AI visibility platform",
    "coreValues": ["Innovation", "Transparency", "Customer-first"],
    "createdAt": "2024-11-01T00:00:00Z",
    "updatedAt": "2024-11-28T10:00:00Z"
  }
}
```

### Market Position

#### Create/Update Market Position
```
POST /brand-360/market-position
PUT /brand-360/market-position
```

**Request**:
```json
{
  "brandId": "brand_123",
  "targetAudiences": [
    {
      "name": "Enterprise CMOs",
      "demographics": "Age 35-55, $200k+ revenue brands",
      "psychographics": "Data-driven, competitive, growth-focused"
    }
  ],
  "marketSegment": "B2B SaaS",
  "geographicMarkets": ["US", "EU", "APAC"],
  "industryVerticals": ["Technology", "E-commerce", "Finance"],
  "positioning": "Premium AI visibility platform for enterprise brands"
}
```

**Response** (201/200):
```json
{
  "success": true,
  "data": {
    "id": "market_123",
    "brandId": "brand_123",
    "completionScore": 78,
    "updatedAt": "2024-11-28T10:00:00Z"
  }
}
```

### Competitors

#### Add Competitor
```
POST /brand-360/competitors
```

**Request**:
```json
{
  "brandId": "brand_123",
  "name": "Competitor A",
  "domain": "competitor-a.com",
  "isPrimary": true,
  "strengths": [
    "Established brand",
    "Large customer base",
    "Advanced features"
  ],
  "weaknesses": [
    "High pricing",
    "Poor UX",
    "Slow support"
  ],
  "marketShare": 25,
  "differentiators": [
    "Our AI is more accurate",
    "Better pricing",
    "Faster implementation"
  ]
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "competitor_123",
    "brandId": "brand_123",
    "name": "Competitor A",
    "createdAt": "2024-11-28T10:00:00Z"
  }
}
```

#### List Competitors
```
GET /brand-360/competitors?brandId=brand_123
```

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "competitor_123",
      "name": "Competitor A",
      "isPrimary": true,
      "marketShare": 25
    },
    {
      "id": "competitor_456",
      "name": "Competitor B",
      "isPrimary": false,
      "marketShare": 18
    }
  ]
}
```

#### Delete Competitor
```
DELETE /brand-360/competitors?id=competitor_123
```

**Response** (200):
```json
{
  "success": true,
  "data": { "deleted": true }
}
```

### Products & Services

#### Add Product
```
POST /brand-360/products
```

**Request**:
```json
{
  "brandId": "brand_123",
  "name": "VistralAI Pro",
  "sku": "VISTRAL-PRO-001",
  "category": "Software",
  "subcategory": "SaaS",
  "description": "Enterprise AI visibility platform with advanced analytics",
  "shortDescription": "AI visibility for enterprise brands",
  "features": [
    "Real-time tracking",
    "Competitor benchmarking",
    "AI insights"
  ],
  "benefits": [
    "Understand AI representation",
    "Optimize brand presence",
    "Stay ahead of competition"
  ],
  "pricing": {
    "currency": "USD",
    "amount": 9900,
    "billingPeriod": "monthly"
  },
  "url": "https://vistralai.com/pro",
  "isActive": true
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "product_123",
    "brandId": "brand_123",
    "name": "VistralAI Pro",
    "createdAt": "2024-11-28T10:00:00Z"
  }
}
```

#### List Products
```
GET /brand-360/products?brandId=brand_123
```

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "product_123",
      "name": "VistralAI Pro",
      "category": "Software",
      "pricing": { "amount": 9900 }
    }
  ]
}
```

### Target Audience

#### Get Target Audience
```
GET /brand-360/audience?brand360Id=brand360_123
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "audience": {
      "id": "audience_123",
      "primaryMarket": "B2B",
      "geographicFocus": "North America",
      "targetIndustries": ["Technology", "Finance"],
      "targetJobTitles": ["CMO", "VP Marketing"]
    },
    "personas": [...]
  }
}
```

#### Update Target Audience
```
PUT /brand-360/audience
```

**Request**:
```json
{
  "brand360Id": "brand360_123",
  "primaryMarket": "B2B",
  "geographicFocus": "Global",
  "targetIndustries": ["Technology", "Finance", "Healthcare"]
}
```

### Customer Personas

#### List Personas
```
GET /brand-360/personas?brand360Id=brand360_123
```

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "persona_123",
      "name": "Enterprise Emma",
      "title": "VP of Marketing",
      "archetype": "Decision Maker",
      "type": "primary",
      "painPoints": [
        {
          "title": "AI Visibility Gap",
          "severity": "high",
          "description": "Cannot track how AI platforms represent brand"
        }
      ]
    }
  ]
}
```

#### Create Persona
```
POST /brand-360/personas
```

**Request**:
```json
{
  "brand360Id": "brand360_123",
  "name": "Enterprise Emma",
  "title": "VP of Marketing",
  "archetype": "Decision Maker",
  "type": "primary",
  "ageRange": "35-50",
  "industry": "Technology",
  "primaryGoals": ["Increase brand visibility", "Monitor AI perception"],
  "painPoints": [
    {
      "title": "AI Visibility Gap",
      "description": "Cannot track AI representation",
      "severity": "high"
    }
  ]
}
```

#### Get Persona
```
GET /brand-360/personas/{id}
```

#### Update Persona
```
PUT /brand-360/personas/{id}
```

#### Delete Persona
```
DELETE /brand-360/personas/{id}
```

### Market Positioning

#### Get Market Positioning
```
GET /brand-360/positioning?brand360Id=brand360_123
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "positioning_123",
    "positioningStatement": "For enterprise marketers who need AI visibility...",
    "targetAudienceSummary": "Enterprise marketing leaders",
    "categoryDefinition": "AI Visibility Platform",
    "primaryBenefit": "Understand and optimize AI perception",
    "primaryDifferentiator": "Only platform with LLM-as-a-Judge evaluation",
    "valuePropositions": [...],
    "proofPoints": [...],
    "positioningAxes": [...]
  }
}
```

#### Update Market Positioning
```
PUT /brand-360/positioning
```

**Request**:
```json
{
  "brand360Id": "brand360_123",
  "positioningStatement": "For enterprise marketers...",
  "targetAudienceSummary": "Enterprise marketing leaders",
  "primaryBenefit": "AI visibility and optimization",
  "valuePropositions": [
    {
      "headline": "See How AI Sees You",
      "type": "Primary",
      "functionalValue": "Real-time perception tracking"
    }
  ],
  "proofPoints": [
    {
      "type": "Statistic",
      "title": "85% Accuracy Improvement",
      "metricValue": "85%"
    }
  ]
}
```

---

## AEO (Perception) API

### Perception Scans

#### Create Perception Scan
```
POST /aeo/perception-scan
```

**Request**:
```json
{
  "brand360Id": "brand360_123",
  "platforms": ["claude", "chatgpt", "gemini", "perplexity", "google_aio"],
  "promptCount": 10
}
```

**Response** (202):
```json
{
  "success": true,
  "data": {
    "scanId": "scan_123",
    "status": "pending",
    "platforms": ["claude", "chatgpt", "gemini"],
    "createdAt": "2024-12-27T10:00:00Z"
  }
}
```

#### List Perception Scans
```
GET /aeo/perception-scan?brand360Id=brand360_123
```

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "scan_123",
      "status": "completed",
      "platforms": ["claude", "chatgpt", "gemini"],
      "metrics": {
        "faithfulness": 85,
        "shareOfVoice": 72,
        "sentiment": 0.65,
        "voiceAlignment": 78,
        "hallucination": 92
      },
      "quadrant": "dominant",
      "createdAt": "2024-12-27T10:00:00Z"
    }
  ]
}
```

#### Get Scan Details
```
GET /aeo/perception-scan/{scanId}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "scan_123",
    "brand360Id": "brand360_123",
    "status": "completed",
    "platforms": ["claude", "chatgpt", "gemini"],
    "metrics": {
      "faithfulness": 85,
      "shareOfVoice": 72,
      "sentiment": 0.65,
      "voiceAlignment": 78,
      "hallucination": 92
    },
    "quadrant": "dominant",
    "platformResults": [
      {
        "platform": "claude",
        "metrics": { "faithfulness": 88, "shareOfVoice": 75 }
      }
    ],
    "createdAt": "2024-12-27T10:00:00Z",
    "completedAt": "2024-12-27T10:05:00Z"
  }
}
```

### Prompts

#### Generate Prompts
```
POST /aeo/prompts/generate
```

**Request**:
```json
{
  "brand360Id": "brand360_123",
  "count": 10,
  "categories": ["product", "brand", "competitor"]
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "prompts": [
      {
        "id": "prompt_123",
        "text": "What are the best AI visibility platforms?",
        "category": "product",
        "intent": "discovery"
      }
    ],
    "count": 10
  }
}
```

#### List Prompts
```
GET /aeo/prompts?brand360Id=brand360_123
```

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "prompt_123",
      "text": "What are the best AI visibility platforms?",
      "category": "product",
      "usageCount": 5,
      "createdAt": "2024-12-27T10:00:00Z"
    }
  ]
}
```

### Insights

#### List Insights
```
GET /aeo/insights?brand360Id=brand360_123
```

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "insight_123",
      "scanId": "scan_123",
      "type": "hallucination",
      "severity": "high",
      "platform": "chatgpt",
      "description": "Incorrect founding year mentioned",
      "evidence": "Response stated 2020, actual is 2024",
      "dismissed": false,
      "createdAt": "2024-12-27T10:00:00Z"
    }
  ]
}
```

#### Dismiss Insight
```
POST /aeo/insights/{insightId}/dismiss
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "insight_123",
    "dismissed": true,
    "dismissedAt": "2024-12-27T10:00:00Z"
  }
}
```

### Corrections

#### List Corrections
```
GET /aeo/corrections?brand360Id=brand360_123
```

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "workflowId": "workflow_123",
      "insightId": "insight_123",
      "status": "pending",
      "fixType": "schema_org",
      "suggestion": {
        "type": "schema_org",
        "content": "Add Organization schema with correct founding date"
      },
      "createdAt": "2024-12-27T10:00:00Z"
    }
  ]
}
```

#### Create Correction
```
POST /aeo/corrections
```

**Request**:
```json
{
  "insightId": "insight_123",
  "fixType": "schema_org"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "workflowId": "workflow_123",
    "status": "pending",
    "suggestion": {
      "type": "schema_org",
      "content": "..."
    }
  }
}
```

#### Verify Correction
```
POST /aeo/corrections/{workflowId}/verify
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "workflowId": "workflow_123",
    "status": "verified",
    "verifiedAt": "2024-12-27T10:00:00Z"
  }
}
```

#### Approve Correction
```
POST /aeo/corrections/{workflowId}/approve
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "workflowId": "workflow_123",
    "status": "approved",
    "approvedAt": "2024-12-27T10:00:00Z"
  }
}
```

### Reports

#### Get Report Summary
```
GET /aeo/reports/summary?brand360Id=brand360_123
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "brand360Id": "brand360_123",
    "latestScan": {
      "id": "scan_123",
      "quadrant": "dominant",
      "metrics": { "faithfulness": 85, "shareOfVoice": 72 }
    },
    "trends": {
      "faithfulness": { "current": 85, "previous": 80, "change": 5 },
      "shareOfVoice": { "current": 72, "previous": 68, "change": 4 }
    },
    "openInsights": 3,
    "pendingCorrections": 2
  }
}
```

#### Export Report
```
POST /aeo/reports/export
```

**Request**:
```json
{
  "brand360Id": "brand360_123",
  "format": "pdf",
  "dateRange": {
    "start": "2024-12-01",
    "end": "2024-12-27"
  }
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "reportId": "report_123",
    "downloadUrl": "/api/reports/download/report_123",
    "expiresAt": "2024-12-28T10:00:00Z"
  }
}
```

### Magic Import

#### Start Magic Import
```
POST /aeo/magic-import
```

**Request**:
```json
{
  "organizationId": "org_123",
  "websiteUrl": "https://example.com"
}
```

**Response** (202):
```json
{
  "success": true,
  "data": {
    "importId": "import_123",
    "status": "started",
    "stages": ["crawl", "analyze", "competitors", "profile"],
    "currentStage": "crawl",
    "progress": 0
  }
}
```

---

## Onboarding API

### Start Website Analysis
```
POST /onboarding/analyze
```

**Request**:
```json
{
  "brandId": "brand_123",
  "websiteUrl": "https://example.com"
}
```

**Response** (202):
```json
{
  "success": true,
  "data": {
    "jobId": "job_12345",
    "status": "started",
    "phase": "crawl",
    "progress": 10,
    "estimatedTimeRemaining": 180
  }
}
```

### Get Analysis Status
```
GET /onboarding/analyze?jobId=job_12345
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "jobId": "job_12345",
    "status": "processing",
    "phase": "extract",
    "progress": 60,
    "estimatedTimeRemaining": 90,
    "result": null
  }
}
```

### Get Analysis Result
```
GET /onboarding/analyze?jobId=job_12345
```

**Response** (200) - When complete:
```json
{
  "success": true,
  "data": {
    "jobId": "job_12345",
    "status": "completed",
    "progress": 100,
    "result": {
      "crawlData": {
        "url": "https://example.com",
        "markdown": "# About Us...",
        "metadata": {
          "title": "Example Company",
          "description": "..."
        }
      },
      "extractedIdentity": {
        "mission": "...",
        "vision": "...",
        "coreValues": [...]
      },
      "extractedCompetitors": [...],
      "extractedProducts": [...]
    }
  }
}
```

### Review Queue

#### Get Pending Reviews
```
GET /onboarding/review-queue?jobId=job_12345
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "review_123",
        "jobId": "job_12345",
        "dataType": "identity",
        "extractedData": { "mission": "..." },
        "fieldReviews": [
          {
            "field": "mission",
            "value": "Extracted mission...",
            "confidence": 0.78,
            "status": "pending"
          }
        ],
        "status": "pending",
        "createdAt": "2024-11-28T10:00:00Z"
      }
    ],
    "stats": {
      "totalReviews": 3,
      "pendingReviews": 1,
      "approvedReviews": 2,
      "rejectedReviews": 0
    }
  }
}
```

#### Approve Review
```
POST /onboarding/review-queue/approve
```

**Request**:
```json
{
  "reviewId": "review_123",
  "approvals": [
    {
      "field": "mission",
      "status": "approved"
    },
    {
      "field": "vision",
      "status": "edited",
      "value": "Updated vision statement",
      "feedback": "Made more specific to our global ambitions"
    }
  ],
  "notes": "Great extraction overall"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "review_123",
    "status": "partially_approved",
    "updatedAt": "2024-11-28T10:10:00Z",
    "userApprovedData": {
      "mission": "Extracted mission...",
      "vision": "Updated vision statement"
    }
  }
}
```

#### Reject Review
```
POST /onboarding/review-queue/reject
```

**Request**:
```json
{
  "reviewId": "review_123",
  "reason": "Need to re-extract with updated website content"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "review_123",
    "status": "rejected",
    "updatedAt": "2024-11-28T10:10:00Z"
  }
}
```

---

## Queue Management API

### Get Queue Statistics
```
GET /admin/queue-stats
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "queueType": "bull",
    "timestamp": "2024-11-28T10:00:00Z",
    "stats": {
      "crawlQueue": {
        "waiting": 5,
        "active": 2,
        "completed": 142,
        "failed": 3,
        "delayed": 0
      },
      "extractQueue": {
        "waiting": 3,
        "active": 1,
        "completed": 140,
        "failed": 2,
        "delayed": 0
      },
      "analyzeQueue": {
        "waiting": 2,
        "active": 1,
        "completed": 137,
        "failed": 1,
        "delayed": 0
      },
      "totalJobs": 147,
      "averageProcessingTime": 45000,
      "successRate": 0.98
    }
  }
}
```

---

## Admin API

### Get Review Queue Dashboard
```
GET /admin/review-queue
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "review_123",
        "jobId": "job_12345",
        "brandId": "brand_123",
        "dataType": "identity",
        "status": "pending",
        "fieldCount": 3,
        "lowConfidenceFieldCount": 1,
        "createdAt": "2024-11-28T09:00:00Z"
      }
    ],
    "stats": {
      "totalReviews": 47,
      "pendingReviews": 12,
      "approvedReviews": 33,
      "rejectedReviews": 2,
      "averageResolutionTime": 3600
    }
  }
}
```

---

## Webhooks (Coming Soon)

Future Phase: Event-driven webhooks for:
- Analysis completed
- Review pending
- Brand profile updated
- Visibility score changed

---

## Code Examples

### JavaScript/Node.js

```javascript
// Fetch with session authentication (auto-included)
const response = await fetch('https://vistralai.run.app/api/brand-360/identity', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Include session cookie
  body: JSON.stringify({
    brandId: 'brand_123',
    mission: 'Help businesses grow',
    vision: 'Be the world leader'
  })
});

const data = await response.json();
console.log(data);
```

### Python

```python
import requests

session = requests.Session()

# Login first (or session already exists)
login_response = session.post(
  'https://vistralai.run.app/api/auth/login',
  json={
    'email': 'user@example.com',
    'password': 'password'
  }
)

# Then make authenticated requests
response = session.post(
  'https://vistralai.run.app/api/brand-360/identity',
  json={
    'brandId': 'brand_123',
    'mission': 'Help businesses grow'
  }
)

print(response.json())
```

### cURL

```bash
# Login
curl -c cookies.txt -X POST \
  https://vistralai.run.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Create brand identity (with session cookie)
curl -b cookies.txt -X POST \
  https://vistralai.run.app/api/brand-360/identity \
  -H "Content-Type: application/json" \
  -d '{
    "brandId": "brand_123",
    "mission": "Help businesses grow"
  }'
```

---

## Rate Limiting Best Practices

1. **Implement exponential backoff** for retries:
   ```
   1st retry: 1 second
   2nd retry: 2 seconds
   3rd retry: 4 seconds
   4th retry: 8 seconds
   ```

2. **Cache responses** when possible to reduce API calls

3. **Use batch endpoints** for multiple operations

4. **Monitor rate limit headers** and adjust request rate accordingly

5. **Queue long-running operations** (crawl, extract) asynchronously

---

## Versioning

Current API version: **v1** (default)

Future versions will be available as `/api/v2`, `/api/v3`, etc. with backward compatibility maintained.

---

## Support & Issues

- **API Issues**: support@vistralai.com
- **Bug Reports**: https://github.com/vistralai/api-issues
- **Feature Requests**: https://community.vistralai.com/feature-requests

---

**Last Updated**: December 2024
**Status**: Production Ready
**Version**: 1.1
