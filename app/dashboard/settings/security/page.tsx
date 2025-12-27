'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Shield,
  Key,
  Smartphone,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  Check,
  Copy,
  Monitor,
  MapPin,
  Clock,
} from 'lucide-react';

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface Session {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export default function SecuritySettingsPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // MFA State
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [mfaQrCode, setMfaQrCode] = useState<string | null>(null);
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [mfaVerifyCode, setMfaVerifyCode] = useState('');
  const [mfaSetupStep, setMfaSetupStep] = useState<'qr' | 'verify' | 'backup'>('qr');

  // Sessions State
  const [sessions, setSessions] = useState<Session[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PasswordFormData>();

  const newPassword = watch('newPassword');

  // Load MFA status
  useEffect(() => {
    // TODO: Fetch MFA status from API
    setMfaEnabled(false);
  }, []);

  // Load active sessions
  useEffect(() => {
    // Mock sessions for now
    setSessions([
      {
        id: '1',
        device: 'MacBook Pro',
        browser: 'Chrome 120',
        location: 'San Francisco, CA',
        lastActive: 'Active now',
        isCurrent: true,
      },
      {
        id: '2',
        device: 'iPhone 15',
        browser: 'Safari',
        location: 'San Francisco, CA',
        lastActive: '2 hours ago',
        isCurrent: false,
      },
    ]);
  }, []);

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update password');
      }

      toast.success('Password updated successfully');
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const startMfaSetup = async () => {
    try {
      const response = await fetch('/api/user/mfa/setup', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to start MFA setup');
      }

      const data = await response.json();
      setMfaQrCode(data.qrCode);
      setMfaSecret(data.secret);
      setBackupCodes(data.backupCodes);
      setMfaSetupStep('qr');
      setShowMfaSetup(true);
    } catch {
      toast.error('Failed to start MFA setup');
    }
  };

  const verifyMfaSetup = async () => {
    try {
      const response = await fetch('/api/user/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: mfaVerifyCode,
          secret: mfaSecret,
          backupCodes,
        }),
      });

      if (!response.ok) {
        throw new Error('Invalid verification code');
      }

      setMfaSetupStep('backup');
    } catch {
      toast.error('Invalid verification code. Please try again.');
    }
  };

  const completeMfaSetup = () => {
    setMfaEnabled(true);
    setShowMfaSetup(false);
    toast.success('Two-factor authentication enabled');
  };

  const disableMfa = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication?')) {
      return;
    }

    try {
      const response = await fetch('/api/user/mfa', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to disable MFA');
      }

      setMfaEnabled(false);
      toast.success('Two-factor authentication disabled');
    } catch {
      toast.error('Failed to disable two-factor authentication');
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/user/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to revoke session');
      }

      setSessions(sessions.filter((s) => s.id !== sessionId));
      toast.success('Session revoked successfully');
    } catch {
      toast.error('Failed to revoke session');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold" style={{ color: 'rgb(var(--foreground))' }}>Security Settings</h2>
        <p className="text-sm" style={{ color: 'rgb(var(--foreground-muted))' }}>Manage your account security and authentication</p>
      </div>

      {/* Password Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-secondary-400" />
          <h3 className="font-medium" style={{ color: 'rgb(var(--foreground))' }}>Change Password</h3>
        </div>

        <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                {...register('currentPassword', { required: 'Current password is required' })}
                className="input w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="mt-1 text-sm text-error-600">{errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                {...register('newPassword', {
                  required: 'New password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                })}
                className="input w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-sm text-error-600">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>
              Confirm New Password
            </label>
            <input
              type="password"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) => value === newPassword || 'Passwords do not match',
              })}
              className="input w-full"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-error-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Update Password
          </button>
        </form>
      </section>

      <hr style={{ borderColor: 'rgb(var(--border))' }} />

      {/* MFA Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-secondary-400" />
          <h3 className="font-medium" style={{ color: 'rgb(var(--foreground))' }}>Two-Factor Authentication</h3>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: 'rgb(var(--background-secondary))' }}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${mfaEnabled ? 'bg-success-100' : ''}`} style={!mfaEnabled ? { backgroundColor: 'rgb(var(--background-tertiary))' } : {}}>
              <Shield className={`w-5 h-5 ${mfaEnabled ? 'text-success-600' : 'text-secondary-400'}`} />
            </div>
            <div>
              <p className="font-medium" style={{ color: 'rgb(var(--foreground))' }}>
                {mfaEnabled ? 'Enabled' : 'Not enabled'}
              </p>
              <p className="text-sm" style={{ color: 'rgb(var(--foreground-muted))' }}>
                {mfaEnabled
                  ? 'Your account is protected with 2FA'
                  : 'Add an extra layer of security to your account'}
              </p>
            </div>
          </div>

          {mfaEnabled ? (
            <button
              onClick={disableMfa}
              className="px-4 py-2 text-error-600 border border-error-300 rounded-lg hover:bg-error-50 transition-colors"
            >
              Disable
            </button>
          ) : (
            <button
              onClick={startMfaSetup}
              className="btn-primary"
            >
              Enable
            </button>
          )}
        </div>

        {/* MFA Setup Modal */}
        {showMfaSetup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="rounded-xl shadow-xl max-w-md w-full mx-4 p-6" style={{ backgroundColor: 'rgb(var(--surface))' }}>
              {mfaSetupStep === 'qr' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold" style={{ color: 'rgb(var(--foreground))' }}>Scan QR Code</h3>
                  <p className="text-sm" style={{ color: 'rgb(var(--foreground-secondary))' }}>
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                  </p>
                  {mfaQrCode && (
                    <div className="flex justify-center p-4 bg-white rounded-lg border" style={{ borderColor: 'rgb(var(--border))' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mfaQrCode} alt="MFA QR Code" className="w-48 h-48" />
                    </div>
                  )}
                  <p className="text-xs text-center" style={{ color: 'rgb(var(--foreground-muted))' }}>
                    Or enter this code manually: <br />
                    <code className="px-2 py-1 rounded" style={{ backgroundColor: 'rgb(var(--background-tertiary))' }}>{mfaSecret}</code>
                    <button
                      onClick={() => copyToClipboard(mfaSecret || '')}
                      className="ml-2 text-primary-600 hover:text-primary-700"
                    >
                      <Copy className="w-4 h-4 inline" />
                    </button>
                  </p>
                  <button
                    onClick={() => setMfaSetupStep('verify')}
                    className="btn-primary w-full"
                  >
                    Continue
                  </button>
                </div>
              )}

              {mfaSetupStep === 'verify' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold" style={{ color: 'rgb(var(--foreground))' }}>Verify Code</h3>
                  <p className="text-sm" style={{ color: 'rgb(var(--foreground-secondary))' }}>
                    Enter the 6-digit code from your authenticator app
                  </p>
                  <input
                    type="text"
                    value={mfaVerifyCode}
                    onChange={(e) => setMfaVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="input w-full text-center text-2xl tracking-widest"
                    maxLength={6}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setMfaSetupStep('qr')}
                      className="btn-secondary flex-1"
                    >
                      Back
                    </button>
                    <button
                      onClick={verifyMfaSetup}
                      disabled={mfaVerifyCode.length !== 6}
                      className="btn-primary flex-1 disabled:opacity-50"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              )}

              {mfaSetupStep === 'backup' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-success-600">
                    <Check className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">Backup Codes</h3>
                  </div>
                  <p className="text-sm" style={{ color: 'rgb(var(--foreground-secondary))' }}>
                    Save these backup codes in a secure place. You can use them to access your account
                    if you lose your authenticator device.
                  </p>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgb(var(--background-secondary))' }}>
                    <div className="grid grid-cols-2 gap-2">
                      {backupCodes.map((code, index) => (
                        <code key={index} className="text-sm font-mono px-2 py-1 rounded" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
                          {code}
                        </code>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(backupCodes.join('\n'))}
                    className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
                  >
                    <Copy className="w-4 h-4" />
                    Copy all codes
                  </button>
                  <div className="flex items-start gap-2 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-warning-600 shrink-0" />
                    <p className="text-sm text-warning-800">
                      Each backup code can only be used once. Store them securely!
                    </p>
                  </div>
                  <button
                    onClick={completeMfaSetup}
                    className="btn-primary w-full"
                  >
                    Done
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowMfaSetup(false)}
                className="absolute top-4 right-4 text-secondary-400 hover:text-secondary-600"
              >
                &times;
              </button>
            </div>
          </div>
        )}
      </section>

      <hr style={{ borderColor: 'rgb(var(--border))' }} />

      {/* Active Sessions Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Monitor className="w-5 h-5 text-secondary-400" />
          <h3 className="font-medium" style={{ color: 'rgb(var(--foreground))' }}>Active Sessions</h3>
        </div>

        <div className="space-y-3">
          {sessions.map((sessionItem) => (
            <div
              key={sessionItem.id}
              className="flex items-center justify-between p-4 rounded-lg"
              style={{ backgroundColor: 'rgb(var(--background-secondary))' }}
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgb(var(--surface))' }}>
                  <Monitor className="w-5 h-5 text-secondary-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium" style={{ color: 'rgb(var(--foreground))' }}>{sessionItem.device}</p>
                    {sessionItem.isCurrent && (
                      <span className="px-2 py-0.5 text-xs bg-success-100 text-success-700 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm" style={{ color: 'rgb(var(--foreground-muted))' }}>
                    <span>{sessionItem.browser}</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {sessionItem.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {sessionItem.lastActive}
                    </span>
                  </div>
                </div>
              </div>

              {!sessionItem.isCurrent && (
                <button
                  onClick={() => revokeSession(sessionItem.id)}
                  className="text-error-600 hover:text-error-700 text-sm font-medium"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <hr style={{ borderColor: 'rgb(var(--border))' }} />

      {/* Danger Zone */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-error-500" />
          <h3 className="font-medium text-error-600">Danger Zone</h3>
        </div>

        <div className="p-4 border border-error-200 rounded-lg bg-error-50">
          <h4 className="font-medium text-error-900">Delete Account</h4>
          <p className="text-sm text-error-700 mt-1">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button className="mt-3 px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 transition-colors">
            Delete Account
          </button>
        </div>
      </section>
    </div>
  );
}
