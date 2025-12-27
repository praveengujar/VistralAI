import React from 'react';
import { useTerminology } from '@/hooks/useTerminology';
import { motion } from 'framer-motion';
import { Package, TrendingUp, AlertCircle, CheckCircle2, Search } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    image?: string;
    category: string;
    brandStory: string;
    aiStory: string;
    mentions: number;
    accuracy: number;
    trend: 'up' | 'down' | 'stable';
    price: number;
}

interface BrandOfferingsShowcaseProps {
    products: Product[];
}

const BrandOfferingsShowcase: React.FC<BrandOfferingsShowcaseProps> = ({ products }) => {
    const { t } = useTerminology();

    // Mock data for positioning map if not provided
    const positioningData = products.map(p => ({
        x: p.price, // Price
        y: p.mentions, // Mentions
        r: p.accuracy, // Accuracy
        name: p.name
    }));

    return (
        <div className="space-y-12 mt-12">
            {/* 1. "What We Offer" Hero Section */}
            <div className="relative bg-brand-primary rounded-2xl p-8 overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="relative z-10">
                    <h2 className="text-3xl font-serif font-bold mb-2">Our Offerings</h2>
                    <p className="text-brand-primary-100 text-lg max-w-2xl">
                        Our products, as AI should present them. Ensure every recommendation tells the right story.
                    </p>
                </div>
            </div>

            {/* 2. Product Stories Grid */}
            <div className="grid grid-cols-1 gap-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold" style={{ color: 'rgb(var(--foreground))' }}>Product Stories</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgb(var(--foreground-muted))' }} />
                        <input
                            type="text"
                            placeholder="Search offerings..."
                            className="pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                            style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', color: 'rgb(var(--foreground))' }}
                        />
                    </div>
                </div>

                {products.map((product) => (
                    <motion.div
                        key={product.id}
                        className="rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                        style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
                            {/* Image & Basic Info */}
                            <div className="md:col-span-3 p-6 flex flex-col items-center justify-center text-center" style={{ backgroundColor: 'rgb(var(--background-secondary))', borderRight: '1px solid rgb(var(--border))' }}>
                                <div className="w-24 h-24 rounded-lg shadow-sm flex items-center justify-center mb-4" style={{ backgroundColor: 'rgb(var(--surface))' }}>
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                                    ) : (
                                        <Package className="w-10 h-10" style={{ color: 'rgb(var(--foreground-muted))' }} />
                                    )}
                                </div>
                                <h4 className="font-bold mb-1" style={{ color: 'rgb(var(--foreground))' }}>{product.name}</h4>
                                <span className="text-xs uppercase tracking-wide" style={{ color: 'rgb(var(--foreground-muted))' }}>{product.category}</span>
                            </div>

                            {/* Stories Comparison */}
                            <div className="md:col-span-6 p-6 space-y-6">
                                <div>
                                    <h5 className="text-xs font-bold text-brand-primary uppercase mb-2">Our Story</h5>
                                    <p className="text-sm italic" style={{ color: 'rgb(var(--foreground))' }}>&quot;{product.brandStory}&quot;</p>
                                </div>
                                <div className="pt-4" style={{ borderTop: '1px solid rgb(var(--border))' }}>
                                    <h5 className="text-xs font-bold uppercase mb-2" style={{ color: 'rgb(var(--foreground-muted))' }}>AI&apos;s Story</h5>
                                    <p className="text-sm italic" style={{ color: 'rgb(var(--foreground-secondary))' }}>&quot;{product.aiStory}&quot;</p>
                                </div>
                            </div>

                            {/* Metrics */}
                            <div className="md:col-span-3 p-6 flex flex-col justify-center" style={{ backgroundColor: 'rgb(var(--background-secondary))', borderLeft: '1px solid rgb(var(--border))' }}>
                                <div className="mb-6">
                                    <div className="text-xs mb-1" style={{ color: 'rgb(var(--foreground-muted))' }}>AI Mentions (Mo)</div>
                                    <div className="flex items-end gap-2">
                                        <span className="text-2xl font-bold" style={{ color: 'rgb(var(--foreground))' }}>{product.mentions}</span>
                                        <span className={`text-xs font-medium mb-1 ${product.trend === 'up' ? 'text-status-success' : 'text-status-warning'
                                            }`}>
                                            {product.trend === 'up' ? 'Trending ↑' : 'Stable'}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xs mb-1" style={{ color: 'rgb(var(--foreground-muted))' }}>Story Accuracy</div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgb(var(--background-tertiary))' }}>
                                            <div
                                                className={`h-full rounded-full ${product.accuracy >= 90 ? 'bg-status-success' :
                                                        product.accuracy >= 70 ? 'bg-status-warning' : 'bg-status-danger'
                                                    }`}
                                                style={{ width: `${product.accuracy}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-bold" style={{ color: 'rgb(var(--foreground-secondary))' }}>{product.accuracy}%</span>
                                    </div>
                                </div>

                                <button className="mt-6 w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors btn-secondary">
                                    Optimize Story
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* 3. Category Leadership */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'rgb(var(--foreground))' }}>
                        <TrendingUp className="w-5 h-5 text-brand-primary" />
                        Category Leadership
                    </h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-status-success/10 rounded-lg border border-status-success/20">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-status-success">Sustainable Basics</span>
                                <span className="px-2 py-1 rounded text-xs font-bold text-status-success shadow-sm" style={{ backgroundColor: 'rgb(var(--surface))' }}>#2 Rank</span>
                            </div>
                            <p className="text-sm" style={{ color: 'rgb(var(--foreground-secondary))' }}>
                                You&apos;re #2 in AI recommendations for this category.
                            </p>
                            <div className="mt-3 text-xs font-medium text-status-success flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Gap analysis: Focus on &quot;durability&quot; to reach #1.
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
                    <h3 className="text-lg font-bold mb-4" style={{ color: 'rgb(var(--foreground))' }}>Product Positioning Map</h3>
                    <div className="h-48 rounded-lg flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: 'rgb(var(--background-secondary))', border: '1px solid rgb(var(--border))' }}>
                        {/* Simple Scatter Plot Visualization */}
                        <div className="absolute inset-0 p-4">
                            <div className="w-full h-full relative" style={{ borderLeft: '1px solid rgb(var(--border))', borderBottom: '1px solid rgb(var(--border))' }}>
                                <span className="absolute -left-6 top-1/2 -rotate-90 text-xs" style={{ color: 'rgb(var(--foreground-muted))' }}>Mentions</span>
                                <span className="absolute bottom-[-20px] left-1/2 text-xs" style={{ color: 'rgb(var(--foreground-muted))' }}>Price Point</span>

                                {/* Quadrants */}
                                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                                    <div className="bg-status-success/10" style={{ borderRight: '1px solid rgb(var(--border))', borderBottom: '1px solid rgb(var(--border))' }}></div>
                                    <div className="bg-primary-500/10" style={{ borderBottom: '1px solid rgb(var(--border))' }}></div>
                                    <div className="bg-status-danger/10" style={{ borderRight: '1px solid rgb(var(--border))' }}></div>
                                    <div className="bg-status-warning/10"></div>
                                </div>

                                {/* Dots */}
                                {positioningData.map((p, i) => (
                                    <div
                                        key={i}
                                        className="absolute w-3 h-3 rounded-full bg-brand-primary shadow-sm hover:scale-150 transition-transform cursor-pointer"
                                        style={{
                                            left: `${(p.x / 100) * 100}%`,
                                            bottom: `${(p.y / 1000) * 100}%`,
                                            border: '1px solid rgb(var(--surface))'
                                        }}
                                        title={`${p.name}: ${p.r}% Accuracy`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BrandOfferingsShowcase;
