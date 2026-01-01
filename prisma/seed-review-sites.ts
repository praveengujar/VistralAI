// Seed script for Review Website Integration
// Run with: npx ts-node prisma/seed-review-sites.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CategorySeed {
  name: string;
  slug: string;
  description: string;
  industryKeywords: string[];
  websites: WebsiteSeed[];
}

interface WebsiteSeed {
  name: string;
  slug: string;
  domain: string;
  reviewType: 'general' | 'expert' | 'user' | 'aggregate';
  audienceType: 'b2b' | 'b2c' | 'mixed';
  citationFormat: string;
  priority: number;
}

const categories: CategorySeed[] = [
  {
    name: 'B2B Software',
    slug: 'b2b-software',
    description: 'Business software, SaaS, and enterprise solutions',
    industryKeywords: ['saas', 'software', 'enterprise', 'b2b', 'cloud', 'tech'],
    websites: [
      {
        name: 'G2',
        slug: 'g2',
        domain: 'g2.com',
        reviewType: 'user',
        audienceType: 'b2b',
        citationFormat: 'According to G2 reviews, {brandName}',
        priority: 10,
      },
      {
        name: 'Capterra',
        slug: 'capterra',
        domain: 'capterra.com',
        reviewType: 'user',
        audienceType: 'b2b',
        citationFormat: 'Capterra users rate {brandName}',
        priority: 9,
      },
      {
        name: 'TrustRadius',
        slug: 'trustradius',
        domain: 'trustradius.com',
        reviewType: 'user',
        audienceType: 'b2b',
        citationFormat: 'TrustRadius reviewers say {brandName}',
        priority: 8,
      },
    ],
  },
  {
    name: 'Consumer Electronics',
    slug: 'consumer-electronics',
    description: 'Consumer tech products, gadgets, and electronics',
    industryKeywords: ['electronics', 'gadgets', 'smartphone', 'laptop', 'tablet', 'smartwatch', 'headphones', 'computer', 'iphone', 'macbook', 'ipad', 'airpods', 'wearables', 'consumer electronics'],
    websites: [
      {
        name: 'CNET',
        slug: 'cnet',
        domain: 'cnet.com',
        reviewType: 'expert',
        audienceType: 'b2c',
        citationFormat: 'CNET experts review {brandName}',
        priority: 10,
      },
      {
        name: 'TechRadar',
        slug: 'techradar',
        domain: 'techradar.com',
        reviewType: 'expert',
        audienceType: 'b2c',
        citationFormat: 'TechRadar rates {brandName}',
        priority: 9,
      },
      {
        name: 'Wirecutter',
        slug: 'wirecutter',
        domain: 'nytimes.com/wirecutter',
        reviewType: 'expert',
        audienceType: 'b2c',
        citationFormat: 'Wirecutter recommends {brandName}',
        priority: 8,
      },
    ],
  },
  {
    name: 'E-commerce & Retail',
    slug: 'ecommerce-retail',
    description: 'Online shopping, retail stores, and e-commerce platforms',
    industryKeywords: ['ecommerce', 'retail', 'shopping', 'online store', 'marketplace'],
    websites: [
      {
        name: 'Trustpilot',
        slug: 'trustpilot',
        domain: 'trustpilot.com',
        reviewType: 'user',
        audienceType: 'b2c',
        citationFormat: 'Trustpilot reviews show {brandName}',
        priority: 10,
      },
      {
        name: 'Consumer Reports',
        slug: 'consumer-reports',
        domain: 'consumerreports.org',
        reviewType: 'expert',
        audienceType: 'b2c',
        citationFormat: 'Consumer Reports rates {brandName}',
        priority: 9,
      },
      {
        name: 'Yelp',
        slug: 'yelp',
        domain: 'yelp.com',
        reviewType: 'user',
        audienceType: 'b2c',
        citationFormat: 'Yelp users rate {brandName}',
        priority: 7,
      },
    ],
  },
  {
    name: 'Financial Services',
    slug: 'financial-services',
    description: 'Banks, insurance, investment, and fintech services',
    industryKeywords: ['finance', 'banking', 'insurance', 'investment', 'fintech', 'credit union', 'credit score', 'financial services', 'wealth management', 'mortgage'],
    websites: [
      {
        name: 'NerdWallet',
        slug: 'nerdwallet',
        domain: 'nerdwallet.com',
        reviewType: 'expert',
        audienceType: 'b2c',
        citationFormat: 'NerdWallet reviews {brandName}',
        priority: 10,
      },
      {
        name: 'Bankrate',
        slug: 'bankrate',
        domain: 'bankrate.com',
        reviewType: 'expert',
        audienceType: 'b2c',
        citationFormat: 'Bankrate rates {brandName}',
        priority: 9,
      },
      {
        name: 'Forbes Advisor',
        slug: 'forbes-advisor',
        domain: 'forbes.com/advisor',
        reviewType: 'expert',
        audienceType: 'b2c',
        citationFormat: 'Forbes Advisor recommends {brandName}',
        priority: 8,
      },
    ],
  },
  {
    name: 'Healthcare',
    slug: 'healthcare',
    description: 'Healthcare providers, medical services, and health tech',
    industryKeywords: ['healthcare', 'medical', 'health', 'hospital', 'doctor', 'clinic'],
    websites: [
      {
        name: 'Healthgrades',
        slug: 'healthgrades',
        domain: 'healthgrades.com',
        reviewType: 'user',
        audienceType: 'b2c',
        citationFormat: 'Healthgrades patients rate {brandName}',
        priority: 10,
      },
      {
        name: 'WebMD',
        slug: 'webmd',
        domain: 'webmd.com',
        reviewType: 'expert',
        audienceType: 'b2c',
        citationFormat: 'WebMD features {brandName}',
        priority: 9,
      },
      {
        name: 'Vitals',
        slug: 'vitals',
        domain: 'vitals.com',
        reviewType: 'user',
        audienceType: 'b2c',
        citationFormat: 'Vitals users review {brandName}',
        priority: 7,
      },
    ],
  },
  {
    name: 'Travel & Hospitality',
    slug: 'travel-hospitality',
    description: 'Hotels, airlines, travel agencies, and hospitality services',
    industryKeywords: ['travel', 'hotel', 'hospitality', 'airline', 'vacation', 'tourism'],
    websites: [
      {
        name: 'TripAdvisor',
        slug: 'tripadvisor',
        domain: 'tripadvisor.com',
        reviewType: 'user',
        audienceType: 'b2c',
        citationFormat: 'TripAdvisor travelers rate {brandName}',
        priority: 10,
      },
      {
        name: 'Booking.com',
        slug: 'booking',
        domain: 'booking.com',
        reviewType: 'user',
        audienceType: 'b2c',
        citationFormat: 'Booking.com guests review {brandName}',
        priority: 9,
      },
      {
        name: 'Expedia',
        slug: 'expedia',
        domain: 'expedia.com',
        reviewType: 'user',
        audienceType: 'b2c',
        citationFormat: 'Expedia travelers say {brandName}',
        priority: 8,
      },
    ],
  },
  {
    name: 'Restaurants & Food',
    slug: 'restaurants-food',
    description: 'Restaurants, food delivery, and culinary services',
    industryKeywords: ['restaurant', 'food', 'dining', 'delivery', 'culinary', 'cafe'],
    websites: [
      {
        name: 'Yelp',
        slug: 'yelp-food',
        domain: 'yelp.com',
        reviewType: 'user',
        audienceType: 'b2c',
        citationFormat: 'Yelp diners rate {brandName}',
        priority: 10,
      },
      {
        name: 'DoorDash',
        slug: 'doordash',
        domain: 'doordash.com',
        reviewType: 'user',
        audienceType: 'b2c',
        citationFormat: 'DoorDash customers review {brandName}',
        priority: 8,
      },
      {
        name: 'Zomato',
        slug: 'zomato',
        domain: 'zomato.com',
        reviewType: 'user',
        audienceType: 'b2c',
        citationFormat: 'Zomato users rate {brandName}',
        priority: 7,
      },
    ],
  },
  {
    name: 'Automotive',
    slug: 'automotive',
    description: 'Car manufacturers, dealerships, and automotive services',
    industryKeywords: ['automotive', 'car dealer', 'car dealership', 'automobile', 'car manufacturer', 'auto repair', 'car sales', 'car buying'],
    websites: [
      {
        name: 'Edmunds',
        slug: 'edmunds',
        domain: 'edmunds.com',
        reviewType: 'expert',
        audienceType: 'b2c',
        citationFormat: 'Edmunds experts rate {brandName}',
        priority: 10,
      },
      {
        name: 'Kelley Blue Book',
        slug: 'kbb',
        domain: 'kbb.com',
        reviewType: 'expert',
        audienceType: 'b2c',
        citationFormat: 'Kelley Blue Book values {brandName}',
        priority: 9,
      },
      {
        name: 'J.D. Power',
        slug: 'jd-power',
        domain: 'jdpower.com',
        reviewType: 'aggregate',
        audienceType: 'mixed',
        citationFormat: 'J.D. Power ranks {brandName}',
        priority: 9,
      },
    ],
  },
  {
    name: 'Home Services',
    slug: 'home-services',
    description: 'Home improvement, contractors, and maintenance services',
    industryKeywords: ['home', 'contractor', 'plumber', 'electrician', 'renovation', 'repair'],
    websites: [
      {
        name: 'Angi',
        slug: 'angi',
        domain: 'angi.com',
        reviewType: 'user',
        audienceType: 'b2c',
        citationFormat: 'Angi homeowners review {brandName}',
        priority: 10,
      },
      {
        name: 'HomeAdvisor',
        slug: 'homeadvisor',
        domain: 'homeadvisor.com',
        reviewType: 'user',
        audienceType: 'b2c',
        citationFormat: 'HomeAdvisor customers rate {brandName}',
        priority: 9,
      },
      {
        name: 'Thumbtack',
        slug: 'thumbtack',
        domain: 'thumbtack.com',
        reviewType: 'user',
        audienceType: 'b2c',
        citationFormat: 'Thumbtack users review {brandName}',
        priority: 8,
      },
    ],
  },
  {
    name: 'Real Estate',
    slug: 'real-estate',
    description: 'Real estate agencies, property listings, and housing services',
    industryKeywords: ['real estate', 'property', 'housing', 'realtor', 'home buying', 'rental'],
    websites: [
      {
        name: 'Zillow',
        slug: 'zillow',
        domain: 'zillow.com',
        reviewType: 'user',
        audienceType: 'b2c',
        citationFormat: 'Zillow users rate {brandName}',
        priority: 10,
      },
      {
        name: 'Realtor.com',
        slug: 'realtor',
        domain: 'realtor.com',
        reviewType: 'user',
        audienceType: 'b2c',
        citationFormat: 'Realtor.com lists {brandName}',
        priority: 9,
      },
      {
        name: 'Redfin',
        slug: 'redfin',
        domain: 'redfin.com',
        reviewType: 'user',
        audienceType: 'b2c',
        citationFormat: 'Redfin clients review {brandName}',
        priority: 8,
      },
    ],
  },
  {
    name: 'Legal Services',
    slug: 'legal-services',
    description: 'Law firms, attorneys, and legal service providers',
    industryKeywords: ['legal', 'law', 'attorney', 'lawyer', 'law firm', 'legal services'],
    websites: [
      {
        name: 'Avvo',
        slug: 'avvo',
        domain: 'avvo.com',
        reviewType: 'user',
        audienceType: 'b2c',
        citationFormat: 'Avvo clients rate {brandName}',
        priority: 10,
      },
      {
        name: 'Martindale-Hubbell',
        slug: 'martindale',
        domain: 'martindale.com',
        reviewType: 'expert',
        audienceType: 'b2b',
        citationFormat: 'Martindale-Hubbell rates {brandName}',
        priority: 9,
      },
      {
        name: 'Lawyers.com',
        slug: 'lawyers',
        domain: 'lawyers.com',
        reviewType: 'user',
        audienceType: 'b2c',
        citationFormat: 'Lawyers.com users review {brandName}',
        priority: 7,
      },
    ],
  },
  {
    name: 'Education',
    slug: 'education',
    description: 'Educational institutions, online courses, and training programs',
    industryKeywords: ['education', 'school', 'university', 'course', 'training', 'bootcamp'],
    websites: [
      {
        name: 'Niche',
        slug: 'niche',
        domain: 'niche.com',
        reviewType: 'aggregate',
        audienceType: 'b2c',
        citationFormat: 'Niche ranks {brandName}',
        priority: 10,
      },
      {
        name: 'Course Report',
        slug: 'course-report',
        domain: 'coursereport.com',
        reviewType: 'user',
        audienceType: 'b2c',
        citationFormat: 'Course Report students review {brandName}',
        priority: 9,
      },
      {
        name: 'SwitchUp',
        slug: 'switchup',
        domain: 'switchup.org',
        reviewType: 'user',
        audienceType: 'b2c',
        citationFormat: 'SwitchUp learners rate {brandName}',
        priority: 8,
      },
    ],
  },
  {
    name: 'Marketing & Agencies',
    slug: 'marketing-agencies',
    description: 'Marketing agencies, advertising firms, and creative services',
    industryKeywords: ['marketing', 'agency', 'advertising', 'creative', 'digital marketing', 'branding'],
    websites: [
      {
        name: 'Clutch',
        slug: 'clutch',
        domain: 'clutch.co',
        reviewType: 'user',
        audienceType: 'b2b',
        citationFormat: 'Clutch clients rate {brandName}',
        priority: 10,
      },
      {
        name: 'DesignRush',
        slug: 'designrush',
        domain: 'designrush.com',
        reviewType: 'aggregate',
        audienceType: 'b2b',
        citationFormat: 'DesignRush ranks {brandName}',
        priority: 8,
      },
      {
        name: 'UpCity',
        slug: 'upcity',
        domain: 'upcity.com',
        reviewType: 'user',
        audienceType: 'b2b',
        citationFormat: 'UpCity clients review {brandName}',
        priority: 7,
      },
    ],
  },
  {
    name: 'HR & Recruiting',
    slug: 'hr-recruiting',
    description: 'HR software, recruiting platforms, and employer reviews',
    industryKeywords: ['hr software', 'recruiting', 'hiring platform', 'employment agency', 'job board', 'job posting', 'talent acquisition', 'applicant tracking', 'staffing'],
    websites: [
      {
        name: 'Glassdoor',
        slug: 'glassdoor',
        domain: 'glassdoor.com',
        reviewType: 'user',
        audienceType: 'mixed',
        citationFormat: 'Glassdoor employees rate {brandName}',
        priority: 10,
      },
      {
        name: 'Indeed',
        slug: 'indeed',
        domain: 'indeed.com',
        reviewType: 'user',
        audienceType: 'mixed',
        citationFormat: 'Indeed reviewers say {brandName}',
        priority: 9,
      },
      {
        name: 'Comparably',
        slug: 'comparably',
        domain: 'comparably.com',
        reviewType: 'user',
        audienceType: 'b2b',
        citationFormat: 'Comparably employees review {brandName}',
        priority: 8,
      },
    ],
  },
  {
    name: 'Cybersecurity',
    slug: 'cybersecurity',
    description: 'Security software, IT security services, and cyber protection',
    industryKeywords: ['cybersecurity', 'security', 'infosec', 'cyber', 'protection', 'threat'],
    websites: [
      {
        name: 'Gartner',
        slug: 'gartner',
        domain: 'gartner.com',
        reviewType: 'expert',
        audienceType: 'b2b',
        citationFormat: 'Gartner analysts rate {brandName}',
        priority: 10,
      },
      {
        name: 'PeerSpot',
        slug: 'peerspot',
        domain: 'peerspot.com',
        reviewType: 'user',
        audienceType: 'b2b',
        citationFormat: 'PeerSpot IT pros review {brandName}',
        priority: 9,
      },
      {
        name: 'G2 Security',
        slug: 'g2-security',
        domain: 'g2.com',
        reviewType: 'user',
        audienceType: 'b2b',
        citationFormat: 'G2 security reviews show {brandName}',
        priority: 8,
      },
    ],
  },
];

async function seed() {
  console.log('Starting review website seed...');

  let totalCategories = 0;
  let totalWebsites = 0;

  for (const category of categories) {
    console.log(`Creating category: ${category.name}`);

    // Upsert category
    const createdCategory = await prisma.reviewCategory.upsert({
      where: { slug: category.slug },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        industryKeywords: category.industryKeywords,
      },
      update: {
        name: category.name,
        description: category.description,
        industryKeywords: category.industryKeywords,
      },
    });

    totalCategories++;

    // Create websites for this category
    for (const website of category.websites) {
      console.log(`  Creating website: ${website.name}`);

      await prisma.reviewWebsite.upsert({
        where: {
          categoryId_slug: {
            categoryId: createdCategory.id,
            slug: website.slug,
          },
        },
        create: {
          categoryId: createdCategory.id,
          name: website.name,
          slug: website.slug,
          domain: website.domain,
          reviewType: website.reviewType,
          audienceType: website.audienceType,
          citationFormat: website.citationFormat,
          priority: website.priority,
          isActive: true,
        },
        update: {
          name: website.name,
          domain: website.domain,
          reviewType: website.reviewType,
          audienceType: website.audienceType,
          citationFormat: website.citationFormat,
          priority: website.priority,
        },
      });

      totalWebsites++;
    }
  }

  console.log(`\nSeed complete!`);
  console.log(`Categories: ${totalCategories}`);
  console.log(`Websites: ${totalWebsites}`);
}

seed()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
