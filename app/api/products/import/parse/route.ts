import { NextRequest, NextResponse } from 'next/server';
import { productImportService } from '@/lib/services/ProductImportService';

/**
 * POST /api/products/import/parse
 * Parse a CSV/XLSX file and return column info with suggested mappings
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a CSV or XLSX file.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse file
    const parseResult = await productImportService.parseFile(buffer, file.name);

    return NextResponse.json({
      success: true,
      data: {
        fileName: file.name,
        fileSize: file.size,
        columns: parseResult.columns,
        totalRows: parseResult.totalRows,
        suggestedMappings: parseResult.suggestedMappings,
        sampleRows: parseResult.rows.slice(0, 5),
      },
    });
  } catch (error: any) {
    console.error('Error parsing file:', error);
    return NextResponse.json(
      { error: 'Failed to parse file', message: error.message },
      { status: 500 }
    );
  }
}
