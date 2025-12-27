/**
 * Firecrawl Client Configuration
 * HTTP client for self-hosted Firecrawl instance
 *
 * Supports both local (docker-compose) and production (Cloud Run) deployments
 *
 * Usage:
 *   const firecrawl = getFirecrawlClient();
 *   const result = await firecrawl.crawl('https://example.com', { maxPages: 10 });
 */

import { FEATURES } from './features';

/**
 * Firecrawl crawl request options
 */
export interface FirecrawlCrawlOptions {
  maxPages?: number;
  maxDepth?: number;
  timeout?: number;
  respectRobotsTxt?: boolean;
  scrapeFormat?: 'markdown' | 'html' | 'json';
  headers?: Record<string, string>;
}

/**
 * Firecrawl crawl response
 */
export interface FirecrawlCrawlResponse {
  success: boolean;
  data?: {
    markdown: string;
    html?: string;
    metadata?: {
      title?: string;
      description?: string;
      language?: string;
      sourceURL: string;
    };
  };
  error?: string;
  errorCode?: string;
}

/**
 * Firecrawl HTTP client
 * Wraps HTTP calls to self-hosted Firecrawl service
 */
export class FirecrawlClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl?: string, timeout: number = 60000) {
    // Use provided baseUrl, or env variable, or correct deployed service URL as fallback
    // Use provided baseUrl, or from features config (defaults to localhost:3002)
    this.baseUrl = baseUrl || FEATURES.FIRECRAWL_INTERNAL_URL;
    this.timeout = timeout;

    if (!this.baseUrl) {
      throw new Error('FIRECRAWL_INTERNAL_URL is not configured');
    }

    console.log('[Firecrawl] Client initialized with base URL:', this.baseUrl);
  }

  /**
   * Crawl a website and extract markdown content
   *
   * @param url Website URL to crawl
   * @param options Crawl options
   * @returns Crawl response with markdown content
   * @throws Error if crawl fails or times out
   */
  async crawl(url: string, options: FirecrawlCrawlOptions = {}): Promise<FirecrawlCrawlResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const defaultOptions: FirecrawlCrawlOptions = {
        maxPages: FEATURES.FIRECRAWL_MAX_PAGES,
        maxDepth: FEATURES.FIRECRAWL_MAX_DEPTH,
        timeout: FEATURES.FIRECRAWL_TIMEOUT_MS,
        respectRobotsTxt: true,
        scrapeFormat: 'markdown',
      };

      const mergedOptions = { ...defaultOptions, ...options };

      const requestBody = {
        url,
        limit: mergedOptions.maxPages, // maxPages maps to limit
        maxDepth: mergedOptions.maxDepth,
        ignoreRobotsTxt: !mergedOptions.respectRobotsTxt,
        scrapeOptions: {
          formats: [mergedOptions.scrapeFormat],
          // Only include headers if defined (conditional spread)
          ...(mergedOptions.headers && { headers: mergedOptions.headers }),
        },
      };

      console.log('[Firecrawl] Starting crawl for:', url);

      const requestUrl = `${this.baseUrl}/v1/crawl`;
      console.log(`[Firecrawl] Sending request to: ${requestUrl}`);

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Firecrawl API error ${response.status}: ${errorBody || response.statusText}`
        );
      }

      const initialResponse = await response.json();

      // Handle async crawl job
      if (initialResponse.success && initialResponse.id) {
        console.log(`[Firecrawl] Job started with ID: ${initialResponse.id}. Polling for results...`);
        return await this.pollCrawlStatus(initialResponse.id, this.timeout);
      }

      // Handle synchronous response (fallback or if API behavior changes)
      if (!initialResponse.success) {
        console.warn('[Firecrawl] Crawl failed:', initialResponse.error);
        throw new Error(`Firecrawl crawl failed: ${initialResponse.error}`);
      }

      console.log('[Firecrawl] Crawl completed synchronously for:', url);
      return initialResponse as FirecrawlCrawlResponse;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Firecrawl request timed out after ${this.timeout}ms`);
        }
        console.error('[Firecrawl] Error during crawl:', error.message);
        throw error;
      }
      console.error('[Firecrawl] Request failed details:', {
        message: String(error),
        cause: (error as any)?.cause,
        stack: (error as Error)?.stack,
        baseUrl: this.baseUrl
      });
      throw new Error(`Firecrawl request failed: ${String(error)}`);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Poll crawl job status until completion or timeout
   */
  private async pollCrawlStatus(jobId: string, timeout: number): Promise<FirecrawlCrawlResponse> {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds

    while (Date.now() - startTime < timeout) {
      try {
        const statusUrl = `${this.baseUrl}/v1/crawl/${jobId}`;
        const response = await fetch(statusUrl, {
          headers: { Accept: 'application/json' }
        });

        if (!response.ok) {
          throw new Error(`Failed to check job status: ${response.status}`);
        }

        const statusData = await response.json();

        if (statusData.status === 'completed') {
          console.log(`[Firecrawl] Job ${jobId} completed. Processing results...`);

          // Aggregate results from all pages
          let combinedMarkdown = '';
          let metadata = {};

          if (statusData.data && Array.isArray(statusData.data)) {
            combinedMarkdown = statusData.data
              .map((item: any) => item.markdown)
              .filter(Boolean)
              .join('\n\n---\n\n');

            // Use metadata from first page
            if (statusData.data.length > 0) {
              metadata = statusData.data[0].metadata || {};
            }
          }

          return {
            success: true,
            data: {
              markdown: combinedMarkdown,
              metadata: {
                sourceURL: (metadata as any).sourceURL || '',
                ...metadata
              }
            }
          };
        }

        if (statusData.status === 'failed') {
          throw new Error(`Crawl job failed: ${statusData.error || 'Unknown error'}`);
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error(`[Firecrawl] Polling error for job ${jobId}:`, error);
        throw error;
      }
    }

    throw new Error(`Crawl job ${jobId} timed out after ${timeout}ms`);
  }

  /**
   * Crawl a website with retry logic
   * Automatically retries failed requests with exponential backoff
   *
   * @param url Website URL to crawl
   * @param options Crawl options
   * @param maxRetries Maximum number of retries (default: 2)
   * @returns Crawl response with markdown content
   */
  async crawlWithRetry(
    url: string,
    options: FirecrawlCrawlOptions = {},
    maxRetries: number = 2
  ): Promise<FirecrawlCrawlResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delayMs = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
          console.log(`[Firecrawl] Retrying crawl (attempt ${attempt + 1}/${maxRetries + 1}) after ${delayMs}ms`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }

        return await this.crawl(url, options);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`[Firecrawl] Crawl attempt ${attempt + 1} failed:`, lastError.message);

        // Don't retry on certain errors
        if (lastError.message.includes('timed out') || lastError.message.includes('abort')) {
          break;
        }
      }
    }

    throw lastError || new Error('Firecrawl crawl failed after all retry attempts');
  }

  /**
   * Health check for Firecrawl service
   * Returns true if service is accessible, false otherwise
   */
  async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${this.baseUrl}/e2e-test`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('[Firecrawl] Health check failed:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }
}

/**
 * Singleton instance of Firecrawl client
 */
let firecrawlClient: FirecrawlClient | null = null;

/**
 * Get or create Firecrawl client
 * Returns singleton instance for efficient reuse
 */
export function getFirecrawlClient(): FirecrawlClient {
  if (!firecrawlClient) {
    firecrawlClient = new FirecrawlClient();
  }
  return firecrawlClient;
}

/**
 * Get Firecrawl client with custom base URL
 * Useful for testing or multiple instances
 */
export function createFirecrawlClient(baseUrl: string, timeout?: number): FirecrawlClient {
  return new FirecrawlClient(baseUrl, timeout);
}
