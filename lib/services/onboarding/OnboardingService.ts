// OnboardingService - Core session management for unified onboarding flow

import prisma from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import {
  ONBOARDING_STEPS,
  type OnboardingSessionData,
  type OnboardingEventType,
  type OnboardingStatus,
  validateStepData,
  getStepById,
  getResumeStep,
  canAccessStep,
  getProgressPercentage,
} from '@/lib/config/onboarding';
import type { OnboardingSession, OnboardingEvent } from '@prisma/client';

// ============================================
// Types
// ============================================

export interface OnboardingSessionWithEvents extends OnboardingSession {
  events?: OnboardingEvent[];
}

export interface UpdateSessionData {
  currentStep?: number;
  completedSteps?: number[];
  status?: OnboardingStatus;
  selectedTierId?: string;
  selectedBillingCycle?: 'monthly' | 'yearly';
  paymentMethodId?: string;
  stripeCustomerId?: string;
  subscriptionId?: string;
  brand360Id?: string;
  firstScanId?: string;
  websiteUrl?: string;
  brandName?: string;
  metadata?: Record<string, unknown>;
}

export interface CompleteStepResult {
  session: OnboardingSession;
  nextStep: number | null;
  isComplete: boolean;
}

export interface ResumeState {
  session: OnboardingSession;
  resumeStep: number;
  progressPercentage: number;
}

// ============================================
// OnboardingService
// ============================================

class OnboardingService {
  /**
   * Get existing session or create a new one for a user
   */
  async getOrCreateSession(userId: string): Promise<OnboardingSession> {
    // Try to find existing session
    let session = await prisma.onboardingSession.findUnique({
      where: { userId },
    });

    if (session) {
      // Update last active timestamp
      session = await prisma.onboardingSession.update({
        where: { id: session.id },
        data: { lastActiveAt: new Date() },
      });

      return session;
    }

    // Create new session
    session = await prisma.onboardingSession.create({
      data: {
        userId,
        currentStep: 1,
        completedSteps: [],
        status: 'in_progress',
        startedAt: new Date(),
        lastActiveAt: new Date(),
      },
    });

    // Log session start event
    await this.logEvent(session.id, 'session_started', { userId });

    return session;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<OnboardingSession | null> {
    return prisma.onboardingSession.findUnique({
      where: { id: sessionId },
    });
  }

  /**
   * Get session by user ID
   */
  async getSessionByUserId(userId: string): Promise<OnboardingSession | null> {
    return prisma.onboardingSession.findUnique({
      where: { userId },
    });
  }

  /**
   * Get session with events
   */
  async getSessionWithEvents(
    sessionId: string
  ): Promise<OnboardingSessionWithEvents | null> {
    return prisma.onboardingSession.findUnique({
      where: { id: sessionId },
      include: {
        events: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });
  }

  /**
   * Update session data
   */
  async updateSession(
    sessionId: string,
    data: UpdateSessionData
  ): Promise<OnboardingSession> {
    const updateData: Record<string, unknown> = {
      lastActiveAt: new Date(),
    };

    // Map fields to database columns
    if (data.currentStep !== undefined) updateData.currentStep = data.currentStep;
    if (data.completedSteps !== undefined) updateData.completedSteps = data.completedSteps;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.selectedTierId !== undefined) updateData.selectedTierId = data.selectedTierId;
    if (data.selectedBillingCycle !== undefined) updateData.selectedBillingCycle = data.selectedBillingCycle;
    if (data.paymentMethodId !== undefined) updateData.paymentMethodId = data.paymentMethodId;
    if (data.stripeCustomerId !== undefined) updateData.stripeCustomerId = data.stripeCustomerId;
    if (data.subscriptionId !== undefined) updateData.subscriptionId = data.subscriptionId;
    if (data.brand360Id !== undefined) updateData.brand360Id = data.brand360Id;
    if (data.firstScanId !== undefined) updateData.firstScanId = data.firstScanId;
    if (data.websiteUrl !== undefined) updateData.websiteUrl = data.websiteUrl;
    if (data.brandName !== undefined) updateData.brandName = data.brandName;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    return prisma.onboardingSession.update({
      where: { id: sessionId },
      data: updateData,
    });
  }

  /**
   * Complete a step and advance to next
   */
  async completeStep(
    sessionId: string,
    step: number,
    stepData?: UpdateSessionData
  ): Promise<CompleteStepResult> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Validate step data
    const sessionData: OnboardingSessionData = {
      currentStep: session.currentStep,
      completedSteps: session.completedSteps,
      status: session.status as OnboardingStatus,
      selectedTierId: session.selectedTierId || undefined,
      selectedBillingCycle: session.selectedBillingCycle as 'monthly' | 'yearly' | undefined,
      paymentMethodId: session.paymentMethodId || undefined,
      stripeCustomerId: session.stripeCustomerId || undefined,
      subscriptionId: session.subscriptionId || undefined,
      brand360Id: session.brand360Id || undefined,
      firstScanId: session.firstScanId || undefined,
      websiteUrl: session.websiteUrl || undefined,
      brandName: session.brandName || undefined,
      ...stepData,
    };

    const validation = validateStepData(step, sessionData);
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Add step to completed steps if not already there
    const completedSteps = [...session.completedSteps];
    if (!completedSteps.includes(step)) {
      completedSteps.push(step);
    }

    // Determine next step
    const stepConfig = getStepById(step);
    const nextStepNum = step + 1;
    const nextStep = getStepById(nextStepNum);
    const isComplete = !nextStep || step === ONBOARDING_STEPS.length;

    // Update session
    const updateData: UpdateSessionData = {
      ...stepData,
      completedSteps,
      currentStep: isComplete ? step : nextStepNum,
    };

    const updatedSession = await this.updateSession(sessionId, updateData);

    // Log step completion event
    await this.logEvent(sessionId, 'step_completed', {
      step,
      stepName: stepConfig?.name,
      data: stepData,
    });

    return {
      session: updatedSession,
      nextStep: isComplete ? null : nextStepNum,
      isComplete,
    };
  }

  /**
   * Skip an optional step
   */
  async skipStep(sessionId: string, step: number): Promise<OnboardingSession> {
    const stepConfig = getStepById(step);
    if (!stepConfig?.optional) {
      throw new Error('This step cannot be skipped');
    }

    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Add to completed steps
    const completedSteps = [...session.completedSteps];
    if (!completedSteps.includes(step)) {
      completedSteps.push(step);
    }

    // Log skip event
    await this.logEvent(sessionId, 'step_skipped', {
      step,
      stepName: stepConfig.name,
    });

    // Move to next step
    return this.updateSession(sessionId, {
      completedSteps,
      currentStep: step + 1,
    });
  }

  /**
   * Mark onboarding as complete
   */
  async markComplete(userId: string): Promise<void> {
    const session = await this.getSessionByUserId(userId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Validate all required steps are complete (steps 1-4, not step 5 "Complete" which is this step)
    const requiredSteps = ONBOARDING_STEPS.filter(s => !s.optional && s.id < 5);
    const missingSteps = requiredSteps.filter(
      s => !session.completedSteps.includes(s.id)
    );

    if (missingSteps.length > 0) {
      throw new Error(
        `Cannot complete: missing steps ${missingSteps.map(s => s.label).join(', ')}`
      );
    }

    // Update session status
    await prisma.onboardingSession.update({
      where: { id: session.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        currentStep: ONBOARDING_STEPS.length,
      },
    });

    // Update user's onboarding status
    await prisma.user.update({
      where: { id: userId },
      data: {
        onboardingCompleted: true,
        onboardingStep: ONBOARDING_STEPS.length,
      },
    });

    // Log completion event
    await this.logEvent(session.id, 'completed', { userId });
  }

  /**
   * Abandon a session
   */
  async abandonSession(sessionId: string): Promise<void> {
    await prisma.onboardingSession.update({
      where: { id: sessionId },
      data: { status: 'abandoned' },
    });

    await this.logEvent(sessionId, 'abandoned', {});
  }

  /**
   * Get resume state for a user
   */
  async getResumeState(userId: string): Promise<ResumeState | null> {
    const session = await this.getSessionByUserId(userId);
    if (!session || session.status !== 'in_progress') {
      return null;
    }

    const sessionData: OnboardingSessionData = {
      currentStep: session.currentStep,
      completedSteps: session.completedSteps,
      status: session.status as OnboardingStatus,
    };

    return {
      session,
      resumeStep: getResumeStep(sessionData),
      progressPercentage: getProgressPercentage(sessionData),
    };
  }

  /**
   * Check if user can access a specific step
   */
  async canAccessStep(
    userId: string,
    targetStep: number
  ): Promise<{ allowed: boolean; reason?: string }> {
    const session = await this.getSessionByUserId(userId);
    if (!session) {
      return { allowed: false, reason: 'No active onboarding session' };
    }

    const sessionData: OnboardingSessionData = {
      currentStep: session.currentStep,
      completedSteps: session.completedSteps,
      status: session.status as OnboardingStatus,
    };

    return canAccessStep(sessionData, targetStep);
  }

  /**
   * Log an onboarding event
   */
  async logEvent(
    sessionId: string,
    eventType: OnboardingEventType,
    eventData?: Record<string, unknown>
  ): Promise<OnboardingEvent> {
    const step = eventData?.step as number | undefined;
    const stepName = eventData?.stepName as string | undefined;

    return prisma.onboardingEvent.create({
      data: {
        sessionId,
        eventType,
        step,
        stepName,
        eventData: eventData as Prisma.InputJsonValue,
        createdAt: new Date(),
      },
    });
  }

  /**
   * Log an error event
   */
  async logError(
    sessionId: string,
    step: number,
    errorMessage: string,
    errorData?: Record<string, unknown>
  ): Promise<OnboardingEvent> {
    const stepConfig = getStepById(step);

    return prisma.onboardingEvent.create({
      data: {
        sessionId,
        eventType: 'error',
        step,
        stepName: stepConfig?.name,
        errorMessage,
        eventData: errorData as Prisma.InputJsonValue,
        createdAt: new Date(),
      },
    });
  }

  /**
   * Get session analytics
   */
  async getSessionAnalytics(sessionId: string): Promise<{
    totalEvents: number;
    errorCount: number;
    stepDurations: Record<string, number>;
    lastActivity: Date | null;
  }> {
    const events = await prisma.onboardingEvent.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    const errorCount = events.filter(e => e.eventType === 'error').length;

    // Calculate step durations
    const stepDurations: Record<string, number> = {};
    const stepStarts: Record<number, Date> = {};

    for (const event of events) {
      if (event.eventType === 'step_started' && event.step) {
        stepStarts[event.step] = event.createdAt;
      } else if (event.eventType === 'step_completed' && event.step) {
        const startTime = stepStarts[event.step];
        if (startTime) {
          const duration = event.createdAt.getTime() - startTime.getTime();
          stepDurations[`step_${event.step}`] = duration;
        }
      }
    }

    const lastEvent = events[events.length - 1];

    return {
      totalEvents: events.length,
      errorCount,
      stepDurations,
      lastActivity: lastEvent?.createdAt || null,
    };
  }

  /**
   * Clean up abandoned sessions older than specified hours
   */
  async cleanupAbandonedSessions(hoursOld: number = 24): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hoursOld);

    const result = await prisma.onboardingSession.updateMany({
      where: {
        status: 'in_progress',
        lastActiveAt: { lt: cutoffDate },
      },
      data: { status: 'abandoned' },
    });

    return result.count;
  }
}

// Export singleton instance
export const onboardingService = new OnboardingService();

// Export class for testing
export { OnboardingService };
