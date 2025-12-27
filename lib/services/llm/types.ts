export interface ConfidenceField<T> {
    statement: T;
    confidence: number;
    isExplicit: boolean;
}

export interface BrandIdentityExtraction {
    brandName: string;
    subBrands: string[];
    tagline: string | null;
    vision: ConfidenceField<string>;
    mission: ConfidenceField<string>;
    coreValues: Array<{ value: string; description: string }>;
    uniqueValueProposition: string;
    brandPromise: string;
    industry: string;
    category: string;
    subCategory: string | null;
    foundingYear: string | null;
    foundingStory: string | null;
    positioningStatement: string;
    sectionConfidence: number;
}

export interface BrandVoiceExtraction {
    primaryArchetype: string;
    secondaryArchetype: string | null;
    personalityTraits: string[];
    voiceAttributes: {
        formality: 'formal' | 'balanced' | 'casual';
        tone: 'serious' | 'balanced' | 'playful';
        complexity: 'technical' | 'balanced' | 'accessible';
        energy: 'reserved' | 'balanced' | 'enthusiastic';
    };
    primaryTone: string;
    secondaryTones: string[];
    signaturePhrases: string[];
    languageToAvoid: string[];
    sectionConfidence: number;
}

export interface AudienceSegment {
    name: string;
    description: string;
    demographics: {
        ageRange: string;
        gender: string;
        income: string;
        location: string;
        occupation: string;
    };
    psychographics: {
        values: string[];
        lifestyle: string;
        interests: string[];
    };
    painPoints: string[];
    motivations: string[];
    decisionFactors: string[];
}

export interface TargetAudienceExtraction {
    primarySegment: AudienceSegment;
    secondarySegments: Array<{ name: string; description: string }>;
    sectionConfidence: number;
}

export interface ProductPortfolioExtraction {
    portfolioType: 'products' | 'services' | 'hybrid';
    totalCategories: number;
    categories: Array<{
        name: string;
        description: string;
        productCount: number | null;
    }>;
    heroOfferings: Array<{
        name: string;
        description: string;
        keyBenefits: string[];
    }>;
    pricePositioning: 'luxury' | 'premium' | 'mid-market' | 'value';
    qualitySignals: string[];
    purchaseChannels: string[];
    sectionConfidence: number;
}

export interface CompetitorExtraction {
    name: string;
    type: 'direct' | 'indirect' | 'aspirational';
    overlapArea: string;
    ourAdvantage: string;
    theirAdvantage: string;
    confidence: number;
}

export interface CompetitiveLandscapeExtraction {
    marketPosition: 'leader' | 'challenger' | 'follower' | 'niche';
    competitors: CompetitorExtraction[];
    competitiveAdvantages: string[];
    marketOpportunities: string[];
    sectionConfidence: number;
}

export interface AIGuidanceExtraction {
    brandSummary: string;
    whenToRecommend: string[];
    keySellingPoints: string[];
    accurateDescriptors: string[];
    inaccurateDescriptors: string[];
    competitorComparisons: Array<{
        competitor: string;
        ourStrength: string;
        theirStrength: string;
    }>;
    sampleRecommendation: string;
}

export interface ProfileMetadata {
    overallConfidence: number;
    strongestSections: string[];
    weakestSections: string[];
    criticalGaps: string[];
    recommendedActions: string[];
    dataQuality: 'high' | 'medium' | 'low';
}

export interface Brand360Profile {
    profileVersion: string;
    generatedAt: string;
    sourceUrl: string;

    brandIdentity: BrandIdentityExtraction;
    brandVoice: BrandVoiceExtraction;
    targetAudience: TargetAudienceExtraction;
    productPortfolio: ProductPortfolioExtraction;
    competitiveLandscape: CompetitiveLandscapeExtraction;
    aiGuidance: AIGuidanceExtraction;
    profileMetadata: ProfileMetadata;
}
