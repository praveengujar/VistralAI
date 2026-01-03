// Resend Email Service Implementation
// Uses Resend for transactional emails

import { Resend } from 'resend';
import { EmailService, SendEmailParams, SendInvitationParams, EmailResult } from './index';
import { getInvitationEmailTemplate } from './templates/invitation';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'VistralAI <noreply@vistralai.com>';

export class ResendEmailService implements EmailService {
  private client: Resend | null = null;

  constructor() {
    if (RESEND_API_KEY) {
      this.client = new Resend(RESEND_API_KEY);
    }
  }

  private isConfigured(): boolean {
    return !!this.client;
  }

  async sendEmail(params: SendEmailParams): Promise<EmailResult> {
    const { to, subject, html, text, from, replyTo } = params;

    if (!this.isConfigured()) {
      console.warn('[EmailService] Resend not configured, skipping email');
      console.log('[EmailService] Would send email:', { to, subject });
      return {
        success: true,
        messageId: 'mock-' + Date.now(),
      };
    }

    try {
      const { data, error } = await this.client!.emails.send({
        from: from || EMAIL_FROM,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
        replyTo,
      });

      if (error) {
        console.error('[EmailService] Failed to send email:', error);
        return {
          success: false,
          error: error.message || 'Failed to send email',
        };
      }

      console.log('[EmailService] Email sent successfully:', data?.id);
      return {
        success: true,
        messageId: data?.id,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[EmailService] Error sending email:', message);
      return {
        success: false,
        error: message,
      };
    }
  }

  async sendInvitation(params: SendInvitationParams): Promise<EmailResult> {
    const { to, inviterName, organizationName, inviteUrl, role, expiresAt } = params;

    const { html, text, subject } = getInvitationEmailTemplate({
      inviterName,
      organizationName,
      inviteUrl,
      role,
      expiresAt,
    });

    return this.sendEmail({
      to,
      subject,
      html,
      text,
    });
  }
}

// Singleton instance
export const emailService = new ResendEmailService();
