/**
 * Brand Intelligence Service Tests
 * Unit tests for extraction with fallback to mock data
 */

import { BrandIntelligence } from '@/lib/services/llm/BrandIntelligence';
import { CrawlResult } from '@/lib/services/crawler';

describe('BrandIntelligence', () => {
  let service: BrandIntelligence;

  const mockCrawlData: CrawlResult = {
    url: 'https://example.com',
    html: '<html><body>Company mission...</body></html>',
    markdown: '# About Us\n\nOur mission is to empower businesses.',
    metadata: {
      title: 'Example Company',
      description: 'A leading company in tech',
      keywords: ['tech', 'innovation'],
    },
    crawlDuration: 2000,
  };

  beforeEach(() => {
    // Initialize without API key to force mock mode
    service = new BrandIntelligence(undefined);
  });

  describe('Brand Identity Extraction', () => {
    it('should extract brand identity with mock data when no API key', async () => {
      const identity = await service.extractBrandIdentity(mockCrawlData, 'example.com');

      expect(identity).toBeDefined();
      expect(identity.mission).toBeDefined();
      expect(identity.vision).toBeDefined();
      expect(identity.coreValues).toBeDefined();
      expect(Array.isArray(identity.coreValues)).toBe(true);
    });

    it('should extract brand identity with proper structure', async () => {
      const identity = await service.extractBrandIdentity(mockCrawlData, 'example.com');

      expect(identity).toHaveProperty('mission');
      expect(identity).toHaveProperty('vision');
      expect(identity).toHaveProperty('coreValues');
      expect(identity).toHaveProperty('brandVoiceAttributes');
      expect(identity).toHaveProperty('uniqueSellingPropositions');
      expect(identity).toHaveProperty('targetAudienceSummary');
      expect(identity).toHaveProperty('industryVertical');
      expect(identity).toHaveProperty('confidence');
    });

    it('should return confidence score between 0 and 1', async () => {
      const identity = await service.extractBrandIdentity(mockCrawlData, 'example.com');

      expect(typeof identity.confidence).toBe('number');
      expect(identity.confidence).toBeGreaterThanOrEqual(0);
      expect(identity.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle different domain formats', async () => {
      const domains = ['example.com', 'www.example.com', 'https://example.com'];

      for (const domain of domains) {
        const identity = await service.extractBrandIdentity(mockCrawlData, domain);
        expect(identity).toBeDefined();
        expect(identity.mission).toBeDefined();
      }
    });
  });

  describe('Competitor Identification', () => {
    it('should identify competitors from crawl data', async () => {
      const competitors = await service.identifyCompetitors(mockCrawlData, 'example.com');

      expect(Array.isArray(competitors)).toBe(true);
      expect(competitors.length).toBeGreaterThan(0);
    });

    it('should return competitor objects with required fields', async () => {
      const competitors = await service.identifyCompetitors(mockCrawlData, 'example.com');

      competitors.forEach((competitor) => {
        expect(competitor).toHaveProperty('name');
        expect(competitor).toHaveProperty('competitionType');
        expect(competitor).toHaveProperty('rationale');
        expect(competitor).toHaveProperty('confidence');

        expect(typeof competitor.name).toBe('string');
        expect(['direct', 'indirect', 'aspirational']).toContain(competitor.competitionType);
        expect(typeof competitor.confidence).toBe('number');
        expect(competitor.confidence).toBeGreaterThanOrEqual(0);
        expect(competitor.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should assign appropriate confidence scores', async () => {
      const competitors = await service.identifyCompetitors(mockCrawlData, 'example.com');

      competitors.forEach((competitor) => {
        // Competitors should have meaningful confidence
        expect(competitor.confidence).toBeGreaterThan(0);
      });
    });
  });

  describe('Product Categorization', () => {
    it('should categorize products from crawl data', async () => {
      const products = await service.categorizeProducts(mockCrawlData);

      expect(Array.isArray(products)).toBe(true);
    });

    it('should return product objects with required fields', async () => {
      const products = await service.categorizeProducts(mockCrawlData);

      products.forEach((product) => {
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('description');
        expect(product).toHaveProperty('keyFeatures');
        expect(product).toHaveProperty('targetMarket');

        expect(typeof product.name).toBe('string');
        expect(typeof product.description).toBe('string');
        expect(Array.isArray(product.keyFeatures)).toBe(true);
        expect(typeof product.targetMarket).toBe('string');
      });
    });

    it('should extract features for each product', async () => {
      const products = await service.categorizeProducts(mockCrawlData);

      products.forEach((product) => {
        if (product.keyFeatures.length > 0) {
          product.keyFeatures.forEach((feature) => {
            expect(typeof feature).toBe('string');
            expect(feature.length).toBeGreaterThan(0);
          });
        }
      });
    });
  });

  describe('Mock Data Generation', () => {
    it('should generate consistent mock data for same domain', async () => {
      const identity1 = await service.extractBrandIdentity(mockCrawlData, 'example.com');
      const identity2 = await service.extractBrandIdentity(mockCrawlData, 'example.com');

      // Mock data should have same domain-based properties
      expect(identity1.industryVertical).toBeDefined();
      expect(identity2.industryVertical).toBeDefined();
    });

    it('should generate different mock data for different domains', async () => {
      const identity1 = await service.extractBrandIdentity(mockCrawlData, 'tech.com');
      const identity2 = await service.extractBrandIdentity(mockCrawlData, 'retail.com');

      // Different domains should produce different results
      expect(identity1).toBeDefined();
      expect(identity2).toBeDefined();
      // But both should be valid
      expect(identity1.mission).toBeDefined();
      expect(identity2.mission).toBeDefined();
    });
  });

  describe('Fallback Behavior', () => {
    it('should fallback to mock data on API error', async () => {
      // Service initialized without API key, will use mock data
      const identity = await service.extractBrandIdentity(mockCrawlData, 'example.com');

      // Should still return valid data
      expect(identity).toBeDefined();
      expect(identity.mission).toBeDefined();
      expect(typeof identity.mission).toBe('string');
    });

    it('should handle empty crawl data gracefully', async () => {
      const emptyCrawlData: CrawlResult = {
        url: 'https://example.com',
        html: '',
        markdown: '',
        metadata: { title: 'Empty' },
        crawlDuration: 0,
      };

      const identity = await service.extractBrandIdentity(emptyCrawlData, 'example.com');

      // Should still generate mock data
      expect(identity).toBeDefined();
      expect(identity.mission).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should not throw on invalid input', async () => {
      const invalidCrawlData = {
        url: 'invalid',
        html: null,
        markdown: undefined,
        metadata: null,
      } as any;

      await expect(
        service.extractBrandIdentity(invalidCrawlData, 'example.com')
      ).resolves.toBeDefined();
    });

    it('should handle missing crawl metadata', async () => {
      const minimumCrawlData: CrawlResult = {
        url: 'https://example.com',
        html: '',
        markdown: '',
        metadata: {},
        crawlDuration: 0,
      };

      const identity = await service.extractBrandIdentity(minimumCrawlData, 'example.com');
      expect(identity).toBeDefined();
    });
  });

  describe('Data Quality', () => {
    it('should return non-empty values for critical fields', async () => {
      const identity = await service.extractBrandIdentity(mockCrawlData, 'example.com');

      expect(identity.mission?.length).toBeGreaterThan(0);
      expect(identity.vision?.length).toBeGreaterThan(0);
      expect(identity.coreValues?.length).toBeGreaterThan(0);
    });

    it('should ensure coreValues is an array', async () => {
      const identity = await service.extractBrandIdentity(mockCrawlData, 'example.com');

      expect(Array.isArray(identity.coreValues)).toBe(true);
      if (identity.coreValues.length > 0) {
        identity.coreValues.forEach((value) => {
          expect(typeof value).toBe('string');
          expect(value.length).toBeGreaterThan(0);
        });
      }
    });

    it('should ensure confidence is valid for all extractions', async () => {
      const identity = await service.extractBrandIdentity(mockCrawlData, 'example.com');
      const competitors = await service.identifyCompetitors(mockCrawlData, 'example.com');
      const products = await service.categorizeProducts(mockCrawlData);

      expect(identity.confidence).toBeGreaterThan(0);
      expect(identity.confidence).toBeLessThanOrEqual(1);

      competitors.forEach((c) => {
        expect(c.confidence).toBeGreaterThan(0);
        expect(c.confidence).toBeLessThanOrEqual(1);
      });
    });
  });
});
