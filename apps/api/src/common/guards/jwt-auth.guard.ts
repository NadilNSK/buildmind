import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { ACCESS_COOKIE_NAME } from '../../modules/auth/services/token.service';
import { JwtPayload, UserRole, AccountStatus } from '@buildmind/shared-types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      // Verify session revocation status if sessionId is present
      if (payload.sessionId) {
        const session = await this.prisma.session.findUnique({
          where: { id: payload.sessionId },
        });

        if (!session || session.isRevoked || new Date() > session.expiresAt) {
          throw new UnauthorizedException('Session has been revoked or expired. Please re-authenticate.');
        }
      }

      // Check current user status
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User account is inactive or no longer exists');
      }

      if (user.accountStatus === AccountStatus.SUSPENDED) {
        throw new UnauthorizedException('User account has been suspended');
      }

      // Attach authenticated user identity to request object
      (request as unknown as Record<string, unknown>)['user'] = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role as UserRole,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        accountStatus: user.accountStatus as AccountStatus,
        sessionId: payload.sessionId,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };

      return true;
    } catch (err: unknown) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      this.logger.debug(`JWT verification failed: ${err instanceof Error ? err.message : String(err)}`);
      throw new UnauthorizedException('Invalid or expired authentication credentials');
    }
  }

  private extractToken(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }
    return request.cookies?.[ACCESS_COOKIE_NAME];
  }
}
