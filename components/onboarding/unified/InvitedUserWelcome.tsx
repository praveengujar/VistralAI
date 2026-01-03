'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CheckCircle, Users, Shield, ArrowRight, Loader2, Sparkles } from 'lucide-react';

interface InvitedUserWelcomeProps {
  organizationName?: string;
  role?: 'ADMIN' | 'MEMBER';
  onComplete?: () => void;
}

export function InvitedUserWelcome({
  organizationName,
  role = 'MEMBER',
  onComplete,
}: InvitedUserWelcomeProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleContinue = async () => {
    setIsRedirecting(true);

    try {
      // Update session to mark onboarding as complete
      await updateSession();

      // Call onComplete callback if provided
      if (onComplete) {
        onComplete();
      } else {
        // Default: redirect to dashboard
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      setIsRedirecting(false);
    }
  };

  const roleInfo = {
    ADMIN: {
      title: 'Administrator',
      description: 'You have full access to all features including team management and billing.',
      permissions: [
        'View and edit brand data',
        'Run AI perception scans',
        'View insights and recommendations',
        'Manage team members',
        'Access billing settings',
      ],
    },
    MEMBER: {
      title: 'Team Member',
      description: 'You have access to view and manage brand data.',
      permissions: [
        'View and edit brand data',
        'Run AI perception scans',
        'View insights and recommendations',
        'Access reports and analytics',
      ],
    },
  };

  const info = roleInfo[role];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 px-4 py-12">
      <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-10 text-center text-white">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10" />
          </div>

          <h1 className="text-3xl font-bold mb-2">Welcome to VistralAI!</h1>

          <p className="text-primary-100 text-lg">
            You&apos;ve joined{' '}
            <span className="font-semibold text-white">{organizationName || 'your team'}</span>
          </p>
        </div>

        {/* Content */}
        <div className="px-8 py-8">
          {/* Role Badge */}
          <div className="flex items-center gap-3 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl mb-6">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{info.title}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{info.description}</p>
            </div>
          </div>

          {/* Permissions */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">
              Your Access
            </h3>
            <ul className="space-y-3">
              {info.permissions.map((permission, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{permission}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Tips */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 mb-8">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Quick Tips</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>
                <span className="font-medium">Dashboard:</span> View your brand&apos;s AI presence
                metrics at a glance
              </li>
              <li>
                <span className="font-medium">Perception Scans:</span> Run scans to see how AI
                platforms perceive your brand
              </li>
              <li>
                <span className="font-medium">Insights:</span> Get actionable recommendations to
                improve visibility
              </li>
            </ul>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleContinue}
            disabled={isRedirecting}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 disabled:opacity-70 transition-colors"
          >
            {isRedirecting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Getting things ready...
              </>
            ) : (
              <>
                Go to Dashboard
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default InvitedUserWelcome;
