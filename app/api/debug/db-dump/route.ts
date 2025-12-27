import { NextResponse } from 'next/server';
import { getAllData } from '@/lib/auth/mockDb';

/**
 * GET /api/debug/db-dump
 * Debug endpoint to dump all data from the in-memory mockDb
 * Only available in development mode
 */
export async function GET() {
  // Only enable in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  try {
    const data = await getAllData();
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('[Debug DB Dump] Error:', error);
    return NextResponse.json(
      { error: 'Failed to dump database', message: error.message },
      { status: 500 }
    );
  }
}
