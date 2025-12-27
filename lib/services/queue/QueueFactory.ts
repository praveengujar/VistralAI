/**
 * Queue Factory
 * Provides unified interface for in-memory job queue
 *
 * Purpose:
 * - Simplified factory for in-memory queue (Bull/Redis support removed)
 * - Provide unified interface via IQueueService
 * - Enable easy migration to future queue implementations
 *
 * Usage:
 *   const queue = await getQueueService();
 *   await queue.enqueueCrawlJob({...});
 */

import { getJobQueue } from './JobQueue';
import {
  IQueueService,
  CrawlJobData,
  ExtractJobData,
  AnalyzeJobData,
} from '@/types/queue';

/**
 * Singleton instance
 */
let queueService: IQueueService | null = null;

/**
 * Get or create queue service (always returns in-memory queue)
 */
export async function getQueueService(): Promise<IQueueService> {
  if (queueService) {
    return queueService;
  }

  console.log('[QueueFactory] Using in-memory job queue');
  const memoryQueue = getJobQueue();
  queueService = createMemoryQueueAdapter(memoryQueue);

  return queueService;
}

/**
 * Get in-memory queue service directly
 * Useful for testing or direct access
 */
export function getMemoryQueue() {
  return getJobQueue();
}

/**
 * Reset factory (for testing)
 */
export function resetQueueFactory(): void {
  queueService = null;
}

/**
 * Shutdown queue service gracefully
 */
export async function shutdownQueueService(): Promise<void> {
  if (!queueService) return;

  if ('close' in queueService && typeof queueService.close === 'function') {
    await queueService.close();
  }

  queueService = null;
}

/**
 * Adapter to make JobQueue compatible with IQueueService interface
 * This bridges the gap between JobQueue and the expected service interface
 */
function createMemoryQueueAdapter(jobQueue: any): IQueueService {
  return {
    enqueueCrawlJob: async (data: Omit<CrawlJobData, 'enqueuedAt'>) => {
      const job = jobQueue.createJob(data.brandId || 'unknown', data.websiteUrl, data.brandId);
      // Store crawl-specific data
      jobQueue.updateJob(job.id, { currentStep: 'Crawling website...' });
      return job.id;
    },

    enqueueExtractJob: async (data: Omit<ExtractJobData, 'enqueuedAt'>) => {
      const job = jobQueue.getJob(data.jobId);
      if (job) {
        jobQueue.updateJob(data.jobId, {
          status: 'extracting',
          currentStep: 'Extracting brand data...',
          progress: 33
        });
      }
      return data.jobId;
    },

    enqueueAnalyzeJob: async (data: Omit<AnalyzeJobData, 'enqueuedAt'>) => {
      const job = jobQueue.getJob(data.jobId);
      if (job) {
        jobQueue.updateJob(data.jobId, {
          status: 'analyzing',
          currentStep: 'Analyzing results...',
          progress: 66
        });
      }
      return data.jobId;
    },

    getJobProgress: (jobId: string) => {
      const job = jobQueue.getJob(jobId);
      return job
        ? {
            jobId: job.id,
            phase: job.status,
            progress: job.progress,
            status: job.currentStep,
            error: job.error,
          }
        : null;
    },

    updateJobProgress: (jobId: string, updates: any) => {
      jobQueue.updateJob(jobId, updates);
    },

    getQueueStats: async () => {
      const stats = jobQueue.getStats?.() || { total: 0, pending: 0, processing: 0, completed: 0, failed: 0 };
      return {
        crawlQueue: { active: stats.processing || 0, waiting: stats.pending || 0, delayed: 0, failed: stats.failed || 0 },
        extractQueue: { active: 0, waiting: 0, delayed: 0, failed: 0 },
        analyzeQueue: { active: 0, waiting: 0, delayed: 0, failed: 0 },
        totalJobs: stats.total || 0,
      };
    },

    cleanup: async () => {
      return jobQueue.cleanup?.() || 0;
    },
  };
}
