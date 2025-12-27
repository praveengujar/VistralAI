// Mock AI Document Analysis Service
// This simulates AI extraction from documents for MVP
// Replace with real OpenAI/Anthropic API calls in production

import {
  Brand360Data,
  DocumentAnalysisResult,
  BrandIdentity,
  MarketPosition,
  CompetitorProfile,
  ProductDetail,
} from '@/types';

// Helper to generate random confidence scores
const generateConfidence = () => Math.floor(Math.random() * 20) + 80; // 80-100

// Helper to simulate processing delay
const simulateProcessing = async (ms: number = 2000) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Mock AI analysis of uploaded documents
 * In production, this would call OpenAI/Anthropic API to extract structured data
 *
 * @param documentId - ID of the uploaded document
 * @param brandId - ID of the brand
 * @param fileType - Type of the uploaded file
 * @param fileContent - Content of the file (for mock, we'll generate sample data)
 * @returns DocumentAnalysisResult with extracted data
 */
export async function analyzeDocument(
  documentId: string,
  brandId: string,
  fileType: 'pdf' | 'docx' | 'txt' | 'csv',
  fileContent?: string
): Promise<DocumentAnalysisResult> {
  // Simulate AI processing time
  await simulateProcessing(3000);

  // Mock extracted data based on file type
  const extractedData: any = {
    brandId,
  };

  // Simulate different extraction patterns based on file type
  if (fileType === 'pdf' || fileType === 'docx') {
    // Assume comprehensive brand document
    extractedData.identity = mockExtractIdentity();
    extractedData.marketPosition = mockExtractMarketPosition(brandId);
    extractedData.competitors = mockExtractCompetitors(brandId);
  } else if (fileType === 'csv') {
    // Assume product catalog
    extractedData.products = mockExtractProducts(brandId);
  } else {
    // txt file - partial data
    extractedData.identity = mockExtractIdentity();
  }

  const confidence = generateConfidence();

  return {
    documentId,
    extractedData,
    confidence,
    suggestions: generateSuggestions(extractedData),
    warnings: generateWarnings(extractedData, confidence),
  };
}

/**
 * Mock extraction of brand identity data
 */
function mockExtractIdentity(): Partial<BrandIdentity> {
  return {
    mission: 'To revolutionize the industry through innovation and customer-first approach.',
    vision: 'Become the market leader in our category by 2030.',
    values: ['Innovation', 'Integrity', 'Customer Focus', 'Excellence'],
    brandStory: 'Founded with a passion for solving real customer problems, we have grown from a startup to a recognized brand.',
    uniqueSellingPoints: [
      'Industry-leading technology',
      '24/7 customer support',
      'Money-back guarantee',
      'Award-winning design',
    ],
    brandVoice: {
      tone: ['Professional', 'Friendly', 'Innovative'],
      keywords: ['quality', 'innovation', 'reliable', 'customer-first'],
      avoidWords: ['cheap', 'basic', 'generic'],
    },
    brandPersonality: 'Professional yet approachable, innovative yet reliable.',
    tagline: 'Innovation Made Simple',
  };
}

/**
 * Mock extraction of market position data
 */
function mockExtractMarketPosition(brandId: string): Partial<MarketPosition> {
  return {
    brandId,
    targetAudiences: [
      {
        id: `ta-${Date.now()}`,
        name: 'Tech-savvy Professionals',
        demographics: {
          ageRange: '28-45',
          gender: 'All',
          income: '$75,000-$150,000',
          location: ['United States', 'United Kingdom', 'Canada'],
          occupation: ['Tech Professionals', 'Business Executives', 'Entrepreneurs'],
        },
        psychographics: {
          interests: ['Technology', 'Innovation', 'Productivity', 'Professional Development'],
          painPoints: ['Time management', 'Efficiency', 'Cost optimization'],
          goals: ['Career advancement', 'Work-life balance', 'Staying current with technology'],
          behaviors: ['Early adopters', 'Research extensively', 'Value quality over price'],
        },
        isPrimary: true,
      },
    ],
    marketSegment: 'Premium',
    geographicMarkets: ['North America', 'Europe', 'Asia Pacific'],
    industryVerticals: ['Technology', 'Professional Services', 'E-commerce'],
    positioning: 'Premium solution for professionals who value quality and innovation.',
    pricingStrategy: 'premium',
  };
}

/**
 * Mock extraction of competitor data
 */
function mockExtractCompetitors(brandId: string): CompetitorProfile[] {
  return [
    {
      id: `comp-${Date.now()}-1`,
      brandId,
      name: 'CompetitorX',
      domain: 'competitorx.com',
      isPrimary: true,
      strengths: ['Market leader', 'Strong brand recognition', 'Wide distribution'],
      weaknesses: ['High prices', 'Poor customer service', 'Outdated technology'],
      marketShare: 18.5,
      pricingPosition: 'higher',
      differentiators: [
        'Better customer support',
        'More modern technology',
        'Flexible pricing options',
      ],
      targetAudienceOverlap: 70,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: `comp-${Date.now()}-2`,
      brandId,
      name: 'CompetitorY',
      domain: 'competitory.com',
      isPrimary: false,
      strengths: ['Low prices', 'Fast delivery', 'Simple interface'],
      weaknesses: ['Limited features', 'Basic support', 'Lower quality'],
      marketShare: 8.2,
      pricingPosition: 'lower',
      differentiators: [
        'More comprehensive features',
        'Better quality',
        'Professional support',
      ],
      targetAudienceOverlap: 45,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}

/**
 * Mock extraction of product data
 */
function mockExtractProducts(brandId: string): ProductDetail[] {
  return [
    {
      id: `prod-${Date.now()}-1`,
      brandId,
      name: 'Professional Suite',
      sku: 'PRO-SUITE-001',
      category: 'Software',
      subcategory: 'Productivity Tools',
      description: 'Comprehensive professional productivity suite with advanced features for teams and individuals.',
      shortDescription: 'All-in-one productivity solution',
      features: [
        'Cloud-based collaboration',
        'Real-time synchronization',
        'Advanced analytics',
        'Custom integrations',
        'Priority support',
      ],
      benefits: [
        'Increase team productivity by 40%',
        'Save 10+ hours per week',
        'Seamless collaboration anywhere',
        'Data-driven decision making',
      ],
      useCases: [
        'Team project management',
        'Client collaboration',
        'Document management',
        'Workflow automation',
      ],
      targetAudience: ['Tech-savvy Professionals'],
      pricing: {
        currency: 'USD',
        amount: 49.99,
        billingPeriod: 'monthly',
      },
      url: 'https://example.com/products/professional-suite',
      imageUrls: [],
      specifications: {
        'Users': 'Up to 25',
        'Storage': '1TB',
        'Support': '24/7',
        'Integrations': '100+',
      },
      awards: [],
      certifications: ['ISO 27001', 'SOC 2'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}

/**
 * Generate suggestions based on extracted data
 */
function generateSuggestions(extractedData: Partial<Brand360Data>): string[] {
  const suggestions: string[] = [];

  if (extractedData.identity && !extractedData.identity.foundedYear) {
    suggestions.push('Consider adding your founding year to strengthen brand credibility');
  }

  if (extractedData.marketPosition && extractedData.marketPosition.targetAudiences?.length === 1) {
    suggestions.push('Adding secondary target audiences could help expand market reach');
  }

  if (extractedData.competitors && extractedData.competitors.length < 3) {
    suggestions.push('Consider adding more competitors for comprehensive market analysis');
  }

  if (extractedData.products && extractedData.products.length > 0) {
    const productsWithoutImages = extractedData.products.filter(p => !p.imageUrls || p.imageUrls.length === 0);
    if (productsWithoutImages.length > 0) {
      suggestions.push(`${productsWithoutImages.length} product(s) are missing images`);
    }
  }

  if (suggestions.length === 0) {
    suggestions.push('Great! Your profile looks comprehensive');
  }

  return suggestions;
}

/**
 * Generate warnings based on extracted data quality
 */
function generateWarnings(extractedData: Partial<Brand360Data>, confidence: number): string[] {
  const warnings: string[] = [];

  if (confidence < 85) {
    warnings.push('Some extracted data may require manual verification due to lower confidence score');
  }

  if (extractedData.identity && !extractedData.identity.mission) {
    warnings.push('Mission statement was not found in the document');
  }

  if (extractedData.competitors) {
    const competitorsWithoutDomains = extractedData.competitors.filter(c => !c.domain);
    if (competitorsWithoutDomains.length > 0) {
      warnings.push('Some competitors are missing domain information');
    }
  }

  return warnings;
}

/**
 * Batch analyze multiple documents
 * @param documents Array of document metadata
 * @returns Array of analysis results
 */
export async function analyzeBatchDocuments(
  documents: Array<{ id: string; brandId: string; fileType: 'pdf' | 'docx' | 'txt' | 'csv' }>
): Promise<DocumentAnalysisResult[]> {
  const results: DocumentAnalysisResult[] = [];

  for (const doc of documents) {
    const result = await analyzeDocument(doc.id, doc.brandId, doc.fileType);
    results.push(result);
  }

  return results;
}

/**
 * Merge extracted data from multiple documents
 * Useful when user uploads multiple documents and we need to combine the data
 */
export function mergeExtractedData(results: DocumentAnalysisResult[]): Partial<Brand360Data> {
  const merged: Partial<Brand360Data> = {
    competitors: [],
    products: [],
    assets: [],
  };

  for (const result of results) {
    const { extractedData } = result;

    // Merge identity (take the most complete one)
    if (extractedData.identity) {
      if (!merged.identity || Object.keys(extractedData.identity).length > Object.keys(merged.identity).length) {
        merged.identity = extractedData.identity;
      }
    }

    // Merge market position (take the most complete one)
    if (extractedData.marketPosition) {
      if (!merged.marketPosition || Object.keys(extractedData.marketPosition).length > Object.keys(merged.marketPosition).length) {
        merged.marketPosition = extractedData.marketPosition;
      }
    }

    // Combine competitors (deduplicate by name)
    if (extractedData.competitors) {
      for (const competitor of extractedData.competitors) {
        if (!merged.competitors!.some(c => c.name === competitor.name)) {
          merged.competitors!.push(competitor);
        }
      }
    }

    // Combine products (deduplicate by SKU or name)
    if (extractedData.products) {
      for (const product of extractedData.products) {
        if (!merged.products!.some(p => p.sku === product.sku || p.name === product.name)) {
          merged.products!.push(product);
        }
      }
    }

    // Combine assets
    if (extractedData.assets) {
      merged.assets!.push(...extractedData.assets);
    }
  }

  return merged;
}
