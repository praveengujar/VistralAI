'use client';

import { useTheme } from '@/lib/theme/ThemeContext';
import { useMemo } from 'react';

export interface ChartTheme {
  // Background
  backgroundColor: string;

  // Grid
  gridColor: string;
  gridStrokeWidth: number;

  // Axis
  axisColor: string;
  axisLabelColor: string;
  axisFontSize: number;

  // Tooltip
  tooltipBackgroundColor: string;
  tooltipBorderColor: string;
  tooltipTextColor: string;
  tooltipShadow: string;

  // Legend
  legendTextColor: string;

  // Data colors (accessible palette)
  colors: string[];

  // Specific semantic colors
  positiveColor: string;
  negativeColor: string;
  neutralColor: string;

  // Text
  titleColor: string;
  subtitleColor: string;

  // Quadrant colors for AEO charts
  quadrantColors: {
    dominant: string;
    vulnerable: string;
    niche: string;
    invisible: string;
  };

  // Platform colors
  platformColors: {
    chatgpt: string;
    claude: string;
    gemini: string;
    perplexity: string;
  };
}

export function useChartTheme(): ChartTheme {
  const { resolvedTheme } = useTheme();

  return useMemo(() => {
    // Dim mode (Twitter-style soft dark)
    if (resolvedTheme === 'dim') {
      return {
        // Background
        backgroundColor: '#15202B',

        // Grid
        gridColor: '#38444d',
        gridStrokeWidth: 1,

        // Axis
        axisColor: '#657786',
        axisLabelColor: '#8899a6',
        axisFontSize: 12,

        // Tooltip
        tooltipBackgroundColor: '#1e2a38',
        tooltipBorderColor: '#38444d',
        tooltipTextColor: '#f7f9f9',
        tooltipShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',

        // Legend
        legendTextColor: '#d9e4e8',

        // Data colors (brightened for dim mode)
        colors: [
          '#818cf8', // Indigo
          '#a78bfa', // Purple
          '#f472b6', // Pink
          '#fb923c', // Orange
          '#fcd34d', // Amber
          '#34d399', // Emerald
          '#38bdf8', // Sky
          '#facc15', // Yellow
        ],

        // Semantic
        positiveColor: '#34d399',
        negativeColor: '#f87171',
        neutralColor: '#8899a6',

        // Text
        titleColor: '#f7f9f9',
        subtitleColor: '#8899a6',

        // Quadrant colors for AEO
        quadrantColors: {
          dominant: '#34d399',
          vulnerable: '#fbbf24',
          niche: '#38bdf8',
          invisible: '#f87171',
        },

        // Platform colors
        platformColors: {
          chatgpt: '#10b981',
          claude: '#fb923c',
          gemini: '#60a5fa',
          perplexity: '#a78bfa',
        },
      };
    }

    // Dark mode (lights out / AMOLED)
    if (resolvedTheme === 'dark') {
      return {
        // Background
        backgroundColor: '#1e293b',

        // Grid
        gridColor: '#334155',
        gridStrokeWidth: 1,

        // Axis
        axisColor: '#475569',
        axisLabelColor: '#94a3b8',
        axisFontSize: 12,

        // Tooltip
        tooltipBackgroundColor: '#0f172a',
        tooltipBorderColor: '#334155',
        tooltipTextColor: '#f1f5f9',
        tooltipShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',

        // Legend
        legendTextColor: '#cbd5e1',

        // Data colors (brightened for dark mode - IBM Color Blind Safe)
        colors: [
          '#818cf8', // Indigo
          '#a78bfa', // Purple
          '#f472b6', // Pink
          '#fb923c', // Orange
          '#fcd34d', // Amber
          '#34d399', // Emerald
          '#38bdf8', // Sky
          '#facc15', // Yellow
        ],

        // Semantic
        positiveColor: '#34d399',
        negativeColor: '#f87171',
        neutralColor: '#94a3b8',

        // Text
        titleColor: '#f1f5f9',
        subtitleColor: '#94a3b8',

        // Quadrant colors for AEO
        quadrantColors: {
          dominant: '#34d399',   // Emerald - success
          vulnerable: '#fbbf24', // Amber - warning
          niche: '#38bdf8',      // Sky - info
          invisible: '#f87171',  // Red - error
        },

        // Platform colors
        platformColors: {
          chatgpt: '#10b981',
          claude: '#fb923c',
          gemini: '#60a5fa',
          perplexity: '#a78bfa',
        },
      };
    }

    // Light mode
    return {
      // Background
      backgroundColor: '#ffffff',

      // Grid
      gridColor: '#e5e7eb',
      gridStrokeWidth: 1,

      // Axis
      axisColor: '#d1d5db',
      axisLabelColor: '#6b7280',
      axisFontSize: 12,

      // Tooltip
      tooltipBackgroundColor: '#ffffff',
      tooltipBorderColor: '#e5e7eb',
      tooltipTextColor: '#111827',
      tooltipShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',

      // Legend
      legendTextColor: '#374151',

      // Data colors (IBM Color Blind Safe Palette)
      colors: [
        '#648fff', // Blue
        '#785ef0', // Purple
        '#dc267f', // Magenta
        '#fe6100', // Orange
        '#ffb000', // Gold
        '#009e73', // Teal
        '#56b4e9', // Sky Blue
        '#e69f00', // Amber
      ],

      // Semantic
      positiveColor: '#059669',
      negativeColor: '#dc2626',
      neutralColor: '#6b7280',

      // Text
      titleColor: '#111827',
      subtitleColor: '#6b7280',

      // Quadrant colors for AEO
      quadrantColors: {
        dominant: '#10b981',   // Emerald - success
        vulnerable: '#f59e0b', // Amber - warning
        niche: '#0ea5e9',      // Sky - info
        invisible: '#ef4444',  // Red - error
      },

      // Platform colors
      platformColors: {
        chatgpt: '#10a37f',
        claude: '#d97706',
        gemini: '#4285f4',
        perplexity: '#6366f1',
      },
    };
  }, [resolvedTheme]);
}

// Helper to get CSS variable colors
export function getCSSVariableColor(variable: string): string {
  if (typeof window === 'undefined') return '';
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  // Convert space-separated RGB values to hex or rgb()
  if (value.match(/^\d+\s+\d+\s+\d+$/)) {
    const [r, g, b] = value.split(' ').map(Number);
    return `rgb(${r}, ${g}, ${b})`;
  }
  return value;
}
