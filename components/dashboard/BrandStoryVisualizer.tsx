import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, GitMerge, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';
import { useTerminology } from '@/hooks/useTerminology';

interface StoryNode {
    id: string;
    stage: 'Origin' | 'Conflict' | 'Resolution' | 'Evolution';
    title: string;
    aiConsistency: number; // 0-100
    keyThemes: string[];
    platforms: {
        openai: boolean;
        gemini: boolean;
        claude: boolean;
        perplexity: boolean;
    };
}

interface BrandStoryVisualizerProps {
    storyNodes: StoryNode[];
}

const BrandStoryVisualizer: React.FC<BrandStoryVisualizerProps> = ({ storyNodes }) => {
    const { t } = useTerminology();
    const [selectedNode, setSelectedNode] = useState<StoryNode | null>(null);

    return (
        <div className="rounded-2xl shadow-sm p-8" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-serif font-bold flex items-center gap-2" style={{ color: 'rgb(var(--foreground))' }}>
                        <BookOpen className="w-6 h-6 text-brand-primary" />
                        Brand Narrative Arc
                    </h2>
                    <p className="mt-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>
                        How AI platforms are telling your story, stage by stage.
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'rgb(var(--foreground-muted))' }}>
                        <span className="w-3 h-3 rounded-full bg-status-success" /> Consistent
                    </div>
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'rgb(var(--foreground-muted))' }}>
                        <span className="w-3 h-3 rounded-full bg-status-warning" /> Divergent
                    </div>
                </div>
            </div>

            <div className="relative h-[400px] flex items-center justify-between px-12">
                {/* Connecting Line */}
                <div className="absolute left-12 right-12 top-1/2 h-1 -z-10" style={{ backgroundColor: 'rgb(var(--background-tertiary))' }} />

                {storyNodes.map((node, index) => (
                    <div key={node.id} className="relative group">
                        {/* Node Point */}
                        <motion.button
                            onClick={() => setSelectedNode(node)}
                            className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all duration-300 z-10 relative
                ${selectedNode?.id === node.id ? 'scale-125 shadow-lg' : 'hover:opacity-80'}
                ${node.aiConsistency >= 80 ? 'border-status-success' :
                  node.aiConsistency >= 50 ? 'border-status-warning' : 'border-status-danger'}
              `}
                            style={{ backgroundColor: 'rgb(var(--surface))' }}
                            whileHover={{ scale: 1.1 }}
                        >
                            <span className={`text-lg font-bold ${node.aiConsistency >= 80 ? 'text-status-success' :
                                    node.aiConsistency >= 50 ? 'text-status-warning' : 'text-status-danger'
                                }`}>
                                {node.aiConsistency}
                            </span>
                        </motion.button>

                        {/* Label */}
                        <div className="absolute top-24 left-1/2 -translate-x-1/2 text-center w-32">
                            <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'rgb(var(--foreground-muted))' }}>{node.stage}</div>
                            <div className="text-sm font-medium" style={{ color: 'rgb(var(--foreground))' }}>{node.title}</div>
                        </div>

                        {/* Hover Card (if not selected) */}
                        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-48 p-4 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
                            <div className="text-xs font-bold mb-2" style={{ color: 'rgb(var(--foreground-muted))' }}>AI Consistency: {node.aiConsistency}%</div>
                            <div className="flex gap-1">
                                {Object.entries(node.platforms).map(([platform, active]) => (
                                    <div key={platform} className={`w-2 h-2 rounded-full ${active ? 'bg-brand-primary' : ''}`} style={!active ? { backgroundColor: 'rgb(var(--background-tertiary))' } : {}} title={platform} />
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Detail View */}
            {selectedNode && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 rounded-xl p-6"
                    style={{ backgroundColor: 'rgb(var(--background-secondary))', border: '1px solid rgb(var(--border))' }}
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold mb-2" style={{ color: 'rgb(var(--foreground))' }}>{selectedNode.title}</h3>
                            <p className="text-sm max-w-2xl" style={{ color: 'rgb(var(--foreground-secondary))' }}>
                                This stage of your narrative represents the {selectedNode.stage.toLowerCase()} of your brand story.
                                AI platforms are currently telling this part with <span className="font-bold">{selectedNode.aiConsistency}% consistency</span>.
                            </p>
                        </div>
                        <button
                            onClick={() => setSelectedNode(null)}
                            className="hover:opacity-70"
                            style={{ color: 'rgb(var(--foreground-muted))' }}
                        >
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                        <div>
                            <h4 className="text-xs font-bold uppercase mb-3" style={{ color: 'rgb(var(--foreground-muted))' }}>Key Themes Detected</h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedNode.keyThemes.map((theme, i) => (
                                    <span key={i} className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', color: 'rgb(var(--foreground-secondary))' }}>
                                        {theme}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold uppercase mb-3" style={{ color: 'rgb(var(--foreground-muted))' }}>Platform Alignment</h4>
                            <div className="space-y-2">
                                <PlatformStatus name="OpenAI" active={selectedNode.platforms.openai} />
                                <PlatformStatus name="Gemini" active={selectedNode.platforms.gemini} />
                                <PlatformStatus name="Claude" active={selectedNode.platforms.claude} />
                                <PlatformStatus name="Perplexity" active={selectedNode.platforms.perplexity} />
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

const PlatformStatus = ({ name, active }: { name: string, active: boolean }) => (
    <div className="flex items-center justify-between text-sm">
        <span style={{ color: 'rgb(var(--foreground-secondary))' }}>{name}</span>
        {active ? (
            <span className="flex items-center text-status-success gap-1">
                <CheckCircle className="w-4 h-4" /> Aligned
            </span>
        ) : (
            <span className="flex items-center text-status-warning gap-1">
                <GitMerge className="w-4 h-4" /> Divergent
            </span>
        )}
    </div>
);

const XIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
    </svg>
);

export default BrandStoryVisualizer;
