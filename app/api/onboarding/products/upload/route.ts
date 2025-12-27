/**
 * Product Upload API
 * POST /api/onboarding/products/upload
 * Handles CSV/Excel product file uploads
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as any;
    const userId = formData.get('userId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 },
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 },
      );
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    const isValidFile =
      fileName.endsWith('.csv') ||
      fileName.endsWith('.xlsx') ||
      fileName.endsWith('.xls');

    if (!isValidFile) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload CSV or Excel file.' },
        { status: 400 },
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 },
      );
    }

    // Return mock response for MVP
    // In production, this would parse the actual file
    return NextResponse.json(
      {
        success: true,
        totalCount: 0,
        validCount: 0,
        products: [],
        errors: [],
        warnings: ['File upload received. Use the website analyzer or manual entry for product data.'],
        source: 'csv' as const,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error uploading products:', error);
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 },
    );
  }
}
