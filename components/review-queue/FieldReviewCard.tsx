'use client';

/**
 * Field Review Card
 * Individual field review with approve/edit/reject options
 *
 * Usage:
 * <FieldReviewCard
 *   field={fieldReview}
 *   onApprove={() => handleApprove('approved')}
 *   onEdit={(value) => handleEdit(value)}
 *   onReject={() => handleReject()}
 * />
 */

import { useState } from 'react';
import { Check, Edit2, X, AlertCircle } from 'lucide-react';
import { FieldReview } from '@/types/extraction';

interface FieldReviewCardProps {
  field: FieldReview;
  onApprove: () => void;
  onEdit: (value: any, feedback?: string) => void;
  onReject: () => void;
  isLoading?: boolean;
}

export default function FieldReviewCard({
  field,
  onApprove,
  onEdit,
  onReject,
  isLoading = false,
}: FieldReviewCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(field.originalValue);
  const [feedback, setFeedback] = useState('');

  const handleSaveEdit = () => {
    onEdit(editValue, feedback);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(field.originalValue);
    setFeedback('');
    setIsEditing(false);
  };

  const confidencePercent = Math.round((field.confidence || 0) * 100);
  const confidenceColor =
    confidencePercent >= 85
      ? 'text-green-600'
      : confidencePercent >= 70
        ? 'text-amber-600'
        : 'text-red-600';

  // For arrays or objects, show summary instead of full value
  const displayValue =
    Array.isArray(field.originalValue) || typeof field.originalValue === 'object'
      ? `${field.dataType} with ${
          Array.isArray(field.originalValue) ? field.originalValue.length : Object.keys(field.originalValue || {}).length
        } items`
      : String(field.originalValue);

  return (
    <div className="rounded-lg border border-border bg-surface p-4 mb-4">
      {/* Header with Field Name and Confidence */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{field.field}</h3>
            <span className="text-xs font-medium px-2 py-1 bg-background-secondary text-foreground-secondary rounded">
              {field.dataType}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <p className={`text-sm font-semibold ${confidenceColor}`}>
              {confidencePercent}% Confidence
            </p>
          </div>
        </div>

        {/* Status Badge */}
        {field.approvalStatus !== 'pending' && (
          <span
            className={`text-xs font-medium px-2 py-1 rounded ${
              field.approvalStatus === 'approved'
                ? 'bg-green-100 text-green-700'
                : field.approvalStatus === 'edited'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-red-100 text-red-700'
            }`}
          >
            {field.approvalStatus.charAt(0).toUpperCase() + field.approvalStatus.slice(1)}
          </span>
        )}
      </div>

      {/* Original Value Display */}
      {!isEditing && (
        <div className="mb-4 p-3 bg-background-secondary rounded border border-border">
          <p className="text-xs text-foreground-secondary font-medium mb-1">AI Extracted Value:</p>
          <p className="text-sm text-foreground break-words">{displayValue}</p>
        </div>
      )}

      {/* Edit Mode */}
      {isEditing && (
        <div className="mb-4 space-y-3">
          <div>
            <label className="text-xs text-foreground-secondary font-medium mb-1 block">
              Edit Value:
            </label>
            <textarea
              value={String(editValue)}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full p-2 border border-border-secondary rounded text-sm font-mono bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
            />
          </div>

          <div>
            <label className="text-xs text-foreground-secondary font-medium mb-1 block">
              Feedback (optional):
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Why did you make this change?"
              className="w-full p-2 border border-border-secondary rounded text-sm bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={2}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {field.approvalStatus === 'pending' && !isEditing && (
        <div className="flex gap-2">
          <button
            onClick={onApprove}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg border border-green-200 font-medium text-sm transition-colors disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            Approve
          </button>

          <button
            onClick={() => setIsEditing(true)}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 font-medium text-sm transition-colors disabled:opacity-50"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </button>

          <button
            onClick={onReject}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border border-red-200 font-medium text-sm transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            Reject
          </button>
        </div>
      )}

      {/* Edit Mode Save/Cancel */}
      {isEditing && (
        <div className="flex gap-2">
          <button
            onClick={handleSaveEdit}
            disabled={isLoading}
            className="flex-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
          >
            Save Changes
          </button>

          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 px-3 py-2 bg-surface-hover hover:bg-surface-active text-foreground-secondary rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      )}

      {/* User Feedback Display */}
      {field.feedback && (
        <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
          <p className="text-xs text-blue-600 font-medium">User feedback:</p>
          <p className="text-xs text-blue-700">{field.feedback}</p>
        </div>
      )}
    </div>
  );
}
