/**
 * Review Approval API Route
 * POST /api/onboarding/review-queue/approve
 *
 * Approves, edits, or rejects extraction reviews
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getReviewQueueService } from '@/lib/services/queue/ReviewQueueService';
import { ApproveReviewRequest } from '@/types/extraction';

/**
 * POST /api/onboarding/review-queue/approve
 * Approve or edit a review
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const schema = z.object({
      reviewId: z.string().min(1),
      approvals: z.array(
        z.object({
          field: z.string(),
          status: z.enum(['approved', 'edited', 'rejected']),
          value: z.any().optional(),
          feedback: z.string().optional(),
        })
      ),
      notes: z.string().optional(),
    });

    const data = schema.parse(body) as ApproveReviewRequest;

    // Get review service
    const reviewService = getReviewQueueService();

    // Approve review
    const review = await reviewService.approveReview(data.reviewId, data);

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Determine response based on status
    const response: any = {
      reviewId: review.id,
      status: review.status,
      message: `Review ${review.status}`,
    };

    if (review.status === 'approved' || review.status === 'partially_approved') {
      response.approvedData = review.userApprovedData;
    }

    if (review.status === 'rejected' || review.status === 'partially_approved') {
      response.failedFields = review.fieldReviews
        .filter((f) => f.approvalStatus === 'rejected')
        .map((f) => f.field);
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ReviewQueue Approve API] Error:', message);

    return NextResponse.json(
      { error: 'Failed to approve review' },
      { status: 500 }
    );
  }
}
