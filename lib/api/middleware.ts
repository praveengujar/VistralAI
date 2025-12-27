// API Middleware Utilities
// Provides standardized error handling, rate limiting, and auth wrappers

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';

// ============================================
// Response Helpers
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export function successResponse<T>(
  data: T,
  status: number = 200,
  message?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

export function errorResponse(
  error: string,
  status: number = 500,
  details?: unknown
): NextResponse<ApiResponse> {
  // Log server errors
  if (status >= 500) {
    console.error(`[API Error ${status}]`, error, details);
  }

  return NextResponse.json(
    {
      success: false,
      error,
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

// Common error responses
export const ErrorResponses = {
  unauthorized: () => errorResponse('Unauthorized', 401),
  forbidden: () => errorResponse('Forbidden', 403),
  notFound: (resource: string = 'Resource') => errorResponse(`${resource} not found`, 404),
  badRequest: (message: string = 'Bad request') => errorResponse(message, 400),
  methodNotAllowed: (allowed: string[]) =>
    errorResponse(`Method not allowed. Allowed: ${allowed.join(', ')}`, 405),
  internalError: (message: string = 'Internal server error') => errorResponse(message, 500),
  rateLimited: () => errorResponse('Too many requests', 429),
};

// ============================================
// Error Handler Wrapper
// ============================================

type ApiHandler = (
  request: NextRequest,
  context?: { params?: Record<string, string> }
) => Promise<NextResponse>;

export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, context?: { params?: Record<string, string> }) => {
    try {
      return await handler(request, context);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[API Error]', {
        path: request.nextUrl.pathname,
        method: request.method,
        error: message,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return ErrorResponses.internalError(message);
    }
  };
}

// ============================================
// Authentication Wrapper
// ============================================

interface AuthContext {
  session: NonNullable<Awaited<ReturnType<typeof getServerSession>>>;
  userId: string;
  userEmail: string;
}

type AuthenticatedHandler = (
  request: NextRequest,
  context: { params?: Record<string, string>; auth: AuthContext }
) => Promise<NextResponse>;

export function withAuth(handler: AuthenticatedHandler): ApiHandler {
  return withErrorHandler(async (request, context) => {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return ErrorResponses.unauthorized();
    }

    const authContext: AuthContext = {
      session,
      userId: (session.user as { id?: string }).id || session.user.email,
      userEmail: session.user.email,
    };

    return handler(request, { ...context, auth: authContext });
  });
}

// ============================================
// Rate Limiting
// ============================================

// Simple in-memory rate limiter (for production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
  windowMs?: number;  // Time window in milliseconds (default: 60000 = 1 minute)
  max?: number;       // Max requests per window (default: 100)
  keyGenerator?: (request: NextRequest) => string;  // Custom key generator
}

export function withRateLimit(
  handler: ApiHandler,
  options: RateLimitOptions = {}
): ApiHandler {
  const {
    windowMs = 60000,
    max = 100,
    keyGenerator = (req) => {
      // Use IP or session as key
      const forwarded = req.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
      return `ratelimit:${ip}:${req.nextUrl.pathname}`;
    },
  } = options;

  return withErrorHandler(async (request, context) => {
    const key = keyGenerator(request);
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    // Clean up expired entries periodically
    if (rateLimitStore.size > 10000) {
      for (const [k, v] of rateLimitStore.entries()) {
        if (v.resetTime < now) {
          rateLimitStore.delete(k);
        }
      }
    }

    if (!entry || entry.resetTime < now) {
      entry = { count: 0, resetTime: now + windowMs };
      rateLimitStore.set(key, entry);
    }

    entry.count++;

    if (entry.count > max) {
      const response = ErrorResponses.rateLimited();
      response.headers.set('X-RateLimit-Limit', String(max));
      response.headers.set('X-RateLimit-Remaining', '0');
      response.headers.set('X-RateLimit-Reset', String(Math.ceil(entry.resetTime / 1000)));
      return response;
    }

    const response = await handler(request, context);

    // Add rate limit headers to successful responses
    response.headers.set('X-RateLimit-Limit', String(max));
    response.headers.set('X-RateLimit-Remaining', String(Math.max(0, max - entry.count)));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(entry.resetTime / 1000)));

    return response;
  });
}

// ============================================
// Combined Middleware
// ============================================

interface MiddlewareOptions {
  rateLimit?: RateLimitOptions | false;
  requireAuth?: boolean;
}

export function withMiddleware(
  handler: ApiHandler | AuthenticatedHandler,
  options: MiddlewareOptions = {}
): ApiHandler {
  const { rateLimit = {}, requireAuth = false } = options;

  let wrappedHandler: ApiHandler = handler as ApiHandler;

  // Apply auth wrapper if required
  if (requireAuth) {
    wrappedHandler = withAuth(handler as AuthenticatedHandler);
  } else {
    wrappedHandler = withErrorHandler(handler as ApiHandler);
  }

  // Apply rate limiting unless explicitly disabled
  if (rateLimit !== false) {
    wrappedHandler = withRateLimit(wrappedHandler, rateLimit);
  }

  return wrappedHandler;
}

// ============================================
// Request Helpers
// ============================================

export async function parseJsonBody<T>(request: NextRequest): Promise<T | null> {
  try {
    return await request.json() as T;
  } catch {
    return null;
  }
}

export function getQueryParam(request: NextRequest, key: string): string | null {
  return request.nextUrl.searchParams.get(key);
}

export function getQueryParams(request: NextRequest, keys: string[]): Record<string, string | null> {
  const result: Record<string, string | null> = {};
  for (const key of keys) {
    result[key] = request.nextUrl.searchParams.get(key);
  }
  return result;
}

// ============================================
// Validation Helpers
// ============================================

export function validateRequired<T extends Record<string, unknown>>(
  data: T,
  requiredFields: (keyof T)[]
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const field of requiredFields) {
    const value = data[field];
    if (value === undefined || value === null || value === '') {
      missing.push(String(field));
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

export function createValidationError(missing: string[]): NextResponse {
  return errorResponse(`Missing required fields: ${missing.join(', ')}`, 400);
}
