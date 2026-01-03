// Seed script for pricing tiers
// Run with: npx ts-node prisma/seed-pricing.ts

import { PrismaClient, Prisma } from '@prisma/client';

// Inline pricing tiers for seeding (to avoid module resolution issues with ts-node)
const PRICING_TIERS = [
  {
    id: 'monitor',
    name: 'monitor',
    displayName: 'Monitor',
    description: 'Perfect for businesses starting their AI visibility journey',
    tagline: 'Start your AI visibility journey',
    priceMonthly: 99,
    priceYearly: 990,
    brandLimit: 1,
    teamSeatLimit: 1,
    competitorLimitPerBrand: 3,
    customTopicsPerBrand: 5,
    updateFrequency: 'monthly',
    platforms: ['ChatGPT', 'Claude', 'Gemini'],
    isPopular: false,
    features: [
      { name: 'AI Perception Tracking', included: true },
      { name: 'Brand Visibility Score', included: true },
      { name: 'Monthly AI Snapshot', included: true },
      { name: 'Basic Competitor Comparison', included: true, limit: '3 competitors' },
      { name: 'Email Reports', included: true },
      { name: 'Custom Topics', included: true, limit: '5 topics' },
    ],
  },
  {
    id: 'growth',
    name: 'growth',
    displayName: 'Growth',
    description: 'For growing businesses serious about AI optimization',
    tagline: 'Optimize your AI presence',
    priceMonthly: 299,
    priceYearly: 2990,
    brandLimit: 3,
    teamSeatLimit: 5,
    competitorLimitPerBrand: 10,
    customTopicsPerBrand: 20,
    updateFrequency: 'weekly',
    platforms: ['ChatGPT', 'Claude', 'Gemini', 'Perplexity', 'Copilot'],
    isPopular: true,
    features: [
      { name: 'AI Perception Tracking', included: true },
      { name: 'Brand Visibility Score', included: true },
      { name: 'Weekly AI Snapshots', included: true },
      { name: 'Advanced Competitor Analysis', included: true, limit: '10 competitors' },
      { name: 'Custom AI Prompts', included: true },
      { name: 'Citation Tracking', included: true },
      { name: 'Custom Topics', included: true, limit: '20 topics' },
      { name: 'Team Collaboration', included: true, limit: '5 seats' },
      { name: 'API Access', included: true },
    ],
  },
  {
    id: 'dominance',
    name: 'dominance',
    displayName: 'Dominance',
    description: 'Enterprise-grade AI visibility for market leaders',
    tagline: 'Dominate AI conversations',
    priceMonthly: 999,
    priceYearly: 9990,
    brandLimit: 10,
    teamSeatLimit: -1,
    competitorLimitPerBrand: 25,
    customTopicsPerBrand: 100,
    updateFrequency: 'daily',
    platforms: ['ChatGPT', 'Claude', 'Gemini', 'Perplexity', 'Copilot', 'SearchGPT', 'Meta AI'],
    isPopular: false,
    features: [
      { name: 'AI Perception Tracking', included: true },
      { name: 'Brand Visibility Score', included: true },
      { name: 'Daily AI Monitoring', included: true },
      { name: 'Unlimited Competitor Analysis', included: true },
      { name: 'Custom AI Prompts', included: true },
      { name: 'Citation Tracking', included: true },
      { name: 'Custom Topics', included: true, limit: '100 topics' },
      { name: 'Unlimited Team Seats', included: true },
      { name: 'Full API Access', included: true },
      { name: 'Dedicated Account Manager', included: true },
      { name: 'Custom Integrations', included: true },
      { name: 'White-label Reports', included: true },
    ],
  },
];

const prisma = new PrismaClient();

async function seedPricing() {
  console.log('Seeding pricing tiers...');

  for (const tier of PRICING_TIERS) {
    const existingTier = await prisma.pricingTier.findUnique({
      where: { name: tier.name },
    });

    if (existingTier) {
      // Update existing tier
      await prisma.pricingTier.update({
        where: { name: tier.name },
        data: {
          displayName: tier.displayName,
          description: tier.description,
          tagline: tier.tagline,
          priceMonthly: tier.priceMonthly * 100, // Convert to cents
          priceYearly: tier.priceYearly * 100,
          brandLimit: tier.brandLimit,
          teamSeatLimit: tier.teamSeatLimit,
          competitorLimitPerBrand: tier.competitorLimitPerBrand,
          customTopicsPerBrand: tier.customTopicsPerBrand,
          updateFrequency: tier.updateFrequency,
          features: tier.features as unknown as Prisma.JsonArray,
          platformsCovered: tier.platforms,
          isPopular: tier.isPopular,
          sortOrder: PRICING_TIERS.indexOf(tier),
        },
      });
      console.log(`  ✓ Updated ${tier.displayName} tier`);
    } else {
      // Create new tier
      await prisma.pricingTier.create({
        data: {
          name: tier.name,
          displayName: tier.displayName,
          description: tier.description,
          tagline: tier.tagline,
          priceMonthly: tier.priceMonthly * 100, // Convert to cents
          priceYearly: tier.priceYearly * 100,
          currency: 'USD',
          brandLimit: tier.brandLimit,
          teamSeatLimit: tier.teamSeatLimit,
          competitorLimitPerBrand: tier.competitorLimitPerBrand,
          customTopicsPerBrand: tier.customTopicsPerBrand,
          updateFrequency: tier.updateFrequency,
          features: tier.features as unknown as Prisma.JsonArray,
          platformsCovered: tier.platforms,
          isPopular: tier.isPopular,
          sortOrder: PRICING_TIERS.indexOf(tier),
          isActive: true,
        },
      });
      console.log(`  ✓ Created ${tier.displayName} tier`);
    }
  }

  console.log('\nPricing tiers seeded successfully!');
}

seedPricing()
  .catch((error) => {
    console.error('Error seeding pricing tiers:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
