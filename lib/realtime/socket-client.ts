// Socket.io Client Hook
// Client-side WebSocket connection with auto-reconnection

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  ScanStartedEvent,
  ScanProgressEvent,
  ScanCompleteEvent,
  ScanErrorEvent,
  InsightEvent,
  CorrectionEvent,
} from './socket-server';

// ============================================
// Types
// ============================================

export interface SocketHookOptions {
  brand360Id?: string;
  enabled?: boolean;
  onScanStarted?: (data: ScanStartedEvent) => void;
  onScanProgress?: (data: ScanProgressEvent) => void;
  onScanComplete?: (data: ScanCompleteEvent) => void;
  onScanError?: (data: ScanErrorEvent) => void;
  onNewInsight?: (data: InsightEvent) => void;
  onCorrectionUpdate?: (data: CorrectionEvent) => void;
}

export interface SocketHookReturn {
  isConnected: boolean;
  error: Error | null;
  joinBrand: (brand360Id: string) => void;
  leaveBrand: (brand360Id: string) => void;
}

// ============================================
// Socket Singleton
// ============================================

let socketInstance: Socket | null = null;
let connectionCount = 0;

export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io({
      path: '/api/socket',
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
    });
  }
  return socketInstance;
}

// ============================================
// Main Hook
// ============================================

export function useSocket(options: SocketHookOptions = {}): SocketHookReturn {
  const {
    brand360Id,
    enabled = true,
    onScanStarted,
    onScanProgress,
    onScanComplete,
    onScanError,
    onNewInsight,
    onCorrectionUpdate,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const currentBrandRef = useRef<string | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!enabled) return;

    const socket = getSocket();
    socketRef.current = socket;
    connectionCount++;

    // Connect if not already connected
    if (!socket.connected) {
      socket.connect();
    }

    // Connection event handlers
    const handleConnect = () => {
      console.log('[Socket Client] Connected');
      setIsConnected(true);
      setError(null);

      // Rejoin brand room if we were in one
      if (currentBrandRef.current) {
        socket.emit('join:brand', currentBrandRef.current);
      }
    };

    const handleDisconnect = (reason: string) => {
      console.log('[Socket Client] Disconnected:', reason);
      setIsConnected(false);
    };

    const handleConnectError = (err: Error) => {
      console.error('[Socket Client] Connection error:', err);
      setError(err);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    // Set initial connection state
    setIsConnected(socket.connected);

    return () => {
      connectionCount--;

      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);

      // Disconnect only if no other hooks are using the socket
      if (connectionCount === 0 && socket.connected) {
        socket.disconnect();
      }
    };
  }, [enabled]);

  // Handle brand room joining
  useEffect(() => {
    if (!enabled || !brand360Id || !socketRef.current) return;

    const socket = socketRef.current;

    // Leave previous room if different
    if (currentBrandRef.current && currentBrandRef.current !== brand360Id) {
      socket.emit('leave:brand', currentBrandRef.current);
    }

    // Join new room
    if (socket.connected) {
      socket.emit('join:brand', brand360Id);
    }
    currentBrandRef.current = brand360Id;

    return () => {
      if (socket.connected && currentBrandRef.current) {
        socket.emit('leave:brand', currentBrandRef.current);
        currentBrandRef.current = null;
      }
    };
  }, [brand360Id, enabled]);

  // Set up event listeners
  useEffect(() => {
    if (!enabled || !socketRef.current) return;

    const socket = socketRef.current;

    // Create handlers that only call callbacks if they exist
    const handlers: [string, ((data: unknown) => void) | undefined][] = [
      ['scan:started', onScanStarted as ((data: unknown) => void) | undefined],
      ['scan:progress', onScanProgress as ((data: unknown) => void) | undefined],
      ['scan:complete', onScanComplete as ((data: unknown) => void) | undefined],
      ['scan:error', onScanError as ((data: unknown) => void) | undefined],
      ['insight:new', onNewInsight as ((data: unknown) => void) | undefined],
      ['correction:update', onCorrectionUpdate as ((data: unknown) => void) | undefined],
    ];

    // Register handlers
    for (const [event, handler] of handlers) {
      if (handler) {
        socket.on(event, handler);
      }
    }

    return () => {
      for (const [event, handler] of handlers) {
        if (handler) {
          socket.off(event, handler);
        }
      }
    };
  }, [
    enabled,
    onScanStarted,
    onScanProgress,
    onScanComplete,
    onScanError,
    onNewInsight,
    onCorrectionUpdate,
  ]);

  // Room management functions
  const joinBrand = useCallback((id: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join:brand', id);
      currentBrandRef.current = id;
    }
  }, []);

  const leaveBrand = useCallback((id: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave:brand', id);
      if (currentBrandRef.current === id) {
        currentBrandRef.current = null;
      }
    }
  }, []);

  return {
    isConnected,
    error,
    joinBrand,
    leaveBrand,
  };
}

// ============================================
// Specialized Hooks
// ============================================

export interface ScanSocketOptions {
  brand360Id: string;
  scanId?: string;
  onProgress?: (progress: ScanProgressEvent) => void;
  onComplete?: (result: ScanCompleteEvent) => void;
  onError?: (error: ScanErrorEvent) => void;
}

export function useScanSocket(options: ScanSocketOptions) {
  const { brand360Id, scanId, onProgress, onComplete, onError } = options;

  const [progress, setProgress] = useState<ScanProgressEvent | null>(null);
  const [result, setResult] = useState<ScanCompleteEvent | null>(null);
  const [scanError, setScanError] = useState<ScanErrorEvent | null>(null);

  const handleProgress = useCallback(
    (data: ScanProgressEvent) => {
      if (!scanId || data.scanId === scanId) {
        setProgress(data);
        onProgress?.(data);
      }
    },
    [scanId, onProgress]
  );

  const handleComplete = useCallback(
    (data: ScanCompleteEvent) => {
      if (!scanId || data.scanId === scanId) {
        setResult(data);
        onComplete?.(data);
      }
    },
    [scanId, onComplete]
  );

  const handleError = useCallback(
    (data: ScanErrorEvent) => {
      if (!scanId || data.scanId === scanId) {
        setScanError(data);
        onError?.(data);
      }
    },
    [scanId, onError]
  );

  const { isConnected, error } = useSocket({
    brand360Id,
    onScanProgress: handleProgress,
    onScanComplete: handleComplete,
    onScanError: handleError,
  });

  return {
    isConnected,
    connectionError: error,
    progress,
    result,
    scanError,
    percentage: progress?.percentage ?? 0,
    isComplete: result !== null,
  };
}

// ============================================
// Insight Socket Hook
// ============================================

export interface InsightSocketOptions {
  brand360Id: string;
  onNewInsight?: (insight: InsightEvent) => void;
}

export function useInsightSocket(options: InsightSocketOptions) {
  const { brand360Id, onNewInsight } = options;
  const [latestInsight, setLatestInsight] = useState<InsightEvent | null>(null);

  const handleNewInsight = useCallback(
    (data: InsightEvent) => {
      setLatestInsight(data);
      onNewInsight?.(data);
    },
    [onNewInsight]
  );

  const { isConnected, error } = useSocket({
    brand360Id,
    onNewInsight: handleNewInsight,
  });

  return {
    isConnected,
    error,
    latestInsight,
  };
}
