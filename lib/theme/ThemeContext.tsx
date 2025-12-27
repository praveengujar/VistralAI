'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type Theme = 'light' | 'dim' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dim' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'vistral-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [mounted, setMounted] = useState(false);

  // Get system preference (defaults to 'dim' for dark mode preference)
  const getSystemTheme = useCallback((): ResolvedTheme => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dim' : 'light';
  }, []);

  // Resolve the actual theme
  const resolveTheme = useCallback((themeValue: Theme): ResolvedTheme => {
    if (themeValue === 'system') {
      return getSystemTheme();
    }
    return themeValue;
  }, [getSystemTheme]);

  // Apply theme to document
  const applyTheme = useCallback((resolved: ResolvedTheme) => {
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove('light', 'dim', 'dark', 'lights-out');

    // Add new theme class
    root.classList.add(resolved);

    // Update color-scheme for native elements (both dim and dark use 'dark' scheme)
    root.style.colorScheme = resolved === 'light' ? 'light' : 'dark';

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const colors: Record<ResolvedTheme, string> = {
        light: '#f8fafc',
        dim: '#15202B',
        dark: '#000000'
      };
      metaThemeColor.setAttribute('content', colors[resolved]);
    }
  }, []);

  // Set theme
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);

    // Save to localStorage
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);

    // Resolve and apply
    const resolved = resolveTheme(newTheme);
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, [resolveTheme, applyTheme]);

  // Cycle through themes: light -> dim -> dark -> light
  const toggleTheme = useCallback(() => {
    const cycle: Record<ResolvedTheme, Theme> = {
      light: 'dim',
      dim: 'dark',
      dark: 'light'
    };
    setTheme(cycle[resolvedTheme]);
  }, [resolvedTheme, setTheme]);

  // Initialize on mount
  useEffect(() => {
    // Prevent transition flash on load
    document.documentElement.classList.add('no-transitions');

    // Get saved theme or default to system
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    const initialTheme = savedTheme || 'system';

    setThemeState(initialTheme);
    const resolved = resolveTheme(initialTheme);
    setResolvedTheme(resolved);
    applyTheme(resolved);

    setMounted(true);

    // Re-enable transitions after a brief delay
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('no-transitions');
      });
    });
  }, [resolveTheme, applyTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (theme === 'system') {
        const resolved = getSystemTheme();
        setResolvedTheme(resolved);
        applyTheme(resolved);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, mounted, getSystemTheme, applyTheme]);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <ThemeContext.Provider
        value={{
          theme: 'system',
          resolvedTheme: 'light',
          setTheme: () => {},
          toggleTheme: () => {},
        }}
      >
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
