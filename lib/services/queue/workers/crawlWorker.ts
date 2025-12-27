/**
 * Crawl Worker
 * Processes crawl jobs: Website crawling with Firecrawl or mock
 */

import { CrawlJobData } from '@/types/queue';
import { getCrawler } from '@/lib/services/crawler';
import { FEATURES } from '@/lib/config/features';

/**
 * Process a crawl job
 */
export async function processCrawlJob(jobData: CrawlJobData): Promise<{
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
}> {
  const startTime = Date.now();

  try {
    console.log(`[CrawlWorker] Starting crawl for ${jobData.websiteUrl}`);

    // Get appropriate crawler (Firecrawl or WebCrawler mock)
    const crawler = getCrawler();

    // Perform crawl
    const crawlResult = await crawler.crawlBrandWebsite(jobData.websiteUrl);

    const duration = Date.now() - startTime;

    console.log(`[CrawlWorker] Crawl completed in ${duration}ms for ${jobData.websiteUrl}`);

    return {
      success: true,
      data: crawlResult,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error(`[CrawlWorker] Crawl failed for ${jobData.websiteUrl}:`, errorMessage);

    return {
      success: false,
      error: errorMessage,
      duration,
    };
  }
}
