import React, { useState } from 'react';
import { useTerminology } from '@/hooks/useTerminology';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';

interface Competitor {
    id: string;
    name: string;
    presence: number; // 0-100
    threatLevel: 'direct' | 'indirect' | 'aspirational';
    overlap: number; // 0-100
    story: string;
    strengths: string[];
    weaknesses: string[];
    recentMoment?: string;
}

interface MarketLandscapeProps {
    userBrand: {
        name: string;
        presence: number;
    };
    competitors: Competitor[];
}

const MarketLandscape: React.FC<MarketLandscapeProps> = ({ userBrand, competitors }) => {
    const { t } = useTerminology();
    const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);

    // Helper to calculate position in orbit
    const getOrbitPosition = (index: number, total: number, radius: number) => {
        const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
        return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
        };
    };

    const directCompetitors = competitors.filter(c => c.threatLevel === 'direct');
    const indirectCompetitors = competitors.filter(c => c.threatLevel === 'indirect');
    const aspirationalCompetitors = competitors.filter(c => c.threatLevel === 'aspirational');

    return (
        <div className="rounded-2xl shadow-sm p-8 mb-8" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-serif font-bold" style={{ color: 'rgb(var(--foreground))' }}>Your Market Universe</h2>
                    <p className="mt-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>
                        {t('Market Awareness')} - {competitors.length} brands sharing your stage
                    </p>
                </div>
                <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-error-500/20 border border-error-500" />
                        <span style={{ color: 'rgb(var(--foreground-secondary))' }}>Direct Threat</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-warning-500/20 border border-warning-500" />
                        <span style={{ color: 'rgb(var(--foreground-secondary))' }}>Indirect</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-accent-500/20 border border-accent-500" />
                        <span style={{ color: 'rgb(var(--foreground-secondary))' }}>Aspirational</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* 1. Universe Visualization */}
                <div className="lg:col-span-7 relative h-[500px] rounded-xl overflow-hidden border flex items-center justify-center" style={{ backgroundColor: 'rgb(var(--background-secondary))', borderColor: 'rgb(var(--border))' }}>
                    {/* Orbits */}
                    <div className="absolute border border-dashed rounded-full w-[200px] h-[200px]" style={{ borderColor: 'rgb(var(--border))' }} /> {/* Direct */}
                    <div className="absolute border border-dashed rounded-full w-[350px] h-[350px]" style={{ borderColor: 'rgb(var(--border))' }} /> {/* Indirect */}
                    <div className="absolute border border-dashed rounded-full w-[480px] h-[480px]" style={{ borderColor: 'rgb(var(--border))' }} /> {/* Aspirational */}

                    {/* User Brand (Center) */}
                    <motion.div
                        className="relative z-20 w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center shadow-lg border-4 border-white"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    >
                        <span className="text-white font-bold text-center text-sm px-2">{userBrand.name}</span>
                        <div className="absolute -bottom-6 text-xs font-bold text-primary-600">{userBrand.presence}% Pulse</div>
                    </motion.div>

                    {/* Competitors */}
                    {directCompetitors.map((comp, i) => {
                        const pos = getOrbitPosition(i, directCompetitors.length, 100);
                        return (
                            <CompetitorNode
                                key={comp.id}
                                competitor={comp}
                                x={pos.x}
                                y={pos.y}
                                color="bg-error-500"
                                onClick={() => setSelectedCompetitor(comp)}
                                isSelected={selectedCompetitor?.id === comp.id}
                            />
                        );
                    })}

                    {indirectCompetitors.map((comp, i) => {
                        const pos = getOrbitPosition(i, indirectCompetitors.length, 175);
                        return (
                            <CompetitorNode
                                key={comp.id}
                                competitor={comp}
                                x={pos.x}
                                y={pos.y}
                                color="bg-warning-500"
                                onClick={() => setSelectedCompetitor(comp)}
                                isSelected={selectedCompetitor?.id === comp.id}
                            />
                        );
                    })}

                    {aspirationalCompetitors.map((comp, i) => {
                        const pos = getOrbitPosition(i, aspirationalCompetitors.length, 240);
                        return (
                            <CompetitorNode
                                key={comp.id}
                                competitor={comp}
                                x={pos.x}
                                y={pos.y}
                                color="bg-accent-500"
                                onClick={() => setSelectedCompetitor(comp)}
                                isSelected={selectedCompetitor?.id === comp.id}
                            />
                        );
                    })}
                </div>

                {/* 2. Brand Battlecard & Details */}
                <div className="lg:col-span-5 space-y-6">
                    <AnimatePresence mode="wait">
                        {selectedCompetitor ? (
                            <motion.div
                                key="battlecard"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="rounded-xl border p-6 h-full"
                                style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold" style={{ color: 'rgb(var(--foreground))' }}>{selectedCompetitor.name}</h3>
                                        <span className="text-sm capitalize" style={{ color: 'rgb(var(--foreground-muted))' }}>{selectedCompetitor.threatLevel} Competitor</span>
                                    </div>
                                    <button
                                        onClick={() => setSelectedCompetitor(null)}
                                        className="text-secondary-400 hover:text-secondary-600"
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Comparison Stats */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 rounded-lg text-center" style={{ backgroundColor: 'rgb(var(--background-secondary))' }}>
                                            <div className="text-xs mb-1" style={{ color: 'rgb(var(--foreground-muted))' }}>Their Pulse</div>
                                            <div className="text-xl font-bold" style={{ color: 'rgb(var(--foreground))' }}>{selectedCompetitor.presence}%</div>
                                        </div>
                                        <div className="p-3 bg-primary-600/5 rounded-lg text-center">
                                            <div className="text-xs mb-1" style={{ color: 'rgb(var(--foreground-muted))' }}>Your Pulse</div>
                                            <div className="text-xl font-bold text-primary-600">{userBrand.presence}%</div>
                                        </div>
                                    </div>

                                    {/* AI Story */}
                                    <div>
                                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'rgb(var(--foreground))' }}>
                                            <Info className="w-4 h-4" />
                                            How AI Describes Them
                                        </h4>
                                        <p className="text-sm italic p-3 rounded-lg border" style={{ color: 'rgb(var(--foreground-secondary))', backgroundColor: 'rgb(var(--background-secondary))', borderColor: 'rgb(var(--border))' }}>
                                            &quot;{selectedCompetitor.story}&quot;
                                        </p>
                                    </div>

                                    {/* Battlecard Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="text-xs font-bold text-status-success uppercase tracking-wide mb-2">Where You Win</h4>
                                            <ul className="space-y-1">
                                                {selectedCompetitor.weaknesses.map((w, i) => (
                                                    <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'rgb(var(--foreground-secondary))' }}>
                                                        <ArrowUpRight className="w-4 h-4 text-status-success shrink-0" />
                                                        {w}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-status-warning uppercase tracking-wide mb-2">Opportunity Zones</h4>
                                            <ul className="space-y-1">
                                                {selectedCompetitor.strengths.map((s, i) => (
                                                    <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'rgb(var(--foreground-secondary))' }}>
                                                        <ArrowDownRight className="w-4 h-4 text-status-warning shrink-0" />
                                                        {s}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Recent Moment */}
                                    {selectedCompetitor.recentMoment && (
                                        <div className="mt-4 p-3 bg-accent-50 border border-accent-100 rounded-lg flex gap-3 items-start">
                                            <Zap className="w-5 h-5 text-accent-500 shrink-0" />
                                            <div>
                                                <div className="text-xs font-bold text-accent-700 uppercase mb-1">Recent Movement</div>
                                                <p className="text-sm text-accent-900">{selectedCompetitor.recentMoment}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="h-full flex flex-col items-center justify-center text-center p-8"
                                style={{ color: 'rgb(var(--foreground-muted))' }}
                            >
                                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgb(var(--background-tertiary))' }}>
                                    <Info className="w-8 h-8 text-secondary-300" />
                                </div>
                                <p className="text-lg font-medium" style={{ color: 'rgb(var(--foreground-muted))' }}>Select a competitor from the universe</p>
                                <p className="text-sm mt-2">Click on any orb to see their brand battlecard and market position.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

const CompetitorNode = ({ competitor, x, y, color, onClick, isSelected }: any) => {
    const size = 40 + (competitor.presence / 100) * 40; // Scale size by presence

    return (
        <motion.button
            className={`absolute rounded-full shadow-lg border-2 transition-all duration-300 flex items-center justify-center z-10
        ${isSelected ? 'border-primary-600 ring-4 ring-primary-600/20 scale-110' : 'border-white hover:scale-105'}
        ${color}
      `}
            style={{
                width: size,
                height: size,
                x: x, // Relative to center
                y: y,
                marginLeft: -size / 2, // Center anchor
                marginTop: -size / 2
            }}
            onClick={onClick}
            whileHover={{ zIndex: 50 }}
        >
            <span className="text-white font-bold text-xs truncate px-1 max-w-full">
                {competitor.name}
            </span>
        </motion.button>
    );
};

export default MarketLandscape;
