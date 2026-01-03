'use client';

import { Check } from 'lucide-react';
import { ONBOARDING_STEPS, type OnboardingStepConfig } from '@/lib/config/onboarding';

interface OnboardingStepperProps {
  currentStep: number;
  completedSteps: number[];
}

export function OnboardingStepper({ currentStep, completedSteps }: OnboardingStepperProps) {
  const isStepComplete = (stepId: number) => completedSteps.includes(stepId);
  const isStepActive = (stepId: number) => stepId === currentStep;
  const isStepAccessible = (stepId: number) => stepId <= currentStep || isStepComplete(stepId);

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {ONBOARDING_STEPS.map((step, index) => (
          <div key={step.id} className="flex-1 relative">
            <div className="flex items-center">
              {/* Step Circle */}
              <div
                className={`
                  flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                  ${isStepComplete(step.id)
                    ? 'bg-[rgb(var(--primary))] border-[rgb(var(--primary))]'
                    : isStepActive(step.id)
                    ? 'border-[rgb(var(--primary))] text-[rgb(var(--primary))] bg-[rgb(var(--surface))]'
                    : 'border-[rgb(var(--border))] text-[rgb(var(--foreground-secondary))] bg-[rgb(var(--surface))]'
                  }
                `}
              >
                {isStepComplete(step.id) ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <span className="text-sm font-semibold">{step.id}</span>
                )}
              </div>

              {/* Connector Line */}
              {index < ONBOARDING_STEPS.length - 1 && (
                <div
                  className={`
                    flex-1 h-0.5 mx-3 transition-colors
                    ${isStepComplete(step.id)
                      ? 'bg-[rgb(var(--primary))]'
                      : 'bg-[rgb(var(--border))]'
                    }
                  `}
                />
              )}
            </div>

            {/* Step Label */}
            <div className="mt-2">
              <p
                className={`
                  text-xs font-medium transition-colors
                  ${isStepActive(step.id)
                    ? 'text-[rgb(var(--primary))]'
                    : isStepComplete(step.id)
                    ? 'text-[rgb(var(--foreground))]'
                    : 'text-[rgb(var(--foreground-secondary))]'
                  }
                `}
              >
                {step.label}
              </p>
              {step.optional && (
                <p className="text-[10px] text-[rgb(var(--foreground-secondary))]">Optional</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OnboardingStepper;
