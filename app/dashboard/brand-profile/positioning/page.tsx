'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  PositioningStatement,
  ValuePropositionCards,
  ProofPointsList,
} from '@/components/positioning/PositioningStatement';
import {
  useMarketPositioning,
  useUpdatePositioning,
} from '@/lib/query/audienceHooks';
import { useBrand360Profile } from '@/lib/query/hooks';
import {
  Crosshair,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Lightbulb,
  Award,
  BarChart3,
  Edit2,
} from 'lucide-react';
import Link from 'next/link';

export default function PositioningPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  // Fetch brand360 profile to get brand360Id
  const organizationId = (session?.user as any)?.organizationId;
  const { data: brandProfile, isLoading: brandLoading } = useBrand360Profile(organizationId);
  const brand360Id = brandProfile?.id;

  // Fetch positioning data
  const { data: positioningData, isLoading: positioningLoading } = useMarketPositioning(brand360Id);
  const { mutate: updatePositioning, isPending: isUpdating } = useUpdatePositioning();

  if (status === 'loading' || brandLoading || positioningLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  if (!brand360Id) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="w-12 h-12 text-amber-400 mb-4" />
          <h2 className="text-lg font-medium text-[rgb(var(--foreground))]">No Brand Profile Found</h2>
          <p className="text-[rgb(var(--foreground-secondary))] mt-2">
            Please complete the onboarding process first.
          </p>
          <Link
            href="/dashboard/brand-profile"
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Brand Profile
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const positioning = positioningData?.data;

  const handleFieldEdit = (field: string, value: string) => {
    if (!brand360Id) return;
    updatePositioning({
      brand360Id,
      [field]: value,
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/brand-profile"
              className="p-2 hover:bg-[rgb(var(--border))] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[rgb(var(--foreground-secondary))]" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">Market Positioning</h1>
              <p className="text-[rgb(var(--foreground-secondary))]">
                Define how your brand stands out in the market
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isEditing
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-[rgb(var(--border))] text-[rgb(var(--foreground))] hover:bg-[rgb(var(--border))]/80'
            }`}
          >
            <Edit2 className="w-4 h-4" />
            {isEditing ? 'Done Editing' : 'Edit'}
          </button>
        </div>

        {!positioning ? (
          <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-12 text-center">
            <Crosshair className="w-12 h-12 text-[rgb(var(--foreground-secondary))] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[rgb(var(--foreground))] mb-2">
              No Positioning Defined
            </h3>
            <p className="text-[rgb(var(--foreground-secondary))] mb-4">
              Run the Magic Import to automatically extract your market positioning, or define it manually.
            </p>
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit2 className="w-4 h-4" />
              Define Positioning
            </button>
          </div>
        ) : (
          <>
            {/* Positioning Statement */}
            <section>
              <PositioningStatement
                positioning={positioning}
                onEdit={handleFieldEdit}
                editable={isEditing}
              />
            </section>

            {/* Transformation Story */}
            {(positioning.beforeState || positioning.afterState) && (
              <section className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-4">
                  Transformation Story
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {positioning.beforeState && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <h4 className="text-sm font-medium text-red-400 mb-2">Before</h4>
                      <p className="text-[rgb(var(--foreground))]">{positioning.beforeState}</p>
                    </div>
                  )}
                  {positioning.afterState && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <h4 className="text-sm font-medium text-green-400 mb-2">After</h4>
                      <p className="text-[rgb(var(--foreground))]">{positioning.afterState}</p>
                    </div>
                  )}
                </div>
                {positioning.transformationStory && (
                  <div className="mt-4">
                    <p className="text-[rgb(var(--foreground-secondary))] italic">
                      {positioning.transformationStory}
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Value Propositions */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-semibold text-[rgb(var(--foreground))]">
                  Value Propositions
                </h3>
              </div>
              <ValuePropositionCards positioning={positioning} />
            </section>

            {/* Proof Points */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-[rgb(var(--foreground))]">
                  Proof Points
                </h3>
              </div>
              <ProofPointsList positioning={positioning} />
            </section>

            {/* Positioning Axes */}
            {positioning.positioningAxes?.length > 0 && (
              <section className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-[rgb(var(--foreground))]">
                    Competitive Positioning
                  </h3>
                </div>
                <div className="space-y-6">
                  {positioning.positioningAxes.map((axis) => (
                    <div key={axis.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[rgb(var(--foreground-secondary))]">
                          {axis.lowEndLabel || 'Low'}
                        </span>
                        <span className="font-medium text-[rgb(var(--foreground))]">
                          {axis.name}
                          {axis.isDefining && (
                            <span className="ml-2 text-xs text-blue-400">(Defining)</span>
                          )}
                        </span>
                        <span className="text-[rgb(var(--foreground-secondary))]">
                          {axis.highEndLabel || 'High'}
                        </span>
                      </div>
                      <div className="relative h-3 bg-[rgb(var(--background))] rounded-full">
                        {/* Brand Position */}
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"
                          style={{ left: `${axis.brandPosition}%` }}
                          title={`Your position: ${axis.brandPosition}%`}
                        />
                        {/* Competitor Positions */}
                        {axis.competitorPositions &&
                          Object.entries(axis.competitorPositions).map(([name, position]) => (
                            <div
                              key={name}
                              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500/50 rounded-full"
                              style={{ left: `${position}%` }}
                              title={`${name}: ${position}%`}
                            />
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Pricing Position */}
            {positioning.pricingPosition && (
              <section className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-4">
                  Pricing Strategy
                </h3>
                <div className="flex items-center gap-4">
                  <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-full font-medium">
                    {positioning.pricingPosition}
                  </span>
                  {positioning.pricingRationale && (
                    <p className="text-[rgb(var(--foreground-secondary))]">
                      {positioning.pricingRationale}
                    </p>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
