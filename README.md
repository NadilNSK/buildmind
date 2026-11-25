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

### Phase 3B: Secure Construction Document Uploads & Storage Foundation
- **Object Storage Infrastructure:** MinIO S3-compatible private buckets (`buildmind-documents`, `buildmind-drawings`) with zero public access.
- **Zero-Trust Quarantine Lifecycle:** Upload session initiation, streaming multipart upload to quarantine storage key, magic byte & header verification, client/server SHA-256 cryptographic verification, transactional promotion to permanent storage, and automatic quarantine cleanup.
- **True Format Verification:** Binary inspection for PDF, DWG, DXF, IFC, PNG, JPG, TIFF, DOCX, XLSX, CSV, and TXT with strict size limit enforcement (max 500 MB).
- **Physical & Trade Hierarchy Linking:** `DocumentSpatialLink` (SBS) and `DocumentWorkPackageLink` (WBS) with strict cross-project IDOR rejection.
- **Document Control Workspace UI:** Next.js 15 interface (`/projects/[projectId]/documents`) featuring live storage utilization KPI cards, multi-facet filtering (search, category, discipline, format, archived), `DocumentUploadModal` with drag-and-drop progress tracking, and `DocumentDetailsDrawer` with cryptographic hash verification, metadata editing, and hierarchy link management.
- **Automated Verification:** 20 backend integration tests (`document-workspace.e2e-spec.ts`) and 18 Playwright browser acceptance scenarios (`playwright-phase3b.test.cjs`) passing 100% with zero regressions.

### Phase 3C: Document Control, Drawing Revision Management, Review Workflow & Transmittals
- **Document Version Architecture (`DocumentVersion`):** Immutable version tree, flexible revision numbering (numeric `01`, `02` or alphanumeric `A`, `P01`), parent version lineage (`parentVersionId`), cryptographic SHA-256 integrity hashes, and per-document revision code uniqueness.
- **Dedicated Drawing Register (`DrawingMetadata`):** Automatic drawing registration upon upload with drawing numbers, title blocks, disciplines (`ARCHITECTURAL`, `STRUCTURAL`, `MEP`), drawing types, sheet sizes (`A0`–`A4`), declared scales, and dedicated register UI (`/projects/[projectId]/drawings`).
- **Engineering Review Workflow (`DocumentReview`):** 7-state revision lifecycle (`DRAFT` → `SUBMITTED` → `UNDER_REVIEW` → `APPROVED` / `CHANGES_REQUESTED` / `REJECTED` → `PUBLISHED` → `SUPERSEDED` / `WITHDRAWN`) with review queue register (`/projects/[projectId]/reviews`).
- **Segregation of Duties Enforcement:** Strict architectural barrier preventing revision uploaders from approving or evaluating their own submissions (`uploaderId !== reviewerUserId`), returning HTTP 403 Forbidden.
- **Atomic Publication Invariant:** Transactional publication of approved revisions where the prior published revision is atomically transitioned to `SUPERSEDED`, guaranteeing a single source of truth for active tender and construction sets.
- **Cryptographic Revision Diff Engine:** Side-by-side revision comparison modal (`RevisionCompareModal`) computing SHA-256 digest equality, byte size deltas, metadata differences, and spatial (SBS) / work package (WBS) association changes.
- **Formal Document Transmittals (`DocumentTransmittal` & `TransmittalItem`):** Dedicated transmittal package register (`/projects/[projectId]/transmittals`), multi-recipient assignment, and immutable line item snapshot freezing upon issuance.
- **Automated Verification:** 23 backend integration scenarios (`revision-workflow.e2e-spec.ts`, 112 total backend suite tests passing) and 21 Playwright browser acceptance scenarios (`playwright-phase3c.test.cjs`, 33/33 assertions passing 100%) with zero regressions.


