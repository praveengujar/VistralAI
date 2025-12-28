/**
 * Agent Types for VistralAI AEO Engine
 *
 * These types define the interfaces for the Magic Import agent system
 * that powers the Semantic Ground Truth Engine.
 */

// Note: Types are defined locally to avoid Prisma client dependency in production builds

// ============================================
// Core Agent Types
// ============================================

/**
 * Generic result wrapper for all agent operations
 */
export interface AgentResult<T> {
  success: boolean;
  data?: T;
  confidence: number; // 0-1
  source: string;
  errors?: string[];
  duration?: number; // milliseconds
}

/**
 * Progress callback for long-running agent operations
 */
export type AgentProgressCallback = (stage: string, progress: number, message?: string) => void;

// ============================================
// Crawler Agent Types
// ============================================

/**
 * Result from the CrawlerAgent
 */
export interface CrawlerAgentResult {
  entityHome: Partial<EntityHomeData>;
  organizationSchema: Partial<OrganizationSchemaData>;
  socialLinks: string[];
  schemaMarkup: SchemaOrgMarkup[];
  rawContent: string;
  crawledUrls: string[];
}

/**
 * EntityHome data structure (before DB insertion)
 */
export interface EntityHomeData {
  canonicalUrl: string;
  wikidataId?: string;
  wikipediaUrl?: string;
  crunchbaseUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  githubUrl?: string;
  instagramUrl?: string;
  wikidataVerified: boolean;
  schemaValidated: boolean;
  socialConsistent: boolean;
  googleKgId?: string;
  googleKgScore?: number;
  googleKgDescription?: string;
  disambiguationNotes?: string;
  alternateNames: string[];
  formerNames: string[];
}

/**
 * Organization Schema data structure (before DB insertion)
 */
export interface OrganizationSchemaData {
  organizationType: string;
  legalName: string;
  name: string;
  alternateName?: string;
  description?: string;
  slogan?: string;
  foundingDate?: Date;
  foundingLocation?: string;
  founders?: FounderInfo[];
  contactPoints?: ContactPoint[];
  address?: Address;
  numberOfEmployees?: string;
  naicsCode?: string;
  isicCode?: string;
  awards: string[];
  parentOrganization?: string;
  subOrganizations: string[];
  jsonLdOutput?: object;
}

export interface FounderInfo {
  name: string;
  url?: string;
  role?: string;
}

export interface ContactPoint {
  type: 'Sales' | 'Support' | 'PR' | 'General';
  email?: string;
  phone?: string;
  url?: string;
}

export interface Address {
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface SchemaOrgMarkup {
  '@type': string;
  '@context'?: string;
  [key: string]: unknown;
}

// ============================================
// Vibe Check Agent Types
// ============================================

/**
 * Result from the VibeCheckAgent
 */
export interface VibeCheckAgentResult {
  brandIdentityPrism: Partial<BrandIdentityPrismData>;
  brandArchetype: Partial<BrandArchetypeData>;
  brandVoice: Partial<BrandVoiceData>;
  inferredTone: string;
  inferredPersonality: PersonalityScores;
}

/**
 * Kapferer Brand Identity Prism data
 */
export interface BrandIdentityPrismData {
  physique: PhysiqueData;
  personalityScores: PersonalityScores;
  personalityTraits: string[];
  cultureValues: string[];
  cultureDescription?: string;
  relationshipType?: string;
  relationshipDescription?: string;
  reflectionProfile: ReflectionProfile;
  selfImage?: string;
  inferredByAgent: boolean;
  confidence?: number;
}

export interface PhysiqueData {
  attributes: string[];
  description?: string;
}

/**
 * Aaker Brand Personality Dimensions (scored 0-100)
 */
export interface PersonalityScores {
  sincerity: number;
  excitement: number;
  competence: number;
  sophistication: number;
  ruggedness: number;
}

export interface ReflectionProfile {
  demographics?: string;
  psychographics?: string;
  lifestyle?: string;
}

/**
 * Jung/Mark Brand Archetype data
 */
export interface BrandArchetypeData {
  primaryArchetype: ArchetypeType;
  primaryScore: number;
  secondaryArchetype?: ArchetypeType;
  secondaryScore?: number;
  expectedTone: string[];
  expectedDepth: 'surface' | 'moderate' | 'deep';
  expectedCitations: boolean;
  expectedHumor: 'none' | 'subtle' | 'prominent';
  archetypeScores: ArchetypeScores;
}

export type ArchetypeType =
  | 'innocent'
  | 'sage'
  | 'explorer'
  | 'outlaw'
  | 'magician'
  | 'hero'
  | 'lover'
  | 'jester'
  | 'everyman'
  | 'caregiver'
  | 'ruler'
  | 'creator';

export interface ArchetypeScores {
  innocent: number;
  sage: number;
  explorer: number;
  outlaw: number;
  magician: number;
  hero: number;
  lover: number;
  jester: number;
  everyman: number;
  caregiver: number;
  ruler: number;
  creator: number;
}

/**
 * Brand Voice Profile data
 */
export interface BrandVoiceData {
  voiceSpectrums: VoiceSpectrums;
  primaryTone?: string;
  secondaryTones: string[];
  vocabularyLevel: 'simple' | 'moderate' | 'technical' | 'academic';
  sentenceStyle: 'short_punchy' | 'moderate' | 'complex_nuanced';
  approvedPhrases: string[];
  bannedPhrases: string[];
  bannedTopics: string[];
  voiceSamples: string[];
  voiceEmbedding?: number[];
}

export interface VoiceSpectrums {
  formal_casual: number; // 1-10 (1=formal, 10=casual)
  serious_playful: number; // 1-10
  respectful_irreverent: number; // 1-10
  enthusiastic_matter_of_fact: number; // 1-10
}

// ============================================
// Competitor Agent Types
// ============================================

/**
 * Result from the CompetitorAgent
 */
export interface CompetitorAgentResult {
  competitors: Partial<CompetitorData>[];
  differentiators: string[];
  marketPosition: MarketPosition;
}

/**
 * Competitor data structure
 */
export interface CompetitorData {
  name: string;
  website?: string;
  description?: string;
  logoUrl?: string;
  competitorType: 'direct' | 'indirect' | 'aspirational';
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  marketPosition?: 'leader' | 'challenger' | 'niche' | 'emerging';
  pricingTier?: 'luxury' | 'premium' | 'mid' | 'value' | 'free';
  strengths: string[];
  weaknesses: string[];
  differentiators?: DifferentiatorComparison[];
  discoveredBy: 'manual' | 'agent' | 'g2' | 'capterra';
}

export interface DifferentiatorComparison {
  ours: string;
  theirs: string;
  advantage: 'us' | 'them' | 'tie';
}

export type MarketPosition = 'leader' | 'challenger' | 'niche' | 'emerging';

// ============================================
// Magic Import Orchestrator Types
// ============================================

/**
 * Result from the full Magic Import process
 */
export interface MagicImportResult {
  brand360Id: string;
  completionScore: number;
  entityHealthScore: number;
  discoveries: {
    entityHome: boolean;
    organizationSchema: boolean;
    brandIdentity: boolean;
    competitors: number;
    products: number;
  };
  stages: MagicImportStage[];
  errors: string[];
  totalDuration: number;
}

export interface MagicImportStage {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  confidence?: number;
  duration?: number;
  error?: string;
}

/**
 * Options for Magic Import
 */
export interface MagicImportOptions {
  skipCrawler?: boolean;
  skipVibeCheck?: boolean;
  skipCompetitors?: boolean;
  skipProducts?: boolean;
  maxPages?: number;
  maxProducts?: number;
  onProgress?: AgentProgressCallback;
}

// ============================================
// Prompt Generation Types (for future use)
// ============================================

export type PromptCategory =
  | 'navigational'
  | 'functional'
  | 'comparative'
  | 'voice'
  | 'adversarial';

export type PromptIntent =
  | 'informational'
  | 'commercial'
  | 'transactional'
  | 'navigational';

// ============================================
// Prompt Generator Agent Types
// ============================================

export type LLMPlatform = 'claude' | 'chatgpt' | 'gemini' | 'perplexity' | 'google_aio';

export interface PromptTemplate {
  id: string;
  template: string;
  intent: PromptIntent;
  expectedThemes: string[];
  expectedCitations: boolean;
  priority: number;
  adversarialTwist?: string;
  hallucinationTest?: boolean;
}

export interface PromptTemplateCategory {
  categoryLabel: string;
  templates: PromptTemplate[];
}

export interface GeneratedPromptData {
  category: PromptCategory;
  categoryLabel: string;
  intent: PromptIntent;
  template: string;
  renderedPrompt: string;
  targetPersona?: string;
  targetCompetitor?: string;
  targetClaim?: string;
  targetProduct?: string;
  expectedThemes: string[];
  expectedTone?: string;
  expectedEntities: string[];
  expectedCitations: boolean;
  adversarialTwist?: string;
  hallucinationTest: boolean;
  priority: number;
  isCustom: boolean;
}

export interface PromptGeneratorOptions {
  categories?: PromptCategory[];
  maxPerCategory?: number;
  includeCustom?: boolean;
  personaFilter?: string[];
  competitorFilter?: string[];
  productFilter?: string[];
}

export interface PromptGeneratorResult {
  prompts: GeneratedPromptData[];
  categoryBreakdown: Record<PromptCategory, number>;
  totalGenerated: number;
  personasCovered: string[];
  competitorsCovered: string[];
  productsCovered: string[];
}

// ============================================
// Perception Evaluator Agent Types
// ============================================

export type QuadrantPosition = 'dominant' | 'vulnerable' | 'niche' | 'invisible';

export interface EvaluationMetrics {
  faithfulnessScore: number;       // 0-100
  faithfulnessErrors: string[];
  shareOfVoice: number;            // 0-100
  brandMentioned: boolean;
  brandPosition: number | null;    // 1-indexed position, null if not mentioned
  competitorsMentioned: string[];
  competitorPositions: Record<string, number>;
  overallSentiment: number;        // -1 to 1
  aspectSentiments: Record<string, number>;
  voiceAlignmentScore: number;     // 0-100
  voiceDeviations: string[];
  hallucinationScore: number;      // 0-100 (100 = no hallucinations)
  hallucinations: string[];
  keyThemes: string[];
  missingInformation: string[];
  opportunities: string[];
}

export interface PerceptionEvaluatorResult {
  promptId: string;
  platform: LLMPlatform;
  model: string;
  response: string;
  responseTime: number;
  tokensUsed?: number;
  metrics: EvaluationMetrics;
  rawEvaluation: object;
}

export interface PerceptionEvaluatorOptions {
  platforms?: LLMPlatform[];
  batchSize?: number;
  parallelExecutions?: number;
  timeoutMs?: number;
  mockExternalPlatforms?: boolean;
}

// ============================================
// Perception Scan Orchestrator Types
// ============================================

export interface PerceptionScanOptions {
  platforms?: LLMPlatform[];
  promptIds?: string[];
  categories?: PromptCategory[];
  maxPrompts?: number;
  batchSize?: number;
  parallelPlatforms?: number;
  mockExternalPlatforms?: boolean;
  onProgress?: AgentProgressCallback;
}

export interface AggregatedScores {
  overall: number;
  byPlatform: Partial<Record<LLMPlatform, number>>;
  byCategory: Partial<Record<PromptCategory, number>>;
  byMetric: {
    faithfulness: number;
    shareOfVoice: number;
    sentiment: number;
    voiceAlignment: number;
    hallucinationRisk: number;
  };
}

export interface PerceptionScanResult {
  scanId: string;
  brand360Id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  platforms: LLMPlatform[];
  promptCount: number;
  completedCount: number;
  results: PerceptionEvaluatorResult[];
  aggregatedScores: AggregatedScores;
  quadrantPosition: QuadrantPosition;
  insights: string[];
  startedAt: Date;
  completedAt?: Date;
}

// ============================================
// Ground Truth Types
// ============================================

export interface Brand360GroundTruth {
  brandName: string;
  products: Array<{ name: string; features: string[]; benefits: string[] }>;
  claims: Array<{ claimText: string; evidenceUrl?: string }>;
  competitors: Array<{ name: string }>;
  foundingYear?: string;
  founders?: string[];
  values: string[];
  voiceProfile: {
    primaryTone: string;
    vocabularyLevel: string;
    approvedPhrases: string[];
    bannedPhrases: string[];
  };
  riskFactors?: {
    misconceptions: string[];
    negativeKeywords: string[];
  };
}

// Legacy compatibility alias
export interface EvaluationScores {
  faithfulness: number;
  shareOfVoice: number;
  sentiment: number;
  voiceAlignment: number;
  hallucinationRisk: number;
}

// ============================================
// Correction Workflow Types (Phase 5)
// ============================================

export type CorrectionProblemType =
  | 'hallucination'
  | 'missing_info'
  | 'wrong_sentiment'
  | 'competitor_confusion';

export type CorrectionFixType = 'schema_org' | 'faq' | 'content' | 'wikipedia';

export type CorrectionWorkflowStatus =
  | 'suggested'
  | 'approved'
  | 'implemented'
  | 'verified'
  | 'dismissed';

export type CorrectionPriority = 'critical' | 'high' | 'medium' | 'low';
export type CorrectionEffort = 'low' | 'medium' | 'high';

export interface CorrectionSuggestion {
  fixType: CorrectionFixType;
  title: string;
  description: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  effort: CorrectionEffort;
  estimatedImpact: string;
}

export interface CorrectionGeneratorResult {
  problemType: CorrectionProblemType;
  problemDescription: string;
  affectedPlatforms: string[];
  suggestions: CorrectionSuggestion[];
  schemaOrgFix?: string;
  faqPageSuggestion?: string;
  contentRecommendation?: string;
  wikipediaEditSuggestion?: string;
}

export interface CorrectionWorkflowData {
  id?: string;
  brand360Id: string;
  insightId?: string;
  problemType: CorrectionProblemType;
  problemDescription: string;
  status: CorrectionWorkflowStatus;
  affectedPlatforms: string[];
  preFixScore?: number;
  postFixScore?: number;
  schemaOrgFix?: string;
  faqPageSuggestion?: string;
  contentRecommendation?: string;
  wikipediaEditSuggestion?: string;
  approvedAt?: Date;
  implementedAt?: Date;
  verifiedAt?: Date;
  notes?: string;
}

export interface CorrectionWorkflowListOptions {
  brand360Id?: string;
  status?: CorrectionWorkflowStatus;
  problemType?: CorrectionProblemType;
  limit?: number;
  offset?: number;
}

// ============================================
// Perception Insight Types (Phase 5)
// ============================================

export type InsightCategory =
  | 'hallucination'
  | 'accuracy'
  | 'missing_info'
  | 'visibility'
  | 'sentiment'
  | 'voice'
  | 'competitive'
  | 'competitor_confusion';

export type InsightStatus = 'open' | 'in_progress' | 'resolved' | 'dismissed';
export type InsightPriority = 'critical' | 'high' | 'medium' | 'low';

export interface PerceptionInsightInput {
  id: string;
  category: string;
  priority: string;
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  platforms: string[];
  affectedPromptCategories: string[];
}

export interface PerceptionInsightData {
  id?: string;
  brand360Id: string;
  category: InsightCategory;
  priority: InsightPriority;
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  effort?: CorrectionEffort;
  platforms: string[];
  affectedPromptCategories: string[];
  status: InsightStatus;
  affectedResultIds?: string[];
  dismissReason?: string;
  resolvedAt?: Date;
}

export interface InsightListOptions {
  brand360Id?: string;
  status?: InsightStatus;
  priority?: InsightPriority;
  category?: InsightCategory;
  limit?: number;
  offset?: number;
}

// ============================================
// Report Types (Phase 7)
// ============================================

export type ReportFormat = 'pdf' | 'csv' | 'json';
export type ReportStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface ReportSummary {
  overallScore: number;
  scoreChange?: number;
  quadrantPosition: QuadrantPosition;
  quadrantChange?: QuadrantPosition;
  platformBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  metricBreakdown: {
    faithfulness: number;
    shareOfVoice: number;
    sentiment: number;
    voiceAlignment: number;
    hallucinationRisk: number;
  };
  topInsights: PerceptionInsightData[];
  recentCorrections: CorrectionWorkflowData[];
  scanCount: number;
  lastScanAt?: Date;
}

export interface ReportExportRequest {
  brand360Id: string;
  format: ReportFormat;
  sections: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ReportExportResult {
  reportId: string;
  status: ReportStatus;
  format: ReportFormat;
  downloadUrl?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

// ============================================
// Scan Comparison Types (Phase 7)
// ============================================

export interface ScanComparison {
  scanId1: string;
  scanId2: string;
  scan1Date: Date;
  scan2Date: Date;
  overallScoreChange: number;
  quadrantChange?: {
    from: QuadrantPosition;
    to: QuadrantPosition;
  };
  platformChanges: Record<string, {
    before: number;
    after: number;
    change: number;
  }>;
  categoryChanges: Record<string, {
    before: number;
    after: number;
    change: number;
  }>;
  metricChanges: {
    faithfulness: { before: number; after: number; change: number };
    shareOfVoice: { before: number; after: number; change: number };
    sentiment: { before: number; after: number; change: number };
    voiceAlignment: { before: number; after: number; change: number };
    hallucinationRisk: { before: number; after: number; change: number };
  };
  newInsights: string[];
  resolvedInsights: string[];
  significantChanges: string[];
}

export interface ScanComparisonOptions {
  scanId1: string;
  scanId2: string;
  includeDetailedBreakdown?: boolean;
}

// ============================================
// Benchmark Types (Phase 7)
// ============================================

export interface IndustryBenchmark {
  industry: string;
  sampleSize: number;
  metrics: {
    overallScore: { p25: number; p50: number; p75: number; p90: number };
    faithfulness: { p25: number; p50: number; p75: number; p90: number };
    shareOfVoice: { p25: number; p50: number; p75: number; p90: number };
    sentiment: { p25: number; p50: number; p75: number; p90: number };
    voiceAlignment: { p25: number; p50: number; p75: number; p90: number };
    hallucinationRisk: { p25: number; p50: number; p75: number; p90: number };
  };
  quadrantDistribution: Record<QuadrantPosition, number>;
  topPerformers?: string[];
  updatedAt: Date;
}

// ============================================
// Product Extractor Agent Types
// ============================================

export interface ProductExtractorResult {
  products: ExtractedProduct[];
  categories: ProductCategory[];
  productPageUrls: string[];
  rawExtraction: object;
}

export interface ExtractedProduct {
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  category?: string;
  subcategory?: string;
  features: string[];
  benefits: string[];
  useCases: string[];
  targetAudience?: string;
  pricingModel?: ProductPricingModel;
  pricingTiers?: ProductPricingTier[];
  competitors?: string[];
  differentiators?: string[];
  sourceUrl?: string;
  confidence: number;
  schemaOrg?: object;
}

export type ProductPricingModel =
  | 'free'
  | 'freemium'
  | 'subscription'
  | 'one_time'
  | 'usage_based'
  | 'enterprise'
  | 'contact_sales';

export interface ProductPricingTier {
  name: string;
  price?: number;
  currency?: string;
  billingPeriod?: 'monthly' | 'annual' | 'one_time';
  features?: string[];
  isPopular?: boolean;
}

export interface ProductCategory {
  name: string;
  slug: string;
  description?: string;
  parentSlug?: string;
  level: number;
  productCount: number;
}

export interface ProductExtractorOptions {
  maxProducts?: number;
  extractPricing?: boolean;
  extractCompetitors?: boolean;
  onProgress?: AgentProgressCallback;
}

// ============================================
// Audience & Positioning Agent Types
// ============================================

export interface AudiencePositioningResult {
  targetAudience: ExtractedTargetAudience;
  personas: ExtractedPersona[];
  positioning: ExtractedPositioning;
  confidence: number;
}

export interface ExtractedTargetAudience {
  primaryMarket: string; // B2B, B2C, B2B2C, D2C
  geographicFocus: string[];
  targetIndustries: string[];
  targetCompanySize: string[];
  targetJobTitles: string[];
  targetDepartments: string[];
  ageRange?: { min: number; max: number };
  incomeLevel?: string;
}

export interface ExtractedPersona {
  name: string;
  title: string;
  archetype: string;
  demographics: {
    ageRange: string;
    location?: string;
    companySize?: string;
    industry?: string;
    seniorityLevel?: string;
  };
  psychographics: {
    personality: string;
    values: string[];
    motivations: string[];
    frustrations: string[];
  };
  painPoints: {
    title: string;
    description: string;
    severity: string;
    category: string;
  }[];
  goals: string[];
  buyingBehavior: {
    role: string;
    criteria: string[];
    timeline: string;
  };
  informationSources: string[];
  currentSolution?: string;
  objections: string[];
  keyMessages: string[];
  priority: number;
  confidence: number;
}

export interface ExtractedPositioning {
  positioningStatement: string;
  targetAudienceSummary?: string;
  categoryDefinition: string;
  primaryBenefit: string;
  competitiveAlternative: string;
  reasonToBelieve: string;
  categoryPosition: string;
  primaryDifferentiator: string;
  secondaryDifferentiators: string[];
  valuePropositions: {
    headline: string;
    description: string;
    type: string;
  }[];
  elevatorPitch: string;
  pricingPosition: string;
  beforeState: string;
  afterState: string;
  proofPoints: {
    type: string;
    title: string;
    metricValue?: string;
  }[];
}

export interface AudiencePositioningOptions {
  skipAudience?: boolean;
  skipPersonas?: boolean;
  skipPositioning?: boolean;
  maxPersonas?: number;
  onProgress?: AgentProgressCallback;
}
