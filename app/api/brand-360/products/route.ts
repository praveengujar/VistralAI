import { NextRequest, NextResponse } from 'next/server';
import {
  getProductsByBrandId,
  createProductDetail,
  updateProductDetail,
  deleteProductDetail,
} from '@/lib/db';

/**
 * GET /api/brand-360/products?brandId=xxx
 * Get all products for a brand
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

    const products = await getProductsByBrandId(brandId);

    return NextResponse.json({ data: products }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/brand-360/products
 * Create new product detail
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandId, ...productData } = body;

    if (!brandId) {
      return NextResponse.json(
        { error: 'Brand ID is required' },
        { status: 400 }
      );
    }

    if (!productData.name || !productData.category) {
      return NextResponse.json(
        { error: 'Product name and category are required' },
        { status: 400 }
      );
    }

    const newProduct = await createProductDetail({
      brandId,
      description: productData.description || '',
      features: productData.features || [],
      benefits: productData.benefits || [],
      useCases: productData.useCases || [],
      pricing: productData.pricing || { currency: 'USD', amount: 0 },
      url: productData.url || '',
      isActive: productData.isActive ?? true,
      ...productData,
    });

    return NextResponse.json({ data: newProduct }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/brand-360/products
 * Update existing product detail
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const updated = await updateProductDetail(id, updates);

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/brand-360/products?id=xxx
 * Delete a product
 */
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const deleted = await deleteProductDetail(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product', message: error.message },
      { status: 500 }
    );
  }
}
