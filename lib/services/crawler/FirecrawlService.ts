/**
 * Firecrawl Service
 * Uses Firecrawl API (via HTTP) to crawl websites and extract brand information
 *
 * Differences from WebCrawler:
 * - Handles JavaScript-rendered content
 * - Better content extraction (removes ads/nav)
 * - Respects robots.txt and rate limiting
 * - Single API call vs multiple HTTP requests
 *
 * Compatible interface with WebCrawler for easy swapping
 */

import { getFirecrawlClient, FirecrawlCrawlOptions } from '@/lib/config/firecrawl';
import { CrawlResult, CrawlOptions, PageContent } from './WebCrawler';

/**
 * Firecrawl wrapper service
 * Implements same interface as WebCrawler for compatibility
 */
export class FirecrawlService {
  private options: Required<CrawlOptions>;

  constructor(options?: CrawlOptions) {
    this.options = {
      maxDepth: options?.maxDepth ?? 3,
      maxPages: options?.maxPages ?? 50,
      timeout: options?.timeout ?? 30000,
      respectRobotsTxt: options?.respectRobotsTxt ?? true,
    };
  }

  /**
   * Crawls a website using Firecrawl
   * Returns results in same format as WebCrawler for compatibility
   *
   * @param url Website URL to crawl
   * @returns CrawlResult matching WebCrawler format
   * @throws Error if crawl fails
   */
  async crawlBrandWebsite(url: string): Promise<CrawlResult> {
    const startTime = Date.now();

    // Validate URL
    if (!url || typeof url !== 'string') {
      throw new Error(`Invalid URL: ${url}`);
    }

    // Normalize URL
    const normalizedUrl = this.normalizeUrl(url);
    if (!normalizedUrl) {
      throw new Error(`Invalid URL format: ${url}`);
    }

    try {
      console.log('[FirecrawlService] Starting crawl for:', normalizedUrl);

      // Get Firecrawl client
      const firecrawl = getFirecrawlClient();

      // Convert CrawlOptions to Firecrawl options
      const firecrawlOptions: FirecrawlCrawlOptions = {
        maxDepth: 2,
        maxPages: this.options.maxPages,
        timeout: this.options.timeout,
        respectRobotsTxt: this.options.respectRobotsTxt,
        scrapeFormat: 'markdown',
      };

      // Crawl with retry logic
      const crawlResponse = await firecrawl.crawlWithRetry(normalizedUrl, firecrawlOptions, 2);

      if (!crawlResponse.success || !crawlResponse.data) {
        throw new Error(`Firecrawl crawl failed: ${crawlResponse.error || 'Unknown error'}`);
      }

      // Parse Firecrawl markdown response
      const result = this.parseFirecrawlResponse(crawlResponse, normalizedUrl);

      const crawlDuration = Date.now() - startTime;
      console.log(`[FirecrawlService] Crawl completed in ${crawlDuration}ms for: ${normalizedUrl}`);

      return {
        ...result,
        crawlDuration,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[FirecrawlService] Crawl error:', message);
      throw new Error(`Failed to crawl ${url}: ${message}`);
    }
  }

  /**
   * Parse Firecrawl markdown response into CrawlResult format
   * Extracts homepage, about pages, and product pages from markdown
   */
  private parseFirecrawlResponse(
    response: any,
    url: string
  ): Omit<CrawlResult, 'crawlDuration'> {
    const markdown = response.data.markdown || '';
    const metadata = response.data.metadata || {};

    // Create homepage content from first page
    const homepage: PageContent = {
      url: (metadata.sourceURL as string) || url,
      title: (metadata.title as string) || 'Home',
      description: (metadata.description as string) || '',
      content: markdown,
      headings: this.extractHeadings(markdown),
      links: this.extractLinks(markdown),
    };

    // Parse markdown to identify page sections
    // Firecrawl returns multi-page crawl as markdown sections
    const { aboutPages, productPages } = this.extractPageSections(markdown);

    // Combine raw text
    const rawText = `${homepage.content}\n\n${aboutPages.map((p) => p.content).join('\n\n')}\n\n${productPages.map((p) => p.content).join('\n\n')}`;

    return {
      homepage,
      aboutPages,
      productPages,
      rawText: rawText.trim(),
      metadata: {
        title: homepage.title,
        description: homepage.description || '',
        keywords: this.extractKeywords(markdown),
      },
      crawledUrls: [
        url,
        ...aboutPages.map((p) => p.url),
        ...productPages.map((p) => p.url),
      ],
    };
  }

  /**
   * Extract headings from markdown content
   */
  private extractHeadings(markdown: string): string[] {
    const headingRegex = /^#+\s+(.+)$/gm;
    const headings: string[] = [];
    let match;

    while ((match = headingRegex.exec(markdown)) !== null) {
      const heading = match[1].trim();
      if (heading && !headings.includes(heading)) {
        headings.push(heading);
      }
    }

    return headings;
  }

  /**
   * Extract links from markdown content
   */
  private extractLinks(markdown: string): string[] {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links: string[] = [];
    let match;

    while ((match = linkRegex.exec(markdown)) !== null) {
      const link = match[2].trim();
      if (link && link.startsWith('http')) {
        links.push(link);
      }
    }

    return [...new Set(links)]; // Remove duplicates
  }

  /**
   * Extract keywords from markdown content
   * Simple implementation: common words in headings
   */
  private extractKeywords(markdown: string): string[] {
    const headings = this.extractHeadings(markdown);
    const commonWords = new Set<string>();

    const stopWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'is',
      'are',
      'be',
      'was',
      'were',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
    ]);

    headings.forEach((heading) => {
      const words = heading.toLowerCase().split(/\s+/);
      words.forEach((word) => {
        const cleaned = word.replace(/[^a-z0-9]/g, '');
        if (cleaned.length > 3 && !stopWords.has(cleaned)) {
          commonWords.add(cleaned);
        }
      });
    });

    return Array.from(commonWords).slice(0, 10);
  }

  /**
   * Extract page sections from markdown
   * Identifies about and product pages from content
   */
  private extractPageSections(
    markdown: string
  ): { aboutPages: PageContent[]; productPages: PageContent[] } {
    const aboutPages: PageContent[] = [];
    const productPages: PageContent[] = [];

    // Split by markdown horizontal rules or headers
    const sections = markdown.split(/---+|\n#+\s+[^#+]/);

    // Simple heuristic: if section contains "about" keywords, it's an about page
    const aboutKeywords = ['about', 'company', 'team', 'mission', 'vision', 'values', 'story'];
    const productKeywords = ['product', 'service', 'solution', 'feature', 'pricing', 'plan'];

    sections.forEach((section, index) => {
      if (section.length < 100) return; // Skip tiny sections

      const lowerSection = section.toLowerCase();
      const hasAboutKeywords = aboutKeywords.some((keyword) => lowerSection.includes(keyword));
      const hasProductKeywords = productKeywords.some((keyword) => lowerSection.includes(keyword));

      if (hasAboutKeywords) {
        aboutPages.push({
          url: `#about-${index}`,
          title: 'About',
          description: '',
          content: section.trim(),
          headings: this.extractHeadings(section),
          links: this.extractLinks(section),
        });
      }

      if (hasProductKeywords) {
        productPages.push({
          url: `#products-${index}`,
          title: 'Products',
          description: '',
          content: section.trim(),
          headings: this.extractHeadings(section),
          links: this.extractLinks(section),
        });
      }
    });

    return { aboutPages, productPages };
  }

  /**
   * Normalize URL
   */
  private normalizeUrl(url: string): string | null {
    try {
      // Add https if no protocol
      if (!url.includes('://')) {
        url = 'https://' + url;
      }

      const parsed = new URL(url);
      // Remove hash and query params
      return parsed.origin + parsed.pathname;
    } catch {
      return null;
    }
  }
}

/**
 * Get appropriate crawler based on feature flag
 * Returns FirecrawlService if enabled, WebCrawler fallback otherwise
 */
export function getCrawler(options?: CrawlOptions) {
  const { USE_FIRECRAWL } = require('@/lib/config/features').FEATURES;

  if (USE_FIRECRAWL) {
    return new FirecrawlService(options);
  } else {
    const { WebCrawler } = require('./WebCrawler');
    return new WebCrawler(options);
  }
}
