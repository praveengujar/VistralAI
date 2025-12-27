# VistralAI Development Guide

## Overview

VistralAI is an AI Visibility Optimization Platform built with Next.js 14, TypeScript, and MongoDB. It helps brands monitor and optimize their presence across AI chat interfaces.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB + Prisma ORM
- **Auth**: NextAuth.js
- **AI**: OpenAI API + Firecrawl
- **Deployment**: Google Cloud Run

## Architecture

### Database Layer

Uses a **feature-flag adapter pattern** for database switching:

```typescript
// lib/db/index.ts
const DATABASE_MODE = process.env.DATABASE_MODE || 'mock';
// Supports: 'mongodb', 'postgres', 'mock'
```

| Mode | Description | Use Case |
|------|-------------|----------|
| `mongodb` | MongoDB with Prisma ORM | Production, persistent data |
| `postgres` | PostgreSQL with Prisma ORM | Enterprise features |
| `mock` | In-memory mock database | Testing, quick demos |

**Note**: The old `USE_MONGODB` flag is deprecated. Use `DATABASE_MODE` instead.

### Key Services

| Service | Location | Purpose |
|---------|----------|---------|
| BrandIntelligence | `lib/services/llm/BrandIntelligence.ts` | LLM-powered brand extraction |
| WebCrawler | `lib/services/crawler/WebCrawler.ts` | Firecrawl integration |
| Website Analyzer | `lib/ai/website-analyzer.ts` | Orchestrates crawl + extraction |

### Data Flow

```
Website URL → Firecrawl → BrandIntelligence (GPT-4o-mini) → Brand360Profile → MongoDB
```

## Project Structure

```
app/
  api/                    # API routes
    auth/                 # NextAuth endpoints
    brand-360/            # Brand profile CRUD
    brand-profile/        # Legacy brand API
  dashboard/              # Dashboard pages
  auth/                   # Login/register pages
  onboarding/             # Onboarding wizard

components/
  brand-360/              # Brand profile components
  dashboard/              # Dashboard widgets
  layout/                 # Layout components
  ui/                     # Reusable UI components

lib/
  ai/                     # Website analyzer
  db/                     # Database operations (Prisma + mockDb)
  services/               # External services
    llm/                  # LLM integration
    crawler/              # Web crawling
```

## Environment Variables

```bash
# Required
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret
DATABASE_URL=mongodb://vistralai:vistralai_dev_password@localhost:27017/vistralai?authSource=admin&replicaSet=rs0&directConnection=true

# Database Mode: "postgres" | "mongodb" | "mock"
DATABASE_MODE=mongodb

# AI Features
USE_REAL_API=true
USE_FIRECRAWL=true
OPENAI_API_KEY=your-key
FIRECRAWL_INTERNAL_URL=http://localhost:3002
```

## Development Commands

```bash
# Start development
npm run dev

# Start all services (MongoDB, Redis, Firecrawl, Playwright)
docker-compose up -d

# Generate Prisma client
npx prisma generate

# Build for production
npm run build

# Deploy to Cloud Run
./deploy.sh
```

## Design System

### Tailwind Color Palette

```javascript
// tailwind.config.ts
colors: {
  primary: { 50-900 },      // Purple - main brand
  secondary: { 50-900 },    // Slate - secondary actions
  accent: { 50-900 },       // Cyan - highlights
  success: { 50-900 },      // Green - positive
  warning: { 50-900 },      // Amber - caution
  error: { 50-900 },        // Red - danger/errors
}
```

### Button Classes

```tsx
// Primary action (purple)
<button className="btn-primary btn-md">Action</button>

// Secondary action
<button className="btn-secondary btn-md">Cancel</button>
```

### Status Colors

| Use Case | Class |
|----------|-------|
| Success/positive | `bg-success-500`, `text-success-600` |
| Warning/caution | `bg-warning-500`, `text-warning-600` |
| Error/danger | `bg-error-500`, `text-error-600` |
| Accent/highlight | `bg-accent-500`, `text-accent-600` |

## Database Models

```
users                 # User accounts
brand_profiles        # Brand settings
brand_identities      # Mission, vision, values
market_positions      # Target audiences, positioning
competitor_profiles   # Competitor analysis
product_details       # Product catalog
brand_assets          # Uploaded assets
uploaded_documents    # Document records
```

## Prisma Schema Patterns

MongoDB uses embedded document types. The code must use nested objects, not flat fields.

### BrandVoice (in BrandIdentity)
```typescript
// CORRECT - nested object
brandVoice: {
  tone: ['professional', 'friendly'],
  keywords: ['innovative', 'trusted'],
  avoidWords: [],
}

// WRONG - flat fields (will fail with "Unknown argument voiceTone")
voiceTone: ['professional'],
voiceKeywords: ['innovative'],
```

### Pricing (in ProductDetail)
```typescript
// CORRECT - nested object
pricing: {
  currency: 'USD',
  amount: 99,
  billingPeriod: 'monthly',
}

// WRONG - flat fields (will fail with "Unknown argument pricingCurrency")
pricingCurrency: 'USD',
pricingAmount: 99,
```

**Key files**: `lib/db/operations.ts` - `createBrandIdentity`, `updateBrandIdentity`, `createProductDetail`, `updateProductDetail`

## API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/brand-360` | GET | Get complete Brand 360 data |
| `/api/brand-360/analyze-website` | POST | Analyze website URL |
| `/api/brand-360/identity` | POST/PUT | Create/update brand identity |
| `/api/brand-360/products` | POST/PUT/DELETE | Manage products |
| `/api/brand-360/competitors` | POST/PUT/DELETE | Manage competitors |
| `/api/reports/brand-story` | POST | Generate downloadable brand report |

## Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| DashboardLayout | `components/layout/` | Main layout wrapper |
| WebsiteAnalyzer | `components/brand-360/` | Website analysis UI |
| BrandStoryCanvas | `components/brand-360/` | Brand story display |
| MarketLandscape | `components/dashboard/` | Competitor universe chart |
| ProfileStrengthMeter | `components/brand-360/` | Profile completion meter |
| BrandStoryReport | `components/reporting/` | Downloadable report with actions |
| ThemeToggle | `components/ui/` | Theme switcher (Light/Dim/Lights Out) |

## Debugging

### Check Database State

```bash
# MongoDB shell
docker exec vistralai-mongodb mongosh -u vistralai -p vistralai_dev_password --authenticationDatabase admin vistralai

# List collections
db.getCollectionNames()

# Count documents
db.brand_identities.countDocuments()
```

### Check Logs

```bash
# Firecrawl logs
docker-compose logs -f firecrawl

# Cloud Run logs
gcloud run logs read vistralai --region us-central1 --limit 50
```

## Deployment

```bash
# Quick deploy
./deploy.sh

# Manual deploy
gcloud builds submit --tag gcr.io/$PROJECT_ID/vistralai
gcloud run deploy vistralai --image gcr.io/$PROJECT_ID/vistralai --region us-central1
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Input text not visible | Check `text-gray-900` class on inputs |
| Database not persisting | Ensure `DATABASE_MODE=mongodb` |
| Firecrawl not working | Check Docker container running on port 3002 |
| Auth redirect loop | Verify `NEXTAUTH_URL` matches actual URL |
| MongoDB password error | MongoDB uses `password` field, PostgreSQL uses `passwordHash` |
| `Unknown argument voiceTone` | Use nested `brandVoice: { tone, keywords, avoidWords }` in operations.ts |
| `Unknown argument pricingCurrency` | Use nested `pricing: { currency, amount, billingPeriod }` in operations.ts |
| Magic Import URL validation fails | API normalizes URLs - adds `https://` if missing protocol |
| AEO dashboard shows no data | Ensure user has completed Magic Import to create Brand360 profile |

## Navigation UI

**User Profile as Settings Link** (December 2024):
- The user profile section at the bottom left of the sidebar is clickable
- Clicking the profile navigates to `/dashboard/settings`
- Settings is no longer in the main navigation menu
- Works on both desktop and mobile layouts

**File**: `components/layout/DashboardLayout.tsx`

## Theme System

VistralAI uses a Twitter-style theme system with three options:

| Theme | Description | CSS Class |
|-------|-------------|-----------|
| Light | Default light mode | `.light` (default) |
| Dim | Navy blue dark mode (#15202B) | `.dim` |
| Lights Out | Pure black dark mode (#000000) | `.lights-out` |

### CSS Variables

All components should use CSS variables for theme compatibility:

```css
/* Use these instead of hardcoded colors */
background: rgb(var(--background));           /* Page background */
background: rgb(var(--background-secondary)); /* Card backgrounds */
background: rgb(var(--surface));              /* Elevated surfaces */
color: rgb(var(--foreground));                /* Primary text */
color: rgb(var(--foreground-secondary));      /* Secondary text */
color: rgb(var(--foreground-muted));          /* Muted text */
border-color: rgb(var(--border));             /* Borders */
```

### Theme Toggle

- Located in Settings page (`/dashboard/settings`) under Appearance tab
- Persisted via localStorage
- Applied via class on `<html>` element

**Files**:
- `components/ui/ThemeToggle.tsx` - Toggle component
- `app/globals.css` - CSS variable definitions

## Reports System

### Brand Story Report

Generate and download brand analysis reports.

| Route | Purpose |
|-------|---------|
| `/dashboard/report` | Report viewer with Download/Share/Print |
| `/api/reports/brand-story` | Generate downloadable report |

### Report Actions

| Action | Implementation |
|--------|---------------|
| Download | POST to `/api/reports/brand-story` → blob download |
| Share | Web Share API with clipboard fallback |
| Print | `window.print()` with print-optimized CSS |

### Print Styles

Print media queries force light mode and hide navigation:

```css
@media print {
  :root, .dark, .dim, .lights-out {
    --background: 255 255 255 !important;
    --foreground: 15 23 42 !important;
    /* ... other overrides */
  }
  nav, aside, .sidebar { display: none !important; }
}
```

**File**: `app/globals.css`

## Docker Services

The main `docker-compose.yml` includes all required services:

| Service | Port | Purpose |
|---------|------|---------|
| MongoDB | 27017 | Primary database (replica set) |
| Redis | 6379 | Caching and queues |
| PostgreSQL | 5432 | Firecrawl internal database |
| Firecrawl | 3002 | Web scraping API |
| Playwright | 3001 | Browser automation |

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View Firecrawl logs
docker-compose logs -f firecrawl
```

## Documentation

See `/docs/` for detailed documentation:
- Architecture
- Deployment Guide
- Local Development
- API Reference

## AEO (AI Exposure Optimization) System

### Overview
The AEO system monitors and optimizes how AI platforms perceive your brand. It includes:
- **Magic Import**: Auto-extract brand data using CrawlerAgent, VibeCheckAgent, CompetitorAgent
- **Perception Scanning**: Query AI platforms and evaluate responses with LLM-as-a-Judge
- **Correction Workflows**: Generate and track fixes for perception issues
- **Dashboard Visualizations**: Charts for quadrant position, metrics, trends

### AEO Routes

| Route | Purpose |
|-------|---------|
| `/dashboard/aeo` | Main AI Perception dashboard |
| `/dashboard/aeo/scan/[scanId]` | Scan results detail page |
| `/dashboard/aeo/insights/[id]` | Insight detail page |
| `/dashboard/aeo/corrections` | Correction workflows list |

**Note**: The AEO dashboard (`/dashboard/aeo`) fetches real scan data from the database. It requires:
- A valid Brand360 profile (created via Magic Import)
- Completed perception scans with valid MongoDB ObjectIDs

### AEO API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/aeo/magic-import` | POST | Extract brand data from website |
| `/api/aeo/prompts/generate` | POST | Generate evaluation prompts |
| `/api/aeo/prompts` | GET/POST/DELETE | Prompt CRUD |
| `/api/aeo/perception-scan` | GET/POST | Start/list scans |
| `/api/aeo/perception-scan/[scanId]` | GET | Scan results with metrics |
| `/api/aeo/insights` | GET/POST | List/create insights |
| `/api/aeo/insights/[insightId]` | GET/PUT/DELETE | Insight CRUD |
| `/api/aeo/insights/[insightId]/dismiss` | POST | Dismiss insight |
| `/api/aeo/corrections` | GET/POST | List/create correction workflows |
| `/api/aeo/corrections/[workflowId]` | GET/PUT/DELETE | Workflow CRUD |
| `/api/aeo/corrections/[workflowId]/approve` | POST | Approve workflow |
| `/api/aeo/corrections/[workflowId]/verify` | POST | Verify after implementation |
| `/api/aeo/reports/summary` | GET | Aggregated perception summary |
| `/api/aeo/reports/export` | POST | Generate PDF/CSV export |
| `/api/aeo/reports/[reportId]` | GET/DELETE | Report status/download |
| `/api/aeo/compare-scans` | POST | Compare two scan results |

### AEO Agents

| Agent | Location | Purpose |
|-------|----------|---------|
| CrawlerAgent | `lib/services/agents/CrawlerAgent.ts` | Crawl websites, extract Schema.org |
| VibeCheckAgent | `lib/services/agents/VibeCheckAgent.ts` | Infer brand personality (Kapferer prism) |
| CompetitorAgent | `lib/services/agents/CompetitorAgent.ts` | Discover competitors |
| PromptGeneratorAgent | `lib/services/agents/PromptGeneratorAgent.ts` | Generate evaluation prompts |
| PerceptionEvaluatorAgent | `lib/services/agents/PerceptionEvaluatorAgent.ts` | LLM-as-a-Judge scoring |
| CorrectionGeneratorAgent | `lib/services/agents/CorrectionGeneratorAgent.ts` | Generate fix suggestions |
| MagicImportOrchestrator | `lib/services/agents/MagicImportOrchestrator.ts` | Coordinate import flow |
| PerceptionScanOrchestrator | `lib/services/agents/PerceptionScanOrchestrator.ts` | Coordinate scan flow |

### AEO Components

| Component | Location | Purpose |
|-----------|----------|---------|
| QuadrantChart | `components/aeo/QuadrantChart.tsx` | Position quadrant visualization |
| MetricsRadarChart | `components/aeo/MetricsRadarChart.tsx` | 5-axis radar chart |
| PlatformComparisonChart | `components/aeo/PlatformComparisonChart.tsx` | Platform score bars |
| ScoreTrendChart | `components/aeo/ScoreTrendChart.tsx` | Historical trend line |
| InsightsPriorityMatrix | `components/aeo/InsightsPriorityMatrix.tsx` | Priority-sorted list |
| CorrectionFunnel | `components/aeo/CorrectionFunnel.tsx` | Workflow status funnel |
| PerceptionScoreCard | `components/aeo/PerceptionScoreCard.tsx` | Hero score display |

### Quadrant Positioning

```
          High Accuracy (>70)
               |
    NICHE      |     DOMINANT
    (hidden    |     (AI champion)
     gem)      |
               |
  -------------+-------------
               |            High Visibility (>50)
    INVISIBLE  |    VULNERABLE
    (needs     |    (at risk)
     work)     |
               |
          Low Accuracy (<50)
```

### Perception Metrics

| Metric | Score Range | What It Measures |
|--------|-------------|------------------|
| Faithfulness | 0-100 | Accuracy to ground truth |
| Share of Voice | 0-100 | Brand visibility, mentions |
| Sentiment | -1 to 1 | Overall sentiment |
| Voice Alignment | 0-100 | Matches brand tone |
| Hallucination | 0-100 | 100 = no hallucinations |

### Correction Problem Types

| Type | Fixes Generated |
|------|-----------------|
| `hallucination` | Schema.org clarification, FAQ content, corrections |
| `missing_info` | Schema.org additions, FAQ expansion, About page |
| `wrong_sentiment` | Tone guidelines, review response templates |
| `competitor_confusion` | Differentiator content, comparison pages |

### AEO Chart Colors

Located in `lib/constants.ts`:
```typescript
export const AEO_CHART_COLORS = {
  // Quadrant colors
  dominant: '#10b981',    // Green
  vulnerable: '#f59e0b',  // Amber
  niche: '#0ea5e9',       // Blue
  invisible: '#ef4444',   // Red
  // Platform colors
  chatgpt: '#10a37f',
  claude: '#d97706',
  gemini: '#4285f4',
  perplexity: '#6366f1',
};
```

### Workflow Status Lifecycle

```
suggested → approved → implemented → verified
                  ↘         ↓
                   → dismissed
```
