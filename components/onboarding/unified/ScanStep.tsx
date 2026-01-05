'use client';

import { Zap, Layers, SkipForward, Loader2, CheckCircle2, Target, TrendingUp, BarChart3, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface ScanStepProps {
  brand360Id?: string;
  brandName?: string;
  scanStatus: 'idle' | 'running' | 'complete' | 'skipped';
  scanData?: {
    status: string;
    completedCount: number;
    promptCount: number;
    overallScore?: number;
    quadrantPosition?: string;
    platformScores?: Record<string, number>;
  };
  onStartScan: (type: 'quick' | 'comprehensive') => void;
  onSkip: () => void;
  isStarting: boolean;
  isSkipping?: boolean;
}

export function ScanStep({
  brandName,
  scanStatus,
  scanData,
  onStartScan,
  onSkip,
  isStarting,
  isSkipping,
}: ScanStepProps) {
  // IDLE: Show 3 option cards
  if (scanStatus === 'idle') {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <p className="text-[rgb(var(--foreground-secondary))]">
            Choose how you want to scan{' '}
            <strong className="text-[rgb(var(--foreground))]">{brandName}</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Quick Scan Card */}
          <Card className="p-6 hover:border-[rgb(var(--primary))]/50 transition-colors cursor-pointer group">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-500/20 transition-colors">
                <Zap className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="font-semibold text-[rgb(var(--foreground))] mb-2">Quick Scan</h3>
              <p className="text-sm text-[rgb(var(--foreground-secondary))] mb-4">
                10 prompts on ChatGPT. Get results in ~1-2 minutes.
              </p>
              <Button
                className="w-full"
                onClick={() => onStartScan('quick')}
                disabled={isStarting || isSkipping}
              >
                {isStarting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  'Start Quick Scan'
                )}
              </Button>
            </div>
          </Card>

          {/* Comprehensive Scan Card */}
          <Card className="p-6 hover:border-[rgb(var(--primary))]/50 transition-colors cursor-pointer group">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500/20 transition-colors">
                <Layers className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="font-semibold text-[rgb(var(--foreground))] mb-2">Comprehensive Scan</h3>
              <p className="text-sm text-[rgb(var(--foreground-secondary))] mb-4">
                All prompts across multiple AI platforms. ~5-10 minutes.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onStartScan('comprehensive')}
                disabled={isStarting || isSkipping}
              >
                Start Full Scan
              </Button>
            </div>
          </Card>

          {/* Skip Card */}
          <Card className="p-6 hover:border-[rgb(var(--border))] transition-colors cursor-pointer group">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[rgb(var(--surface-hover))] flex items-center justify-center mx-auto mb-4">
                <SkipForward className="w-6 h-6 text-[rgb(var(--foreground-secondary))]" />
              </div>
              <h3 className="font-semibold text-[rgb(var(--foreground))] mb-2">Skip for Now</h3>
              <p className="text-sm text-[rgb(var(--foreground-secondary))] mb-4">
                Go to dashboard. You can run scans anytime.
              </p>
              <Button
                variant="ghost"
                className="w-full"
                onClick={onSkip}
                disabled={isStarting || isSkipping}
              >
                {isSkipping ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Skipping...
                  </>
                ) : (
                  'Skip to Dashboard'
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // RUNNING: Show progress
  if (scanStatus === 'running') {
    const progress = scanData && scanData.promptCount > 0
      ? Math.round((scanData.completedCount / scanData.promptCount) * 100)
      : 0;

    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-[rgb(var(--primary))]/10 flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--primary))]" />
        </div>
        <h3 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-2">
          Scanning AI Platforms...
        </h3>
        <p className="text-[rgb(var(--foreground-secondary))] mb-6">
          Evaluating how AI perceives{' '}
          <strong className="text-[rgb(var(--foreground))]">{brandName}</strong>
        </p>
        <div className="max-w-md mx-auto">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[rgb(var(--foreground-secondary))]">Progress</span>
            <span className="text-[rgb(var(--foreground))]">
              {scanData?.completedCount || 0} / {scanData?.promptCount || 0} prompts
            </span>
          </div>
          <div className="h-2 bg-[rgb(var(--surface-hover))] rounded-full overflow-hidden">
            <div
              className="h-full bg-[rgb(var(--primary))] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-4 text-sm text-[rgb(var(--foreground-secondary))]">
            This may take a few minutes. Feel free to wait or come back later.
          </p>
        </div>
      </div>
    );
  }

  // COMPLETE: Show results summary
  if (scanStatus === 'complete') {
    const overallScore = scanData?.overallScore ?? 0;
    const quadrantPosition = scanData?.quadrantPosition || 'analyzing';

    // Get quadrant color
    const getQuadrantColor = (position: string) => {
      switch (position.toLowerCase()) {
        case 'dominant': return 'text-green-500';
        case 'vulnerable': return 'text-amber-500';
        case 'niche': return 'text-blue-500';
        case 'invisible': return 'text-red-500';
        default: return 'text-[rgb(var(--foreground-secondary))]';
      }
    };

    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-2">
          Scan Complete!
        </h3>
        <p className="text-[rgb(var(--foreground-secondary))] mb-6">
          Here&apos;s a quick snapshot of your AI visibility
        </p>

        {/* Results Grid */}
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
          <Card className="p-4">
            <Target className="w-6 h-6 text-[rgb(var(--primary))] mx-auto mb-2" />
            <p className="text-2xl font-bold text-[rgb(var(--foreground))]">
              {Math.round(overallScore)}%
            </p>
            <p className="text-xs text-[rgb(var(--foreground-secondary))]">Overall Score</p>
          </Card>
          <Card className="p-4">
            <TrendingUp className="w-6 h-6 text-[rgb(var(--primary))] mx-auto mb-2" />
            <p className={`text-lg font-semibold capitalize ${getQuadrantColor(quadrantPosition)}`}>
              {quadrantPosition}
            </p>
            <p className="text-xs text-[rgb(var(--foreground-secondary))]">Position</p>
          </Card>
          <Card className="p-4">
            <BarChart3 className="w-6 h-6 text-[rgb(var(--primary))] mx-auto mb-2" />
            <p className="text-2xl font-bold text-[rgb(var(--foreground))]">
              {scanData?.completedCount || 0}
            </p>
            <p className="text-xs text-[rgb(var(--foreground-secondary))]">Prompts Analyzed</p>
          </Card>
          <Card className="p-4">
            <Eye className="w-6 h-6 text-[rgb(var(--primary))] mx-auto mb-2" />
            <p className="text-2xl font-bold text-[rgb(var(--foreground))]">
              {Object.keys(scanData?.platformScores || {}).length || 1}
            </p>
            <p className="text-xs text-[rgb(var(--foreground-secondary))]">Platforms</p>
          </Card>
        </div>

        <p className="text-sm text-[rgb(var(--foreground-secondary))]">
          View detailed results and insights in your dashboard
        </p>
      </div>
    );
  }

  // SKIPPED: Should not be shown (redirected to complete)
  return null;
}

export default ScanStep;
