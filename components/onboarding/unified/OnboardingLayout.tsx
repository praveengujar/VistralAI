'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingStepper } from './OnboardingStepper';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

interface OnboardingLayoutProps {
  children: ReactNode;
  currentStep: number;
  completedSteps: number[];
  title: string;
  description?: string;
  onNext?: () => void;
  onBack?: () => void;
  nextLabel?: string;
  backLabel?: string;
  isNextDisabled?: boolean;
  isLoading?: boolean;
  hideNavigation?: boolean;
  showSkip?: boolean;
  onSkip?: () => void;
}

export function OnboardingLayout({
  children,
  currentStep,
  completedSteps,
  title,
  description,
  onNext,
  onBack,
  nextLabel = 'Continue',
  backLabel = 'Back',
  isNextDisabled = false,
  isLoading = false,
  hideNavigation = false,
  showSkip = false,
  onSkip,
}: OnboardingLayoutProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      {/* Header */}
      <header className="border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[rgb(var(--primary))] flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <span className="text-lg font-semibold text-[rgb(var(--foreground))]">
                VistralAI
              </span>
            </div>
            <span className="text-sm text-[rgb(var(--foreground-secondary))]">
              Setup your account
            </span>
          </div>
        </div>
      </header>

      {/* Stepper */}
      <div className="max-w-4xl mx-auto px-6">
        <OnboardingStepper currentStep={currentStep} completedSteps={completedSteps} />
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 pb-12">
        <Card className="p-8">
          {/* Step Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[rgb(var(--foreground))] mb-2">
              {title}
            </h1>
            {description && (
              <p className="text-[rgb(var(--foreground-secondary))]">
                {description}
              </p>
            )}
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {children}
          </div>

          {/* Navigation */}
          {!hideNavigation && (
            <div className="flex items-center justify-between pt-6 border-t border-[rgb(var(--border))]">
              <div>
                {currentStep > 1 && onBack && (
                  <Button
                    variant="outline"
                    onClick={onBack}
                    disabled={isLoading}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {backLabel}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {showSkip && onSkip && (
                  <Button
                    variant="ghost"
                    onClick={onSkip}
                    disabled={isLoading}
                  >
                    Skip for now
                  </Button>
                )}

                {onNext && (
                  <Button
                    onClick={onNext}
                    disabled={isNextDisabled || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {nextLabel}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}

export default OnboardingLayout;
