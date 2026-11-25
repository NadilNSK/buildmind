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

```bash
# Start NestJS API (port 4001)
pnpm dev:api

# Start Next.js Frontend (port 3000)
pnpm dev:web

# Start FastAPI AI Worker (port 8000)
cd services/ai-worker && uvicorn app.main:app --port 8000 --reload
```

---

## Current Development Status & Deliverables

### Phase 1: Foundation Infrastructure
- Working Monorepo with pnpm workspaces and `@buildmind/*` packages.
- Enterprise Design System: Navy (`#0B1220`) / Teal (`#14B8A6`) accessible theme.
- Docker Infrastructure for PostgreSQL 16, Redis 7, and MinIO S3 object storage.

### Phase 2: Enterprise Authentication & Multi-Tenant RBAC
- **Phase 2A & 2B:** Argon2id password hashing, rotating JWT refresh tokens, HttpOnly cookies, CSRF protection, and responsive frontend auth flows.
- **Phase 2C:** Multi-tenant organization switching, invitation tokens (SHA-256), and 9-role RBAC permission matrix.
- **Phase 2D:** Security hardening, integration audits, rate limiting, and 16-scenario Playwright suite.

### Phase 3A: Construction Project Workspace & Data Foundation
- **Extended Construction Project Model:** 19 fields including project types, stakeholders, milestone dates, standards (SLS 573 / CESMM4 / NRM2), contract conditions (CIDA / FIDIC), and exact decimal valuation (`Decimal(15, 2)`).
- **Spatial Breakdown Structure (SBS):** Self-referencing recursive physical hierarchy (`SpatialNode`: Site -> Building -> Block -> Level -> Zone -> Room) with cycle detection and cross-project validation.
- **Work Breakdown Structure (WBS):** Self-referencing recursive trade hierarchy (`WorkPackage`) with code uniqueness per project and cycle prevention.
- **Project Workspace UI:** Next.js 15 App Router interface featuring Project Header, persistent sub-nav tabs, Overview Dashboard (4 KPI cards, live audit feed, planned roadmap), Spatial Breakdown UI, Work Breakdown UI, Settings UI, and Team Access UI.
- **Automated Verification:** 28 backend integration tests (`project-workspace.e2e-spec.ts`) and 13 Playwright browser acceptance scenarios (`playwright-phase3a.test.cjs`) passing 100% (145 total automated checks across the monorepo).

