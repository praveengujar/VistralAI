import { NextRequest, NextResponse } from 'next/server';
import { productImportService, ColumnMapping } from '@/lib/services/ProductImportService';

/**
 * POST /api/products/import/execute
 * Execute product import with provided column mappings
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const brand360Id = formData.get('brand360Id') as string;
    const mappingsJson = formData.get('mappings') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!brand360Id) {
      return NextResponse.json(
        { error: 'brand360Id is required' },
        { status: 400 }
      );
    }

    if (!mappingsJson) {
      return NextResponse.json(
        { error: 'Column mappings are required' },
        { status: 400 }
      );
    }

    let columnMapping: ColumnMapping;
    try {
      columnMapping = JSON.parse(mappingsJson);
    } catch {
      return NextResponse.json(
        { error: 'Invalid column mappings format' },
        { status: 400 }
      );
    }

    // Validate that at least 'name' is mapped
    const hasNameMapping = Object.values(columnMapping).includes('name');
    if (!hasNameMapping) {
      return NextResponse.json(
        { error: 'Product name column mapping is required' },
        { status: 400 }
      );
    }

    // Parse file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const parseResult = await productImportService.parseFile(buffer, file.name);

    // Determine source type
    const source = file.name.toLowerCase().endsWith('.csv') ? 'csv' : 'xlsx';

    // Create import job
    const jobId = await productImportService.createImportJob(
      brand360Id,
      source,
      file.name,
      parseResult.totalRows
    );

    // Start import in background (non-blocking)
    productImportService
      .importProducts(brand360Id, jobId, parseResult.rows, columnMapping)
      .catch(err => {
        console.error('Import job failed:', err);
      });

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        fileName: file.name,
        totalRows: parseResult.totalRows,
        status: 'processing',
      },
    });
  } catch (error: any) {
    console.error('Error executing import:', error);
    return NextResponse.json(
      { error: 'Failed to execute import', message: error.message },
      { status: 500 }
    );
  }
}
