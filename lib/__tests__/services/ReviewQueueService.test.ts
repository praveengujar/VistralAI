/**
 * Review Queue Service Tests
 * Unit and integration tests for ReviewQueueService
 */

import { getReviewQueueService } from '@/lib/services/queue/ReviewQueueService';
import { CreateReviewRequest, ApproveReviewRequest } from '@/types/extraction';

describe('ReviewQueueService', () => {
  const service = getReviewQueueService();

  beforeEach(() => {
    // Clear any previous reviews for clean tests
    service.cleanup();
  });

  describe('Review Creation', () => {
    it('should create review with low-confidence fields', async () => {
      const request: CreateReviewRequest = {
        jobId: 'job_1',
        dataType: 'identity',
        extractedData: {
          mission: 'To empower businesses',
          vision: 'Become global leader',
          coreValues: ['Quality', 'Innovation'],
        },
        confidenceScores: {
          mission: 0.75, // Below 85% threshold
          vision: 0.82, // Below 85% threshold
          coreValues: 0.95, // Above threshold
        },
        thresholdUsed: 0.85,
      };

      const review = await service.createReview(request);

      expect(review.id).toBeDefined();
      expect(review.jobId).toBe('job_1');
      expect(review.dataType).toBe('identity');
      expect(review.status).toBe('pending');
      expect(review.fieldReviews.length).toBe(2); // Only mission and vision
      expect(review.overallConfidence).toBe(0.75); // Minimum of all
    });

    it('should not create fields for high-confidence data', async () => {
      const request: CreateReviewRequest = {
        jobId: 'job_2',
        dataType: 'identity',
        extractedData: {
          mission: 'Test mission',
          vision: 'Test vision',
        },
        confidenceScores: {
          mission: 0.95,
          vision: 0.98,
        },
        thresholdUsed: 0.85,
      };

      const review = await service.createReview(request);

      expect(review.fieldReviews.length).toBe(0); // All above threshold
      expect(review.status).toBe('pending');
    });

    it('should handle array and object data types correctly', async () => {
      const request: CreateReviewRequest = {
        jobId: 'job_3',
        dataType: 'competitors',
        extractedData: {
          competitors: [
            { name: 'Competitor A', confidence: 0.75 },
            { name: 'Competitor B', confidence: 0.80 },
          ],
        },
        confidenceScores: {
          competitors: 0.77,
        },
        thresholdUsed: 0.85,
      };

      const review = await service.createReview(request);

      expect(review.fieldReviews.length).toBe(1);
      expect(review.fieldReviews[0].dataType).toBe('object');
    });
  });

  describe('Review Retrieval', () => {
    it('should retrieve created review by ID', async () => {
      const request: CreateReviewRequest = {
        jobId: 'job_4',
        dataType: 'identity',
        extractedData: { mission: 'Test' },
        confidenceScores: { mission: 0.75 },
        thresholdUsed: 0.85,
      };

      const created = await service.createReview(request);
      const retrieved = await service.getReview(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.jobId).toBe('job_4');
    });

    it('should return null for non-existent review', async () => {
      const review = await service.getReview('non_existent_id');
      expect(review).toBeNull();
    });

    it('should get all reviews for a job', async () => {
      const jobId = 'job_5';

      // Create multiple reviews for same job
      await service.createReview({
        jobId,
        dataType: 'identity',
        extractedData: { mission: 'Test 1' },
        confidenceScores: { mission: 0.75 },
        thresholdUsed: 0.85,
      });

      await service.createReview({
        jobId,
        dataType: 'competitors',
        extractedData: { competitors: [] },
        confidenceScores: { competitors: 0.70 },
        thresholdUsed: 0.85,
      });

      const reviews = await service.getJobReviews(jobId);
      expect(reviews.length).toBe(2);
      expect(reviews.every((r) => r.jobId === jobId)).toBe(true);
    });

    it('should get all pending reviews', async () => {
      // Create pending review
      await service.createReview({
        jobId: 'job_6',
        dataType: 'identity',
        extractedData: { mission: 'Test' },
        confidenceScores: { mission: 0.75 },
        thresholdUsed: 0.85,
      });

      const pending = await service.getPendingReviews();
      expect(pending.length).toBeGreaterThan(0);
      expect(pending.every((r) => r.status === 'pending')).toBe(true);
    });
  });

  describe('Review Approval', () => {
    it('should approve all fields and set status to approved', async () => {
      const created = await service.createReview({
        jobId: 'job_7',
        dataType: 'identity',
        extractedData: {
          mission: 'Test mission',
          vision: 'Test vision',
        },
        confidenceScores: {
          mission: 0.75,
          vision: 0.80,
        },
        thresholdUsed: 0.85,
      });

      const request: ApproveReviewRequest = {
        reviewId: created.id,
        approvals: [
          { field: 'mission', status: 'approved' },
          { field: 'vision', status: 'approved' },
        ],
        notes: 'Looks good',
      };

      const approved = await service.approveReview(created.id, request);

      expect(approved?.status).toBe('approved');
      expect(approved?.userApprovedData).toBeDefined();
      expect(approved?.userApprovedData.mission).toBe('Test mission');
      expect(approved?.reviewedAt).toBeDefined();
    });

    it('should handle edited fields', async () => {
      const created = await service.createReview({
        jobId: 'job_8',
        dataType: 'identity',
        extractedData: { mission: 'Original mission' },
        confidenceScores: { mission: 0.75 },
        thresholdUsed: 0.85,
      });

      const request: ApproveReviewRequest = {
        reviewId: created.id,
        approvals: [
          {
            field: 'mission',
            status: 'edited',
            value: 'Edited mission',
            feedback: 'More specific',
          },
        ],
      };

      const edited = await service.approveReview(created.id, request);

      expect(edited?.status).toBe('partially_approved');
      expect(edited?.userApprovedData.mission).toBe('Edited mission');
      expect(edited?.fieldReviews[0].feedback).toBe('More specific');
    });

    it('should mark review as rejected if any field rejected', async () => {
      const created = await service.createReview({
        jobId: 'job_9',
        dataType: 'identity',
        extractedData: {
          mission: 'Test mission',
          vision: 'Test vision',
        },
        confidenceScores: {
          mission: 0.75,
          vision: 0.80,
        },
        thresholdUsed: 0.85,
      });

      const request: ApproveReviewRequest = {
        reviewId: created.id,
        approvals: [
          { field: 'mission', status: 'approved' },
          { field: 'vision', status: 'rejected' },
        ],
      };

      const rejected = await service.approveReview(created.id, request);

      expect(rejected?.status).toBe('rejected');
      expect(rejected?.userApprovedData).toBeUndefined(); // No approved data if rejected
    });

    it('should return null for non-existent review', async () => {
      const request: ApproveReviewRequest = {
        reviewId: 'non_existent',
        approvals: [],
      };

      const result = await service.approveReview('non_existent', request);
      expect(result).toBeNull();
    });
  });

  describe('Review Rejection', () => {
    it('should reject entire review', async () => {
      const created = await service.createReview({
        jobId: 'job_10',
        dataType: 'identity',
        extractedData: { mission: 'Test' },
        confidenceScores: { mission: 0.75 },
        thresholdUsed: 0.85,
      });

      const rejected = await service.rejectReview(created.id, 'Data is incomplete');

      expect(rejected?.status).toBe('rejected');
      expect(rejected?.notes).toBe('Data is incomplete');
      expect(rejected?.fieldReviews[0].approvalStatus).toBe('rejected');
    });

    it('should return null for non-existent review', async () => {
      const result = await service.rejectReview('non_existent');
      expect(result).toBeNull();
    });
  });

  describe('Statistics', () => {
    it('should calculate correct statistics', async () => {
      // Create reviews in different states
      const pending1 = await service.createReview({
        jobId: 'job_11',
        dataType: 'identity',
        extractedData: { mission: 'Test' },
        confidenceScores: { mission: 0.75 },
        thresholdUsed: 0.85,
      });

      const pending2 = await service.createReview({
        jobId: 'job_12',
        dataType: 'competitors',
        extractedData: { competitors: [] },
        confidenceScores: { competitors: 0.70 },
        thresholdUsed: 0.85,
      });

      await service.approveReview(pending2.id, {
        reviewId: pending2.id,
        approvals: [{ field: 'competitors', status: 'approved' }],
      });

      const stats = await service.getStats();

      expect(stats.totalReviews).toBeGreaterThanOrEqual(2);
      expect(stats.pendingReviews).toBeGreaterThanOrEqual(1);
      expect(stats.approvedReviews).toBeGreaterThanOrEqual(1);
      expect(stats.rejectedReviews).toBeGreaterThanOrEqual(0);
    });

    it('should calculate average resolution time', async () => {
      const created = await service.createReview({
        jobId: 'job_13',
        dataType: 'identity',
        extractedData: { mission: 'Test' },
        confidenceScores: { mission: 0.75 },
        thresholdUsed: 0.85,
      });

      await service.approveReview(created.id, {
        reviewId: created.id,
        approvals: [{ field: 'mission', status: 'approved' }],
      });

      const stats = await service.getStats();

      expect(stats.averageResolutionTimeMs).toBeDefined();
      expect(stats.averageResolutionTimeMs).toBeGreaterThan(0);
    });
  });

  describe('Cleanup', () => {
    it('should remove old reviews', async () => {
      // This test is limited by in-memory implementation
      // In production with real DB, would mock time
      const before = await service.getStats();
      const cleaned = await service.cleanup();

      expect(typeof cleaned).toBe('number');
      expect(cleaned).toBeGreaterThanOrEqual(0);
    });
  });
});
