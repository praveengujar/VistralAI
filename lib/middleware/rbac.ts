// Role-Based Access Control (RBAC) Middleware
// Provides permission-based access control for API routes

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { organizationService } from '@/lib/services/OrganizationService';
import { errorResponse, ErrorResponses } from '@/lib/api/middleware';

// ============================================
// Types & Enums
// ============================================

export type MemberRole = 'ADMIN' | 'MEMBER';

export enum Permission {
  // Admin only permissions
  MANAGE_TEAM = 'manage_team',
  MANAGE_BILLING = 'manage_billing',
  INVITE_MEMBERS = 'invite_members',
  REMOVE_MEMBERS = 'remove_members',

  // All member permissions
  VIEW_BRAND = 'view_brand',
  EDIT_BRAND = 'edit_brand',
  RUN_SCANS = 'run_scans',
  VIEW_INSIGHTS = 'view_insights',
  VIEW_TEAM = 'view_team',
}

// Role-Permission mapping
const ROLE_PERMISSIONS: Record<MemberRole, Permission[]> = {
  ADMIN: [
    Permission.MANAGE_TEAM,
    Permission.MANAGE_BILLING,
    Permission.INVITE_MEMBERS,
    Permission.REMOVE_MEMBERS,
    Permission.VIEW_BRAND,
    Permission.EDIT_BRAND,
    Permission.RUN_SCANS,
    Permission.VIEW_INSIGHTS,
    Permission.VIEW_TEAM,
  ],
  MEMBER: [
    Permission.VIEW_BRAND,
    Permission.EDIT_BRAND,
    Permission.RUN_SCANS,
    Permission.VIEW_INSIGHTS,
    Permission.VIEW_TEAM,
  ],
};

// ============================================
// Auth Context Types
// ============================================

export interface RBACContext {
  session: NonNullable<Awaited<ReturnType<typeof getServerSession>>>;
  userId: string;
  userEmail: string;
  organizationId: string | null;
  organizationRole: MemberRole | null;
  permissions: Permission[];
}

type RBACHandler = (
  request: NextRequest,
  context: { params?: Promise<Record<string, string>>; auth: RBACContext }
) => Promise<NextResponse>;

// ============================================
// Permission Helpers
// ============================================

export function getRolePermissions(role: MemberRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

export function hasPermission(role: MemberRole, permission: Permission): boolean {
  const permissions = getRolePermissions(role);
  return permissions.includes(permission);
}

export function hasAnyPermission(role: MemberRole, permissions: Permission[]): boolean {
  const rolePermissions = getRolePermissions(role);
  return permissions.some(p => rolePermissions.includes(p));
}

export function hasAllPermissions(role: MemberRole, permissions: Permission[]): boolean {
  const rolePermissions = getRolePermissions(role);
  return permissions.every(p => rolePermissions.includes(p));
}

// ============================================
// Middleware Wrappers
// ============================================

/**
 * Wrapper that provides RBAC context with organization info
 */
export function withRBAC(handler: RBACHandler): (
  request: NextRequest,
  context?: { params?: Promise<Record<string, string>> }
) => Promise<NextResponse> {
  return async (request: NextRequest, context?: { params?: Promise<Record<string, string>> }) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session?.user?.email) {
        return ErrorResponses.unauthorized();
      }

      const userId = (session.user as { id?: string }).id || '';
      const userEmail = session.user.email;

      // Get organization context from session
      const organizationId = (session.user as { organizationId?: string }).organizationId || null;
      const sessionRole = (session.user as { organizationRole?: string }).organizationRole;
      const organizationRole = sessionRole as MemberRole | null;

      // Get permissions based on role
      const permissions = organizationRole
        ? getRolePermissions(organizationRole)
        : [];

      const authContext: RBACContext = {
        session,
        userId,
        userEmail,
        organizationId,
        organizationRole,
        permissions,
      };

      return handler(request, { ...context, auth: authContext });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[RBAC Middleware Error]', { path: request.nextUrl.pathname, error: message });
      return errorResponse(message, 500);
    }
  };
}

/**
 * Wrapper that requires the user to belong to an organization
 */
export function withOrganization(handler: RBACHandler): (
  request: NextRequest,
  context?: { params?: Promise<Record<string, string>> }
) => Promise<NextResponse> {
  return withRBAC(async (request, context) => {
    if (!context.auth.organizationId) {
      return errorResponse('Organization membership required', 403);
    }
    return handler(request, context);
  });
}

/**
 * Wrapper that requires the user to be an organization admin
 */
export function withOrgAdmin(handler: RBACHandler): (
  request: NextRequest,
  context?: { params?: Promise<Record<string, string>> }
) => Promise<NextResponse> {
  return withOrganization(async (request, context) => {
    if (context.auth.organizationRole !== 'ADMIN') {
      return ErrorResponses.forbidden();
    }
    return handler(request, context);
  });
}

/**
 * Wrapper that requires a specific permission
 */
export function withPermission(permission: Permission) {
  return (handler: RBACHandler): (
    request: NextRequest,
    context?: { params?: Promise<Record<string, string>> }
  ) => Promise<NextResponse> => {
    return withOrganization(async (request, context) => {
      if (!context.auth.permissions.includes(permission)) {
        return ErrorResponses.forbidden();
      }
      return handler(request, context);
    });
  };
}

/**
 * Wrapper that requires any of the specified permissions
 */
export function withAnyPermission(permissions: Permission[]) {
  return (handler: RBACHandler): (
    request: NextRequest,
    context?: { params?: Promise<Record<string, string>> }
  ) => Promise<NextResponse> => {
    return withOrganization(async (request, context) => {
      const hasAny = permissions.some(p => context.auth.permissions.includes(p));
      if (!hasAny) {
        return ErrorResponses.forbidden();
      }
      return handler(request, context);
    });
  };
}

/**
 * Wrapper that requires all of the specified permissions
 */
export function withAllPermissions(permissions: Permission[]) {
  return (handler: RBACHandler): (
    request: NextRequest,
    context?: { params?: Promise<Record<string, string>> }
  ) => Promise<NextResponse> => {
    return withOrganization(async (request, context) => {
      const hasAll = permissions.every(p => context.auth.permissions.includes(p));
      if (!hasAll) {
        return ErrorResponses.forbidden();
      }
      return handler(request, context);
    });
  };
}

// ============================================
// Helper Functions for Routes
// ============================================

/**
 * Verify that a user has permission to perform an action
 * Use this inside handlers when you need conditional permission checks
 */
export async function checkPermission(
  userId: string,
  organizationId: string,
  permission: Permission
): Promise<boolean> {
  const role = await organizationService.getUserRole(userId, organizationId);
  if (!role) return false;
  return hasPermission(role, permission);
}

/**
 * Verify that a user is an admin of the organization
 */
export async function checkIsAdmin(
  userId: string,
  organizationId: string
): Promise<boolean> {
  return organizationService.isOrganizationAdmin(userId, organizationId);
}

/**
 * Verify that a user is a member of the organization
 */
export async function checkIsMember(
  userId: string,
  organizationId: string
): Promise<boolean> {
  return organizationService.isOrganizationMember(userId, organizationId);
}
