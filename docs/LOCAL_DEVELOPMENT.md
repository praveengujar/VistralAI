# Local Development Setup

Complete guide to run VistralAI locally with all dependencies.

## Architecture

**Hybrid Development Setup:**
- **VistralAI**: Runs with `npm run dev` (fast hot-reload)
- **MongoDB + Redis**: Run in Docker (data layer)
- **Firecrawl + Playwright**: Optional Docker services for web crawling

## Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
- **Anthropic API Key** - [Get one](https://console.anthropic.com/)

## Quick Start

### 1. Start Docker Services

```bash
# Start MongoDB, Redis, and admin UIs
docker-compose -f docker-compose.mongodb.yml up -d

# Check services are running
docker-compose -f docker-compose.mongodb.yml ps

# View logs (optional)
docker-compose -f docker-compose.mongodb.yml logs -f
```

**Expected output:**
```
NAME                    STATUS
vistralai-mongodb       Up (healthy)
vistralai-redis         Up (healthy)
vistralai-mongo-express Up
vistralai-redis-commander Up
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start VistralAI

```bash
npm run dev
```

**VistralAI will be available at:** http://localhost:3000

## Service Endpoints

| Service | URL | Description |
|---------|-----|-------------|
| **VistralAI** | http://localhost:3000 | Main application |
| **MongoDB** | localhost:27017 | Primary database |
| **Mongo Express** | http://localhost:8081 | MongoDB admin UI |
| **Redis** | localhost:6379 | Cache and queue |
| **Redis Commander** | http://localhost:8082 | Redis admin UI |
| **Firecrawl** | http://localhost:3002 | Web scraping API (optional) |

## Verify Setup

### 1. Check Docker Services

```bash
# All services should be healthy
docker-compose -f docker-compose.mongodb.yml ps

# Test MongoDB
docker exec vistralai-mongodb mongosh -u vistralai -p vistralai_dev_password --authenticationDatabase admin --eval "db.runCommand({ping:1})"
# Should return: { ok: 1 }

# Test Redis
docker exec vistralai-redis redis-cli ping
# Should return: "PONG"

# Access admin UIs
# MongoDB: http://localhost:8081
# Redis: http://localhost:8082
```

### 2. Test VistralAI

1. Open http://localhost:3000
2. Login with demo account:
   - Email: `demo@vistralai.com`
   - Password: `demo123`
3. Go to onboarding and try analyzing a website

## Common Commands

```bash
# Start services
docker-compose -f docker-compose.mongodb.yml up -d

# Stop services
docker-compose -f docker-compose.mongodb.yml down

# Restart services
docker-compose -f docker-compose.mongodb.yml restart

# View logs
docker-compose -f docker-compose.mongodb.yml logs -f mongodb
docker-compose -f docker-compose.mongodb.yml logs -f redis

# Clean up everything (including volumes)
docker-compose -f docker-compose.mongodb.yml down -v

# Start Firecrawl services (for web crawling)
docker-compose up -d
```

## Troubleshooting

### MongoDB connection issues

```bash
# Check MongoDB logs
docker-compose -f docker-compose.mongodb.yml logs mongodb

# Verify replica set status
docker exec vistralai-mongodb mongosh -u vistralai -p vistralai_dev_password --authenticationDatabase admin --eval "rs.status()"

# Restart MongoDB with fresh data
docker-compose -f docker-compose.mongodb.yml down -v
docker-compose -f docker-compose.mongodb.yml up -d
```

### Firecrawl not responding

```bash
# Check Firecrawl logs
docker-compose logs firecrawl

# Common issue: Redis connection timeout
# Solution: Restart services
docker-compose restart
```

### Port conflicts

If ports are already in use:

```bash
# Check what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change ports in docker-compose.mongodb.yml
```

### Docker services won't start

```bash
# Clean up and restart
docker-compose -f docker-compose.mongodb.yml down -v
docker-compose -f docker-compose.mongodb.yml up -d

# If still failing, check Docker Desktop is running
# and has enough resources (8GB RAM recommended)
```

### Firecrawl crawls are slow

First request to Firecrawl may take 10-30 seconds (cold start).
Subsequent requests should be faster.

To keep services warm:
```bash
# Increase min instances (optional, uses more resources)
# Edit docker-compose.yml and add under firecrawl:
deploy:
  replicas: 1
```

## Development Workflow

### Making Code Changes

VistralAI uses Next.js hot reload - changes appear instantly:

1. Edit files in `app/`, `components/`, `lib/`
2. Save the file
3. Browser auto-refreshes

No need to restart the server!

### Debugging

**VistralAI:**
```bash
# View server logs
# Terminal shows Next.js dev server output
```

**Firecrawl:**
```bash
# View Firecrawl logs
docker-compose logs -f firecrawl

# Increase logging level
# Edit docker-compose.yml:
LOGGING_LEVEL: 'debug'
```

**MongoDB:**
```bash
# Connect to MongoDB shell
docker exec vistralai-mongodb mongosh -u vistralai -p vistralai_dev_password --authenticationDatabase admin vistralai

# List collections
show collections

# Query brand profiles
db.Brand360Profile.find().pretty()
```

**Redis:**
```bash
# Connect to Redis CLI
docker exec -it vistralai-redis redis-cli

# List all keys
KEYS *

# Get a key value
GET somekey

# Or use Redis Commander at http://localhost:8082
```

## Configuration

### Environment Variables

Edit `.env.local` to configure:

```env
# Database Mode
DATABASE_MODE=mongodb     # Options: mongodb, postgres, mock

# Service URLs
DATABASE_URL=mongodb://vistralai:vistralai_dev_password@localhost:27017/vistralai?authSource=admin&replicaSet=rs0
FIRECRAWL_INTERNAL_URL=http://localhost:3002
REDIS_URL=redis://localhost:6379

# API Keys
ANTHROPIC_API_KEY=sk-ant-...     # Your Anthropic API key
FIRECRAWL_API_KEY=fc-...         # Firecrawl API key (if using cloud)

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

### Firecrawl Settings

Edit `docker-compose.yml` under `firecrawl` service:

```yaml
NUM_WORKERS_PER_QUEUE: '4'    # Crawl concurrency
LOGGING_LEVEL: 'info'         # Log verbosity
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific test
npm test -- FirecrawlService.test.ts

# Run with coverage
npm test -- --coverage
```

## Stopping Everything

```bash
# Stop Docker services
docker-compose -f docker-compose.mongodb.yml down

# Stop Firecrawl services (if running)
docker-compose down

# Stop VistralAI
# Press Ctrl+C in the terminal running npm run dev
```

## Performance Tips

1. **Allocate enough Docker resources**
   - Docker Desktop → Settings → Resources
   - Recommended: 8GB RAM, 4 CPUs

2. **Use SSD for Docker volumes**
   - Faster crawling and Redis performance

3. **Keep services running**
   - Docker cold starts add 10-30 seconds
   - Use `docker-compose up -d` to run in background

## Next Steps

- Read [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for system design
- Read [USER_GUIDE.md](./docs/USER_GUIDE.md) for features
- Read [DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) for production deployment

## Support

If you encounter issues:

1. Check logs: `docker-compose -f docker-compose.mongodb.yml logs -f`
2. Verify .env.local configuration
3. Restart services: `docker-compose -f docker-compose.mongodb.yml restart`
4. Clean slate: `docker-compose -f docker-compose.mongodb.yml down -v && docker-compose -f docker-compose.mongodb.yml up -d`

---

**Last Updated**: December 2024
