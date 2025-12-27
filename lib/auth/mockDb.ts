// Mock database for MVP - Replace with real database later
import {
  User,
  BrandProfile,
  BrandIdentity,
  MarketPosition,
  CompetitorProfile,
  ProductDetail,
  BrandAsset,
  UploadedDocument,
  Brand360Data,
} from '@/types';
import bcrypt from 'bcrypt';

// Type definition for our global mock database storage
// Using globalThis ensures data survives Next.js hot-reloads in development
interface MockDbMaps {
  users: Map<string, User & { password: string }>;
  brandProfiles: Map<string, BrandProfile>;
  brandIdentities: Map<string, BrandIdentity>;
  marketPositions: Map<string, MarketPosition>;
  competitorProfiles: Map<string, CompetitorProfile>;
  productDetails: Map<string, ProductDetail>;
  brandAssets: Map<string, BrandAsset>;
  uploadedDocuments: Map<string, UploadedDocument>;
  initialized: boolean;
}

// Extend globalThis to include our mock database
const globalForMockDb = globalThis as unknown as { mockDbMaps?: MockDbMaps };

// Initialize maps if they don't exist (first load or after server restart)
if (!globalForMockDb.mockDbMaps) {
  console.log('[MockDB] Initializing new mock database storage');
  globalForMockDb.mockDbMaps = {
    users: new Map(),
    brandProfiles: new Map(),
    brandIdentities: new Map(),
    marketPositions: new Map(),
    competitorProfiles: new Map(),
    productDetails: new Map(),
    brandAssets: new Map(),
    uploadedDocuments: new Map(),
    initialized: false,
  };
} else {
  console.log('[MockDB] Reusing existing mock database storage (hot-reload survived)');
}

// Reference the global maps for use throughout this module
const users = globalForMockDb.mockDbMaps.users;
const brandProfiles = globalForMockDb.mockDbMaps.brandProfiles;
const brandIdentities = globalForMockDb.mockDbMaps.brandIdentities;
const marketPositions = globalForMockDb.mockDbMaps.marketPositions;
const competitorProfiles = globalForMockDb.mockDbMaps.competitorProfiles;
const productDetails = globalForMockDb.mockDbMaps.productDetails;
const brandAssets = globalForMockDb.mockDbMaps.brandAssets;
const uploadedDocuments = globalForMockDb.mockDbMaps.uploadedDocuments;

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

// Debug helper to log map sizes
export const logDbStats = () => {
  console.log('[MockDB Stats]', {
    users: users.size,
    brandProfiles: brandProfiles.size,
    brandIdentities: brandIdentities.size,
    marketPositions: marketPositions.size,
    competitorProfiles: competitorProfiles.size,
    productDetails: productDetails.size,
  });
};

// User operations
export const createUser = async (email: string, password: string, accountType: User['accountType']) => {
  if (users.has(email)) {
    throw new Error('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user: User & { password: string } = {
    id: generateId(),
    email,
    password: hashedPassword,
    accountType,
    createdAt: new Date(),
    subscription: 'free',
  };

  users.set(email, user);
  return { id: user.id, email: user.email, accountType: user.accountType, createdAt: user.createdAt, subscription: user.subscription };
};

export const getUserByEmail = async (email: string) => {
  return users.get(email);
};

export const getUserById = async (id: string) => {
  for (const user of users.values()) {
    if (user.id === id) {
      return user;
    }
  }
  return null;
};

export const verifyPassword = async (password: string, hashedPassword: string) => {
  return bcrypt.compare(password, hashedPassword);
};

// Brand Profile operations
export const createBrandProfile = async (profile: Omit<BrandProfile, 'id'>) => {
  const id = generateId();
  const newProfile: BrandProfile = { ...profile, id, crawlingStatus: 'idle' };
  brandProfiles.set(id, newProfile);
  return newProfile;
};

export const getBrandProfileByUserId = async (userId: string) => {
  for (const profile of brandProfiles.values()) {
    if (profile.userId === userId) {
      return profile;
    }
  }
  return null;
};

export const updateBrandProfile = async (id: string, updates: Partial<BrandProfile>) => {
  const profile = brandProfiles.get(id);
  if (!profile) {
    throw new Error('Brand profile not found');
  }
  const updated = { ...profile, ...updates };
  brandProfiles.set(id, updated);
  return updated;
};

// Brand 360° operations

// Brand Identity
export const createBrandIdentity = async (identity: Omit<BrandIdentity, 'id' | 'createdAt' | 'updatedAt'>) => {
  const id = generateId();
  const newIdentity: BrandIdentity = {
    ...identity,
    id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  brandIdentities.set(id, newIdentity);
  return newIdentity;
};

export const getBrandIdentityByBrandId = async (brandId: string) => {
  for (const identity of brandIdentities.values()) {
    if (identity.brandId === brandId) {
      return identity;
    }
  }
  return null;
};

export const updateBrandIdentity = async (id: string, updates: Partial<BrandIdentity>) => {
  const identity = brandIdentities.get(id);
  if (!identity) throw new Error('Brand identity not found');
  const updated = { ...identity, ...updates, updatedAt: new Date() };
  brandIdentities.set(id, updated);
  return updated;
};

// Market Position
export const createMarketPosition = async (position: Omit<MarketPosition, 'id' | 'createdAt' | 'updatedAt'>) => {
  const id = generateId();
  const newPosition: MarketPosition = {
    ...position,
    id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  marketPositions.set(id, newPosition);
  return newPosition;
};

export const getMarketPositionByBrandId = async (brandId: string) => {
  for (const position of marketPositions.values()) {
    if (position.brandId === brandId) {
      return position;
    }
  }
  return null;
};

export const updateMarketPosition = async (id: string, updates: Partial<MarketPosition>) => {
  const position = marketPositions.get(id);
  if (!position) throw new Error('Market position not found');
  const updated = { ...position, ...updates, updatedAt: new Date() };
  marketPositions.set(id, updated);
  return updated;
};

// Competitor Profiles
export const createCompetitorProfile = async (competitor: Omit<CompetitorProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
  const id = generateId();
  const newCompetitor: CompetitorProfile = {
    ...competitor,
    id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  competitorProfiles.set(id, newCompetitor);
  return newCompetitor;
};

export const getCompetitorsByBrandId = async (brandId: string) => {
  const competitors: CompetitorProfile[] = [];
  for (const competitor of competitorProfiles.values()) {
    if (competitor.brandId === brandId) {
      competitors.push(competitor);
    }
  }
  return competitors;
};

export const updateCompetitorProfile = async (id: string, updates: Partial<CompetitorProfile>) => {
  const competitor = competitorProfiles.get(id);
  if (!competitor) throw new Error('Competitor profile not found');
  const updated = { ...competitor, ...updates, updatedAt: new Date() };
  competitorProfiles.set(id, updated);
  return updated;
};

export const deleteCompetitorProfile = async (id: string) => {
  return competitorProfiles.delete(id);
};

// Product Details
export const createProductDetail = async (product: Omit<ProductDetail, 'id' | 'createdAt' | 'updatedAt'>) => {
  const id = generateId();
  const newProduct: ProductDetail = {
    ...product,
    id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  productDetails.set(id, newProduct);
  return newProduct;
};

export const getProductsByBrandId = async (brandId: string) => {
  const products: ProductDetail[] = [];
  for (const product of productDetails.values()) {
    if (product.brandId === brandId) {
      products.push(product);
    }
  }
  return products;
};

export const updateProductDetail = async (id: string, updates: Partial<ProductDetail>) => {
  const product = productDetails.get(id);
  if (!product) throw new Error('Product not found');
  const updated = { ...product, ...updates, updatedAt: new Date() };
  productDetails.set(id, updated);
  return updated;
};

export const deleteProductDetail = async (id: string) => {
  return productDetails.delete(id);
};

// Brand Assets
export const createBrandAsset = async (asset: Omit<BrandAsset, 'id' | 'createdAt' | 'updatedAt'>) => {
  const id = generateId();
  const newAsset: BrandAsset = {
    ...asset,
    id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  brandAssets.set(id, newAsset);
  return newAsset;
};

export const getAssetsByBrandId = async (brandId: string) => {
  const assets: BrandAsset[] = [];
  for (const asset of brandAssets.values()) {
    if (asset.brandId === brandId) {
      assets.push(asset);
    }
  }
  return assets;
};

export const deleteAsset = async (id: string) => {
  return brandAssets.delete(id);
};

// Uploaded Documents
export const createUploadedDocument = async (document: Omit<UploadedDocument, 'id' | 'uploadedAt'>) => {
  const id = generateId();
  const newDocument: UploadedDocument = {
    ...document,
    id,
    uploadedAt: new Date(),
  };
  uploadedDocuments.set(id, newDocument);
  return newDocument;
};

export const getDocumentsByBrandId = async (brandId: string) => {
  const documents: UploadedDocument[] = [];
  for (const document of uploadedDocuments.values()) {
    if (document.brandId === brandId) {
      documents.push(document);
    }
  }
  return documents;
};

export const updateDocument = async (id: string, updates: Partial<UploadedDocument>) => {
  const document = uploadedDocuments.get(id);
  if (!document) throw new Error('Document not found');
  const updated = { ...document, ...updates };
  uploadedDocuments.set(id, updated);
  return updated;
};

export const getDocumentById = async (id: string) => {
  return uploadedDocuments.get(id) || null;
};

// Get complete Brand 360° data
export const getBrand360Data = async (brandId: string): Promise<Brand360Data | null> => {
  const identity = await getBrandIdentityByBrandId(brandId);
  const marketPosition = await getMarketPositionByBrandId(brandId);
  const competitors = await getCompetitorsByBrandId(brandId);
  const products = await getProductsByBrandId(brandId);
  const assets = await getAssetsByBrandId(brandId);

  if (!identity && !marketPosition && competitors.length === 0 && products.length === 0) {
    return null;
  }

  // Calculate completion status for each pillar
  const calculateCompletion = (obj: any, requiredFields: string[]) => {
    if (!obj) return 0;
    const filled = requiredFields.filter(field => {
      const value = obj[field];
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined && value !== '';
    }).length;
    return Math.round((filled / requiredFields.length) * 100);
  };

  const identityCompletion = calculateCompletion(identity, ['mission', 'vision', 'values', 'uniqueSellingPoints', 'brandVoice']);
  const marketCompletion = calculateCompletion(marketPosition, ['targetAudiences', 'marketSegment', 'geographicMarkets', 'industryVerticals']);
  const competitorsCompletion = competitors.length > 0 ? 100 : 0;
  const productsCompletion = products.length > 0 ? 100 : 0;

  const overallStrength = Math.round((identityCompletion + marketCompletion + competitorsCompletion + productsCompletion) / 4);

  return {
    brandId,
    identity: identity || {} as BrandIdentity,
    marketPosition: marketPosition || {} as MarketPosition,
    competitors,
    products,
    assets,
    profileStrength: overallStrength,
    lastUpdated: new Date(),
    completionStatus: {
      identity: identityCompletion,
      marketPosition: marketCompletion,
      competitors: competitorsCompletion,
      products: productsCompletion,
    },
  };
};

// Export all data for debugging
export const getAllData = async () => {
  return {
    stats: {
      users: users.size,
      brandProfiles: brandProfiles.size,
      brandIdentities: brandIdentities.size,
      marketPositions: marketPositions.size,
      competitorProfiles: competitorProfiles.size,
      productDetails: productDetails.size,
      brandAssets: brandAssets.size,
      uploadedDocuments: uploadedDocuments.size,
    },
    data: {
      users: Array.from(users.values()).map(u => ({ ...u, password: '[REDACTED]' })),
      brandProfiles: Array.from(brandProfiles.values()),
      brandIdentities: Array.from(brandIdentities.values()),
      marketPositions: Array.from(marketPositions.values()),
      competitorProfiles: Array.from(competitorProfiles.values()),
      productDetails: Array.from(productDetails.values()),
      brandAssets: Array.from(brandAssets.values()),
      uploadedDocuments: Array.from(uploadedDocuments.values()),
    }
  };
};
