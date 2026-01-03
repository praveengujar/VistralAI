'use client';

import { useState } from 'react';
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
  RefreshCw,
} from 'lucide-react';
import {
  useOrganizationMembers,
  useOrganizationInvitations,
  useInviteMember,
  useUpdateMemberRole,
  useRemoveMember,
  useRevokeInvitation,
  useResendInvitation,
  MemberRole,
} from '@/lib/query/teamHooks';

const roleLabels: Record<string, { label: string; color: string; description: string }> = {
  ADMIN: {
    label: 'Admin',
    color: 'bg-primary-500/10 text-primary-700 dark:text-primary-300',
    description: 'Full access including billing & team management',
  },
  MEMBER: {
    label: 'Member',
    color: 'bg-success-500/10 text-success-700 dark:text-success-300',
    description: 'Can view and edit brand data, run scans',
  },
};

export default function TeamMembersPage() {
  const { data: session } = useSession();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MemberRole>('MEMBER');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // React Query hooks
  const { data: membersData, isLoading: membersLoading } = useOrganizationMembers();
  const { data: invitationsData, isLoading: invitationsLoading } = useOrganizationInvitations('PENDING');
  const inviteMember = useInviteMember();
  const updateMemberRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const revokeInvitation = useRevokeInvitation();
  const resendInvitation = useResendInvitation();

  const members = membersData?.data?.members || [];
  const invitations = invitationsData?.data?.invitations || [];
  const currentUserRole = membersData?.data?.meta?.currentUserRole;

  // Check if current user is admin
  const isAdmin = currentUserRole === 'ADMIN';
  const currentUserId = (session?.user as any)?.id;

  const handleInvite = async () => {
    if (!inviteEmail) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      await inviteMember.mutateAsync({ email: inviteEmail, role: inviteRole });
      toast.success('Invitation sent successfully');
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('MEMBER');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send invitation');
    }
  };

  const handleRoleChange = async (memberId: string, newRole: MemberRole) => {
    try {
      await updateMemberRole.mutateAsync({ memberId, role: newRole });
      toast.success('Role updated successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update role');
    }
    setActiveDropdown(null);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) {
      return;
    }

    try {
      await removeMember.mutateAsync(memberId);
      toast.success('Member removed successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove member');
    }
    setActiveDropdown(null);
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    try {
      await revokeInvitation.mutateAsync(invitationId);
      toast.success('Invitation revoked');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to revoke invitation');
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      await resendInvitation.mutateAsync(invitationId);
      toast.success('Invitation resent');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to resend invitation');
    }
  };

  if (membersLoading) {
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
          <h2 className="text-lg font-semibold" style={{ color: 'rgb(var(--foreground))' }}>
            Team Members
          </h2>
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
        {members.length === 0 ? (
          <div
            className="p-8 text-center rounded-lg"
            style={{ backgroundColor: 'rgb(var(--background-secondary))' }}
          >
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" style={{ color: 'rgb(var(--foreground-muted))' }} />
            <p style={{ color: 'rgb(var(--foreground-muted))' }}>No team members found</p>
          </div>
        ) : (
          members.map((member) => (
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
                      alt={member.name || member.email}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-primary-600 font-semibold">
                      {(member.name || member.email).charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium" style={{ color: 'rgb(var(--foreground))' }}>
                      {member.name || member.email}
                    </p>
                    {member.userId === currentUserId && (
                      <span className="text-xs" style={{ color: 'rgb(var(--foreground-muted))' }}>
                        (You)
                      </span>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: 'rgb(var(--foreground-muted))' }}>
                    {member.email}
                  </p>
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

                {isAdmin && member.userId !== currentUserId && (
                  <div className="relative">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === member.id ? null : member.id)}
                      className="p-1 rounded"
                      style={{ color: 'rgb(var(--foreground-muted))' }}
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {activeDropdown === member.id && (
                      <div
                        className="absolute right-0 mt-1 w-56 rounded-lg shadow-lg py-1 z-10"
                        style={{
                          backgroundColor: 'rgb(var(--surface))',
                          border: '1px solid rgb(var(--border))',
                        }}
                      >
                        <div
                          className="px-3 py-2 text-xs font-semibold uppercase"
                          style={{ color: 'rgb(var(--foreground-muted))' }}
                        >
                          Change Role
                        </div>
                        {(['ADMIN', 'MEMBER'] as MemberRole[]).map((role) => (
                          <button
                            key={role}
                            onClick={() => handleRoleChange(member.id, role)}
                            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-primary-500/10"
                            style={
                              member.role !== role
                                ? { color: 'rgb(var(--foreground-secondary))' }
                                : { color: 'rgb(var(--primary))' }
                            }
                          >
                            {member.role === role && <Check className="w-4 h-4" />}
                            <Shield className={`w-4 h-4 ${member.role === role ? '' : 'ml-6'}`} />
                            <div>
                              <span>{roleLabels[role]?.label}</span>
                              <p className="text-xs opacity-70">{roleLabels[role]?.description}</p>
                            </div>
                          </button>
                        ))}
                        <hr className="my-1" style={{ borderColor: 'rgb(var(--border))' }} />
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="w-full px-3 py-2 text-left text-sm text-error-600 hover:bg-error-500/10 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4 ml-6" />
                          Remove from team
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold" style={{ color: 'rgb(var(--foreground-secondary))' }}>
            Pending Invitations
          </h3>

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
                    <p className="font-medium" style={{ color: 'rgb(var(--foreground))' }}>
                      {invitation.email}
                    </p>
                    <div
                      className="flex items-center gap-2 text-sm"
                      style={{ color: 'rgb(var(--foreground-muted))' }}
                    >
                      <Clock className="w-3 h-3" />
                      Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${roleLabels[invitation.role]?.color}`}
                  >
                    {roleLabels[invitation.role]?.label}
                  </span>

                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResendInvitation(invitation.id)}
                        className="p-1.5 rounded hover:bg-primary-500/10 text-primary-600"
                        title="Resend invitation"
                        disabled={resendInvitation.isPending}
                      >
                        <RefreshCw className={`w-4 h-4 ${resendInvitation.isPending ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleRevokeInvitation(invitation.id)}
                        className="p-1.5 rounded hover:bg-error-500/10 text-error-600"
                        title="Revoke invitation"
                        disabled={revokeInvitation.isPending}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
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
          <div
            className="rounded-xl shadow-xl max-w-md w-full mx-4 p-6"
            style={{
              backgroundColor: 'rgb(var(--surface))',
              border: '1px solid rgb(var(--border))',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'rgb(var(--foreground))' }}>
                Invite Team Member
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                style={{ color: 'rgb(var(--foreground-muted))' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'rgb(var(--foreground-secondary))' }}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  style={{
                    backgroundColor: 'rgb(var(--background-secondary))',
                    border: '1px solid rgb(var(--border))',
                    color: 'rgb(var(--foreground))',
                  }}
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'rgb(var(--foreground-secondary))' }}
                >
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                  className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  style={{
                    backgroundColor: 'rgb(var(--background-secondary))',
                    border: '1px solid rgb(var(--border))',
                    color: 'rgb(var(--foreground))',
                  }}
                >
                  <option value="ADMIN">Admin - Full access including billing & team</option>
                  <option value="MEMBER">Member - Can view and edit brand data</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg"
                  style={{
                    border: '1px solid rgb(var(--border))',
                    color: 'rgb(var(--foreground-secondary))',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={inviteMember.isPending || !inviteEmail}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {inviteMember.isPending ? (
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
