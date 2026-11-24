# BuildMind AI v5.0

> Enterprise-Grade SaaS Web Application for AI-Assisted Quantity Surveying & Construction Commercial Management

Initially calibrated for **Sri Lanka** (SLS 573:1999, CIDA/ICTAD SBDs, CESMM4) with architectural readiness for **international expansion** (NRM2, SMM7, FIDIC, POMI).

---

## Monorepo Architecture

```
buildmind/
├── apps/
│   ├── web/               # Next.js 15, App Router, React 19, Tailwind CSS, Navy/Teal theme
│   └── api/               # NestJS 10, TypeScript, /api/v1 prefix, domain modules
├── services/
│   └── ai-worker/         # FastAPI, Python 3.14, computer vision & NLP service boundaries
├── packages/
│   ├── config/            # Shared configs (tsconfig, eslint)
│   ├── database/          # Prisma ORM, PostgreSQL schema, migrations, typed client
│   ├── shared-types/      # Canonical domain types, enums, DTO contracts, API envelopes
│   ├── ui/                # Navy/teal enterprise design tokens & brand constants
│   └── validation/        # Zod validation schemas for all domain entities & inputs
├── infrastructure/
│   ├── docker/            # Production Dockerfiles (api, ai-worker, web)
│   └── docker-compose.yml # PostgreSQL 16, Redis 7, MinIO S3 service stack
└── docs/
    ├── requirements/      # Scope specification (24 approved capabilities, 16 excluded features)
    ├── architecture/      # System architecture, ADRs, data models, provenance policy
    ├── development/       # Local setup & developer guides
    └── api/               # API boundaries & protocol specifications
```

---

## Approved Enterprise Scope (24 Capabilities)

BuildMind AI strictly maintains bounded engineering to deliver high reliability and deterministic accuracy:
- **12 Quantity Surveying Modules**: Takeoff (QS-01), Cost Estimation (QS-02), BOQ Generation (QS-03), Budget Planning (QS-04), Tender Management (QS-05), Contract Administration (QS-06), Procurement (QS-07), Cost Control (QS-08), Interim Valuations (QS-09), Variations (QS-10), Risk & Value Engineering (QS-11), Final Accounts (QS-12).
- **7 Shared Systems**: Measurement Standards (ES-01), Specifications (ES-02), Contract Rules (ES-03), Drawing Revision Management (ES-04), Document Control (ES-05), Commercial Reporting (ES-06), QA & Audit (ES-07).
- **1 Selective Scope Engine**: Smart Selective QS (SSQ-01).
- **4 Approved Advanced Features**: AI Auto-Detection (AF-01), 3D BIM Viewer (AF-02), AI Drawing Conflicts (AF-03), QS Copilot (AF-04).

*(16 non-commercial/ERP features are strictly excluded — see [docs/requirements/FEATURE_SCOPE.md](docs/requirements/FEATURE_SCOPE.md)).*

---

## Quickstart

### Prerequisites
- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Python >= 3.11
- Docker & Docker Compose (optional, for local DB stack)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Build & Verify
```bash
# Type check all packages & apps
pnpm type-check

# Run unit tests
pnpm test

# Build production artifacts
pnpm build
```

### 4. Start Development Services

#### Automated Windows Startup (Recommended)
```powershell
# Validates toolchain, WinNAT ports, Docker infrastructure, and launches service URL dashboard
.\dev-start.ps1

# To verify environment and infrastructure only:
.\dev-start.ps1 -VerifyOnly

# To launch all services concurrently:
.\dev-start.ps1 -StartAll
```

#### Manual Service Launch
```bash
# Start NestJS API (port 4001 - Note: port 4000 is reserved by Windows WinNAT)
pnpm dev:api

# Start Next.js Frontend (port 3000)
pnpm dev:web

# Start FastAPI AI Worker (port 8000)
cd services/ai-worker && uvicorn app.main:app --port 8000 --reload
```

### 5. Acceptance & Integration Testing
```powershell
# 16-Scenario Playwright End-to-End Acceptance Suite
node apps/web/test/playwright-e2e.test.cjs

# Backend Jest E2E Suite (41 tests)
pnpm --filter @buildmind/api run test:e2e

# Frontend Auth & RBAC Suites (34 tests)
node apps/web/test/frontend-auth.test.cjs
node apps/web/test/frontend-org-rbac.test.cjs

# AI Worker Smoke Suite (4 tests)
python services/ai-worker/tests/smoke_test.py
```

---

## Phase 1 Deliverables Summary
- **Working Monorepo**: pnpm workspaces with `@buildmind/*` packages.
- **Enterprise Design System**: Navy (`#0B1220`) / Teal (`#14B8A6`) accessible theme.
- **Responsive Shell & Routes**: 17 dedicated route views labeled with architectural boundaries and "Coming Soon" notices (no fake data).
- **NestJS API**: Versioned `/api/v1` routes, structured error filter, public `/api/v1/health` endpoint.
- **FastAPI AI Worker**: Public `/health` endpoint and strictly bounded placeholder endpoints for computer vision.
- **PostgreSQL / Prisma**: Minimal schema for `Organization`, `User`, `Membership`, and `Project` with UUIDs, indexes, and multi-tenant scoping.
- **Docker Infrastructure**: `docker-compose.yml` for PostgreSQL 16, Redis 7, and MinIO S3 object storage.
