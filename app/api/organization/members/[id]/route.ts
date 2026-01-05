// Individual Organization Member API
// PATCH: Update member role
// DELETE: Remove member

import { NextRequest } from 'next/server';
import { withOrgAdmin, Permission } from '@/lib/middleware/rbac';
import { organizationService, MemberRole } from '@/lib/services/OrganizationService';
import { successResponse, errorResponse, parseJsonBody } from '@/lib/api/middleware';

// PATCH /api/organization/members/[id] - Update member role
export const PATCH = withOrgAdmin(async (
  request: NextRequest,
  context
) => {
  const { auth } = context;
  const params = await context.params;
  const membershipId = params?.id;

  if (!membershipId) {
    return errorResponse('Member ID is required', 400);
  }

  if (!auth.organizationId) {
    return errorResponse('Organization not found', 404);
  }

  const body = await parseJsonBody<{ role: MemberRole }>(request);

  if (!body?.role || !['ADMIN', 'MEMBER'].includes(body.role)) {
    return errorResponse('Valid role is required (ADMIN or MEMBER)', 400);
  }

  try {
    const result = await organizationService.updateMemberRole(
      auth.organizationId,
      membershipId,
      body.role,
      auth.userId
    );

    if (!result.success) {
      return errorResponse(result.error || 'Failed to update member role', 400);
    }

    return successResponse({
      member: result.member,
    }, 200, 'Member role updated successfully');
  } catch (error) {
    console.error('[API] Failed to update member role:', error);
    return errorResponse('Failed to update member role', 500);
  }
});

// DELETE /api/organization/members/[id] - Remove member
export const DELETE = withOrgAdmin(async (
  request: NextRequest,
  context
) => {
  const { auth } = context;
  const params = await context.params;
  const membershipId = params?.id;

  if (!membershipId) {
    return errorResponse('Member ID is required', 400);
  }

  if (!auth.organizationId) {
    return errorResponse('Organization not found', 404);
  }

  try {
    const result = await organizationService.removeMember(
      auth.organizationId,
      membershipId,
      auth.userId
    );

    if (!result.success) {
      return errorResponse(result.error || 'Failed to remove member', 400);
    }

    return successResponse(null, 200, 'Member removed successfully');
  } catch (error) {
    console.error('[API] Failed to remove member:', error);
    return errorResponse('Failed to remove member', 500);
  }
});
