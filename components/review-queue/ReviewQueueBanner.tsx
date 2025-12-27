'use client';

/**
 * Review Queue Banner
 * Displays alert when reviews are pending for a job
 *
 * Usage:
 * <ReviewQueueBanner jobId={jobId} onReviewClick={() => navigate('/review')} />
 */

import { AlertCircle, CheckCircle } from 'lucide-react';
import { ExtractionReview } from '@/types/extraction';

interface ReviewQueueBannerProps {
  reviews: ExtractionReview[];
  jobId: string;
  onReviewClick: () => void;
}

export default function ReviewQueueBanner({
  reviews,
  jobId,
  onReviewClick,
}: ReviewQueueBannerProps) {
  if (!reviews || reviews.length === 0) {
    return null;
  }

  const pendingReviews = reviews.filter((r) => r.status === 'pending');
  const completedReviews = reviews.filter((r) => r.status !== 'pending');

  // If all reviews completed, show completion message
  if (pendingReviews.length === 0) {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-lg bg-success-500/10 p-4 border border-success-500/30">
        <CheckCircle className="h-5 w-5 text-success-600 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-success-700 dark:text-success-300">Reviews Complete</h3>
          <p className="text-sm text-success-600 dark:text-success-400">
            All {completedReviews.length} review{completedReviews.length !== 1 ? 's' : ''} have been processed.
          </p>
        </div>
      </div>
    );
  }

  // Show pending review alert
  return (
    <div className="mb-6 flex items-center gap-3 rounded-lg bg-warning-500/10 p-4 border border-warning-500/30">
      <AlertCircle className="h-5 w-5 text-warning-600 flex-shrink-0" />
      <div className="flex-1">
        <h3 className="font-semibold text-warning-700 dark:text-warning-300">Review Required</h3>
        <p className="text-sm text-warning-600 dark:text-warning-400 mb-3">
          {pendingReviews.length} field{pendingReviews.length !== 1 ? 's' : ''} need your review before finalizing.
        </p>
        <div className="flex gap-2">
          {pendingReviews.map((review) => (
            <span
              key={review.id}
              className="inline-block px-2 py-1 bg-warning-500/20 text-warning-700 dark:text-warning-300 text-xs rounded font-medium"
            >
              {review.dataType}
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={onReviewClick}
        className="ml-auto flex-shrink-0 px-4 py-2 bg-warning-600 text-white rounded-lg hover:bg-warning-700 transition-colors font-medium text-sm"
      >
        Review Now
      </button>
    </div>
  );
}
