import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';
import { PasswordService } from './password.service';
import { AuditService } from './audit.service';
import { AuthAuditEventType, AuthTokens, JwtPayload, UserRole } from '@buildmind/shared-types';

export const REFRESH_COOKIE_NAME = 'buildmind_refresh_token';
export const ACCESS_COOKIE_NAME = 'buildmind_access_token';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly accessExpiresInSeconds = parseInt(process.env.JWT_ACCESS_EXPIRES_IN || '900', 10); // 15 mins default
  private readonly refreshExpiresInDays = parseInt(process.env.JWT_REFRESH_EXPIRES_IN_DAYS || '7', 10); // 7 days default
  private readonly isProduction = process.env.NODE_ENV === 'production';
  // Mutex map to handle concurrent in-flight refresh requests safely
  private readonly inFlightRefreshes = new Map<string, Promise<{ tokens: AuthTokens; userId: string }>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Generates a short-lived access token and a hashed rotating refresh token session
   */
  async createSession(
    user: { id: string; email: string; role: string },
    req?: Request,
    familyId?: string,
  ): Promise<{ tokens: AuthTokens; sessionId: string }> {
    const rawRefreshToken = this.passwordService.generateRandomToken(32);
    const refreshTokenHash = this.passwordService.hashToken(rawRefreshToken);
    const sessionFamilyId = familyId || crypto.randomUUID();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshExpiresInDays);

    const ipAddress = req
      ? ((req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || req.socket.remoteAddress || null)
      : null;
    const userAgent = req ? (req.headers['user-agent'] as string) || null : null;

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        familyId: sessionFamilyId,
        userAgent,
        ipAddress,
        expiresAt,
        isRevoked: false,
      },
    });

    const jwtPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
      sessionId: session.id,
      type: 'access',
    };

    const accessToken = await this.jwtService.signAsync(jwtPayload, {
      expiresIn: this.accessExpiresInSeconds,
    });

    const tokens: AuthTokens = {
      accessToken,
      refreshToken: rawRefreshToken,
      tokenType: 'Bearer',
      expiresIn: this.accessExpiresInSeconds,
    };

    return { tokens, sessionId: session.id };
  }

  /**
   * Rotates a refresh token:
   * 1. Detects reuse: If an already revoked or previously used token is presented,
   *    revokes ALL sessions in that family or for that user, and logs an alert.
   * 2. Checks token expiration.
   * 3. Revokes current session and creates a new session in the same token family.
   * 4. Issues a new access token and rotating refresh token.
   */
  async rotateSession(
    rawRefreshToken: string,
    req?: Request,
  ): Promise<{ tokens: AuthTokens; userId: string }> {
    if (!rawRefreshToken || rawRefreshToken.length < 16) {
      throw new UnauthorizedException('Valid refresh token required');
    }

    const tokenHash = this.passwordService.hashToken(rawRefreshToken);

    // Concurrent in-flight deduplication: If a refresh for this exact token is already in flight,
    // await that existing promise instead of racing or triggering a false reuse alert.
    const existingInFlight = this.inFlightRefreshes.get(tokenHash);
    if (existingInFlight) {
      this.logger.log(`[TokenService] Deduplicated concurrent in-flight refresh request`);
      return existingInFlight;
    }

    const refreshOperation = (async () => {
      const session = await this.prisma.session.findUnique({
        where: { refreshTokenHash: tokenHash },
        include: { user: true },
      });

      if (!session) {
        this.logger.warn('Refresh attempt with unrecognized token hash');
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Reuse detection: If token was already revoked, someone is replaying an old/stolen token
      if (session.isRevoked) {
        this.logger.error(
          `[SECURITY ALERT] Refresh token reuse detected for user ${session.userId} (Family: ${session.familyId})`,
        );

        // Invalidate all sessions for this user immediately upon token reuse detection
        await this.prisma.session.updateMany({
          where: { userId: session.userId, isRevoked: false },
          data: { isRevoked: true },
        });

        await this.auditService.logEvent(
          session.userId,
          AuthAuditEventType.REFRESH_REUSE_DETECTED,
          req,
          { familyId: session.familyId },
        );

        throw new UnauthorizedException(
          'Security violation: Refresh token reuse detected. All active sessions have been invalidated.',
        );
      }

      // Check expiration
      if (new Date() > session.expiresAt) {
        await this.prisma.session.update({
          where: { id: session.id },
          data: { isRevoked: true },
        });
        throw new UnauthorizedException('Refresh token has expired');
      }

      // Check user active status
      if (!session.user.isActive || session.user.accountStatus === 'SUSPENDED') {
        await this.prisma.session.update({
          where: { id: session.id },
          data: { isRevoked: true },
        });
        throw new UnauthorizedException('Account is inactive or suspended');
      }

      // Atomic rotation: Mark current session as revoked
      await this.prisma.session.update({
        where: { id: session.id },
        data: { isRevoked: true },
      });

      // Create next session in the same family
      const { tokens } = await this.createSession(
        {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,
        },
        req,
        session.familyId,
      );

      await this.auditService.logEvent(
        session.user.id,
        AuthAuditEventType.REFRESH_SUCCESS,
        req,
        { previousSessionId: session.id },
      );

      return { tokens, userId: session.user.id };
    })();

    this.inFlightRefreshes.set(tokenHash, refreshOperation);
    try {
      return await refreshOperation;
    } finally {
      this.inFlightRefreshes.delete(tokenHash);
    }
  }

  /**
   * Revokes a specific session
   */
  async revokeSession(sessionId: string, userId?: string): Promise<boolean> {
    const whereClause: { id: string; userId?: string } = { id: sessionId };
    if (userId) {
      whereClause.userId = userId;
    }

    const updated = await this.prisma.session.updateMany({
      where: whereClause,
      data: { isRevoked: true },
    });

    return updated.count > 0;
  }

  /**
   * Revokes all active sessions for a user (logout all devices)
   */
  async revokeAllUserSessions(userId: string): Promise<number> {
    const updated = await this.prisma.session.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
    return updated.count;
  }

  /**
   * Sets secure HttpOnly cookies on the response for browser clients
   */
  setAuthCookies(res: Response, tokens: AuthTokens): void {
    if (tokens.refreshToken) {
      res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
        httpOnly: true,
        secure: this.isProduction,
        sameSite: 'lax',
        path: '/api/v1/auth',
        maxAge: this.refreshExpiresInDays * 24 * 60 * 60 * 1000,
      });
    }

    res.cookie(ACCESS_COOKIE_NAME, tokens.accessToken, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: this.accessExpiresInSeconds * 1000,
    });
  }

  /**
   * Clears authentication cookies
   */
  clearAuthCookies(res: Response): void {
    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'lax',
      path: '/api/v1/auth',
    });
    res.clearCookie(ACCESS_COOKIE_NAME, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'lax',
      path: '/',
    });
  }

  /**
   * Extracts refresh token from cookies or body
   */
  extractRefreshToken(req: Request, bodyToken?: string): string | undefined {
    return req.cookies?.[REFRESH_COOKIE_NAME] || bodyToken;
  }

  /**
   * Extracts access token from Authorization header or cookie
   */
  extractAccessToken(req: Request): string | undefined {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }
    return req.cookies?.[ACCESS_COOKIE_NAME];
  }
}
