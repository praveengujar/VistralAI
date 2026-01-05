// SSE endpoint for Magic Import progress updates
// Streams real-time progress to the client during onboarding

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { onboardingService } from '@/lib/services/onboarding';
import {
  getOnboardingProgressState,
  cleanupOnboardingProgress,
} from '@/lib/realtime/onboarding-progress';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Authenticate
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get session ID from query params
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return new Response('Missing sessionId', { status: 400 });
  }

  // Verify the session belongs to this user
  const onboardingSession = await onboardingService.getSessionByUserId(
    session.user.id
  );
  if (!onboardingSession || onboardingSession.id !== sessionId) {
    return new Response('Invalid session', { status: 403 });
  }

  // Create encoder for SSE
  const encoder = new TextEncoder();

  // Create readable stream
  const stream = new ReadableStream({
    async start(controller) {
      let lastTimestamp = 0;
      let consecutiveEmpty = 0;
      // Magic Import can take 3-5 minutes, especially with large sites
      // The crawler alone can timeout after 60s before falling back to single page
      const maxEmptyPolls = 3000; // 300 seconds (5 min) of no data = timeout (100ms * 3000)
      let pollInterval: NodeJS.Timeout | null = null;
      let isClosed = false;

      // Helper to safely enqueue data
      const safeEnqueue = (data: string) => {
        if (!isClosed) {
          try {
            controller.enqueue(encoder.encode(data));
          } catch {
            // Controller might be closed
            isClosed = true;
          }
        }
      };

      // Helper to safely close the stream
      const safeClose = () => {
        if (!isClosed) {
          isClosed = true;
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
          try {
            controller.close();
          } catch {
            // Already closed
          }
        }
      };

      // Send initial connection event
      console.log('[SSE Server] Client connected, sessionId:', sessionId);
      safeEnqueue(
        `event: connected\ndata: ${JSON.stringify({ sessionId })}\n\n`
      );

      // Poll Redis for updates
      pollInterval = setInterval(async () => {
        if (isClosed) {
          if (pollInterval) clearInterval(pollInterval);
          return;
        }

        try {
          const state = await getOnboardingProgressState(sessionId);

          if (state && state.timestamp > lastTimestamp) {
            lastTimestamp = state.timestamp;
            consecutiveEmpty = 0;

            console.log('[SSE Server] Sending event:', state.type, state.data);
            const eventData = `event: ${state.type}\ndata: ${JSON.stringify(state.data)}\n\n`;
            safeEnqueue(eventData);

            // If complete or error, clean up and close
            if (state.type === 'complete' || state.type === 'error') {
              // Clean up Redis after a short delay
              setTimeout(() => cleanupOnboardingProgress(sessionId), 5000);
              safeClose();
            }
          } else {
            consecutiveEmpty++;

            // Send heartbeat every 5 seconds (50 polls at 100ms each)
            if (consecutiveEmpty % 50 === 0) {
              safeEnqueue(`:heartbeat ${Date.now()}\n\n`);
            }

            // Timeout after no data
            if (consecutiveEmpty >= maxEmptyPolls) {
              safeEnqueue(
                `event: timeout\ndata: ${JSON.stringify({ message: 'Connection timeout' })}\n\n`
              );
              safeClose();
            }
          }
        } catch (error) {
          console.error('[SSE] Error polling progress:', error);
          safeEnqueue(
            `event: error\ndata: ${JSON.stringify({ error: 'Internal error' })}\n\n`
          );
          safeClose();
        }
      }, 100); // Poll every 100ms for near-real-time updates

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        safeClose();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
