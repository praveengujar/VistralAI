'use client';

import { ReactNode } from 'react';
import EmptyState from './EmptyState';
import LoadingState, { CardSkeleton, TableSkeleton, Skeleton } from './LoadingState';
import ErrorState from './ErrorState';

interface DataWrapperProps<T> {
  /** Data to display (null/undefined means empty state) */
  data: T | null | undefined;
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: Error | string | null;
  /** Render function when data is available */
  children: (data: T) => ReactNode;
  /** Empty state configuration */
  emptyState?: {
    title: string;
    description?: string;
    icon?: 'search' | 'database' | 'file' | 'alert' | ReactNode;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  /** Loading state configuration */
  loadingState?: {
    title?: string;
    description?: string;
    size?: 'sm' | 'md' | 'lg';
    skeleton?: 'card' | 'table' | 'custom';
    skeletonConfig?: {
      rows?: number;
      columns?: number;
    };
  };
  /** Error state configuration */
  errorState?: {
    title?: string;
    type?: 'generic' | 'network' | 'server' | 'notFound' | 'permission';
  };
  /** Retry function for error state */
  onRetry?: () => void;
  /** Custom check for empty data (default: null/undefined/empty array) */
  isEmpty?: (data: T | null | undefined) => boolean;
  /** Container className */
  className?: string;
}

/**
 * DataWrapper - Handles loading, error, and empty states for data display
 *
 * Usage:
 * ```tsx
 * <DataWrapper
 *   data={profile}
 *   isLoading={isLoading}
 *   error={error}
 *   emptyState={{
 *     title: 'No profile found',
 *     description: 'Complete the Magic Import to create your brand profile.',
 *     action: { label: 'Start Import', onClick: handleImport }
 *   }}
 *   onRetry={refetch}
 * >
 *   {(data) => <ProfileView profile={data} />}
 * </DataWrapper>
 * ```
 */
export default function DataWrapper<T>({
  data,
  isLoading = false,
  error,
  children,
  emptyState,
  loadingState,
  errorState,
  onRetry,
  isEmpty,
  className = '',
}: DataWrapperProps<T>) {
  // Check loading state
  if (isLoading) {
    if (loadingState?.skeleton === 'card') {
      return <CardSkeleton className={className} />;
    }
    if (loadingState?.skeleton === 'table') {
      return (
        <TableSkeleton
          rows={loadingState.skeletonConfig?.rows}
          columns={loadingState.skeletonConfig?.columns}
          className={className}
        />
      );
    }
    return (
      <LoadingState
        title={loadingState?.title}
        description={loadingState?.description}
        size={loadingState?.size}
        className={className}
      />
    );
  }

  // Check error state
  if (error) {
    return (
      <ErrorState
        title={errorState?.title}
        error={error}
        type={errorState?.type}
        onRetry={onRetry}
        className={className}
      />
    );
  }

  // Check empty state
  const dataIsEmpty = isEmpty
    ? isEmpty(data)
    : data === null ||
      data === undefined ||
      (Array.isArray(data) && data.length === 0);

  if (dataIsEmpty) {
    return (
      <EmptyState
        title={emptyState?.title || 'No data available'}
        description={emptyState?.description}
        icon={emptyState?.icon}
        action={emptyState?.action}
        className={className}
      />
    );
  }

  // Render children with data
  return <>{children(data as T)}</>;
}

/**
 * Simplified wrapper for list data
 */
export function ListWrapper<T>({
  items,
  isLoading = false,
  error,
  children,
  emptyTitle,
  emptyDescription,
  emptyAction,
  onRetry,
  className = '',
}: {
  items: T[] | null | undefined;
  isLoading?: boolean;
  error?: Error | string | null;
  children: (items: T[]) => ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; onClick: () => void };
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <DataWrapper
      data={items}
      isLoading={isLoading}
      error={error}
      emptyState={{
        title: emptyTitle || 'No items found',
        description: emptyDescription,
        icon: 'search',
        action: emptyAction,
      }}
      loadingState={{ skeleton: 'table' }}
      onRetry={onRetry}
      className={className}
    >
      {children}
    </DataWrapper>
  );
}

// Re-export skeleton components for direct use
export { Skeleton, CardSkeleton, TableSkeleton };
