/**
 * ProductExtractorAgent - Extract products and services from website content
 *
 * This agent analyzes crawled website content to:
 * 1. Discover product/service pages
 * 2. Extract product information (name, description, features, pricing)
 * 3. Categorize products into a hierarchy
 * 4. Deduplicate and enrich product data
 * 5. Generate Schema.org Product markup
 */

import { AgentResult, AgentProgressCallback } from './types';
import OpenAI from 'openai';

// ============================================
// Product Extractor Types
// ============================================

export interface ExtractedProduct {
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  category?: string;
  subcategory?: string;
  features: string[];
  benefits: string[];
  useCases: string[];
  targetAudience?: string;
  pricingModel?: 'free' | 'freemium' | 'subscription' | 'one_time' | 'usage_based' | 'enterprise' | 'contact_sales';
  pricingTiers?: PricingTier[];
  competitors?: string[];
  differentiators?: string[];
  sourceUrl?: string;
  confidence: number;
  schemaOrg?: object;
}

export interface PricingTier {
  name: string;
  price?: number;
  currency?: string;
  billingPeriod?: 'monthly' | 'annual' | 'one_time';
  features?: string[];
  isPopular?: boolean;
}

export interface ProductCategory {
  name: string;
  slug: string;
  description?: string;
  parentSlug?: string;
  level: number;
  productCount: number;
}

export interface ProductExtractorResult {
  products: ExtractedProduct[];
  categories: ProductCategory[];
  productPageUrls: string[];
  rawExtraction: object;
}

export interface ProductExtractorOptions {
  maxProducts?: number;
  extractPricing?: boolean;
  extractCompetitors?: boolean;
  onProgress?: AgentProgressCallback;
}

// ============================================
// Product Extractor Agent
// ============================================

export class ProductExtractorAgent {
  private openai: OpenAI;
  private firecrawlUrl: string;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.firecrawlUrl = process.env.FIRECRAWL_INTERNAL_URL || 'http://localhost:3002';
  }

  /**
   * Extract products from website content
   */
  async extract(
    websiteUrl: string,
    websiteContent: string,
    brandName: string,
    options: ProductExtractorOptions = {}
  ): Promise<AgentResult<ProductExtractorResult>> {
    const startTime = Date.now();
    const onProgress = options.onProgress || (() => {});

    try {
      onProgress('products', 0, 'Discovering product pages...');

      // Step 1: Discover product pages from content
      const productPageUrls = await this.discoverProductPages(websiteUrl, websiteContent);

      onProgress('products', 20, `Found ${productPageUrls.length} potential product pages`);

      // Step 2: Extract products from main content
      const extractedProducts = await this.extractProductsFromContent(
        websiteContent,
        brandName,
        options
      );

      onProgress('products', 50, 'Extracting pricing information...');

      // Step 3: Extract pricing if enabled
      let productsWithPricing = extractedProducts;
      if (options.extractPricing !== false) {
        productsWithPricing = await this.enrichWithPricing(extractedProducts, websiteContent);
      }

      onProgress('products', 70, 'Categorizing products...');

      // Step 4: Build category hierarchy
      const categories = this.buildCategoryHierarchy(productsWithPricing);

      onProgress('products', 85, 'Deduplicating and enriching...');

      // Step 5: Deduplicate and enrich
      const finalProducts = this.deduplicateProducts(productsWithPricing);

      // Step 6: Generate Schema.org markup
      const productsWithSchema = finalProducts.map(p => ({
        ...p,
        schemaOrg: this.generateProductSchema(p, brandName),
      }));

      onProgress('products', 100, 'Product extraction complete');

      const duration = Date.now() - startTime;

      return {
        success: true,
        data: {
          products: productsWithSchema,
          categories,
          productPageUrls,
          rawExtraction: { productsFound: productsWithSchema.length },
        },
        confidence: productsWithSchema.length > 0 ? 0.8 : 0.4,
        source: 'product_extractor_agent',
        duration,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        confidence: 0,
        source: 'product_extractor_agent',
        errors: [errorMessage],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Discover product page URLs from website content
   */
  private async discoverProductPages(websiteUrl: string, content: string): Promise<string[]> {
    const productPatterns = [
      /\/products?\//gi,
      /\/services?\//gi,
      /\/solutions?\//gi,
      /\/offerings?\//gi,
      /\/pricing\//gi,
      /\/plans?\//gi,
      /\/features?\//gi,
    ];

    const urls: string[] = [];
    const baseUrl = new URL(websiteUrl).origin;

    // Extract href links from content
    const linkRegex = /href=["']([^"']+)["']/gi;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const href = match[1];
      for (const pattern of productPatterns) {
        if (pattern.test(href)) {
          const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href.startsWith('/') ? '' : '/'}${href}`;
          if (!urls.includes(fullUrl)) {
            urls.push(fullUrl);
          }
          break;
        }
      }
    }

    return urls.slice(0, 20); // Limit to 20 product pages
  }

  /**
   * Extract products from website content using AI
   */
  private async extractProductsFromContent(
    content: string,
    brandName: string,
    options: ProductExtractorOptions
  ): Promise<ExtractedProduct[]> {
    const maxProducts = options.maxProducts || 50;

    // Truncate content to fit token limits
    const truncatedContent = content.slice(0, 50000);

    const systemPrompt = `You are an expert at extracting product and service information from website content.
Analyze the provided website content and extract all products, services, or solutions offered by ${brandName}.

For each product/service, extract:
- name: The product/service name
- description: A clear description (1-3 sentences)
- shortDescription: One-line summary
- category: Primary category (e.g., "Software", "Consulting", "Hardware")
- subcategory: More specific category
- features: Key features as an array
- benefits: Customer benefits as an array
- useCases: Common use cases as an array
- targetAudience: Who the product is for
- pricingModel: One of: free, freemium, subscription, one_time, usage_based, enterprise, contact_sales

Be thorough but accurate. Only include products/services that are clearly offered by the company.
Return a JSON object with a "products" array.`;

    const userPrompt = `Extract all products and services from this ${brandName} website content:

${truncatedContent}

Return JSON with format:
{
  "products": [
    {
      "name": "Product Name",
      "description": "Description...",
      "shortDescription": "One line...",
      "category": "Category",
      "subcategory": "Subcategory",
      "features": ["feature1", "feature2"],
      "benefits": ["benefit1", "benefit2"],
      "useCases": ["usecase1", "usecase2"],
      "targetAudience": "Target audience",
      "pricingModel": "subscription"
    }
  ]
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 4000,
      });

      const responseText = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(responseText);
      const products = (parsed.products || []).slice(0, maxProducts);

      // Add slugs and confidence scores
      return products.map((p: Partial<ExtractedProduct>) => ({
        ...p,
        name: p.name || 'Unknown Product',
        slug: this.generateSlug(p.name || 'unknown'),
        features: p.features || [],
        benefits: p.benefits || [],
        useCases: p.useCases || [],
        confidence: 0.75,
      }));
    } catch (error) {
      console.error('Product extraction error:', error);
      return [];
    }
  }

  /**
   * Enrich products with pricing information
   */
  private async enrichWithPricing(
    products: ExtractedProduct[],
    content: string
  ): Promise<ExtractedProduct[]> {
    // Look for pricing patterns in content
    const pricingPatterns = [
      /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|EUR|GBP)/gi,
      /(?:starting at|from)\s*\$?(\d+)/gi,
      /\/month/gi,
      /\/year/gi,
      /per\s+user/gi,
      /per\s+seat/gi,
    ];

    const hasPricingContent = pricingPatterns.some(p => p.test(content));

    if (!hasPricingContent) {
      return products;
    }

    // Use AI to extract pricing details
    const truncatedContent = content.slice(0, 30000);

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert at extracting pricing information from website content.
Extract pricing tiers for each product mentioned. Be accurate - only include prices you're confident about.`,
          },
          {
            role: 'user',
            content: `Extract pricing information for these products:
${products.map(p => p.name).join(', ')}

From this content:
${truncatedContent}

Return JSON:
{
  "pricing": {
    "Product Name": {
      "tiers": [
        {"name": "Basic", "price": 10, "currency": "USD", "billingPeriod": "monthly", "features": ["feature1"]}
      ]
    }
  }
}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 2000,
      });

      const responseText = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(responseText);
      const pricing = parsed.pricing || {};

      return products.map(p => {
        const productPricing = pricing[p.name];
        if (productPricing?.tiers?.length) {
          return {
            ...p,
            pricingTiers: productPricing.tiers,
          };
        }
        return p;
      });
    } catch (error) {
      console.error('Pricing extraction error:', error);
      return products;
    }
  }

  /**
   * Build category hierarchy from extracted products
   */
  private buildCategoryHierarchy(products: ExtractedProduct[]): ProductCategory[] {
    const categoryMap = new Map<string, ProductCategory>();

    for (const product of products) {
      const category = product.category || 'Uncategorized';
      const subcategory = product.subcategory;

      // Add main category
      const categorySlug = this.generateSlug(category);
      if (!categoryMap.has(categorySlug)) {
        categoryMap.set(categorySlug, {
          name: category,
          slug: categorySlug,
          level: 0,
          productCount: 0,
        });
      }
      categoryMap.get(categorySlug)!.productCount++;

      // Add subcategory if exists
      if (subcategory) {
        const subcategorySlug = this.generateSlug(subcategory);
        if (!categoryMap.has(subcategorySlug)) {
          categoryMap.set(subcategorySlug, {
            name: subcategory,
            slug: subcategorySlug,
            parentSlug: categorySlug,
            level: 1,
            productCount: 0,
          });
        }
        categoryMap.get(subcategorySlug)!.productCount++;
      }
    }

    return Array.from(categoryMap.values());
  }

  /**
   * Deduplicate products by name similarity
   */
  private deduplicateProducts(products: ExtractedProduct[]): ExtractedProduct[] {
    const seen = new Map<string, ExtractedProduct>();

    for (const product of products) {
      const normalizedName = product.name.toLowerCase().trim();
      const existingKey = Array.from(seen.keys()).find(key =>
        this.stringSimilarity(key, normalizedName) > 0.85
      );

      if (existingKey) {
        // Merge with existing product (keep the one with more data)
        const existing = seen.get(existingKey)!;
        if ((product.features?.length || 0) > (existing.features?.length || 0)) {
          seen.set(existingKey, product);
        }
      } else {
        seen.set(normalizedName, product);
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Simple string similarity check (Dice coefficient)
   */
  private stringSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    if (a.length < 2 || b.length < 2) return 0;

    const getBigrams = (str: string): Set<string> => {
      const bigrams = new Set<string>();
      for (let i = 0; i < str.length - 1; i++) {
        bigrams.add(str.slice(i, i + 2));
      }
      return bigrams;
    };

    const aBigrams = getBigrams(a);
    const bBigrams = getBigrams(b);
    let matches = 0;

    for (const bigram of aBigrams) {
      if (bBigrams.has(bigram)) matches++;
    }

    return (2 * matches) / (aBigrams.size + bBigrams.size);
  }

  /**
   * Generate URL-friendly slug
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Generate Schema.org Product markup
   */
  private generateProductSchema(product: ExtractedProduct, brandName: string): object {
    const schema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': product.pricingModel === 'subscription' ? 'SoftwareApplication' : 'Product',
      name: product.name,
      description: product.description,
      brand: {
        '@type': 'Brand',
        name: brandName,
      },
    };

    if (product.category) {
      schema.category = product.category;
    }

    if (product.features?.length) {
      schema.featureList = product.features;
    }

    if (product.pricingTiers?.length) {
      const tier = product.pricingTiers.find(t => t.price) || product.pricingTiers[0];
      if (tier?.price) {
        schema.offers = {
          '@type': 'Offer',
          price: tier.price,
          priceCurrency: tier.currency || 'USD',
          priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        };
      }
    }

    return schema;
  }

  /**
   * Crawl specific product pages for more detailed extraction
   */
  async crawlProductPages(
    productUrls: string[],
    brandName: string,
    options: ProductExtractorOptions = {}
  ): Promise<AgentResult<ProductExtractorResult>> {
    const startTime = Date.now();
    const onProgress = options.onProgress || (() => {});
    const allProducts: ExtractedProduct[] = [];
    const maxUrls = Math.min(productUrls.length, 10);

    try {
      for (let i = 0; i < maxUrls; i++) {
        const url = productUrls[i];
        onProgress('products', (i / maxUrls) * 100, `Crawling ${url}...`);

        try {
          const response = await fetch(`${this.firecrawlUrl}/v1/scrape`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url,
              formats: ['markdown'],
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data?.markdown) {
              const products = await this.extractProductsFromContent(
                data.data.markdown,
                brandName,
                { maxProducts: 5 }
              );
              products.forEach(p => {
                p.sourceUrl = url;
              });
              allProducts.push(...products);
            }
          }
        } catch (err) {
          console.warn(`Failed to crawl ${url}:`, err);
        }
      }

      const deduped = this.deduplicateProducts(allProducts);
      const categories = this.buildCategoryHierarchy(deduped);

      return {
        success: true,
        data: {
          products: deduped,
          categories,
          productPageUrls: productUrls,
          rawExtraction: { pagesProcessed: maxUrls, productsFound: deduped.length },
        },
        confidence: deduped.length > 0 ? 0.85 : 0.3,
        source: 'product_extractor_agent',
        duration: Date.now() - startTime,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        confidence: 0,
        source: 'product_extractor_agent',
        errors: [errorMessage],
        duration: Date.now() - startTime,
      };
    }
  }
}
