import { Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthAuditEventType } from '@buildmind/shared-types';
import { Prisma } from '@buildmind/database';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logEvent(
    userId: string | null,
    eventType: AuthAuditEventType,
    req?: Request,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const ipAddress = req
      ? ((req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || req.socket.remoteAddress || null)
      : null;
    const userAgent = req ? (req.headers['user-agent'] as string) || null : null;

    try {
      // Sanitize metadata to never store passwords or secrets
      const safeMetadata: Record<string, unknown> = { ...metadata };
      delete safeMetadata['password'];
      delete safeMetadata['token'];
      delete safeMetadata['refreshToken'];
      delete safeMetadata['accessToken'];

      await this.prisma.authAuditEvent.create({
        data: {
          userId,
          eventType,
          ipAddress,
          userAgent,
          metadata: safeMetadata as Prisma.InputJsonValue,
        },
      });

      this.logger.log(
        `[AuthAudit] Event: ${eventType} | User: ${userId || 'anonymous'} | IP: ${ipAddress || 'unknown'}`,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to record auth audit event ${eventType}: ${message}`);
    }
  }
}
