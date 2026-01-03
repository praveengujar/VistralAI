'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Users,
  Mail,
  LogIn,
  UserPlus,
  AlertTriangle,
} from 'lucide-react';
import { useValidateInvitation, useAcceptInvitation } from '@/lib/query/teamHooks';
import { toast } from 'sonner';

export default function InvitationPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus, update: updateSession } = useSession();
  const token = params?.token as string;

  const { data: validationData, isLoading: isValidating, error: validationError } = useValidateInvitation(token);
  const acceptInvitation = useAcceptInvitation();

  const [isAccepting, setIsAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const invitation = validationData?.data?.invitation;
  const isValid = validationData?.data?.valid;
  const isAuthenticated = sessionStatus === 'authenticated';
  const isLoadingSession = sessionStatus === 'loading';
  const userEmail = session?.user?.email;

  // Check if user's email matches invitation
  const emailMatches = invitation?.email?.toLowerCase() === userEmail?.toLowerCase();

  // Auto-accept if authenticated and email matches
  useEffect(() => {
    if (isAuthenticated && isValid && emailMatches && !accepted && !isAccepting) {
      handleAccept();
    }
  }, [isAuthenticated, isValid, emailMatches, accepted, isAccepting]);

  const handleAccept = async () => {
    if (!token || isAccepting) return;

    setIsAccepting(true);
    try {
      const result = await acceptInvitation.mutateAsync(token);
      setAccepted(true);

      // Update session to include new organization context
      await updateSession();

      toast.success('Welcome to the team!');

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to accept invitation');
      setIsAccepting(false);
    }
  };

  const handleSignIn = () => {
    // Store the invitation token in session storage for after auth
    sessionStorage.setItem('pendingInviteToken', token);
    signIn(undefined, { callbackUrl: `/invite/${token}` });
  };

  const handleSignUp = () => {
    sessionStorage.setItem('pendingInviteToken', token);
    router.push(`/auth/register?invite=${token}&email=${encodeURIComponent(invitation?.email || '')}`);
  };

  // Loading state
  if (isValidating || isLoadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Validating invitation...</p>
        </div>
      </div>
    );
  }

  // Invalid/expired invitation
  if (!isValid || validationError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-error-50 to-error-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-error-100 dark:bg-error-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-error-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Invitation Not Valid
          </h1>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {validationError instanceof Error
              ? validationError.message
              : 'This invitation has expired, been revoked, or was already used.'}
          </p>

          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <LogIn className="w-5 h-5" />
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Invitation accepted
  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-success-50 to-success-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-success-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to {invitation?.organizationName}!
          </h1>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You&apos;ve successfully joined as a {invitation?.role === 'ADMIN' ? 'Team Admin' : 'Team Member'}.
          </p>

          <div className="flex items-center justify-center gap-2 text-primary-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Redirecting to dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated - show sign in/up options
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-10 h-10 text-primary-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              You&apos;re Invited!
            </h1>

            <p className="text-gray-600 dark:text-gray-300">
              <span className="font-medium">{invitation?.inviterName}</span> has invited you to join{' '}
              <span className="font-medium">{invitation?.organizationName}</span> on VistralAI.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Users className="w-6 h-6 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {invitation?.role === 'ADMIN' ? 'Administrator' : 'Team Member'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {invitation?.role === 'ADMIN'
                    ? 'Full access including billing & team management'
                    : 'Can view and edit brand data'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Clock className="w-6 h-6 text-warning-600" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Expires</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(invitation?.expiresAt || '').toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSignIn}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <LogIn className="w-5 h-5" />
              Sign In to Accept
            </button>

            <button
              onClick={handleSignUp}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              Create Account
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Invitation sent to <span className="font-medium">{invitation?.email}</span>
          </p>
        </div>
      </div>
    );
  }

  // Authenticated but email doesn't match
  if (!emailMatches) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-warning-50 to-warning-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-warning-100 dark:bg-warning-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-warning-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Email Mismatch
          </h1>

          <p className="text-gray-600 dark:text-gray-300 mb-4">
            This invitation was sent to <span className="font-medium">{invitation?.email}</span>, but
            you&apos;re signed in as <span className="font-medium">{userEmail}</span>.
          </p>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Please sign in with the correct email address to accept this invitation.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => signIn()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <LogIn className="w-5 h-5" />
              Sign In with Different Account
            </button>

            <Link
              href="/dashboard"
              className="block w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-center"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated and accepting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Joining {invitation?.organizationName}
        </h1>

        <p className="text-gray-600 dark:text-gray-300">
          Setting up your access as {invitation?.role === 'ADMIN' ? 'Administrator' : 'Team Member'}...
        </p>
      </div>
    </div>
  );
}
