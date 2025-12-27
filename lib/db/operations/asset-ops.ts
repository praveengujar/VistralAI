// Brand Asset and Uploaded Document Operations

import prisma from '../prisma';
import { BrandAsset, UploadedDocument } from '@/types';
import { transformBrandAsset, transformUploadedDocument } from './transforms';

// ============================================
// Brand Asset Operations
// ============================================

export const createBrandAsset = async (
  asset: Omit<BrandAsset, 'id' | 'createdAt' | 'updatedAt'>
) => {
  const newAsset = await prisma.brandAsset.create({
    data: {
      brandId: asset.brandId,
      type: asset.type as any,
      name: asset.name,
      description: asset.description,
      fileUrl: asset.fileUrl,
      metadata: asset.metadata as any,
    },
  });

  return transformBrandAsset(newAsset);
};

export const getAssetsByBrandId = async (brandId: string) => {
  try {
    const assets = await prisma.brandAsset.findMany({
      where: { brandId },
    });

    return assets.map(transformBrandAsset);
  } catch {
    return [];
  }
};

export const deleteAsset = async (id: string) => {
  try {
    await prisma.brandAsset.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
};

// ============================================
// Uploaded Document Operations
// ============================================

export const createUploadedDocument = async (
  document: Omit<UploadedDocument, 'id' | 'uploadedAt'>
) => {
  const newDocument = await prisma.uploadedDocument.create({
    data: {
      brandId: document.brandId,
      fileName: document.fileName,
      fileType: document.fileType as any,
      fileSize: document.fileSize || 0,
      fileUrl: document.fileUrl,
      status: (document.status as any) || 'pending',
      extractedData: document.extractedData as any,
      processingError: document.processingError,
      processedAt: document.processedAt,
    },
  });

  return transformUploadedDocument(newDocument);
};

export const getDocumentsByBrandId = async (brandId: string) => {
  try {
    const documents = await prisma.uploadedDocument.findMany({
      where: { brandId },
    });

    return documents.map(transformUploadedDocument);
  } catch {
    return [];
  }
};

export const updateDocument = async (id: string, updates: Partial<UploadedDocument>) => {
  const document = await prisma.uploadedDocument.update({
    where: { id },
    data: updates as any,
  });

  return transformUploadedDocument(document);
};

export const getDocumentById = async (id: string) => {
  try {
    const document = await prisma.uploadedDocument.findUnique({
      where: { id },
    });

    if (!document) return null;

    return transformUploadedDocument(document);
  } catch {
    return null;
  }
};
