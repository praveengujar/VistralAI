'use client';

import { useTheme, Theme } from '@/lib/theme/ThemeContext';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ThemeOption {
  value: Theme;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const themeOptions: ThemeOption[] = [
  {
    value: 'light',
    label: 'Morning',
    icon: Sun,
    description: 'Light background with dark text',
  },
  {
    value: 'dark',
    label: 'Night',
    icon: Moon,
    description: 'Dark background with light text',
  },
  {
    value: 'system',
    label: 'System',
    icon: Monitor,
    description: 'Follows your device settings',
  },
];

export function ThemeSelector() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const currentOption = themeOptions.find(opt => opt.value === theme)!;
  const CurrentIcon = resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <div className="relative" ref={dropdownRef} onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg
                   transition-colors duration-200
                   focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{
          backgroundColor: 'rgb(var(--surface))',
          borderColor: 'rgb(var(--border))',
          color: 'rgb(var(--foreground-secondary))',
        }}
        aria-label="Select theme"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <CurrentIcon className="h-5 w-5" />
        <span className="text-sm font-medium hidden sm:inline">
          {currentOption.label}
        </span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-lg py-1 z-50 shadow-lg"
          style={{
            backgroundColor: 'rgb(var(--surface))',
            borderColor: 'rgb(var(--border))',
            border: '1px solid rgb(var(--border))',
          }}
          role="listbox"
          aria-label="Theme options"
        >
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = theme === option.value;

            return (
              <button
                key={option.value}
                onClick={() => {
                  setTheme(option.value);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 transition-colors duration-150"
                style={{
                  backgroundColor: isSelected ? 'rgb(var(--primary) / 0.1)' : 'transparent',
                  color: isSelected ? 'rgb(var(--primary))' : 'rgb(var(--foreground-secondary))',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'rgb(var(--surface-hover))';
                    e.currentTarget.style.color = 'rgb(var(--foreground))';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'rgb(var(--foreground-secondary))';
                  }
                }}
                role="option"
                aria-selected={isSelected}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">{option.label}</div>
                  <div
                    className="text-xs"
                    style={{ color: 'rgb(var(--foreground-muted))' }}
                  >
                    {option.description}
                  </div>
                </div>
                {isSelected && (
                  <Check className="h-5 w-5 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
