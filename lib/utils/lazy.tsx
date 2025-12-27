// Lazy Loading Utilities
// Optimizes initial bundle size by deferring heavy components

import dynamic from 'next/dynamic';
import { useState, useRef, useEffect, type ComponentType } from 'react';

// ============================================
// Loading Skeleton Component
// ============================================

function LoadingSkeleton({ height = '200px' }: { height?: string }) {
  return (
    <div
      className="animate-pulse rounded-lg"
      style={{
        height,
        background: 'rgb(var(--surface))',
        border: '1px solid rgb(var(--border))'
      }}
    >
      <div className="flex items-center justify-center h-full text-[rgb(var(--foreground-secondary))]">
        Loading...
      </div>
    </div>
  );
}

// ============================================
// Lazy Load Helper
// ============================================

interface LazyLoadOptions {
  ssr?: boolean;
  height?: string;
}

export function lazyLoad<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: LazyLoadOptions = {}
) {
  const { ssr = false, height = '200px' } = options;

  return dynamic(importFn, {
    ssr,
    loading: () => <LoadingSkeleton height={height} />,
  });
}

// ============================================
// Pre-configured Lazy Components
// ============================================

// Charts - Heavy recharts components, lazy load for performance
export const LazyQuadrantChart = lazyLoad(
  () => import('@/components/aeo/QuadrantChart'),
  { height: '400px' }
);

export const LazyMetricsRadarChart = lazyLoad(
  () => import('@/components/aeo/MetricsRadarChart'),
  { height: '300px' }
);

// Dashboard visualizations
export const LazyBrandStoryVisualizer = lazyLoad(
  () => import('@/components/dashboard/BrandStoryVisualizer'),
  { height: '500px' }
);

export const LazyAIPlatformGalaxy = lazyLoad(
  () => import('@/components/dashboard/AIPlatformGalaxy'),
  { height: '600px' }
);

export const LazyMarketLandscape = lazyLoad(
  () => import('@/components/dashboard/MarketLandscape'),
  { height: '400px' }
);

// ============================================
// Intersection Observer Lazy Loading
// For components that should load when visible
// ============================================

export function createIntersectionObserverLoader<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: LazyLoadOptions = {}
) {
  const LazyComponent = lazyLoad(importFn, options);

  // Return a wrapper that uses intersection observer
  return function IntersectionLoadedComponent(props: P) {
    const [shouldLoad, setShouldLoad] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
          }
        },
        { rootMargin: '100px' }
      );

      if (ref.current) {
        observer.observe(ref.current);
      }

      return () => observer.disconnect();
    }, []);

    if (!shouldLoad) {
      return (
        <div ref={ref}>
          <LoadingSkeleton height={options.height || '200px'} />
        </div>
      );
    }

    return <LazyComponent {...props} />;
  };
}

