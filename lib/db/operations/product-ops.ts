// Product Operations (Legacy and AEO)

import prisma from '../prisma';
import { ProductDetail } from '@/types';
import { transformProductDetail } from './transforms';

// ============================================
// Legacy Product Detail Operations
// ============================================

export const createProductDetail = async (
  product: Omit<ProductDetail, 'id' | 'createdAt' | 'updatedAt'>
) => {
  const newProduct = await prisma.productDetail.create({
    data: {
      brandId: product.brandId,
      name: product.name,
      sku: product.sku,
      category: product.category,
      subcategory: product.subcategory,
      description: product.description || '',
      shortDescription: product.shortDescription,
      features: product.features || [],
      benefits: product.benefits || [],
      useCases: product.useCases || [],
      targetAudience: product.targetAudience || [],
      pricing: product.pricing ? {
        currency: product.pricing.currency || 'USD',
        amount: product.pricing.amount || 0,
        billingPeriod: product.pricing.billingPeriod as any,
      } : null,
      url: product.url || '',
      imageUrls: product.imageUrls || [],
      specifications: product.specifications as any,
      awards: product.awards || [],
      certifications: product.certifications || [],
      isActive: product.isActive ?? true,
      launchDate: product.launchDate,
      source: product.source as any,
      confidenceScore: product.confidenceScore,
    },
  });

  return transformProductDetail(newProduct);
};

export const getProductsByBrandId = async (brandId: string) => {
  try {
    const products = await prisma.productDetail.findMany({
      where: { brandId },
    });

    return products.map(transformProductDetail);
  } catch {
    return [];
  }
};

export const updateProductDetail = async (id: string, updates: Partial<ProductDetail>) => {
  const { pricing, ...otherUpdates } = updates as any;
  const data: any = { ...otherUpdates };

  if (pricing) {
    data.pricing = {
      currency: pricing.currency || 'USD',
      amount: pricing.amount || 0,
      billingPeriod: pricing.billingPeriod,
    };
  }

  const product = await prisma.productDetail.update({
    where: { id },
    data,
  });

  return transformProductDetail(product);
};

export const deleteProductDetail = async (id: string) => {
  try {
    await prisma.productDetail.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
};

// ============================================
// AEO: Product Operations (Enhanced)
// ============================================

export const getAEOProductsByBrand360Id = async (brand360Id: string) => {
  return prisma.product.findMany({
    where: { brand360Id },
  });
};

export const createAEOProduct = async (
  brand360Id: string,
  data: {
    name: string;
    schemaType?: string;
    sku?: string;
    gtin?: string;
    category?: string;
    description?: string;
    shortDescription?: string;
    features?: string[];
    benefits?: string[];
    useCases?: string[];
    pricingJson?: object;
    url?: string;
    imageUrls?: string[];
    specifications?: object;
    awards?: string[];
    certifications?: string[];
    isActive?: boolean;
    schemaOrgOutput?: object;
  }
) => {
  return prisma.product.create({
    data: { brand360Id, ...data } as any,
  });
};

export const updateAEOProduct = async (
  productId: string,
  data: Partial<{
    name: string;
    schemaType: string;
    sku: string;
    gtin: string;
    category: string;
    description: string;
    shortDescription: string;
    features: string[];
    benefits: string[];
    useCases: string[];
    pricingJson: object;
    url: string;
    imageUrls: string[];
    specifications: object;
    awards: string[];
    certifications: string[];
    isActive: boolean;
    schemaOrgOutput: object;
  }>
) => {
  return prisma.product.update({
    where: { id: productId },
    data,
  });
};

export const deleteAEOProduct = async (productId: string) => {
  return prisma.product.delete({
    where: { id: productId },
  });
};
