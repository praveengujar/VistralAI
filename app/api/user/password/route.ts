import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import prisma from '@/lib/db/prisma';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// PUT /api/user/password - Update password
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = passwordUpdateSchema.parse(body);

    // Get user with current password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user?.password) {
      return NextResponse.json(
        { error: 'Cannot change password for OAuth accounts' },
        { status: 400 }
      );
    }

    // Verify current password
    const isValid = await bcrypt.compare(validated.currentPassword, user.password);

    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(validated.newPassword, user.password);

    if (isSamePassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      );
    }

    // Hash new password and update
    const newPasswordHash = await bcrypt.hash(validated.newPassword, 10);

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: newPasswordHash,
        passwordChangedAt: new Date(),
      },
    });

    // TODO: Invalidate other sessions
    // TODO: Send email notification

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    console.error('[API] Error updating password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
