import { FileQuestion, Search, Database, AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: 'search' | 'database' | 'file' | 'alert' | React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const iconMap: Record<'search' | 'database' | 'file' | 'alert', typeof Search> = {
  search: Search,
  database: Database,
  file: FileQuestion,
  alert: AlertCircle,
};

export default function EmptyState({
  title,
  description,
  icon = 'file',
  action,
  className = '',
}: EmptyStateProps) {
  const IconComponent = typeof icon === 'string' && icon in iconMap ? iconMap[icon as keyof typeof iconMap] : null;

  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}
      style={{ backgroundColor: 'rgb(var(--surface))' }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: 'rgb(var(--background))' }}
      >
        {IconComponent ? (
          <IconComponent
            className="w-8 h-8"
            style={{ color: 'rgb(var(--foreground-muted))' }}
          />
        ) : (
          icon
        )}
      </div>

      <h3
        className="text-lg font-semibold mb-2"
        style={{ color: 'rgb(var(--foreground))' }}
      >
        {title}
      </h3>

      {description && (
        <p
          className="text-sm max-w-md mb-4"
          style={{ color: 'rgb(var(--foreground-secondary))' }}
        >
          {description}
        </p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'rgb(var(--primary))',
            color: 'white',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
