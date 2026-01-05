// Invitation Management Service
// Handles team member invitations with token-based acceptance

import prisma from '@/lib/db/prisma';
import { createAuditLog } from './audit';
import { emailService } from './email';
import crypto from 'crypto';

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
export type MemberRole = 'ADMIN' | 'MEMBER';

const INVITATION_EXPIRY_DAYS = 7;

export interface Invitation {
  id: string;
  email: string;
  role: MemberRole;
  status: InvitationStatus;
  token: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  invitedById: string;
  organizationId: string;
  createdAt: Date;
  invitedBy?: {
    name: string | null;
    email: string;
  };
  organization?: {
    name: string;
  };
}

export interface CreateInvitationParams {
  organizationId: string;
  email: string;
  role: MemberRole;
  invitedById: string;
}

export interface InvitationResult {
  success: boolean;
  invitation?: Invitation;
  error?: string;
}

export interface AcceptInvitationResult {
  success: boolean;
  membership?: {
    id: string;
    organizationId: string;
    role: MemberRole;
  };
  organization?: {
    id: string;
    name: string;
  };
  error?: string;
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function getExpiryDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + INVITATION_EXPIRY_DAYS);
  return date;
}

function getInviteUrl(token: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/invite/${token}`;
}

export class InvitationService {
  /**
   * Create and send a new invitation
   */
  async createInvitation(params: CreateInvitationParams): Promise<InvitationResult> {
    const { organizationId, email, role, invitedById } = params;

    try {
      // Normalize email
      const normalizedEmail = email.toLowerCase().trim();

      // Check if user is already a member
      const existingMember = await prisma.membership.findFirst({
        where: {
          organizationId,
          user: { email: normalizedEmail },
          status: 'ACTIVE',
        },
      });

      if (existingMember) {
        return { success: false, error: 'User is already a member of this organization' };
      }

      // Check for existing pending invitation
      const existingInvitation = await prisma.invitation.findFirst({
        where: {
          organizationId,
          email: normalizedEmail,
          status: 'PENDING',
          expiresAt: { gt: new Date() },
        },
      });

      if (existingInvitation) {
        return { success: false, error: 'An invitation is already pending for this email' };
      }

      // Get inviter and organization info for email
      const [inviter, organization] = await Promise.all([
        prisma.user.findUnique({
          where: { id: invitedById },
          select: { name: true, email: true },
        }),
        prisma.organization.findUnique({
          where: { id: organizationId },
          select: { name: true },
        }),
      ]);

      if (!inviter || !organization) {
        return { success: false, error: 'Inviter or organization not found' };
      }

      // Create invitation
      const token = generateToken();
      const expiresAt = getExpiryDate();

      const invitation = await prisma.invitation.create({
        data: {
          email: normalizedEmail,
          role,
          status: 'PENDING',
          token,
          expiresAt,
          invitedById,
          organizationId,
        },
      });

      // Send invitation email
      const inviteUrl = getInviteUrl(token);
      const emailResult = await emailService.sendInvitation({
        to: normalizedEmail,
        inviterName: inviter.name || inviter.email,
        organizationName: organization.name,
        inviteUrl,
        role,
        expiresAt,
      });

      if (!emailResult.success) {
        console.warn('[InvitationService] Email failed but invitation created:', emailResult.error);
      }

      // Log the action
      await createAuditLog({
        action: 'org.member_invited',
        category: 'ORGANIZATION',
        status: 'SUCCESS',
        userId: invitedById,
        organizationId,
        description: `Invited ${normalizedEmail} as ${role}`,
        metadata: {
          invitedEmail: normalizedEmail,
          role,
          invitationId: invitation.id,
        },
      });

      return {
        success: true,
        invitation: {
          ...invitation,
          role: invitation.role as MemberRole,
          status: invitation.status as InvitationStatus,
        },
      };
    } catch (error) {
      console.error('[InvitationService] Failed to create invitation:', error);
      return { success: false, error: 'Failed to create invitation' };
    }
  }

  /**
   * Get invitation by token
   */
  async getInvitationByToken(token: string): Promise<Invitation | null> {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        invitedBy: {
          select: { name: true, email: true },
        },
        organization: {
          select: { name: true },
        },
      },
    });

    if (!invitation) return null;

    return {
      ...invitation,
      role: invitation.role as MemberRole,
      status: invitation.status as InvitationStatus,
    };
  }

  /**
   * Validate invitation token
   */
  async validateToken(token: string): Promise<{
    valid: boolean;
    invitation?: Invitation;
    error?: string;
  }> {
    const invitation = await this.getInvitationByToken(token);

    if (!invitation) {
      return { valid: false, error: 'Invitation not found' };
    }

    if (invitation.status === 'ACCEPTED') {
      return { valid: false, error: 'Invitation has already been accepted' };
    }

    if (invitation.status === 'REVOKED') {
      return { valid: false, error: 'Invitation has been revoked' };
    }

    if (invitation.expiresAt < new Date()) {
      // Update status to expired
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      return { valid: false, error: 'Invitation has expired' };
    }

    return { valid: true, invitation };
  }

  /**
   * Accept invitation and create membership
   */
  async acceptInvitation(token: string, userId: string): Promise<AcceptInvitationResult> {
    try {
      // Validate token
      const validation = await this.validateToken(token);
      if (!validation.valid || !validation.invitation) {
        return { success: false, error: validation.error };
      }

      const invitation = validation.invitation;

      // Get user and verify email matches
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true },
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Check if email matches (case-insensitive)
      if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
        return {
          success: false,
          error: 'This invitation was sent to a different email address',
        };
      }

      // Check if user already has a membership
      const existingMembership = await prisma.membership.findFirst({
        where: {
          userId,
          organizationId: invitation.organizationId,
        },
      });

      if (existingMembership) {
        return { success: false, error: 'You are already a member of this organization' };
      }

      // Create membership and update invitation in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update invitation
        await tx.invitation.update({
          where: { id: invitation.id },
          data: {
            status: 'ACCEPTED',
            acceptedAt: new Date(),
          },
        });

        // Create membership
        const membership = await tx.membership.create({
          data: {
            userId,
            organizationId: invitation.organizationId,
            role: invitation.role,
            status: 'ACTIVE',
            invitationId: invitation.id,
          },
        });

        // Update user's invitedVia field
        await tx.user.update({
          where: { id: userId },
          data: { invitedVia: invitation.id },
        });

        // Get organization for response
        const organization = await tx.organization.findUnique({
          where: { id: invitation.organizationId },
          select: { id: true, name: true },
        });

        return { membership, organization };
      });

      // Log the action
      await createAuditLog({
        action: 'org.member_joined',
        category: 'ORGANIZATION',
        status: 'SUCCESS',
        userId,
        organizationId: invitation.organizationId,
        description: `Accepted invitation and joined as ${invitation.role}`,
        metadata: {
          invitationId: invitation.id,
          role: invitation.role,
        },
      });

      return {
        success: true,
        membership: {
          id: result.membership.id,
          organizationId: result.membership.organizationId,
          role: result.membership.role as MemberRole,
        },
        organization: result.organization || undefined,
      };
    } catch (error) {
      console.error('[InvitationService] Failed to accept invitation:', error);
      return { success: false, error: 'Failed to accept invitation' };
    }
  }

  /**
   * Revoke a pending invitation
   */
  async revokeInvitation(
    invitationId: string,
    revokedByUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const invitation = await prisma.invitation.findUnique({
        where: { id: invitationId },
        include: { organization: true },
      });

      if (!invitation) {
        return { success: false, error: 'Invitation not found' };
      }

      if (invitation.status !== 'PENDING') {
        return { success: false, error: 'Only pending invitations can be revoked' };
      }

      await prisma.invitation.update({
        where: { id: invitationId },
        data: { status: 'REVOKED' },
      });

      // Log the action
      await createAuditLog({
        action: 'org.invitation_revoked',
        category: 'ORGANIZATION',
        status: 'SUCCESS',
        userId: revokedByUserId,
        organizationId: invitation.organizationId,
        description: `Revoked invitation for ${invitation.email}`,
        metadata: {
          invitationId,
          revokedEmail: invitation.email,
        },
      });

      return { success: true };
    } catch (error) {
      console.error('[InvitationService] Failed to revoke invitation:', error);
      return { success: false, error: 'Failed to revoke invitation' };
    }
  }

  /**
   * Resend invitation with new token and expiry
   */
  async resendInvitation(
    invitationId: string,
    resentByUserId: string
  ): Promise<InvitationResult> {
    try {
      const invitation = await prisma.invitation.findUnique({
        where: { id: invitationId },
        include: {
          invitedBy: { select: { name: true, email: true } },
          organization: { select: { name: true } },
        },
      });

      if (!invitation) {
        return { success: false, error: 'Invitation not found' };
      }

      if (invitation.status === 'ACCEPTED') {
        return { success: false, error: 'Invitation has already been accepted' };
      }

      // Generate new token and expiry
      const newToken = generateToken();
      const newExpiresAt = getExpiryDate();

      const updated = await prisma.invitation.update({
        where: { id: invitationId },
        data: {
          token: newToken,
          expiresAt: newExpiresAt,
          status: 'PENDING',
        },
      });

      // Resend email
      const inviteUrl = getInviteUrl(newToken);
      await emailService.sendInvitation({
        to: invitation.email,
        inviterName: invitation.invitedBy?.name || invitation.invitedBy?.email || 'Team Admin',
        organizationName: invitation.organization?.name || 'Your Team',
        inviteUrl,
        role: invitation.role,
        expiresAt: newExpiresAt,
      });

      // Log the action
      await createAuditLog({
        action: 'org.invitation_resent',
        category: 'ORGANIZATION',
        status: 'SUCCESS',
        userId: resentByUserId,
        organizationId: invitation.organizationId,
        description: `Resent invitation to ${invitation.email}`,
        metadata: {
          invitationId,
          email: invitation.email,
        },
      });

      return {
        success: true,
        invitation: {
          ...updated,
          role: updated.role as MemberRole,
          status: updated.status as InvitationStatus,
        },
      };
    } catch (error) {
      console.error('[InvitationService] Failed to resend invitation:', error);
      return { success: false, error: 'Failed to resend invitation' };
    }
  }

  /**
   * Get all invitations for an organization
   */
  async getOrganizationInvitations(
    organizationId: string,
    options?: { status?: InvitationStatus }
  ): Promise<Invitation[]> {
    const where: any = { organizationId };

    if (options?.status) {
      where.status = options.status;
    }

    const invitations = await prisma.invitation.findMany({
      where,
      include: {
        invitedBy: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map((inv) => ({
      ...inv,
      role: inv.role as MemberRole,
      status: inv.status as InvitationStatus,
    }));
  }

  /**
   * Get pending invitation for user email
   */
  async getPendingInvitationForEmail(email: string): Promise<Invitation | null> {
    const invitation = await prisma.invitation.findFirst({
      where: {
        email: email.toLowerCase(),
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      include: {
        invitedBy: { select: { name: true, email: true } },
        organization: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!invitation) return null;

    return {
      ...invitation,
      role: invitation.role as MemberRole,
      status: invitation.status as InvitationStatus,
    };
  }

  /**
   * Cleanup expired invitations
   */
  async cleanupExpiredInvitations(): Promise<number> {
    const result = await prisma.invitation.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: new Date() },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    if (result.count > 0) {
      console.log(`[InvitationService] Marked ${result.count} invitations as expired`);
    }

    return result.count;
  }
}

// Export singleton instance
export const invitationService = new InvitationService();
