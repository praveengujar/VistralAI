'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import {
  Users,
  UserPlus,
  Mail,
  MoreVertical,
  Shield,
  Trash2,
  Clock,
  X,
  Loader2,
  Check,
} from 'lucide-react';

interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  status: 'ACTIVE' | 'PENDING';
  avatarUrl?: string;
  joinedAt: string;
}

interface Invitation {
  id: string;
  email: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
  expiresAt: string;
  createdAt: string;
}

const roleLabels: Record<string, { label: string; color: string }> = {
  OWNER: { label: 'Owner', color: 'bg-primary-500/10 text-primary-700 dark:text-primary-300' },
  ADMIN: { label: 'Admin', color: 'bg-info-500/10 text-info-700 dark:text-info-300' },
  MEMBER: { label: 'Member', color: 'bg-success-500/10 text-success-700 dark:text-success-300' },
  VIEWER: { label: 'Viewer', color: 'bg-secondary-500/10 text-secondary-700 dark:text-secondary-300' },
};

export default function TeamMembersPage() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER');
  const [isSending, setIsSending] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Check if current user is admin
  const isAdmin =
    (session?.user as any)?.organizationRole === 'ADMIN' ||
    (session?.user as any)?.organizationRole === 'OWNER';

  useEffect(() => {
    loadMembers();
    loadInvitations();
  }, []);

  const loadMembers = async () => {
    try {
      // Mock data for now
      setMembers([
        {
          id: '1',
          userId: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'OWNER',
          status: 'ACTIVE',
          joinedAt: '2024-01-15',
        },
        {
          id: '2',
          userId: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'ADMIN',
          status: 'ACTIVE',
          joinedAt: '2024-02-20',
        },
        {
          id: '3',
          userId: '3',
          name: 'Bob Johnson',
          email: 'bob@example.com',
          role: 'MEMBER',
          status: 'ACTIVE',
          joinedAt: '2024-03-10',
        },
      ]);
    } catch {
      toast.error('Failed to load team members');
    } finally {
      setIsLoading(false);
    }
  };

  const loadInvitations = async () => {
    try {
      // Mock data for now
      setInvitations([
        {
          id: '1',
          email: 'pending@example.com',
          role: 'MEMBER',
          expiresAt: '2024-12-25',
          createdAt: '2024-12-18',
        },
      ]);
    } catch {
      // Silently fail
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) {
      toast.error('Please enter an email address');
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch('/api/organization/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send invitation');
      }

      toast.success('Invitation sent successfully');
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('MEMBER');
      loadInvitations();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send invitation');
    } finally {
      setIsSending(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/organization/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      setMembers(
        members.map((m) => (m.id === memberId ? { ...m, role: newRole as Member['role'] } : m))
      );
      toast.success('Role updated successfully');
    } catch {
      toast.error('Failed to update role');
    }

    setActiveDropdown(null);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) {
      return;
    }

    try {
      const response = await fetch(`/api/organization/members/${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove member');
      }

      setMembers(members.filter((m) => m.id !== memberId));
      toast.success('Member removed successfully');
    } catch {
      toast.error('Failed to remove member');
    }

    setActiveDropdown(null);
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/organization/invitations/${invitationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to revoke invitation');
      }

      setInvitations(invitations.filter((i) => i.id !== invitationId));
      toast.success('Invitation revoked');
    } catch {
      toast.error('Failed to revoke invitation');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'rgb(var(--foreground))' }}>Team Members</h2>
          <p className="text-sm" style={{ color: 'rgb(var(--foreground-muted))' }}>
            Manage your team and their permissions
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        )}
      </div>

      {/* Members List */}
      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-4 rounded-lg transition-colors"
            style={{ backgroundColor: 'rgb(var(--background-secondary))' }}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                {member.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-primary-600 font-semibold">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium" style={{ color: 'rgb(var(--foreground))' }}>{member.name}</p>
                  {member.userId === session?.user?.id && (
                    <span className="text-xs" style={{ color: 'rgb(var(--foreground-muted))' }}>(You)</span>
                  )}
                </div>
                <p className="text-sm" style={{ color: 'rgb(var(--foreground-muted))' }}>{member.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  roleLabels[member.role]?.color || 'bg-gray-100 text-gray-700'
                }`}
              >
                {roleLabels[member.role]?.label || member.role}
              </span>

              {isAdmin && member.role !== 'OWNER' && member.userId !== session?.user?.id && (
                <div className="relative">
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === member.id ? null : member.id)}
                    className="p-1 rounded"
                    style={{ color: 'rgb(var(--foreground-muted))' }}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {activeDropdown === member.id && (
                    <div className="absolute right-0 mt-1 w-48 rounded-lg shadow-lg py-1 z-10" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
                      <div className="px-3 py-2 text-xs font-semibold uppercase" style={{ color: 'rgb(var(--foreground-muted))' }}>
                        Change Role
                      </div>
                      {['ADMIN', 'MEMBER', 'VIEWER'].map((role) => (
                        <button
                          key={role}
                          onClick={() => handleRoleChange(member.id, role)}
                          className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                            member.role === role ? 'text-primary-600' : ''
                          }`}
                          style={member.role !== role ? { color: 'rgb(var(--foreground-secondary))' } : {}}
                        >
                          {member.role === role && <Check className="w-4 h-4" />}
                          <Shield className={`w-4 h-4 ${member.role === role ? '' : 'ml-6'}`} />
                          {roleLabels[role]?.label}
                        </button>
                      ))}
                      <hr className="my-1" style={{ borderColor: 'rgb(var(--border))' }} />
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="w-full px-3 py-2 text-left text-sm text-error-600 hover:bg-error-500/10 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4 ml-6" />
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold" style={{ color: 'rgb(var(--foreground-secondary))' }}>Pending Invitations</h3>

          <div className="space-y-2">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-4 bg-warning-500/10 border border-warning-500/30 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-warning-500/20 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-warning-600" />
                  </div>

                  <div>
                    <p className="font-medium" style={{ color: 'rgb(var(--foreground))' }}>{invitation.email}</p>
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'rgb(var(--foreground-muted))' }}>
                      <Clock className="w-3 h-3" />
                      Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      roleLabels[invitation.role]?.color
                    }`}
                  >
                    {roleLabels[invitation.role]?.label}
                  </span>

                  {isAdmin && (
                    <button
                      onClick={() => handleRevokeInvitation(invitation.id)}
                      className="text-error-600 hover:text-error-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="rounded-xl shadow-xl max-w-md w-full mx-4 p-6" style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'rgb(var(--foreground))' }}>Invite Team Member</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                style={{ color: 'rgb(var(--foreground-muted))' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  style={{ backgroundColor: 'rgb(var(--background-secondary))', border: '1px solid rgb(var(--border))', color: 'rgb(var(--foreground))' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--foreground-secondary))' }}>Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  style={{ backgroundColor: 'rgb(var(--background-secondary))', border: '1px solid rgb(var(--border))', color: 'rgb(var(--foreground))' }}
                >
                  <option value="ADMIN">Admin - Full access</option>
                  <option value="MEMBER">Member - Can edit</option>
                  <option value="VIEWER">Viewer - Read only</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg"
                  style={{ border: '1px solid rgb(var(--border))', color: 'rgb(var(--foreground-secondary))' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={isSending || !inviteEmail}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
