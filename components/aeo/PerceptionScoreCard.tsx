'use client';

import { motion } from 'framer-motion';
import { QuadrantPosition } from '@/lib/services/agents/types';
import { formatDistanceToNow } from 'date-fns';

interface PerceptionScoreCardProps {
  overallScore: number;
  previousScore?: number;
  quadrant: QuadrantPosition;
  lastScanAt?: Date;
  scanCount?: number;
  onStartScan?: () => void;
  onViewDetails?: () => void;
}

const QUADRANT_CONFIG = {
  dominant: {
    label: 'DOMINANT',
    description: 'AI Champion',
    color: 'text-success-600',
    bg: 'bg-success-50',
    border: 'border-success-200',
    icon: '🏆',
  },
  niche: {
    label: 'NICHE',
    description: 'Hidden Gem',
    color: 'text-accent-600',
    bg: 'bg-accent-50',
    border: 'border-accent-200',
    icon: '💎',
  },
  vulnerable: {
    label: 'VULNERABLE',
    description: 'At Risk',
    color: 'text-warning-600',
    bg: 'bg-warning-50',
    border: 'border-warning-200',
    icon: '⚠️',
  },
  invisible: {
    label: 'INVISIBLE',
    description: 'Needs Work',
    color: 'text-error-600',
    bg: 'bg-error-50',
    border: 'border-error-200',
    icon: '👻',
  },
};

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-success-600';
  if (score >= 50) return 'text-warning-600';
  return 'text-error-600';
}

function getScoreBg(score: number): string {
  if (score >= 70) return 'from-success-500 to-success-600';
  if (score >= 50) return 'from-warning-500 to-warning-600';
  return 'from-error-500 to-error-600';
}

export function PerceptionScoreCard({
  overallScore,
  previousScore,
  quadrant,
  lastScanAt,
  scanCount,
  onStartScan,
  onViewDetails,
}: PerceptionScoreCardProps) {
  const config = QUADRANT_CONFIG[quadrant];
  const scoreChange = previousScore ? overallScore - previousScore : null;

  return (
    <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Score Display */}
          <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0">
            <motion.div
              className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br ${getScoreBg(overallScore)} flex items-center justify-center shadow-lg flex-shrink-0`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <div className="text-white text-center">
                <motion.span
                  className="text-2xl sm:text-3xl font-bold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {overallScore.toFixed(0)}
                </motion.span>
                <p className="text-[10px] sm:text-xs opacity-80">/ 100</p>
              </div>
              {/* Score change badge */}
              {scoreChange !== null && (
                <motion.div
                  className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-semibold ${
                    scoreChange > 0
                      ? 'bg-success-100 text-success-700'
                      : scoreChange < 0
                        ? 'bg-error-100 text-error-700'
                        : ''
                  }`}
                  style={scoreChange === 0 ? { backgroundColor: 'rgb(var(--background-secondary))', color: 'rgb(var(--foreground-secondary))' } : {}}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {scoreChange > 0 ? '+' : ''}
                  {scoreChange.toFixed(0)}
                </motion.div>
              )}
            </motion.div>

            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-semibold" style={{ color: 'rgb(var(--foreground))' }}>AI Perception Score</h2>
              <p className="text-xs sm:text-sm mt-1" style={{ color: 'rgb(var(--foreground-muted))' }}>
                Your brand&apos;s visibility and accuracy across AI platforms
              </p>
              {lastScanAt && (
                <p className="text-xs mt-2" style={{ color: 'rgb(var(--foreground-muted))' }}>
                  Last scan: {formatDistanceToNow(lastScanAt, { addSuffix: true })}
                </p>
              )}
            </div>
          </div>

          {/* Quadrant Badge */}
          <motion.div
            className={`${config.bg} ${config.border} border rounded-xl p-3 text-center min-w-[100px] flex-shrink-0`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-xl mb-1 block">{config.icon}</span>
            <p className={`text-sm font-bold ${config.color} truncate`} title={config.label}>{config.label}</p>
            <p className="text-xs truncate" style={{ color: 'rgb(var(--foreground-muted))' }} title={config.description}>{config.description}</p>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          {onStartScan && (
            <button
              onClick={onStartScan}
              className="flex-1 btn-primary py-2.5 text-sm font-medium"
            >
              Start New Scan
            </button>
          )}
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="flex-1 btn-secondary py-2.5 text-sm font-medium"
            >
              View Details
            </button>
          )}
        </div>

        {/* Stats Row */}
        {scanCount !== undefined && (
          <div className="flex items-center justify-center gap-6 mt-4 pt-4" style={{ borderTop: '1px solid rgb(var(--border))' }}>
            <div className="text-center">
              <p className="text-lg font-semibold" style={{ color: 'rgb(var(--foreground))' }}>{scanCount}</p>
              <p className="text-xs" style={{ color: 'rgb(var(--foreground-muted))' }}>Total Scans</p>
            </div>
            <div className="w-px h-8" style={{ backgroundColor: 'rgb(var(--border))' }} />
            <div className="text-center">
              <p className={`text-lg font-semibold ${getScoreColor(overallScore)}`}>
                {overallScore >= 70 ? 'Good' : overallScore >= 50 ? 'Fair' : 'Poor'}
              </p>
              <p className="text-xs" style={{ color: 'rgb(var(--foreground-muted))' }}>Overall Health</p>
            </div>
            <div className="w-px h-8" style={{ backgroundColor: 'rgb(var(--border))' }} />
            <div className="text-center">
              <p className={`text-lg font-semibold ${config.color}`}>
                {config.label}
              </p>
              <p className="text-xs" style={{ color: 'rgb(var(--foreground-muted))' }}>Quadrant</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PerceptionScoreCard;
