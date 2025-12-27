/**
 * Job Status API
 * GET /api/onboarding/status?jobId=...
 * Polls for job status and progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { getJobQueue } from '@/lib/services/queue/JobQueue';

export async function GET(request: NextRequest) {
  try {
    const jobId = request.nextUrl.searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId parameter is required' },
        { status: 400 },
      );
    }

    const queue = getJobQueue();
    const job = queue.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 },
      );
    }

    // Return job details
    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      currentStep: job.currentStep,
      result: job.result || null,
      error: job.error || null,
      createdAt: job.createdAt,
      startedAt: job.startedAt || null,
      completedAt: job.completedAt || null,
    });
  } catch (error) {
    console.error('Error fetching job status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job status' },
      { status: 500 },
    );
  }
}
