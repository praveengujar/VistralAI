'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ArrowRight, Sparkles, TrendingUp, Bell, Target } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import confetti from 'canvas-confetti';

interface CompleteStepProps {
  brandName?: string;
  tierId?: string;
  hasFirstScan?: boolean;
  onGoToDashboard: () => void;
}

export function CompleteStep({
  brandName,
  tierId,
  hasFirstScan,
  onGoToDashboard,
}: CompleteStepProps) {
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    if (showConfetti) {
      // Trigger confetti on mount
      const duration = 2000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors: ['#3B82F6', '#10B981', '#8B5CF6'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: ['#3B82F6', '#10B981', '#8B5CF6'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
      setShowConfetti(false);
    }
  }, [showConfetti]);

  const nextSteps = [
    {
      icon: TrendingUp,
      title: 'View Your Dashboard',
      description: 'See your brand visibility metrics and AI perception insights.',
    },
    {
      icon: Bell,
      title: 'Set Up Alerts',
      description: 'Get notified when AI platforms mention your brand.',
    },
    {
      icon: Target,
      title: 'Track Competitors',
      description: 'Monitor how competitors appear in AI responses.',
    },
  ];

  return (
    <div className="text-center space-y-8">
      {/* Success Icon */}
      <div>
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-[rgb(var(--foreground))] mb-2">
          Welcome to VistralAI!
        </h2>
        <p className="text-[rgb(var(--foreground-secondary))]">
          {brandName ? (
            <>Your brand profile for <span className="font-medium text-[rgb(var(--foreground))]">{brandName}</span> is ready.</>
          ) : (
            'Your account is set up and ready to go.'
          )}
        </p>
      </div>

      {/* Summary Card */}
      <Card className="p-6 text-left">
        <h3 className="font-semibold text-[rgb(var(--foreground))] mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[rgb(var(--primary))]" />
          What We&apos;ve Set Up
        </h3>
        <ul className="space-y-3">
          <li className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-[rgb(var(--foreground-secondary))]">
              {tierId ? `${tierId.charAt(0).toUpperCase() + tierId.slice(1)} plan activated with 15-day trial` : 'Your subscription is active'}
            </span>
          </li>
          <li className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-[rgb(var(--foreground-secondary))]">
              Brand profile created from your website
            </span>
          </li>
          <li className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-[rgb(var(--foreground-secondary))]">
              {hasFirstScan
                ? 'First perception scan completed'
                : 'Ready to run your first perception scan'}
            </span>
          </li>
        </ul>
      </Card>

      {/* Next Steps */}
      <div>
        <h3 className="font-semibold text-[rgb(var(--foreground))] mb-4">
          What You Can Do Next
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {nextSteps.map((step, index) => (
            <Card key={index} className="p-4 text-left hover:border-[rgb(var(--primary))]/50 transition-colors">
              <step.icon className="w-6 h-6 text-[rgb(var(--primary))] mb-2" />
              <h4 className="font-medium text-[rgb(var(--foreground))] mb-1">
                {step.title}
              </h4>
              <p className="text-xs text-[rgb(var(--foreground-secondary))]">
                {step.description}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Button */}
      <Button size="lg" onClick={onGoToDashboard} className="px-8">
        Go to Dashboard
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}

export default CompleteStep;
