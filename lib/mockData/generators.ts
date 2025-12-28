import {
  AIVisibilityMetrics,
  AICrawlerEvent,
  OpportunityInsight,
  Alert,
  CompetitorComparison,
  TimeSeriesDataPoint,
} from '@/types';

// Helper to generate random numbers
const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Generate time series data for charts
export const generateTimeSeriesData = (days: number = 30): TimeSeriesDataPoint[] => {
  const data: TimeSeriesDataPoint[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    data.push({
      timestamp: date,
      value: random(65, 85) + Math.random() * 5, // 65-90 range with some variance
    });
  }

  return data;
};

// Generate AI Visibility Metrics
export const generateAIVisibilityMetrics = (brandId: string): AIVisibilityMetrics => {
  return {
    brandId,
    timestamp: new Date(),
    visibilityScore: random(70, 85),
    factualAccuracy: random(80, 95),
    sentiment: ['positive', 'neutral'][random(0, 1)] as any,
    hallucinations: [
      {
        engine: 'OpenAI',
        description: 'Incorrect product pricing mentioned',
        severity: 'medium',
      },
      {
        engine: 'Gemini',
        description: 'Outdated company information',
        severity: 'low',
      },
    ],
    missingInfo: ['Product specifications', 'Shipping information', 'Return policy'],
    competitorSOV: {
      'Competitor A': 35,
      'Competitor B': 28,
      'Competitor C': 22,
      'Your Brand': 15,
    },
  };
};

// Generate AI Crawler Events
export const generateCrawlerEvents = (brandId: string, count: number = 100): AICrawlerEvent[] => {
  const crawlers: ('OpenAI' | 'Gemini' | 'Claude' | 'Perplexity' | 'Unknown')[] = [
    'OpenAI',
    'Gemini',
    'Claude',
    'Perplexity',
    'Unknown',
  ];
  const contentTypes: ('product' | 'blog' | 'category' | 'other')[] = [
    'product',
    'blog',
    'category',
    'other',
  ];

  const events: AICrawlerEvent[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const date = new Date(now);
    date.setHours(date.getHours() - random(0, 720)); // Last 30 days

    events.push({
      brandId,
      timestamp: date,
      crawlerType: crawlers[random(0, crawlers.length - 1)],
      pageUrl: `/page-${random(1, 50)}`,
      contentType: contentTypes[random(0, contentTypes.length - 1)],
      crawlDepth: random(1, 5),
    });
  }

  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

// Generate Opportunity Insights
export const generateOpportunities = (count: number = 10): OpportunityInsight[] => {
  const opportunities: OpportunityInsight[] = [
    {
      id: '1',
      title: 'Add product schema markup',
      description: '23 product pages are missing structured data that AI models rely on',
      priority: 'high',
      category: 'Technical',
      impact: 85,
      completed: false,
    },
    {
      id: '2',
      title: 'Update brand description',
      description: 'Your brand description is outdated across multiple pages',
      priority: 'medium',
      category: 'Content',
      impact: 65,
      completed: false,
    },
    {
      id: '3',
      title: 'Optimize for category queries',
      description: 'Competitors are dominating "outdoor equipment" searches',
      priority: 'high',
      category: 'Content',
      impact: 90,
      completed: false,
    },
    {
      id: '4',
      title: 'Add missing product attributes',
      description: '15 products are missing key attributes like dimensions and materials',
      priority: 'medium',
      category: 'Product',
      impact: 70,
      completed: false,
    },
    {
      id: '5',
      title: 'Create FAQ page',
      description: 'AI models frequently reference competitor FAQs but not yours',
      priority: 'low',
      category: 'Content',
      impact: 45,
      completed: false,
    },
  ];

  return opportunities.slice(0, count);
};

// Generate Alerts
export const generateAlerts = (brandId: string, count: number = 5): Alert[] => {
  const alerts: Alert[] = [
    {
      id: '1',
      brandId,
      type: 'competitor_spike',
      title: 'Competitor A visibility increased 25%',
      description:
        'Competitor A has seen a significant increase in AI mentions over the past week',
      severity: 'high',
      status: 'active',
      createdAt: new Date(Date.now() - 86400000 * 2),
    },
    {
      id: '2',
      brandId,
      type: 'hallucination_detected',
      title: 'New hallucination detected',
      description: 'ChatGPT is providing incorrect pricing information for your products',
      severity: 'critical',
      status: 'active',
      createdAt: new Date(Date.now() - 86400000 * 1),
    },
    {
      id: '3',
      brandId,
      type: 'high_crawler_activity',
      title: 'Increased crawler activity',
      description: 'OpenAI crawler has visited 45% more pages than usual this week',
      severity: 'low',
      status: 'resolved',
      createdAt: new Date(Date.now() - 86400000 * 5),
      resolvedAt: new Date(Date.now() - 86400000 * 3),
    },
  ];

  return alerts.slice(0, count);
};

// Generate Competitor Comparison Data
export const generateCompetitorComparison = (): CompetitorComparison[] => {
  return [
    {
      name: 'Your Brand',
      shareOfVoice: 15,
      mentions: 234,
      sentiment: 'positive',
    },
    {
      name: 'Competitor A',
      shareOfVoice: 35,
      mentions: 567,
      sentiment: 'positive',
    },
    {
      name: 'Competitor B',
      shareOfVoice: 28,
      mentions: 445,
      sentiment: 'neutral',
    },
    {
      name: 'Competitor C',
      shareOfVoice: 22,
      mentions: 334,
      sentiment: 'positive',
    },
  ];
};

// Crawler Activity by Type
export const generateCrawlerActivityByType = () => {
  return [
    { name: 'OpenAI', count: 145, percentage: 42 },
    { name: 'Gemini', count: 98, percentage: 28 },
    { name: 'Claude', count: 65, percentage: 19 },
    { name: 'Perplexity', count: 38, percentage: 11 },
  ];
};
