import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/db';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  accountType: z.enum(['brand', 'agency', 'enterprise']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, accountType } = registerSchema.parse(body);

    const user = await createUser(email, password, accountType);

    return NextResponse.json(
      { user: { id: user.id, email: user.email, accountType: user.accountType } },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    if (error instanceof Error && error.message === 'User already exists') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
