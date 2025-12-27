import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: { container: 'py-4', icon: 'w-6 h-6', title: 'text-sm', desc: 'text-xs' },
  md: { container: 'py-8', icon: 'w-8 h-8', title: 'text-base', desc: 'text-sm' },
  lg: { container: 'py-12', icon: 'w-12 h-12', title: 'text-lg', desc: 'text-sm' },
};

export default function LoadingState({
  title = 'Loading...',
  description,
  size = 'md',
  className = '',
}: LoadingStateProps) {
  const sizes = sizeMap[size];

  return (
    <div
      className={`flex flex-col items-center justify-center ${sizes.container} ${className}`}
    >
      <Loader2
        className={`${sizes.icon} animate-spin mb-3`}
        style={{ color: 'rgb(var(--primary))' }}
      />

      <p
        className={`${sizes.title} font-medium`}
        style={{ color: 'rgb(var(--foreground))' }}
      >
        {title}
      </p>

      {description && (
        <p
          className={`${sizes.desc} mt-1`}
          style={{ color: 'rgb(var(--foreground-secondary))' }}
        >
          {description}
        </p>
      )}
    </div>
  );
}

/**
 * Skeleton loader for content placeholders
 */
export function Skeleton({
  className = '',
  width,
  height,
}: {
  className?: string;
  width?: string | number;
  height?: string | number;
}) {
  return (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{
        backgroundColor: 'rgb(var(--border))',
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

/**
 * Card skeleton for loading states
 */
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-lg p-6 ${className}`}
      style={{
        backgroundColor: 'rgb(var(--surface))',
        border: '1px solid rgb(var(--border))',
      }}
    >
      <Skeleton className="h-4 w-1/3 mb-4" />
      <Skeleton className="h-8 w-1/2 mb-2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

/**
 * Table skeleton for loading states
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  className = '',
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg overflow-hidden ${className}`}
      style={{
        backgroundColor: 'rgb(var(--surface))',
        border: '1px solid rgb(var(--border))',
      }}
    >
      {/* Header */}
      <div
        className="flex gap-4 p-4"
        style={{ borderBottom: '1px solid rgb(var(--border))' }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-4 p-4"
          style={{
            borderBottom:
              rowIndex < rows - 1 ? '1px solid rgb(var(--border))' : 'none',
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
