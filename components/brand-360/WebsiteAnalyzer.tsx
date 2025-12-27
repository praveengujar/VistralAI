'use client';

import { useState } from 'react';
import { Globe, Loader2, CheckCircle2, XCircle, AlertCircle, Sparkles, Edit2, Zap, Brain, Target, Building2 } from 'lucide-react';

interface WebsiteAnalyzerProps {
  brandId: string;
  organizationId?: string;
  userId?: string;
  brandName?: string;
  websiteUrl: string;
  onComplete?: () => void;
  onOrganizationCreated?: (orgId: string) => void;
}

interface QuickSetupData {
  brandName: string;
  domain: string;
  category: string;
}

type AnalysisMode = 'standard' | 'magic';

interface AnalysisStatus {
  stage: 'idle' | 'setup' | 'validating' | 'crawling' | 'extracting' | 'vibecheck' | 'competitors' | 'completed' | 'failed';
  progress: number;
  message: string;
  pagesAnalyzed?: number;
  dataExtracted?: {
    identity: boolean;
    marketPosition: boolean;
    competitors: boolean;
    products: boolean;
  };
  magicImportResult?: {
    brand360Id: string;
    completionScore: number;
    entityHealthScore: number;
    discoveries: {
      entityHome: boolean;
      organizationSchema: boolean;
      brandIdentity: boolean;
      competitors: number;
    };
  };
}

export default function WebsiteAnalyzer({ brandId, organizationId, userId, brandName, websiteUrl, onComplete, onOrganizationCreated }: WebsiteAnalyzerProps) {
  const [editableUrl, setEditableUrl] = useState<string>(websiteUrl);
  const [isEditingUrl, setIsEditingUrl] = useState<boolean>(!websiteUrl);
  const [urlError, setUrlError] = useState<string>('');
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('magic');
  const [status, setStatus] = useState<AnalysisStatus>({
    stage: 'idle',
    progress: 0,
    message: '',
  });

  // Quick Setup state
  const [localOrgId, setLocalOrgId] = useState<string | undefined>(organizationId);
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [quickSetupData, setQuickSetupData] = useState<QuickSetupData>(() => {
    // Extract domain from websiteUrl
    let domain = '';
    try {
      const urlWithProtocol = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
      domain = new URL(urlWithProtocol).hostname.replace('www.', '');
    } catch {
      domain = websiteUrl.replace(/^https?:\/\//, '').replace('www.', '').split('/')[0];
    }
    const derivedBrandName = domain.split('.')[0];
    return {
      brandName: brandName || derivedBrandName.charAt(0).toUpperCase() + derivedBrandName.slice(1),
      domain,
      category: 'Other',
    };
  });
  const [setupError, setSetupError] = useState<string>('');

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) {
      setUrlError('Please enter a website URL');
      return false;
    }
    try {
      // Add protocol if missing
      const urlWithProtocol = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
      new URL(urlWithProtocol);
      setUrlError('');
      return true;
    } catch {
      setUrlError('Please enter a valid website URL');
      return false;
    }
  };

  const handleUrlSave = () => {
    if (validateUrl(editableUrl)) {
      setIsEditingUrl(false);
    }
  };

  const handleEditUrl = () => {
    setIsEditingUrl(true);
    setUrlError('');
  };

  const createOrganization = async (): Promise<string | null> => {
    if (!userId) {
      setSetupError('User session not found. Please log in again.');
      return null;
    }

    if (!quickSetupData.brandName.trim()) {
      setSetupError('Brand name is required');
      return null;
    }

    if (!quickSetupData.domain.trim()) {
      setSetupError('Domain is required');
      return null;
    }

    setIsCreatingOrg(true);
    setSetupError('');

    try {
      const response = await fetch('/api/brand-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          brandName: quickSetupData.brandName,
          domain: quickSetupData.domain,
          category: quickSetupData.category,
          competitors: [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create brand profile');
      }

      const data = await response.json();
      const newOrgId = data.profile.id;

      setLocalOrgId(newOrgId);
      if (onOrganizationCreated) {
        onOrganizationCreated(newOrgId);
      }

      return newOrgId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create organization';
      setSetupError(errorMessage);
      return null;
    } finally {
      setIsCreatingOrg(false);
    }
  };

  const startMagicImport = async () => {
    try {
      // Validate URL and required fields
      if (!validateUrl(editableUrl)) {
        return;
      }

      // Use local org ID (may have been created via quick setup)
      const effectiveOrgId = localOrgId || organizationId;

      if (!effectiveOrgId) {
        // Show setup form instead of failing
        setStatus({
          stage: 'setup',
          progress: 0,
          message: 'Quick setup required',
        });
        return;
      }

      // Normalize URL
      const urlToAnalyze = editableUrl.startsWith('http://') || editableUrl.startsWith('https://')
        ? editableUrl
        : `https://${editableUrl}`;

      // Extract brand name from URL if not provided
      const derivedBrandName = brandName || new URL(urlToAnalyze).hostname.replace('www.', '').split('.')[0];

      // Stage 1: Validating
      setStatus({
        stage: 'validating',
        progress: 5,
        message: 'Validating website URL...',
      });
      await new Promise(resolve => setTimeout(resolve, 500));

      // Stage 2: Crawling
      setStatus({
        stage: 'crawling',
        progress: 15,
        message: 'Crawling website & extracting Schema.org markup...',
      });

      // Call Magic Import API
      const response = await fetch('/api/aeo/magic-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: effectiveOrgId,
          websiteUrl: urlToAnalyze,
          brandName: derivedBrandName,
          options: {
            maxPages: 20,
          },
        }),
      });

      // Update progress while waiting
      setStatus({
        stage: 'crawling',
        progress: 30,
        message: 'Extracting entity information...',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Magic Import failed');
      }

      const result = await response.json();

      // Stage 3: Vibe Check
      setStatus({
        stage: 'vibecheck',
        progress: 60,
        message: 'Analyzing brand identity & archetypes...',
      });
      await new Promise(resolve => setTimeout(resolve, 500));

      // Stage 4: Competitors
      setStatus({
        stage: 'competitors',
        progress: 85,
        message: 'Discovering competitive landscape...',
      });
      await new Promise(resolve => setTimeout(resolve, 500));

      // Completed
      setStatus({
        stage: 'completed',
        progress: 100,
        message: 'Magic Import complete!',
        magicImportResult: result.data,
        dataExtracted: {
          identity: result.data.discoveries.brandIdentity,
          marketPosition: result.data.discoveries.organizationSchema,
          competitors: result.data.discoveries.competitors > 0,
          products: false,
        },
      });

      if (onComplete) {
        setTimeout(onComplete, 2000);
      }
    } catch (error: unknown) {
      console.error('Magic Import error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Magic Import failed. Please try again.';
      setStatus({
        stage: 'failed',
        progress: 0,
        message: errorMessage,
      });
    }
  };

  const startStandardAnalysis = async () => {
    try {
      // Validate URL before starting
      if (!validateUrl(editableUrl)) {
        return;
      }

      // Normalize URL (add protocol if missing)
      const urlToAnalyze = editableUrl.startsWith('http://') || editableUrl.startsWith('https://')
        ? editableUrl
        : `https://${editableUrl}`;

      // Stage 1: Validating
      setStatus({
        stage: 'validating',
        progress: 10,
        message: 'Validating website URL...',
      });
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Stage 2: Crawling
      setStatus({
        stage: 'crawling',
        progress: 30,
        message: 'Crawling your website...',
      });
      await new Promise(resolve => setTimeout(resolve, 2000));

      setStatus({
        stage: 'crawling',
        progress: 50,
        message: 'Analyzing content from 12 pages...',
        pagesAnalyzed: 12,
      });
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Stage 3: Extracting
      setStatus({
        stage: 'extracting',
        progress: 70,
        message: 'Extracting brand information with AI...',
      });

      // Call actual API
      const response = await fetch('/api/brand-360/analyze-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brandId,
          url: urlToAnalyze,
          maxPages: 20,
          depth: 3,
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();

      setStatus({
        stage: 'extracting',
        progress: 90,
        message: 'Finalizing extraction...',
      });
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Completed
      setStatus({
        stage: 'completed',
        progress: 100,
        message: 'Analysis complete!',
        pagesAnalyzed: data.data.pagesAnalyzed,
        dataExtracted: {
          identity: !!data.data.extractedData.identity,
          marketPosition: !!data.data.extractedData.marketPosition,
          competitors: (data.data.extractedData.competitors?.length || 0) > 0,
          products: (data.data.extractedData.products?.length || 0) > 0,
        },
      });

      if (onComplete) {
        setTimeout(onComplete, 2000);
      }
    } catch (error: unknown) {
      console.error('Analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed. Please try again.';
      setStatus({
        stage: 'failed',
        progress: 0,
        message: errorMessage,
      });
    }
  };

  const startAnalysis = () => {
    if (analysisMode === 'magic') {
      startMagicImport();
    } else {
      startStandardAnalysis();
    }
  };

  return (
    <div className="space-y-4">
      {status.stage === 'idle' && (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Globe className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'rgb(var(--foreground))' }}>
            Analyze Your Website
          </h3>
          <p className="mb-6 max-w-md mx-auto" style={{ color: 'rgb(var(--foreground-secondary))' }}>
            We&apos;ll crawl your website and automatically extract your brand information,
            products, and competitive positioning.
          </p>

          {/* Analysis Mode Selection */}
          <div className="flex justify-center gap-3 mb-6">
            <button
              onClick={() => setAnalysisMode('magic')}
              className={`flex items-center px-4 py-3 rounded-lg border-2 transition-all ${
                analysisMode === 'magic'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'hover:border-primary-300'
              }`}
              style={analysisMode !== 'magic' ? { borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))', color: 'rgb(var(--foreground-secondary))' } : {}}
            >
              <Zap className="h-5 w-5 mr-2" />
              <div className="text-left">
                <div className="font-medium">Magic Import</div>
                <div className="text-xs opacity-75">AEO-optimized extraction</div>
              </div>
            </button>
            <button
              onClick={() => setAnalysisMode('standard')}
              className={`flex items-center px-4 py-3 rounded-lg border-2 transition-all ${
                analysisMode === 'standard'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'hover:border-primary-300'
              }`}
              style={analysisMode !== 'standard' ? { borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))', color: 'rgb(var(--foreground-secondary))' } : {}}
            >
              <Sparkles className="h-5 w-5 mr-2" />
              <div className="text-left">
                <div className="font-medium">Standard</div>
                <div className="text-xs opacity-75">Basic extraction</div>
              </div>
            </button>
          </div>

          {/* URL Input/Display Section */}
          {isEditingUrl ? (
            <div className="rounded-lg p-4 mb-6 max-w-md mx-auto" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
              <label className="block text-sm font-medium mb-2 text-left" style={{ color: 'rgb(var(--foreground-secondary))' }}>
                Website URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editableUrl}
                  onChange={(e) => {
                    setEditableUrl(e.target.value);
                    setUrlError('');
                  }}
                  placeholder="example.com or https://example.com"
                  className="flex-1 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  style={{ border: '1px solid rgb(var(--border))', color: 'rgb(var(--foreground))', backgroundColor: 'rgb(var(--surface))' }}
                />
                <button
                  onClick={handleUrlSave}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium text-sm"
                >
                  Save
                </button>
              </div>
              {urlError && (
                <p className="mt-2 text-sm text-red-600">{urlError}</p>
              )}
            </div>
          ) : (
            <div className="rounded-lg p-4 mb-6 max-w-md mx-auto" style={{ backgroundColor: 'rgb(var(--background-secondary))', border: '1px solid rgb(var(--border))' }}>
              <div className="flex items-center justify-between">
                <div className="text-left flex-1">
                  <span className="text-sm" style={{ color: 'rgb(var(--foreground-secondary))' }}>Website URL:</span>
                  <p className="text-sm font-medium break-all" style={{ color: 'rgb(var(--foreground))' }}>{editableUrl}</p>
                </div>
                <button
                  onClick={handleEditUrl}
                  className="ml-3 p-2 rounded transition hover:opacity-80"
                  style={{ color: 'rgb(var(--foreground-muted))' }}
                  title="Edit URL"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <button
            onClick={startAnalysis}
            disabled={isEditingUrl}
            className={`inline-flex items-center px-6 py-3 text-white rounded-md font-medium disabled:bg-gray-400 disabled:cursor-not-allowed ${
              analysisMode === 'magic'
                ? 'bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700'
                : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {analysisMode === 'magic' ? (
              <>
                <Zap className="h-5 w-5 mr-2" />
                Start Magic Import
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Start AI Analysis
              </>
            )}
          </button>
        </div>
      )}

      {(status.stage === 'validating' || status.stage === 'crawling' || status.stage === 'extracting' || status.stage === 'vibecheck' || status.stage === 'competitors') && (
        <div className="rounded-lg p-6" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
          <div className="flex items-center space-x-3 mb-4">
            <Loader2 className="h-6 w-6 text-primary-600 animate-spin" />
            <div>
              <h4 className="font-medium" style={{ color: 'rgb(var(--foreground))' }}>{status.message}</h4>
              {status.pagesAnalyzed && (
                <p className="text-sm" style={{ color: 'rgb(var(--foreground-secondary))' }}>
                  Pages analyzed: {status.pagesAnalyzed}
                </p>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full rounded-full h-2 mb-2" style={{ backgroundColor: 'rgb(var(--background-tertiary))' }}>
            <div
              className={`rounded-full h-2 transition-all duration-500 ${
                analysisMode === 'magic'
                  ? 'bg-gradient-to-r from-primary-600 to-accent-600'
                  : 'bg-primary-600'
              }`}
              style={{ width: `${status.progress}%` }}
            />
          </div>
          <p className="text-sm text-right" style={{ color: 'rgb(var(--foreground-secondary))' }}>{status.progress}%</p>

          {/* Stage Indicators - Magic Import */}
          {analysisMode === 'magic' ? (
            <div className="mt-6 grid grid-cols-4 gap-2">
              <div className={`text-center p-3 rounded-lg ${status.progress >= 15 ? 'bg-primary-50' : ''}`} style={status.progress < 15 ? { backgroundColor: 'rgb(var(--background-secondary))' } : {}}>
                <Globe className={`h-5 w-5 mx-auto mb-1 ${status.progress >= 15 ? 'text-primary-600' : ''}`} style={status.progress < 15 ? { color: 'rgb(var(--foreground-muted))' } : {}} />
                <p className="text-xs" style={{ color: 'rgb(var(--foreground-secondary))' }}>Crawling</p>
              </div>
              <div className={`text-center p-3 rounded-lg ${status.progress >= 60 ? 'bg-primary-50' : ''}`} style={status.progress < 60 ? { backgroundColor: 'rgb(var(--background-secondary))' } : {}}>
                <Brain className={`h-5 w-5 mx-auto mb-1 ${status.progress >= 60 ? 'text-primary-600' : ''}`} style={status.progress < 60 ? { color: 'rgb(var(--foreground-muted))' } : {}} />
                <p className="text-xs" style={{ color: 'rgb(var(--foreground-secondary))' }}>Vibe Check</p>
              </div>
              <div className={`text-center p-3 rounded-lg ${status.progress >= 85 ? 'bg-primary-50' : ''}`} style={status.progress < 85 ? { backgroundColor: 'rgb(var(--background-secondary))' } : {}}>
                <Target className={`h-5 w-5 mx-auto mb-1 ${status.progress >= 85 ? 'text-primary-600' : ''}`} style={status.progress < 85 ? { color: 'rgb(var(--foreground-muted))' } : {}} />
                <p className="text-xs" style={{ color: 'rgb(var(--foreground-secondary))' }}>Competitors</p>
              </div>
              <div className={`text-center p-3 rounded-lg ${status.progress >= 100 ? 'bg-primary-50' : ''}`} style={status.progress < 100 ? { backgroundColor: 'rgb(var(--background-secondary))' } : {}}>
                <CheckCircle2 className={`h-5 w-5 mx-auto mb-1 ${status.progress >= 100 ? 'text-primary-600' : ''}`} style={status.progress < 100 ? { color: 'rgb(var(--foreground-muted))' } : {}} />
                <p className="text-xs" style={{ color: 'rgb(var(--foreground-secondary))' }}>Complete</p>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-3 gap-2">
              <div className={`text-center p-3 rounded-lg ${status.progress >= 30 ? 'bg-primary-50' : ''}`} style={status.progress < 30 ? { backgroundColor: 'rgb(var(--background-secondary))' } : {}}>
                <Globe className={`h-5 w-5 mx-auto mb-1 ${status.progress >= 30 ? 'text-primary-600' : ''}`} style={status.progress < 30 ? { color: 'rgb(var(--foreground-muted))' } : {}} />
                <p className="text-xs" style={{ color: 'rgb(var(--foreground-secondary))' }}>Crawling</p>
              </div>
              <div className={`text-center p-3 rounded-lg ${status.progress >= 70 ? 'bg-primary-50' : ''}`} style={status.progress < 70 ? { backgroundColor: 'rgb(var(--background-secondary))' } : {}}>
                <Sparkles className={`h-5 w-5 mx-auto mb-1 ${status.progress >= 70 ? 'text-primary-600' : ''}`} style={status.progress < 70 ? { color: 'rgb(var(--foreground-muted))' } : {}} />
                <p className="text-xs" style={{ color: 'rgb(var(--foreground-secondary))' }}>AI Extraction</p>
              </div>
              <div className={`text-center p-3 rounded-lg ${status.progress >= 100 ? 'bg-primary-50' : ''}`} style={status.progress < 100 ? { backgroundColor: 'rgb(var(--background-secondary))' } : {}}>
                <CheckCircle2 className={`h-5 w-5 mx-auto mb-1 ${status.progress >= 100 ? 'text-primary-600' : ''}`} style={status.progress < 100 ? { color: 'rgb(var(--foreground-muted))' } : {}} />
                <p className="text-xs" style={{ color: 'rgb(var(--foreground-secondary))' }}>Complete</p>
              </div>
            </div>
          )}
        </div>
      )}

      {status.stage === 'completed' && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start space-x-3 mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-green-900">
                  {status.magicImportResult ? 'Magic Import complete!' : 'Website analysis complete!'}
                </h4>
                <p className="text-sm text-green-700 mt-1">
                  {status.magicImportResult
                    ? 'Successfully extracted semantic ground truth from your website'
                    : `Successfully analyzed ${status.pagesAnalyzed} pages from your website`
                  }
                </p>
              </div>
            </div>

            {/* Magic Import Scores */}
            {status.magicImportResult && (
              <div className="mt-4 grid grid-cols-2 gap-4 mb-4">
                <div className="rounded-lg p-4 border border-green-100" style={{ backgroundColor: 'rgb(var(--surface))' }}>
                  <div className="text-2xl font-bold text-primary-600">
                    {status.magicImportResult.completionScore}%
                  </div>
                  <div className="text-sm" style={{ color: 'rgb(var(--foreground-secondary))' }}>Profile Completion</div>
                </div>
                <div className="rounded-lg p-4 border border-green-100" style={{ backgroundColor: 'rgb(var(--surface))' }}>
                  <div className="text-2xl font-bold text-accent-600">
                    {status.magicImportResult.entityHealthScore}%
                  </div>
                  <div className="text-sm" style={{ color: 'rgb(var(--foreground-secondary))' }}>Entity Health</div>
                </div>
              </div>
            )}

            {status.dataExtracted && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {status.magicImportResult?.discoveries.entityHome && (
                  <div className="rounded-lg p-3 flex items-center space-x-2" style={{ backgroundColor: 'rgb(var(--surface))' }}>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm" style={{ color: 'rgb(var(--foreground))' }}>Entity Home</span>
                  </div>
                )}
                {status.magicImportResult?.discoveries.organizationSchema && (
                  <div className="rounded-lg p-3 flex items-center space-x-2" style={{ backgroundColor: 'rgb(var(--surface))' }}>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm" style={{ color: 'rgb(var(--foreground))' }}>Schema.org Data</span>
                  </div>
                )}
                {status.dataExtracted.identity && (
                  <div className="rounded-lg p-3 flex items-center space-x-2" style={{ backgroundColor: 'rgb(var(--surface))' }}>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm" style={{ color: 'rgb(var(--foreground))' }}>Brand Identity Prism</span>
                  </div>
                )}
                {status.dataExtracted.competitors && (
                  <div className="rounded-lg p-3 flex items-center space-x-2" style={{ backgroundColor: 'rgb(var(--surface))' }}>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm" style={{ color: 'rgb(var(--foreground))' }}>
                      {status.magicImportResult
                        ? `${status.magicImportResult.discoveries.competitors} Competitors`
                        : 'Competitors'
                      }
                    </span>
                  </div>
                )}
                {!status.magicImportResult && status.dataExtracted.marketPosition && (
                  <div className="rounded-lg p-3 flex items-center space-x-2" style={{ backgroundColor: 'rgb(var(--surface))' }}>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm" style={{ color: 'rgb(var(--foreground))' }}>Market Position</span>
                  </div>
                )}
                {!status.magicImportResult && status.dataExtracted.products && (
                  <div className="rounded-lg p-3 flex items-center space-x-2" style={{ backgroundColor: 'rgb(var(--surface))' }}>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm" style={{ color: 'rgb(var(--foreground))' }}>Products</span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-800">
                {status.magicImportResult
                  ? '✨ Your Brand 360 profile has been created with semantic ground truth. View your AEO dashboard for insights.'
                  : '💡 Your profile has been updated. Review the extracted data and make any necessary edits.'
                }
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setStatus({ stage: 'idle', progress: 0, message: '' })}
              className="inline-flex items-center px-4 py-2 border border-primary-600 text-primary-600 rounded-md hover:bg-primary-50 font-medium"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Analyze Different Website
            </button>
          </div>
        </div>
      )}

      {status.stage === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-red-900">Analysis failed</h4>
              <p className="text-sm text-red-700 mt-1">{status.message}</p>
              <button
                onClick={() => setStatus({ stage: 'idle', progress: 0, message: '' })}
                className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {status.stage === 'setup' && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
          <div className="flex items-start space-x-3 mb-6">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Building2 className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h4 className="font-semibold" style={{ color: 'rgb(var(--foreground))' }}>Quick Setup Required</h4>
              <p className="text-sm mt-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>
                Set up your brand profile to continue with Magic Import
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>
                Brand Name *
              </label>
              <input
                type="text"
                value={quickSetupData.brandName}
                onChange={(e) => setQuickSetupData({ ...quickSetupData, brandName: e.target.value })}
                placeholder="Your brand name"
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                style={{ border: '1px solid rgb(var(--border))', color: 'rgb(var(--foreground))', backgroundColor: 'rgb(var(--surface))' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>
                Domain *
              </label>
              <input
                type="text"
                value={quickSetupData.domain}
                onChange={(e) => setQuickSetupData({ ...quickSetupData, domain: e.target.value })}
                placeholder="example.com"
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                style={{ border: '1px solid rgb(var(--border))', color: 'rgb(var(--foreground))', backgroundColor: 'rgb(var(--surface))' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>
                Category
              </label>
              <select
                value={quickSetupData.category}
                onChange={(e) => setQuickSetupData({ ...quickSetupData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                style={{ border: '1px solid rgb(var(--border))', color: 'rgb(var(--foreground))', backgroundColor: 'rgb(var(--surface))' }}
              >
                <option value="Technology & Software">Technology & Software</option>
                <option value="SaaS & Cloud Services">SaaS & Cloud Services</option>
                <option value="E-commerce & Retail">E-commerce & Retail</option>
                <option value="Financial Services">Financial Services</option>
                <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                <option value="Education & EdTech">Education & EdTech</option>
                <option value="Media & Entertainment">Media & Entertainment</option>
                <option value="Food & Beverage">Food & Beverage</option>
                <option value="Travel & Hospitality">Travel & Hospitality</option>
                <option value="Fashion & Beauty">Fashion & Beauty</option>
                <option value="Real Estate & Property">Real Estate & Property</option>
                <option value="Automotive & Transportation">Automotive & Transportation</option>
                <option value="Professional Services">Professional Services</option>
                <option value="Manufacturing & Industrial">Manufacturing & Industrial</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {setupError && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-sm text-red-700">{setupError}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStatus({ stage: 'idle', progress: 0, message: '' })}
                className="px-4 py-2 rounded-md hover:opacity-80 font-medium"
                style={{ border: '1px solid rgb(var(--border))', color: 'rgb(var(--foreground-secondary))' }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const orgId = await createOrganization();
                  if (orgId) {
                    setStatus({ stage: 'idle', progress: 0, message: '' });
                    // Trigger magic import after a brief delay
                    setTimeout(() => startMagicImport(), 100);
                  }
                }}
                disabled={isCreatingOrg}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-md hover:from-primary-700 hover:to-accent-700 font-medium disabled:opacity-50"
              >
                {isCreatingOrg ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Create & Continue
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {status.stage === 'idle' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">
                {analysisMode === 'magic' ? 'Magic Import extracts:' : 'What we\'ll extract:'}
              </p>
              {analysisMode === 'magic' ? (
                <ul className="space-y-1">
                  <li>• <strong>Entity Home</strong> - Knowledge Graph links (Wikidata, social profiles)</li>
                  <li>• <strong>Schema.org Data</strong> - Organization markup for AI visibility</li>
                  <li>• <strong>Brand Identity Prism</strong> - Kapferer 6 dimensions analysis</li>
                  <li>• <strong>Brand Archetype</strong> - Jung 12 archetypes with scores</li>
                  <li>• <strong>Brand Voice</strong> - Tone, vocabulary, and style spectrums</li>
                  <li>• <strong>Competitor Graph</strong> - Discovered competitors with positioning</li>
                </ul>
              ) : (
                <ul className="space-y-1">
                  <li>• Brand identity (mission, vision, values)</li>
                  <li>• Product and service catalog</li>
                  <li>• Target audience insights</li>
                  <li>• Competitive positioning</li>
                  <li>• Market positioning information</li>
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
