// User & Account Types
export type AccountType = 'brand' | 'agency' | 'enterprise';
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface User {
  id: string;
  email: string;
  accountType: AccountType;
  createdAt: Date;
  subscription: SubscriptionTier;
}

// Product & Catalog Types
export interface Product {
  id: string;
  name: string;
  category: string;
  attributes: Record<string, any>;
  url: string;
}

export interface ProductCatalog {
  products: Product[];
}

// Integration Types
export interface Integrations {
  gsc: boolean;
  ga4: boolean;
  shopify: boolean;
}

// Brand Profile Types
export interface BrandProfile {
  id: string;
  userId: string;
  brandName: string;
  domain: string;
  descriptor: string;
  category: string;
  competitors: string[];
  catalog: ProductCatalog;
  integrations: Integrations;
  crawlingStatus?: 'idle' | 'processing' | 'completed' | 'failed';
}

// AI Visibility Metrics Types
export type SentimentType = 'positive' | 'neutral' | 'negative';
export type HallucingSeverity = 'low' | 'medium' | 'high';

export interface Hallucination {
  engine: string;
  description: string;
  severity: HallucingSeverity;
}

export interface AIVisibilityMetrics {
  brandId: string;
  timestamp: Date;
  visibilityScore: number; // 0-100
  factualAccuracy: number; // 0-100
  sentiment: SentimentType;
  hallucinations: Hallucination[];
  missingInfo: string[];
  competitorSOV: Record<string, number>; // competitor name -> percentage
}

// AI Crawler Types
export type CrawlerType = 'OpenAI' | 'Gemini' | 'Claude' | 'Perplexity' | 'Unknown';
export type ContentType = 'product' | 'blog' | 'category' | 'other';

export interface AICrawlerEvent {
  brandId: string;
  timestamp: Date;
  crawlerType: CrawlerType;
  pageUrl: string;
  contentType: ContentType;
  crawlDepth: number;
}

// Dashboard & Insights Types
export interface MetricCard {
  label: string;
  value: number | string;
  change?: number; // percentage change
  trend?: 'up' | 'down' | 'stable';
  format?: 'number' | 'percentage' | 'score';
}

export interface OpportunityInsight {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'Technical' | 'Content' | 'Product';
  impact: number; // estimated impact 0-100
  completed: boolean;
}

// Alert Types
export type AlertType =
  | 'competitor_spike'
  | 'hallucination_detected'
  | 'visibility_drop'
  | 'high_crawler_activity';

export type AlertStatus = 'active' | 'resolved' | 'dismissed';

export interface Alert {
  id: string;
  brandId: string;
  type: AlertType;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: AlertStatus;
  createdAt: Date;
  resolvedAt?: Date;
}

// Chart Data Types
export interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
}

export interface CompetitorComparison {
  name: string;
  shareOfVoice: number;
  mentions: number;
  sentiment: SentimentType;
}

// Onboarding Types
export interface OnboardingStep {
  step: number;
  title: string;
  description: string;
  completed: boolean;
}

export interface OnboardingData {
  brandName: string;
  domain: string;
  descriptor: string;
  category: string;
  competitors: string[];
  catalogFile?: any;
  integrations: {
    gsc?: boolean;
    ga4?: boolean;
    shopify?: boolean;
  };
}

// Agency Types
export interface ClientAccount extends BrandProfile {
  healthScore: number; // 0-100
  lastActivity: Date;
  activeAlerts: number;
}

// Brand 360° Profile Types

// Pillar 1: Brand Identity
export interface BrandIdentity {
  id: string;
  brandId: string;
  mission?: string;
  vision?: string;
  values: string[]; // e.g., ["Innovation", "Sustainability", "Customer-first"]
  brandStory?: string;
  uniqueSellingPoints: string[];
  brandVoice?: {
    tone: string[]; // e.g., ["Professional", "Friendly", "Authoritative"]
    keywords: string[];
    avoidWords: string[];
  };
  brandPersonality?: string;
  tagline?: string;
  foundedYear?: number;
  headquarters?: string;

  // AI-generated metadata
  source?: 'manual' | 'ai-generated' | 'hybrid';
  extractionConfidence?: Record<string, number>; // Confidence scores for each field (0-1)
  extractedFromUrl?: string; // Source website URL if AI-generated

  createdAt: Date;
  updatedAt: Date;
}

// Pillar 2: Market Position
export interface TargetAudience {
  id: string;
  name: string; // e.g., "Tech-savvy Millennials"
  demographics: {
    ageRange?: string;
    gender?: string;
    income?: string;
    location?: string[];
    occupation?: string[];
  };
  psychographics: {
    interests?: string[];
    painPoints?: string[];
    goals?: string[];
    behaviors?: string[];
  };
  isPrimary: boolean;
}

export interface MarketPosition {
  id: string;
  brandId: string;
  targetAudiences: TargetAudience[];
  marketSegment?: string; // e.g., "Premium", "Budget", "Mid-tier"
  geographicMarkets: string[]; // e.g., ["North America", "Europe"]
  industryVerticals: string[]; // e.g., ["E-commerce", "SaaS"]
  marketSize?: {
    value: number;
    currency: string;
    year: number;
  };
  marketShare?: number; // percentage
  positioning?: string; // How brand positions itself vs competitors
  pricingStrategy?: 'premium' | 'value' | 'competitive' | 'penetration';
  createdAt: Date;
  updatedAt: Date;
}

// Pillar 3: Competitors (Enhanced)
export interface CompetitorProfile {
  id: string;
  brandId: string;
  name: string;
  domain: string;
  isPrimary: boolean; // Primary vs secondary competitor
  strengths: string[];
  weaknesses: string[];
  marketShare?: number;
  pricingPosition?: 'higher' | 'similar' | 'lower';
  differentiators: string[]; // How we differ from them
  targetAudienceOverlap?: number; // percentage 0-100

  // AI-generated metadata
  source?: 'manual' | 'ai-generated' | 'hybrid';
  competitionType?: 'direct' | 'indirect' | 'aspirational';
  confidenceScore?: number; // 0-1
  reasonForSelection?: string;

  createdAt: Date;
  updatedAt: Date;
}

// Pillar 4: Products & Services (Enhanced)
export interface ProductDetail {
  id: string;
  brandId: string;
  name: string;
  sku?: string;
  category: string;
  subcategory?: string;
  description: string;
  shortDescription?: string;
  features: string[];
  benefits: string[];
  useCases: string[];
  targetAudience?: string[]; // References to TargetAudience names
  pricing: {
    currency: string;
    amount: number;
    billingPeriod?: 'one-time' | 'monthly' | 'yearly';
  };
  url: string;
  imageUrls?: string[];
  specifications?: Record<string, string>;
  awards?: string[];
  certifications?: string[];
  isActive: boolean;
  launchDate?: Date;

  // AI-generated metadata
  source?: 'csv' | 'xlsx' | 'shopify' | 'website' | 'manual';
  confidenceScore?: number; // 0-1

  createdAt: Date;
  updatedAt: Date;
}

// Brand Assets & Content
export interface BrandAsset {
  id: string;
  brandId: string;
  type: 'logo' | 'color_palette' | 'typography' | 'imagery' | 'document' | 'other';
  name: string;
  description?: string;
  fileUrl?: string;
  metadata: Record<string, any>; // Type-specific metadata
  createdAt: Date;
  updatedAt: Date;
}

// Document Upload & AI Analysis
export interface UploadedDocument {
  id: string;
  brandId: string;
  fileName: string;
  fileType: 'pdf' | 'docx' | 'txt' | 'csv';
  fileSize: number; // bytes
  fileUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  extractedData?: Partial<Brand360Data>;
  processingError?: string;
  uploadedAt: Date;
  processedAt?: Date;
}

export interface DocumentAnalysisResult {
  documentId: string;
  extractedData: Partial<Brand360Data>;
  confidence: number; // 0-100
  suggestions: string[];
  warnings: string[];
}

// Complete Brand 360° Data
export interface Brand360Data {
  brandId: string;
  identity: BrandIdentity;
  marketPosition: MarketPosition;
  competitors: CompetitorProfile[];
  products: ProductDetail[];
  assets: BrandAsset[];
  profileStrength: number; // 0-100
  lastUpdated: Date;
  completionStatus: {
    identity: number; // 0-100
    marketPosition: number; // 0-100
    competitors: number; // 0-100
    products: number; // 0-100
  };
}

// Profile Strength Calculation
export interface ProfileStrengthMetrics {
  overall: number; // 0-100
  pillars: {
    identity: number;
    marketPosition: number;
    competitors: number;
    products: number;
  };
  missingFields: {
    pillar: string;
    field: string;
    importance: 'critical' | 'important' | 'optional';
  }[];
  recommendations: string[];
}

// Re-export extraction and queue types from dedicated files
export * from './extraction';
export * from './queue';
