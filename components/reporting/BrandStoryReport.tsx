import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Share2, Printer, CheckCircle, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { useTerminology } from '@/hooks/useTerminology';

interface ReportSection {
    title: string;
    content: string;
    type: 'success' | 'warning' | 'info';
}

interface BrandStoryReportProps {
    brandName: string;
    date: string;
    summary: string;
    wins: string[];
    challenges: string[];
    recommendations: string[];
    onDownload?: () => void;
    onShare?: () => void;
    onPrint?: () => void;
    isDownloading?: boolean;
}

const BrandStoryReport: React.FC<BrandStoryReportProps> = ({
    brandName,
    date,
    summary,
    wins,
    challenges,
    recommendations,
    onDownload,
    onShare,
    onPrint,
    isDownloading = false,
}) => {
    const { t } = useTerminology();

    return (
        <div className="max-w-4xl mx-auto shadow-lg rounded-xl overflow-hidden my-8" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
            {/* Report Header */}
            <div className="bg-brand-primary text-white p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <h1 className="text-4xl font-serif font-bold">Brand Story Report</h1>
                        <div className="flex gap-2 print:hidden">
                            <button
                                onClick={onDownload}
                                disabled={isDownloading}
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Download Report"
                            >
                                {isDownloading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Download className="w-5 h-5" />
                                )}
                            </button>
                            <button
                                onClick={onShare}
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                title="Share Report"
                            >
                                <Share2 className="w-5 h-5" />
                            </button>
                            <button
                                onClick={onPrint}
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                title="Print Report"
                            >
                                <Printer className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <p className="text-brand-primary-100 text-lg">
                        Prepared for <span className="font-bold text-white">{brandName}</span>
                    </p>
                    <p className="text-brand-primary-200 text-sm mt-1">{date}</p>
                </div>
            </div>

            {/* Report Content */}
            <div className="p-12 space-y-12">

                {/* Executive Summary */}
                <section>
                    <h2 className="text-2xl font-serif font-bold mb-4 pb-2" style={{ color: 'rgb(var(--foreground))', borderBottom: '1px solid rgb(var(--border))' }}>
                        Executive Summary
                    </h2>
                    <p className="leading-relaxed text-lg" style={{ color: 'rgb(var(--foreground-secondary))' }}>
                        {summary}
                    </p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* The Good News */}
                    <section>
                        <h3 className="text-xl font-bold text-status-success mb-6 flex items-center gap-2">
                            <CheckCircle className="w-6 h-6" />
                            The Good News
                        </h3>
                        <ul className="space-y-4">
                            {wins.map((win, i) => (
                                <li key={i} className="flex gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-status-success mt-2.5 shrink-0" />
                                    <p style={{ color: 'rgb(var(--foreground-secondary))' }}>{win}</p>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* The Challenge */}
                    <section>
                        <h3 className="text-xl font-bold text-status-warning mb-6 flex items-center gap-2">
                            <AlertTriangle className="w-6 h-6" />
                            The Challenge
                        </h3>
                        <ul className="space-y-4">
                            {challenges.map((challenge, i) => (
                                <li key={i} className="flex gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-status-warning mt-2.5 shrink-0" />
                                    <p style={{ color: 'rgb(var(--foreground-secondary))' }}>{challenge}</p>
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>

                {/* The Path Forward */}
                <section className="rounded-xl p-8" style={{ backgroundColor: 'rgb(var(--background-secondary))', border: '1px solid rgb(var(--border))' }}>
                    <h2 className="text-2xl font-serif font-bold mb-6" style={{ color: 'rgb(var(--foreground))' }}>
                        The Path Forward
                    </h2>
                    <div className="space-y-6">
                        {recommendations.map((rec, i) => (
                            <div key={i} className="flex gap-4 items-start group">
                                <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                                    {i + 1}
                                </div>
                                <div>
                                    <p className="font-medium text-lg mb-1" style={{ color: 'rgb(var(--foreground))' }}>{rec}</p>
                                    <div className="flex items-center text-brand-primary text-sm font-medium cursor-pointer hover:underline">
                                        Take Action <ArrowRight className="w-4 h-4 ml-1" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Footer */}
                <div className="text-center pt-12 text-sm" style={{ borderTop: '1px solid rgb(var(--border))', color: 'rgb(var(--foreground-muted))' }}>
                    <p>Generated by VistralAI Command Center</p>
                    <p className="mt-1">Confidential & Proprietary</p>
                </div>

            </div>
        </div>
    );
};

export default BrandStoryReport;
