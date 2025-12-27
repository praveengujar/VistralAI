import { Alert } from '@/types';
import { AlertCircle, X } from 'lucide-react';

interface AlertBannerProps {
  alerts: Alert[];
  onDismiss?: (id: string) => void;
}

export default function AlertBanner({ alerts, onDismiss }: AlertBannerProps) {
  const activeAlerts = alerts.filter((alert) => alert.status === 'active');

  if (activeAlerts.length === 0) return null;

  const severityColors = {
    low: 'bg-info-500/10 border-info-500/30 text-info-700 dark:text-info-300',
    medium: 'bg-warning-500/10 border-warning-500/30 text-warning-700 dark:text-warning-300',
    high: 'bg-warning-600/10 border-warning-600/30 text-warning-800 dark:text-warning-200',
    critical: 'bg-error-500/10 border-error-500/30 text-error-700 dark:text-error-300',
  };

  return (
    <div className="space-y-2 mb-6">
      {activeAlerts.slice(0, 3).map((alert) => (
        <div
          key={alert.id}
          className={`flex items-start justify-between p-4 border rounded-lg ${
            severityColors[alert.severity]
          }`}
        >
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">{alert.title}</p>
              <p className="text-sm mt-1">{alert.description}</p>
            </div>
          </div>

          {onDismiss && (
            <button
              onClick={() => onDismiss(alert.id)}
              className="ml-4 flex-shrink-0 hover:opacity-70 transition-opacity"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
