# VistralAI

AI Visibility Optimization Platform — Monitor and optimize how AI platforms perceive your brand.

## Features

- **Magic Import**: Auto-extract brand data from any website
- **AI Perception Scanning**: Evaluate brand perception across ChatGPT, Claude, Gemini, Perplexity
- **Real-Time Updates**: WebSocket-powered scan progress and insights
- **Correction Workflows**: AI-generated fixes for perception issues
- **Brand 360 Profile**: Comprehensive semantic ground truth engine
- **Target Audience & Personas**: AI-generated customer personas with pain points
- **Market Positioning**: Positioning statements, value propositions, and proof points
- **Interactive Dashboards**: Quadrant positioning, radar charts, trend analysis

## Tech Stack

Next.js 14 · TypeScript · React Query · Tailwind CSS · MongoDB · Redis · Prisma · Socket.io · NextAuth.js · OpenAI API

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
components/           # React components
├── audience/         # PersonaCard, PersonaForm
└── positioning/      # PositioningStatement, ValuePropositionCards
lib/
├── api/              # API middleware
├── cache/            # Redis caching layer
├── db/operations/    # Database operations
├── hooks/            # Custom React hooks
├── query/            # React Query setup (hooks.ts, audienceHooks.ts)
├── realtime/         # WebSocket support
├── services/agents/  # AI agents (ProductExtractor, AudiencePositioning)
└── utils/            # Utilities & lazy loading
prisma/               # Database schema
```

## Documentation

See [`/docs`](./docs) for detailed guides:
- [Architecture](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API_REFERENCE.md)
- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)
- [Local Development](./docs/LOCAL_DEVELOPMENT.md)
- [Diagram Prompts](./docs/DIAGRAM_PROMPTS.md)

## License

Proprietary — All rights reserved
