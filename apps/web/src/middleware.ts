import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/projects',
  '/takeoff',
  '/estimation',
  '/boq',
  '/budgets',
  '/tenders',
  '/contracts',
  '/procurement',
  '/cost-control',
  '/valuations',
  '/variations',
  '/risk-value',
  '/final-accounts',
  '/drawing-viewer',
  '/bim-viewer',
  '/qs-copilot',
  '/settings',
];

const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password'];

/**
 * Validates returnUrl to strictly prevent Open Redirect vulnerabilities
 */
export function sanitizeReturnUrl(returnUrl: string | null | undefined): string {
  if (!returnUrl) return '/dashboard';
  // Must be a relative path starting with single slash, not protocol-relative or absolute
  if (
    returnUrl.startsWith('/') &&
    !returnUrl.startsWith('//') &&
    !returnUrl.includes('://') &&
    !returnUrl.includes('\\')
  ) {
    return returnUrl;
  }
  return '/dashboard';
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  const accessToken = request.cookies.get('buildmind_access_token')?.value;
  const refreshToken = request.cookies.get('buildmind_refresh_token')?.value;
  const isAuthenticated = Boolean(accessToken || refreshToken);

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isAuthPage = AUTH_PAGES.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`),
  );

  // 1. Unauthenticated users trying to access protected workspace routes
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Already authenticated users trying to access login/register
  if (isAuthPage && isAuthenticated) {
    const returnUrlParam = searchParams.get('returnUrl');
    const destination = sanitizeReturnUrl(returnUrlParam);
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
