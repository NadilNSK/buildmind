/**
 * BuildMind AI v5.0 — Secure Browser API Client
 * Enterprise Full-Stack HTTP Client with HttpOnly Cookie & CSRF Double-Submit Support
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  statusCode: number;
  errorName: string;
  correlationId?: string;

  constructor(message: string, statusCode: number, errorName = 'ApiError', correlationId?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorName = errorName;
    this.correlationId = correlationId;
  }
}

// Mutex lock to prevent multiple concurrent token refresh requests
let refreshPromise: Promise<boolean> | null = null;

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match && match[3] ? decodeURIComponent(match[3]) : null;
}

export async function fetchCsrfToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    const existing = getCookie('buildmind_csrf_token');
    if (existing) return existing;

    const res = await fetch(`${API_BASE_URL}/auth/csrf`, {
      method: 'GET',
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      return data.csrfToken || getCookie('buildmind_csrf_token');
    }
  } catch (err) {
    console.warn('[ApiClient] Failed to prefetch CSRF token:', err);
  }
  return null;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Attach active organization context header if present in cookie or storage
  if (typeof document !== 'undefined' && !headers['x-organization-id']) {
    const activeOrgId =
      getCookie('buildmind_org_id') ||
      (typeof localStorage !== 'undefined' ? localStorage.getItem('buildmind_active_org_id') : null);
    if (activeOrgId) {
      headers['x-organization-id'] = activeOrgId;
    }
  }

  // Double-submit CSRF cookie support for state-changing browser requests
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && typeof document !== 'undefined') {
    let csrfToken = getCookie('buildmind_csrf_token');
    if (!csrfToken) {
      csrfToken = await fetchCsrfToken();
    }
    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Guarantees browser attaches HttpOnly session cookies
  });

  // Handle 401 Unauthorized for automatic silent refresh (skip if already refreshing/logging out)
  if (
    response.status === 401 &&
    !isRetry &&
    !endpoint.includes('/auth/login') &&
    !endpoint.includes('/auth/refresh') &&
    !endpoint.includes('/auth/logout') &&
    typeof window !== 'undefined'
  ) {
    if (!refreshPromise) {
      refreshPromise = (async () => {
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });
          return refreshRes.ok;
        } catch {
          return false;
        } finally {
          refreshPromise = null;
        }
      })();
    }

    const refreshSuccess = await refreshPromise;
    if (refreshSuccess) {
      // Retry original request with fresh credentials
      return apiClient<T>(endpoint, options, true);
    }
  }

  let data: any;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && (data.message || data.error)) ||
      `HTTP Error ${response.status}`;
    const formattedMsg = Array.isArray(message) ? message.join(', ') : String(message);
    const correlationId = data && typeof data === 'object' ? data.correlationId : undefined;
    throw new ApiError(formattedMsg, response.status, data?.error || 'HttpError', correlationId);
  }

  return data as T;
}
