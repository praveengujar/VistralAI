// Team Management React Query Hooks
// Hooks for organization members and invitations

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ============================================
// Types
// ============================================

export type MemberRole = 'ADMIN' | 'MEMBER';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export interface OrganizationMember {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  role: MemberRole;
  status: string;
  joinedAt: string;
  avatarUrl?: string | null;
}

export interface Invitation {
  id: string;
  email: string;
  role: MemberRole;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  invitedBy?: {
    name: string | null;
    email: string;
  };
}

interface MembersResponse {
  success: boolean;
  data: {
    members: OrganizationMember[];
    meta: {
      total: number;
      currentUserRole: MemberRole | null;
    };
  };
}

interface InvitationsResponse {
  success: boolean;
  data: {
    invitations: Invitation[];
    meta: {
      total: number;
    };
  };
}

interface InvitationValidationResponse {
  success: boolean;
  data: {
    valid: boolean;
    invitation: {
      email: string;
      role: MemberRole;
      organizationName: string;
      inviterName: string;
      expiresAt: string;
    };
  };
}

// ============================================
// Query Keys
// ============================================

export const teamQueryKeys = {
  all: ['team'] as const,
  members: () => ['team', 'members'] as const,
  invitations: () => ['team', 'invitations'] as const,
  invitationByToken: (token: string) => ['team', 'invitation', token] as const,
};

// ============================================
// API Fetch Utility
// ============================================

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data;
}

// ============================================
// Member Hooks
// ============================================

/**
 * Fetch organization members
 */
export function useOrganizationMembers() {
  return useQuery<MembersResponse>({
    queryKey: teamQueryKeys.members(),
    queryFn: () => apiFetch('/api/organization/members'),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Update member role
 */
export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: MemberRole }) => {
      return apiFetch(`/api/organization/members/${memberId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.members() });
    },
  });
}

/**
 * Remove member from organization
 */
export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      return apiFetch(`/api/organization/members/${memberId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.members() });
    },
  });
}

// ============================================
// Invitation Hooks
// ============================================

/**
 * Fetch organization invitations
 */
export function useOrganizationInvitations(status?: InvitationStatus) {
  return useQuery<InvitationsResponse>({
    queryKey: [...teamQueryKeys.invitations(), status],
    queryFn: () => apiFetch(`/api/invitations${status ? `?status=${status}` : ''}`),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Invite a new member
 */
export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role?: MemberRole }) => {
      return apiFetch('/api/invitations', {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.invitations() });
    },
  });
}

/**
 * Revoke invitation
 */
export function useRevokeInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      return apiFetch(`/api/invitations/${invitationId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.invitations() });
    },
  });
}

/**
 * Resend invitation
 */
export function useResendInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      return apiFetch(`/api/invitations/${invitationId}/resend`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.invitations() });
    },
  });
}

// ============================================
// Invitation Acceptance Hooks
// ============================================

/**
 * Validate invitation token (public - no auth required)
 */
export function useValidateInvitation(token: string | undefined) {
  return useQuery<InvitationValidationResponse>({
    queryKey: teamQueryKeys.invitationByToken(token || ''),
    queryFn: () => apiFetch(`/api/invitations/validate?token=${token}`),
    enabled: !!token,
    staleTime: 60000, // 1 minute
    retry: false,
  });
}

/**
 * Accept invitation
 */
export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      return apiFetch('/api/invitations/accept', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
    },
    onSuccess: () => {
      // Invalidate all team-related queries
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.all });
      // Also invalidate user-related queries since org context changed
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

// ============================================
// Organization Hooks
// ============================================

/**
 * Create organization (for first-time setup)
 */
export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, logo }: { name: string; logo?: string }) => {
      return apiFetch('/api/organization/members', {
        method: 'POST',
        body: JSON.stringify({ name, logo }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.members() });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}
