# VistralAI - Docker Local Development Guide

This guide will help you run VistralAI locally on your Mac using Docker.

## Prerequisites

- Docker Desktop for Mac installed and running
- At least 4GB RAM allocated to Docker
- At least 10GB free disk space

## Quick Start

### Option 1: Using Docker Compose (Recommended)

**Step 1**: Navigate to the local-dev directory
```bash
cd local-dev
```

**Step 2**: Start the application
```bash
docker-compose up
```

**Alternative**: Run from project root
```bash
docker-compose -f local-dev/docker-compose.yml up
```

**Step 3**: Open your browser
```
http://localhost:3000
```

**Step 4**: Stop the application (when done)
```bash
# Press Ctrl+C in the terminal, then:
docker-compose down
```

### Option 2: Using Docker directly

**Step 1**: Build the development image (from project root)
```bash
docker build -f local-dev/Dockerfile.dev -t vistralai-dev .
```

**Step 2**: Run the container
```bash
docker run -p 3000:3000 \
  -v $(pwd):/app \
  -v /app/node_modules \
  -e NEXTAUTH_URL=http://localhost:3000 \
  -e NEXTAUTH_SECRET=local-dev-secret-change-in-production-min-32-chars \
  --name vistralai-dev \
  vistralai-dev
```

**Step 3**: Open your browser
```
http://localhost:3000
```

## Common Commands

### Docker Compose Commands

```bash
# Start in background (detached mode)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Rebuild containers (after package.json changes)
docker-compose up --build

# Remove all containers and volumes
docker-compose down -v
```

### Docker Commands

```bash
# View running containers
docker ps

# View logs
docker logs -f vistralai-dev

# Stop container
docker stop vistralai-dev

# Remove container
docker rm vistralai-dev

# Remove image
docker rmi vistralai-dev

# Enter container shell (for debugging)
docker exec -it vistralai-dev sh
```

## Development Workflow

### Hot Reloading

The development setup includes hot reloading:
1. Edit any file in your project
2. Save the file
3. Browser automatically refreshes with changes

### Installing New Packages

**Option 1**: Install inside running container
```bash
docker-compose exec vistralai npm install <package-name>
```

**Option 2**: Install locally and rebuild
```bash
npm install <package-name>
docker-compose up --build
```

### Accessing the Application

- **Main App**: http://localhost:3000
- **Login Page**: http://localhost:3000/auth/login
- **Dashboard**: http://localhost:3000/dashboard (after login)

**Demo Credentials**:
- Email: `demo@vistralai.com`
- Password: `demo123`

## Troubleshooting

### Port Already in Use

**Error**: `Bind for 0.0.0.0:3000 failed: port is already allocated`

**Solution**:
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process (replace PID with actual process ID)
kill -9 PID

# Or change the port in docker-compose.yml
ports:
  - "3001:3000"  # Use 3001 instead
```

### Container Won't Start

**Solution 1**: Check Docker Desktop is running
```bash
# Open Docker Desktop app
open -a Docker
```

**Solution 2**: Clear Docker cache
```bash
docker-compose down -v
docker system prune -a
docker-compose up --build
```

### Permission Errors on Mac

**Solution**: Fix file permissions
```bash
sudo chown -R $(whoami) .
```

### Changes Not Reflecting

**Solution 1**: Force rebuild
```bash
docker-compose down
docker-compose up --build
```

**Solution 2**: Clear Next.js cache
```bash
rm -rf .next
docker-compose up --build
```

### Out of Memory

**Solution**: Increase Docker memory allocation
1. Open Docker Desktop
2. Go to Settings → Resources
3. Increase Memory to at least 4GB
4. Click "Apply & Restart"

### Slow Performance on Mac

**Why**: Docker on Mac can be slower due to file system overhead

**Solutions**:

**Option 1**: Use named volumes (already configured)
```yaml
volumes:
  - node_modules:/app/node_modules  # ✓ Already in docker-compose.yml
```

**Option 2**: Enable VirtioFS (Docker Desktop 4.6+)
1. Docker Desktop → Settings → General
2. Enable "VirtioFS accelerated directory sharing"
3. Apply & Restart

**Option 3**: Exclude directories from volume mounts
```yaml
volumes:
  - .:/app
  - /app/node_modules  # Don't sync node_modules
  - /app/.next         # Don't sync .next
```

## Production Build Testing

To test the production build locally:

**Step 1**: Build production image
```bash
docker build -t vistralai-prod .
```

**Step 2**: Run production container
```bash
docker run -p 8080:8080 \
  -e NEXTAUTH_URL=http://localhost:8080 \
  -e NEXTAUTH_SECRET=$(openssl rand -base64 32) \
  vistralai-prod
```

**Step 3**: Open browser
```
http://localhost:8080
```

## Environment Variables

### Required Variables

- `NEXTAUTH_URL` - URL where app is running (default: http://localhost:3000)
- `NEXTAUTH_SECRET` - Secret for JWT signing (min 32 characters)

### Optional Variables

Create a `.env.local` file for additional variables:
```bash
# Copy example file
cp .env.local.example .env.local

# Edit as needed
nano .env.local
```

**Note**: `.env.local` is gitignored and won't be committed.

## Docker Compose Configuration Explained

```yaml
services:
  vistralai:
    build:
      context: .               # Build from current directory
      dockerfile: Dockerfile.dev  # Use dev Dockerfile

    ports:
      - "3000:3000"           # Map host:container port

    volumes:
      - .:/app                # Mount code for hot reload
      - node_modules:/app/node_modules  # Named volume for speed

    environment:
      - NODE_ENV=development  # Development mode
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=...   # Auth secret

    restart: unless-stopped   # Auto-restart on crash

    healthcheck:
      test: ["CMD", "wget", ...]  # Health check endpoint
      interval: 30s                # Check every 30s
```

## Differences: Development vs Production

| Feature | Development (Dockerfile.dev) | Production (Dockerfile) |
|---------|------------------------------|-------------------------|
| **Image Size** | ~500MB | ~150MB |
| **Hot Reload** | ✅ Yes | ❌ No |
| **Optimization** | Minimal | Multi-stage build |
| **Node Modules** | All dependencies | Production only |
| **Port** | 3000 | 8080 |
| **Rebuild Time** | Fast (cached layers) | Slower (full build) |
| **Use Case** | Local development | Cloud Run deployment |

## Performance Tips for Mac

1. **Use named volumes** for `node_modules` (✓ already configured)
2. **Enable VirtioFS** in Docker Desktop settings
3. **Allocate more resources**: 4GB RAM, 2 CPUs minimum
4. **Exclude build artifacts** from volume mounts
5. **Use `.dockerignore`** to exclude unnecessary files (✓ already configured)

## Next Steps

### After Getting it Running

1. **Explore the App**: Navigate to all pages and features
2. **Make Changes**: Edit a component and see hot reload in action
3. **Check Logs**: Use `docker-compose logs -f` to debug
4. **Add Features**: Modify code and test locally before deploying

### Moving to Production

When ready to deploy to Cloud Run:
```bash
# Use production Dockerfile
docker build -t gcr.io/vistralai/vistralai .

# Or use deploy script
./deploy.sh
```

## Additional Resources

- [Docker Desktop for Mac](https://docs.docker.com/desktop/mac/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)
- [VistralAI Deployment Guide](DEPLOYMENT.md)

## Getting Help

**Common Issues**:
1. Port conflicts → Change port in docker-compose.yml
2. Permission errors → Run `sudo chown -R $(whoami) .`
3. Out of memory → Increase Docker memory allocation
4. Slow performance → Enable VirtioFS, use named volumes

**Still having issues?**
- Check Docker Desktop is running
- Restart Docker Desktop
- Run `docker system prune -a` to clean up
- Check the main README.md for more info

---

**Happy Coding! 🚀**
