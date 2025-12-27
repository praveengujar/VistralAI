/**
 * Job Queue Service
 * Manages asynchronous onboarding job processing
 * MVP uses in-memory queue; production would use Bull + Redis
 */

import { BrandIdentity, CompetitorProfile, ProductDetail } from '@/types';

export type JobStatus =
  | 'pending'
  | 'crawling'
  | 'extracting'
  | 'analyzing'
  | 'completed'
  | 'failed';

export interface OnboardingJobResult {
  brandIdentity?: BrandIdentity;
  competitors?: CompetitorProfile[];
  products?: ProductDetail[];
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

type JobCallback = (job: OnboardingJob) => Promise<void>;

/**
 * In-memory job queue (MVP)
 * For production, use Bull with Redis
 */
class JobQueueService {
  private jobs: Map<string, OnboardingJob> = new Map();
  private callbacks: Map<string, JobCallback[]> = new Map();

  /**
   * Creates a new job
   */
  createJob(
    userId: string,
    websiteUrl: string,
    brandId?: string,
  ): OnboardingJob {
    const id = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const job: OnboardingJob = {
      id,
      userId,
      brandId,
      websiteUrl,
      status: 'pending',
      progress: 0,
      currentStep: 'Initializing...',
      createdAt: new Date(),
    };

    this.jobs.set(id, job);
    return job;
  }

  /**
   * Gets job by ID
   */
  getJob(jobId: string): OnboardingJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Gets all jobs for a user
   */
  getUserJobs(userId: string): OnboardingJob[] {
    return Array.from(this.jobs.values()).filter(
      (job) => job.userId === userId,
    );
  }

  /**
   * Updates job status and progress
   */
  updateJob(
    jobId: string,
    updates: Partial<OnboardingJob>,
  ): OnboardingJob | undefined {
    const job = this.jobs.get(jobId);
    if (!job) return undefined;

    const updated: OnboardingJob = {
      ...job,
      ...updates,
    };

    this.jobs.set(jobId, updated);

    // Call registered callbacks
    const callbacks = this.callbacks.get(jobId) || [];
    callbacks.forEach((cb) => cb(updated).catch(console.error));

    return updated;
  }

  /**
   * Marks job as completed
   */
  completeJob(
    jobId: string,
    result: OnboardingJobResult,
  ): OnboardingJob | undefined {
    return this.updateJob(jobId, {
      status: 'completed',
      progress: 100,
      result,
      completedAt: new Date(),
      currentStep: 'Completed',
    });
  }

  /**
   * Marks job as failed
   */
  failJob(jobId: string, error: string): OnboardingJob | undefined {
    return this.updateJob(jobId, {
      status: 'failed',
      error,
      completedAt: new Date(),
      currentStep: `Failed: ${error}`,
    });
  }

  /**
   * Registers callback for job updates
   */
  onJobUpdate(jobId: string, callback: JobCallback): void {
    if (!this.callbacks.has(jobId)) {
      this.callbacks.set(jobId, []);
    }
    this.callbacks.get(jobId)!.push(callback);
  }

  /**
   * Cleans up old jobs (older than 24 hours)
   */
  cleanup(): number {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    let removed = 0;

    for (const [jobId, job] of this.jobs.entries()) {
      if (job.createdAt.getTime() < cutoff) {
        this.jobs.delete(jobId);
        this.callbacks.delete(jobId);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Gets statistics about the queue
   */
  getStats() {
    const jobs = Array.from(this.jobs.values());
    return {
      total: jobs.length,
      pending: jobs.filter((j) => j.status === 'pending').length,
      processing: jobs.filter(
        (j) =>
          j.status === 'crawling' ||
          j.status === 'extracting' ||
          j.status === 'analyzing',
      ).length,
      completed: jobs.filter((j) => j.status === 'completed').length,
      failed: jobs.filter((j) => j.status === 'failed').length,
    };
  }
}

// Singleton instance
let queueInstance: JobQueueService | null = null;

/**
 * Gets or creates the job queue service
 */
export function getJobQueue(): JobQueueService {
  if (!queueInstance) {
    queueInstance = new JobQueueService();

    // Periodic cleanup of old jobs
    setInterval(
      () => {
        const removed = queueInstance!.cleanup();
        if (removed > 0) {
          console.log(
            `[JobQueue] Cleaned up ${removed} jobs older than 24 hours`,
          );
        }
      },
      60 * 60 * 1000,
    ); // Every hour
  }

  return queueInstance;
}

/**
 * Helper to create and track a job
 */
export function createAndTrackJob(
  userId: string,
  websiteUrl: string,
  onProgress?: (job: OnboardingJob) => void,
  brandId?: string,
): OnboardingJob {
  const queue = getJobQueue();
  const job = queue.createJob(userId, websiteUrl, brandId);

  if (onProgress) {
    queue.onJobUpdate(job.id, async (updatedJob) => {
      onProgress(updatedJob);
    });
  }

  return job;
}

/**
 * Simulates job processing for MVP
 */
export async function simulateJobProcessing(
  job: OnboardingJob,
  onUpdate: (job: OnboardingJob) => void,
): Promise<void> {
  const queue = getJobQueue();
  const steps = [
    { status: 'crawling' as JobStatus, message: 'Reading website...' },
    { status: 'extracting' as JobStatus, message: 'Extracting content...' },
    { status: 'analyzing' as JobStatus, message: 'Analyzing brand identity...' },
  ];

  for (const step of steps) {
    queue.updateJob(job.id, {
      status: step.status,
      currentStep: step.message,
      progress: steps.indexOf(step) * 30 + 10,
    });

    const updated = queue.getJob(job.id)!;
    onUpdate(updated);

    // Simulate processing time
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 2000),
    );
  }

  // Mark as completed
  queue.completeJob(job.id, {
    crawlDuration: 3000 + Math.random() * 2000,
  });

  const completed = queue.getJob(job.id)!;
  onUpdate(completed);
}
