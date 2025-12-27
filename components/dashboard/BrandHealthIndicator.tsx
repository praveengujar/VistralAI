import React from 'react';
import { useTerminology } from '@/hooks/useTerminology';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

export type IndicatorType = 'recognition' | 'accuracy' | 'sentiment' | 'footprint' | 'voice';

interface BrandHealthIndicatorProps {
    type: IndicatorType;
    value: number | string;
    label: string;
    context: string;
    trend?: number;
    icon?: LucideIcon;
}

const BrandHealthIndicator: React.FC<BrandHealthIndicatorProps> = ({
    type,
    value,
    label,
    context,
    trend,
    icon: Icon
}) => {
    const { t } = useTerminology();

    const renderVisualization = () => {
        switch (type) {
            case 'recognition': // Spotlight/Stage
                return (
                    <div className="relative h-16 w-full flex items-center justify-center overflow-hidden rounded-lg" style={{ backgroundColor: 'rgb(var(--background-tertiary))' }}>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-brand-accent/30 blur-xl rounded-full" />
                        <motion.div
                            className="relative z-10 font-bold text-xl" style={{ color: 'rgb(var(--foreground))' }}
                            initial={{ scale: 0.9, opacity: 0.8 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                        >
                            {value}%
                        </motion.div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand-accent/50 blur-sm" />
                    </div>
                );
            case 'accuracy': // Alignment Meter
                const numValue = typeof value === 'number' ? value : parseInt(value as string);
                return (
                    <div className="h-16 w-full flex flex-col justify-center gap-2">
                        <div className="flex justify-between text-xs font-mono" style={{ color: 'rgb(var(--foreground-muted))' }}>
                            <span>AI Perception</span>
                            <span>Brand Truth</span>
                        </div>
                        <div className="relative h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgb(var(--background-tertiary))' }}>
                            <motion.div
                                className="absolute top-0 left-0 h-full bg-status-success"
                                initial={{ width: 0 }}
                                animate={{ width: `${numValue}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                            <div className="absolute top-0 right-0 h-full w-1" style={{ backgroundColor: 'rgb(var(--border))' }} /> {/* Target marker */}
                        </div>
                        <div className="text-right text-xs font-bold text-status-success">{value}% Match</div>
                    </div>
                );
            case 'sentiment': // Emotional Spectrum
                // Normalize -1 to 1 score to 0-100 for gradient position
                const sentimentScore = typeof value === 'number' ? value : 0;
                const position = ((sentimentScore + 1) / 2) * 100;
                return (
                    <div className="h-16 w-full flex flex-col justify-center">
                        <div className="h-2 w-full rounded-full bg-gradient-to-r from-status-danger via-secondary-300 to-status-success relative">
                            <motion.div
                                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-secondary-600 rounded-full shadow-sm"
                                style={{ backgroundColor: 'rgb(var(--surface))' }}
                                initial={{ left: '50%' }}
                                animate={{ left: `${position}%` }}
                                transition={{ type: "spring", stiffness: 100 }}
                            />
                        </div>
                        <div className="flex justify-between mt-2 text-xs" style={{ color: 'rgb(var(--foreground-muted))' }}>
                            <span>Negative</span>
                            <span>Positive</span>
                        </div>
                    </div>
                );
            case 'footprint': // Ripple Effect
                return (
                    <div className="relative h-16 w-full flex items-center justify-center">
                        {[1, 2, 3].map((i) => (
                            <motion.div
                                key={i}
                                className="absolute border border-brand-primary/20 rounded-full"
                                initial={{ width: 20, height: 20, opacity: 0.8 }}
                                animate={{ width: 60, height: 60, opacity: 0 }}
                                transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
                            />
                        ))}
                        <div className="relative z-10 font-mono font-bold text-brand-primary text-xl">
                            {value}
                        </div>
                    </div>
                );
            case 'voice': // Pie/Donut
                const voiceValue = typeof value === 'number' ? value : parseInt(value as string);
                return (
                    <div className="h-16 w-full flex items-center justify-center gap-4">
                        <div className="relative w-12 h-12">
                            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="rgb(var(--border))"
                                    strokeWidth="4"
                                />
                                <motion.path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="#1a365d" // Brand Primary
                                    strokeWidth="4"
                                    strokeDasharray={`${voiceValue}, 100`}
                                    initial={{ strokeDasharray: "0, 100" }}
                                    animate={{ strokeDasharray: `${voiceValue}, 100` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                />
                            </svg>
                        </div>
                        <div className="text-sm font-medium" style={{ color: 'rgb(var(--foreground))' }}>
                            <span className="text-lg font-bold">{voiceValue}%</span>
                            <span className="block text-xs" style={{ color: 'rgb(var(--foreground-muted))' }}>You</span>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <motion.div
            className="rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 group"
            style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}
            whileHover={{ y: -2 }}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="w-5 h-5 text-brand-primary/60" />}
                    <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--foreground))' }}>
                        {label}
                    </h3>
                </div>
                {trend && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend > 0 ? 'bg-status-success/10 text-status-success' : 'bg-status-warning/10 text-status-warning'
                        }`}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </span>
                )}
            </div>

            <div className="mb-4">
                {renderVisualization()}
            </div>

            <p className="text-sm leading-relaxed transition-colors" style={{ color: 'rgb(var(--foreground-secondary))' }}>
                {context}
            </p>
        </motion.div>
    );
};

export default BrandHealthIndicator;
