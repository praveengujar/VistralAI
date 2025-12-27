# 🚀 Getting Started with VistralAI Local Development

Welcome! This guide will get you up and running with VistralAI on your Mac in **under 5 minutes**.

## ⚡ Super Quick Start

```bash
# Step 1: Navigate to the directory
cd local-dev

# Step 2: Start the app
./start.sh

# Step 3: Open your browser
# → http://localhost:3000
```

That's it! 🎉

## 📋 What You'll See

### 1. Terminal Output
```
🚀 VistralAI - Local Development
================================

✅ Docker is running

📦 Starting VistralAI containers...
   This may take a few minutes on first run (downloading images)

[+] Building 45.2s (12/12) FINISHED
[+] Running 2/2
 ✔ Network local-dev_default        Created
 ✔ Container vistralai-dev          Started

Attaching to vistralai-dev
vistralai-dev  | > vistralai@0.1.0 dev
vistralai-dev  | > next dev
vistralai-dev  |
vistralai-dev  | ⚡ Ready in 2.3s
vistralai-dev  | ○ Local:   http://localhost:3000
```

### 2. In Your Browser
1. Open http://localhost:3000
2. You'll see the VistralAI login page
3. Use demo credentials:
   - **Email**: `demo@vistralai.com`
   - **Password**: `demo123`

### 3. Hot Reload in Action
1. Open any file in your editor (e.g., `app/dashboard/page.tsx`)
2. Make a change and save
3. Watch the browser automatically refresh! ✨

## 🛠️ Essential Commands

### Start & Stop

```bash
# Start (see logs in terminal)
./start.sh

# Stop (in new terminal or after Ctrl+C)
./stop.sh
```

### Background Mode

```bash
# Start in background (no logs)
docker-compose up -d

# View logs later
docker-compose logs -f

# Stop
docker-compose down
```

### Clean Up

```bash
# Remove all containers, volumes, and cache
./clean.sh

# Or manually
docker-compose down -v
```

## 🏗️ Directory Structure

```
local-dev/
├── start.sh              ← Start script (use this!)
├── stop.sh               ← Stop script
├── clean.sh              ← Clean up script
├── docker-compose.yml    ← Docker orchestration
├── Dockerfile.dev        ← Development Docker image
├── .env.local            ← Environment variables
├── .env.local.example    ← Template
├── README.md             ← Quick reference
├── README.docker.md      ← Complete documentation
└── GETTING_STARTED.md    ← This file
```

## 🔍 What's Running?

When you start VistralAI, Docker runs:

1. **Next.js Development Server** on port 3000
2. **Hot Module Replacement** for instant updates
3. **Health Checks** to monitor container status
4. **Volume Mounts** for code changes to reflect immediately

## 🎯 Common Workflows

### Making Code Changes

1. Edit any file in your project
2. Save the file
3. Browser auto-refreshes
4. No manual restart needed! ✅

### Installing New Packages

**Option 1**: Inside the container
```bash
docker-compose exec vistralai npm install <package-name>
```

**Option 2**: On your Mac, then rebuild
```bash
npm install <package-name>
docker-compose up --build
```

### Viewing Logs

```bash
# Follow logs (live updates)
docker-compose logs -f

# View last 100 lines
docker-compose logs --tail=100

# View specific service
docker-compose logs vistralai
```

### Debugging

```bash
# Enter the container shell
docker-compose exec vistralai sh

# Inside container, you can:
ls -la              # List files
npm list            # Check installed packages
env                 # View environment variables
cat .next/trace     # Check build trace
```

## ⚙️ Configuration

### Change Port (if 3000 is taken)

**1. Edit docker-compose.yml:**
```yaml
ports:
  - "3001:3000"  # Change left number
```

**2. Edit .env.local:**
```bash
NEXTAUTH_URL=http://localhost:3001
```

**3. Restart:**
```bash
docker-compose down
docker-compose up
```

### Add Environment Variables

Edit `.env.local`:
```bash
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=local-dev-secret-change-in-production-min-32-chars

# Add your custom variables:
MY_API_KEY=your-key-here
DATABASE_URL=your-db-url
```

## 🐛 Troubleshooting

### "Port 3000 is already in use"

```bash
# Find what's using port 3000
lsof -i :3000

# Kill it (replace PID with actual number)
kill -9 <PID>

# Or change port (see Configuration above)
```

### "Docker is not running"

```bash
# Open Docker Desktop
open -a Docker

# Wait for whale icon in menu bar to stop animating
# Then try ./start.sh again
```

### "Cannot connect to Docker daemon"

```bash
# Restart Docker Desktop
# Docker Desktop → Preferences → Reset → Restart Docker Desktop
```

### "Container exits immediately"

```bash
# View error logs
docker-compose logs

# Clean and rebuild
./clean.sh
./start.sh
```

### Changes not appearing

```bash
# Hard refresh browser
# Mac: Cmd + Shift + R

# Rebuild container
docker-compose down
docker-compose up --build
```

### Slow performance

**Increase Docker resources:**
1. Docker Desktop → Preferences → Resources
2. Set Memory to 4GB minimum
3. Set CPUs to 2 minimum
4. Apply & Restart

**Enable VirtioFS (faster file sharing):**
1. Docker Desktop → Preferences → General
2. Enable "Use VirtioFS accelerated directory sharing"
3. Apply & Restart

## 📊 Performance Tips

### First Run (Slow)
- Downloads Docker images (~500MB)
- Installs npm packages
- Takes 3-5 minutes

### Subsequent Runs (Fast)
- Uses cached images and packages
- Starts in 10-30 seconds

### Hot Reload Performance
- File changes reflect in 1-2 seconds
- No manual restart needed
- Works for all file types

## 🔒 Security Notes

### Development vs Production

This setup is for **local development only**!

**⚠️ DO NOT use in production:**
- NEXTAUTH_SECRET is a simple string
- No HTTPS (uses HTTP)
- Debug mode enabled
- All dependencies included (dev + prod)

**For production deployment:**
- Use the main `Dockerfile` in project root
- Follow deployment guide in main README
- Use proper secrets management
- Enable HTTPS

## 📚 Learn More

### Documentation Files

- **[README.md](README.md)** - Quick reference (start here)
- **[README.docker.md](README.docker.md)** - Complete documentation
- **[GETTING_STARTED.md](GETTING_STARTED.md)** - This file (beginner-friendly)

### Helpful Links

- [Docker Desktop for Mac](https://docs.docker.com/desktop/mac/)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Next.js Docs](https://nextjs.org/docs)
- [Main VistralAI README](../README.md)

## 🎓 Next Steps

### For First-Time Users

1. ✅ **Get it running**: `./start.sh`
2. 🌐 **Open browser**: http://localhost:3000
3. 🔐 **Login**: demo@vistralai.com / demo123
4. 📊 **Explore**: Click through dashboard, insights, analytics
5. ✏️ **Make a change**: Edit any file and see hot reload

### For Developers

1. 📖 **Read the code**: Start with `app/dashboard/page.tsx`
2. 🔧 **Understand the stack**: Next.js 14, React 18, TypeScript, Tailwind
3. 🎨 **Modify UI**: Edit components in `components/` directory
4. 🚀 **Add features**: Follow patterns in existing code
5. 📝 **Check CLAUDE.md**: Complete project documentation

### Common Tasks

**Add a new page:**
```bash
# 1. Create file
touch app/dashboard/new-page/page.tsx

# 2. Add code (see existing pages for examples)
# 3. Save and refresh browser
# 4. Navigate to http://localhost:3000/dashboard/new-page
```

**Add a new component:**
```bash
# 1. Create file
touch components/ui/NewComponent.tsx

# 2. Import in page
# 3. Save and see hot reload
```

**Add a new API route:**
```bash
# 1. Create file
touch app/api/new-route/route.ts

# 2. Add handler (GET/POST/etc)
# 3. Test with curl or browser
```

## 🆘 Need Help?

### Before Asking for Help

1. ✅ Check Docker Desktop is running
2. ✅ Check you have 4GB+ RAM allocated
3. ✅ Try `./clean.sh` then `./start.sh`
4. ✅ Read error messages carefully
5. ✅ Check [README.docker.md](README.docker.md) troubleshooting section

### Still Stuck?

1. Run `docker-compose logs` and read errors
2. Search error message in docs
3. Try `docker system prune -a` (removes everything)
4. Restart Docker Desktop
5. Check Docker Desktop GUI for errors

## ✨ Pro Tips

### Faster Development

```bash
# Keep logs open in one terminal
cd local-dev
./start.sh

# Work in another terminal
# Edit files, commit changes, etc.
```

### Multiple Projects

```bash
# Each project gets its own port
# Project 1: http://localhost:3000
# Project 2: http://localhost:3001 (change in docker-compose.yml)
```

### Clean Docker Regularly

```bash
# Remove unused Docker resources
docker system prune -a

# Reclaim disk space
# Do this every few weeks
```

## 🎉 You're Ready!

Everything is set up. Just run:

```bash
cd local-dev
./start.sh
```

Then visit **http://localhost:3000**

**Happy coding! 🚀**

---

*Questions? Check [README.docker.md](README.docker.md) for the complete guide.*
