// Individual Invitation API
// DELETE: Revoke invitation

import { NextRequest } from 'next/server';
import { withOrgAdmin } from '@/lib/middleware/rbac';
import { invitationService } from '@/lib/services/InvitationService';
import { successResponse, errorResponse } from '@/lib/api/middleware';

// DELETE /api/invitations/[id] - Revoke invitation
export const DELETE = withOrgAdmin(async (
  request: NextRequest,
  context
) => {
  const { auth } = context;
  const params = await context.params;
  const invitationId = params?.id;

  if (!invitationId) {
    return errorResponse('Invitation ID is required', 400);
  }

  if (!auth.organizationId) {
    return errorResponse('Organization not found', 404);
  }

  try {
    const result = await invitationService.revokeInvitation(
      invitationId,
      auth.userId
    );

    if (!result.success) {
      return errorResponse(result.error || 'Failed to revoke invitation', 400);
    }

    return successResponse(null, 200, 'Invitation revoked successfully');
  } catch (error) {
    console.error('[API] Failed to revoke invitation:', error);
    return errorResponse('Failed to revoke invitation', 500);
  }
});
