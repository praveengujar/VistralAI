import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { disableMfa } from '@/lib/auth/mfa';

// DELETE /api/user/mfa - Disable MFA
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await disableMfa(session.user.id);

    return NextResponse.json({ message: 'MFA disabled successfully' });
  } catch (error) {
    console.error('[API] Error disabling MFA:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
