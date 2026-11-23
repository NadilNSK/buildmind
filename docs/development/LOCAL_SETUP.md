# BuildMind AI v5.0 — Local Development Setup Guide

## 1. Prerequisites
Ensure the following runtimes and tools are installed:
- **Node.js**: `v20.0.0` or higher (verified with Node `v25.2.1`)
- **pnpm**: `v9.0.0` or higher (verified with pnpm `v12.21.0`)
- **Python**: `v3.11` or higher (verified with Python `3.14.0`)
- **Docker & Docker Compose**: Recommended for local PostgreSQL, Redis, and MinIO storage

---

## 2. Quickstart Installation

### 2.1 Clone and Install Dependencies
```bash
# Clone the repository
git clone <repository_url> buildmind
cd buildmind

# Install workspace dependencies
pnpm install
```

### 2.2 Configure Environment Variables
```bash
# Copy the environment template
cp .env.example .env
```
Ensure database connection parameters match your local or Dockerized PostgreSQL instance.

---

## 3. Infrastructure Setup (Docker Compose)

Start the local service stack:
```bash
docker compose -f infrastructure/docker-compose.yml up -d
```

This launches:
- **PostgreSQL 16**: `localhost:5432` (`buildmind_db`)
- **Redis 7**: `localhost:6379`
- **MinIO S3**: `localhost:9000` (Console at `localhost:9001`)

> [!NOTE]
> If Docker is unavailable on your system, configure a standalone PostgreSQL 16 server and update the `DATABASE_URL` in your `.env` file.

---

## 4. Database Setup & Prisma Generation
```bash
# Generate the Prisma typed client
pnpm --filter @buildmind/database run generate

# Run database migrations (when database is connected)
pnpm --filter @buildmind/database run migrate
```

---

## 5. Running Applications in Development

### 5.1 Start NestJS Backend API
```bash
pnpm dev:api
# API runs at: http://localhost:4000
# Health check: http://localhost:4000/api/v1/health
```

### 5.2 Start Next.js Web Frontend
```bash
pnpm dev:web
# Web UI runs at: http://localhost:3000
```

### 5.3 Start FastAPI AI Worker Service
```bash
cd services/ai-worker
# Create and activate a virtualenv (recommended)
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Run FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
# Health check: http://localhost:8000/health
# Swagger Docs: http://localhost:8000/docs
```

---

## 6. Monorepo Quality & Verification Commands

```bash
# Type check all packages and applications
pnpm type-check

# Run unit tests
pnpm test

# Production build of all packages and applications
pnpm build
```
