/**
 * Queue Type Definitions
 * Consolidated types for Bull queue, in-memory queue, and job management
 *
 * Exports:
 * - Bull Queue types (CrawlJobData, ExtractJobData, AnalyzeJobData)
 * - Job progress tracking
 * - Service interface (IQueueService)
 * - Existing JobQueue types (OnboardingJob, JobStatus)
 * - Enums for queue and job phases
 */

/**
 * Queue Service Type
 * (Bull queue support has been removed)
 */
export enum QueueType {
  MEMORY = 'memory',
}

/**
 * Job Lifecycle Phases
 */
export enum JobPhase {
  CRAWL = 'crawl',
  EXTRACT = 'extract',
  ANALYZE = 'analyze',
  REVIEWING = 'reviewing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Bull Queue Job Data Types
 */

export interface CrawlJobData {
  jobId: string;
  brandId: string;
  websiteUrl: string;
  enqueuedAt: Date;
}

export interface ExtractJobData {
  jobId: string;
  brandId: string;
  crawlData: any;
  enqueuedAt: Date;
}

export interface AnalyzeJobData {
  jobId: string;
  brandId: string;
  crawlData: any;
  extractedIdentity: any;
  extractedCompetitors: any;
  extractedProducts: any;
  enqueuedAt: Date;
}

/**
 * Job Progress Tracking
 */
export interface JobProgress {
  jobId: string;
  phase: JobPhase | string;
  progress: number; // 0-100
  status: string;
  error?: string;
  result?: any;
}

/**
 * Unified Queue Service Interface
 * Implemented by both BullQueueService and JobQueue adapter
 */
export interface IQueueService {
  initialize?(): Promise<void>;

  enqueueCrawlJob(
    data: Omit<CrawlJobData, 'enqueuedAt'>
  ): Promise<string>;

  enqueueExtractJob(
    data: Omit<ExtractJobData, 'enqueuedAt'>
  ): Promise<string>;

  enqueueAnalyzeJob(
    data: Omit<AnalyzeJobData, 'enqueuedAt'>
  ): Promise<string>;

  getJobProgress(jobId: string): JobProgress | null;

  updateJobProgress(jobId: string, updates: Partial<JobProgress>): void;

  getQueueStats(): Promise<{
    crawlQueue: {
      active: number;
      waiting: number;
      delayed: number;
      failed: number;
    };
    extractQueue: {
      active: number;
      waiting: number;
      delayed: number;
      failed: number;
    };
    analyzeQueue: {
      active: number;
      waiting: number;
      delayed: number;
      failed: number;
    };
    totalJobs: number;
  }>;

  cleanup?(): Promise<number>;

  close?(): Promise<void>;
}

/**
 * Existing JobQueue Types (for backward compatibility)
 */

export type JobStatus =
  | 'pending'
  | 'crawling'
  | 'extracting'
  | 'analyzing'
  | 'completed'
  | 'failed';

export interface OnboardingJobResult {
  brandIdentity?: any;
  competitors?: any[];
  products?: any[];
  crawlDuration?: number;
}

export interface OnboardingJob {
  id: string;
  userId: string;
  brandId?: string;
  websiteUrl: string;
  status: JobStatus;
  progress: number; // 0-100
  currentStep: string;
  result?: OnboardingJobResult;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * Queue Statistics
 */
export interface QueueStats {
  queueType: QueueType | string;
  timestamp: Date;
  stats: {
    crawlQueue: {
      active: number;
      waiting: number;
      delayed: number;
      failed: number;
    };
    extractQueue: {
      active: number;
      waiting: number;
      delayed: number;
      failed: number;
    };
    analyzeQueue: {
      active: number;
      waiting: number;
      delayed: number;
      failed: number;
    };
    totalJobs: number;
  };
}

/**
 * Worker Result Types
 */

export interface CrawlWorkerResult {
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
}

export interface ExtractWorkerResult {
  success: boolean;
  identity?: any;
  competitors?: any;
  products?: any;
  error?: string;
  duration: number;
  source: 'claude' | 'mock';
}

export interface AnalyzeWorkerResult {
  success: boolean;
  analysis?: any;
  reviewRequired?: boolean;
  reviewId?: string;
  error?: string;
  duration: number;
}
