# BuildMind AI v5.0 — API Boundaries & Protocol Specification

## 1. Global API Standards (`apps/api`)

- **Base URL Prefix**: `/api/v1`
- **Response Format**: All API responses follow the standard envelope:
  ```json
  {
    "success": true,
    "data": { ... },
    "timestamp": "2026-11-23T07:15:00.000Z"
  }
  ```
- **Error Format**: All errors return structured JSON with correlation IDs:
  ```json
  {
    "success": false,
    "statusCode": 404,
    "error": "NotFoundException",
    "message": "Resource not found",
    "path": "/api/v1/projects/invalid-id",
    "timestamp": "2026-11-23T07:15:00.000Z",
    "correlationId": "req-1732346100000-abc123"
  }
  ```

---

## 2. Public Health Endpoints

### 2.1 NestJS Backend API Health
- **Route**: `GET /api/v1/health`
- **Access**: Public (unauthenticated)
- **Response**:
  ```json
  {
    "status": "ok",
    "service": "buildmind-api",
    "version": "5.0.0",
    "environment": "development",
    "uptimeSeconds": 142,
    "timestamp": "2026-11-23T07:15:00.000Z",
    "details": {
      "memory": { ... },
      "nodeVersion": "v25.2.1",
      "pid": 1234
    }
  }
  ```

### 2.2 FastAPI AI Worker Service Health
- **Route**: `GET /health`
- **Access**: Public (unauthenticated)
- **Response**:
  ```json
  {
    "status": "ok",
    "service": "buildmind-ai-worker",
    "version": "5.0.0",
    "environment": "development",
    "uptime_seconds": 120,
    "python_version": "3.14.0"
  }
  ```

---

## 3. Service Boundaries & Future Gates

### 3.1 Domain Endpoints (Phase 2 Gates)
- `GET /api/v1/organizations`: Multi-tenant organization listings (requires authenticated session).
- `GET /api/v1/projects`: Project records and standard bindings (requires tenant membership).
- `GET /api/v1/qs/capabilities`: Static directory of 24 approved capabilities and their implementation phase.

### 3.2 AI Worker Placeholder Boundaries
The AI Worker (`services/ai-worker`) exposes defined HTTP boundaries for computer vision and NLP tasks without fabricating synthetic results:
- `POST /api/v1/takeoff/detect`: Validates drawing request and returns `501 Not Implemented` with capability ID `AF-01`.
- `POST /api/v1/conflicts/analyze`: Validates drawings and returns `501 Not Implemented` with capability ID `AF-03`.
- `POST /api/v1/copilot/query`: Validates query context and returns `501 Not Implemented` with capability ID `AF-04`.


---

## 3. Authentication Backend Endpoints (`/api/v1/auth`)

All authentication endpoints reside under `/api/v1/auth`. Endpoints marked **Public** do not require an active Bearer token. All other endpoints are protected by `JwtAuthGuard` by default.

### 3.1 Endpoint Summary

| HTTP Method | Route | Access | Throttled | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | No | Registers a new account, hashes password (Argon2id), generates verification token, creates session. |
| `POST` | `/api/v1/auth/login` | Public | **Yes** (10/min) | Authenticates credentials, generates JWT access token and rotating refresh token, sets HttpOnly cookies. |
| `POST` | `/api/v1/auth/logout` | **Protected** | No | Revokes the active session in PostgreSQL and clears authentication cookies. |
| `POST` | `/api/v1/auth/logout-all` | **Protected** | No | Revokes all active sessions for the user across all devices and browsers. |
| `POST` | `/api/v1/auth/refresh` | Public | No | Rotates refresh token session; detects token reuse/theft and revokes session families upon violation. |
| `GET` | `/api/v1/auth/me` | **Protected** | No | Returns the authenticated user's profile and active sessions count. |
| `POST` | `/api/v1/auth/change-password`| **Protected** | No | Validates current password, updates to new Argon2id hash, revokes other sessions. |
| `POST` | `/api/v1/auth/forgot-password`| Public | **Yes** (5/min) | Dispatches a 1-hour reset token via email; returns generic response to prevent account enumeration. |
| `POST` | `/api/v1/auth/reset-password` | Public | No | Resets user password using SHA-256 hashed token lookup and invalidates previous sessions. |
| `POST` | `/api/v1/auth/verify-email` | Public | No | Confirms email address using SHA-256 hashed verification token. |
| `POST` | `/api/v1/auth/resend-verification` | Public | **Yes** (5/min) | Re-dispatches verification email; generic response prevents account enumeration. |

### 3.2 Token and Cookie Protocol
- **Access Token**: Short-lived JSON Web Token (15 minutes expiry) passed via `Authorization: Bearer <token>` header or `buildmind_access_token` cookie.
- **Refresh Token**: Cryptographically random 64-character hex token (7 days expiry) stored exclusively as a SHA-256 hash in PostgreSQL. Passed via secure HttpOnly cookie (`buildmind_refresh_token`) or request body.
- **Cookie Security Settings**:
  - `httpOnly: true` (prevents XSS token exfiltration)
  - `secure: true` in production (TLS/HTTPS enforcement)
  - `sameSite: 'lax'` (CSRF mitigation)
  - `path: '/api/v1/auth'` for refresh cookies; `'/'` for access cookies.
