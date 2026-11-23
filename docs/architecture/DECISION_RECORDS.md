# BuildMind AI v5.0 — Architecture Decision Records (ADRs)

## ADR-001: Pnpm Monorepo with Workspaces
- **Status**: Approved & Implemented (Phase 1)
- **Context**: BuildMind AI requires shared types, validation schemas, and database contracts between the Next.js frontend and NestJS backend.
- **Decision**: Adopt pnpm workspaces with a root workspace configuration (`pnpm-workspace.yaml`). Packages are namespaced under `@buildmind/`.
- **Consequences**: Atomic dependency management, instant cross-package type synchronization, zero duplication of domain contracts.

## ADR-002: Domain Modules in NestJS instead of Microservice Sprawl
- **Status**: Approved & Implemented (Phase 1)
- **Context**: The project specifies 12 QS modules and 7 shared systems. Building 19 independent microservices would introduce excessive operational complexity, network latency, and distributed transaction issues.
- **Decision**: Consolidate backend domain capabilities into structured domain modules inside `apps/api` using NestJS dependency injection. Microservice decomposition is deferred until scaling demands dictate.
- **Consequences**: Fast local development, unified transactions via Prisma, single deployment target, simplified observability.

## ADR-003: Strict Separation of AI Inference and Deterministic QS Calculations
- **Status**: Approved & Implemented (Phase 1)
- **Context**: Construction financial management requires legal and contractual precision. Hallucinated numbers or non-deterministic rounding can result in legal disputes.
- **Decision**: AI models running in `services/ai-worker` provide advisory and detection output only. All quantitative takeoffs, BOQ arithmetic, and payment valuations must be deterministically calculated by the core engine.
- **Consequences**: Full defensibility of commercial figures, audit-proof measurement sheets, zero risk of hallucinated rates entering certified BOQs.

## ADR-004: Strict Scope Boundary (24 Capabilities vs 16 Excluded Features)
- **Status**: Approved & Implemented (Phase 1)
- **Context**: Commercial software in construction often suffers from scope creep into accounting, HR, site safety, or architecture.
- **Decision**: Formally enshrine the 24 approved capabilities and explicitly prohibit the 16 excluded features in `docs/requirements/FEATURE_SCOPE.md`.
- **Consequences**: Focused engineering bandwidth, high reliability, and deep specialization in commercial surveying.

## ADR-005: Multi-Tenant Architecture with Regional Standard Binding
- **Status**: Approved & Implemented (Phase 1)
- **Context**: Quantity surveying practices and standards differ significantly between Sri Lanka (SLS 573, CIDA SBD) and international jurisdictions (CESMM4, NRM2, FIDIC).
- **Decision**: Bind each project to an explicit measurement standard (`SLS_573`, `CESMM4`, `NRM2`, etc.) and currency (`LKR`, `USD`, `GBP`). The measurement standard engine (ES-01) alters deduction and measurement rules dynamically based on the project's standard binding.
- **Consequences**: Seamless local compliance in Sri Lanka while maintaining a clean abstraction for international projects.

## ADR-006: S3-Compatible Object Storage for Drawing & Document Control
- **Status**: Approved & Implemented (Phase 1)
- **Context**: High-resolution CAD drawings, PDF revisions, and BIM IFC models require persistent, revision-controlled storage.
- **Decision**: Standardize on S3 API compatibility using MinIO for local development and AWS S3 / Cloud Storage in production.
- **Consequences**: High throughput, direct pre-signed URL uploads, zero cloud lock-in.
