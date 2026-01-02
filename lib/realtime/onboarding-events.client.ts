// Client-safe onboarding event types and constants
// This file can be imported in client components without pulling in server-side code

// ============================================
// Event Types
// ============================================

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

export interface OnboardingStepEvent {
  sessionId: string;
  step: number;
  stepName: string;
  action: 'started' | 'completed' | 'skipped' | 'failed';
  data?: Record<string, unknown>;
}

// ============================================
// Event Names (client-safe constants)
// ============================================

export const ONBOARDING_EVENTS = {
  PROGRESS: 'onboarding:progress',
  COMPLETE: 'onboarding:complete',
  ERROR: 'onboarding:error',
  STEP: 'onboarding:step',
  JOIN: 'join:onboarding',
  LEAVE: 'leave:onboarding',
} as const;
