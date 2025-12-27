# Firecrawl Job Status API

A Flask-based API service for querying Firecrawl job statuses from the NuQ queue.

## Environment Variables

Add these to your `.env` file in the Firecrawl root directory:

```bash
# Extras API Port (default: 5001)
# Change this if port 5001 is already in use
EXTRAS_API_PORT=5001
```

**Note:** Port 5000 is often used by macOS Control Center (AirPlay Receiver), so we default to 5001.

## Features

- List all jobs with pagination
- Filter jobs by status
- Get job statistics
- Query individual jobs by ID
- Health check endpoint

## Endpoints

### `GET /health`
Health check endpoint to verify service is running.

**Response:**
```json
{
  "status": "healthy",
  "service": "firecrawl-status-api",
  "timestamp": "2024-01-01T12:00:00"
}
```

### `GET /status`
Get all jobs with pagination and filtering.

**Query Parameters:**
- `limit` (int): Number of jobs to return (default: 100, max: 1000)
- `offset` (int): Offset for pagination (default: 0)
- `status` (string): Filter by status (queued, active, completed, failed, backlog)
- `order` (string): Order by field (created_at, finished_at, priority)
- `direction` (string): Sort direction (asc, desc)

**Example:**
```bash
curl "http://localhost:5000/status?limit=50&status=completed&order=finished_at&direction=desc"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "uuid-here",
        "status": "completed",
        "created_at": "2024-01-01T12:00:00",
        "finished_at": "2024-01-01T12:01:00",
        "priority": 10,
        "url": "https://example.com",
        "mode": "single_urls",
        "team_id": "team-123",
        "crawl_id": null,
        "origin": "api"
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 50,
      "offset": 0,
      "returned": 50
    }
  },
  "timestamp": "2024-01-01T12:00:00"
}
```

### `GET /status/stats`
Get job statistics grouped by status.

**Example:**
```bash
curl http://localhost:5000/status/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "queued": 10,
      "active": 5,
      "completed": 100,
      "failed": 3,
      "backlog": 20
    },
    "total": 138
  },
  "timestamp": "2024-01-01T12:00:00"
}
```

### `GET /status/<job_id>`
Get a specific job by ID.

**Example:**
```bash
curl http://localhost:5000/status/12345678-1234-1234-1234-123456789abc
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "12345678-1234-1234-1234-123456789abc",
    "status": "completed",
    "created_at": "2024-01-01T12:00:00",
    "finished_at": "2024-01-01T12:01:00",
    "priority": 10,
    "data": {
      "mode": "single_urls",
      "url": "https://example.com",
      "team_id": "team-123"
    },
    "failed_reason": null,
    "owner_id": "owner-uuid",
    "group_id": null
  },
  "timestamp": "2024-01-01T12:00:00"
}
```

## Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export NUQ_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
export PORT=5000

# Run the application
python app.py
```

## Docker Deployment

Built and deployed automatically via docker-compose.

```bash
docker compose up extras-api
```

## Environment Variables

- `NUQ_DATABASE_URL`: PostgreSQL connection string (default: `postgresql://postgres:postgres@nuq-postgres:5432/postgres`)
- `PORT`: Port to run the service on (default: 5000)
