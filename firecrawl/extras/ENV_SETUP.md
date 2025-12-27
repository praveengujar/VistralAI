# Environment Setup for Extras API

## Configuration Options

Add these environment variables to your `.env` file in the Firecrawl root directory:

### Port Configuration

```bash
# Extras API external port (default: 5001)
# This is the port you'll use to access the API on your host machine
EXTRAS_API_PORT=5001
```

**Why port 5001?**
- Port 5000 is commonly used by macOS Control Center's AirPlay Receiver
- Using 5001 avoids conflicts with system services
- You can change this to any available port

### Database Configuration

The database connection is automatically configured using the same PostgreSQL settings as the main Firecrawl application:

```bash
# These are already in your .env file for Firecrawl
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=postgres
POSTGRES_PORT=5432
```

The Extras API will automatically connect to the NuQ database using these credentials.

## Complete .env Example

Add this line to your existing `.env` file:

```bash
# Extras API Configuration
EXTRAS_API_PORT=5001
```

## Changing the Port

If you need to use a different port:

1. Update your `.env` file:
   ```bash
   EXTRAS_API_PORT=6000  # or any available port
   ```

2. Restart the extras-api service:
   ```bash
   docker compose up -d extras-api
   ```

3. Update your nginx configuration if using reverse proxy:
   ```nginx
   location /extras/ {
       proxy_pass http://localhost:6000/;
       # ... rest of config
   }
   ```

4. Reload nginx:
   ```bash
   sudo systemctl reload nginx
   ```

## Testing After Configuration

Once configured, test the API:

```bash
# Test health endpoint
curl http://localhost:${EXTRAS_API_PORT}/health

# Test status endpoint
curl http://localhost:${EXTRAS_API_PORT}/status
```

## Docker Compose Override

If you need more advanced configuration, create a `docker-compose.override.yml`:

```yaml
version: '3'
services:
  extras-api:
    environment:
      PORT: 5000  # internal port (don't change)
    ports:
      - "8080:5000"  # external:internal mapping
```

This allows you to customize the deployment without modifying the main `docker-compose.yaml`.
