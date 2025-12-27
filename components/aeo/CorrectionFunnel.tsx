'use client';

import { motion } from 'framer-motion';
import { CorrectionWorkflowStatus } from '@/lib/services/agents/types';

interface FunnelData {
  suggested: number;
  approved: number;
  implemented: number;
  verified: number;
  dismissed?: number;
}

interface CorrectionFunnelProps {
  data: FunnelData;
  onStageClick?: (status: CorrectionWorkflowStatus) => void;
}

const STAGE_CONFIG: Record<CorrectionWorkflowStatus, { label: string; color: string; hoverColor: string; description: string }> = {
  suggested: {
    label: 'Suggested',
    color: 'bg-gray-400',
    hoverColor: 'hover:bg-gray-500',
    description: 'Awaiting review',
  },
  approved: {
    label: 'Approved',
    color: 'bg-accent-500',
    hoverColor: 'hover:bg-accent-600',
    description: 'Ready to implement',
  },
  implemented: {
    label: 'Implemented',
    color: 'bg-primary-500',
    hoverColor: 'hover:bg-primary-600',
    description: 'Changes applied',
  },
  verified: {
    label: 'Verified',
    color: 'bg-success-500',
    hoverColor: 'hover:bg-success-600',
    description: 'Impact measured',
  },
  dismissed: {
    label: 'Dismissed',
    color: 'bg-error-400',
    hoverColor: 'hover:bg-error-500',
    description: 'Not actioned',
  },
};

const STAGE_ORDER: CorrectionWorkflowStatus[] = ['suggested', 'approved', 'implemented', 'verified'];

export function CorrectionFunnel({ data, onStageClick }: CorrectionFunnelProps) {
  const total = data.suggested + data.approved + data.implemented + data.verified;
  const maxWidth = 100;
  const minWidth = 40;

  const getStageWidth = (count: number): number => {
    if (total === 0) return minWidth;
    const percentage = (count / total) * 100;
    return Math.max(minWidth, Math.min(maxWidth, percentage));
  };

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <span className="text-2xl mb-2">🔧</span>
        <p className="text-sm">No corrections in progress</p>
        <p className="text-xs text-gray-400">Create corrections from insights</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {STAGE_ORDER.map((status, index) => {
        const config = STAGE_CONFIG[status];
        const count = data[status] ?? 0;
        const width = getStageWidth(count);

        return (
          <motion.div
            key={status}
            className={`relative ${onStageClick ? 'cursor-pointer' : ''}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onStageClick?.(status)}
          >
            <div className="flex items-center gap-3">
              {/* Funnel bar */}
              <div
                className={`h-10 ${config.color} ${config.hoverColor} rounded-r-lg transition-all flex items-center justify-end pr-3`}
                style={{
                  width: `${width}%`,
                  marginLeft: `${(maxWidth - width) / 2}%`,
                }}
              >
                <span className="text-white font-semibold text-sm">{count}</span>
              </div>

              {/* Label */}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{config.label}</p>
                <p className="text-xs text-gray-500">{config.description}</p>
              </div>
            </div>

            {/* Connector line */}
            {index < STAGE_ORDER.length - 1 && (
              <div
                className="absolute left-1/2 -translate-x-1/2 w-0.5 h-3 bg-gray-200"
                style={{ top: '100%' }}
              />
            )}
          </motion.div>
        );
      })}

      {/* Dismissed count (if any) */}
      {data.dismissed && data.dismissed > 0 && (
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Dismissed</span>
            <span className="text-gray-600">{data.dismissed}</span>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Total Corrections</span>
          <span className="font-semibold text-gray-900">{total}</span>
        </div>
        {total > 0 && (
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-500">Completion Rate</span>
            <span className="font-semibold text-success-600">
              {((data.verified / total) * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default CorrectionFunnel;
