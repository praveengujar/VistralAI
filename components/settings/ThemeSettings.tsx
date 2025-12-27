'use client';

import { useTheme, Theme, ResolvedTheme } from '@/lib/theme/ThemeContext';
import { Sun, Moon, Sparkles } from 'lucide-react';

interface ThemeCardProps {
  value: Theme;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  preview: 'light' | 'dim' | 'dark';
  isSelected: boolean;
  onSelect: () => void;
}

function ThemeCard({
  value,
  label,
  description,
  icon: Icon,
  preview,
  isSelected,
  onSelect,
}: ThemeCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200
                  ${isSelected
                    ? 'ring-2'
                    : 'hover:border-opacity-80'
                  }`}
      style={{
        borderColor: isSelected ? 'rgb(var(--primary))' : 'rgb(var(--border))',
        backgroundColor: isSelected ? 'rgb(var(--primary) / 0.05)' : 'transparent',
        ['--tw-ring-color' as string]: 'rgb(var(--primary) / 0.2)',
      }}
      role="radio"
      aria-checked={isSelected}
    >
      {/* Preview */}
      <div
        className="w-full aspect-video rounded-lg mb-3 overflow-hidden border"
        style={{
          backgroundColor: preview === 'light' ? '#ffffff' : preview === 'dim' ? '#15202B' : '#000000',
          borderColor: preview === 'light' ? '#e2e8f0' : preview === 'dim' ? '#38444d' : '#2f3336'
        }}
      >
        {/* Mini dashboard preview */}
        <div className="p-2 h-full flex flex-col gap-1">
          {/* Header bar */}
          <div
            className="h-2 rounded-sm"
            style={{
              backgroundColor: preview === 'light' ? '#e2e8f0' : preview === 'dim' ? '#1e2a38' : '#0f0f0f'
            }}
          />
          {/* Content area */}
          <div className="flex-1 flex gap-1">
            {/* Sidebar */}
            <div
              className="w-1/4 rounded-sm"
              style={{
                backgroundColor: preview === 'light' ? '#f1f5f9' : preview === 'dim' ? '#1e2a38' : '#0f0f0f'
              }}
            />
            {/* Main content */}
            <div className="flex-1 flex flex-col gap-1">
              <div
                className="h-1/2 rounded-sm"
                style={{
                  backgroundColor: preview === 'light' ? '#f1f5f9' : preview === 'dim' ? '#1e2a38' : '#0f0f0f'
                }}
              />
              <div className="flex-1 flex gap-1">
                <div
                  className="flex-1 rounded-sm"
                  style={{
                    backgroundColor: preview === 'light' ? '#dbeafe' : preview === 'dim' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)'
                  }}
                />
                <div
                  className="flex-1 rounded-sm"
                  style={{
                    backgroundColor: preview === 'light' ? '#dcfce7' : preview === 'dim' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(52, 211, 153, 0.2)'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Label */}
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color: 'rgb(var(--foreground))' }}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="font-medium" style={{ color: 'rgb(var(--foreground))' }}>{label}</span>
      </div>

      {/* Description */}
      <span
        className="text-xs text-center"
        style={{ color: 'rgb(var(--foreground-muted))' }}
      >
        {description}
      </span>

      {/* Selected indicator */}
      {isSelected && (
        <div
          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgb(var(--primary))' }}
        >
          <svg
            className="w-3 h-3"
            fill="rgb(var(--primary-foreground))"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </button>
  );
}

export function ThemeSettings() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const themes: Array<{
    value: Theme;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    preview: 'light' | 'dim' | 'dark';
  }> = [
    {
      value: 'light',
      label: 'Light',
      description: 'Classic bright appearance',
      icon: Sun,
      preview: 'light',
    },
    {
      value: 'dim',
      label: 'Dim',
      description: 'Soft dark blue, easy on eyes',
      icon: Sparkles,
      preview: 'dim',
    },
    {
      value: 'dark',
      label: 'Lights Out',
      description: 'Pure black for AMOLED',
      icon: Moon,
      preview: 'dark',
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3
          className="text-lg font-semibold"
          style={{ color: 'rgb(var(--foreground))' }}
        >
          Appearance
        </h3>
        <p
          className="text-sm"
          style={{ color: 'rgb(var(--foreground-muted))' }}
        >
          Customize how VistralAI looks on your device
        </p>
      </div>

      <div
        className="grid grid-cols-3 gap-4"
        role="radiogroup"
        aria-label="Theme selection"
      >
        {themes.map((t) => (
          <ThemeCard
            key={t.value}
            {...t}
            isSelected={theme === t.value}
            onSelect={() => setTheme(t.value)}
          />
        ))}
      </div>

      {/* Current theme indicator */}
      <p
        className="text-sm"
        style={{ color: 'rgb(var(--foreground-muted))' }}
      >
        Currently using:{' '}
        <span
          className="font-medium"
          style={{ color: 'rgb(var(--foreground))' }}
        >
          {resolvedTheme === 'dim' ? 'Dim' : resolvedTheme === 'dark' ? 'Lights Out' : 'Light'}
        </span>{' '}
        theme
      </p>
    </div>
  );
}
