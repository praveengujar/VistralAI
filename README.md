# VistralAI

AI Visibility Optimization Platform — Monitor and optimize how AI platforms perceive your brand.

## Features

- **Magic Import**: Auto-extract brand data from any website
- **AI Perception Scanning**: Evaluate brand perception across ChatGPT, Claude, Gemini, Perplexity
- **Correction Workflows**: AI-generated fixes for perception issues
- **Brand 360 Profile**: Comprehensive semantic ground truth engine
- **Interactive Dashboards**: Real-time metrics, quadrant positioning, trend analysis

## Tech Stack

Next.js 14 · TypeScript · Tailwind CSS · MongoDB · Prisma · NextAuth.js · OpenAI API · Firecrawl · Google Cloud Run

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your credentials

# 3. Start services (requires Docker)
docker-compose -f docker-compose.mongodb.yml up -d
docker-compose up -d

# 4. Generate Prisma client
npx prisma generate

# 5. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

```env
# Required
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret
DATABASE_URL=mongodb://vistralai:vistralai_dev_password@localhost:27017/vistralai?authSource=admin&replicaSet=rs0&directConnection=true
DATABASE_MODE=mongodb

# AI Features
OPENAI_API_KEY=your-key
FIRECRAWL_INTERNAL_URL=http://localhost:3002
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | Lint code |
| `./deploy.sh` | Deploy to Cloud Run |

## Documentation

See [`/docs`](./docs) for detailed guides:
- Architecture
- API Reference
- Deployment Guide
- Local Development

## License

Proprietary — All rights reserved
