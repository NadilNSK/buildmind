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
