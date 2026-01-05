// Organization Management Service
// Handles organization CRUD, membership management, and RBAC

import prisma from '@/lib/db/prisma';
import { createAuditLog } from './audit';
import crypto from 'crypto';

export type MemberRole = 'ADMIN' | 'MEMBER';
export type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface OrganizationMember {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  role: MemberRole;
  status: MemberStatus;
  joinedAt: Date;
  avatarUrl?: string | null;
}

export interface CreateOrganizationResult {
  success: boolean;
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
  membership?: {
    id: string;
    role: MemberRole;
  };
  error?: string;
}

export interface MemberUpdateResult {
  success: boolean;
  member?: OrganizationMember;
  error?: string;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50) + '-' + crypto.randomBytes(4).toString('hex');
}

export class OrganizationService {
  /**
   * Create a new organization and make the user an admin
   */
  async createOrganization(
    userId: string,
    name: string,
    options?: { logo?: string }
  ): Promise<CreateOrganizationResult> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { memberships: true },
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Check if user already belongs to an organization
      if (user.memberships.length > 0) {
        return { success: false, error: 'User already belongs to an organization' };
      }

      const slug = generateSlug(name);

      // Create organization and membership in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const organization = await tx.organization.create({
          data: {
            name,
            slug,
            logo: options?.logo,
          },
        });

        const membership = await tx.membership.create({
          data: {
            userId,
            organizationId: organization.id,
            role: 'ADMIN',
            status: 'ACTIVE',
          },
        });

        return { organization, membership };
      });

      // Log the action
      await createAuditLog({
        action: 'org.created',
        category: 'ORGANIZATION',
        status: 'SUCCESS',
        userId,
        organizationId: result.organization.id,
        description: `Organization "${name}" created`,
        metadata: { organizationName: name, slug },
      });

      return {
        success: true,
        organization: {
          id: result.organization.id,
          name: result.organization.name,
          slug: result.organization.slug,
        },
        membership: {
          id: result.membership.id,
          role: result.membership.role as MemberRole,
        },
      };
    } catch (error) {
      console.error('[OrganizationService] Failed to create organization:', error);
      return { success: false, error: 'Failed to create organization' };
    }
  }

  /**
   * Get organization by ID
   */
  async getOrganization(organizationId: string) {
    return prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        invitations: {
          where: { status: 'PENDING' },
        },
      },
    });
  }

  /**
   * Get user's organization
   */
  async getUserOrganization(userId: string) {
    const membership = await prisma.membership.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        organization: true,
      },
    });

    return membership?.organization ?? null;
  }

  /**
   * Get all members of an organization
   */
  async getOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
    const memberships = await prisma.membership.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // ADMIN first
        { createdAt: 'asc' },
      ],
    });

    return memberships.map((m) => ({
      id: m.id,
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role as MemberRole,
      status: m.status as MemberStatus,
      joinedAt: m.createdAt,
      avatarUrl: m.user.avatarUrl,
    }));
  }

  /**
   * Get a specific member
   */
  async getMember(membershipId: string) {
    return prisma.membership.findUnique({
      where: { id: membershipId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        organization: true,
      },
    });
  }

  /**
   * Update a member's role
   */
  async updateMemberRole(
    organizationId: string,
    membershipId: string,
    newRole: MemberRole,
    updatedByUserId: string
  ): Promise<MemberUpdateResult> {
    try {
      // Get the membership
      const membership = await prisma.membership.findFirst({
        where: {
          id: membershipId,
          organizationId,
        },
        include: {
          user: true,
        },
      });

      if (!membership) {
        return { success: false, error: 'Member not found' };
      }

      // Count admins if changing from ADMIN
      if (membership.role === 'ADMIN' && newRole !== 'ADMIN') {
        const adminCount = await prisma.membership.count({
          where: {
            organizationId,
            role: 'ADMIN',
            status: 'ACTIVE',
          },
        });

        if (adminCount <= 1) {
          return { success: false, error: 'Cannot remove the last admin' };
        }
      }

      // Update the role
      const updated = await prisma.membership.update({
        where: { id: membershipId },
        data: { role: newRole },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      });

      // Log the action
      await createAuditLog({
        action: 'org.member_role_changed',
        category: 'ORGANIZATION',
        status: 'SUCCESS',
        userId: updatedByUserId,
        organizationId,
        targetType: 'user',
        targetId: membership.userId,
        description: `Changed ${membership.user.email} role from ${membership.role} to ${newRole}`,
        metadata: {
          memberEmail: membership.user.email,
          oldRole: membership.role,
          newRole,
        },
      });

      return {
        success: true,
        member: {
          id: updated.id,
          userId: updated.user.id,
          name: updated.user.name,
          email: updated.user.email,
          role: updated.role as MemberRole,
          status: updated.status as MemberStatus,
          joinedAt: updated.createdAt,
          avatarUrl: updated.user.avatarUrl,
        },
      };
    } catch (error) {
      console.error('[OrganizationService] Failed to update member role:', error);
      return { success: false, error: 'Failed to update member role' };
    }
  }

  /**
   * Remove a member from the organization
   */
  async removeMember(
    organizationId: string,
    membershipId: string,
    removedByUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the membership
      const membership = await prisma.membership.findFirst({
        where: {
          id: membershipId,
          organizationId,
        },
        include: {
          user: true,
        },
      });

      if (!membership) {
        return { success: false, error: 'Member not found' };
      }

      // Prevent removing yourself
      if (membership.userId === removedByUserId) {
        return { success: false, error: 'Cannot remove yourself from the organization' };
      }

      // Count admins if removing an admin
      if (membership.role === 'ADMIN') {
        const adminCount = await prisma.membership.count({
          where: {
            organizationId,
            role: 'ADMIN',
            status: 'ACTIVE',
          },
        });

        if (adminCount <= 1) {
          return { success: false, error: 'Cannot remove the last admin' };
        }
      }

      // Delete the membership
      await prisma.membership.delete({
        where: { id: membershipId },
      });

      // Log the action
      await createAuditLog({
        action: 'org.member_removed',
        category: 'ORGANIZATION',
        status: 'SUCCESS',
        userId: removedByUserId,
        organizationId,
        targetType: 'user',
        targetId: membership.userId,
        description: `Removed ${membership.user.email} from organization`,
        metadata: {
          removedUserEmail: membership.user.email,
          removedUserRole: membership.role,
        },
      });

      return { success: true };
    } catch (error) {
      console.error('[OrganizationService] Failed to remove member:', error);
      return { success: false, error: 'Failed to remove member' };
    }
  }

  /**
   * Check if user is an admin of the organization
   */
  async isOrganizationAdmin(userId: string, organizationId: string): Promise<boolean> {
    const membership = await prisma.membership.findFirst({
      where: {
        userId,
        organizationId,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    return !!membership;
  }

  /**
   * Check if user is a member of the organization
   */
  async isOrganizationMember(userId: string, organizationId: string): Promise<boolean> {
    const membership = await prisma.membership.findFirst({
      where: {
        userId,
        organizationId,
        status: 'ACTIVE',
      },
    });

    return !!membership;
  }

  /**
   * Get user's role in the organization
   */
  async getUserRole(userId: string, organizationId: string): Promise<MemberRole | null> {
    const membership = await prisma.membership.findFirst({
      where: {
        userId,
        organizationId,
        status: 'ACTIVE',
      },
    });

    return membership?.role as MemberRole | null;
  }

  /**
   * Transfer admin ownership to another member
   */
  async transferOwnership(
    organizationId: string,
    currentAdminId: string,
    newAdminId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify current user is admin
      const isAdmin = await this.isOrganizationAdmin(currentAdminId, organizationId);
      if (!isAdmin) {
        return { success: false, error: 'Only admins can transfer ownership' };
      }

      // Get both memberships
      const [currentAdmin, newAdmin] = await Promise.all([
        prisma.membership.findFirst({
          where: { userId: currentAdminId, organizationId },
          include: { user: true },
        }),
        prisma.membership.findFirst({
          where: { userId: newAdminId, organizationId },
          include: { user: true },
        }),
      ]);

      if (!currentAdmin || !newAdmin) {
        return { success: false, error: 'Members not found' };
      }

      // Update both roles in a transaction
      await prisma.$transaction([
        prisma.membership.update({
          where: { id: currentAdmin.id },
          data: { role: 'MEMBER' },
        }),
        prisma.membership.update({
          where: { id: newAdmin.id },
          data: { role: 'ADMIN' },
        }),
      ]);

      // Log the action
      await createAuditLog({
        action: 'org.ownership_transferred',
        category: 'ORGANIZATION',
        status: 'SUCCESS',
        userId: currentAdminId,
        organizationId,
        targetType: 'user',
        targetId: newAdminId,
        description: `Transferred admin ownership to ${newAdmin.user.email}`,
        metadata: {
          previousAdmin: currentAdmin.user.email,
          newAdmin: newAdmin.user.email,
        },
      });

      return { success: true };
    } catch (error) {
      console.error('[OrganizationService] Failed to transfer ownership:', error);
      return { success: false, error: 'Failed to transfer ownership' };
    }
  }
}

// Export singleton instance
export const organizationService = new OrganizationService();
