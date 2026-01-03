// Validate Invitation Token API
// GET: Validate invitation token (public)

import { NextRequest, NextResponse } from 'next/server';
import { invitationService } from '@/lib/services/InvitationService';
import { successResponse, errorResponse } from '@/lib/api/middleware';

// GET /api/invitations/validate?token=xxx - Validate invitation token
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return errorResponse('Token is required', 400);
  }

  try {
    const result = await invitationService.validateToken(token);

    if (!result.valid) {
      return errorResponse(result.error || 'Invalid invitation', 400);
    }

    // Return invitation details (without sensitive data)
    const invitation = result.invitation!;
    return successResponse({
      valid: true,
      invitation: {
        email: invitation.email,
        role: invitation.role,
        organizationName: invitation.organization?.name,
        inviterName: invitation.invitedBy?.name || invitation.invitedBy?.email,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error('[API] Failed to validate invitation:', error);
    return errorResponse('Failed to validate invitation', 500);
  }
}
