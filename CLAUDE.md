# VistralAI Development Reference

## Architecture

### Database Adapter Pattern
```typescript
// lib/db/index.ts - Switch via DATABASE_MODE env var
const DATABASE_MODE = process.env.DATABASE_MODE || 'mock';
// Values: 'mongodb' | 'postgres' | 'mock'
```

### Data Flow
```
Website URL → Firecrawl (crawl) → BrandIntelligence (GPT-4o-mini) → Brand360Profile → MongoDB
```

### Key Services
| Service | Path |
|---------|------|
| BrandIntelligence | `lib/services/llm/BrandIntelligence.ts` |
| WebCrawler | `lib/services/crawler/WebCrawler.ts` |
| Website Analyzer | `lib/ai/website-analyzer.ts` |

---

## Critical Patterns

### Prisma Embedded Documents (MongoDB)
Always use nested objects for embedded types:

```typescript
// CORRECT
brandVoice: { tone: ['professional'], keywords: ['innovative'], avoidWords: [] }
pricing: { currency: 'USD', amount: 99, billingPeriod: 'monthly' }

// WRONG - causes "Unknown argument" errors
voiceTone: ['professional']
pricingCurrency: 'USD'
```
**Files**: `lib/db/operations.ts`

### Theme CSS Variables
```css
background: rgb(var(--background));
background: rgb(var(--surface));
color: rgb(var(--foreground));
color: rgb(var(--foreground-secondary));
border-color: rgb(var(--border));
```

| Theme | CSS Class | Background |
|-------|-----------|------------|
| Morning | `.light` | #FFFFFF |
| Evening | `.dim` | #15202B |
| Night | `.lights-out` | #000000 |

---

## API Routes

### Brand 360
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/brand-360` | GET | Get complete Brand 360 data |
| `/api/brand-360/analyze-website` | POST | Analyze website URL |
| `/api/brand-360/identity` | POST/PUT | Brand identity CRUD |
| `/api/brand-360/products` | POST/PUT/DELETE | Products CRUD |
| `/api/brand-360/competitors` | POST/PUT/DELETE | Competitors CRUD |

### AEO System
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/aeo/magic-import` | POST | Extract brand data from website |
| `/api/aeo/perception-scan` | GET/POST | Start/list perception scans |
| `/api/aeo/perception-scan/[scanId]` | GET | Scan results with metrics |
| `/api/aeo/insights` | GET/POST | Perception insights CRUD |
| `/api/aeo/corrections` | GET/POST | Correction workflows CRUD |
| `/api/aeo/prompts/generate` | POST | Generate evaluation prompts |

---

## Key Components

| Component | Path | Purpose |
|-----------|------|---------|
| DashboardLayout | `components/layout/` | Main layout wrapper |
| BrandStoryVisualizer | `components/dashboard/` | Narrative arc with consistency scores |
| QuadrantChart | `components/aeo/` | Position quadrant visualization |
| MetricsRadarChart | `components/aeo/` | 5-axis radar chart |
| ThemeSettings | `components/settings/` | Morning/Evening/Night toggle |

---

## AEO Agents

| Agent | Path | Purpose |
|-------|------|---------|
| CrawlerAgent | `lib/services/agents/CrawlerAgent.ts` | Crawl + Schema.org extraction |
| VibeCheckAgent | `lib/services/agents/VibeCheckAgent.ts` | Brand personality inference |
| CompetitorAgent | `lib/services/agents/CompetitorAgent.ts` | Competitor discovery |
| PerceptionEvaluatorAgent | `lib/services/agents/PerceptionEvaluatorAgent.ts` | LLM-as-a-Judge scoring |
| MagicImportOrchestrator | `lib/services/agents/MagicImportOrchestrator.ts` | Coordinates import flow |

### Perception Metrics
| Metric | Range | Measures |
|--------|-------|----------|
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

## Docker Services

| Service | Port | Compose File |
|---------|------|--------------|
| MongoDB | 27017 | `docker-compose.mongodb.yml` |
| Mongo Express | 8081 | `docker-compose.mongodb.yml` |
| Firecrawl | 3002 | `docker-compose.yml` |
| Redis | 6379 | `docker-compose.yml` |
| PostgreSQL | 5432 | `docker-compose.yml` |
| Playwright | 3001 | `docker-compose.yml` |

---

## Debugging

```bash
# MongoDB shell
docker exec vistralai-mongodb mongosh -u vistralai -p vistralai_dev_password --authenticationDatabase admin vistralai

# View logs
docker-compose logs -f firecrawl
gcloud run logs read vistralai --region us-central1 --limit 50
```

---

## Common Issues

| Issue | Solution |
|-------|----------|
| `Unknown argument voiceTone` | Use nested `brandVoice: { tone, keywords, avoidWords }` |
| `Unknown argument pricingCurrency` | Use nested `pricing: { currency, amount, billingPeriod }` |
| Database not persisting | Set `DATABASE_MODE=mongodb` |
| Firecrawl not working | Check Docker container on port 3002 |
| Auth redirect loop | Verify `NEXTAUTH_URL` matches actual URL |
| AEO dashboard empty | Complete Magic Import first to create Brand360 profile |
| MongoDB password error | MongoDB uses `password` field, not `passwordHash` |
