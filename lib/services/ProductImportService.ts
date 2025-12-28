/**
 * ProductImportService - Handle CSV/XLSX product catalog imports
 *
 * This service handles:
 * 1. Parsing CSV and XLSX files
 * 2. Mapping columns to product fields
 * 3. Validating product data
 * 4. Importing products into the database
 * 5. Tracking import job progress
 */

import * as XLSX from 'xlsx';
import { Readable } from 'stream';
import prisma from '@/lib/db/prisma';

// ============================================
// Types
// ============================================

export interface ProductImportColumn {
  header: string;
  mappedField: ProductField | null;
  sampleValues: string[];
}

export type ProductField =
  | 'name'
  | 'slug'
  | 'description'
  | 'shortDescription'
  | 'sku'
  | 'gtin'
  | 'category'
  | 'subCategory'
  | 'price'
  | 'priceCurrency'
  | 'pricingModel'
  | 'features'
  | 'benefits'
  | 'useCases'
  | 'targetAudience'
  | 'imageUrl'
  | 'availability'
  | 'tags'
  | 'skip';

export interface ColumnMapping {
  [columnHeader: string]: ProductField | null;
}

export interface ProductImportRow {
  [key: string]: string | number | undefined;
}

export interface ProductImportError {
  row: number;
  field: string;
  error: string;
  value?: string;
}

export interface ProductImportWarning {
  row: number;
  field: string;
  warning: string;
  value?: string;
}

export interface ProductImportProgress {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'completed_with_errors';
  totalItems: number;
  processedItems: number;
  successItems: number;
  failedItems: number;
  errors: ProductImportError[];
  warnings: ProductImportWarning[];
}

export interface ParsedFile {
  columns: ProductImportColumn[];
  rows: ProductImportRow[];
  totalRows: number;
  suggestedMappings: ColumnMapping;
}

// ============================================
// Field Mapping Suggestions
// ============================================

const FIELD_KEYWORDS: Record<ProductField, string[]> = {
  name: ['name', 'title', 'product', 'product_name', 'product name', 'item'],
  slug: ['slug', 'handle', 'url_key', 'url key'],
  description: ['description', 'desc', 'long_description', 'body', 'content', 'details'],
  shortDescription: ['short_description', 'summary', 'excerpt', 'short desc', 'brief'],
  sku: ['sku', 'product_id', 'item_number', 'item number', 'part number', 'part_number'],
  gtin: ['gtin', 'upc', 'ean', 'isbn', 'barcode'],
  category: ['category', 'type', 'product_type', 'product type', 'collection'],
  subCategory: ['subcategory', 'sub_category', 'sub category', 'category_level_2'],
  price: ['price', 'amount', 'cost', 'regular_price', 'sale_price', 'unit_price'],
  priceCurrency: ['currency', 'price_currency', 'currency_code'],
  pricingModel: ['pricing_model', 'billing', 'subscription_type', 'price_type'],
  features: ['features', 'feature', 'specs', 'specifications'],
  benefits: ['benefits', 'benefit', 'advantages'],
  useCases: ['use_cases', 'use cases', 'applications', 'usage'],
  targetAudience: ['target_audience', 'audience', 'customer', 'target'],
  imageUrl: ['image', 'image_url', 'image_src', 'picture', 'photo', 'thumbnail'],
  availability: ['availability', 'stock', 'in_stock', 'status'],
  tags: ['tags', 'keywords', 'labels'],
  skip: [],
};

// ============================================
// ProductImportService
// ============================================

export class ProductImportService {
  /**
   * Parse a CSV or XLSX file and return column info with sample data
   */
  async parseFile(
    fileBuffer: Buffer,
    fileName: string
  ): Promise<ParsedFile> {
    const extension = fileName.toLowerCase().split('.').pop();
    let rows: ProductImportRow[] = [];

    if (extension === 'csv') {
      rows = await this.parseCSV(fileBuffer);
    } else if (extension === 'xlsx' || extension === 'xls') {
      rows = this.parseXLSX(fileBuffer);
    } else {
      throw new Error(`Unsupported file format: ${extension}`);
    }

    if (rows.length === 0) {
      throw new Error('File contains no data');
    }

    // Extract column headers
    const headers = Object.keys(rows[0]);

    // Build column info with sample values
    const columns: ProductImportColumn[] = headers.map(header => ({
      header,
      mappedField: null,
      sampleValues: rows
        .slice(0, 5)
        .map(row => String(row[header] || ''))
        .filter(v => v.length > 0),
    }));

    // Suggest field mappings based on header names
    const suggestedMappings = this.suggestFieldMappings(columns);

    // Apply suggestions to columns
    columns.forEach(col => {
      col.mappedField = suggestedMappings[col.header] || null;
    });

    return {
      columns,
      rows,
      totalRows: rows.length,
      suggestedMappings,
    };
  }

  /**
   * Parse CSV file using streaming
   */
  private parseCSV(buffer: Buffer): Promise<ProductImportRow[]> {
    return new Promise((resolve, reject) => {
      const csvParser = require('csv-parser');
      const rows: ProductImportRow[] = [];
      const stream = Readable.from(buffer);

      stream
        .pipe(csvParser())
        .on('data', (data: ProductImportRow) => rows.push(data))
        .on('end', () => resolve(rows))
        .on('error', reject);
    });
  }

  /**
   * Parse XLSX file
   */
  private parseXLSX(buffer: Buffer): ProductImportRow[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet);
  }

  /**
   * Suggest field mappings based on column headers
   */
  private suggestFieldMappings(columns: ProductImportColumn[]): ColumnMapping {
    const mappings: ColumnMapping = {};

    for (const column of columns) {
      const normalizedHeader = column.header.toLowerCase().trim().replace(/[\s_-]+/g, '_');

      for (const [field, keywords] of Object.entries(FIELD_KEYWORDS)) {
        if (field === 'skip') continue;

        for (const keyword of keywords) {
          const normalizedKeyword = keyword.toLowerCase().replace(/[\s_-]+/g, '_');
          if (
            normalizedHeader === normalizedKeyword ||
            normalizedHeader.includes(normalizedKeyword)
          ) {
            mappings[column.header] = field as ProductField;
            break;
          }
        }
        if (mappings[column.header]) break;
      }
    }

    return mappings;
  }

  /**
   * Create a new import job
   */
  async createImportJob(
    brand360Id: string,
    source: 'csv' | 'xlsx',
    fileName: string,
    totalItems: number
  ): Promise<string> {
    const job = await prisma.productImportJob.create({
      data: {
        brand360Id,
        source,
        fileName,
        status: 'pending',
        totalItems,
        processedItems: 0,
        successItems: 0,
        failedItems: 0,
      },
    });
    return job.id;
  }

  /**
   * Import products from parsed file data
   */
  async importProducts(
    brand360Id: string,
    jobId: string,
    rows: ProductImportRow[],
    columnMapping: ColumnMapping,
    onProgress?: (progress: ProductImportProgress) => void
  ): Promise<ProductImportProgress> {
    const errors: ProductImportError[] = [];
    const warnings: ProductImportWarning[] = [];
    let successItems = 0;
    let failedItems = 0;

    // Update job status to processing
    await prisma.productImportJob.update({
      where: { id: jobId },
      data: { status: 'processing', startedAt: new Date() },
    });

    // Get or create catalog
    const catalog = await prisma.aEOProductCatalog.upsert({
      where: { brand360Id },
      create: {
        brand360Id,
        catalogName: 'Imported Products',
        importSource: 'csv',
        lastImportAt: new Date(),
      },
      update: {
        lastImportAt: new Date(),
        lastImportSource: 'csv',
      },
    });

    // Process rows
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // Account for header row

      try {
        const productData = this.mapRowToProduct(row, columnMapping, rowNumber, warnings);

        if (!productData.name) {
          errors.push({
            row: rowNumber,
            field: 'name',
            error: 'Product name is required',
          });
          failedItems++;
          continue;
        }

        // Generate slug if not provided
        if (!productData.slug) {
          productData.slug = this.generateSlug(productData.name);
        }

        // Upsert product
        await prisma.product.upsert({
          where: {
            brand360Id_slug: {
              brand360Id,
              slug: productData.slug!,
            },
          },
          create: {
            brand360Id,
            catalogId: catalog.id,
            name: productData.name!,
            slug: productData.slug,
            description: productData.description,
            shortDescription: productData.shortDescription,
            sku: productData.sku,
            gtin: productData.gtin,
            category: productData.category,
            subCategory: productData.subCategory,
            price: productData.price,
            priceCurrency: productData.priceCurrency || 'USD',
            pricingModel: productData.pricingModel,
            features: productData.features || [],
            benefits: productData.benefits || [],
            useCases: productData.useCases || [],
            targetAudience: productData.targetAudience,
            imageUrl: productData.imageUrl,
            availability: productData.availability || 'InStock',
            tags: productData.tags || [],
            importSource: 'csv',
            importedAt: new Date(),
          },
          update: {
            name: productData.name,
            description: productData.description,
            shortDescription: productData.shortDescription,
            sku: productData.sku,
            gtin: productData.gtin,
            category: productData.category,
            subCategory: productData.subCategory,
            price: productData.price,
            priceCurrency: productData.priceCurrency,
            pricingModel: productData.pricingModel,
            features: productData.features || [],
            benefits: productData.benefits || [],
            useCases: productData.useCases || [],
            targetAudience: productData.targetAudience,
            imageUrl: productData.imageUrl,
            availability: productData.availability,
            tags: productData.tags || [],
            lastSyncAt: new Date(),
          },
        });

        successItems++;
      } catch (err) {
        errors.push({
          row: rowNumber,
          field: 'unknown',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
        failedItems++;
      }

      // Update progress periodically
      if ((i + 1) % 50 === 0 || i === rows.length - 1) {
        const progress: ProductImportProgress = {
          jobId,
          status: 'processing',
          totalItems: rows.length,
          processedItems: i + 1,
          successItems,
          failedItems,
          errors: errors.slice(-10), // Last 10 errors
          warnings: warnings.slice(-10),
        };

        await prisma.productImportJob.update({
          where: { id: jobId },
          data: {
            processedItems: i + 1,
            successItems,
            failedItems,
            errors: errors as any,
            warnings: warnings as any,
          },
        });

        onProgress?.(progress);
      }
    }

    // Finalize job
    const finalStatus =
      failedItems === 0
        ? 'completed'
        : failedItems === rows.length
        ? 'failed'
        : 'completed_with_errors';

    await prisma.productImportJob.update({
      where: { id: jobId },
      data: {
        status: finalStatus,
        completedAt: new Date(),
        processedItems: rows.length,
        successItems,
        failedItems,
        errors: errors as any,
        warnings: warnings as any,
      },
    });

    return {
      jobId,
      status: finalStatus,
      totalItems: rows.length,
      processedItems: rows.length,
      successItems,
      failedItems,
      errors,
      warnings,
    };
  }

  /**
   * Map a row to product data using column mappings
   */
  private mapRowToProduct(
    row: ProductImportRow,
    mapping: ColumnMapping,
    rowNumber: number,
    warnings: ProductImportWarning[]
  ): Partial<{
    name: string;
    slug: string;
    description: string;
    shortDescription: string;
    sku: string;
    gtin: string;
    category: string;
    subCategory: string;
    price: number;
    priceCurrency: string;
    pricingModel: string;
    features: string[];
    benefits: string[];
    useCases: string[];
    targetAudience: string;
    imageUrl: string;
    availability: string;
    tags: string[];
  }> {
    const product: any = {};

    for (const [columnHeader, field] of Object.entries(mapping)) {
      if (!field || field === 'skip') continue;

      const value = row[columnHeader];
      if (value === undefined || value === null || value === '') continue;

      switch (field) {
        case 'name':
        case 'slug':
        case 'description':
        case 'shortDescription':
        case 'sku':
        case 'gtin':
        case 'category':
        case 'subCategory':
        case 'priceCurrency':
        case 'pricingModel':
        case 'targetAudience':
        case 'imageUrl':
        case 'availability':
          product[field] = String(value).trim();
          break;

        case 'price':
          const parsedPrice = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
          if (!isNaN(parsedPrice)) {
            product.price = parsedPrice;
          } else {
            warnings.push({
              row: rowNumber,
              field: 'price',
              warning: 'Invalid price format',
              value: String(value),
            });
          }
          break;

        case 'features':
        case 'benefits':
        case 'useCases':
        case 'tags':
          // Split by common delimiters
          const items = String(value)
            .split(/[,;|\n]/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
          product[field] = items;
          break;
      }
    }

    return product;
  }

  /**
   * Generate URL-friendly slug
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 100);
  }

  /**
   * Get import job by ID
   */
  async getImportJob(jobId: string): Promise<ProductImportProgress | null> {
    const job = await prisma.productImportJob.findUnique({
      where: { id: jobId },
    });

    if (!job) return null;

    return {
      jobId: job.id,
      status: job.status as ProductImportProgress['status'],
      totalItems: job.totalItems,
      processedItems: job.processedItems,
      successItems: job.successItems,
      failedItems: job.failedItems,
      errors: (job.errors as unknown as ProductImportError[]) || [],
      warnings: (job.warnings as unknown as ProductImportWarning[]) || [],
    };
  }

  /**
   * Get all import jobs for a brand
   */
  async getImportJobs(brand360Id: string): Promise<ProductImportProgress[]> {
    const jobs = await prisma.productImportJob.findMany({
      where: { brand360Id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return jobs.map(job => ({
      jobId: job.id,
      status: job.status as ProductImportProgress['status'],
      totalItems: job.totalItems,
      processedItems: job.processedItems,
      successItems: job.successItems,
      failedItems: job.failedItems,
      errors: (job.errors as unknown as ProductImportError[]) || [],
      warnings: (job.warnings as unknown as ProductImportWarning[]) || [],
    }));
  }
}

// Export singleton instance
export const productImportService = new ProductImportService();
