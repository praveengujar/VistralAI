import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, ArrowRight, TrendingUp, Shield, Target, Zap } from 'lucide-react';
import { useTerminology } from '@/hooks/useTerminology';

interface Opportunity {
    id: string;
    title: string;
    description: string;
    category: 'story' | 'reach' | 'reputation' | 'competition';
    impact: number; // 0-100
    effort: 'low' | 'medium' | 'high';
    potentialPulseIncrease: number;
}

interface BrandGrowthOpportunitiesProps {
    opportunities: Opportunity[];
}

const BrandGrowthOpportunities: React.FC<BrandGrowthOpportunitiesProps> = ({ opportunities }) => {
    const { t } = useTerminology();

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'story': return <Target className="w-5 h-5 text-purple-500" />;
            case 'reach': return <TrendingUp className="w-5 h-5 text-blue-500" />;
            case 'reputation': return <Shield className="w-5 h-5 text-green-500" />;
            case 'competition': return <Zap className="w-5 h-5 text-orange-500" />;
            default: return <Lightbulb className="w-5 h-5 text-gray-500" />;
        }
    };

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case 'story': return 'Strengthen Your Story';
            case 'reach': return 'Expand Your Reach';
            case 'reputation': return 'Protect Reputation';
            case 'competition': return 'Outpace Competitors';
            default: return 'General Opportunity';
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-primary to-brand-primary-800 rounded-2xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="relative z-10">
                    <h2 className="text-3xl font-serif font-bold mb-2">Brand Growth Opportunities</h2>
                    <p className="text-brand-primary-100 text-lg max-w-2xl mb-6">
                        We&apos;ve identified {opportunities.length} ways to amplify your brand story. Implementing these could increase your Brand Pulse by {opportunities.reduce((acc, curr) => acc + curr.potentialPulseIncrease, 0)}%.
                    </p>
                    <div className="flex gap-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                            <span className="block text-2xl font-bold">{opportunities.filter(o => o.effort === 'low').length}</span>
                            <span className="text-xs text-brand-primary-100 uppercase tracking-wider">Quick Wins</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                            <span className="block text-2xl font-bold">{opportunities.filter(o => o.impact > 80).length}</span>
                            <span className="text-xs text-brand-primary-100 uppercase tracking-wider">High Impact</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Opportunities Grid */}
            <div className="grid grid-cols-1 gap-6">
                {opportunities.map((opp, index) => (
                    <motion.div
                        key={opp.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="rounded-xl border p-6 hover:shadow-md transition-shadow group"
                        style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}
                    >
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Icon Column */}
                            <div className="shrink-0">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center border group-hover:scale-110 transition-transform"
                                    style={{ backgroundColor: 'rgb(var(--background-secondary))', borderColor: 'rgb(var(--border))' }}>
                                    {getCategoryIcon(opp.category)}
                                </div>
                            </div>

                            {/* Content Column */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgb(var(--foreground-muted))' }}>
                                        {getCategoryLabel(opp.category)}
                                    </span>
                                    {opp.effort === 'low' && (
                                        <span className="bg-success-100 text-success-800 text-xs px-2 py-0.5 rounded-full font-medium">
                                            Quick Win
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-xl font-bold mb-2" style={{ color: 'rgb(var(--foreground))' }}>{opp.title}</h3>
                                <p className="mb-4" style={{ color: 'rgb(var(--foreground-secondary))' }}>{opp.description}</p>

                                <div className="flex flex-wrap gap-4 text-sm" style={{ color: 'rgb(var(--foreground-muted))' }}>
                                    <div className="flex items-center gap-1">
                                        <span className="font-medium" style={{ color: 'rgb(var(--foreground))' }}>Impact:</span>
                                        <div className="w-20 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgb(var(--background-tertiary))' }}>
                                            <div
                                                className="h-full bg-brand-primary"
                                                style={{ width: `${opp.impact}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="font-medium" style={{ color: 'rgb(var(--foreground))' }}>Effort:</span>
                                        <span className="capitalize">{opp.effort}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-brand-primary font-medium">
                                        <TrendingUp className="w-4 h-4" />
                                        +{opp.potentialPulseIncrease}% Pulse
                                    </div>
                                </div>
                            </div>

                            {/* Action Column */}
                            <div className="flex items-center justify-end md:w-48">
                                <button className="btn-primary btn-md w-full flex items-center justify-center gap-2">
                                    Start Action
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default BrandGrowthOpportunities;
