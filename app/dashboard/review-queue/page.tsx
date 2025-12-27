'use client';

/**
 * Review Queue Dashboard
 * Manage pending extraction reviews
 *
 * Route: /dashboard/review-queue
 */

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ReviewModal from '@/components/review-queue/ReviewModal';
import { ExtractionReview } from '@/types/extraction';
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export default function ReviewQueuePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [reviews, setReviews] = useState<ExtractionReview[]>([]);
  const [selectedReview, setSelectedReview] = useState<ExtractionReview | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<ReviewStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  // Protect route
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // Fetch reviews
  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        setError('');

        const response = await fetch('/api/admin/review-queue');
        if (!response.ok) throw new Error('Failed to fetch reviews');

        const data = await response.json();
        setReviews(data.reviews || []);

        // Calculate stats
        const stats: ReviewStats = {
          total: data.reviews?.length || 0,
          pending: data.reviews?.filter((r: ExtractionReview) => r.status === 'pending').length || 0,
          approved: data.reviews?.filter(
            (r: ExtractionReview) => r.status === 'approved' || r.status === 'partially_approved'
          ).length || 0,
          rejected: data.reviews?.filter((r: ExtractionReview) => r.status === 'rejected').length || 0,
        };
        setStats(stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [status]);

  const handleReviewClick = (review: ExtractionReview) => {
    setSelectedReview(review);
    setIsModalOpen(true);
  };

  const handleSubmitReview = async (
    approvals: Array<{
      field: string;
      status: 'approved' | 'edited' | 'rejected';
      value?: any;
      feedback?: string;
    }>,
    notes?: string
  ) => {
    if (!selectedReview) return;

    try {
      setIsSaving(true);
      setError('');

      const response = await fetch('/api/onboarding/review-queue/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: selectedReview.id,
          approvals,
          notes,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit review');

      // Close modal and refresh
      setIsModalOpen(false);
      setSelectedReview(null);

      // Refresh reviews
      const refreshResponse = await fetch('/api/admin/review-queue');
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setReviews(data.reviews || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/review-queue');
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh reviews');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'rgb(var(--foreground))' }}>Review Queue</h1>
            <p className="mt-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>Manage low-confidence extraction reviews</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="btn-primary btn-md"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-lg p-4" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'rgb(var(--foreground-secondary))' }}>Total Reviews</p>
                <p className="text-2xl font-bold mt-1" style={{ color: 'rgb(var(--foreground))' }}>{stats.total}</p>
              </div>
              <Clock className="h-8 w-8 text-secondary-400" />
            </div>
          </div>

          <div className="rounded-lg p-4" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'rgb(var(--foreground-secondary))' }}>Pending</p>
                <p className="text-2xl font-bold text-warning-600 mt-1">{stats.pending}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-warning-400" />
            </div>
          </div>

          <div className="rounded-lg p-4" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'rgb(var(--foreground-secondary))' }}>Approved</p>
                <p className="text-2xl font-bold text-success-600 mt-1">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success-400" />
            </div>
          </div>

          <div className="rounded-lg p-4" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'rgb(var(--foreground-secondary))' }}>Rejected</p>
                <p className="text-2xl font-bold text-error-600 mt-1">{stats.rejected}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-error-400" />
            </div>
          </div>
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="rounded-lg p-12 text-center" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
            <CheckCircle className="h-12 w-12 text-success-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'rgb(var(--foreground))' }}>No Reviews Pending</h3>
            <p style={{ color: 'rgb(var(--foreground-secondary))' }}>All extractions have been reviewed and approved.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => {
              const statusStyles =
                review.status === 'pending'
                  ? { backgroundColor: 'rgba(var(--warning-rgb), 0.1)', borderColor: 'rgb(var(--warning-rgb))' }
                  : review.status === 'approved' || review.status === 'partially_approved'
                    ? { backgroundColor: 'rgba(var(--success-rgb), 0.1)', borderColor: 'rgb(var(--success-rgb))' }
                    : { backgroundColor: 'rgba(var(--error-rgb), 0.1)', borderColor: 'rgb(var(--error-rgb))' };

              const statusIcon =
                review.status === 'pending' ? (
                  <AlertCircle className="h-5 w-5 text-warning-600" />
                ) : review.status === 'approved' || review.status === 'partially_approved' ? (
                  <CheckCircle className="h-5 w-5 text-success-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-error-600" />
                );

              return (
                <div key={review.id} className="rounded-lg border p-4" style={statusStyles}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {statusIcon}
                      <div className="flex-1">
                        <p className="font-semibold" style={{ color: 'rgb(var(--foreground))' }}>
                          {review.dataType} - {review.jobId}
                        </p>
                        <p className="text-sm mt-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>
                          {review.fieldReviews.length} fields • Confidence:{' '}
                          {Math.round((review.overallConfidence || 0) * 100)}%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium px-2 py-1 rounded" style={{ backgroundColor: 'rgb(var(--surface))', opacity: 0.8 }}>
                        {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                      </span>

                      {review.status === 'pending' && (
                        <button
                          onClick={() => handleReviewClick(review)}
                          className="btn-primary px-3 py-1 text-sm rounded font-medium"
                        >
                          Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedReview && (
        <ReviewModal
          isOpen={isModalOpen}
          review={selectedReview}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedReview(null);
          }}
          onSubmit={handleSubmitReview}
          isLoading={isSaving}
        />
      )}
    </DashboardLayout>
  );
}
