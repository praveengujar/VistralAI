import React, { useState, useMemo } from 'react';
import { useTerminology } from '@/hooks/useTerminology';
import { motion } from 'framer-motion';
import { Edit2, Sparkles, Check, ChevronRight } from 'lucide-react';

interface BrandStoryCanvasProps {
    brandData: any;
    onUpdate: (section: string, data: any) => void;
}

// Normalize data from either legacy Brand360Data or new Brand360Profile format
function normalizeBrandData(brandData: any) {
    if (!brandData) return null;

    // Check if this is the new Brand360Profile format (has brandIdentityPrism)
    const isNewFormat = !!brandData.brandIdentityPrism || !!brandData.brandArchetype || !!brandData.brandVoiceProfile;

    if (isNewFormat) {
        const prism = brandData.brandIdentityPrism || {};
        const archetype = brandData.brandArchetype || {};
        const voice = brandData.brandVoiceProfile || {};
        const schema = brandData.organizationSchema || {};

        return {
            identity: {
                vision: prism.selfImage || schema.slogan || null,
                mission: prism.cultureDescription || schema.description || null,
                values: prism.cultureValues || [],
                brandVoice: {
                    tone: voice.secondaryTones || archetype.expectedTone || [],
                    keywords: voice.approvedPhrases || [],
                    avoidWords: voice.bannedPhrases || [],
                },
                brandPersonality: archetype.primaryArchetype || null,
            },
            voiceSpectrums: voice.voiceSpectrums || {
                formal_casual: 5,
                serious_playful: 5,
                respectful_irreverent: 5,
                enthusiastic_matter_of_fact: 5,
            },
            archetype: {
                primary: archetype.primaryArchetype,
                primaryScore: archetype.primaryScore,
                secondary: archetype.secondaryArchetype,
                secondaryScore: archetype.secondaryScore,
            },
            personalityTraits: prism.personalityTraits || [],
            physique: prism.physique || {},
            reflectionProfile: prism.reflectionProfile || {},
            completionScore: brandData.completionScore || 0,
            entityHealthScore: brandData.entityHealthScore || 0,
        };
    }

    // Legacy format - return as-is with defaults
    return {
        identity: brandData.identity || {},
        voiceSpectrums: null,
        archetype: null,
        personalityTraits: [],
        physique: {},
        reflectionProfile: {},
        completionScore: brandData.profileStrength || 0,
        entityHealthScore: 0,
    };
}

const BrandStoryCanvas: React.FC<BrandStoryCanvasProps> = ({ brandData, onUpdate }) => {
    const { t } = useTerminology();
    const [activeSection, setActiveSection] = useState<string | null>(null);

    // Normalize data to handle both legacy and new formats
    const normalizedData = useMemo(() => normalizeBrandData(brandData), [brandData]);

    // Debug: Log the received brandData
    console.log('[BrandStoryCanvas] Rendering with brandData:', {
        isNewFormat: !!brandData?.brandIdentityPrism,
        hasIdentity: !!normalizedData?.identity,
        mission: normalizedData?.identity?.mission?.substring(0, 50) || 'EMPTY',
        vision: normalizedData?.identity?.vision?.substring(0, 50) || 'EMPTY',
        valuesCount: normalizedData?.identity?.values?.length || 0,
    });

    // Calculate AI alignment scores based on data completeness
    const alignmentScores = useMemo(() => {
        if (!normalizedData) return { essence: 0, voice: 0, values: 0 };

        const essenceScore = (normalizedData.identity?.vision ? 50 : 0) + (normalizedData.identity?.mission ? 50 : 0);
        const voiceScore = normalizedData.voiceSpectrums ? 85 : (normalizedData.identity?.brandVoice?.tone?.length ? 60 : 0);
        const valuesScore = normalizedData.identity?.values?.length ? Math.min(normalizedData.identity.values.length * 25, 100) : 0;

        return {
            essence: essenceScore || 0,
            voice: voiceScore || 0,
            values: valuesScore || 0,
        };
    }, [normalizedData]);

    return (
        <div className="space-y-12">
            {/* 1. Brand Essence Section */}
            <section className="relative">
                <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-primary to-transparent opacity-20" />

                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h2 className="text-2xl font-serif font-bold" style={{ color: 'rgb(var(--foreground))' }}>Brand Essence</h2>
                        <p className="mt-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>The core of who you are and why you exist.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-status-success/10 px-3 py-1 rounded-full border border-status-success/20">
                        <Sparkles className="w-4 h-4 text-status-success" />
                        <span className="text-sm font-medium text-status-success">AI Alignment: {alignmentScores.essence}%</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Vision Block */}
                    <div className="rounded-xl p-8 shadow-sm relative group" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 rounded-full hover:text-brand-primary" style={{ color: 'rgb(var(--foreground-muted))' }}>
                                <Edit2 className="w-4 h-4" />
                            </button>
                        </div>

                        <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'rgb(var(--foreground-muted))' }}>Why We Exist (Vision)</h3>
                        <blockquote className="text-xl font-serif italic leading-relaxed" style={{ color: 'rgb(var(--foreground))' }}>
                            &quot;{normalizedData?.identity?.vision || "Vision statement not yet extracted. Run website analysis to populate."}&quot;
                        </blockquote>

                        <div className="mt-6 pt-6 flex items-center gap-2 text-sm" style={{ borderTop: '1px solid rgb(var(--border))', color: 'rgb(var(--foreground-muted))' }}>
                            <Check className="w-4 h-4 text-brand-primary" />
                            <span>This is how AI should introduce us.</span>
                        </div>
                    </div>

                    {/* Mission Block */}
                    <div className="rounded-xl p-8 shadow-sm relative group" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 rounded-full hover:text-brand-primary" style={{ color: 'rgb(var(--foreground-muted))' }}>
                                <Edit2 className="w-4 h-4" />
                            </button>
                        </div>

                        <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'rgb(var(--foreground-muted))' }}>What We Do (Mission)</h3>
                        <p className="text-lg leading-relaxed font-medium" style={{ color: 'rgb(var(--foreground))' }}>
                            {normalizedData?.identity?.mission || "Mission statement not yet extracted. Run website analysis to populate."}
                        </p>

                        <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgb(var(--border))' }}>
                            <div className="flex items-center justify-between text-sm">
                                <span style={{ color: 'rgb(var(--foreground-muted))' }}>AI Clarity Score</span>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="w-2 h-2 rounded-full bg-brand-primary" />
                                    ))}
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'rgb(var(--border))' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Brand Voice Section */}
            <section className="relative">
                <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-accent to-transparent opacity-20" />

                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h2 className="text-2xl font-serif font-bold" style={{ color: 'rgb(var(--foreground))' }}>Brand Voice</h2>
                        <p className="mt-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>How you sound to the world (and how AI should sound).</p>
                    </div>
                </div>

                <div className="rounded-xl p-8 shadow-sm" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
                    <div className="space-y-8">
                        <VoiceSlider
                            leftLabel="Playful"
                            rightLabel="Serious"
                            value={(normalizedData?.voiceSpectrums?.serious_playful || 5) * 10}
                            aiValue={(normalizedData?.voiceSpectrums?.serious_playful || 5) * 10}
                        />
                        <VoiceSlider
                            leftLabel="Casual"
                            rightLabel="Formal"
                            value={(normalizedData?.voiceSpectrums?.formal_casual || 5) * 10}
                            aiValue={(normalizedData?.voiceSpectrums?.formal_casual || 5) * 10}
                        />
                        <VoiceSlider
                            leftLabel="Irreverent"
                            rightLabel="Respectful"
                            value={(normalizedData?.voiceSpectrums?.respectful_irreverent || 5) * 10}
                            aiValue={(normalizedData?.voiceSpectrums?.respectful_irreverent || 5) * 10}
                        />
                    </div>

                    <div className="mt-8 p-4 rounded-lg flex gap-4" style={{ backgroundColor: 'rgb(var(--background-secondary))', border: '1px solid rgb(var(--border))' }}>
                        <div className="w-1/2">
                            <h4 className="text-xs font-bold uppercase mb-2" style={{ color: 'rgb(var(--foreground-muted))' }}>Brand Tone & Keywords</h4>
                            <p className="text-sm italic" style={{ color: 'rgb(var(--foreground))' }}>
                                {normalizedData?.identity?.brandVoice?.tone?.length
                                    ? `"${normalizedData.identity.brandVoice.tone.slice(0, 3).join(', ')}"`
                                    : '"Run analysis to extract voice tone."'}
                            </p>
                            {(normalizedData?.identity?.brandVoice?.keywords?.length ?? 0) > 0 && normalizedData && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {normalizedData.identity.brandVoice.keywords.slice(0, 3).map((keyword: string, i: number) => (
                                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary">
                                            {keyword}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="w-px" style={{ backgroundColor: 'rgb(var(--border))' }} />
                        <div className="w-1/2">
                            <h4 className="text-xs font-bold text-brand-primary uppercase mb-2">Brand Archetype</h4>
                            <p className="text-sm" style={{ color: 'rgb(var(--foreground-secondary))' }}>
                                {normalizedData?.archetype?.primary
                                    ? `Primary: ${normalizedData.archetype.primary.charAt(0).toUpperCase() + normalizedData.archetype.primary.slice(1)} (${normalizedData.archetype.primaryScore || 0}%)`
                                    : 'Run analysis to determine archetype.'}
                            </p>
                            {normalizedData?.archetype?.secondary && (
                                <p className="text-xs mt-1" style={{ color: 'rgb(var(--foreground-muted))' }}>
                                    Secondary: {normalizedData.archetype.secondary.charAt(0).toUpperCase() + normalizedData.archetype.secondary.slice(1)} ({normalizedData.archetype.secondaryScore || 0}%)
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Brand Values Section */}
            <section className="relative">
                <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-status-success to-transparent opacity-20" />

                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h2 className="text-2xl font-serif font-bold" style={{ color: 'rgb(var(--foreground))' }}>Brand Values</h2>
                        <p className="mt-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>The non-negotiables that define your character.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(normalizedData?.identity?.values && normalizedData.identity.values.length > 0 ? normalizedData.identity.values : ['Value 1 - Run analysis', 'Value 2 - Run analysis', 'Value 3 - Run analysis']).map((value: string, i: number) => (
                        <motion.div
                            key={i}
                            className="rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                            style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}
                            whileHover={{ y: -4 }}
                        >
                            <div className="w-10 h-10 rounded-lg bg-brand-primary/5 flex items-center justify-center mb-4 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold mb-2" style={{ color: 'rgb(var(--foreground))' }}>{value}</h3>
                            <p className="text-sm mb-4" style={{ color: 'rgb(var(--foreground-muted))' }}>
                                We believe in {value.toLowerCase()} as a core driver of our business decisions.
                            </p>
                            <div className="flex items-center justify-between text-xs pt-3" style={{ color: 'rgb(var(--foreground-muted))', borderTop: '1px solid rgb(var(--border))' }}>
                                <span>AI Alignment</span>
                                <span className="font-bold text-status-success">High</span>
                            </div>
                        </motion.div>
                    ))}

                    <button className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center hover:border-brand-primary hover:text-brand-primary transition-colors" style={{ borderColor: 'rgb(var(--border))', color: 'rgb(var(--foreground-muted))' }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: 'rgb(var(--background-secondary))' }}>
                            +
                        </div>
                        <span className="font-medium">Add Value</span>
                    </button>
                </div>
            </section>
        </div>
    );
};

const VoiceSlider = ({ leftLabel, rightLabel, value, aiValue }: any) => {
    return (
        <div className="relative pt-6 pb-2">
            <div className="flex justify-between text-sm font-medium mb-2" style={{ color: 'rgb(var(--foreground-secondary))' }}>
                <span>{leftLabel}</span>
                <span>{rightLabel}</span>
            </div>
            <div className="relative h-2 rounded-full" style={{ backgroundColor: 'rgb(var(--background-tertiary))' }}>
                {/* User Value */}
                <div
                    className="absolute top-0 bottom-0 bg-brand-primary rounded-full opacity-30"
                    style={{ left: '0', width: `${value}%` }}
                />
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-brand-primary rounded-full shadow z-10"
                    style={{ left: `${value}%`, border: '2px solid rgb(var(--surface))' }}
                />

                {/* AI Value (Ghost) */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-50 z-0"
                    style={{ left: `${aiValue}%`, backgroundColor: 'rgb(var(--foreground-muted))' }}
                />
            </div>
            <div className="absolute top-0 right-0 text-xs flex items-center gap-1" style={{ color: 'rgb(var(--foreground-muted))' }}>
                <div className="w-2 h-2 rounded-full opacity-50" style={{ backgroundColor: 'rgb(var(--foreground-muted))' }} />
                AI Perception
            </div>
        </div>
    );
};

export default BrandStoryCanvas;
