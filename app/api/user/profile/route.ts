import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

const profileUpdateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
});

// GET /api/user/profile - Get current user profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        phone: true,
        timezone: true,
        locale: true,
        avatarUrl: true,
        mfaEnabled: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('[API] Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/user/profile - Update current user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = profileUpdateSchema.parse(body);

    // Build name from firstName and lastName if provided
    const name =
      validated.firstName || validated.lastName
        ? `${validated.firstName || ''} ${validated.lastName || ''}`.trim()
        : undefined;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(validated.firstName !== undefined && { firstName: validated.firstName }),
        ...(validated.lastName !== undefined && { lastName: validated.lastName }),
        ...(name !== undefined && { name }),
        ...(validated.phone !== undefined && { phone: validated.phone }),
        ...(validated.timezone !== undefined && { timezone: validated.timezone }),
        ...(validated.locale !== undefined && { locale: validated.locale }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        phone: true,
        timezone: true,
        locale: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    console.error('[API] Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
