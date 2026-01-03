'use client';

import { useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useMagicImportProgress } from '@/lib/hooks/useOnboardingSocket';
import { MAGIC_IMPORT_STAGES } from '@/lib/config/onboarding';

interface BuildProfileStepProps {
  sessionId: string;
  websiteUrl: string;
  brandName: string;
  onStartImport: () => void;
  onRetry: () => void;
  isStarting: boolean;
  importStatus: 'idle' | 'running' | 'complete' | 'failed';
  importError?: string;
  completionScore?: number;
}

export function BuildProfileStep({
  sessionId,
  websiteUrl,
  brandName,
  onStartImport,
  onRetry,
  isStarting,
  importStatus,
  importError,
  completionScore,
}: BuildProfileStepProps) {
  // Real-time progress from WebSocket
  const progress = useMagicImportProgress({
    sessionId,
    enabled: importStatus === 'running',
  });

  // Auto-start Magic Import when component mounts and status is idle
  useEffect(() => {
    if (importStatus === 'idle' && !isStarting) {
      onStartImport();
    }
  }, [importStatus, isStarting, onStartImport]);

  // Idle State - Show Starting Message
  if (importStatus === 'idle') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-[rgb(var(--primary))]/10 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-[rgb(var(--primary))]" />
        </div>
        <h3 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-2">
          Building Your Brand Profile
        </h3>
        <p className="text-[rgb(var(--foreground-secondary))] mb-4">
          Preparing to analyze <strong>{brandName}</strong>
        </p>
        <p className="text-sm text-[rgb(var(--foreground-secondary))]">
          {websiteUrl}
        </p>
        {isStarting && (
          <div className="mt-6">
            <Loader2 className="w-6 h-6 animate-spin text-[rgb(var(--primary))] mx-auto" />
            <p className="text-sm text-[rgb(var(--foreground-secondary))] mt-2">
              Starting analysis...
            </p>
          </div>
        )}
      </div>
    );
  }

  // Running State - Show Progress
  if (importStatus === 'running') {
    const currentStage = progress.stage || 'crawler';
    const stageIndex = MAGIC_IMPORT_STAGES.findIndex(s => s.id === currentStage);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-1">
            Analyzing {brandName}
          </h3>
          <p className="text-sm text-[rgb(var(--foreground-secondary))]">
            This may take a few minutes
          </p>
        </div>

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
                  <p className="text-xs text-[rgb(var(--foreground-secondary))]">
                    {stage.description}
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
        <p className="text-[rgb(var(--foreground-secondary))] mb-4">
          We&apos;ve successfully analyzed your website and created your brand profile.
        </p>

        {completionScore !== undefined && (
          <Card className="inline-block p-4 bg-[rgb(var(--surface-hover))]">
            <p className="text-sm text-[rgb(var(--foreground-secondary))]">
              Profile Completeness
            </p>
            <p className="text-2xl font-bold text-[rgb(var(--primary))]">
              {completionScore}%
            </p>
          </Card>
        )}

        <p className="mt-4 text-sm text-[rgb(var(--foreground-secondary))]">
          You can review and enhance your profile from the dashboard.
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
        <Button onClick={onRetry} disabled={isStarting}>
          {isStarting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </>
          )}
        </Button>
      </div>
    );
  }

  return null;
}

export default BuildProfileStep;
