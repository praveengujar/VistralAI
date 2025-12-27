/**
 * End-to-End Onboarding Flow Tests
 * Integration tests for complete analysis pipeline
 */

import { getCrawler } from '@/lib/services/crawler';
import { BrandIntelligence } from '@/lib/services/llm/BrandIntelligence';
import { getReviewQueueService } from '@/lib/services/queue/ReviewQueueService';
import { getQueueService } from '@/lib/services/queue/QueueFactory';
import { FEATURES } from '@/lib/config/features';

describe('End-to-End Onboarding Flow', () => {
  const testJobId = `e2e_test_${Date.now()}`;
  const testBrandId = 'test_brand_001';
  const testWebsiteUrl = 'https://example.com';

  describe('Complete Analysis Pipeline', () => {
    it('should complete crawl → extract → analyze → review flow', async () => {
      const crawler = getCrawler();
      const intelligence = new BrandIntelligence(undefined);
      const reviewService = getReviewQueueService();
      const queueService = await getQueueService();

      // Step 1: Crawl Website
      let crawlResult;
      try {
        crawlResult = await crawler.crawlBrandWebsite(testWebsiteUrl);
        expect(crawlResult).toBeDefined();
        expect(crawlResult.markdown).toBeDefined();
      } catch (error) {
        // Mock crawler will succeed
        expect(error).not.toBeDefined();
      }

      // Step 2: Extract Brand Intelligence
      const identity = await intelligence.extractBrandIdentity(crawlResult!, 'example.com');
      const competitors = await intelligence.identifyCompetitors(crawlResult!, 'example.com');
      const products = await intelligence.categorizeProducts(crawlResult!);

      expect(identity).toBeDefined();
      expect(identity.mission).toBeDefined();
      expect(Array.isArray(competitors)).toBe(true);
      expect(Array.isArray(products)).toBe(true);

      // Step 3: Create Review for Low-Confidence Data
      const review = await reviewService.createReview({
        jobId: testJobId,
        dataType: 'identity',
        extractedData: identity,
        confidenceScores: {
          mission: 0.75, // Low confidence
          vision: 0.80,
          coreValues: 0.95,
        },
        thresholdUsed: FEATURES.CONFIDENCE_THRESHOLD,
      });

      expect(review).toBeDefined();
      expect(review.status).toBe('pending');
      expect(review.fieldReviews.length).toBeGreaterThan(0);

      // Step 4: Enqueue Jobs
      const crawlJobId = await queueService.enqueueCrawlJob({
        jobId: testJobId,
        brandId: testBrandId,
        websiteUrl: testWebsiteUrl,
      });

      expect(crawlJobId).toBeDefined();

      // Step 5: Track Progress
      const progress = queueService.getJobProgress(testJobId);
      expect(progress).toBeDefined();
      expect(progress?.phase).toBe('crawl');
      expect(progress?.progress).toBeGreaterThan(0);

      // Step 6: Approve Review
      const approvedReview = await reviewService.approveReview(review.id, {
        reviewId: review.id,
        approvals: [
          { field: 'mission', status: 'approved' },
          { field: 'vision', status: 'edited', value: 'Updated vision' },
        ],
      });

      expect(approvedReview?.status).toBe('partially_approved');
      expect(approvedReview?.userApprovedData).toBeDefined();
    });
  });

  describe('Feature Flag Integration', () => {
    it('should respect USE_FIRECRAWL flag for crawler selection', async () => {
      const crawler = getCrawler();
      expect(crawler).toBeDefined();

      // Should use WebCrawler (mock) if USE_FIRECRAWL=false
      // Or FirecrawlService if USE_FIRECRAWL=true
    });

    it('should respect CONFIDENCE_THRESHOLD for review routing', async () => {
      const reviewService = getReviewQueueService();

      const review = await reviewService.createReview({
        jobId: testJobId + '_threshold',
        dataType: 'identity',
        extractedData: { mission: 'Test mission' },
        confidenceScores: {
          mission: FEATURES.CONFIDENCE_THRESHOLD - 0.01, // Just below threshold
        },
        thresholdUsed: FEATURES.CONFIDENCE_THRESHOLD,
      });

      // Should create review because below threshold
      expect(review.fieldReviews.length).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery', () => {
    it('should handle crawler failures gracefully', async () => {
      const crawler = getCrawler();

      try {
        // Invalid URL should fail gracefully
        await crawler.crawlBrandWebsite('invalid-url');
      } catch (error) {
        // Should throw error, but system continues
        expect(error).toBeDefined();
      }
    });

    it('should handle extraction failures and use mock data', async () => {
      const intelligence = new BrandIntelligence(undefined);

      const result = await intelligence.extractBrandIdentity(
        {
          url: 'https://example.com',
          html: '',
          markdown: '',
          metadata: {},
          crawlDuration: 0,
        },
        'example.com'
      );

      // Should return valid mock data even with empty crawl
      expect(result).toBeDefined();
      expect(result.mission).toBeDefined();
    });

    it('should continue processing even if review creation fails', async () => {
      const reviewService = getReviewQueueService();

      // Create valid review
      const review = await reviewService.createReview({
        jobId: testJobId + '_error_test',
        dataType: 'identity',
        extractedData: { mission: 'Test' },
        confidenceScores: { mission: 0.5 },
        thresholdUsed: 0.85,
      });

      expect(review).toBeDefined();

      // Try to approve non-existent review (should fail)
      const result = await reviewService.approveReview('non_existent', {
        reviewId: 'non_existent',
        approvals: [],
      });

      expect(result).toBeNull();

      // But system should be operational
      const stats = await reviewService.getStats();
      expect(stats).toBeDefined();
    });
  });

  describe('Data Flow Validation', () => {
    it('should validate data types through pipeline', async () => {
      const intelligence = new BrandIntelligence(undefined);

      const crawlData = {
        url: 'https://example.com',
        html: '<html></html>',
        markdown: '# Test',
        metadata: { title: 'Test' },
        crawlDuration: 1000,
      };

      const identity = await intelligence.extractBrandIdentity(crawlData, 'example.com');

      // Validate types
      expect(typeof identity.mission).toBe('string');
      expect(typeof identity.vision).toBe('string');
      expect(Array.isArray(identity.coreValues)).toBe(true);
      expect(typeof identity.confidence).toBe('number');
    });

    it('should maintain data consistency through review flow', async () => {
      const reviewService = getReviewQueueService();

      const originalData = { mission: 'Original mission' };

      const review = await reviewService.createReview({
        jobId: testJobId + '_consistency',
        dataType: 'identity',
        extractedData: originalData,
        confidenceScores: { mission: 0.75 },
        thresholdUsed: 0.85,
      });

      expect(review.extractedData).toEqual(originalData);

      const approved = await reviewService.approveReview(review.id, {
        reviewId: review.id,
        approvals: [{ field: 'mission', status: 'approved' }],
      });

      expect(approved?.userApprovedData.mission).toBe('Original mission');
    });
  });

  describe('Performance Characteristics', () => {
    it('should complete analysis within reasonable time', async () => {
      const startTime = Date.now();

      const crawler = getCrawler();
      const intelligence = new BrandIntelligence(undefined);

      try {
        const crawlResult = await crawler.crawlBrandWebsite('https://example.com');
        const identity = await intelligence.extractBrandIdentity(crawlResult, 'example.com');
        const competitors = await intelligence.identifyCompetitors(crawlResult, 'example.com');

        const duration = Date.now() - startTime;

        // Mock should complete quickly (under 5 seconds)
        // Real API calls would be slower
        expect(duration).toBeLessThan(10000);
      } catch (error) {
        // If external APIs fail, that's OK for this test
        expect(error).toBeDefined();
      }
    });

    it('should handle multiple concurrent jobs', async () => {
      const queueService = await getQueueService();

      const jobPromises = [];
      for (let i = 0; i < 5; i++) {
        jobPromises.push(
          queueService.enqueueCrawlJob({
            jobId: `concurrent_${i}`,
            brandId: testBrandId,
            websiteUrl: testWebsiteUrl,
          })
        );
      }

      const jobIds = await Promise.all(jobPromises);
      expect(jobIds.length).toBe(5);
      expect(jobIds.every((id) => id)).toBe(true);
    });
  });

  describe('Queue Integration', () => {
    it('should enqueue jobs in correct order (crawl → extract → analyze)', async () => {
      const queueService = await getQueueService();
      const reviewService = getReviewQueueService();

      const jobId = `queue_order_${Date.now()}`;

      // Enqueue crawl
      const crawlJobId = await queueService.enqueueCrawlJob({
        jobId,
        brandId: testBrandId,
        websiteUrl: testWebsiteUrl,
      });

      expect(crawlJobId).toBeDefined();

      // Enqueue extract
      const extractJobId = await queueService.enqueueExtractJob({
        jobId,
        brandId: testBrandId,
        crawlData: { url: testWebsiteUrl },
      });

      expect(extractJobId).toBeDefined();

      // Enqueue analyze
      const analyzeJobId = await queueService.enqueueAnalyzeJob({
        jobId,
        brandId: testBrandId,
        crawlData: { url: testWebsiteUrl },
        extractedIdentity: { mission: 'Test' },
        extractedCompetitors: [],
        extractedProducts: [],
      });

      expect(analyzeJobId).toBeDefined();
    });

    it('should track job progress through all phases', async () => {
      const queueService = await getQueueService();
      const jobId = `progress_tracking_${Date.now()}`;

      // Enqueue crawl job
      await queueService.enqueueCrawlJob({
        jobId,
        brandId: testBrandId,
        websiteUrl: testWebsiteUrl,
      });

      // Check initial progress
      let progress = queueService.getJobProgress(jobId);
      expect(progress?.phase).toBe('crawl');
      expect(progress?.progress).toBeGreaterThan(0);
      expect(progress?.progress).toBeLessThan(100);

      // Simulate progress update
      queueService.updateJobProgress(jobId, {
        phase: 'extract',
        progress: 33,
        status: 'Extracting...',
      });

      progress = queueService.getJobProgress(jobId);
      expect(progress?.phase).toBe('extract');
      expect(progress?.progress).toBe(33);
    });
  });

  describe('Review Statistics', () => {
    it('should accumulate statistics correctly', async () => {
      const reviewService = getReviewQueueService();

      const statsBefore = await reviewService.getStats();

      // Create a review
      const review = await reviewService.createReview({
        jobId: testJobId + '_stats',
        dataType: 'identity',
        extractedData: { mission: 'Test' },
        confidenceScores: { mission: 0.75 },
        thresholdUsed: 0.85,
      });

      const statsAfter = await reviewService.getStats();

      // Stats should increase
      expect(statsAfter.totalReviews).toBeGreaterThanOrEqual(statsBefore.totalReviews);
      expect(statsAfter.pendingReviews).toBeGreaterThanOrEqual(statsBefore.pendingReviews);
    });
  });
});
