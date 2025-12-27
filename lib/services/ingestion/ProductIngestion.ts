/**
 * Product Ingestion Service
 * Handles product data extracted from website content
 */
import { CrawlResult } from '../crawler/WebCrawler';

export interface RawProduct {
  sku?: string;
  name: string;
  category?: string;
  subcategory?: string;
  description?: string;
  shortDescription?: string;
  price?: number;
  currency?: string;
  features?: string[];
  benefits?: string[];
  useCases?: string[];
  url?: string;
  imageUrl?: string;
  specifications?: Record<string, string>;
}

export interface ProductIngestionResult {
  products: RawProduct[];
  source: 'website';
  totalCount: number;
  validCount: number;
  errors: any[]; // Kept for interface consistency, but should be empty for website extraction
  warnings: string[];
}

/**
 * Main ProductIngestion class for SERVER-SIDE use
 */
export class ProductIngestion {
  /**
   * Extracts products from crawled website data
   *
   * In a real application, this would use an LLM to extract product info
   * from the crawled text content. For this MVP, it returns mock data.
   */
  async extractFromWebsite(
    crawlData: CrawlResult,
  ): Promise<ProductIngestionResult> {
    const hasProductPage = crawlData.productPages.length > 0;

    if (!hasProductPage) {
      return {
        products: [],
        source: 'website',
        totalCount: 0,
        validCount: 0,
        errors: [],
        warnings: [
          'No product pages were detected during the website crawl. Products may need to be entered manually.',
        ],
      };
    }

    // Simulate finding sample products from the content of product pages
    // This is where an LLM call would go in a real implementation
    const products: RawProduct[] = [
      {
        name: 'Premium Solution',
        description: 'An enterprise-grade solution for large organizations, providing advanced analytics and real-time reporting.',
        category: 'Services',
        price: 5000,
        currency: 'USD',
        features: [
          'Advanced analytics',
          'Real-time reporting',
          'Custom integrations',
        ],
        benefits: [
          'Increased ROI',
          '24/7 support',
          'Scalable infrastructure',
        ],
        url: crawlData.productPages[0]?.url || crawlData.homepage.url,
      },
      {
        name: 'Professional Package',
        description: 'A complete toolkit for mid-sized businesses, featuring core analytics and standard integrations.',
        category: 'Services',
        price: 1500,
        currency: 'USD',
        features: [
          'Core analytics',
          'Monthly reporting',
          'Standard integrations',
        ],
        benefits: [
          'Cost-effective',
          'Easy setup',
          'Reliable support',
        ],
        url: crawlData.productPages[0]?.url || crawlData.homepage.url,
      },
    ];

    return {
      products,
      source: 'website',
      totalCount: products.length,
      validCount: products.length,
      errors: [],
      warnings: [
        'Products were extracted from website content. Please review for accuracy.',
      ],
    };
  }
}

/**
 * Helper function to create a ProductIngestion instance for server-side use.
 */
export function createProductIngestion(): ProductIngestion {
  return new ProductIngestion();
}
