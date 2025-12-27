/**
 * CrawlerAgent - Crawl websites and extract Schema.org markup
 *
 * This agent extends the Firecrawl service to:
 * 1. Crawl website content
 * 2. Extract JSON-LD Schema.org markup
 * 3. Extract social links (sameAs)
 * 4. Build EntityHome and OrganizationSchema
 */

import {
  AgentResult,
  CrawlerAgentResult,
  EntityHomeData,
  OrganizationSchemaData,
  SchemaOrgMarkup,
  FounderInfo,
} from './types';

export class CrawlerAgent {
  private firecrawlUrl: string;

  constructor() {
    this.firecrawlUrl =
      process.env.FIRECRAWL_INTERNAL_URL || 'http://localhost:3002';
  }

  /**
   * Crawl website and extract Entity Home data
   */
  async crawl(websiteUrl: string): Promise<AgentResult<CrawlerAgentResult>> {
    const startTime = Date.now();

    try {
      // Step 1: Crawl the website using Firecrawl
      const crawlResponse = await fetch(`${this.firecrawlUrl}/v1/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: websiteUrl,
          formats: ['markdown', 'html'],
        }),
      });

      if (!crawlResponse.ok) {
        throw new Error(`Firecrawl error: ${crawlResponse.status}`);
      }

      const crawlData = await crawlResponse.json();

      if (!crawlData.success) {
        throw new Error(crawlData.error || 'Crawl failed');
      }

      const html = crawlData.data?.html || '';
      const markdown = crawlData.data?.markdown || '';

      // Step 2: Extract Schema.org markup
      const schemaMarkup = this.extractSchemaMarkup(html);

      // Step 3: Extract social links (sameAs)
      const socialLinks = this.extractSocialLinks(html);

      // Step 4: Extract meta information
      const metaInfo = this.extractMetaInfo(html);

      // Step 5: Build Entity Home
      const entityHome = this.buildEntityHome(websiteUrl, socialLinks, schemaMarkup);

      // Step 6: Build Organization Schema from existing markup
      const organizationSchema = this.buildOrganizationSchema(
        schemaMarkup,
        metaInfo
      );

      const duration = Date.now() - startTime;

      return {
        success: true,
        data: {
          entityHome,
          organizationSchema,
          socialLinks,
          schemaMarkup,
          rawContent: markdown,
          crawledUrls: [websiteUrl],
        },
        confidence: schemaMarkup.length > 0 ? 0.9 : 0.6,
        source: 'crawler_agent',
        duration,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        confidence: 0,
        source: 'crawler_agent',
        errors: [errorMessage],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Crawl multiple pages for deeper extraction
   */
  async crawlMultiple(
    websiteUrl: string,
    maxPages: number = 5
  ): Promise<AgentResult<CrawlerAgentResult>> {
    const startTime = Date.now();

    try {
      // Use Firecrawl's crawl endpoint for multiple pages
      const crawlResponse = await fetch(`${this.firecrawlUrl}/v1/crawl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: websiteUrl,
          limit: maxPages,
          scrapeOptions: {
            formats: ['markdown', 'html'],
          },
        }),
      });

      if (!crawlResponse.ok) {
        // Fallback to single page crawl
        return this.crawl(websiteUrl);
      }

      const crawlData = await crawlResponse.json();

      // Poll for completion if async
      if (crawlData.id) {
        const result = await this.pollCrawlStatus(crawlData.id);
        return this.processCrawlResult(websiteUrl, result, startTime);
      }

      return this.processCrawlResult(websiteUrl, crawlData, startTime);
    } catch (error: unknown) {
      // Fallback to single page crawl
      console.warn('Multi-page crawl failed, falling back to single page:', error);
      return this.crawl(websiteUrl);
    }
  }

  /**
   * Poll for async crawl completion
   */
  private async pollCrawlStatus(jobId: string, maxAttempts: number = 30): Promise<unknown> {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const statusResponse = await fetch(
        `${this.firecrawlUrl}/v1/crawl/${jobId}`,
        { method: 'GET' }
      );

      if (!statusResponse.ok) continue;

      const statusData = await statusResponse.json();

      if (statusData.status === 'completed') {
        return statusData;
      }

      if (statusData.status === 'failed') {
        throw new Error('Crawl job failed');
      }
    }

    throw new Error('Crawl job timed out');
  }

  /**
   * Process crawl result from multi-page crawl
   */
  private processCrawlResult(
    websiteUrl: string,
    crawlData: unknown,
    startTime: number
  ): AgentResult<CrawlerAgentResult> {
    const data = crawlData as { data?: Array<{ html?: string; markdown?: string }> };
    const pages = data?.data || [];

    // Combine all HTML and markdown
    const allHtml = pages.map((p) => p.html || '').join('\n');
    const allMarkdown = pages.map((p) => p.markdown || '').join('\n\n');

    const schemaMarkup = this.extractSchemaMarkup(allHtml);
    const socialLinks = this.extractSocialLinks(allHtml);
    const metaInfo = this.extractMetaInfo(allHtml);

    const entityHome = this.buildEntityHome(websiteUrl, socialLinks, schemaMarkup);
    const organizationSchema = this.buildOrganizationSchema(schemaMarkup, metaInfo);

    return {
      success: true,
      data: {
        entityHome,
        organizationSchema,
        socialLinks,
        schemaMarkup,
        rawContent: allMarkdown,
        crawledUrls: pages.map((_, i) => `${websiteUrl}/page-${i}`),
      },
      confidence: schemaMarkup.length > 0 ? 0.9 : 0.6,
      source: 'crawler_agent',
      duration: Date.now() - startTime,
    };
  }

  /**
   * Extract JSON-LD schema markup from HTML
   */
  private extractSchemaMarkup(html: string): SchemaOrgMarkup[] {
    const schemaRegex =
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    const schemas: SchemaOrgMarkup[] = [];

    let match;
    while ((match = schemaRegex.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(match[1].trim());
        if (Array.isArray(parsed)) {
          schemas.push(...parsed);
        } else {
          schemas.push(parsed);
        }
      } catch {
        // Invalid JSON, skip
      }
    }

    return schemas;
  }

  /**
   * Extract social media links from HTML
   */
  private extractSocialLinks(html: string): string[] {
    const socialPatterns = [
      /https?:\/\/(www\.)?linkedin\.com\/company\/[^\s"'<>]+/gi,
      /https?:\/\/(www\.)?(twitter|x)\.com\/[^\s"'<>]+/gi,
      /https?:\/\/(www\.)?facebook\.com\/[^\s"'<>]+/gi,
      /https?:\/\/(www\.)?youtube\.com\/(channel|c|user|@)[^\s"'<>]+/gi,
      /https?:\/\/(www\.)?github\.com\/[^\s"'<>]+/gi,
      /https?:\/\/(www\.)?instagram\.com\/[^\s"'<>]+/gi,
      /https?:\/\/(www\.)?crunchbase\.com\/organization\/[^\s"'<>]+/gi,
    ];

    const links: string[] = [];

    for (const pattern of socialPatterns) {
      const matches = html.match(pattern);
      if (matches) {
        // Clean up URLs (remove trailing quotes, slashes, etc.)
        const cleaned = matches.map((url) =>
          url.replace(/['"<>].*$/, '').replace(/\/+$/, '')
        );
        links.push(...cleaned);
      }
    }

    return [...new Set(links)]; // Deduplicate
  }

  /**
   * Extract meta information from HTML
   */
  private extractMetaInfo(html: string): Record<string, string> {
    const meta: Record<string, string> = {};

    // Title
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    if (titleMatch) meta.title = this.decodeHtmlEntities(titleMatch[1]);

    // Description
    const descMatch = html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i
    );
    if (descMatch) meta.description = this.decodeHtmlEntities(descMatch[1]);

    // OG Title
    const ogTitleMatch = html.match(
      /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["'][^>]*>/i
    );
    if (ogTitleMatch) meta.ogTitle = this.decodeHtmlEntities(ogTitleMatch[1]);

    // OG Description
    const ogDescMatch = html.match(
      /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/i
    );
    if (ogDescMatch) meta.ogDescription = this.decodeHtmlEntities(ogDescMatch[1]);

    // OG Site Name
    const ogSiteMatch = html.match(
      /<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']*)["'][^>]*>/i
    );
    if (ogSiteMatch) meta.ogSiteName = this.decodeHtmlEntities(ogSiteMatch[1]);

    return meta;
  }

  /**
   * Decode HTML entities
   */
  private decodeHtmlEntities(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/');
  }

  /**
   * Build EntityHome from extracted data
   */
  private buildEntityHome(
    websiteUrl: string,
    socialLinks: string[],
    schemaMarkup: SchemaOrgMarkup[]
  ): Partial<EntityHomeData> {
    // Find Organization schema for sameAs links
    const orgSchema = schemaMarkup.find(
      (s) =>
        s['@type'] === 'Organization' ||
        s['@type'] === 'Corporation' ||
        s['@type'] === 'LocalBusiness'
    );

    // Get sameAs from schema if available
    const schemaSameAs = (orgSchema?.sameAs as string[]) || [];
    const allLinks = [...new Set([...socialLinks, ...schemaSameAs])];

    return {
      canonicalUrl: websiteUrl,
      linkedinUrl: allLinks.find((l) => l.includes('linkedin.com')),
      twitterUrl: allLinks.find((l) => l.includes('twitter.com') || l.includes('x.com')),
      facebookUrl: allLinks.find((l) => l.includes('facebook.com')),
      youtubeUrl: allLinks.find((l) => l.includes('youtube.com')),
      githubUrl: allLinks.find((l) => l.includes('github.com')),
      instagramUrl: allLinks.find((l) => l.includes('instagram.com')),
      crunchbaseUrl: allLinks.find((l) => l.includes('crunchbase.com')),
      wikidataVerified: false,
      schemaValidated: schemaMarkup.length > 0,
      socialConsistent: allLinks.length > 0,
      alternateNames: [],
      formerNames: [],
    };
  }

  /**
   * Build OrganizationSchema from extracted data
   */
  private buildOrganizationSchema(
    schemaMarkup: SchemaOrgMarkup[],
    metaInfo: Record<string, string>
  ): Partial<OrganizationSchemaData> {
    // Find Organization schema if exists
    const orgSchema = schemaMarkup.find(
      (s) =>
        s['@type'] === 'Organization' ||
        s['@type'] === 'Corporation' ||
        s['@type'] === 'LocalBusiness'
    );

    if (orgSchema) {
      // Parse founders
      let founders: FounderInfo[] = [];
      if (orgSchema.founder) {
        const founderData = Array.isArray(orgSchema.founder)
          ? orgSchema.founder
          : [orgSchema.founder];
        founders = founderData.map((f: unknown) => {
          if (typeof f === 'string') {
            return { name: f };
          }
          const founder = f as { name?: string; url?: string };
          return {
            name: founder.name || 'Unknown',
            url: founder.url,
          };
        });
      }

      // Parse founding date
      let foundingDate: Date | undefined;
      if (orgSchema.foundingDate) {
        const dateStr = orgSchema.foundingDate as string;
        foundingDate = new Date(dateStr);
        if (isNaN(foundingDate.getTime())) {
          foundingDate = undefined;
        }
      }

      return {
        organizationType: (orgSchema['@type'] as string) || 'Organization',
        legalName: (orgSchema.legalName as string) || (orgSchema.name as string) || '',
        name: (orgSchema.name as string) || '',
        alternateName: orgSchema.alternateName as string,
        description: (orgSchema.description as string) || metaInfo.description,
        slogan: orgSchema.slogan as string,
        foundingDate,
        foundingLocation: orgSchema.foundingLocation as string,
        founders: founders.length > 0 ? founders : undefined,
        address: orgSchema.address as OrganizationSchemaData['address'],
        numberOfEmployees:
          typeof orgSchema.numberOfEmployees === 'object'
            ? ((orgSchema.numberOfEmployees as { value?: string })?.value as string)
            : undefined,
        awards: Array.isArray(orgSchema.award) ? (orgSchema.award as string[]) : [],
        subOrganizations: [],
        jsonLdOutput: orgSchema,
      };
    }

    // Fallback to meta info
    return {
      organizationType: 'Organization',
      name: metaInfo.ogSiteName || metaInfo.ogTitle || metaInfo.title || '',
      legalName: metaInfo.ogSiteName || metaInfo.ogTitle || metaInfo.title || '',
      description: metaInfo.ogDescription || metaInfo.description,
      awards: [],
      subOrganizations: [],
    };
  }
}
