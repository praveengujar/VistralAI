'use client';

import { useTheme } from '@/lib/theme/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-colors duration-200
                 focus:outline-none focus:ring-2 focus:ring-offset-2 ${className}`}
      style={{
        backgroundColor: 'rgb(var(--surface))',
        borderColor: 'rgb(var(--border))',
        color: 'rgb(var(--foreground-secondary))',
        border: '1px solid rgb(var(--border))',
      }}
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}
