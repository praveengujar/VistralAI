'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  QuadrantChart,
  MetricsRadarChart,
  PlatformComparisonChart,
  PerceptionScoreCard,
  InsightsPriorityMatrix,
} from '@/components/aeo';
import { QuadrantPosition, LLMPlatform, InsightCategory, InsightPriority, CorrectionEffort } from '@/lib/services/agents/types';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

interface ScanResult {
  id: string;
  promptId: string;
  prompt: string;
  promptCategory: string;
  platform: LLMPlatform;
  model: string;
  response: string;
  responseTime: number | null;
  tokensUsed: number | null;
  metrics: {
    faithfulnessScore: number | null;
    faithfulnessErrors: string[];
    shareOfVoice: number | null;
    brandMentioned: boolean;
    brandPosition: number | null;
    competitorsMentioned: string[];
    overallSentiment: number | null;
    aspectSentiments: Record<string, number> | null;
    voiceAlignmentScore: number | null;
    voiceDeviations: string[];
    hallucinationScore: number | null;
    hallucinations: string[];
    keyThemes: string[];
    missingInformation: string[];
    opportunities: string[];
  };
}

interface ScanInsight {
  id: string;
  category: InsightCategory;
  priority: InsightPriority;
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  effort?: CorrectionEffort;
  platforms: string[];
  affectedPromptCategories: string[];
  status: string;
}

interface ScanData {
  scan: {
    id: string;
    brand360Id: string;
    status: string;
    platforms: LLMPlatform[];
    promptCount: number;
    completedCount: number;
    overallScore: number | null;
    quadrantPosition: QuadrantPosition | null;
    startedAt: string | null;
    completedAt: string | null;
    createdAt: string;
  };
  aggregatedScores: {
    overall: number | null;
    byPlatform: Record<string, number>;
    byCategory: Record<string, number>;
  };
  results: ScanResult[];
  insights: ScanInsight[];
  summary: {
    totalResults: number;
    platformBreakdown: Record<string, number>;
    categoryBreakdown: Record<string, number>;
  };
}

const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
  running: { color: 'bg-blue-100 text-blue-800', icon: Loader2, label: 'Running' },
  completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Completed' },
  failed: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Failed' },
};

const platformColors: Record<LLMPlatform, string> = {
  chatgpt: '#10a37f',
  claude: '#d97706',
  gemini: '#4285f4',
  perplexity: '#6366f1',
  google_aio: '#ec4899',
};

export default function ScanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const scanId = params.scanId as string;

  const [data, setData] = useState<ScanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchScanData = async () => {
      if (!scanId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/aeo/perception-scan/${scanId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Scan not found');
          } else {
            setError('Failed to load scan data');
          }
          return;
        }

        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || 'Failed to load scan data');
        }
      } catch (err) {
        console.error('Error fetching scan:', err);
        setError('Failed to load scan data');
      } finally {
        setLoading(false);
      }
    };

    fetchScanData();
  }, [scanId]);

  const toggleResultExpansion = (resultId: string) => {
    setExpandedResults((prev) => {
      const next = new Set(prev);
      if (next.has(resultId)) {
        next.delete(resultId);
      } else {
        next.add(resultId);
      }
      return next;
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getScoreColor = (score: number | null): string => {
    if (score === null) return 'text-secondary-400';
    if (score >= 80) return 'text-success-600';
    if (score >= 60) return 'text-warning-600';
    return 'text-error-600';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto" />
            <p className="mt-4 text-secondary-500">Loading scan data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="page-container py-8">
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-warning-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'rgb(var(--foreground))' }}>
                {error || 'Scan not found'}
              </h2>
              <p className="mb-6" style={{ color: 'rgb(var(--foreground-secondary))' }}>
                The scan you&apos;re looking for doesn&apos;t exist or couldn&apos;t be loaded.
              </p>
              <button
                onClick={() => router.push('/dashboard/aeo')}
                className="btn-primary btn-md"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to AEO Dashboard
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { scan, aggregatedScores, results, insights, summary } = data;
  const statusInfo = statusConfig[scan.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = statusInfo.icon;

  // Transform data for charts
  const platformScores = Object.entries(aggregatedScores.byPlatform).map(([platform, score]) => ({
    platform: platform as LLMPlatform,
    score,
  }));

  // Calculate average metrics from results
  const avgMetrics = results.reduce(
    (acc, r) => {
      acc.faithfulness += r.metrics.faithfulnessScore || 0;
      acc.shareOfVoice += r.metrics.shareOfVoice || 0;
      acc.sentiment += ((r.metrics.overallSentiment || 0) + 1) / 2;
      acc.voiceAlignment += r.metrics.voiceAlignmentScore || 0;
      acc.hallucinationRisk += r.metrics.hallucinationScore || 0;
      acc.count += 1;
      return acc;
    },
    { faithfulness: 0, shareOfVoice: 0, sentiment: 0, voiceAlignment: 0, hallucinationRisk: 0, count: 0 }
  );

  const metrics = avgMetrics.count > 0 ? {
    faithfulness: Math.round(avgMetrics.faithfulness / avgMetrics.count),
    shareOfVoice: Math.round(avgMetrics.shareOfVoice / avgMetrics.count),
    sentiment: avgMetrics.sentiment / avgMetrics.count,
    voiceAlignment: Math.round(avgMetrics.voiceAlignment / avgMetrics.count),
    hallucinationRisk: Math.round(avgMetrics.hallucinationRisk / avgMetrics.count),
  } : {
    faithfulness: 0,
    shareOfVoice: 0,
    sentiment: 0.5,
    voiceAlignment: 0,
    hallucinationRisk: 0,
  };

  return (
    <DashboardLayout>
      <div className="page-container py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/aeo')}
            className="inline-flex items-center text-sm mb-4 transition-colors"
            style={{ color: 'rgb(var(--foreground-secondary))' }}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to AEO Dashboard
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'rgb(var(--foreground))' }}>
                Perception Scan Results
              </h1>
              <p className="mt-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>
                Scan ID: {scan.id}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                <StatusIcon className={`h-4 w-4 mr-1.5 ${scan.status === 'running' ? 'animate-spin' : ''}`} />
                {statusInfo.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-4 text-sm" style={{ color: 'rgb(var(--foreground-secondary))' }}>
            <span>
              <strong>Started:</strong> {formatDate(scan.startedAt)}
            </span>
            <span>
              <strong>Completed:</strong> {formatDate(scan.completedAt)}
            </span>
            <span>
              <strong>Platforms:</strong> {scan.platforms.join(', ')}
            </span>
            <span>
              <strong>Results:</strong> {scan.completedCount}/{scan.promptCount}
            </span>
          </div>
        </div>

        {/* Score Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Overall Score */}
          <div className="card p-6">
            <PerceptionScoreCard
              overallScore={aggregatedScores.overall || 0}
              previousScore={undefined}
              quadrant={(scan.quadrantPosition as QuadrantPosition) || 'invisible'}
              lastScanAt={scan.completedAt ? new Date(scan.completedAt) : undefined}
              scanCount={1}
            />
          </div>

          {/* Quadrant Position */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(var(--foreground))' }}>Position Quadrant</h3>
            <QuadrantChart
              accuracy={metrics.faithfulness}
              visibility={metrics.shareOfVoice}
              quadrant={(scan.quadrantPosition as QuadrantPosition) || 'invisible'}
            />
          </div>

          {/* Metrics Radar */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(var(--foreground))' }}>Perception Metrics</h3>
            <MetricsRadarChart
              currentMetrics={metrics}
            />
          </div>
        </div>

        {/* Platform Comparison */}
        {platformScores.length > 0 && (
          <div className="card p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(var(--foreground))' }}>Platform Comparison</h3>
            <PlatformComparisonChart
              data={platformScores}
            />
          </div>
        )}

        {/* Results Table */}
        <div className="card p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(var(--foreground))' }}>
            Detailed Results ({results.length})
          </h3>

          <div className="space-y-3">
            {results.map((result) => {
              const isExpanded = expandedResults.has(result.id);
              const overallScore = Math.round(
                (result.metrics.faithfulnessScore || 0) * 0.25 +
                (result.metrics.shareOfVoice || 0) * 0.25 +
                (((result.metrics.overallSentiment || 0) + 1) / 2) * 100 * 0.15 +
                (result.metrics.voiceAlignmentScore || 0) * 0.15 +
                (result.metrics.hallucinationScore || 0) * 0.2
              );

              return (
                <div
                  key={result.id}
                  className="rounded-lg overflow-hidden"
                  style={{ border: '1px solid rgb(var(--border))' }}
                >
                  {/* Result Header */}
                  <button
                    onClick={() => toggleResultExpansion(result.id)}
                    className="w-full px-4 py-3 flex items-center justify-between transition-colors"
                    style={{ backgroundColor: 'rgb(var(--background-secondary))' }}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: platformColors[result.platform] || '#6b7280' }}
                      />
                      <span className="font-medium capitalize" style={{ color: 'rgb(var(--foreground))' }}>
                        {result.platform}
                      </span>
                      <span className="text-sm" style={{ color: 'rgb(var(--foreground-muted))' }}>
                        {result.promptCategory}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-semibold ${getScoreColor(overallScore)}`}>
                        {overallScore}%
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" style={{ color: 'rgb(var(--foreground-muted))' }} />
                      ) : (
                        <ChevronDown className="h-5 w-5" style={{ color: 'rgb(var(--foreground-muted))' }} />
                      )}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="p-4" style={{ backgroundColor: 'rgb(var(--surface))', borderTop: '1px solid rgb(var(--border))' }}>
                      {/* Prompt */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>Prompt</h4>
                        <p className="text-sm p-3 rounded" style={{ color: 'rgb(var(--foreground-secondary))', backgroundColor: 'rgb(var(--background-secondary))' }}>
                          {result.prompt || 'N/A'}
                        </p>
                      </div>

                      {/* Response */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>AI Response</h4>
                        <p className="text-sm p-3 rounded whitespace-pre-wrap max-h-48 overflow-y-auto" style={{ color: 'rgb(var(--foreground-secondary))', backgroundColor: 'rgb(var(--info-background))' }}>
                          {result.response}
                        </p>
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                        <div className="text-center p-2 rounded" style={{ backgroundColor: 'rgb(var(--background-secondary))' }}>
                          <div className={`text-lg font-bold ${getScoreColor(result.metrics.faithfulnessScore)}`}>
                            {result.metrics.faithfulnessScore ?? 'N/A'}%
                          </div>
                          <div className="text-xs" style={{ color: 'rgb(var(--foreground-muted))' }}>Faithfulness</div>
                        </div>
                        <div className="text-center p-2 rounded" style={{ backgroundColor: 'rgb(var(--background-secondary))' }}>
                          <div className={`text-lg font-bold ${getScoreColor(result.metrics.shareOfVoice)}`}>
                            {result.metrics.shareOfVoice ?? 'N/A'}%
                          </div>
                          <div className="text-xs" style={{ color: 'rgb(var(--foreground-muted))' }}>Share of Voice</div>
                        </div>
                        <div className="text-center p-2 rounded" style={{ backgroundColor: 'rgb(var(--background-secondary))' }}>
                          <div className={`text-lg font-bold ${getScoreColor(result.metrics.overallSentiment !== null ? ((result.metrics.overallSentiment + 1) / 2) * 100 : null)}`}>
                            {result.metrics.overallSentiment !== null
                              ? `${Math.round(((result.metrics.overallSentiment + 1) / 2) * 100)}%`
                              : 'N/A'}
                          </div>
                          <div className="text-xs" style={{ color: 'rgb(var(--foreground-muted))' }}>Sentiment</div>
                        </div>
                        <div className="text-center p-2 rounded" style={{ backgroundColor: 'rgb(var(--background-secondary))' }}>
                          <div className={`text-lg font-bold ${getScoreColor(result.metrics.voiceAlignmentScore)}`}>
                            {result.metrics.voiceAlignmentScore ?? 'N/A'}%
                          </div>
                          <div className="text-xs" style={{ color: 'rgb(var(--foreground-muted))' }}>Voice Alignment</div>
                        </div>
                        <div className="text-center p-2 rounded" style={{ backgroundColor: 'rgb(var(--background-secondary))' }}>
                          <div className={`text-lg font-bold ${getScoreColor(result.metrics.hallucinationScore)}`}>
                            {result.metrics.hallucinationScore ?? 'N/A'}%
                          </div>
                          <div className="text-xs" style={{ color: 'rgb(var(--foreground-muted))' }}>Accuracy (No Halluc.)</div>
                        </div>
                      </div>

                      {/* Issues */}
                      {(result.metrics.hallucinations?.length > 0 ||
                        result.metrics.faithfulnessErrors?.length > 0 ||
                        result.metrics.missingInformation?.length > 0) && (
                        <div className="space-y-2">
                          {result.metrics.hallucinations?.length > 0 && (
                            <div className="text-sm">
                              <span className="font-medium text-error-600">Hallucinations: </span>
                              <span style={{ color: 'rgb(var(--foreground-secondary))' }}>{result.metrics.hallucinations.join(', ')}</span>
                            </div>
                          )}
                          {result.metrics.faithfulnessErrors?.length > 0 && (
                            <div className="text-sm">
                              <span className="font-medium text-warning-600">Errors: </span>
                              <span style={{ color: 'rgb(var(--foreground-secondary))' }}>{result.metrics.faithfulnessErrors.join(', ')}</span>
                            </div>
                          )}
                          {result.metrics.missingInformation?.length > 0 && (
                            <div className="text-sm">
                              <span className="font-medium text-info-600">Missing: </span>
                              <span style={{ color: 'rgb(var(--foreground-secondary))' }}>{result.metrics.missingInformation.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Response metadata */}
                      <div className="flex items-center gap-4 mt-4 text-xs" style={{ color: 'rgb(var(--foreground-muted))' }}>
                        <span>Model: {result.model}</span>
                        {result.responseTime && <span>Response time: {result.responseTime}ms</span>}
                        {result.tokensUsed && <span>Tokens: {result.tokensUsed}</span>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {results.length === 0 && (
              <div className="text-center py-8" style={{ color: 'rgb(var(--foreground-muted))' }}>
                No results available for this scan.
              </div>
            )}
          </div>
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(var(--foreground))' }}>
              Insights & Recommendations ({insights.length})
            </h3>
            <InsightsPriorityMatrix
              insights={insights.map((i) => ({
                id: i.id,
                title: i.title,
                category: i.category,
                priority: i.priority,
                effort: i.effort,
                impact: i.impact,
              }))}
              onInsightClick={(id) => router.push(`/dashboard/aeo/insights/${id}`)}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
