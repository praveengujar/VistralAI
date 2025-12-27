import { AlertTriangle, RefreshCw, XCircle, WifiOff, ServerCrash } from 'lucide-react';

type ErrorType = 'generic' | 'network' | 'server' | 'notFound' | 'permission';

interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | string;
  type?: ErrorType;
  onRetry?: () => void;
  className?: string;
}

const errorConfig: Record<
  ErrorType,
  { icon: typeof AlertTriangle; defaultTitle: string; defaultMessage: string }
> = {
  generic: {
    icon: AlertTriangle,
    defaultTitle: 'Something went wrong',
    defaultMessage: 'An unexpected error occurred. Please try again.',
  },
  network: {
    icon: WifiOff,
    defaultTitle: 'Connection error',
    defaultMessage: 'Unable to connect. Please check your internet connection.',
  },
  server: {
    icon: ServerCrash,
    defaultTitle: 'Server error',
    defaultMessage: 'The server encountered an error. Please try again later.',
  },
  notFound: {
    icon: XCircle,
    defaultTitle: 'Not found',
    defaultMessage: 'The requested resource could not be found.',
  },
  permission: {
    icon: XCircle,
    defaultTitle: 'Access denied',
    defaultMessage: "You don't have permission to access this resource.",
  },
};

export default function ErrorState({
  title,
  message,
  error,
  type = 'generic',
  onRetry,
  className = '',
}: ErrorStateProps) {
  const config = errorConfig[type];
  const IconComponent = config.icon;

  const displayTitle = title || config.defaultTitle;
  const displayMessage =
    message ||
    (error instanceof Error ? error.message : error) ||
    config.defaultMessage;

  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}
      style={{ backgroundColor: 'rgb(var(--surface))' }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: 'rgba(var(--error), 0.1)' }}
      >
        <IconComponent className="w-8 h-8 text-error-600" />
      </div>

      <h3
        className="text-lg font-semibold mb-2"
        style={{ color: 'rgb(var(--foreground))' }}
      >
        {displayTitle}
      </h3>

      <p
        className="text-sm max-w-md mb-4"
        style={{ color: 'rgb(var(--foreground-secondary))' }}
      >
        {displayMessage}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'rgb(var(--surface))',
            color: 'rgb(var(--primary))',
            border: '1px solid rgb(var(--primary))',
          }}
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      )}
    </div>
  );
}

/**
 * Inline error message for forms and small components
 */
export function InlineError({
  message,
  className = '',
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 text-sm ${className}`}
      style={{ color: 'rgb(var(--error))' }}
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}
