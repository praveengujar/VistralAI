// OnboardingMagicImport - Wraps MagicImportOrchestrator for onboarding flow
// Provides real-time progress updates via WebSocket and session management

import { MagicImportOrchestrator } from '@/lib/services/agents/MagicImportOrchestrator';
import { onboardingService } from './OnboardingService';
import {
  MAGIC_IMPORT_STAGES,
  calculateOverallProgress,
  normalizeUrl,
} from '@/lib/config/onboarding';
import prisma from '@/lib/db/prisma';

// ============================================
// Types
// ============================================

export interface OnboardingMagicImportOptions {
  sessionId: string;
  userId: string;
  websiteUrl: string;
  brandName: string;
  onProgress?: (data: OnboardingProgressEvent) => void;
  onComplete?: (data: OnboardingCompleteEvent) => void;
  onError?: (data: OnboardingErrorEvent) => void;
}

export interface OnboardingProgressEvent {
  sessionId: string;
  stage: string;
  stageName: string;
  stageDescription: string;
  stageProgress: number; // 0-100 within current stage
  overallProgress: number; // 0-100 overall
  message?: string;
}

export interface OnboardingCompleteEvent {
  sessionId: string;
  brand360Id: string;
  completionScore: number;
  entityHealthScore: number;
  discoveries: {
    entityHome: boolean;
    organizationSchema: boolean;
    brandIdentity: boolean;
    competitors: number;
    products: number;
    personas: number;
  };
  totalDuration: number;
}

export interface OnboardingErrorEvent {
  sessionId: string;
  stage?: string;
  error: string;
  recoverable: boolean;
}

export interface OnboardingMagicImportResult {
  success: boolean;
  brand360Id?: string;
  error?: string;
  completionScore?: number;
  entityHealthScore?: number;
}

// ============================================
// OnboardingMagicImport
// ============================================

class OnboardingMagicImportService {
  private orchestrator: MagicImportOrchestrator;

  constructor() {
    this.orchestrator = new MagicImportOrchestrator();
  }

  /**
   * Execute MagicImport with onboarding context
   */
  async execute(
    options: OnboardingMagicImportOptions
  ): Promise<OnboardingMagicImportResult> {
    const {
      sessionId,
      userId,
      websiteUrl,
      brandName,
      onProgress,
      onComplete,
      onError,
    } = options;

    const startTime = Date.now();
    let currentStage = 'crawler';

    try {
      // 1. Normalize URL
      const normalizedUrl = normalizeUrl(websiteUrl);

      // 2. Update session with brand setup data
      await onboardingService.updateSession(sessionId, {
        websiteUrl: normalizedUrl,
        brandName,
        metadata: { status: 'brand_setup_running' },
      });

      // 3. Log step started
      await onboardingService.logEvent(sessionId, 'step_started', {
        step: 3,
        stepName: 'brand',
        websiteUrl: normalizedUrl,
        brandName,
      });

      // 4. Ensure organization exists for the user
      const organizationId = await this.ensureOrganization(userId, brandName);

      // 5. Execute MagicImport with progress callbacks
      const result = await this.orchestrator.execute(
        organizationId,
        normalizedUrl,
        brandName,
        {
          onProgress: (stage: string, progress: number, message?: string) => {
            currentStage = stage;
            const stageInfo = MAGIC_IMPORT_STAGES.find(s => s.id === stage);
            const overallProgress = calculateOverallProgress(stage, progress);

            const progressEvent: OnboardingProgressEvent = {
              sessionId,
              stage,
              stageName: stageInfo?.name || stage,
              stageDescription: stageInfo?.description || '',
              stageProgress: progress,
              overallProgress,
              message,
            };

            onProgress?.(progressEvent);
          },
          maxPages: 5, // Limit for faster onboarding
        }
      );

      // 6. Update session with brand360Id
      await onboardingService.updateSession(sessionId, {
        brand360Id: result.brand360Id,
        metadata: { status: 'brand_setup_complete' },
      });

      // 7. Calculate duration
      const totalDuration = Date.now() - startTime;

      // 8. Emit completion event
      const completeEvent: OnboardingCompleteEvent = {
        sessionId,
        brand360Id: result.brand360Id,
        completionScore: result.completionScore,
        entityHealthScore: result.entityHealthScore,
        discoveries: {
          entityHome: !!result.discoveries?.entityHome,
          organizationSchema: !!result.discoveries?.organizationSchema,
          brandIdentity: !!result.discoveries?.brandIdentity,
          competitors: result.discoveries?.competitors || 0,
          products: result.discoveries?.products || 0,
          personas: result.discoveries?.personas || 0,
        },
        totalDuration,
      };

      onComplete?.(completeEvent);

      return {
        success: true,
        brand360Id: result.brand360Id,
        completionScore: result.completionScore,
        entityHealthScore: result.entityHealthScore,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      // Log error
      await onboardingService.logError(sessionId, 3, errorMessage, {
        stage: currentStage,
        websiteUrl,
        brandName,
      });

      // Update session status
      await onboardingService.updateSession(sessionId, {
        metadata: {
          status: 'brand_setup_failed',
          error: errorMessage,
          failedAt: new Date().toISOString(),
        },
      });

      // Emit error event
      const errorEvent: OnboardingErrorEvent = {
        sessionId,
        stage: currentStage,
        error: errorMessage,
        recoverable: this.isRecoverableError(errorMessage),
      };

      onError?.(errorEvent);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Ensure organization exists for user
   */
  private async ensureOrganization(
    userId: string,
    brandName: string
  ): Promise<string> {
    // Check if user has a brand profile (which acts as organization in this context)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { brandProfile: true },
    });

    if (user?.brandProfile) {
      return user.brandProfile.id;
    }

    // Create brand profile for user
    const brandProfile = await prisma.brandProfile.create({
      data: {
        userId,
        brandName,
        domain: '', // Will be populated from websiteUrl
        descriptor: '',
        category: 'General',
        crawlingStatus: 'processing',
      },
    });

    return brandProfile.id;
  }

  /**
   * Check if error is recoverable (user can retry)
   */
  private isRecoverableError(error: string): boolean {
    const nonRecoverableErrors = [
      'invalid url',
      'domain not found',
      'access denied',
      'blocked by robots',
    ];

    const lowerError = error.toLowerCase();
    return !nonRecoverableErrors.some(e => lowerError.includes(e));
  }

  /**
   * Retry failed MagicImport
   */
  async retry(
    options: OnboardingMagicImportOptions
  ): Promise<OnboardingMagicImportResult> {
    // Log retry event
    await onboardingService.logEvent(options.sessionId, 'retry', {
      step: 3,
      stepName: 'brand',
      websiteUrl: options.websiteUrl,
    });

    return this.execute(options);
  }

  /**
   * Get status of ongoing MagicImport
   */
  async getStatus(sessionId: string): Promise<{
    status: 'idle' | 'running' | 'complete' | 'failed';
    brand360Id?: string;
    error?: string;
  }> {
    const session = await onboardingService.getSession(sessionId);
    if (!session) {
      return { status: 'idle' };
    }

    const metadata = session.metadata as Record<string, unknown> | null;
    const statusStr = metadata?.status as string | undefined;

    if (session.brand360Id) {
      return { status: 'complete', brand360Id: session.brand360Id };
    }

    if (statusStr === 'brand_setup_running') {
      return { status: 'running' };
    }

    if (statusStr === 'brand_setup_failed') {
      return {
        status: 'failed',
        error: (metadata?.error as string) || 'Unknown error',
      };
    }

    return { status: 'idle' };
  }
}

// Export singleton instance
export const onboardingMagicImport = new OnboardingMagicImportService();

// Export class for testing
export { OnboardingMagicImportService };
