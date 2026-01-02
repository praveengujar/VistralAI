// Client-side hook for onboarding WebSocket events
'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSocket } from '@/lib/realtime/socket-client';
import { ONBOARDING_EVENTS } from '@/lib/realtime/onboarding-events.client';
import type {
  OnboardingProgressEvent,
  OnboardingCompleteEvent,
  OnboardingErrorEvent,
  OnboardingStepEvent,
} from '@/lib/realtime/onboarding-events.client';

// ============================================
// Types
// ============================================

interface UseOnboardingSocketOptions {
  sessionId?: string;
  enabled?: boolean;
  onProgress?: (data: OnboardingProgressEvent) => void;
  onComplete?: (data: OnboardingCompleteEvent) => void;
  onError?: (data: OnboardingErrorEvent) => void;
  onStep?: (data: OnboardingStepEvent) => void;
}

interface UseOnboardingSocketReturn {
  isConnected: boolean;
  progress: OnboardingProgressEvent | null;
  isComplete: boolean;
  error: OnboardingErrorEvent | null;
  lastStep: OnboardingStepEvent | null;
  joinRoom: (sessionId: string) => void;
  leaveRoom: (sessionId: string) => void;
}

// ============================================
// Hook
// ============================================

export function useOnboardingSocket(
  options: UseOnboardingSocketOptions = {}
): UseOnboardingSocketReturn {
  const {
    sessionId,
    enabled = true,
    onProgress,
    onComplete,
    onError,
    onStep,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [progress, setProgress] = useState<OnboardingProgressEvent | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<OnboardingErrorEvent | null>(null);
  const [lastStep, setLastStep] = useState<OnboardingStepEvent | null>(null);

  // Join room
  const joinRoom = useCallback((roomSessionId: string) => {
    const socket = getSocket();
    if (socket && roomSessionId) {
      socket.emit(ONBOARDING_EVENTS.JOIN, roomSessionId);
    }
  }, []);

  // Leave room
  const leaveRoom = useCallback((roomSessionId: string) => {
    const socket = getSocket();
    if (socket && roomSessionId) {
      socket.emit(ONBOARDING_EVENTS.LEAVE, roomSessionId);
    }
  }, []);

  useEffect(() => {
    if (!enabled || !sessionId) return;

    const socket = getSocket();
    if (!socket) return;

    // Track connection status
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    // Handle progress updates
    const handleProgress = (data: OnboardingProgressEvent) => {
      if (data.sessionId === sessionId) {
        setProgress(data);
        onProgress?.(data);
      }
    };

    // Handle completion
    const handleComplete = (data: OnboardingCompleteEvent) => {
      if (data.sessionId === sessionId) {
        setIsComplete(true);
        setProgress(null);
        onComplete?.(data);
      }
    };

    // Handle errors
    const handleError = (data: OnboardingErrorEvent) => {
      if (data.sessionId === sessionId) {
        setError(data);
        onError?.(data);
      }
    };

    // Handle step events
    const handleStep = (data: OnboardingStepEvent) => {
      if (data.sessionId === sessionId) {
        setLastStep(data);
        onStep?.(data);
      }
    };

    // Set initial connection state
    setIsConnected(socket.connected);

    // Subscribe to events
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on(ONBOARDING_EVENTS.PROGRESS, handleProgress);
    socket.on(ONBOARDING_EVENTS.COMPLETE, handleComplete);
    socket.on(ONBOARDING_EVENTS.ERROR, handleError);
    socket.on(ONBOARDING_EVENTS.STEP, handleStep);

    // Join the onboarding room
    joinRoom(sessionId);

    // Cleanup
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off(ONBOARDING_EVENTS.PROGRESS, handleProgress);
      socket.off(ONBOARDING_EVENTS.COMPLETE, handleComplete);
      socket.off(ONBOARDING_EVENTS.ERROR, handleError);
      socket.off(ONBOARDING_EVENTS.STEP, handleStep);
      leaveRoom(sessionId);
    };
  }, [sessionId, enabled, onProgress, onComplete, onError, onStep, joinRoom, leaveRoom]);

  return {
    isConnected,
    progress,
    isComplete,
    error,
    lastStep,
    joinRoom,
    leaveRoom,
  };
}

// ============================================
// Progress-only Hook (simplified)
// ============================================

interface UseMagicImportProgressOptions {
  sessionId?: string;
  enabled?: boolean;
}

interface UseMagicImportProgressReturn {
  stage: string | null;
  stageName: string | null;
  stageProgress: number;
  overallProgress: number;
  message: string | null;
  isRunning: boolean;
  isComplete: boolean;
  error: string | null;
}

export function useMagicImportProgress(
  options: UseMagicImportProgressOptions = {}
): UseMagicImportProgressReturn {
  const { sessionId, enabled = true } = options;

  const [state, setState] = useState<UseMagicImportProgressReturn>({
    stage: null,
    stageName: null,
    stageProgress: 0,
    overallProgress: 0,
    message: null,
    isRunning: false,
    isComplete: false,
    error: null,
  });

  useOnboardingSocket({
    sessionId,
    enabled,
    onProgress: (data) => {
      setState({
        stage: data.stage,
        stageName: data.stageName,
        stageProgress: data.stageProgress,
        overallProgress: data.overallProgress,
        message: data.message || null,
        isRunning: true,
        isComplete: false,
        error: null,
      });
    },
    onComplete: () => {
      setState((prev) => ({
        ...prev,
        isRunning: false,
        isComplete: true,
        overallProgress: 100,
      }));
    },
    onError: (data) => {
      setState((prev) => ({
        ...prev,
        isRunning: false,
        error: data.error,
      }));
    },
  });

  return state;
}

export default useOnboardingSocket;
