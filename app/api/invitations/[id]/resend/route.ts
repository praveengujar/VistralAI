// Resend Invitation API
// POST: Resend invitation with new token

import { NextRequest } from 'next/server';
import { withOrgAdmin } from '@/lib/middleware/rbac';
import { invitationService } from '@/lib/services/InvitationService';
import { successResponse, errorResponse } from '@/lib/api/middleware';

// POST /api/invitations/[id]/resend - Resend invitation
export const POST = withOrgAdmin(async (
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
    const result = await invitationService.resendInvitation(
      invitationId,
      auth.userId
    );

    if (!result.success) {
      return errorResponse(result.error || 'Failed to resend invitation', 400);
    }

    return successResponse({
      invitation: result.invitation,
    }, 200, 'Invitation resent successfully');
  } catch (error) {
    console.error('[API] Failed to resend invitation:', error);
    return errorResponse('Failed to resend invitation', 500);
  }
});
