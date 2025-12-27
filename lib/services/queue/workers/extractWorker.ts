/**
 * Extract Worker
 * Processes extract jobs: Brand intelligence extraction with Claude or mock
 */

import { ExtractJobData } from '@/types/queue';
import { BrandIntelligence } from '@/lib/services/llm/BrandIntelligence';
import { FEATURES } from '@/lib/config/features';
import { CrawlResult } from '@/lib/services/crawler';

/**
 * Process an extract job
 */
export async function processExtractJob(jobData: ExtractJobData): Promise<{
  success: boolean;
  identity?: any;
  competitors?: any;
  products?: any;
  error?: string;
  duration: number;
  source: 'claude' | 'mock';
}> {
  const startTime = Date.now();

  try {
    console.log(`[ExtractWorker] Starting extraction for job ${jobData.jobId}`);

    // Initialize brand intelligence service
    const intelligence = new BrandIntelligence();

    // Extract domain from crawl data
    const domain = extractDomain(jobData.crawlData);

    // Perform extractions in parallel
    const [identity, competitors, products] = await Promise.all([
      intelligence.extractBrandIdentity(jobData.crawlData, domain),
      intelligence.identifyCompetitors(domain, jobData.crawlData),
      intelligence.categorizeProducts(jobData.crawlData),
    ]);

    const duration = Date.now() - startTime;

    console.log(`[ExtractWorker] Extraction completed in ${duration}ms for job ${jobData.jobId}`);

    return {
      success: true,
      identity,
      competitors,
      products,
      duration,
      source: FEATURES.USE_REAL_API ? 'claude' : 'mock',
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error(`[ExtractWorker] Extraction failed for job ${jobData.jobId}:`, errorMessage);

    return {
      success: false,
      error: errorMessage,
      duration,
      source: FEATURES.USE_REAL_API ? 'claude' : 'mock',
    };
  }
}

/**
 * Extract domain from crawl result
 */
function extractDomain(crawlData: any): string {
  // If crawlData has url property, extract domain from it
  if (crawlData?.url) {
    try {
      const urlObj = new URL(crawlData.url);
      return urlObj.hostname;
    } catch {
      return crawlData.url;
    }
  }

  // If crawlData has metadata with source URL
  if (crawlData?.metadata?.sourceUrl) {
    try {
      const urlObj = new URL(crawlData.metadata.sourceUrl);
      return urlObj.hostname;
    } catch {
      return crawlData.metadata.sourceUrl;
    }
  }

  return 'unknown';
}
