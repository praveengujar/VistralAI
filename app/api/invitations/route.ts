// Invitations API
// GET: List all invitations for organization
// POST: Create a new invitation

import { NextRequest } from 'next/server';
import { withOrgAdmin, Permission } from '@/lib/middleware/rbac';
import { invitationService, MemberRole } from '@/lib/services/InvitationService';
import { successResponse, errorResponse, parseJsonBody } from '@/lib/api/middleware';

// GET /api/invitations - List all invitations
export const GET = withOrgAdmin(async (request: NextRequest, context) => {
  const { auth } = context;

  if (!auth.organizationId) {
    return errorResponse('Organization not found', 404);
  }

  try {
    const status = request.nextUrl.searchParams.get('status');
    const invitations = await invitationService.getOrganizationInvitations(
      auth.organizationId,
      status ? { status: status as any } : undefined
    );

    return successResponse({
      invitations,
      meta: {
        total: invitations.length,
      },
    });
  } catch (error) {
    console.error('[API] Failed to fetch invitations:', error);
    return errorResponse('Failed to fetch invitations', 500);
  }
});

// POST /api/invitations - Create a new invitation
export const POST = withOrgAdmin(async (request: NextRequest, context) => {
  const { auth } = context;

  if (!auth.organizationId) {
    return errorResponse('Organization not found', 404);
  }

  const body = await parseJsonBody<{ email: string; role?: MemberRole }>(request);

  if (!body?.email) {
    return errorResponse('Email is required', 400);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    return errorResponse('Invalid email format', 400);
  }

  const role: MemberRole = body.role && ['ADMIN', 'MEMBER'].includes(body.role)
    ? body.role
    : 'MEMBER';

  try {
    const result = await invitationService.createInvitation({
      organizationId: auth.organizationId,
      email: body.email,
      role,
      invitedById: auth.userId,
    });

    if (!result.success) {
      return errorResponse(result.error || 'Failed to create invitation', 400);
    }

    return successResponse({
      invitation: result.invitation,
    }, 201, 'Invitation sent successfully');
  } catch (error) {
    console.error('[API] Failed to create invitation:', error);
    return errorResponse('Failed to create invitation', 500);
  }
});
