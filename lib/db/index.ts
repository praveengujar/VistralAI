// Unified Database Interface
// Supports three modes: postgres (enterprise), mongodb (legacy), mock (in-memory)
// This adapter pattern enables gradual migration and instant rollback

type DatabaseMode = 'postgres' | 'mongodb' | 'mock';

// Determine database mode from environment
function getDatabaseMode(): DatabaseMode {
  const mode = process.env.DATABASE_MODE?.toLowerCase();

  // New DATABASE_MODE takes precedence
  if (mode === 'postgres' || mode === 'postgresql') {
    return 'postgres';
  }
  if (mode === 'mongodb' || mode === 'mongo') {
    return 'mongodb';
  }
  if (mode === 'mock' || mode === 'memory') {
    return 'mock';
  }

  // Fall back to legacy USE_MONGODB flag for backwards compatibility
  if (process.env.USE_MONGODB === 'true') {
    return 'mongodb';
  }

  // Default to mock for safety
  return 'mock';
}

const DATABASE_MODE = getDatabaseMode();

// Log which database is being used (server-side only)
if (typeof window === 'undefined') {
  const modeLabels = {
    postgres: 'PostgreSQL (Enterprise)',
    mongodb: 'MongoDB (Legacy)',
    mock: 'In-memory MockDb'
  };
  console.log(`[Database] Using ${modeLabels[DATABASE_MODE]}`);
}

// Conditionally import and re-export all functions
// Using dynamic require to avoid bundling issues
let dbModule: typeof import('./operations') | typeof import('../auth/mockDb');

if (DATABASE_MODE === 'postgres' || DATABASE_MODE === 'mongodb') {
  // Both postgres and mongodb use Prisma operations
  dbModule = require('./operations');
} else {
  // Mock mode uses in-memory database
  dbModule = require('../auth/mockDb');
}

// Re-export all database functions
export const {
  // User operations
  createUser,
  getUserByEmail,
  getUserById,
  verifyPassword,

  // Brand Profile operations
  createBrandProfile,
  getBrandProfileByUserId,
  updateBrandProfile,

  // Brand Identity operations
  createBrandIdentity,
  getBrandIdentityByBrandId,
  updateBrandIdentity,

  // Market Position operations
  createMarketPosition,
  getMarketPositionByBrandId,
  updateMarketPosition,

  // Competitor Profile operations
  createCompetitorProfile,
  getCompetitorsByBrandId,
  updateCompetitorProfile,
  deleteCompetitorProfile,

  // Product Detail operations
  createProductDetail,
  getProductsByBrandId,
  updateProductDetail,
  deleteProductDetail,

  // Brand Asset operations
  createBrandAsset,
  getAssetsByBrandId,
  deleteAsset,

  // Uploaded Document operations
  createUploadedDocument,
  getDocumentsByBrandId,
  updateDocument,
  getDocumentById,

  // Aggregate operations
  getBrand360Data,
  logDbStats,
  getAllData,

  // AEO: Brand 360 Profile operations
  createBrand360Profile,
  getBrand360ProfileByOrganizationId,
  getBrand360ProfileById,
  updateBrand360Profile,

  // AEO: Entity Home operations
  getEntityHomeByBrand360Id,
  upsertEntityHome,

  // AEO: Organization Schema operations
  getOrganizationSchemaByBrand360Id,
  upsertOrganizationSchema,

  // AEO: Brand Identity Prism operations
  getBrandIdentityPrismByBrand360Id,
  upsertBrandIdentityPrism,

  // AEO: Brand Archetype operations
  getBrandArchetypeByBrand360Id,
  upsertBrandArchetype,

  // AEO: Brand Voice Profile operations
  getBrandVoiceProfileByBrand360Id,
  upsertBrandVoiceProfile,

  // AEO: Competitor Graph operations
  getCompetitorGraphByBrand360Id,
  upsertCompetitorGraph,
  addCompetitorToGraph,
  deleteCompetitorFromGraph,

  // AEO: Claim Locker operations
  getClaimLockerByBrand360Id,
  upsertClaimLocker,
  addClaimToLocker,
  updateClaim,
  deleteClaim,

  // AEO: Customer Persona operations
  getCustomerPersonasByBrand360Id,
  createCustomerPersona,
  updateCustomerPersona,
  deleteCustomerPersona,

  // AEO: Product operations (enhanced)
  getAEOProductsByBrand360Id,
  createAEOProduct,
  updateAEOProduct,
  deleteAEOProduct,

  // AEO: Generated Prompt operations
  getGeneratedPromptsByBrand360Id,
  getGeneratedPromptsByCategory,
  createGeneratedPrompt,
  updateGeneratedPrompt,
  deleteGeneratedPrompt,

  // AEO: Perception Scan operations
  getPerceptionScansByBrand360Id,
  createPerceptionScan,
  updatePerceptionScan,
  addPerceptionResult,

  // AEO: Perception Insight operations
  getPerceptionInsightsByBrand360Id,
  createPerceptionInsight,
  updatePerceptionInsight,

  // AEO: Correction Workflow operations
  getCorrectionWorkflowsByBrand360Id,
  createCorrectionWorkflow,
  updateCorrectionWorkflow,

  // AEO: Risk Factors operations
  getRiskFactorsByBrand360Id,
  upsertRiskFactors,
} = dbModule;

// Export database type for debugging/logging
export const DATABASE_TYPE = DATABASE_MODE;
