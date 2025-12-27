import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import prisma from '@/lib/db/prisma';

// Type for session item
interface SessionItem {
  id: string;
  expires: Date;
  deviceType: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  lastActiveAt: Date;
  createdAt: Date;
}

// GET /api/user/sessions - Get active sessions
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await prisma.session.findMany({
      where: {
        userId: session.user.id,
        expires: { gt: new Date() },
      },
      select: {
        id: true,
        expires: true,
        deviceType: true,
        ipAddress: true,
        userAgent: true,
        lastActiveAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format sessions with device info
    const formattedSessions = sessions.map((s: SessionItem) => ({
      id: s.id,
      device: parseUserAgent(s.userAgent || '').device,
      browser: parseUserAgent(s.userAgent || '').browser,
      location: 'Unknown', // Would need IP geolocation service
      lastActive: s.lastActiveAt.toISOString(),
      expires: s.expires.toISOString(),
      // Check if this is the current session (would need session token comparison)
      isCurrent: false,
    }));

    return NextResponse.json(formattedSessions);
  } catch (error) {
    console.error('[API] Error fetching sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper to parse user agent
function parseUserAgent(ua: string): { device: string; browser: string } {
  // Simple parsing - could use a library like ua-parser-js for better results
  let device = 'Unknown Device';
  let browser = 'Unknown Browser';

  if (ua.includes('iPhone')) device = 'iPhone';
  else if (ua.includes('iPad')) device = 'iPad';
  else if (ua.includes('Android')) device = 'Android Device';
  else if (ua.includes('Macintosh')) device = 'Mac';
  else if (ua.includes('Windows')) device = 'Windows PC';
  else if (ua.includes('Linux')) device = 'Linux PC';

  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edge')) browser = 'Edge';

  return { device, browser };
}
