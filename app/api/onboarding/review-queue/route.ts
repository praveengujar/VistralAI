/**
 * Review Queue API Routes
 * GET /api/onboarding/review-queue - Get pending reviews
 * POST /api/onboarding/review-queue - Create a new review
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getReviewQueueService } from '@/lib/services/queue/ReviewQueueService';
import { CreateReviewRequest } from '@/types/extraction';

/**
 * GET /api/onboarding/review-queue?jobId=xxx
 * Get pending reviews for a specific job
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId query parameter required' },
        { status: 400 }
      );
    }

    const reviewService = getReviewQueueService();
    const reviews = await reviewService.getJobReviews(jobId);

    const hasAnyPending = reviews.some((r) => r.status === 'pending');
    const allApproved = reviews.every(
      (r) => r.status === 'approved' || r.status === 'partially_approved'
    );

    return NextResponse.json(
      {
        jobId,
        reviews,
        hasAnyPending,
        allApproved,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ReviewQueue API] GET error:', message);

    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/onboarding/review-queue
 * Create a new review for low-confidence extraction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const schema = z.object({
      jobId: z.string().min(1),
      dataType: z.enum(['identity', 'competitors', 'products']),
      extractedData: z.object({}).passthrough(),
      confidenceScores: z.record(z.number()),
      thresholdUsed: z.number().default(0.85),
    });

    const data = schema.parse(body) as CreateReviewRequest;

    // Create review
    const reviewService = getReviewQueueService();
    const review = await reviewService.createReview(data);

    return NextResponse.json(
      {
        reviewId: review.id,
        jobId: review.jobId,
        status: review.status,
        fields: review.fieldReviews.map((f) => ({
          field: f.field,
          confidence: f.confidence,
          value: f.originalValue,
        })),
        message: `Created review with ${review.fieldReviews.length} fields needing approval`,
      },
      { status: 201 }
    );
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
    console.error('[ReviewQueue API] POST error:', message);

    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
