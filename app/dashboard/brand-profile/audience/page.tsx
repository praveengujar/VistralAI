'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PersonaCard } from '@/components/audience/PersonaCard';
import {
  useTargetAudience,
  usePersonas,
  useDeletePersona,
  CustomerPersona,
} from '@/lib/query/audienceHooks';
import { useBrand360Profile } from '@/lib/query/hooks';
import {
  Users,
  Target,
  Building2,
  Briefcase,
  MapPin,
  Plus,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function AudiencePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedPersona, setSelectedPersona] = useState<CustomerPersona | null>(null);

  // Fetch brand360 profile to get brand360Id
  const organizationId = (session?.user as any)?.organizationId;
  const { data: brandProfile, isLoading: brandLoading } = useBrand360Profile(organizationId);
  const brand360Id = brandProfile?.id;

  // Fetch audience data
  const { data: audienceData, isLoading: audienceLoading } = useTargetAudience(brand360Id);
  const { mutate: deletePersona, isPending: isDeleting } = useDeletePersona();

  if (status === 'loading' || brandLoading || audienceLoading) {
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

  const audience = audienceData?.data?.audience;
  const personas = audienceData?.data?.personas || [];

  const handleEditPersona = (persona: CustomerPersona) => {
    setSelectedPersona(persona);
    // TODO: Open edit modal
  };

  const handleDeletePersona = (personaId: string) => {
    if (confirm('Are you sure you want to delete this persona?')) {
      deletePersona({ id: personaId, brand360Id });
    }
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
              <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">Target Audience</h1>
              <p className="text-[rgb(var(--foreground-secondary))]">
                Understand your ideal customers and their needs
              </p>
            </div>
          </div>
          <button
            onClick={() => {/* TODO: Open add persona modal */}}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Persona
          </button>
        </div>

        {/* Audience Overview */}
        {audience && (
          <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-4">
              Audience Overview
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Primary Market */}
              <div className="p-4 bg-[rgb(var(--background))] rounded-lg">
                <div className="flex items-center gap-2 text-[rgb(var(--foreground-secondary))] mb-2">
                  <Target className="w-4 h-4" />
                  <span className="text-sm">Market Type</span>
                </div>
                <p className="text-lg font-medium text-[rgb(var(--foreground))]">
                  {audience.primaryMarket || 'Not set'}
                </p>
              </div>

              {/* Geographic Focus */}
              <div className="p-4 bg-[rgb(var(--background))] rounded-lg">
                <div className="flex items-center gap-2 text-[rgb(var(--foreground-secondary))] mb-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">Geographic Focus</span>
                </div>
                <p className="text-lg font-medium text-[rgb(var(--foreground))]">
                  {audience.geographicFocus || 'Global'}
                </p>
              </div>

              {/* Industries */}
              <div className="p-4 bg-[rgb(var(--background))] rounded-lg">
                <div className="flex items-center gap-2 text-[rgb(var(--foreground-secondary))] mb-2">
                  <Building2 className="w-4 h-4" />
                  <span className="text-sm">Industries</span>
                </div>
                <p className="text-lg font-medium text-[rgb(var(--foreground))]">
                  {audience.targetIndustries?.length || 0}
                </p>
              </div>

              {/* Job Titles */}
              <div className="p-4 bg-[rgb(var(--background))] rounded-lg">
                <div className="flex items-center gap-2 text-[rgb(var(--foreground-secondary))] mb-2">
                  <Briefcase className="w-4 h-4" />
                  <span className="text-sm">Target Roles</span>
                </div>
                <p className="text-lg font-medium text-[rgb(var(--foreground))]">
                  {audience.targetJobTitles?.length || 0}
                </p>
              </div>
            </div>

            {/* Industries List */}
            {audience.targetIndustries?.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-[rgb(var(--foreground))] mb-2">
                  Target Industries
                </h3>
                <div className="flex flex-wrap gap-2">
                  {audience.targetIndustries.map((industry: string, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1 text-sm bg-blue-500/20 text-blue-400 rounded-full"
                    >
                      {industry}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Job Titles List */}
            {audience.targetJobTitles?.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-[rgb(var(--foreground))] mb-2">
                  Target Job Titles
                </h3>
                <div className="flex flex-wrap gap-2">
                  {audience.targetJobTitles.map((title: string, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1 text-sm bg-purple-500/20 text-purple-400 rounded-full"
                    >
                      {title}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Personas Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[rgb(var(--foreground))] flex items-center gap-2">
              <Users className="w-5 h-5" />
              Customer Personas ({personas.length})
            </h2>
          </div>

          {personas.length === 0 ? (
            <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-12 text-center">
              <Users className="w-12 h-12 text-[rgb(var(--foreground-secondary))] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[rgb(var(--foreground))] mb-2">
                No Personas Yet
              </h3>
              <p className="text-[rgb(var(--foreground-secondary))] mb-4">
                Create customer personas to better understand your target audience.
              </p>
              <button
                onClick={() => {/* TODO: Open add persona modal */}}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Create First Persona
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {personas.map((persona) => (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  onEdit={handleEditPersona}
                  onDelete={handleDeletePersona}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
