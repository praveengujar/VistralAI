/**
 * Web Crawler Service
 * Crawls websites to extract brand information and content
 */

import { load } from 'cheerio';

export interface PageContent {
  url: string;
  title: string;
  description?: string;
  content: string;
  headings: string[];
  links: string[];
}

export interface CrawlResult {
  homepage: PageContent;
  aboutPages: PageContent[];
  productPages: PageContent[];
  rawText: string;
  metadata: {
    title: string;
    description: string;
    keywords: string[];
  };
  crawledUrls: string[];
  crawlDuration: number; // milliseconds
}

export interface CrawlOptions {
  maxDepth?: number;
  maxPages?: number;
  timeout?: number;
  respectRobotsTxt?: boolean;
}

const DEFAULT_OPTIONS: CrawlOptions = {
  maxDepth: 2,
  maxPages: 10,
  timeout: 30000,
  respectRobotsTxt: true,
};

const RELEVANT_PAGE_PATTERNS = [
  /about/i,
  /company/i,
  /team/i,
  /mission/i,
  /vision/i,
  /values/i,
  /story/i,
  /products?/i,
  /services?/i,
  /solutions?/i,
  /features?/i,
  /pricing/i,
  /press/i,
  /blog/i,
  /investors?/i,
  /careers?/i,
  /contact/i,
];

/**
 * Validates and normalizes a URL
 */
function normalizeUrl(urlString: string, baseUrl?: string): string | null {
  try {
    if (!urlString.startsWith('http')) {
      if (baseUrl) {
        urlString = new URL(urlString, baseUrl).href;
      } else {
        return null;
      }
    }
    const url = new URL(urlString);
    // Remove hash and query params for comparison
    return url.origin + url.pathname;
  } catch {
    return null;
  }
}

/**
 * Gets domain from URL
 */
function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

/**
 * Extracts text content from HTML
 */
function cleanHtmlToText(html: string): string {
  if (!html) return '';

  const $ = load(html);

  // Remove script and style elements
  $('script, style, noscript, meta, link, [type="application/ld+json"]').remove();

  // Get text content
  let text = $('body').text() || $('html').text() || '';

  // Clean up whitespace
  text = text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();

  return text;
}

/**
 * Extracts structured data from HTML
 */
function extractPageData(html: string, url: string): PageContent {
  const $ = load(html);

  // Remove script and style elements
  $('script, style, noscript, meta, link').remove();

  // Extract title
  const title = $('title').text() || $('h1').first().text() || 'Untitled';

  // Extract meta description
  const description = $('meta[name="description"]').attr('content') || '';

  // Extract all headings
  const headings: string[] = [];
  $('h1, h2, h3, h4, h5, h6').each((_, elem) => {
    const text = $(elem).text().trim();
    if (text) headings.push(text);
  });

  // Extract all links
  const links: string[] = [];
  $('a[href]').each((_, elem) => {
    const href = $(elem).attr('href');
    if (href && !href.startsWith('#')) {
      const normalized = normalizeUrl(href, url);
      if (normalized) links.push(normalized);
    }
  });

  // Extract main content
  const content = cleanHtmlToText(html);

  return {
    url,
    title,
    description,
    content,
    headings,
    links: [...new Set(links)], // Remove duplicates
  };
}

/**
 * Determines if a URL matches relevant brand pages
 */
function isRelevantPage(url: string): boolean {
  const pathname = new URL(url).pathname.toLowerCase();
  return RELEVANT_PAGE_PATTERNS.some((pattern) => pattern.test(pathname));
}

/**
 * Fetches a single page with timeout
 */
async function fetchPage(url: string, timeout = 10000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'VistralAI-Bot/1.0 (+https://vistralai.com/bot)',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const html = await response.text();
    return html;
  } catch (error) {
    // Network error, timeout, or other fetch error
    return null;
  }
}

/**
 * Main WebCrawler class
 */
export class WebCrawler {
  private crawledUrls: Set<string> = new Set();
  private urlQueue: Array<{ url: string; depth: number }> = [];
  private options: Required<CrawlOptions>;

  constructor(options?: CrawlOptions) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...(options || {}),
    } as Required<CrawlOptions>;
  }

  /**
   * Crawls a website and extracts brand information
   */
  async crawlBrandWebsite(url: string): Promise<CrawlResult> {
    const startTime = Date.now();
    this.crawledUrls.clear();
    this.urlQueue = [];

    // Normalize homepage URL
    const homepageUrl = normalizeUrl(url);
    if (!homepageUrl) {
      throw new Error(`Invalid URL: ${url}`);
    }

    const domain = getDomain(homepageUrl);
    const homepage = await this.crawlPage(homepageUrl, 0, domain);

    if (!homepage) {
      throw new Error(`Failed to fetch homepage: ${homepageUrl}`);
    }

    // Extract relevant links from homepage
    const relevantLinks = homepage.links
      .filter((link) => {
        const linkDomain = getDomain(link);
        return linkDomain === domain && isRelevantPage(link);
      })
      .slice(0, this.options.maxPages - 1);

    // Crawl relevant pages
    const aboutPages: PageContent[] = [];
    const productPages: PageContent[] = [];

    for (const link of relevantLinks) {
      if (this.crawledUrls.size >= this.options.maxPages) break;

      const pageData = await this.crawlPage(link, 1, domain);
      if (pageData) {
        const pathname = new URL(link).pathname.toLowerCase();
        if (pathname.includes('about') || pathname.includes('company') || pathname.includes('mission')) {
          aboutPages.push(pageData);
        } else if (pathname.includes('product') || pathname.includes('service') || pathname.includes('feature')) {
          productPages.push(pageData);
        }
      }
    }

    // Combine all text for LLM processing
    const allPageContent = [
      homepage,
      ...aboutPages,
      ...productPages,
    ]
      .map((p) => p.content)
      .join('\n\n');

    // Extract metadata
    const $ = load(
      await fetchPage(homepageUrl).then((html) => html || ''),
    );

    const metadata = {
      title: $('title').text() || homepage.title,
      description: $('meta[name="description"]').attr('content') || homepage.description || '',
      keywords: (
        $('meta[name="keywords"]').attr('content') || ''
      )
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)
        .slice(0, 10),
    };

    const crawlDuration = Date.now() - startTime;

    return {
      homepage,
      aboutPages,
      productPages,
      rawText: allPageContent,
      metadata,
      crawledUrls: Array.from(this.crawledUrls),
      crawlDuration,
    };
  }

  /**
   * Crawls a single page
   */
  private async crawlPage(
    url: string,
    depth: number,
    domain: string,
  ): Promise<PageContent | null> {
    // Check if already crawled
    const normalized = normalizeUrl(url);
    if (!normalized || this.crawledUrls.has(normalized)) {
      return null;
    }

    // Check depth and page limit
    if (depth > this.options.maxDepth || this.crawledUrls.size >= this.options.maxPages) {
      return null;
    }

    // Check domain matches
    if (getDomain(normalized) !== domain) {
      return null;
    }

    this.crawledUrls.add(normalized);

    try {
      const html = await fetchPage(normalized, this.options.timeout);
      if (!html) return null;

      return extractPageData(html, normalized);
    } catch (error) {
      console.error(`Error crawling ${normalized}:`, error);
      return null;
    }
  }
}

/**
 * Simulates website crawling for mock data (MVP)
 */
export async function simulateWebsiteCrawl(domain: string): Promise<CrawlResult> {
  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const mockHomepage: PageContent = {
    url: `https://${domain}`,
    title: `Welcome to ${domain.split('.')[0]}`,
    description: `Leading brand in innovative solutions for modern businesses`,
    content: `
      We are a premium brand focused on delivering exceptional products and services.
      Our mission is to help businesses succeed in the digital age.
      Founded in 2015, we have grown to serve thousands of customers worldwide.
      Our team is passionate about innovation and customer success.
      We specialize in providing cutting-edge solutions with 24/7 support.
    `,
    headings: [
      'Welcome',
      'Our Mission',
      'Products',
      'Services',
      'Contact Us',
    ],
    links: [
      `https://${domain}/about`,
      `https://${domain}/products`,
      `https://${domain}/services`,
      `https://${domain}/team`,
    ],
  };

  const mockAboutPage: PageContent = {
    url: `https://${domain}/about`,
    title: `About Us`,
    description: `Learn more about our company and team`,
    content: `
      We are a forward-thinking company dedicated to innovation and excellence.
      Our core values include integrity, innovation, and customer focus.
      We believe in sustainable business practices and social responsibility.
      Our team consists of industry experts with over 100 years of combined experience.
      We are committed to delivering value to our customers every day.
    `,
    headings: [
      'Our Story',
      'Our Mission',
      'Our Values',
      'Our Team',
    ],
    links: [],
  };

  const mockProductPage: PageContent = {
    url: `https://${domain}/products`,
    title: `Products`,
    description: `Explore our product offerings`,
    content: `
      Our product line includes:
      1. Premium Solution - Our flagship product designed for enterprises
      2. Business Suite - Complete toolkit for mid-sized organizations
      3. Essential Package - Affordable solution for startups
      4. Professional Services - Custom implementation and support
      Features include advanced analytics, real-time reporting, and integrations.
      All products come with 24/7 customer support and 30-day free trial.
    `,
    headings: [
      'Our Products',
      'Premium Solution',
      'Business Suite',
      'Essential Package',
      'Pricing',
    ],
    links: [],
  };

  return {
    homepage: mockHomepage,
    aboutPages: [mockAboutPage],
    productPages: [mockProductPage],
    rawText: [
      mockHomepage.content,
      mockAboutPage.content,
      mockProductPage.content,
    ].join('\n\n'),
    metadata: {
      title: `${domain.split('.')[0]} - Premium Solutions`,
      description: 'Leading provider of innovative business solutions',
      keywords: [
        'solutions',
        'enterprise',
        'software',
        'services',
        'digital',
      ],
    },
    crawledUrls: [
      `https://${domain}`,
      `https://${domain}/about`,
      `https://${domain}/products`,
    ],
    crawlDuration: 2000,
  };
}
