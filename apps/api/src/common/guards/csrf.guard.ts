import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from '../../modules/auth/services/token.service';

export const CSRF_COOKIE_NAME = 'buildmind_csrf_token';
export const CSRF_HEADER_NAME = 'x-csrf-token';

@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly logger = new Logger(CsrfGuard.name);
  private readonly allowedOrigins = [
    process.env.CORS_ORIGIN || 'http://localhost:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    // 1. Safe HTTP methods (GET, HEAD, OPTIONS) do not mutate state
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(req.method.toUpperCase())) {
      // Ensure CSRF cookie is seeded on safe GET requests if not present
      if (!req.cookies?.[CSRF_COOKIE_NAME]) {
        const freshToken = crypto.randomBytes(24).toString('hex');
        res.cookie(CSRF_COOKIE_NAME, freshToken, {
          httpOnly: false, // Must be readable by client JS for double-submit header
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        });
      }
      return true;
    }

    // 2. Validate Origin / Referer on all mutating requests
    const origin = req.headers.origin;
    if (origin) {
      const isOriginAllowed = this.allowedOrigins.some(
        (allowed) => origin === allowed || origin.startsWith(allowed),
      );
      if (!isOriginAllowed) {
        this.logger.warn(`CSRF Origin check failed: Untrusted origin ${origin}`);
        throw new ForbiddenException(`Cross-site request blocked: Untrusted origin "${origin}"`);
      }
    }

    // 3. Double-Submit Cookie CSRF Defense
    // Enforced when client provides CSRF tokens OR when authenticating via cookies
    const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
    const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;
    const hasAuthCookie = Boolean(
      req.cookies?.[ACCESS_COOKIE_NAME] || req.cookies?.[REFRESH_COOKIE_NAME],
    );

    // If client explicitly sent a CSRF token header or cookie, or has an auth cookie:
    if (headerToken || (hasAuthCookie && cookieToken)) {
      if (!headerToken || !cookieToken || headerToken !== cookieToken) {
        this.logger.warn('CSRF token mismatch between cookie and request header');
        throw new ForbiddenException('CSRF verification failed: Token mismatch or missing');
      }
    }

    return true;
  }
}
