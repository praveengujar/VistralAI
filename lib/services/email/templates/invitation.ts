// Invitation Email Template
// Beautiful HTML email for team invitations

interface InvitationTemplateParams {
  inviterName: string;
  organizationName: string;
  inviteUrl: string;
  role: string;
  expiresAt?: Date;
}

export function getInvitationEmailTemplate(params: InvitationTemplateParams) {
  const { inviterName, organizationName, inviteUrl, role, expiresAt } = params;

  const formattedRole = role === 'ADMIN' ? 'Administrator' : 'Team Member';
  const expiresText = expiresAt
    ? `This invitation expires on ${expiresAt.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}.`
    : 'This invitation expires in 7 days.';

  const subject = `${inviterName} invited you to join ${organizationName} on VistralAI`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited to join ${organizationName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                VistralAI
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 24px; font-weight: 600;">
                You're invited to join ${organizationName}
              </h2>

              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> as a <strong>${formattedRole}</strong> on VistralAI.
              </p>

              <p style="margin: 0 0 30px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                VistralAI helps brands monitor and optimize how they appear in AI search results across platforms like ChatGPT, Perplexity, and Google AI.
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="margin: 0 auto 30px;">
                <tr>
                  <td style="border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <a href="${inviteUrl}" style="display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                ${expiresText}
              </p>

              <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>

              <p style="margin: 0; padding: 12px 16px; background-color: #f5f5f5; border-radius: 6px; word-break: break-all;">
                <a href="${inviteUrl}" style="color: #667eea; text-decoration: none; font-size: 14px;">
                  ${inviteUrl}
                </a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; text-align: center;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                &copy; ${new Date().getFullYear()} VistralAI. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
You're invited to join ${organizationName}

${inviterName} has invited you to join ${organizationName} as a ${formattedRole} on VistralAI.

VistralAI helps brands monitor and optimize how they appear in AI search results across platforms like ChatGPT, Perplexity, and Google AI.

Accept your invitation: ${inviteUrl}

${expiresText}

If you didn't expect this invitation, you can safely ignore this email.

© ${new Date().getFullYear()} VistralAI. All rights reserved.
  `.trim();

  return { html, text, subject };
}
