import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from '../../modules/auth/services/token.service';
import {
  generateSignedCsrfToken,
  verifySignedCsrfToken,
  compareCsrfTokens,
} from '../security/csrf.util';

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
      // Ensure cryptographically signed CSRF cookie is seeded on safe GET requests if not present or invalid
      const existingCookie = req.cookies?.[CSRF_COOKIE_NAME];
      if (!existingCookie || !verifySignedCsrfToken(existingCookie)) {
        const freshToken = generateSignedCsrfToken();
        res.cookie(CSRF_COOKIE_NAME, freshToken, {
          httpOnly: false, // Must be readable by client JS for double-submit header
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        });
      }
      return true;
    }

    // 2. Validate Origin / Referer on all mutating requests (exact origin matching)
    const origin = req.headers.origin;
    if (origin) {
      const isOriginAllowed = this.allowedOrigins.includes(origin);
      if (!isOriginAllowed) {
        this.logger.warn(`CSRF Origin check failed: Untrusted origin ${origin}`);
        throw new ForbiddenException(`Cross-site request blocked: Untrusted origin "${origin}"`);
      }
    } else if (req.headers.referer) {
      try {
        const refererOrigin = new URL(req.headers.referer).origin;
        const isRefererAllowed = this.allowedOrigins.includes(refererOrigin);
        if (!isRefererAllowed) {
          this.logger.warn(`CSRF Referer check failed: Untrusted referer origin ${refererOrigin}`);
          throw new ForbiddenException(`Cross-site request blocked: Untrusted referer "${refererOrigin}"`);
        }
      } catch {
        throw new ForbiddenException('Cross-site request blocked: Malformed referer header');
      }
    }

    // 3. Cryptographically Signed Double-Submit Cookie CSRF Defense
    // Enforced when client authenticates via cookies OR explicitly provides CSRF tokens
    const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
    const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;
    const hasAuthCookie = Boolean(
      req.cookies?.[ACCESS_COOKIE_NAME] || req.cookies?.[REFRESH_COOKIE_NAME],
    );

    if (hasAuthCookie || headerToken || cookieToken) {
      if (!cookieToken || !headerToken) {
        this.logger.warn('CSRF verification failed: Missing token in cookie or header');
        throw new ForbiddenException('CSRF verification failed: Token missing from cookie or header');
      }

      // Verify that the cookie token has a valid server signature (defeats cookie injection/subdomain attacks)
      if (!verifySignedCsrfToken(cookieToken)) {
        this.logger.warn('CSRF verification failed: Untrusted or forged token signature');
        throw new ForbiddenException('CSRF verification failed: Forged or untrusted token signature');
      }

      // Timing-safe comparison of header and cookie tokens
      if (!compareCsrfTokens(cookieToken, headerToken)) {
        this.logger.warn('CSRF token mismatch between cookie and request header');
        throw new ForbiddenException('CSRF verification failed: Token mismatch between cookie and header');
      }
    }

    return true;
  }
}
