import React from 'react';
import { motion } from 'framer-motion';
import { Bell, TrendingUp, AlertTriangle, TrendingDown, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { useTerminology } from '@/hooks/useTerminology';

interface BrandMoment {
    id: string;
    type: 'market_shift' | 'story_correction' | 'attention_needed' | 'positive_momentum';
    title: string;
    description: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high';
    isNew: boolean;
}

interface BrandMomentsProps {
    moments: BrandMoment[];
}

const BrandMoments: React.FC<BrandMomentsProps> = ({ moments }) => {
    const { t } = useTerminology();

    const getMomentIcon = (type: string) => {
        switch (type) {
            case 'market_shift': return <TrendingUp className="w-5 h-5 text-blue-500" />;
            case 'story_correction': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
            case 'attention_needed': return <TrendingDown className="w-5 h-5 text-red-500" />;
            case 'positive_momentum': return <CheckCircle className="w-5 h-5 text-green-500" />;
            default: return <Bell className="w-5 h-5 text-gray-500" />;
        }
    };

    const getMomentLabel = (type: string) => {
        switch (type) {
            case 'market_shift': return 'Market Shift';
            case 'story_correction': return 'Story Correction Needed';
            case 'attention_needed': return 'Attention Needed';
            case 'positive_momentum': return 'Positive Momentum';
            default: return 'Brand Moment';
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-serif font-bold" style={{ color: 'rgb(var(--foreground))' }}>Brand Moments</h2>
                    <p className="mt-2" style={{ color: 'rgb(var(--foreground-secondary))' }}>Important events in your brand&apos;s AI journey that require attention.</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn-secondary text-sm">
                        Filter by Type
                    </button>
                    <button className="btn-secondary text-sm">
                        Mark All Read
                    </button>
                </div>
            </div>

            {/* Moments List */}
            <div className="space-y-4">
                {moments.map((moment, index) => (
                    <motion.div
                        key={moment.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="rounded-xl border p-6 hover:shadow-md transition-shadow relative overflow-hidden"
                        style={{
                            backgroundColor: 'rgb(var(--surface))',
                            borderColor: moment.isNew ? 'rgba(var(--primary-rgb), 0.3)' : 'rgb(var(--border))'
                        }}
                    >
                        {moment.isNew && (
                            <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary" />
                        )}

                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Icon */}
                            <div className="shrink-0">
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center border"
                                    style={{
                                        backgroundColor: moment.isNew ? 'rgba(var(--primary-rgb), 0.05)' : 'rgb(var(--background-secondary))',
                                        borderColor: moment.isNew ? 'rgba(var(--primary-rgb), 0.1)' : 'rgb(var(--border))'
                                    }}
                                >
                                    {getMomentIcon(moment.type)}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgb(var(--foreground-muted))' }}>
                                        {getMomentLabel(moment.type)}
                                    </span>
                                    <span className="text-xs flex items-center gap-1" style={{ color: 'rgb(var(--foreground-muted))' }}>
                                        <Clock className="w-3 h-3" /> {moment.timestamp}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold mb-2" style={{ color: 'rgb(var(--foreground))' }}>{moment.title}</h3>
                                <p className="mb-4" style={{ color: 'rgb(var(--foreground-secondary))' }}>{moment.description}</p>

                                {/* Action Area */}
                                <div className="flex gap-3">
                                    <button className="text-sm font-medium text-brand-primary hover:text-brand-primary-600 flex items-center gap-1">
                                        Take Action <ArrowRight className="w-4 h-4" />
                                    </button>
                                    <button className="text-sm font-medium" style={{ color: 'rgb(var(--foreground-muted))' }}>
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default BrandMoments;
