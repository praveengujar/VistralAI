'use client';

/**
 * Review Modal
 * Full-screen review interface for managing extraction reviews
 *
 * Usage:
 * <ReviewModal
 *   isOpen={true}
 *   review={review}
 *   onClose={() => setOpen(false)}
 *   onSubmit={(approvals, notes) => handleSubmit(approvals, notes)}
 * />
 */

import { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { ExtractionReview, FieldReview } from '@/types/extraction';
import FieldReviewCard from './FieldReviewCard';

interface ReviewModalProps {
  isOpen: boolean;
  review: ExtractionReview;
  onClose: () => void;
  onSubmit: (
    approvals: Array<{
      field: string;
      status: 'approved' | 'edited' | 'rejected';
      value?: any;
      feedback?: string;
    }>,
    notes?: string
  ) => Promise<void>;
  isLoading?: boolean;
}

export default function ReviewModal({
  isOpen,
  review,
  onClose,
  onSubmit,
  isLoading = false,
}: ReviewModalProps) {
  const [fieldStatuses, setFieldStatuses] = useState<
    Record<string, { status: 'approved' | 'edited' | 'rejected'; value?: any; feedback?: string }>
  >(
    review.fieldReviews.reduce(
      (acc, field) => {
        acc[field.field] = { status: 'approved' };
        return acc;
      },
      {} as Record<string, { status: 'approved' | 'edited' | 'rejected'; value?: any; feedback?: string }>
    )
  );

  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleApprove = (fieldName: string) => {
    setFieldStatuses((prev) => ({
      ...prev,
      [fieldName]: { status: 'approved' },
    }));
  };

  const handleEdit = (fieldName: string, value: any, feedback?: string) => {
    setFieldStatuses((prev) => ({
      ...prev,
      [fieldName]: { status: 'edited', value, feedback },
    }));
  };

  const handleReject = (fieldName: string) => {
    setFieldStatuses((prev) => ({
      ...prev,
      [fieldName]: { status: 'rejected' },
    }));
  };

  const handleSubmit = async () => {
    try {
      setError('');

      const approvals = review.fieldReviews.map((field) => ({
        field: field.field,
        ...fieldStatuses[field.field],
      }));

      await onSubmit(approvals, notes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    }
  };

  if (!isOpen) {
    return null;
  }

  const overallConfidence = Math.round((review.overallConfidence || 0) * 100);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Review Extraction</h2>
            <p className="text-sm text-gray-600 mt-1">
              Job: <span className="font-mono">{review.jobId}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Review Summary */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900">Low Confidence Detection</h3>
                <p className="text-sm text-amber-700 mt-1">
                  The AI extracted this data with {overallConfidence}% overall confidence. Please review and approve, edit, or reject each field below.
                </p>
              </div>
            </div>
          </div>

          {/* Data Type and Count */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Type:</span> {review.dataType}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Fields to Review:</span> {review.fieldReviews.length}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Field Reviews */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Fields</h3>
            <div className="space-y-4">
              {review.fieldReviews.map((field) => (
                <FieldReviewCard
                  key={field.field}
                  field={field}
                  onApprove={() => handleApprove(field.field)}
                  onEdit={(value, feedback) => handleEdit(field.field, value, feedback)}
                  onReject={() => handleReject(field.field)}
                  isLoading={isLoading}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Review Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about this review..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}
