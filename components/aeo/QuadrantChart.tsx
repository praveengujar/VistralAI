'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { QuadrantPosition } from '@/lib/services/agents/types';

interface QuadrantChartProps {
  accuracy: number; // 0-100
  visibility: number; // 0-100
  quadrant: QuadrantPosition;
  previousPosition?: { accuracy: number; visibility: number };
  onQuadrantClick?: (quadrant: QuadrantPosition) => void;
  size?: 'sm' | 'md' | 'lg';
}

const QUADRANT_COLORS = {
  dominant: { bg: 'bg-success-100', border: 'border-success-500', text: 'text-success-700' },
  niche: { bg: 'bg-accent-100', border: 'border-accent-500', text: 'text-accent-700' },
  vulnerable: { bg: 'bg-warning-100', border: 'border-warning-500', text: 'text-warning-700' },
  invisible: { bg: 'bg-error-100', border: 'border-error-500', text: 'text-error-700' },
};

const QUADRANT_LABELS = {
  dominant: { label: 'DOMINANT', description: 'AI Champion' },
  niche: { label: 'NICHE', description: 'Hidden Gem' },
  vulnerable: { label: 'VULNERABLE', description: 'At Risk' },
  invisible: { label: 'INVISIBLE', description: 'Needs Work' },
};

const SIZE_CONFIG = {
  sm: { container: 200, dot: 12, fontSize: 'text-xs' },
  md: { container: 300, dot: 16, fontSize: 'text-sm' },
  lg: { container: 400, dot: 20, fontSize: 'text-base' },
};

export function QuadrantChart({
  accuracy,
  visibility,
  quadrant,
  previousPosition,
  onQuadrantClick,
  size = 'md',
}: QuadrantChartProps) {
  const config = SIZE_CONFIG[size];

  // Calculate position within the chart (0-100 maps to 0-100% of chart area)
  const position = useMemo(() => {
    const x = Math.min(Math.max(visibility, 0), 100);
    const y = 100 - Math.min(Math.max(accuracy, 0), 100); // Invert Y since CSS Y increases downward
    return { x, y };
  }, [accuracy, visibility]);

  const previousPos = useMemo(() => {
    if (!previousPosition) return null;
    const x = Math.min(Math.max(previousPosition.visibility, 0), 100);
    const y = 100 - Math.min(Math.max(previousPosition.accuracy, 0), 100);
    return { x, y };
  }, [previousPosition]);

  const getQuadrantForClick = (clientX: number, clientY: number, rect: DOMRect) => {
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    if (y < 50) {
      return x < 50 ? 'niche' : 'dominant';
    } else {
      return x < 50 ? 'invisible' : 'vulnerable';
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onQuadrantClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickedQuadrant = getQuadrantForClick(e.clientX, e.clientY, rect);
    onQuadrantClick(clickedQuadrant);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative rounded-lg overflow-hidden cursor-pointer"
        style={{ width: config.container, height: config.container, border: '2px solid rgb(var(--border))' }}
        onClick={handleClick}
      >
        {/* Quadrant backgrounds */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          {/* Top-Left: Niche */}
          <div
            className={`${QUADRANT_COLORS.niche.bg} flex items-center justify-center opacity-50 hover:opacity-70 transition-opacity`}
            style={{ borderRight: '1px solid rgb(var(--border))', borderBottom: '1px solid rgb(var(--border))' }}
          >
            <span className={`${config.fontSize} font-medium ${QUADRANT_COLORS.niche.text}`}>
              {QUADRANT_LABELS.niche.label}
            </span>
          </div>
          {/* Top-Right: Dominant */}
          <div
            className={`${QUADRANT_COLORS.dominant.bg} flex items-center justify-center opacity-50 hover:opacity-70 transition-opacity`}
            style={{ borderBottom: '1px solid rgb(var(--border))' }}
          >
            <span className={`${config.fontSize} font-medium ${QUADRANT_COLORS.dominant.text}`}>
              {QUADRANT_LABELS.dominant.label}
            </span>
          </div>
          {/* Bottom-Left: Invisible */}
          <div
            className={`${QUADRANT_COLORS.invisible.bg} flex items-center justify-center opacity-50 hover:opacity-70 transition-opacity`}
            style={{ borderRight: '1px solid rgb(var(--border))' }}
          >
            <span className={`${config.fontSize} font-medium ${QUADRANT_COLORS.invisible.text}`}>
              {QUADRANT_LABELS.invisible.label}
            </span>
          </div>
          {/* Bottom-Right: Vulnerable */}
          <div
            className={`${QUADRANT_COLORS.vulnerable.bg} flex items-center justify-center opacity-50 hover:opacity-70 transition-opacity`}
          >
            <span className={`${config.fontSize} font-medium ${QUADRANT_COLORS.vulnerable.text}`}>
              {QUADRANT_LABELS.vulnerable.label}
            </span>
          </div>
        </div>

        {/* Axis lines */}
        <div className="absolute top-1/2 left-0 right-0 h-px" style={{ backgroundColor: 'rgb(var(--border))' }} />
        <div className="absolute left-1/2 top-0 bottom-0 w-px" style={{ backgroundColor: 'rgb(var(--border))' }} />

        {/* Trail from previous position */}
        {previousPos && (
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%' }}
          >
            <motion.line
              x1={`${previousPos.x}%`}
              y1={`${previousPos.y}%`}
              x2={`${position.x}%`}
              y2={`${position.y}%`}
              stroke="#6366f1"
              strokeWidth="2"
              strokeDasharray="4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.6 }}
              transition={{ duration: 1, delay: 0.3 }}
            />
            {/* Previous position marker */}
            <circle
              cx={`${previousPos.x}%`}
              cy={`${previousPos.y}%`}
              r="4"
              fill="#94a3b8"
              opacity="0.5"
            />
          </svg>
        )}

        {/* Current position dot */}
        <motion.div
          className={`absolute rounded-full shadow-lg border-2 border-white ${
            quadrant === 'dominant'
              ? 'bg-success-500'
              : quadrant === 'niche'
                ? 'bg-accent-500'
                : quadrant === 'vulnerable'
                  ? 'bg-warning-500'
                  : 'bg-error-500'
          }`}
          style={{
            width: config.dot,
            height: config.dot,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{
            left: previousPos ? `${previousPos.x}%` : `${position.x}%`,
            top: previousPos ? `${previousPos.y}%` : `${position.y}%`,
            scale: 0,
          }}
          animate={{
            left: `${position.x}%`,
            top: `${position.y}%`,
            scale: 1,
          }}
          transition={{
            duration: 0.8,
            type: 'spring',
            stiffness: 100,
            damping: 15,
          }}
        >
          {/* Pulse effect */}
          <motion.div
            className={`absolute inset-0 rounded-full ${
              quadrant === 'dominant'
                ? 'bg-success-500'
                : quadrant === 'niche'
                  ? 'bg-accent-500'
                  : quadrant === 'vulnerable'
                    ? 'bg-warning-500'
                    : 'bg-error-500'
            }`}
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>

        {/* Axis labels */}
        <div className={`absolute -bottom-6 left-1/2 transform -translate-x-1/2 ${config.fontSize}`} style={{ color: 'rgb(var(--foreground-muted))' }}>
          Visibility
        </div>
        <div className={`absolute top-1/2 -left-6 transform -translate-y-1/2 -rotate-90 ${config.fontSize}`} style={{ color: 'rgb(var(--foreground-muted))' }}>
          Accuracy
        </div>
      </div>

      {/* Legend */}
      <div className={`flex flex-col items-center gap-1 ${config.fontSize}`}>
        <div className={`font-semibold ${QUADRANT_COLORS[quadrant].text}`}>
          {QUADRANT_LABELS[quadrant].label}
        </div>
        <div style={{ color: 'rgb(var(--foreground-muted))' }}>{QUADRANT_LABELS[quadrant].description}</div>
        <div className="text-xs" style={{ color: 'rgb(var(--foreground-muted))' }}>
          Accuracy: {accuracy.toFixed(0)}% | Visibility: {visibility.toFixed(0)}%
        </div>
      </div>
    </div>
  );
}

export default QuadrantChart;
