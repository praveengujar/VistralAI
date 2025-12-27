/**
 * Analyze Worker
 * Processes analyze jobs: Competitor analysis and review queue routing
 */

import { AnalyzeJobData } from '@/types/queue';
import { getReviewQueueService } from '@/lib/services/queue/ReviewQueueService';
import { FEATURES } from '@/lib/config/features';

/**
 * Process an analyze job
 */
export async function processAnalyzeJob(jobData: AnalyzeJobData): Promise<{
  success: boolean;
  analysis?: any;
  reviewRequired?: boolean;
  reviewId?: string;
  error?: string;
  duration: number;
}> {
  const startTime = Date.now();

  try {
    console.log(`[AnalyzeWorker] Starting analysis for job ${jobData.jobId}`);

    // Perform analysis
    const analysis = performAnalysis(jobData);

    // Check if reviews are needed
    const reviewService = getReviewQueueService();
    let reviewRequired = false;
    let reviewId: string | undefined;

    // Check identity confidence
    if (jobData.extractedIdentity && shouldReviewExtraction(jobData.extractedIdentity)) {
      reviewRequired = true;
      const identityReview = await reviewService.createReview({
        jobId: jobData.jobId,
        dataType: 'identity',
        extractedData: jobData.extractedIdentity,
        confidenceScores: extractConfidenceScores(jobData.extractedIdentity),
        thresholdUsed: FEATURES.CONFIDENCE_THRESHOLD,
      });
      reviewId = identityReview.id;
      console.log(`[AnalyzeWorker] Review created for identity: ${reviewId}`);
    }

    // Check competitors confidence
    if (jobData.extractedCompetitors && shouldReviewExtraction(jobData.extractedCompetitors)) {
      reviewRequired = true;
      const competitorsReview = await reviewService.createReview({
        jobId: jobData.jobId,
        dataType: 'competitors',
        extractedData: jobData.extractedCompetitors,
        confidenceScores: extractConfidenceScores(jobData.extractedCompetitors),
        thresholdUsed: FEATURES.CONFIDENCE_THRESHOLD,
      });
      console.log(`[AnalyzeWorker] Review created for competitors: ${competitorsReview.id}`);
    }

    // Check products confidence
    if (jobData.extractedProducts && shouldReviewExtraction(jobData.extractedProducts)) {
      reviewRequired = true;
      const productsReview = await reviewService.createReview({
        jobId: jobData.jobId,
        dataType: 'products',
        extractedData: jobData.extractedProducts,
        confidenceScores: extractConfidenceScores(jobData.extractedProducts),
        thresholdUsed: FEATURES.CONFIDENCE_THRESHOLD,
      });
      console.log(`[AnalyzeWorker] Review created for products: ${productsReview.id}`);
    }

    const duration = Date.now() - startTime;

    console.log(
      `[AnalyzeWorker] Analysis completed in ${duration}ms for job ${jobData.jobId}` +
        (reviewRequired ? ` (review required)` : '')
    );

    return {
      success: true,
      analysis,
      reviewRequired,
      reviewId,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error(`[AnalyzeWorker] Analysis failed for job ${jobData.jobId}:`, errorMessage);

    return {
      success: false,
      error: errorMessage,
      duration,
    };
  }
}

/**
 * Perform competitive analysis
 */
function performAnalysis(jobData: AnalyzeJobData): any {
  return {
    jobId: jobData.jobId,
    brandId: jobData.brandId,
    timestamp: new Date(),
    identity: jobData.extractedIdentity,
    competitors: jobData.extractedCompetitors,
    products: jobData.extractedProducts,
    metrics: {
      totalExtractedCompetitors: Array.isArray(jobData.extractedCompetitors)
        ? jobData.extractedCompetitors.length
        : 0,
      totalExtractedProducts: Array.isArray(jobData.extractedProducts)
        ? jobData.extractedProducts.length
        : 0,
    },
  };
}

/**
 * Check if extraction needs review based on confidence threshold
 */
function shouldReviewExtraction(data: any): boolean {
  const scores = extractConfidenceScores(data);
  return Object.values(scores).some((score: any) => score < FEATURES.CONFIDENCE_THRESHOLD);
}

/**
 * Extract confidence scores from extracted data
 */
function extractConfidenceScores(data: any): Record<string, number> {
  const scores: Record<string, number> = {};

  // Top-level confidence
  if (typeof data.confidence === 'number') {
    scores['overall'] = data.confidence;
  }

  // Field-level confidence if available
  if (Array.isArray(data)) {
    // For arrays (competitors, products), calculate average confidence
    const confidences = data
      .map((item: any) => (typeof item.confidence === 'number' ? item.confidence : 0.85))
      .filter((conf: number) => conf > 0);

    if (confidences.length > 0) {
      scores['overall'] = confidences.reduce((a: number, b: number) => a + b) / confidences.length;
    }
  } else if (typeof data === 'object' && data !== null) {
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'object' && value !== null && 'confidence' in value) {
        scores[key] = (value as any).confidence;
      }
    }
  }

  // Default to high confidence if no scores found
  if (Object.keys(scores).length === 0) {
    scores['overall'] = 0.9;
  }

  return scores;
}
