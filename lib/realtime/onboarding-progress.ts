// Redis-based progress emission for SSE
// Replaces WebSocket-based progress for Magic Import

import { cacheGet, cacheSet, cacheDelete } from '@/lib/cache/redis';
import { cacheKeys, cacheTTL } from '@/lib/cache/keys';
import type {
  OnboardingProgressEvent,
  OnboardingCompleteEvent,
  OnboardingErrorEvent,
} from './onboarding-events.client';

// ============================================
// Types
// ============================================

export interface ProgressState {
  type: 'progress' | 'complete' | 'error';
  timestamp: number;
  data: OnboardingProgressEvent | OnboardingCompleteEvent | OnboardingErrorEvent;
}

// ============================================
// Server-side Progress Emitters
// ============================================

/**
 * Store progress update in Redis for SSE endpoint to read
 */
export async function setOnboardingProgress(
  data: OnboardingProgressEvent
): Promise<void> {
  const state: ProgressState = {
    type: 'progress',
    timestamp: Date.now(),
    data,
  };
  console.log('[SSE Redis] Writing progress:', data.stage, data.overallProgress + '%');
  await cacheSet(
    cacheKeys.onboarding.progress(data.sessionId),
    state,
    cacheTTL.progress
  );
}

/**
 * Store completion event in Redis
 */
export async function setOnboardingComplete(
  data: OnboardingCompleteEvent
): Promise<void> {
  const state: ProgressState = {
    type: 'complete',
    timestamp: Date.now(),
    data,
  };
  await cacheSet(
    cacheKeys.onboarding.complete(data.sessionId),
    state,
    cacheTTL.progress
  );
  // Clear the progress key
  await cacheDelete(cacheKeys.onboarding.progress(data.sessionId));
}

/**
 * Store error event in Redis
 */
export async function setOnboardingError(
  data: OnboardingErrorEvent
): Promise<void> {
  const state: ProgressState = {
    type: 'error',
    timestamp: Date.now(),
    data,
  };
  await cacheSet(
    cacheKeys.onboarding.error(data.sessionId),
    state,
    cacheTTL.progress
  );
  // Clear the progress key
  await cacheDelete(cacheKeys.onboarding.progress(data.sessionId));
}

// ============================================
// State Readers (for SSE endpoint)
// ============================================

/**
 * Get current progress state from Redis
 * Checks in order: complete, error, progress
 */
export async function getOnboardingProgressState(
  sessionId: string
): Promise<ProgressState | null> {
  // Check for completion first
  const complete = await cacheGet<ProgressState>(
    cacheKeys.onboarding.complete(sessionId)
  );
  if (complete) return complete;

  // Check for error
  const error = await cacheGet<ProgressState>(
    cacheKeys.onboarding.error(sessionId)
  );
  if (error) return error;

  // Check for progress
  const progress = await cacheGet<ProgressState>(
    cacheKeys.onboarding.progress(sessionId)
  );
  return progress;
}

// ============================================
// Cleanup
// ============================================

/**
 * Clean up all progress data for a session
 */
export async function cleanupOnboardingProgress(
  sessionId: string
): Promise<void> {
  await Promise.all([
    cacheDelete(cacheKeys.onboarding.progress(sessionId)),
    cacheDelete(cacheKeys.onboarding.complete(sessionId)),
    cacheDelete(cacheKeys.onboarding.error(sessionId)),
  ]);
}
