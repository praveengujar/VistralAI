// Real-time WebSocket Module
// Exports for both server and client-side WebSocket functionality

// Server-side exports (use only in API routes / server components)
export {
  initSocketServer,
  getSocketServer,
  emitScanStarted,
  emitScanProgress,
  emitScanComplete,
  emitScanError,
  emitNewInsight,
  emitCorrectionUpdate,
  getRoomMembers,
  broadcastToRoom,
} from './socket-server';

// Re-export types
export type {
  SocketEvents,
  ScanStartedEvent,
  ScanProgressEvent,
  ScanCompleteEvent,
  ScanErrorEvent,
  InsightEvent,
  CorrectionEvent,
} from './socket-server';
