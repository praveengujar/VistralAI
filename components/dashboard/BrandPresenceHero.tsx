import React from 'react';
import { useTerminology } from '@/hooks/useTerminology';
import { motion } from 'framer-motion';

interface BrandPresenceHeroProps {
    brandName: string;
    brandTagline?: string;
    industry?: string;
    brandPulse: number;
    pulseTrend: number;
    platformPresence: {
        platform: 'chatgpt' | 'gemini' | 'claude' | 'perplexity' | 'meta';
        score: number;
    }[];
}

const BrandPresenceHero: React.FC<BrandPresenceHeroProps> = ({
    brandName,
    brandTagline = "Leading the conversation in your industry",
    industry = "Industry Leader",
    brandPulse,
    pulseTrend,
    platformPresence
}) => {
    const { t } = useTerminology();

    const getPulseColor = (score: number) => {
        if (score >= 80) return 'text-brand-pulse-high border-brand-pulse-high';
        if (score >= 50) return 'text-brand-pulse-medium border-brand-pulse-medium';
        return 'text-brand-pulse-low border-brand-pulse-low';
    };

    const getPulseBg = (score: number) => {
        if (score >= 80) return 'bg-brand-pulse-high';
        if (score >= 50) return 'bg-brand-pulse-medium';
        return 'bg-brand-pulse-low';
    };

    return (
        <div className="rounded-2xl shadow-sm p-8 mb-8 relative overflow-hidden" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">

                {/* 1. Brand Identity Display */}
                <div className="lg:col-span-5 space-y-4">
                    <div>
                        <span className="inline-block px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-semibold tracking-wide uppercase mb-2">
                            {industry}
                        </span>
                        <h1 className="text-4xl font-serif font-bold leading-tight" style={{ color: 'rgb(var(--foreground))' }}>
                            {brandName}
                        </h1>
                        <p className="text-lg italic font-serif" style={{ color: 'rgb(var(--foreground-secondary))' }}>
                            &quot;{brandTagline}&quot;
                        </p>
                    </div>

                    {/* 3. Quick Narrative Summary */}
                    <div className="rounded-xl p-4" style={{ backgroundColor: 'rgb(var(--background-secondary))', border: '1px solid rgb(var(--border))' }}>
                        <p className="leading-relaxed" style={{ color: 'rgb(var(--foreground-secondary))' }}>
                            Today, <span className="font-semibold text-brand-primary">{brandName}</span> is being recommended in
                            <span className="font-bold" style={{ color: 'rgb(var(--foreground))' }}> {brandPulse}%</span> of relevant AI conversations,
                            <span className={`font-medium ${pulseTrend >= 0 ? 'text-status-success' : 'text-status-warning'}`}>
                                {' '}{pulseTrend >= 0 ? 'up' : 'down'} {Math.abs(pulseTrend)}%
                            </span> from last week.
                        </p>
                    </div>
                </div>

                {/* 2. Brand Pulse Metric */}
                <div className="lg:col-span-3 flex flex-col items-center justify-center">
                    <div className="relative w-48 h-48 flex items-center justify-center">
                        {/* Pulsing Rings */}
                        <motion.div
                            className={`absolute inset-0 rounded-full border-4 opacity-20 ${getPulseColor(brandPulse)}`}
                            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.1, 0.2] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <motion.div
                            className={`absolute inset-4 rounded-full border-4 opacity-40 ${getPulseColor(brandPulse)}`}
                            animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.2, 0.4] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        />

                        {/* Central Score */}
                        <div className="relative z-10 text-center">
                            <span className="block text-5xl font-bold font-mono tracking-tighter" style={{ color: 'rgb(var(--foreground))' }}>
                                {brandPulse}
                            </span>
                            <span className="block text-sm font-medium mt-1 uppercase tracking-wider" style={{ color: 'rgb(var(--foreground-muted))' }}>
                                {t('Brand Pulse')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 4. Platform Presence Strip */}
                <div className="lg:col-span-4 space-y-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgb(var(--foreground-muted))' }}>
                        Platform Presence
                    </h3>
                    <div className="space-y-4">
                        {platformPresence.map((p) => (
                            <div key={p.platform} className="group">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium capitalize flex items-center gap-2" style={{ color: 'rgb(var(--foreground-secondary))' }}>
                                        <span className={`w-2 h-2 rounded-full bg-ai-${p.platform}`} />
                                        {p.platform}
                                    </span>
                                    <span className="text-sm font-mono" style={{ color: 'rgb(var(--foreground-muted))' }}>{p.score}%</span>
                                </div>
                                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgb(var(--background-tertiary))' }}>
                                    <motion.div
                                        className={`h-full bg-ai-${p.platform}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${p.score}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BrandPresenceHero;
