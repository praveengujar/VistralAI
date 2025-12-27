import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { setupMfa } from '@/lib/auth/mfa';

// POST /api/user/mfa/setup - Start MFA setup
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { secret, qrCode, backupCodes } = await setupMfa(session.user.id, session.user.email);

    // Note: We don't save the secret yet - only after verification
    return NextResponse.json({
      secret,
      qrCode,
      backupCodes,
    });
  } catch (error) {
    console.error('[API] Error setting up MFA:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
