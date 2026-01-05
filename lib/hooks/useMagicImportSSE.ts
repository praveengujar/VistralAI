'use client';

// SSE-based hook for Magic Import progress updates
// Replaces WebSocket-based useMagicImportProgress hook

import { useEffect, useState, useCallback, useRef } from 'react';
import type {
  OnboardingProgressEvent,
  OnboardingCompleteEvent,
  OnboardingErrorEvent,
} from '@/lib/realtime/onboarding-events.client';

// ============================================
// Types
// ============================================

interface UseMagicImportSSEOptions {
  sessionId?: string;
  enabled?: boolean;
  onProgress?: (data: OnboardingProgressEvent) => void;
  onComplete?: (data: OnboardingCompleteEvent) => void;
  onError?: (data: OnboardingErrorEvent) => void;
}

interface UseMagicImportSSEReturn {
  isConnected: boolean;
  stage: string | null;
  stageName: string | null;
  stageProgress: number;
  overallProgress: number;
  message: string | null;
  isRunning: boolean;
  isComplete: boolean;
  error: string | null;
  reconnect: () => void;
}

// ============================================
// Hook
// ============================================

export function useMagicImportSSE(
  options: UseMagicImportSSEOptions = {}
): UseMagicImportSSEReturn {
  const { sessionId, enabled = true, onProgress, onComplete, onError } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [state, setState] = useState({
    stage: null as string | null,
    stageName: null as string | null,
    stageProgress: 0,
    overallProgress: 0,
    message: null as string | null,
    isRunning: false,
    isComplete: false,
    error: null as string | null,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;

  // Store callbacks in refs to avoid dependency issues
  const onProgressRef = useRef(onProgress);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onProgressRef.current = onProgress;
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
  }, [onProgress, onComplete, onError]);

  const connect = useCallback(() => {
    if (!sessionId || !enabled) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const url = `/api/onboarding/progress/stream?sessionId=${encodeURIComponent(sessionId)}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    // Handle connection established
    eventSource.addEventListener('connected', () => {
      console.log('[SSE Client] Connected to progress stream');
      setIsConnected(true);
      reconnectAttempts.current = 0;
      setState((prev) => ({ ...prev, isRunning: true, error: null }));
    });

    // Handle progress updates
    eventSource.addEventListener('progress', (event) => {
      try {
        const data: OnboardingProgressEvent = JSON.parse(event.data);
        console.log('[SSE Client] Progress received:', data.stage, data.overallProgress + '%', data.message);
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
        onProgressRef.current?.(data);
      } catch (e) {
        console.error('[SSE] Failed to parse progress event:', e);
      }
    });

    // Handle completion
    eventSource.addEventListener('complete', (event) => {
      try {
        const data: OnboardingCompleteEvent = JSON.parse(event.data);
        setState((prev) => ({
          ...prev,
          isRunning: false,
          isComplete: true,
          overallProgress: 100,
        }));
        onCompleteRef.current?.(data);
        eventSource.close();
        eventSourceRef.current = null;
        setIsConnected(false);
      } catch (e) {
        console.error('[SSE] Failed to parse complete event:', e);
      }
    });

    // Handle errors from server
    eventSource.addEventListener('error', (event) => {
      if (event instanceof MessageEvent) {
        try {
          const data: OnboardingErrorEvent = JSON.parse(event.data);
          setState((prev) => ({
            ...prev,
            isRunning: false,
            error: data.error,
          }));
          onErrorRef.current?.(data);
        } catch (e) {
          console.error('[SSE] Failed to parse error event:', e);
        }
      }
      eventSource.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    });

    // Handle timeout
    eventSource.addEventListener('timeout', () => {
      setState((prev) => ({
        ...prev,
        isRunning: false,
        error: 'Connection timeout',
      }));
      eventSource.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    });

    // Handle connection errors (network issues, etc.)
    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
      eventSourceRef.current = null;

      // Attempt reconnection
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++;
        const delay = 1000 * reconnectAttempts.current;
        console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
        setTimeout(connect, delay);
      } else {
        setState((prev) => ({
          ...prev,
          isRunning: false,
          error: 'Connection lost',
        }));
      }
    };
  }, [sessionId, enabled]);

  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0;
    setState((prev) => ({ ...prev, error: null }));
    connect();
  }, [connect]);

  // Connect on mount or when dependencies change
  useEffect(() => {
    if (enabled && sessionId) {
      connect();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connect, enabled, sessionId]);

  return {
    isConnected,
    ...state,
    reconnect,
  };
}

export default useMagicImportSSE;
