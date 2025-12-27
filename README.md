# VistralAI

AI Visibility Optimization Platform - Monitor and optimize your brand's presence across AI chat interfaces.

## Features

- **Brand 360 Profile**: Comprehensive semantic ground truth engine
- **AI Perception Scanning**: Evaluate how AI platforms perceive your brand
- **Magic Import**: Auto-extract brand data from websites using AI agents
- **Correction Workflows**: Generate and track fixes for AI perception issues
- **Dashboard Visualizations**: Real-time metrics with interactive charts
- **Brand Story Reports**: Download, share, and print brand analysis reports
- **Theme System**: Light, Dim (navy), and Lights Out (pure black) modes

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB + Prisma ORM
- **Auth**: NextAuth.js
- **AI**: OpenAI API + Firecrawl
- **Charts**: Recharts + Framer Motion
- **Deployment**: Google Cloud Run

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start all services (MongoDB, Redis, Firecrawl - requires Docker)
docker-compose up -d

# Generate Prisma client
npx prisma generate

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

```env
# Required
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
DATABASE_URL=mongodb://vistralai:vistralai_dev_password@localhost:27017/vistralai?authSource=admin&replicaSet=rs0&directConnection=true

# Database Mode: "postgres" | "mongodb" | "mock"
DATABASE_MODE=mongodb

# Optional - for AI features
OPENAI_API_KEY=your-key
USE_REAL_API=true
USE_FIRECRAWL=true
FIRECRAWL_INTERNAL_URL=http://localhost:3002
```

## Project Structure

```
app/
  api/
    aeo/                # AEO API routes
      corrections/      # Correction workflow CRUD
      insights/         # Perception insights CRUD
      magic-import/     # Brand data extraction
      perception-scan/  # AI platform scanning
      prompts/          # Prompt generation
      reports/          # Summary & export
      compare-scans/    # Scan comparison
    auth/               # NextAuth endpoints
    brand-360/          # Brand profile CRUD
    reports/            # Brand Story Report generation
      brand-story/      # POST: Generate downloadable report
  auth/                 # Login/register pages
  dashboard/
    aeo/                # AI Perception dashboard
    brand-profile/      # Brand 360 pages
    report/             # Brand Story Report viewer
    settings/           # User settings & appearance
  onboarding/           # User onboarding flow

components/
  aeo/                  # AEO visualization components
    QuadrantChart       # Position quadrant (Dominant/Vulnerable/Niche/Invisible)
    MetricsRadarChart   # 5-axis radar for evaluation metrics
    PlatformComparisonChart  # Platform score comparison
    ScoreTrendChart     # Historical score trends
    InsightsPriorityMatrix   # Priority-sorted insights
    CorrectionFunnel    # Workflow status funnel
    PerceptionScoreCard # Hero score display
  brand-360/            # Brand profile components
  dashboard/            # Dashboard widgets
  layout/               # Layout components
  reporting/            # Report components
    BrandStoryReport    # Downloadable report with Download/Share/Print
  ui/                   # Reusable UI components
    ThemeToggle         # Light/Dim/Lights Out theme switcher

lib/
  services/
    agents/             # AI agents
      CrawlerAgent      # Website crawling + Schema.org extraction
      VibeCheckAgent    # Brand personality inference
      CompetitorAgent   # Competitor discovery
      PromptGeneratorAgent      # Generate evaluation prompts
      PerceptionEvaluatorAgent  # LLM-as-a-Judge scoring
      CorrectionGeneratorAgent  # Generate fix suggestions
      MagicImportOrchestrator   # Coordinates import agents
      PerceptionScanOrchestrator # Coordinates scan flow
  db/                   # Database operations
  ai/                   # Website analyzer
```

## AEO (AI Exposure Optimization) System

### Perception Scanning
Evaluate how AI platforms (ChatGPT, Claude, Gemini, Perplexity) perceive your brand using 5 metrics:
- **Faithfulness** (0-100): Accuracy to ground truth
- **Share of Voice** (0-100): Brand visibility and mentions
- **Sentiment** (-1 to 1): Overall sentiment analysis
- **Voice Alignment** (0-100): Matches brand tone
- **Hallucination Score** (0-100): 100 = no hallucinations

### Quadrant Positioning
Brands are positioned in one of four quadrants based on accuracy and visibility:
- **Dominant**: High accuracy + High visibility (AI champion)
- **Vulnerable**: Low accuracy + High visibility (at risk)
- **Niche**: High accuracy + Low visibility (hidden gem)
- **Invisible**: Low accuracy + Low visibility (needs work)

### Correction Workflows
Problem types with auto-generated fixes:
- `hallucination`: Schema.org clarification, FAQ content
- `missing_info`: Schema.org additions, About page updates
- `wrong_sentiment`: Tone guidelines, review response templates
- `competitor_confusion`: Differentiator content, comparison pages

## Commands

```bash
npm run dev       # Development server
npm run build     # Production build
npm run start     # Production server
npm run lint      # Lint code
```

## Deployment

```bash
# Deploy to Cloud Run
./deploy.sh
```

## Documentation

See `/docs` for detailed documentation:
- Architecture
- API Reference
- Deployment Guide
- Local Development

## Development Notes

### Prisma Embedded Documents (MongoDB)

MongoDB uses embedded document types. Always use nested objects in database operations:

```typescript
// BrandIdentity - nested brandVoice
brandVoice: {
  tone: ['professional', 'friendly'],
  keywords: ['innovative', 'trusted'],
  avoidWords: [],
}

// ProductDetail - nested pricing
pricing: {
  currency: 'USD',
  amount: 99,
  billingPeriod: 'monthly',
}
```

See `lib/db/operations.ts` for implementation patterns.

### URL Handling

Magic Import API (`/api/aeo/magic-import`) normalizes URLs automatically:
- `loom.com` → `https://loom.com`
- `www.loom.com` → `https://www.loom.com`
- `http://loom.com` → kept as-is

### Recent Fixes (December 2024)
- Fixed Prisma schema mismatch for `brandVoice` and `pricing` embedded types
- Added URL normalization in Magic Import API
- AEO dashboard now fetches real scan data instead of mock data
- Added Twitter-style theme system (Light, Dim, Lights Out)
- Implemented Brand Story Report with Download/Share/Print functionality
- Added print-optimized CSS that forces light mode for printing
- Dark mode compatibility fixes across all dashboard components

## Theme System

Three appearance options accessible from Settings:

| Theme | Background | Best For |
|-------|------------|----------|
| Light | White (#FFFFFF) | Daytime, bright environments |
| Dim | Navy blue (#15202B) | Low light, reduced eye strain |
| Lights Out | Pure black (#000000) | OLED screens, night mode |

Theme preference is stored in localStorage and applied via CSS class on `<html>`.

## Reports

The Brand Story Report (`/dashboard/report`) provides:
- **Download**: Generates .txt report via `/api/reports/brand-story`
- **Share**: Uses Web Share API or copies link to clipboard
- **Print**: Browser print dialog with light-mode optimized CSS

## License

Proprietary - All rights reserved
