# BuildMind AI v5.0 — Local Development & Infrastructure Setup Guide

## 1. Verified Host Environment
- **Operating System**: Microsoft Windows 11 Pro (Build 26300, 64-bit)
- **Processor**: 12th Gen Intel(R) Core(TM) i7-12650H (10 Cores, 16 Logical Processors)
- **Memory**: 31.71 GB RAM
- **Storage**: Drive C (34.8 GB free), Drive D (347.2 GB free)
- **Hypervisor**: Active & Detected
- **WSL Status**: WSL 2 installed and configured as default (Ubuntu distribution, version 2)
- **Node.js**: `v25.2.1`
- **pnpm**: `v12.21.0` (located at `C:\Users\user\AppData\Roaming\npm\pnpm.cmd`)
- **Python**: `3.14.0` (with FastAPI 0.136.3, Uvicorn 0.49.0, Pydantic 2.13.4, HTTPX 0.28.1)
- **Git**: `2.47.1.windows.1`

---

## 2. Docker Desktop Installation (Windows Specifics)

### 2.1 Verified Installer Status
The official Docker Desktop installer has been downloaded and cryptographically verified:
- **Local Path**: `D:\installer_cache\Docker Desktop Installer.exe`
- **File Size**: 595.06 MB (623,969,712 bytes)
- **Digital Signature**: **Valid** (Digitally signed by `CN=Docker Inc, O=Docker Inc, L=Palo Alto, S=California, C=US`)
- **Certificate Authority**: DigiCert Trusted G4 Code Signing RSA4096 SHA384 2021 CA1
- **SHA-256 Hash**: `A5E299131C9C53D60F3F752B162078945EB5FAF6EEDCF0BE20A214C6E6CEA444`

### 2.2 Administrator Elevation Requirement
Docker Desktop requires Windows administrative privileges during initial setup to:
1. Register the Windows system service (`com.docker.service`).
2. Create and configure the local security group `docker-users`.
3. Configure the WSL 2 network integration adapters.

Because non-interactive background terminals cannot approve UAC dialogs, **the user must execute the verified installer with elevation once**:

```powershell
# Open an Elevated (Run as Administrator) PowerShell window and execute:
Start-Process -Wait -FilePath "D:\installer_cache\Docker Desktop Installer.exe" -ArgumentList "install", "--quiet", "--accept-license"
```
*Alternatively, navigate to `D:\installer_cache` in Windows File Explorer, right-click `Docker Desktop Installer.exe`, and select **Run as administrator**.*

Once installed, launch Docker Desktop from the Windows Start menu and ensure WSL 2 backend is selected in Docker settings.

---

## 3. Infrastructure Management Commands

Once Docker Desktop is running:

### 3.1 Start Services
```powershell
# Start PostgreSQL 16, Redis 7, and MinIO in the background
docker compose -f infrastructure/docker-compose.yml up -d
```

### 3.2 Check Service Status & Health
```powershell
# Check running containers and healthcheck statuses
docker compose -f infrastructure/docker-compose.yml ps

# View service logs
docker compose -f infrastructure/docker-compose.yml logs -f
```

### 3.3 Stop Services
```powershell
# Stop services while preserving all data volumes
docker compose -f infrastructure/docker-compose.yml stop

# Stop and remove containers (data in postgres_data, redis_data, and minio_data is preserved)
docker compose -f infrastructure/docker-compose.yml down
```

---

## 4. Database Setup & Prisma Migrations

When PostgreSQL is operational on `localhost:5432`:

```powershell
# 1. Validate Prisma schema
$env:PATH = "C:\Users\user\AppData\Roaming\npm;$env:PATH"
pnpm --filter @buildmind/database exec prisma validate

# 2. Generate Prisma typed client
pnpm --filter @buildmind/database run generate

# 3. Create and apply initial migration (safe execution, no reset)
pnpm --filter @buildmind/database exec prisma migrate dev --name init_phase1_models
```

---

## 5. Running Application Services

### 5.1 NestJS Backend API (Port 4000)
```powershell
$env:PATH = "C:\Users\user\AppData\Roaming\npm;$env:PATH"
pnpm --filter @buildmind/api run start:dev
# Public Health: http://localhost:4000/api/v1/health
# Capabilities Catalog: http://localhost:4000/api/v1/qs/capabilities
```

### 5.2 Next.js Web Frontend (Port 3000)
```powershell
$env:PATH = "C:\Users\user\AppData\Roaming\npm;$env:PATH"
pnpm --filter @buildmind/web run dev
# Landing Page: http://localhost:3000
# Commercial Workspace: http://localhost:3000/dashboard
```

### 5.3 FastAPI AI Worker Service (Port 8000)
```powershell
cd services/ai-worker
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
# Health: http://localhost:8000/health
# OpenAPI Docs: http://localhost:8000/docs
```

---

## 6. Monorepo Quality & Verification Commands

```powershell
$env:PATH = "C:\Users\user\AppData\Roaming\npm;$env:PATH"

# Typecheck all 7 packages and applications
pnpm type-check

# Run unit tests across all workspace projects
pnpm test

# Run NestJS e2e integration tests
pnpm --filter @buildmind/api run test:e2e

# Run FastAPI smoke tests
cd services/ai-worker && python tests/smoke_test.py

# Run Next.js production build
pnpm --filter @buildmind/web run build
```
