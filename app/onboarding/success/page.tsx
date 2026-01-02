'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { TRIAL_DAYS } from '@/lib/config/pricing';

export default function OnboardingSuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(var(--background))' }}>
      <div className="max-w-md mx-auto px-4 text-center">
        {/* Success Icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
        >
          <CheckCircle className="w-10 h-10" style={{ color: 'rgb(34, 197, 94)' }} />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-4" style={{ color: 'rgb(var(--foreground))' }}>
          Welcome to VistralAI!
        </h1>

        {/* Description */}
        <p className="text-lg mb-8" style={{ color: 'rgb(var(--foreground-secondary))' }}>
          Your {TRIAL_DAYS}-day free trial has started. Let&apos;s get you set up for success.
        </p>

        {/* Features */}
        <div
          className="p-6 rounded-lg mb-8 text-left"
          style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5" style={{ color: 'rgb(var(--primary))' }} />
            <h2 className="font-semibold" style={{ color: 'rgb(var(--foreground))' }}>
              What&apos;s next?
            </h2>
          </div>
          <ul className="space-y-3 text-sm" style={{ color: 'rgb(var(--foreground-secondary))' }}>
            <li className="flex items-start gap-3">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium"
                style={{ backgroundColor: 'rgb(var(--primary))', color: 'white' }}
              >
                1
              </span>
              <span>Add your brand information and website</span>
            </li>
            <li className="flex items-start gap-3">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium"
                style={{ backgroundColor: 'rgb(var(--primary))', color: 'white' }}
              >
                2
              </span>
              <span>Run your first AI perception scan</span>
            </li>
            <li className="flex items-start gap-3">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium"
                style={{ backgroundColor: 'rgb(var(--primary))', color: 'white' }}
              >
                3
              </span>
              <span>Get insights on how AI platforms perceive your brand</span>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          style={{ backgroundColor: 'rgb(var(--primary))', color: 'white' }}
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Auto-redirect notice */}
        <p className="mt-4 text-sm" style={{ color: 'rgb(var(--foreground-muted))' }}>
          Redirecting in {countdown} seconds...
        </p>
      </div>
    </div>
  );
}
