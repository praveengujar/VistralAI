// Accept Invitation API
// POST: Accept invitation (requires auth)

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { invitationService } from '@/lib/services/InvitationService';
import { successResponse, errorResponse, parseJsonBody, ErrorResponses } from '@/lib/api/middleware';

// POST /api/invitations/accept - Accept invitation
export async function POST(request: NextRequest) {
  // Get session
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return ErrorResponses.unauthorized();
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return ErrorResponses.unauthorized();
  }

  const body = await parseJsonBody<{ token: string }>(request);

  if (!body?.token) {
    return errorResponse('Token is required', 400);
  }

  try {
    const result = await invitationService.acceptInvitation(body.token, userId);

    if (!result.success) {
      return errorResponse(result.error || 'Failed to accept invitation', 400);
    }

    return successResponse({
      membership: result.membership,
      organization: result.organization,
    }, 200, 'Invitation accepted successfully');
  } catch (error) {
    console.error('[API] Failed to accept invitation:', error);
    return errorResponse('Failed to accept invitation', 500);
  }
}
