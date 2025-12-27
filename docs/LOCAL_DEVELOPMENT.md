# Local Development Setup

Complete guide to run VistralAI locally with all dependencies.

## Architecture

**Hybrid Development Setup:**
- **VistralAI**: Runs with `npm run dev` (fast hot-reload)
- **Firecrawl + Redis + Playwright**: Run in Docker (isolated services)

## Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
- **OpenAI API Key** - [Get one](https://platform.openai.com/api-keys)

## Quick Start

### 1. Start Docker Services

```bash
# Start Firecrawl, Redis, and Playwright
docker-compose up -d

# Check services are running
docker-compose ps

# View logs (optional)
docker-compose logs -f
```

**Expected output:**
```
NAME                    STATUS
vistralai-firecrawl     Up (healthy)
vistralai-playwright    Up (healthy)
vistralai-redis         Up (healthy)
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
| **Firecrawl** | http://localhost:3002 | Web scraping API |
| **Redis** | localhost:6379 | Cache and queue |

## Verify Setup

### 1. Check Docker Services

```bash
# All services should be healthy
docker-compose ps

# Test Firecrawl directly
curl http://localhost:3002/
# Should return: "ok"

# Test Redis
docker exec vistralai-redis redis-cli ping
# Should return: "PONG"
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
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f firecrawl
docker-compose logs -f redis

# Rebuild services (if images updated)
docker-compose up -d --build

# Clean up everything (including volumes)
docker-compose down -v
```

## Troubleshooting

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

# Or change ports in docker-compose.yml
```

### Docker services won't start

```bash
# Clean up and restart
docker-compose down -v
docker-compose up -d

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

**Redis:**
```bash
# Connect to Redis CLI
docker exec -it vistralai-redis redis-cli

# List all keys
KEYS *

# Get a key value
GET somekey
```

## Configuration

### Environment Variables

Edit `.env.local` to configure:

```env
# Enable/disable features
USE_FIRECRAWL=true        # Use real Firecrawl (vs mock)
USE_REAL_API=true         # Use real OpenAI API (vs mock)

# Service URLs
FIRECRAWL_INTERNAL_URL=http://localhost:3002
REDIS_URL=redis://localhost:6379

# API Keys
OPENAI_API_KEY=sk-...     # Your OpenAI API key
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

1. Check logs: `docker-compose logs -f`
2. Verify .env.local configuration
3. Restart services: `docker-compose restart`
4. Clean slate: `docker-compose down -v && docker-compose up -d`

Happy coding! 🚀
