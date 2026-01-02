'use client';

import { useState } from 'react';
import { Loader2, Play, SkipForward, Bot, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface ScanStepProps {
  onRunScan: (platform: string) => void;
  onSkip: () => void;
  isRunning: boolean;
  scanStatus: 'idle' | 'running' | 'complete' | 'skipped';
}

const AI_PLATFORMS = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    description: 'OpenAI\'s conversational AI',
    icon: '🤖',
    color: 'bg-green-100',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    description: 'AI-powered search engine',
    icon: '🔍',
    color: 'bg-blue-100',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    description: 'Google\'s AI assistant',
    icon: '✨',
    color: 'bg-purple-100',
  },
  {
    id: 'claude',
    name: 'Claude',
    description: 'Anthropic\'s AI assistant',
    icon: '🧠',
    color: 'bg-orange-100',
  },
];

export function ScanStep({
  onRunScan,
  onSkip,
  isRunning,
  scanStatus,
}: ScanStepProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('chatgpt');

  const handleRunScan = () => {
    if (selectedPlatform) {
      onRunScan(selectedPlatform);
    }
  };

  // Complete State
  if (scanStatus === 'complete') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-2">
          First Scan Complete!
        </h3>
        <p className="text-[rgb(var(--foreground-secondary))]">
          We&apos;ve started monitoring your brand&apos;s perception across AI platforms.
          Check your dashboard for insights.
        </p>
      </div>
    );
  }

  // Skipped State
  if (scanStatus === 'skipped') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-[rgb(var(--surface-hover))] flex items-center justify-center mx-auto mb-4">
          <SkipForward className="w-8 h-8 text-[rgb(var(--foreground-secondary))]" />
        </div>
        <h3 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-2">
          Scan Skipped
        </h3>
        <p className="text-[rgb(var(--foreground-secondary))]">
          You can run your first perception scan anytime from your dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card className="p-4 bg-[rgb(var(--surface-hover))]">
        <div className="flex items-start gap-3">
          <Bot className="w-5 h-5 text-[rgb(var(--primary))] flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-[rgb(var(--foreground))] mb-1">
              See how AI talks about your brand
            </p>
            <p className="text-sm text-[rgb(var(--foreground-secondary))]">
              We&apos;ll query AI platforms with prompts relevant to your industry
              and analyze how they perceive and represent your brand.
            </p>
          </div>
        </div>
      </Card>

      {/* Platform Selection */}
      <div>
        <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-3">
          Select a platform to scan first
        </label>
        <div className="grid grid-cols-2 gap-3">
          {AI_PLATFORMS.map((platform) => (
            <Card
              key={platform.id}
              className={`p-4 cursor-pointer transition-all ${
                selectedPlatform === platform.id
                  ? 'ring-2 ring-[rgb(var(--primary))] border-[rgb(var(--primary))]'
                  : 'hover:border-[rgb(var(--primary))]/50'
              }`}
              onClick={() => setSelectedPlatform(platform.id)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${platform.color} flex items-center justify-center text-lg`}>
                  {platform.icon}
                </div>
                <div>
                  <p className="font-medium text-[rgb(var(--foreground))]">
                    {platform.name}
                  </p>
                  <p className="text-xs text-[rgb(var(--foreground-secondary))]">
                    {platform.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Running State */}
      {isRunning ? (
        <div className="text-center py-6">
          <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--primary))] mx-auto mb-3" />
          <p className="text-[rgb(var(--foreground))] font-medium">
            Running perception scan...
          </p>
          <p className="text-sm text-[rgb(var(--foreground-secondary))]">
            This may take a few minutes
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Button onClick={handleRunScan} size="lg" className="flex-1" disabled={!selectedPlatform}>
            <Play className="w-4 h-4 mr-2" />
            Run First Scan
          </Button>
          <Button variant="outline" size="lg" onClick={onSkip}>
            <SkipForward className="w-4 h-4 mr-2" />
            Skip
          </Button>
        </div>
      )}

      <p className="text-center text-xs text-[rgb(var(--foreground-secondary))]">
        You can run more scans and track additional platforms from your dashboard.
      </p>
    </div>
  );
}

export default ScanStep;
