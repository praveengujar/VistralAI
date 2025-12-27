/**
 * Extraction Types
 * Types for AI extraction results, confidence scoring, and review queue
 *
 * Used for:
 * - Brand intelligence extraction results
 * - Confidence tracking
 * - Review queue management
 * - User-approved overrides
 */

import { z } from 'zod';

/**
 * Generic extraction result wrapper
 * Wraps any extracted data with confidence and metadata
 */
export interface ExtractionResult<T> {
  data: T;
  confidence: number; // 0-1, where 1 is 100% confident
  source: 'claude' | 'mock';
  extractedAt: Date;
  metadata?: {
    model?: string;
    tokensUsed?: number;
    processingTimeMs?: number;
  };
}

/**
 * Brand identity extraction result
 */
export interface BrandIdentityExtraction {
  mission: string;
  vision: string;
  coreValues: string[];
  brandVoiceAttributes: string[];
  uniqueSellingPropositions: string[];
  targetAudienceSummary: string;
  industryVertical: string;
  confidence: number; // 0-1
}

/**
 * Competitor suggestion with confidence
 */
export interface CompetitorSuggestion {
  name: string;
  website?: string;
  competitionType: 'direct' | 'indirect' | 'aspirational';
  rationale: string;
  confidence: number; // 0-1
}

/**
 * Product category from extraction
 */
export interface ProductCategory {
  name: string;
  description: string;
  keyFeatures: string[];
  targetMarket: string;
}

/**
 * Field-level review item (for when confidence < threshold)
 */
export interface FieldReview {
  field: string; // e.g., "mission", "vision", "competitor_0"
  dataType: string; // e.g., "string", "array", "object"
  originalValue: any;
  confidence: number; // 0-1
  userApprovedValue?: any;
  userApprovedAt?: Date;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'edited';
  feedback?: string; // User explanation for edit
}

/**
 * Extraction review (for low-confidence results)
 * Created when any extraction falls below CONFIDENCE_THRESHOLD
 */
export interface ExtractionReview {
  id: string;
  jobId: string;
  dataType: 'identity' | 'competitors' | 'products'; // What was extracted
  extractedData: any; // The actual extraction result
  overallConfidence: number; // 0-1, lowest confidence in any field
  fieldReviews: FieldReview[]; // Individual field statuses
  status: 'pending' | 'approved' | 'rejected' | 'partially_approved';
  userApprovedData?: any; // User's approved/corrected version
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string; // User ID who reviewed
  notes?: string; // User notes about the review
}

/**
 * Extraction review batch
 * Multiple reviews for a single job
 */
export interface ExtractionReviewBatch {
  jobId: string;
  reviews: ExtractionReview[];
  allApproved: boolean; // All reviews approved?
  overallStatus: 'pending' | 'partial' | 'complete';
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Job extraction result (complete extraction)
 */
export interface JobExtractionResult {
  jobId: string;
  identity: ExtractionResult<BrandIdentityExtraction>;
  competitors: ExtractionResult<CompetitorSuggestion[]>;
  products: ExtractionResult<ProductCategory[]>;
  reviewsRequired: boolean; // Any field below threshold?
  pendingReviews?: ExtractionReview[]; // If reviews required
  createdAt: Date;
}

/**
 * Zod schemas for validation
 */

export const FieldReviewSchema = z.object({
  field: z.string(),
  dataType: z.string(),
  originalValue: z.any(),
  confidence: z.number().min(0).max(1),
  userApprovedValue: z.any().optional(),
  userApprovedAt: z.date().optional(),
  approvalStatus: z.enum(['pending', 'approved', 'rejected', 'edited']),
  feedback: z.string().optional(),
});

export const ExtractionReviewSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  dataType: z.enum(['identity', 'competitors', 'products']),
  extractedData: z.any(),
  overallConfidence: z.number().min(0).max(1),
  fieldReviews: z.array(FieldReviewSchema),
  status: z.enum(['pending', 'approved', 'rejected', 'partially_approved']),
  userApprovedData: z.any().optional(),
  createdAt: z.date(),
  reviewedAt: z.date().optional(),
  reviewedBy: z.string().optional(),
  notes: z.string().optional(),
});

export const ExtractionReviewBatchSchema = z.object({
  jobId: z.string(),
  reviews: z.array(ExtractionReviewSchema),
  allApproved: z.boolean(),
  overallStatus: z.enum(['pending', 'partial', 'complete']),
  createdAt: z.date(),
  completedAt: z.date().optional(),
});

/**
 * API Request/Response types
 */

/**
 * Request to create a review for low-confidence extraction
 */
export interface CreateReviewRequest {
  jobId: string;
  dataType: 'identity' | 'competitors' | 'products';
  extractedData: any;
  confidenceScores: Record<string, number>; // field -> confidence
  thresholdUsed: number; // 0.85 by default
}

/**
 * Response when creating a review
 */
export interface CreateReviewResponse {
  reviewId: string;
  jobId: string;
  status: 'pending';
  fields: Array<{
    field: string;
    confidence: number;
    value: any;
  }>;
  message: string;
}

/**
 * Request to approve a review
 */
export interface ApproveReviewRequest {
  reviewId: string;
  approvals: Array<{
    field: string;
    status: 'approved' | 'edited' | 'rejected';
    value?: any; // If edited
    feedback?: string; // User explanation
  }>;
  notes?: string; // Overall notes
}

/**
 * Response when approving a review
 */
export interface ApproveReviewResponse {
  reviewId: string;
  status: 'approved' | 'partially_approved' | 'rejected';
  approvedData?: any; // If approved, the final data
  failedFields?: string[]; // If rejected, which fields failed
  message: string;
}

/**
 * Get pending reviews for a job
 */
export interface GetReviewsResponse {
  jobId: string;
  reviews: ExtractionReview[];
  hasAnyPending: boolean;
  allApproved: boolean;
}

/**
 * Helper function to calculate if review is needed
 */
export function isReviewRequired(
  confidenceScores: Record<string, number>,
  threshold: number
): boolean {
  return Object.values(confidenceScores).some((score) => score < threshold);
}

/**
 * Helper to extract confidence from extraction result
 */
export function extractConfidenceScores(extractionResult: any): Record<string, number> {
  const scores: Record<string, number> = {};

  // Top-level confidence
  if (typeof extractionResult.confidence === 'number') {
    scores['overall'] = extractionResult.confidence;
  }

  // Field-level confidence if available
  for (const [key, value] of Object.entries(extractionResult)) {
    if (typeof value === 'object' && value !== null && 'confidence' in value) {
      scores[key] = (value as any).confidence;
    }
  }

  return scores;
}
