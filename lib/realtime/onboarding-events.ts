// WebSocket events for onboarding real-time updates

import { Server as SocketIOServer } from 'socket.io';
import { getSocketServer } from './socket-server';

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
// Room Management
// ============================================

/**
 * Get the room name for an onboarding session
 */
export function getOnboardingRoom(sessionId: string): string {
  return `onboarding:${sessionId}`;
}

// ============================================
// Server-side Event Emitters
// ============================================

/**
 * Emit progress update during MagicImport
 */
export function emitOnboardingProgress(data: OnboardingProgressEvent): void {
  const io = getSocketServer();
  if (io) {
    const room = getOnboardingRoom(data.sessionId);
    io.to(room).emit('onboarding:progress', data);
  }
}

/**
 * Emit completion event when MagicImport finishes
 */
export function emitOnboardingComplete(data: OnboardingCompleteEvent): void {
  const io = getSocketServer();
  if (io) {
    const room = getOnboardingRoom(data.sessionId);
    io.to(room).emit('onboarding:complete', data);
  }
}

/**
 * Emit error event
 */
export function emitOnboardingError(data: OnboardingErrorEvent): void {
  const io = getSocketServer();
  if (io) {
    const room = getOnboardingRoom(data.sessionId);
    io.to(room).emit('onboarding:error', data);
  }
}

/**
 * Emit step event (started, completed, skipped)
 */
export function emitOnboardingStep(data: OnboardingStepEvent): void {
  const io = getSocketServer();
  if (io) {
    const room = getOnboardingRoom(data.sessionId);
    io.to(room).emit('onboarding:step', data);
  }
}

// ============================================
// Socket Handler Setup
// ============================================

/**
 * Setup onboarding-specific socket handlers
 * Call this from the main socket-server setup
 */
export function setupOnboardingSocketHandlers(io: SocketIOServer): void {
  io.on('connection', (socket) => {
    // Join onboarding room
    socket.on('join:onboarding', (sessionId: string) => {
      if (sessionId) {
        const room = getOnboardingRoom(sessionId);
        socket.join(room);
        console.log(`Socket ${socket.id} joined onboarding room: ${room}`);
      }
    });

    // Leave onboarding room
    socket.on('leave:onboarding', (sessionId: string) => {
      if (sessionId) {
        const room = getOnboardingRoom(sessionId);
        socket.leave(room);
        console.log(`Socket ${socket.id} left onboarding room: ${room}`);
      }
    });
  });
}

// ============================================
// Export event names for client use
// ============================================

export const ONBOARDING_EVENTS = {
  PROGRESS: 'onboarding:progress',
  COMPLETE: 'onboarding:complete',
  ERROR: 'onboarding:error',
  STEP: 'onboarding:step',
  JOIN: 'join:onboarding',
  LEAVE: 'leave:onboarding',
} as const;
