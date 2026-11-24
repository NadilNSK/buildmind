import * as crypto from 'crypto';

const CSRF_SECRET =
  process.env.CSRF_SECRET ||
  process.env.JWT_SECRET ||
  'buildmind_csrf_signing_secret_key_minimum_32_characters!';

/**
 * Generates a cryptographically signed CSRF token using HMAC-SHA256.
 * Format: `<randomHex>.<hmacSignature>`
 * Prevents cookie injection and cross-subdomain cookie substitution attacks.
 */
export function generateSignedCsrfToken(): string {
  const raw = crypto.randomBytes(24).toString('hex');
  const signature = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(raw)
    .digest('hex');
  return `${raw}.${signature}`;
}

/**
 * Verifies that a CSRF token has a valid server-generated HMAC signature.
 */
export function verifySignedCsrfToken(token: string | undefined | null): boolean {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [raw, signature] = parts;
  if (!raw || !signature || raw.length !== 48 || signature.length !== 64) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(raw)
    .digest('hex');

  try {
    const sigBuf = Buffer.from(signature, 'hex');
    const expectedBuf = Buffer.from(expectedSignature, 'hex');

    if (sigBuf.length !== expectedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuf, expectedBuf);
  } catch {
    return false;
  }
}

/**
 * Timing-safe comparison of double-submit cookie token against request header token.
 */
export function compareCsrfTokens(cookieToken: string, headerToken: string): boolean {
  if (!cookieToken || !headerToken) return false;
  if (cookieToken.length !== headerToken.length) return false;

  try {
    const bufA = Buffer.from(cookieToken);
    const bufB = Buffer.from(headerToken);
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}
