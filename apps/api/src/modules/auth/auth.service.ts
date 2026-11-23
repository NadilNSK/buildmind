import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { AuditService } from './services/audit.service';
import { EmailService } from '../email/email.service';
import {
  RegisterDto,
  LoginDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  ResendVerificationDto,
} from './dto/auth.dto';
import {
  AccountStatus,
  AuthAuditEventType,
  AuthResponse,
  AuthTokens,
  UserRole,
  UserSummary,
} from '@buildmind/shared-types';

@Injectable()
export class AuthService {

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Registers a new user account with Argon2id password hash,
   * generates an email verification token, sends a verification email,
   * and creates an initial authenticated session.
   */
  async register(
    dto: RegisterDto,
    req?: Request,
  ): Promise<AuthResponse> {
    const email = dto.email.toLowerCase().trim();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email address already exists');
    }

    const passwordHash = await this.passwordService.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email,
        fullName: dto.fullName.trim(),
        passwordHash,
        role: dto.role || UserRole.QS_ENGINEER,
        isActive: true,
        isEmailVerified: false,
        accountStatus: AccountStatus.ACTIVE,
      },
    });

    // Generate email verification token (24h validity)
    const rawVerificationToken = this.passwordService.generateRandomToken(32);
    const tokenHash = this.passwordService.hashToken(rawVerificationToken);
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: verificationExpiresAt,
      },
    });

    // Dispatch verification email
    await this.emailService.sendVerificationEmail(user.email, rawVerificationToken, {
      fullName: user.fullName,
    });

    // Create initial session
    const { tokens } = await this.tokenService.createSession(
      { id: user.id, email: user.email, role: user.role },
      req,
    );

    await this.auditService.logEvent(user.id, AuthAuditEventType.REGISTER_SUCCESS, req, {
      email: user.email,
    });

    return {
      user: this.mapUserSummary(user),
      tokens,
      message: 'Account registered successfully. Please verify your email address.',
    };
  }

  /**
   * Authenticates user credentials and returns tokens + user profile
   */
  async login(
    dto: LoginDto,
    req?: Request,
  ): Promise<AuthResponse> {
    const email = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      await this.auditService.logEvent(null, AuthAuditEventType.LOGIN_FAILED, req, {
        attemptedEmail: email,
        reason: 'User not found',
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      await this.auditService.logEvent(user.id, AuthAuditEventType.LOGIN_FAILED, req, {
        reason: 'Account deactivated',
      });
      throw new UnauthorizedException('Account is inactive. Please contact support.');
    }

    if (user.accountStatus === AccountStatus.SUSPENDED) {
      await this.auditService.logEvent(user.id, AuthAuditEventType.LOGIN_FAILED, req, {
        reason: 'Account suspended',
      });
      throw new UnauthorizedException('Account has been suspended. Please contact support.');
    }

    const isPasswordValid = await this.passwordService.verifyPassword(
      user.passwordHash,
      dto.password,
    );

    if (!isPasswordValid) {
      await this.auditService.logEvent(user.id, AuthAuditEventType.LOGIN_FAILED, req, {
        reason: 'Incorrect password',
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    const { tokens } = await this.tokenService.createSession(
      { id: user.id, email: user.email, role: user.role },
      req,
    );

    await this.auditService.logEvent(user.id, AuthAuditEventType.LOGIN_SUCCESS, req);

    return {
      user: this.mapUserSummary(user),
      tokens,
    };
  }

  /**
   * Logs out the current session
   */
  async logout(sessionId: string, userId: string, req?: Request): Promise<{ success: boolean; message: string }> {
    await this.tokenService.revokeSession(sessionId, userId);
    await this.auditService.logEvent(userId, AuthAuditEventType.LOGOUT, req, { sessionId });
    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * Logs out of all active sessions across all devices
   */
  async logoutAll(userId: string, req?: Request): Promise<{ success: boolean; revokedCount: number; message: string }> {
    const revokedCount = await this.tokenService.revokeAllUserSessions(userId);
    await this.auditService.logEvent(userId, AuthAuditEventType.LOGOUT_ALL, req, { revokedCount });
    return {
      success: true,
      revokedCount,
      message: 'All sessions successfully revoked across all devices',
    };
  }

  /**
   * Rotates a refresh token session and issues fresh credentials
   */
  async refresh(
    rawRefreshToken: string,
    req?: Request,
  ): Promise<{ user: UserSummary; tokens: AuthTokens }> {
    const { tokens, userId } = await this.tokenService.rotateSession(rawRefreshToken, req);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      user: this.mapUserSummary(user),
      tokens,
    };
  }

  /**
   * Returns current user identity and active session metadata
   */
  async getMe(userId: string): Promise<UserSummary & { activeSessionsCount: number }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            sessions: {
              where: { isRevoked: false, expiresAt: { gt: new Date() } },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      ...this.mapUserSummary(user),
      activeSessionsCount: user._count.sessions,
    };
  }

  /**
   * Changes authenticated user password, verifies current credentials,
   * updates Argon2id hash, and revokes other sessions
   */
  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    req?: Request,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentValid = await this.passwordService.verifyPassword(
      user.passwordHash,
      dto.currentPassword,
    );

    if (!isCurrentValid) {
      throw new UnauthorizedException('Current password does not match');
    }

    const newPasswordHash = await this.passwordService.hashPassword(dto.newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Invalidate all active sessions across all devices for security
    await this.tokenService.revokeAllUserSessions(userId);

    await this.auditService.logEvent(userId, AuthAuditEventType.PASSWORD_CHANGE, req);

    await this.emailService.sendSecurityNotification(
      user.email,
      'Your BuildMind AI password was changed',
      'Your account password was recently changed. If this was not you, please contact support immediately.',
    );

    return {
      success: true,
      message: 'Password changed successfully. Please log in with your new credentials.',
    };
  }

  /**
   * Requests a password reset. Returns generic message to prevent account enumeration.
   */
  async forgotPassword(
    dto: ForgotPasswordDto,
    req?: Request,
  ): Promise<{ success: boolean; message: string }> {
    const email = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && user.isActive) {
      // Invalidate existing active reset tokens
      await this.prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      // Generate 1-hour reset token
      const rawToken = this.passwordService.generateRandomToken(32);
      const tokenHash = this.passwordService.hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      await this.emailService.sendPasswordResetEmail(user.email, rawToken, {
        fullName: user.fullName,
      });

      await this.auditService.logEvent(user.id, AuthAuditEventType.PASSWORD_RESET_REQUESTED, req);
    }

    // Generic response to prevent email enumeration
    return {
      success: true,
      message: 'If an account exists with this email address, a password reset link has been dispatched.',
    };
  }

  /**
   * Resets password using valid unexpired reset token
   */
  async resetPassword(
    dto: ResetPasswordDto,
    req?: Request,
  ): Promise<{ success: boolean; message: string }> {
    const tokenHash = this.passwordService.hashToken(dto.token);

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetToken || resetToken.usedAt !== null || new Date() > resetToken.expiresAt) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const newPasswordHash = await this.passwordService.hashPassword(dto.newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash: newPasswordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.session.updateMany({
        where: { userId: resetToken.userId, isRevoked: false },
        data: { isRevoked: true },
      }),
    ]);

    await this.auditService.logEvent(
      resetToken.userId,
      AuthAuditEventType.PASSWORD_RESET_COMPLETED,
      req,
    );

    return {
      success: true,
      message: 'Password reset successful. Please log in with your new password.',
    };
  }

  /**
   * Verifies email using verification token
   */
  async verifyEmail(
    dto: VerifyEmailDto,
    req?: Request,
  ): Promise<{ success: boolean; message: string }> {
    const tokenHash = this.passwordService.hashToken(dto.token);

    const verificationToken = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });

    if (
      !verificationToken ||
      verificationToken.usedAt !== null ||
      new Date() > verificationToken.expiresAt
    ) {
      throw new BadRequestException('Invalid or expired email verification token');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: verificationToken.userId },
        data: { isEmailVerified: true },
      }),
      this.prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    await this.auditService.logEvent(
      verificationToken.userId,
      AuthAuditEventType.EMAIL_VERIFIED,
      req,
    );

    return {
      success: true,
      message: 'Email address has been successfully verified.',
    };
  }

  /**
   * Resends email verification link
   */
  async resendVerification(
    dto: ResendVerificationDto,
    req?: Request,
  ): Promise<{ success: boolean; message: string }> {
    const email = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && !user.isEmailVerified && user.isActive) {
      // Invalidate existing unused tokens
      await this.prisma.emailVerificationToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      const rawToken = this.passwordService.generateRandomToken(32);
      const tokenHash = this.passwordService.hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await this.prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      await this.emailService.sendVerificationEmail(user.email, rawToken, {
        fullName: user.fullName,
      });

      await this.auditService.logEvent(
        user.id,
        AuthAuditEventType.EMAIL_VERIFICATION_REQUESTED,
        req,
      );
    }

    // Generic response to prevent account enumeration
    return {
      success: true,
      message: 'If an unverified account exists with this email, a new verification link has been dispatched.',
    };
  }

  private mapUserSummary(user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    isActive: boolean;
    isEmailVerified: boolean;
    accountStatus: string;
    createdAt: Date;
    updatedAt: Date;
  }): UserSummary {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as UserRole,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      accountStatus: user.accountStatus as AccountStatus,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
