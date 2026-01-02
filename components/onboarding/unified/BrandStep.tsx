'use client';

import { useState } from 'react';
import { Globe, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useMagicImportProgress } from '@/lib/hooks/useOnboardingSocket';
import { MAGIC_IMPORT_STAGES } from '@/lib/config/onboarding';

interface BrandStepProps {
  sessionId: string;
  onStartImport: (websiteUrl: string, brandName: string) => void;
  onRetry: () => void;
  isStarting: boolean;
  importStatus: 'idle' | 'running' | 'complete' | 'failed';
  importError?: string;
}

export function BrandStep({
  sessionId,
  onStartImport,
  onRetry,
  isStarting,
  importStatus,
  importError,
}: BrandStepProps) {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [brandName, setBrandName] = useState('');
  const [urlError, setUrlError] = useState('');

  // Real-time progress from WebSocket
  const progress = useMagicImportProgress({
    sessionId,
    enabled: importStatus === 'running',
  });

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError('');

    if (!websiteUrl) {
      setUrlError('Please enter your website URL');
      return;
    }

    if (!validateUrl(websiteUrl)) {
      setUrlError('Please enter a valid URL');
      return;
    }

    const fullUrl = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
    const derivedBrandName = brandName || new URL(fullUrl).hostname.replace('www.', '').split('.')[0];

    onStartImport(fullUrl, derivedBrandName);
  };

  // Idle State - Show Form
  if (importStatus === 'idle') {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Website URL Input */}
          <div>
            <label
              htmlFor="websiteUrl"
              className="block text-sm font-medium text-[rgb(var(--foreground))] mb-2"
            >
              Website URL
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--foreground-secondary))]" />
              <input
                id="websiteUrl"
                type="text"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="example.com"
                className={`
                  w-full pl-10 pr-4 py-3 rounded-lg border bg-[rgb(var(--surface))]
                  text-[rgb(var(--foreground))] placeholder-[rgb(var(--foreground-secondary))]
                  focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]
                  ${urlError ? 'border-red-500' : 'border-[rgb(var(--border))]'}
                `}
              />
            </div>
            {urlError && (
              <p className="mt-1 text-sm text-red-500">{urlError}</p>
            )}
          </div>

          {/* Brand Name Input (Optional) */}
          <div>
            <label
              htmlFor="brandName"
              className="block text-sm font-medium text-[rgb(var(--foreground))] mb-2"
            >
              Brand Name <span className="text-[rgb(var(--foreground-secondary))]">(optional)</span>
            </label>
            <input
              id="brandName"
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="We'll detect this from your website"
              className="w-full px-4 py-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))]
                text-[rgb(var(--foreground))] placeholder-[rgb(var(--foreground-secondary))]
                focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
            />
          </div>
        </div>

        {/* What We'll Do */}
        <Card className="p-4 bg-[rgb(var(--surface-hover))]">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[rgb(var(--primary))] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-[rgb(var(--foreground))] mb-2">
                Our AI will analyze your website to create your brand profile
              </p>
              <ul className="text-sm text-[rgb(var(--foreground-secondary))] space-y-1">
                <li>- Extract brand identity and voice</li>
                <li>- Identify your products and services</li>
                <li>- Discover your competitors</li>
                <li>- Analyze target audience and positioning</li>
              </ul>
            </div>
          </div>
        </Card>

        <Button type="submit" size="lg" className="w-full" disabled={isStarting}>
          {isStarting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Starting Analysis...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Analyze My Website
            </>
          )}
        </Button>
      </form>
    );
  }

  // Running State - Show Progress
  if (importStatus === 'running') {
    const currentStage = progress.stage || 'crawl';
    const stageIndex = MAGIC_IMPORT_STAGES.findIndex(s => s.id === currentStage);

    return (
      <div className="space-y-6">
        {/* Overall Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[rgb(var(--foreground))]">
              {progress.stageName || 'Analyzing your website...'}
            </span>
            <span className="text-sm text-[rgb(var(--foreground-secondary))]">
              {Math.round(progress.overallProgress)}%
            </span>
          </div>
          <div className="h-2 bg-[rgb(var(--surface-hover))] rounded-full overflow-hidden">
            <div
              className="h-full bg-[rgb(var(--primary))] transition-all duration-500"
              style={{ width: `${progress.overallProgress}%` }}
            />
          </div>
          {progress.message && (
            <p className="mt-2 text-sm text-[rgb(var(--foreground-secondary))]">
              {progress.message}
            </p>
          )}
        </div>

        {/* Stage List */}
        <div className="space-y-3">
          {MAGIC_IMPORT_STAGES.map((stage, index) => {
            const isComplete = index < stageIndex;
            const isCurrent = index === stageIndex;
            const isPending = index > stageIndex;

            return (
              <div
                key={stage.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isCurrent
                    ? 'bg-[rgb(var(--primary))]/10 border border-[rgb(var(--primary))]/20'
                    : 'bg-[rgb(var(--surface-hover))]'
                }`}
              >
                {isComplete ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 text-[rgb(var(--primary))] animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-[rgb(var(--border))] flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    isPending
                      ? 'text-[rgb(var(--foreground-secondary))]'
                      : 'text-[rgb(var(--foreground))]'
                  }`}>
                    {stage.name}
                  </p>
                  {isCurrent && progress.stageProgress > 0 && (
                    <div className="mt-1 h-1 bg-[rgb(var(--surface))] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[rgb(var(--primary))] transition-all duration-300"
                        style={{ width: `${progress.stageProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Complete State
  if (importStatus === 'complete') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-2">
          Brand Profile Created!
        </h3>
        <p className="text-[rgb(var(--foreground-secondary))]">
          We&apos;ve analyzed your website and created your brand profile.
          You can review and edit it from your dashboard.
        </p>
      </div>
    );
  }

  // Failed State
  if (importStatus === 'failed') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-2">
          Analysis Failed
        </h3>
        <p className="text-[rgb(var(--foreground-secondary))] mb-4">
          {importError || "We couldn't analyze your website. Please try again."}
        </p>
        <Button onClick={onRetry}>
          <Loader2 className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return null;
}

export default BrandStep;
