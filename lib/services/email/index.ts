// Email Service Interface
// Provides abstraction over email providers

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface SendInvitationParams {
  to: string;
  inviterName: string;
  organizationName: string;
  inviteUrl: string;
  role: string;
  expiresAt?: Date;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailService {
  sendEmail(params: SendEmailParams): Promise<EmailResult>;
  sendInvitation(params: SendInvitationParams): Promise<EmailResult>;
}

// Re-export the Resend implementation as default
export { ResendEmailService, emailService } from './resend';
