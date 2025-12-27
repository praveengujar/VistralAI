'use client';

// React Query Provider
// Provides client-side caching, deduplication, and background refetching

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: 5 minutes before data is considered stale
            staleTime: 5 * 60 * 1000,
            // Cache time: 30 minutes before garbage collection
            gcTime: 30 * 60 * 1000,
            // Retry failed requests up to 3 times
            retry: 3,
            // Exponential backoff for retries
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Refetch on window focus (useful for keeping data fresh)
            refetchOnWindowFocus: true,
            // Don't refetch on mount if data is fresh
            refetchOnMount: true,
            // Refetch when reconnecting
            refetchOnReconnect: true,
          },
          mutations: {
            // Retry mutations once on failure
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export default QueryProvider;
