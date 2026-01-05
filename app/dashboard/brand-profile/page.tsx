'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProfileStrengthMeter from '@/components/brand-360/ProfileStrengthMeter';
import WebsiteAnalyzer from '@/components/brand-360/WebsiteAnalyzer';
import ProductCatalogConnector from '@/components/brand-360/ProductCatalogConnector';
import DocumentUpload from '@/components/brand-360/DocumentUpload';
import BrandStoryCanvas from '@/components/brand-360/BrandStoryCanvas';
import BrandOfferingsShowcase from '@/components/brand-360/BrandOfferingsShowcase';
import { ROUTES } from '@/lib/constants';
import { Brand360Data } from '@/types';
import {
  Building2,
  Target,
  Users,
  Package,
  Globe,
  ShoppingCart,
  FileText,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  X,
} from 'lucide-react';

// Helper to check if data is new Brand360Profile format
function isNewProfileFormat(data: any): boolean {
  return !!(data?.brandIdentityPrism || data?.brandArchetype || data?.brandVoiceProfile || data?.completionScore !== undefined);
}

// Calculate completion status from new Brand360Profile format
function calculateCompletionStatus(data: any) {
  if (!data) return { identity: 0, marketPosition: 0, competitors: 0, products: 0 };

  // For new format, calculate based on what's populated
  if (isNewProfileFormat(data)) {
    const identityScore = (
      (data.brandIdentityPrism ? 40 : 0) +
      (data.brandArchetype ? 30 : 0) +
      (data.brandVoiceProfile ? 30 : 0)
    );

    const marketScore = (
      (data.customerPersonas?.length > 0 ? 50 : 0) +
      (data.organizationSchema ? 50 : 0)
    );

    const competitorsScore = data.competitorGraph?.competitors?.length
      ? Math.min(data.competitorGraph.competitors.length * 25, 100)
      : 0;

    const productsScore = data.products?.length
      ? Math.min(data.products.length * 20, 100)
      : 0;

    return {
      identity: identityScore,
      marketPosition: marketScore,
      competitors: competitorsScore,
      products: productsScore,
    };
  }

  // Legacy format
  return data.completionStatus || { identity: 0, marketPosition: 0, competitors: 0, products: 0 };
}

// Get profile strength from either format
function getProfileStrength(data: any): number {
  if (!data) return 0;
  if (isNewProfileFormat(data)) {
    return data.completionScore || 0;
  }
  return data.profileStrength || 0;
}

// Union type for both legacy and new format
type BrandProfileData = Brand360Data | {
  id: string;
  organizationId: string;
  completionScore?: number;
  entityHealthScore?: number;
  brandIdentityPrism?: any;
  brandArchetype?: any;
  brandVoiceProfile?: any;
  organizationSchema?: any;
  entityHome?: any;
  competitorGraph?: { competitors: any[] };
  customerPersonas?: any[];
  products?: any[];
  claimLocker?: any;
  [key: string]: any;
};

export default function BrandProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [brand360Data, setBrand360Data] = useState<BrandProfileData | null>(null);
  const [brandId, setBrandId] = useState<string | null>(null);
  const [brandDomain, setBrandDomain] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<'website' | 'catalog' | 'documents' | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(ROUTES.LOGIN);
    }
  }, [status, router]);

  useEffect(() => {
    const fetchBrandProfile = async () => {
      if (status === 'authenticated' && session?.user?.id) {
        try {
          // First, try to get Brand360Profile via organization (from onboarding)
          const orgId = (session.user as any)?.organizationId;
          if (orgId) {
            try {
              const brand360Res = await fetch(`/api/brand-360?brandId=${orgId}`);
              if (brand360Res.ok) {
                const brand360Data = await brand360Res.json();
                if (brand360Data.data) {
                  setBrand360Data(brand360Data.data);
                  setBrandId(brand360Data.data.id);
                  setBrandDomain(brand360Data.data.entityHome?.canonicalUrl?.replace(/^https?:\/\//, '') || '');
                  setIsLoading(false);
                  return; // Exit early if we found Brand360 via org
                }
              }
            } catch (e) {
              console.error('Failed to fetch Brand360 profile via organization', e);
            }
          }

          // Fallback: try legacy BrandProfile lookup
          const brandProfileRes = await fetch(`/api/brand-profile?userId=${session.user.id}`);

          if (!brandProfileRes.ok) {
            if (brandProfileRes.status === 404) {
              console.log('No brand profile found yet - user needs to create one');
              setIsLoading(false);
              return;
            }
            throw new Error(`Failed to fetch brand profile: ${brandProfileRes.status}`);
          }

          const brandProfileData = await brandProfileRes.json();

          if (brandProfileData.profile) {
            const id = brandProfileData.profile.id;
            const domain = brandProfileData.profile.domain;
            setBrandId(id);
            setBrandDomain(domain);

            const res = await fetch(`/api/brand-360?brandId=${id}`);

            if (res.ok) {
              const data = await res.json();
              if (data.data) {
                setBrand360Data(data.data);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching brand 360 data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchBrandProfile();
  }, [status, session, (session?.user as any)?.organizationId]);

  const handleComplete = async () => {
    if (brandId) {
      console.log('[BrandProfilePage] handleComplete called, fetching fresh data for brandId:', brandId);
      const res = await fetch(`/api/brand-360?brandId=${brandId}`);
      const data = await res.json();
      console.log('[BrandProfilePage] Fresh data received:', {
        hasIdentity: !!data.data?.identity,
        mission: data.data?.identity?.mission?.substring(0, 50) || 'EMPTY',
        vision: data.data?.identity?.vision?.substring(0, 50) || 'EMPTY',
        profileStrength: data.data?.profileStrength,
      });
      if (data.data) {
        setBrand360Data(data.data);
        console.log('[BrandProfilePage] brand360Data state updated');
      }
    }
    setActiveModal(null);
  };

  if (status === 'loading' || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="spinner-lg text-primary-600 mx-auto"></div>
            <p className="mt-4 text-secondary-500">Loading Brand Profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-container py-8">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">Brand 360 Profile</h1>
          <p className="page-subtitle">
            Build a comprehensive knowledge base to improve AI visibility insights
          </p>
        </div>

        {/* No Brand Profile Message */}
        {!brandId && (
          <div className="card p-6 mb-8 border-primary-200 bg-primary-50">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-xl bg-primary-100">
                <AlertCircle className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-primary-900 mb-2">
                  Complete Your Onboarding First
                </h3>
                <p className="text-sm text-primary-700 mb-4">
                  Before you can build your Brand 360 profile, you need to complete the onboarding process
                  to set up your brand basics (name, domain, category, etc.).
                </p>
                <button
                  onClick={() => router.push(ROUTES.ONBOARDING)}
                  className="btn-primary btn-md group"
                >
                  Go to Onboarding
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Strength Overview */}
        {brandId && (
          <div className="card p-6 mb-8">
            <ProfileStrengthMeter
              overall={getProfileStrength(brand360Data)}
              pillars={calculateCompletionStatus(brand360Data)}
            />
          </div>
        )}

        {/* Build Your Profile - Three Options */}
        {brandId && (
          <div className="mb-8">
            <h2 className="section-title mb-4">Build Your Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Option 1: Analyze Website (PRIMARY) */}
              <div className="card-hover p-6 relative border-primary-500/30" style={{ backgroundColor: 'rgb(var(--primary) / 0.1)' }}>
                <div className="absolute top-4 right-4">
                  <span className="badge-primary">Recommended</span>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center mb-4 shadow-soft">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                  Analyze Website
                </h3>
                <p className="text-sm text-secondary-500 mb-4">
                  Automatically extract brand information from your website using AI
                </p>
                <ul className="text-xs text-secondary-600 space-y-1.5 mb-4">
                  <li className="flex items-center">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success-500 mr-2" />
                    Brand identity & values
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success-500 mr-2" />
                    Product catalog
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success-500 mr-2" />
                    Market positioning
                  </li>
                </ul>
                <button
                  onClick={() => setActiveModal('website')}
                  className="btn-primary btn-md w-full"
                >
                  <Sparkles className="h-4 w-4" />
                  Start Analysis
                </button>
              </div>

              {/* Option 2: Connect Catalog (SECONDARY) */}
              <div className="card-hover p-6">
                <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center mb-4">
                  <ShoppingCart className="h-6 w-6 text-success-600" />
                </div>
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                  Connect Catalog
                </h3>
                <p className="text-sm text-secondary-500 mb-4">
                  Import products from Shopify, CSV, or other platforms
                </p>
                <ul className="text-xs text-secondary-600 space-y-1.5 mb-4">
                  <li className="flex items-center">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success-500 mr-2" />
                    Shopify integration
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success-500 mr-2" />
                    CSV upload
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success-500 mr-2" />
                    Auto-sync products
                  </li>
                </ul>
                <button
                  onClick={() => setActiveModal('catalog')}
                  className="btn-secondary btn-md w-full"
                >
                  <Package className="h-4 w-4" />
                  Connect Catalog
                </button>
              </div>

              {/* Option 3: Upload Documents (ADDITIONAL) */}
              <div className="card-hover p-6">
                <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-accent-600" />
                </div>
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                  Upload Documents
                </h3>
                <p className="text-sm text-secondary-500 mb-4">
                  Add supplementary information from brand guidelines or PDFs
                </p>
                <ul className="text-xs text-secondary-600 space-y-1.5 mb-4">
                  <li className="flex items-center">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success-500 mr-2" />
                    Brand guidelines
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success-500 mr-2" />
                    Marketing docs
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success-500 mr-2" />
                    AI extraction
                  </li>
                </ul>
                <button
                  onClick={() => setActiveModal('documents')}
                  className="btn-secondary btn-md w-full"
                >
                  <FileText className="h-4 w-4" />
                  Upload Files
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        <AnimatePresence>
          {activeModal && brandId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setActiveModal(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-secondary-900">
                      {activeModal === 'website' && 'Analyze Your Website'}
                      {activeModal === 'catalog' && 'Product Catalog Connector'}
                      {activeModal === 'documents' && 'Upload Documents'}
                    </h2>
                    <button
                      onClick={() => setActiveModal(null)}
                      className="p-2 rounded-lg text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  {activeModal === 'website' && (
                    <WebsiteAnalyzer
                      brandId={brandId}
                      organizationId={brandId}
                      userId={session?.user?.id}
                      websiteUrl={`https://${brandDomain}`}
                      onComplete={handleComplete}
                      onOrganizationCreated={(orgId) => {
                        setBrandId(orgId);
                      }}
                    />
                  )}
                  {activeModal === 'catalog' && (
                    <ProductCatalogConnector brandId={brandId} onComplete={handleComplete} />
                  )}
                  {activeModal === 'documents' && (
                    <DocumentUpload brandId={brandId} onComplete={handleComplete} />
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Brand Story Canvas */}
        {brandId && (
          <div className="mb-8">
            <BrandStoryCanvas
              brandData={brand360Data}
              onUpdate={(section, data) => console.log('Update', section, data)}
            />
          </div>
        )}

        {/* Brand Offerings Showcase */}
        {brandId && brand360Data?.products && brand360Data.products.length > 0 && (
          <div className="mb-8">
            <BrandOfferingsShowcase
              products={brand360Data.products.map((p: any) => ({
                id: p.id,
                name: p.name,
                category: p.category,
                brandStory: p.description,
                aiStory: p.features?.join(', ') || '',
                mentions: 0,
                accuracy: 0,
                trend: 'stable',
                price: p.price || p.pricing?.amount || 0
              }))}
            />
          </div>
        )}

        {/* Quick Stats */}
        {brandId && brand360Data && (
          <div className="card p-6">
            <h2 className="section-title mb-6">Profile Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: 'Brand Values',
                  value: isNewProfileFormat(brand360Data)
                    ? ((brand360Data as any).brandIdentityPrism?.cultureValues?.length || 0)
                    : ((brand360Data as any).identity?.values?.length || 0),
                  icon: Building2
                },
                {
                  label: 'Target Audiences',
                  value: isNewProfileFormat(brand360Data)
                    ? ((brand360Data as any).customerPersonas?.length || 0)
                    : ((brand360Data as any).marketPosition?.targetAudiences?.length || 0),
                  icon: Target
                },
                {
                  label: 'Competitors',
                  value: isNewProfileFormat(brand360Data)
                    ? ((brand360Data as any).competitorGraph?.competitors?.length || 0)
                    : ((brand360Data as any).competitors?.length || 0),
                  icon: Users
                },
                { label: 'Products', value: (brand360Data as any).products?.length || 0, icon: Package },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="text-center p-4 rounded-xl"
                    style={{ backgroundColor: 'rgb(var(--background-secondary))' }}
                  >
                    <div
                      className="inline-flex items-center justify-center w-10 h-10 rounded-lg shadow-sm mb-3"
                      style={{ backgroundColor: 'rgb(var(--surface))' }}
                    >
                      <Icon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="text-2xl font-bold" style={{ color: 'rgb(var(--foreground))' }}>{stat.value}</div>
                    <div className="text-sm mt-1" style={{ color: 'rgb(var(--foreground-muted))' }}>{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
