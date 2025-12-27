import { NextRequest, NextResponse } from 'next/server';
import { createUploadedDocument, updateDocument } from '@/lib/db';
import { analyzeDocument } from '@/lib/ai/document-analysis';

/**
 * POST /api/brand-360/upload
 * Handle document upload and trigger AI analysis
 *
 * For MVP, we're using a simple base64 encoding approach
 * In production, this should upload to S3/GCS and use proper file handling
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandId, fileName, fileType, fileSize, fileContent } = body;

    // Validation
    if (!brandId || !fileName || !fileType) {
      return NextResponse.json(
        { error: 'Missing required fields: brandId, fileName, fileType' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes: Array<'pdf' | 'docx' | 'txt' | 'csv'> = ['pdf', 'docx', 'txt', 'csv'];
    if (!validTypes.includes(fileType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Supported types: pdf, docx, txt, csv' },
        { status: 400 }
      );
    }

    // Create document record with pending status
    const document = await createUploadedDocument({
      brandId,
      fileName,
      fileType,
      fileSize: fileSize || 0,
      fileUrl: `/uploads/${brandId}/${fileName}`, // Mock file URL
      status: 'pending',
    });

    // Return immediately with document ID
    // Start AI analysis in background (simulated)
    const documentId = document.id;

    // Trigger background processing (in production, use a queue)
    processDocumentInBackground(documentId, brandId, fileType, fileContent);

    return NextResponse.json(
      {
        message: 'Document uploaded successfully. Processing started.',
        data: document,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Simulate background processing
 * In production, this would be a separate service/queue worker
 */
async function processDocumentInBackground(
  documentId: string,
  brandId: string,
  fileType: 'pdf' | 'docx' | 'txt' | 'csv',
  fileContent?: string
) {
  try {
    // Update status to processing
    await updateDocument(documentId, { status: 'processing' });

    // Call AI analysis service
    const analysisResult = await analyzeDocument(documentId, brandId, fileType, fileContent);

    // Update document with results
    await updateDocument(documentId, {
      status: 'completed',
      extractedData: analysisResult.extractedData,
      processedAt: new Date(),
    });

    console.log(`Document ${documentId} processed successfully`);
  } catch (error: any) {
    console.error(`Error processing document ${documentId}:`, error);

    // Update status to failed
    await updateDocument(documentId, {
      status: 'failed',
      processingError: error.message,
      processedAt: new Date(),
    });
  }
}

/**
 * GET /api/brand-360/upload?brandId=xxx
 * Get upload history for a brand
 */
export async function GET(request: NextRequest) {
  try {
    const brandId = request.nextUrl.searchParams.get('brandId');

    if (!brandId) {
      return NextResponse.json(
        { error: 'Brand ID is required' },
        { status: 400 }
      );
    }

    const { getDocumentsByBrandId } = await import('@/lib/db');
    const documents = await getDocumentsByBrandId(brandId);

    return NextResponse.json({ data: documents }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents', message: error.message },
      { status: 500 }
    );
  }
}
