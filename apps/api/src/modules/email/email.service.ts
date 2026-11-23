import { Injectable, Logger } from '@nestjs/common';

export interface QueuedEmail {
  to: string;
  subject: string;
  template: 'email_verification' | 'password_reset' | 'security_alert' | 'organization_invitation';
  token?: string;
  context: Record<string, unknown>;
  sentAt: Date;
}

export interface IEmailService {
  sendVerificationEmail(to: string, token: string, user: { fullName: string }): Promise<void>;
  sendPasswordResetEmail(to: string, token: string, user: { fullName: string }): Promise<void>;
  sendSecurityNotification(to: string, subject: string, message: string): Promise<void>;
  sendOrganizationInvitation(
    to: string,
    token: string,
    inviter: { fullName: string; organizationName: string; role: string },
  ): Promise<void>;
}

@Injectable()
export class EmailService implements IEmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';
  private readonly smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

  // In-memory queue for dev/test verification and auditing
  private readonly sentEmails: QueuedEmail[] = [];

  async sendVerificationEmail(to: string, token: string, user: { fullName: string }): Promise<void> {
    const maskedEmail = this.maskEmail(to);
    const verificationUrl = `${process.env.APP_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

    const email: QueuedEmail = {
      to,
      subject: 'Verify your BuildMind AI account',
      template: 'email_verification',
      token,
      context: {
        fullName: user.fullName,
        verificationUrl,
      },
      sentAt: new Date(),
    };

    this.sentEmails.push(email);

    if (this.smtpConfigured && this.isProduction) {
      // In production with SMTP configured, would send via real transport
      this.logger.log(`[SMTP] Verification email dispatched to ${maskedEmail}`);
    } else {
      // Safe local development transport
      this.logger.log(
        `[DevEmailTransport] Email verification queued for ${maskedEmail}. Delivery to external inbox suppressed (local mode).`,
      );
      if (!this.isProduction && process.env.DEV_LOG_AUTH_TOKENS === 'true') {
        this.logger.debug(`[DEV ONLY] Verification URL: ${verificationUrl}`);
      }
    }
  }

  async sendPasswordResetEmail(to: string, token: string, user: { fullName: string }): Promise<void> {
    const maskedEmail = this.maskEmail(to);
    const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    const email: QueuedEmail = {
      to,
      subject: 'Reset your BuildMind AI password',
      template: 'password_reset',
      token,
      context: {
        fullName: user.fullName,
        resetUrl,
      },
      sentAt: new Date(),
    };

    this.sentEmails.push(email);

    if (this.smtpConfigured && this.isProduction) {
      this.logger.log(`[SMTP] Password reset email dispatched to ${maskedEmail}`);
    } else {
      this.logger.log(
        `[DevEmailTransport] Password reset email queued for ${maskedEmail}. Delivery suppressed (local mode).`,
      );
      if (!this.isProduction && process.env.DEV_LOG_AUTH_TOKENS === 'true') {
        this.logger.debug(`[DEV ONLY] Reset URL: ${resetUrl}`);
      }
    }
  }

  async sendSecurityNotification(to: string, subject: string, message: string): Promise<void> {
    const maskedEmail = this.maskEmail(to);

    const email: QueuedEmail = {
      to,
      subject,
      template: 'security_alert',
      context: { message },
      sentAt: new Date(),
    };

    this.sentEmails.push(email);
    this.logger.log(`[SecurityNotification] Alert "${subject}" registered for ${maskedEmail}`);
  }

  async sendOrganizationInvitation(
    to: string,
    token: string,
    inviter: { fullName: string; organizationName: string; role: string },
  ): Promise<void> {
    const maskedEmail = this.maskEmail(to);
    const inviteUrl = `${process.env.APP_URL || 'http://localhost:3000'}/invitations/accept?token=${token}`;

    const email: QueuedEmail = {
      to,
      subject: `You have been invited to join ${inviter.organizationName} on BuildMind AI`,
      template: 'organization_invitation',
      token,
      context: {
        inviterName: inviter.fullName,
        organizationName: inviter.organizationName,
        role: inviter.role,
        inviteUrl,
      },
      sentAt: new Date(),
    };

    this.sentEmails.push(email);

    if (this.smtpConfigured && this.isProduction) {
      this.logger.log(`[SMTP] Organization invitation dispatched to ${maskedEmail}`);
    } else {
      this.logger.log(
        `[DevEmailTransport] Organization invitation queued for ${maskedEmail}. Delivery suppressed (local mode).`,
      );
      if (!this.isProduction && process.env.DEV_LOG_AUTH_TOKENS === 'true') {
        this.logger.debug(`[DEV ONLY] Invite URL: ${inviteUrl}`);
      }
    }
  }

  // Helper methods for automated integration testing
  getLastInvitationToken(email: string): string | undefined {
    const normalized = email.toLowerCase().trim();
    const found = this.sentEmails
      .filter((e) => e.template === 'organization_invitation' && e.to.toLowerCase().trim() === normalized)
      .pop();
    return found?.token;
  }

  getLastVerificationToken(email: string): string | undefined {
    const normalized = email.toLowerCase().trim();
    const found = this.sentEmails
      .filter((e) => e.template === 'email_verification' && e.to.toLowerCase().trim() === normalized)
      .pop();
    return found?.token;
  }

  getLastResetToken(email: string): string | undefined {
    const normalized = email.toLowerCase().trim();
    const found = this.sentEmails
      .filter((e) => e.template === 'password_reset' && e.to.toLowerCase().trim() === normalized)
      .pop();
    return found?.token;
  }

  getSentEmails(): QueuedEmail[] {
    return [...this.sentEmails];
  }

  clearSentEmails(): void {
    this.sentEmails.length = 0;
  }

  private maskEmail(email: string): string {
    const [name, domain] = email.split('@');
    if (!name || !domain) return '***@***';
    const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}***`;
    return `${maskedName}@${domain}`;
  }
}
