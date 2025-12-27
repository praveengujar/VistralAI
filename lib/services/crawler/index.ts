/**
 * Crawler Service Factory
 * Selects appropriate crawler based on feature flags
 *
 * Usage:
 *   const crawler = getCrawler();
 *   const result = await crawler.crawlBrandWebsite('https://example.com');
 */

import { FEATURES } from '@/lib/config/features';
import { WebCrawler, type CrawlOptions, type CrawlResult, type PageContent } from './WebCrawler';
import { FirecrawlService } from './FirecrawlService';

/**
 * Interface that both crawlers implement
 */
export interface ICrawler {
  crawlBrandWebsite(url: string): Promise<CrawlResult>;
}

/**
 * Get appropriate crawler based on feature flags
 *
 * Priority:
 * 1. If USE_FIRECRAWL=true: Use FirecrawlService (real web scraping)
 * 2. Otherwise: Use WebCrawler (mock data for development)
 *
 * @param options Crawler options (maxPages, maxDepth, timeout, etc.)
 * @returns Crawler instance (either FirecrawlService or WebCrawler)
 */
export function getCrawler(options?: CrawlOptions): ICrawler {
  if (FEATURES.USE_FIRECRAWL) {
    console.log('[Crawler Factory] Using FirecrawlService');
    return new FirecrawlService(options);
  } else {
    console.log('[Crawler Factory] Using WebCrawler (mock)');
    return new WebCrawler(options);
  }
}

/**
 * Utility: Always get WebCrawler (for testing/fallback)
 */
export function getWebCrawler(options?: CrawlOptions): WebCrawler {
  return new WebCrawler(options);
}

/**
 * Utility: Always get FirecrawlService (for testing/direct usage)
 */
export function getFirecrawlCrawler(options?: CrawlOptions): FirecrawlService {
  return new FirecrawlService(options);
}

// Re-export types for convenience
export type { CrawlResult, CrawlOptions, PageContent } from './WebCrawler';
export { FirecrawlService };
export { WebCrawler };
