# VistralAI

AI Visibility Optimization Platform — Monitor and optimize how AI platforms perceive your brand.

## Features

- **Unified Onboarding**: Streamlined 6-step flow (Brand → Plan → Payment → Profile → Scan → Complete)
- **Magic Import**: Auto-extract brand data from any website with real-time progress
- **AI Perception Scanning**: Evaluate brand perception across ChatGPT, Claude, Gemini, Perplexity
- **Real-Time Updates**: WebSocket-powered scan progress and insights
- **Correction Workflows**: AI-generated fixes for perception issues
- **Brand 360 Profile**: Comprehensive semantic ground truth engine
- **Target Audience & Personas**: AI-generated customer personas with pain points
- **Market Positioning**: Positioning statements, value propositions, and proof points
- **Review Website Integration**: Industry-specific review site references (G2, Trustpilot, CNET, etc.)
- **Interactive Dashboards**: Quadrant positioning, radar charts, trend analysis
- **Subscription Management**: Three-tier pricing (Monitor, Growth, Dominance) with Stripe
- **Payment Methods**: Credit/debit cards, Apple Pay, Google Pay, PayPal
- **15-Day Free Trial**: All plans include trial period

## Tech Stack

Next.js 14 · TypeScript · React Query · Tailwind CSS · MongoDB · Redis · Prisma · Socket.io · NextAuth.js · OpenAI API · Stripe

## Quick Start

```bash
# Install dependencies
npm install

# Start MongoDB + Redis
docker-compose -f docker-compose.mongodb.yml up -d

# Generate Prisma client
npx prisma generate

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Local Services

| Service | URL | Purpose |
|---------|-----|---------|
| App | http://localhost:3000 | VistralAI application |
| Mongo Express | http://localhost:8081 | MongoDB admin UI |
| Redis Commander | http://localhost:8082 | Redis admin UI |

## Environment Variables

Create `.env.local` with:

```env
# Required
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
DATABASE_URL=mongodb://vistralai:vistralai_dev_password@localhost:27017/vistralai?authSource=admin&replicaSet=rs0
DATABASE_MODE=mongodb
REDIS_URL=redis://localhost:6379

# AI Features
OPENAI_API_KEY=your-openai-key
FIRECRAWL_INTERNAL_URL=http://localhost:3002

# Stripe Payments
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run type-check` | TypeScript validation |
| `npm run lint` | Lint code |
| `./deploy.sh` | Deploy to Cloud Run |

## Project Structure

```
app/                  # Next.js App Router pages
├── api/brand-360/    # Brand 360 API routes
│   ├── audience/     # Target audience endpoints
│   ├── personas/     # Customer personas CRUD
│   └── positioning/  # Market positioning endpoints
├── api/onboarding/   # Unified onboarding API
│   ├── session/      # Session management
│   ├── brand/        # Brand name + URL save
│   ├── plan/         # Plan selection
│   ├── payment/      # Subscription creation
│   ├── profile/      # Magic Import trigger
│   ├── scan/         # First perception scan
│   └── complete/     # Finalization
├── api/review-sites/ # Review website integration
├── onboarding/       # Onboarding pages (route group)
│   └── (steps)/      # Brand, Plan, Payment, Profile, Scan, Complete
components/           # React components
├── audience/         # PersonaCard, PersonaForm
├── positioning/      # PositioningStatement, ValuePropositionCards
├── aeo/              # ReviewSiteSelector, CategoryMappingManager
├── onboarding/unified/ # Unified onboarding flow components
└── payments/         # PaymentForm, ExpressCheckout, PricingPage
lib/
├── api/              # API middleware
├── cache/            # Redis caching layer
├── config/           # Configuration (pricing.ts, onboarding.ts)
├── db/operations/    # Database operations
├── hooks/            # Custom React hooks
├── query/            # React Query (hooks.ts, audienceHooks.ts, onboardingHooks.ts)
├── realtime/         # WebSocket support (onboarding-events.ts)
├── services/
│   ├── agents/       # AI agents (MagicImportOrchestrator, etc.)
│   ├── onboarding/   # OnboardingService (session management)
│   └── payments/     # StripeService, SubscriptionService
└── utils/            # Utilities & lazy loading
prisma/               # Database schema (OnboardingSession, OnboardingEvent)
```

## Payment Integration

VistralAI uses Stripe for payment processing with support for:
- Credit/debit cards
- Apple Pay (Safari/iOS)
- Google Pay (Chrome/Android)
- PayPal (alternative provider)

### Pricing Tiers

| Tier | Monthly | Yearly | Discount |
|------|---------|--------|----------|
| Monitor | $99 | $1,045 | 12% |
| Growth | $299 | $3,050 | 15% |
| Dominance | $999 | $9,830 | 18% |

### Stripe Setup

1. Get API keys from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Add keys to `.env.local` (see Environment Variables above)
3. Enable payment methods in Stripe Dashboard > Settings > Payment methods
4. For webhooks, run: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

## Documentation

See [`/docs`](./docs) for detailed guides:
- [Architecture](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API_REFERENCE.md)
- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)
- [Local Development](./docs/LOCAL_DEVELOPMENT.md)
- [Diagram Prompts](./docs/DIAGRAM_PROMPTS.md)

## License

Proprietary — All rights reserved
