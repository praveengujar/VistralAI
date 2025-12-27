'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Check } from 'lucide-react';
import { NEW_ONBOARDING_STEPS, ROUTES } from '@/lib/constants';
import { getJobQueue, OnboardingJob } from '@/lib/services/queue/JobQueue';
import UrlAnalyzer from './UrlAnalyzer';
import ProductIngestionTabs from './ProductIngestionTabs';
import ProfileReviewCards, {
  IdentityCardData,
  CompetitorCardData,
  ProductCardData,
} from './ProfileReviewCards';

interface OnboardingState {
  websiteUrl: string;
  brandName: string;
  domain: string;
  category: string;
  descriptor: string;

  // AI-generated data
  brandIdentity?: IdentityCardData;
  competitors?: CompetitorCardData[];
  products?: ProductCardData[];

  // Job tracking
  jobId?: string;
  jobStatus: 'idle' | 'analyzing' | 'completed' | 'error';
  jobError?: string;
}

export default function NewOnboardingWizard() {
  const router = useRouter();
  const { data: session } = useSession();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [jobProgress, setJobProgress] = useState(0);
  const [jobCurrentStep, setJobCurrentStep] = useState('');

  const [state, setState] = useState<OnboardingState>({
    websiteUrl: '',
    brandName: '',
    domain: '',
    category: '',
    descriptor: '',
    jobStatus: 'idle',
  });

  // Poll job status
  useEffect(() => {
    if (!state.jobId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/onboarding/status?jobId=${state.jobId}`,
        );
        const job = await response.json();

        setJobProgress(job.progress || 0);
        setJobCurrentStep(job.currentStep || '');

        if (job.status === 'completed' && job.result) {
          setState((prev) => ({
            ...prev,
            jobStatus: 'completed',
            brandName: prev.websiteUrl.split('.')[0].toUpperCase(),
            domain: prev.websiteUrl,
            brandIdentity: job.result.brandIdentity,
            competitors: job.result.competitors?.map((c: any) => ({
              name: c.name,
              competitionType: c.isPrimary ? 'direct' : 'indirect',
              rationale: c.differentiators?.[0] || '',
              confidence: 0.8,
            })) || [],
            products: job.result.products?.map((p: any) => ({
              name: p.name,
              description: p.description,
              category: p.category,
              features: p.features,
            })) || [],
          }));
          setIsLoading(false);
          clearInterval(pollInterval);
          // Auto-advance to next step
          setTimeout(() => setCurrentStep(3), 500);
        } else if (job.status === 'failed') {
          setState((prev) => ({
            ...prev,
            jobStatus: 'error',
            jobError: job.error || 'Analysis failed',
          }));
          setIsLoading(false);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Error polling job status:', error);
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [state.jobId]);

  const handleAnalysisStart = async (url: string) => {
    if (!session?.user?.id) {
      alert('You must be logged in');
      return;
    }

    setIsLoading(true);
    setState((prev) => ({
      ...prev,
      websiteUrl: url,
      jobStatus: 'analyzing',
      jobError: undefined,
    }));

    try {
      const response = await fetch('/api/onboarding/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteUrl: url,
          userId: session.user.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start analysis');
      }

      const data = await response.json();
      setState((prev) => ({
        ...prev,
        jobId: data.jobId,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setState((prev) => ({
        ...prev,
        jobStatus: 'error',
        jobError: errorMessage,
      }));
      setIsLoading(false);
    }
  };

  const handleProductsSelected = (products: any[]) => {
    setState((prev) => ({
      ...prev,
      products: products.map((p) => ({
        name: p.name,
        description: p.description,
        category: p.category,
        features: p.features,
      })),
    }));
  };

  const handleIdentityChange = (data: IdentityCardData) => {
    setState((prev) => ({
      ...prev,
      brandIdentity: data,
    }));
  };

  const handleCompetitorsChange = (data: CompetitorCardData[]) => {
    setState((prev) => ({
      ...prev,
      competitors: data,
    }));
  };

  const handleProductsChange = (data: ProductCardData[]) => {
    setState((prev) => ({
      ...prev,
      products: data,
    }));
  };

  const handleSubmit = async () => {
    if (!session?.user?.id) {
      alert('You must be logged in');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/onboarding/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          brandName: state.brandName || state.websiteUrl.split('.')[0],
          domain: state.domain || state.websiteUrl,
          descriptor: state.descriptor,
          category: state.category,
          brandIdentity: state.brandIdentity,
          competitors: state.competitors,
          products: state.products,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create brand profile');
      }

      const data = await response.json();
      router.push(ROUTES.DASHBOARD);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setState((prev) => ({
        ...prev,
        jobStatus: 'error',
        jobError: errorMessage,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < NEW_ONBOARDING_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 1:
        return state.jobStatus === 'completed';
      case 2:
        return true; // Products are optional
      case 3:
        return !!state.brandIdentity; // Must have analyzed
      case 4:
        return true; // Can submit any time
      default:
        return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-12">
        <div className="flex items-center justify-between">
          {NEW_ONBOARDING_STEPS.map((step, index) => (
            <div key={step.id} className="flex-1 relative">
              <div className="flex items-center">
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    currentStep > step.id
                      ? 'bg-primary-600 border-primary-600'
                      : currentStep === step.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-gray-300 text-gray-400'
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </div>
                {index < NEW_ONBOARDING_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      currentStep > step.id ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
              <p
                className={`mt-2 text-xs font-medium ${
                  currentStep >= step.id
                    ? 'text-gray-900'
                    : 'text-gray-400'
                }`}
              >
                {step.title}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white shadow-lg rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {NEW_ONBOARDING_STEPS[currentStep - 1].title}
        </h2>
        <p className="text-gray-600 mb-8">
          {NEW_ONBOARDING_STEPS[currentStep - 1].description}
        </p>

        {/* Step 1: Analyze Website */}
        {currentStep === 1 && (
          <UrlAnalyzer
            onAnalysisStart={handleAnalysisStart}
            onAnalysisComplete={() => handleNext()}
            onError={(error) =>
              setState((prev) => ({
                ...prev,
                jobError: error,
                jobStatus: 'error',
              }))
            }
            isLoading={isLoading}
            jobProgress={jobProgress}
            jobCurrentStep={jobCurrentStep}
          />
        )}

        {/* Step 2: Add Products */}
        {currentStep === 2 && (
          <ProductIngestionTabs
            onProductsSelected={handleProductsSelected}
            isLoading={isLoading}
          />
        )}

        {/* Step 3: Review Profile */}
        {currentStep === 3 && (
          <ProfileReviewCards
            identityCard={state.brandIdentity}
            competitors={state.competitors}
            products={state.products}
            onIdentityChange={handleIdentityChange}
            onCompetitorsChange={handleCompetitorsChange}
            onProductsChange={handleProductsChange}
          />
        )}

        {/* Step 4: Confirm Setup */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Ready to Complete!
              </h3>
              <p className="text-green-800 mb-4">
                Your brand profile has been created with:
              </p>
              <ul className="text-sm text-green-800 space-y-2 list-disc list-inside">
                <li>Brand identity and values</li>
                <li>{state.competitors?.length || 0} competitors</li>
                <li>{state.products?.length || 0} products</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                You&apos;ll be able to edit any information and add more details
                from your dashboard. Our AI team can help refine your profile
                over time.
              </p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {state.jobError && state.jobStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1">{state.jobError}</p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          {currentStep < NEW_ONBOARDING_STEPS.length ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!isStepValid() || isLoading}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Completing...' : 'Complete Setup'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
