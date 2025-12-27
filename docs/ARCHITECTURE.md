# VistralAI Architecture Documentation

## 1. Overview
VistralAI is an advanced brand intelligence and market analysis platform designed to help businesses understand their digital footprint, monitor competitors, and identify growth opportunities. The system leverages autonomous AI agents to crawl the web, analyze brand content, and generate strategic insights using Large Language Models (LLMs).

## 2. Technology Stack

### Frontend & Application Layer
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Lucide React (Icons)
- **UI Components**: Radix UI primitives, Custom Design System
- **State Management**: React Hooks, SWR (for data fetching)
- **Authentication**: NextAuth.js (Credentials & OAuth)

### Backend & API Layer
- **Runtime**: Node.js (via Next.js API Routes)
- **API Architecture**: RESTful endpoints (`app/api/*`)
- **Validation**: Zod schemas

### AI & Data Services
- **Web Scraping**: [Firecrawl](https://github.com/mendableai/firecrawl) (Self-hosted microservices)
  - **API Service**: Manages crawl jobs, queues, and rate limits.
  - **Playwright Service**: Headless browser automation for rendering JavaScript-heavy sites.
- **LLM Provider**: Anthropic Claude 3.5 Sonnet (via SDK)
- **Message Broker & Caching**: Redis (BullMQ for job queues, caching)

### Infrastructure (Google Cloud Platform)
- **Compute**: Google Cloud Run (Serverless Containers)
- **Build System**: Google Cloud Build
- **Networking**: Serverless VPC Access Connector (for Redis communication)
- **Secrets**: Google Secret Manager

---

## 3. System Architecture

The system follows a microservices-inspired architecture where the main application delegates heavy scraping tasks to a dedicated, self-hosted Firecrawl instance.

```mermaid
graph TD
    User[User] -->|HTTPS| App[VistralAI App (Next.js)]
    
    subgraph "VistralAI Cloud Run Service"
        App -->|API Routes| Backend[Next.js API]
    end
    
    subgraph "AI & External Services"
        Backend -->|Analyze| Claude[Anthropic Claude API]
    end
    
    subgraph "Firecrawl Ecosystem (GCP)"
        Backend -->|POST /v1/crawl| FirecrawlAPI[Firecrawl API Service]
        FirecrawlAPI -->|Job Queue| Redis[(Redis Instance)]
        Redis -->|Job| FirecrawlWorker[Firecrawl Worker]
        FirecrawlWorker -->|Scrape Request| Playwright[Playwright Service]
    end
    
    Playwright -->|HTTP/JS| TargetWeb[Target Website]
```

---

## 4. Core Components

### A. VistralAI Application (`/app`)
The core monolithic application handling user interface, authentication, and business logic.
- **Dashboard**: Provides real-time insights, brand health scores, and reporting.
- **Brand 360 Engine**: Orchestrates the analysis workflow by calling Firecrawl to gather data and Claude to interpret it.

### B. Firecrawl Services (`/firecrawl`)
A self-hosted instance of the Firecrawl open-source project, customized for VistralAI.
1.  **API Service**: The entry point for crawling requests. It handles authentication, validation, and pushes jobs to Redis.
2.  **Playwright Service**: A specialized microservice running Playwright. It receives instructions to visit a URL, render the page (executing client-side JS), and return the HTML/Markdown content.

### C. Redis
Acts as the backbone for the scraping infrastructure:
- **BullMQ Queues**: Manages asynchronous crawl jobs (extract, scrape, map).
- **Rate Limiting**: Ensures the system respects website `robots.txt` and API limits.
- **Caching**: Stores intermediate crawl results.

---

## 5. Key Workflows

### Website Analysis Workflow
1.  **Initiation**: User enters a brand URL (e.g., `https://langchain.com`) in the Dashboard.
2.  **Request**: The frontend sends a POST request to `/api/brand-360/analyze-website`.
3.  **Crawl Dispatch**: The API route calls the internal Firecrawl instance (`FIRECRAWL_INTERNAL_URL`).
4.  **Execution**:
    *   Firecrawl API pushes the job to Redis.
    *   A worker picks up the job and requests the Playwright service to scrape the page.
    *   Playwright renders the page and returns the content (converted to Markdown).
5.  **Analysis**: The raw Markdown is sent to Anthropic Claude with a specific prompt to extract brand values, products, and market positioning.
6.  **Presentation**: The structured JSON response is returned to the frontend and visualized in the Brand Profile.

---

## 6. Deployment & Infrastructure

The project is deployed on **Google Cloud Run** for scalability and zero-maintenance server management.

| Service Name | Description | Internal Port | Public Access |
| :--- | :--- | :--- | :--- |
| `vistralai` | Main Next.js App | 3000 | Yes (HTTPS) |
| `firecrawl-api` | Scraping API Controller | 3002 | Yes (Protected) |
| `firecrawl-playwright` | Headless Browser Service | 3000 | No (Internal Only) |

### Networking
- **VPC Connector**: A VPC Access Connector (`vistralai-connector`) is used to allow Cloud Run services to communicate with the private Redis instance hosted on a Compute Engine VM or Memorystore.
- **Environment Variables**: Critical configuration (Redis URLs, Service URLs) is managed via Cloud Run environment variables and Secret Manager.

## 7. Local Development

To run the full stack locally:

1.  **Prerequisites**: Node.js 18+, Docker (optional for Redis), Google Cloud SDK.
2.  **Environment Setup**:
    *   Configure `.env.local` with `NEXTAUTH_URL`, `ANTHROPIC_API_KEY`, and `FIRECRAWL_API_KEY` (if using cloud) or `FIRECRAWL_INTERNAL_URL` (if self-hosted).
3.  **Running the App**:
    ```bash
    npm run dev
    # Runs on http://localhost:3000
    ```
4.  **Running Firecrawl (Optional)**:
    *   If debugging scraping internals, you can run the Firecrawl services locally using their respective `docker-compose` or `npm run dev` scripts in the `firecrawl/` directory.
