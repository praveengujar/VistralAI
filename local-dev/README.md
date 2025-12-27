# VistralAI - Local Development Setup

This directory contains all the files needed to run VistralAI locally on your Mac using Docker.

## 📁 Files in this Directory

- **`Dockerfile.dev`** - Development-optimized Dockerfile with hot reloading
- **`docker-compose.yml`** - Docker Compose configuration for easy startup
- **`start.sh`** - Quick start script (recommended)
- **`stop.sh`** - Stop containers script
- **`clean.sh`** - Clean up script (removes all data)
- **`.env.local`** - Local environment variables (gitignored)
- **`.env.local.example`** - Template for environment variables
- **`README.docker.md`** - Complete documentation and troubleshooting guide

## 🚀 Quick Start

### Prerequisites
- Docker Desktop for Mac installed and running
- At least 4GB RAM allocated to Docker

### Start the Application

**Option 1: Use the start script (recommended)**
```bash
cd local-dev
./start.sh
```

**Option 2: Use docker-compose directly**
```bash
cd local-dev
docker-compose up
```

**Option 3: From the project root**
```bash
docker-compose -f local-dev/docker-compose.yml up
```

### Access the Application
Open your browser and navigate to:
```
http://localhost:3000
```

### Demo Login Credentials
- **Email**: `demo@vistralai.com`
- **Password**: `demo123`

## 🛑 Stop the Application

**Option 1: Use the stop script**
```bash
./stop.sh
```

**Option 2: Manual stop**
Press `Ctrl+C` in the terminal, then:
```bash
docker-compose down
```

## 📚 Full Documentation

For complete documentation including troubleshooting, performance tips, and advanced usage, see:

**[README.docker.md](README.docker.md)** - Complete guide with:
- Detailed setup instructions
- All Docker commands
- Troubleshooting guide
- Performance optimization
- Production build testing
- Environment variables explained

## 🔧 Common Commands

### Using Helper Scripts (Recommended)

```bash
# Start development environment
./start.sh

# Stop containers
./stop.sh

# Clean everything (removes volumes and cache)
./clean.sh
```

### Using Docker Compose Directly

```bash
# Start in foreground (see logs)
docker-compose up

# Start in background (detached mode)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Rebuild (after package.json changes)
docker-compose up --build

# Clean up everything
docker-compose down -v
```

## ⚙️ Configuration

### Environment Variables

The `.env.local` file contains local development environment variables:

```bash
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=local-dev-secret-change-in-production-min-32-chars
```

To customize, edit `.env.local` or copy from the example:
```bash
cp .env.local.example .env.local
```

### Port Configuration

To change the port (e.g., if 3000 is already in use):

Edit `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Use port 3001 instead
```

Then update `.env.local`:
```bash
NEXTAUTH_URL=http://localhost:3001
```

## 🆚 Development vs Production

This setup is for **local development only**.

| Feature | Local Dev | Production (Cloud Run) |
|---------|-----------|------------------------|
| Dockerfile | `Dockerfile.dev` | `Dockerfile` |
| Port | 3000 | 8080 |
| Hot Reload | ✅ Yes | ❌ No |
| Image Size | ~500MB | ~150MB |
| Build Speed | Fast | Optimized |
| Use Case | Coding & Testing | Deployment |

For production deployment, use the main `Dockerfile` and `deploy.sh` script in the project root.

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process or change port in docker-compose.yml
```

### Container Won't Start
```bash
# Clean up and rebuild
docker-compose down -v
docker-compose up --build
```

### Slow Performance
1. Open Docker Desktop → Settings → Resources
2. Increase Memory to 4GB
3. Enable "VirtioFS accelerated directory sharing" in Settings → General

For more troubleshooting, see [README.docker.md](README.docker.md).

## 📖 Next Steps

1. ✅ Start the app: `./start.sh` (or `docker-compose up`)
2. 🌐 Open browser: http://localhost:3000
3. 🔐 Login with demo credentials
4. ✏️ Edit code and see hot reload in action
5. 📊 Explore dashboard and features
6. 🛑 Stop when done: `./stop.sh` (or Ctrl+C + `docker-compose down`)

## 🆘 Need Help?

- Check [README.docker.md](README.docker.md) for detailed docs
- Verify Docker Desktop is running
- Ensure you have at least 4GB RAM allocated
- Run `docker system prune -a` to clean up Docker cache

---

**Happy Coding! 🚀**
