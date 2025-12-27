/**
 * Review Queue Service
 * Manages extraction reviews for low-confidence results
 *
 * Purpose:
 * - Route low-confidence extractions (<85%) to manual review
 * - Track user approvals/rejections
 * - Store user-corrected data
 * - Provide feedback loop for improving prompts
 *
 * Usage:
 *   const service = new ReviewQueueService();
 *   const review = await service.createReview({...});
 *   const approved = await service.approveReview(reviewId, approvals);
 */

import { FEATURES } from '@/lib/config/features';
import {
  ExtractionReview,
  FieldReview,
  CreateReviewRequest,
  ApproveReviewRequest,
} from '@/types/extraction';

/**
 * In-memory review storage (MVP)
 * Future: Move to database (PostgreSQL)
 */
const reviewStore = new Map<string, ExtractionReview>();

/**
 * Review Queue Service
 * Manages extraction reviews and approvals
 */
export class ReviewQueueService {
  /**
   * Create a review for low-confidence extraction
   *
   * @param request Review creation request
   * @returns Created review with pending status
   */
  async createReview(request: CreateReviewRequest): Promise<ExtractionReview> {
    const reviewId = `review_${request.jobId}_${Date.now()}`;

    // Create field reviews for each low-confidence field
    const fieldReviews: FieldReview[] = [];
    const confidenceScores = request.confidenceScores;

    for (const [field, value] of Object.entries(request.extractedData)) {
      const confidence = confidenceScores[field] ?? confidenceScores['overall'] ?? 0.5;

      if (confidence < request.thresholdUsed) {
        fieldReviews.push({
          field,
          dataType: Array.isArray(value) ? 'array' : typeof value,
          originalValue: value,
          confidence,
          approvalStatus: 'pending',
        });
      }
    }

    // Calculate overall confidence (minimum of all fields)
    const overallConfidence = Math.min(
      ...Object.values(confidenceScores).filter((v) => typeof v === 'number')
    );

    const review: ExtractionReview = {
      id: reviewId,
      jobId: request.jobId,
      dataType: request.dataType,
      extractedData: request.extractedData,
      overallConfidence,
      fieldReviews,
      status: 'pending',
      createdAt: new Date(),
    };

    // Store review
    reviewStore.set(reviewId, review);

    console.log(`[ReviewQueue] Created review ${reviewId} for ${request.dataType} (confidence: ${overallConfidence.toFixed(2)})`);

    return review;
  }

  /**
   * Get a specific review
   */
  async getReview(reviewId: string): Promise<ExtractionReview | null> {
    return reviewStore.get(reviewId) || null;
  }

  /**
   * Get all pending reviews for a job
   */
  async getJobReviews(jobId: string): Promise<ExtractionReview[]> {
    return Array.from(reviewStore.values()).filter((r) => r.jobId === jobId);
  }

  /**
   * Get all pending reviews (for admin dashboard)
   */
  async getPendingReviews(): Promise<ExtractionReview[]> {
    return Array.from(reviewStore.values()).filter((r) => r.status === 'pending');
  }

  /**
   * Approve or edit a review
   *
   * @param reviewId Review ID
   * @param request Approval request with field-level decisions
   * @returns Updated review with final status
   */
  async approveReview(
    reviewId: string,
    request: ApproveReviewRequest
  ): Promise<ExtractionReview | null> {
    const review = reviewStore.get(reviewId);
    if (!review) {
      console.warn(`[ReviewQueue] Review not found: ${reviewId}`);
      return null;
    }

    // Update field reviews with user decisions
    for (const approval of request.approvals) {
      const fieldReview = review.fieldReviews.find((f) => f.field === approval.field);
      if (fieldReview) {
        fieldReview.approvalStatus = approval.status;

        if (approval.status === 'edited' && approval.value !== undefined) {
          fieldReview.userApprovedValue = approval.value;
        }

        if (approval.feedback) {
          fieldReview.feedback = approval.feedback;
        }

        fieldReview.userApprovedAt = new Date();
      }
    }

    // Determine overall review status
    const allApproved = review.fieldReviews.every((f) => f.approvalStatus !== 'rejected');
    const someRejected = review.fieldReviews.some((f) => f.approvalStatus === 'rejected');

    if (someRejected) {
      review.status = 'rejected';
    } else if (review.fieldReviews.every((f) => f.approvalStatus !== 'pending')) {
      review.status = allApproved ? 'approved' : 'partially_approved';
    }

    // Build approved data from field values
    if (review.status === 'approved' || review.status === 'partially_approved') {
      review.userApprovedData = this.buildApprovedData(review);
    }

    review.reviewedAt = new Date();
    review.notes = request.notes;

    reviewStore.set(reviewId, review);

    console.log(
      `[ReviewQueue] Approved review ${reviewId} with status: ${review.status}`
    );

    return review;
  }

  /**
   * Reject a review entirely
   */
  async rejectReview(reviewId: string, reason?: string): Promise<ExtractionReview | null> {
    const review = reviewStore.get(reviewId);
    if (!review) return null;

    review.status = 'rejected';
    review.reviewedAt = new Date();
    review.notes = reason || 'Rejected by user';

    for (const field of review.fieldReviews) {
      field.approvalStatus = 'rejected';
    }

    reviewStore.set(reviewId, review);

    console.log(`[ReviewQueue] Rejected review ${reviewId}`);

    return review;
  }

  /**
   * Build final approved data from field reviews
   * Combines original values with user approvals
   */
  private buildApprovedData(review: ExtractionReview): any {
    const approved: any = { ...review.extractedData };

    for (const fieldReview of review.fieldReviews) {
      if (fieldReview.approvalStatus === 'approved') {
        // Keep original value
        approved[fieldReview.field] = fieldReview.originalValue;
      } else if (fieldReview.approvalStatus === 'edited' && fieldReview.userApprovedValue !== undefined) {
        // Use user-edited value
        approved[fieldReview.field] = fieldReview.userApprovedValue;
      } else if (fieldReview.approvalStatus === 'rejected') {
        // Remove rejected field
        delete approved[fieldReview.field];
      }
    }

    return approved;
  }

  /**
   * Get review statistics
   */
  async getStats(): Promise<{
    totalReviews: number;
    pendingReviews: number;
    approvedReviews: number;
    rejectedReviews: number;
    averageResolutionTimeMs?: number;
  }> {
    const reviews = Array.from(reviewStore.values());
    const pending = reviews.filter((r) => r.status === 'pending');
    const approved = reviews.filter((r) => r.status === 'approved' || r.status === 'partially_approved');
    const rejected = reviews.filter((r) => r.status === 'rejected');

    // Calculate average resolution time
    const resolvedReviews = [...approved, ...rejected].filter((r) => r.reviewedAt);
    const avgResolutionTime =
      resolvedReviews.length > 0
        ? resolvedReviews.reduce((sum, r) => {
            const time = (r.reviewedAt!.getTime() - r.createdAt.getTime());
            return sum + time;
          }, 0) / resolvedReviews.length
        : undefined;

    return {
      totalReviews: reviews.length,
      pendingReviews: pending.length,
      approvedReviews: approved.length,
      rejectedReviews: rejected.length,
      averageResolutionTimeMs: avgResolutionTime,
    };
  }

  /**
   * Clean up old reviews (>24 hours)
   */
  async cleanup(): Promise<number> {
    const now = Date.now();
    const retention = 86400000; // 24 hours in milliseconds
    let removed = 0;

    for (const [id, review] of reviewStore.entries()) {
      const age = now - review.createdAt.getTime();
      if (age > retention) {
        reviewStore.delete(id);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`[ReviewQueue] Cleaned up ${removed} old reviews`);
    }

    return removed;
  }
}

/**
 * Singleton instance
 */
let reviewQueueService: ReviewQueueService | null = null;

/**
 * Get or create review queue service
 */
export function getReviewQueueService(): ReviewQueueService {
  if (!reviewQueueService) {
    reviewQueueService = new ReviewQueueService();
  }
  return reviewQueueService;
}
