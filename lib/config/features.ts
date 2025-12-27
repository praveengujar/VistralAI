/**
 * Feature Flags Configuration
 * Controls feature enablement for gradual migration from mock to production APIs
 *
 * Safe rollout strategy:
 * Stage 1: All false (current state with mocks)
 * Stage 2: USE_FIRECRAWL=true (real crawling, mock extraction)
 * Stage 3: USE_BULL_QUEUE=true (real queue, mock extraction)
 * Stage 4: USE_REAL_API=true (all real, no mocks)
 */

/**
 * Parse boolean from environment variable
 */
function parseEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Parse float from environment variable
 */
function parseEnvFloat(value: string | undefined, defaultValue: number): number {
  if (value === undefined) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

export const FEATURES = {
  /**
   * Enable Firecrawl for real website crawling
   * When disabled, uses mock WebCrawler
   * Default: true (use real crawler)
   */
  USE_FIRECRAWL: parseEnv(process.env.USE_FIRECRAWL, true),

  /**
   * Enable real Claude API calls for brand intelligence extraction
   * When disabled, uses mock data generators
   * Default: false (mock data for fast iteration)
   */
  USE_REAL_API: parseEnv(process.env.USE_REAL_API, false),

  /**
   * Confidence threshold for extraction review queue
   * Extractions below this confidence are routed to manual review
   * Range: 0.0 - 1.0 (0-100%)
   * Default: 0.85 (85% confidence required)
   */
  CONFIDENCE_THRESHOLD: parseEnvFloat(process.env.CONFIDENCE_THRESHOLD, 0.85),

  /**
   * Claude model to use for extraction
   * Should be 'claude-sonnet-4-20250514' for production
   * Default: 'claude-sonnet-4-20250514'
   */
  CLAUDE_MODEL: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',

  /**
   * Firecrawl internal URL for self-hosted instance
   * Local: 'http://localhost:3002'
   * Production: 'http://firecrawl-service:3000' (Cloud Run internal DNS)
   * Default: localhost for development
   */
  FIRECRAWL_INTERNAL_URL: process.env.FIRECRAWL_INTERNAL_URL || 'http://localhost:3002',

  /**
   * Maximum crawl depth for Firecrawl
   * Default: 2 (homepage + one level deep)
   */
  FIRECRAWL_MAX_DEPTH: parseEnvFloat(process.env.FIRECRAWL_MAX_DEPTH, 2),

  /**
   * Maximum pages to crawl per domain
   * Default: 20 (balance between speed and coverage)
   */
  FIRECRAWL_MAX_PAGES: parseEnvFloat(process.env.FIRECRAWL_MAX_PAGES, 20),

  /**
   * Crawl timeout in milliseconds
   * Default: 30000 (30 seconds)
   */
  FIRECRAWL_TIMEOUT_MS: parseEnvFloat(process.env.FIRECRAWL_TIMEOUT_MS, 30000),
} as const;

/**
 * Validate feature configuration at startup
 * Ensures required environment variables are set
 */
export function validateFeatureConfig(): void {
  if (FEATURES.USE_REAL_API && !process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
    console.warn(
      'WARNING: USE_REAL_API=true but neither ANTHROPIC_API_KEY nor OPENAI_API_KEY are set. API calls will fail.'
    );
  }

  if (FEATURES.USE_FIRECRAWL && !process.env.FIRECRAWL_INTERNAL_URL) {
    console.warn(
      'WARNING: USE_FIRECRAWL=true but FIRECRAWL_INTERNAL_URL not set. Will attempt to connect to default localhost:3002'
    );
  }
}

/**
 * Get current configuration as JSON string (for logging/debugging)
 * Excludes sensitive values
 */
export function getFeatureConfigString(): string {
  return JSON.stringify(
    {
      USE_FIRECRAWL: FEATURES.USE_FIRECRAWL,
      USE_REAL_API: FEATURES.USE_REAL_API,
      CONFIDENCE_THRESHOLD: FEATURES.CONFIDENCE_THRESHOLD,
      CLAUDE_MODEL: FEATURES.CLAUDE_MODEL,
    },
    null,
    2
  );
}
