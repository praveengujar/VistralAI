import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Security headers configuration
const securityHeaders = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  // XSS protection (legacy but still useful)
  'X-XSS-Protection': '1; mode=block',
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Permissions policy (disable unnecessary features)
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for Next.js
    "style-src 'self' 'unsafe-inline'", // Required for Tailwind
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
};

// HSTS header (only in production over HTTPS)
const hstsHeader = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};

// Protected routes that require authentication
const protectedPaths = [
  '/dashboard',
  '/settings',
  '/onboarding',
  '/api/user',
  '/api/organization',
  '/api/brand-360',
  '/api/brand-profile',
  '/api/api-keys',
];

// Public API routes (no auth required)
const publicApiPaths = [
  '/api/auth',
  '/api/health',
];

// Check if path matches any protected patterns
function isProtectedPath(pathname: string): boolean {
  return protectedPaths.some(path => pathname.startsWith(path));
}

// Check if path is a public API route
function isPublicApiPath(pathname: string): boolean {
  return publicApiPaths.some(path => pathname.startsWith(path));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create response with security headers
  const response = NextResponse.next();

  // Add security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add HSTS in production
  if (process.env.NODE_ENV === 'production') {
    Object.entries(hstsHeader).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  // Skip auth check for public routes
  if (
    pathname.startsWith('/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/favicon.ico' ||
    pathname === '/' ||
    isPublicApiPath(pathname)
  ) {
    return response;
  }

  // Check authentication for protected routes
  if (isProtectedPath(pathname)) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Not authenticated - redirect to login or return 401
    if (!token) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user needs to complete onboarding
    // Skip this check if already on onboarding page
    if (
      !pathname.startsWith('/onboarding') &&
      !pathname.startsWith('/api/') &&
      token.onboardingCompleted === false
    ) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  return response;
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
