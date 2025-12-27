import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { verifyMfaCode, enableMfa } from '@/lib/auth/mfa';
import { z } from 'zod';

const verifySchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits'),
  secret: z.string().min(1, 'Secret is required'),
  backupCodes: z.array(z.string()),
});

// POST /api/user/mfa/verify - Verify MFA code and enable
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = verifySchema.parse(body);

    // Verify the TOTP code
    const isValid = verifyMfaCode(validated.code, validated.secret);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    // Enable MFA for the user
    await enableMfa(session.user.id, validated.secret, validated.backupCodes);

    return NextResponse.json({ message: 'MFA enabled successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    console.error('[API] Error verifying MFA:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
