// Organization Members API
// GET: List all members
// POST: Create organization (for first user)

import { NextRequest } from 'next/server';
import { withRBAC, withOrganization, Permission, RBACContext } from '@/lib/middleware/rbac';
import { organizationService } from '@/lib/services/OrganizationService';
import { successResponse, errorResponse, parseJsonBody } from '@/lib/api/middleware';

// GET /api/organization/members - List all members
export const GET = withOrganization(async (request: NextRequest, context) => {
  const { auth } = context;

  if (!auth.organizationId) {
    return errorResponse('Organization not found', 404);
  }

  try {
    const members = await organizationService.getOrganizationMembers(auth.organizationId);

    return successResponse({
      members,
      meta: {
        total: members.length,
        currentUserRole: auth.organizationRole,
      },
    });
  } catch (error) {
    console.error('[API] Failed to fetch members:', error);
    return errorResponse('Failed to fetch members', 500);
  }
});

// POST /api/organization/members - Create organization (for first-time setup)
// This is only called during onboarding when user doesn't have an organization yet
export const POST = withRBAC(async (request: NextRequest, context) => {
  const { auth } = context;

  // If user already has an organization, reject
  if (auth.organizationId) {
    return errorResponse('User already belongs to an organization', 400);
  }

  const body = await parseJsonBody<{ name: string; logo?: string }>(request);

  if (!body?.name) {
    return errorResponse('Organization name is required', 400);
  }

  try {
    const result = await organizationService.createOrganization(
      auth.userId,
      body.name,
      { logo: body.logo }
    );

    if (!result.success) {
      return errorResponse(result.error || 'Failed to create organization', 400);
    }

    return successResponse({
      organization: result.organization,
      membership: result.membership,
    }, 201, 'Organization created successfully');
  } catch (error) {
    console.error('[API] Failed to create organization:', error);
    return errorResponse('Failed to create organization', 500);
  }
});
