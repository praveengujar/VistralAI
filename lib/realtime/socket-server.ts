// Socket.io Server Configuration
// Server-side WebSocket setup with room-based subscriptions

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

// ============================================
// Types
// ============================================

export interface SocketEvents {
  // Client -> Server
  'join:brand': (brand360Id: string) => void;
  'leave:brand': (brand360Id: string) => void;

  // Server -> Client
  'scan:started': (data: ScanStartedEvent) => void;
  'scan:progress': (data: ScanProgressEvent) => void;
  'scan:complete': (data: ScanCompleteEvent) => void;
  'scan:error': (data: ScanErrorEvent) => void;
  'insight:new': (data: InsightEvent) => void;
  'correction:update': (data: CorrectionEvent) => void;
}

export interface ScanStartedEvent {
  scanId: string;
  brand360Id: string;
  platforms: string[];
  promptCount: number;
}

export interface ScanProgressEvent {
  scanId: string;
  brand360Id: string;
  completedCount: number;
  promptCount: number;
  currentPlatform: string;
  percentage: number;
}

export interface ScanCompleteEvent {
  scanId: string;
  brand360Id: string;
  overallScore: number;
  quadrantPosition: string;
  platformScores: Record<string, number>;
}

export interface ScanErrorEvent {
  scanId: string;
  brand360Id: string;
  error: string;
}

export interface InsightEvent {
  insightId: string;
  brand360Id: string;
  category: string;
  priority: string;
  title: string;
}

export interface CorrectionEvent {
  correctionId: string;
  brand360Id: string;
  status: string;
  previousStatus: string;
}

// ============================================
// Socket Server Singleton
// ============================================

let io: SocketIOServer | null = null;

export function getSocketServer(): SocketIOServer | null {
  return io;
}

export function initSocketServer(httpServer: HTTPServer): SocketIOServer {
  if (io) {
    return io;
  }

  io = new SocketIOServer(httpServer, {
    path: '/api/socket',
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Connection handling
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join brand room
    socket.on('join:brand', (brand360Id: string) => {
      socket.join(`brand:${brand360Id}`);
      console.log(`[Socket] ${socket.id} joined brand:${brand360Id}`);
    });

    // Leave brand room
    socket.on('leave:brand', (brand360Id: string) => {
      socket.leave(`brand:${brand360Id}`);
      console.log(`[Socket] ${socket.id} left brand:${brand360Id}`);
    });

    // Disconnect handling
    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id}, reason: ${reason}`);
    });

    socket.on('error', (error) => {
      console.error(`[Socket] Error from ${socket.id}:`, error);
    });
  });

  console.log('[Socket] Server initialized');
  return io;
}

// ============================================
// Event Emitters (for server-side use)
// ============================================

export function emitScanStarted(data: ScanStartedEvent): void {
  if (io) {
    io.to(`brand:${data.brand360Id}`).emit('scan:started', data);
  }
}

export function emitScanProgress(data: ScanProgressEvent): void {
  if (io) {
    io.to(`brand:${data.brand360Id}`).emit('scan:progress', data);
  }
}

export function emitScanComplete(data: ScanCompleteEvent): void {
  if (io) {
    io.to(`brand:${data.brand360Id}`).emit('scan:complete', data);
  }
}

export function emitScanError(data: ScanErrorEvent): void {
  if (io) {
    io.to(`brand:${data.brand360Id}`).emit('scan:error', data);
  }
}

export function emitNewInsight(data: InsightEvent): void {
  if (io) {
    io.to(`brand:${data.brand360Id}`).emit('insight:new', data);
  }
}

export function emitCorrectionUpdate(data: CorrectionEvent): void {
  if (io) {
    io.to(`brand:${data.brand360Id}`).emit('correction:update', data);
  }
}

// ============================================
// Room Management
// ============================================

export function getRoomMembers(brand360Id: string): number {
  if (!io) return 0;
  const room = io.sockets.adapter.rooms.get(`brand:${brand360Id}`);
  return room ? room.size : 0;
}

export function broadcastToRoom(brand360Id: string, event: string, data: unknown): void {
  if (io) {
    io.to(`brand:${brand360Id}`).emit(event, data);
  }
}
