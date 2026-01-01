'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ROUTES } from '@/lib/constants';
import {
  ArrowLeft,
  Play,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Bot,
  MessageSquare,
  Sparkles,
  Search,
  Zap,
} from 'lucide-react';
// Review site prompts are automatically included - no selector needed

type LLMPlatform = 'claude' | 'chatgpt' | 'gemini' | 'perplexity' | 'google_aio';
type PromptCategory = 'navigational' | 'functional' | 'comparative' | 'voice' | 'adversarial';

interface Platform {
  id: LLMPlatform;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface Category {
  id: PromptCategory;
  name: string;
  description: string;
}

const PLATFORMS: Platform[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    description: 'OpenAI\'s GPT-4 assistant',
    icon: <MessageSquare className="h-5 w-5" />,
    color: 'bg-emerald-500',
  },
  {
    id: 'claude',
    name: 'Claude',
    description: 'Anthropic\'s AI assistant',
    icon: <Bot className="h-5 w-5" />,
    color: 'bg-amber-500',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    description: 'Google\'s AI model',
    icon: <Sparkles className="h-5 w-5" />,
    color: 'bg-blue-500',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    description: 'AI-powered search engine',
    icon: <Search className="h-5 w-5" />,
    color: 'bg-indigo-500',
  },
  {
    id: 'google_aio',
    name: 'Google AI Overview',
    description: 'Google Search AI summaries',
    icon: <Zap className="h-5 w-5" />,
    color: 'bg-red-500',
  },
];

const CATEGORIES: Category[] = [
  {
    id: 'navigational',
    name: 'Navigational',
    description: 'Direct brand/product searches',
  },
  {
    id: 'functional',
    name: 'Functional',
    description: 'How-to and feature queries',
  },
  {
    id: 'comparative',
    name: 'Comparative',
    description: 'Competitor comparisons',
  },
  {
    id: 'voice',
    name: 'Voice',
    description: 'Brand voice alignment tests',
  },
  {
    id: 'adversarial',
    name: 'Adversarial',
    description: 'Edge cases and challenges',
  },
];

export default function NewScanPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [brand360Id, setBrand360Id] = useState<string | null>(null);
  const [brandName, setBrandName] = useState<string>('');
  const [hasBrand360Profile, setHasBrand360Profile] = useState(false);
  const [isLoadingBrand, setIsLoadingBrand] = useState(true);
  const [selectedPlatforms, setSelectedPlatforms] = useState<LLMPlatform[]>(['chatgpt']);
  const [selectedCategories, setSelectedCategories] = useState<PromptCategory[]>([]);
  const [maxPrompts, setMaxPrompts] = useState<number>(10);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  // Review sites are always included automatically - no state needed

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(ROUTES.LOGIN);
    }
  }, [status, router]);

  useEffect(() => {
    const fetchBrandProfile = async () => {
      if (status === 'authenticated' && session?.user?.id) {
        try {
          const res = await fetch(`/api/brand-profile?userId=${session.user.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.profile) {
              setBrand360Id(data.profile.id);
              setBrandName(data.profile.name || data.profile.domain);

              // Check if Brand360Profile exists (created via Magic Import)
              const brand360Res = await fetch(`/api/brand-360?brandId=${data.profile.id}`);
              if (brand360Res.ok) {
                const brand360Data = await brand360Res.json();

                // If we found a Brand360Profile, update the ID to use that instead of the legacy profile ID
                if (brand360Data.data?.id) {
                  setBrand360Id(brand360Data.data.id);
                }

                // If there's identity data, the Brand360Profile exists
                setHasBrand360Profile(!!brand360Data.data?.identity || !!brand360Data.data?.products?.length);
              }
            }
          }
        } catch (err) {
          console.error('Error fetching brand profile:', err);
        } finally {
          setIsLoadingBrand(false);
        }
      }
    };
    fetchBrandProfile();
  }, [status, session]);

  const togglePlatform = (platform: LLMPlatform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const toggleCategory = (category: PromptCategory) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleStartScan = async () => {
    if (!brand360Id) {
      setError('No brand profile found. Please complete onboarding first.');
      return;
    }

    if (selectedPlatforms.length === 0) {
      setError('Please select at least one platform.');
      return;
    }

    setIsScanning(true);
    setError(null);
    setScanProgress('Initializing perception scan...');

    try {
      const response = await fetch('/api/aeo/perception-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand360Id,
          options: {
            platforms: selectedPlatforms,
            categories: selectedCategories.length > 0 ? selectedCategories : undefined,
            maxPrompts,
            mockExternalPlatforms: true,
            includeReviewWebsites: true, // Always enabled - auto-detects relevant sites
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setError(`A scan is already running. View it at /dashboard/aeo/scan/${data.scanId}`);
          return;
        }
        throw new Error(data.error || data.message || 'Scan failed');
      }

      setScanProgress('Scan completed! Redirecting to results...');

      // Redirect to scan detail page
      setTimeout(() => {
        router.push(`/dashboard/aeo/scan/${data.data.scanId}`);
      }, 1000);
    } catch (err) {
      console.error('Scan error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start scan');
      setIsScanning(false);
    }
  };

  if (status === 'loading' || isLoadingBrand) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto" />
            <p className="mt-4 text-secondary-500">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-container py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/dashboard/aeo')}
            className="p-2 rounded-lg text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="page-title">New Perception Scan</h1>
            <p className="page-subtitle">
              {brandName ? `Scanning AI perception for ${brandName}` : 'Configure and start a new AI perception scan'}
            </p>
          </div>
        </div>

        {/* No Brand Profile Warning */}
        {!brand360Id && (
          <div className="card p-6 mb-8 border-warning-200 bg-warning-50">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-warning-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-warning-900">Brand Profile Required</h3>
                <p className="text-sm text-warning-700 mt-1">
                  You need to complete your brand profile before running a perception scan.
                </p>
                <button
                  onClick={() => router.push(ROUTES.ONBOARDING)}
                  className="btn-primary btn-sm mt-4"
                >
                  Go to Onboarding
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Brand 360 Profile Required Warning */}
        {brand360Id && !hasBrand360Profile && (
          <div className="card p-6 mb-8 border-primary-200 bg-primary-50">
            <div className="flex items-start gap-4">
              <Sparkles className="h-6 w-6 text-primary-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-primary-900">Complete Your Brand 360 Profile</h3>
                <p className="text-sm text-primary-700 mt-1">
                  Before running a perception scan, you need to analyze your website to build your Brand 360 profile.
                  This provides the ground truth data that AI responses will be evaluated against.
                </p>
                <button
                  onClick={() => router.push('/dashboard/brand-profile')}
                  className="btn-primary btn-sm mt-4"
                >
                  <Sparkles className="h-4 w-4" />
                  Go to Brand 360 Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scan Configuration */}
        {brand360Id && hasBrand360Profile && (
          <div className="space-y-8">
            {/* Platform Selection */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-secondary-900 mb-2">
                Select AI Platforms
              </h2>
              <p className="text-sm text-secondary-500 mb-6">
                Choose which AI platforms to query for your brand perception analysis
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PLATFORMS.map((platform) => {
                  const isSelected = selectedPlatforms.includes(platform.id);
                  return (
                    <button
                      key={platform.id}
                      onClick={() => togglePlatform(platform.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-secondary-200 hover:border-secondary-300'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${platform.color} text-white`}>
                          {platform.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-secondary-900">
                            {platform.name}
                          </div>
                          <div className="text-xs text-secondary-500">
                            {platform.description}
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="h-5 w-5 text-primary-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Filter */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-secondary-900 mb-2">
                Prompt Categories
              </h2>
              <p className="text-sm text-secondary-500 mb-6">
                Optionally filter by specific prompt categories (leave empty for all)
              </p>

              <div className="flex flex-wrap gap-3">
                {CATEGORIES.map((category) => {
                  const isSelected = selectedCategories.includes(category.id);
                  return (
                    <button
                      key={category.id}
                      onClick={() => toggleCategory(category.id)}
                      className={`px-4 py-2 rounded-full border-2 transition-all ${isSelected
                          ? 'border-primary-500 bg-primary-100 text-primary-700'
                          : 'border-secondary-200 text-secondary-600 hover:border-secondary-300'
                        }`}
                    >
                      <span className="font-medium">{category.name}</span>
                      <span className="text-xs ml-2 opacity-75">{category.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Review site prompts are automatically included - no UI needed */}

            {/* Scan Options */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-secondary-900 mb-2">
                Scan Options
              </h2>
              <p className="text-sm text-secondary-500 mb-6">
                Configure additional scan parameters
              </p>

              <div className="max-w-xs">
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Maximum Prompts
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={maxPrompts}
                  onChange={(e) => setMaxPrompts(parseInt(e.target.value) || 10)}
                  className="input-field"
                />
                <p className="text-xs text-secondary-500 mt-1">
                  Limit the number of prompts to test (1-100)
                </p>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="card p-4 border-error-200 bg-error-50">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-error-600" />
                  <p className="text-sm text-error-700">{error}</p>
                </div>
              </div>
            )}

            {/* Start Scan Button */}
            <div className="flex justify-end">
              <button
                onClick={handleStartScan}
                disabled={isScanning || selectedPlatforms.length === 0}
                className="btn-primary btn-lg group"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {scanProgress}
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    Start Perception Scan
                  </>
                )}
              </button>
            </div>

            {/* Scan Info */}
            <div className="card p-6 bg-secondary-50">
              <h3 className="font-medium text-secondary-900 mb-3">What happens during a scan?</h3>
              <ul className="space-y-2 text-sm text-secondary-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success-500 mt-0.5 flex-shrink-0" />
                  <span>Query selected AI platforms with brand-specific prompts</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success-500 mt-0.5 flex-shrink-0" />
                  <span>Evaluate responses for accuracy, sentiment, and brand voice alignment</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success-500 mt-0.5 flex-shrink-0" />
                  <span>Detect hallucinations and misinformation about your brand</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success-500 mt-0.5 flex-shrink-0" />
                  <span>Generate actionable insights and correction suggestions</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
