import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  ProjectType,
  ProjectStatus,
  MeasurementStandard,
  UnitSystem,
  CurrencyCode,
  SpatialNodeType,
  OrganizationRole,
  DocumentCategory,
  DocumentDiscipline,
} from '@buildmind/shared-types';

describe('Phase 3B: Construction Document Management & MinIO Storage (E2E Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testSuffix = Math.random().toString(36).substring(2, 8);

  const ownerAEmail = `director-${testSuffix}@buildmind.test`;
  const qsAEmail = `qs-${testSuffix}@buildmind.test`;
  const viewerAEmail = `viewer-${testSuffix}@buildmind.test`;
  const ownerBEmail = `other-${testSuffix}@buildmind.test`;
  const password = 'BuildMind#Secure2026!';

  let ownerAToken: string;
  let qsAToken: string;
  let viewerAToken: string;
  let ownerBToken: string;

  let orgAId: string;
  let orgBId: string;

  let projectA1Id: string;
  let projectA2Id: string;
  let projectBId: string;

  let spatialNodeA1Id: string;
  let spatialNodeA2Id: string;
  let workPackageA1Id: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());

    await app.init();
    prisma = app.get<PrismaService>(PrismaService);

    // Register helper
    const registerUser = async (email: string, fullName: string) => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email, fullName, password });
      return {
        id: res.body.user.id,
        token: res.body.tokens.accessToken,
      };
    };

    const userOwnerA = await registerUser(ownerAEmail, 'Alice Commercial Director');
    ownerAToken = userOwnerA.token;

    const userQsA = await registerUser(qsAEmail, 'Bob QS Engineer');
    qsAToken = userQsA.token;

    const userViewerA = await registerUser(viewerAEmail, 'David Site Viewer');
    viewerAToken = userViewerA.token;

    const userOwnerB = await registerUser(ownerBEmail, 'Eve Competitor');
    ownerBToken = userOwnerB.token;

    // Create Org A (Alice)
    const orgARes = await request(app.getHttpServer())
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .send({
        name: `Apex Commercial Group ${testSuffix}`,
        slug: `apex-commercial-${testSuffix}`,
        country: 'LK',
        defaultCurrency: 'LKR',
      });
    orgAId = orgARes.body.data.id;

    // Add Bob as QS_ENGINEER in Org A
    await prisma.membership.create({
      data: {
        userId: userQsA.id,
        organizationId: orgAId,
        role: OrganizationRole.QS_ENGINEER,
      },
    });

    // Add David as VIEWER in Org A
    await prisma.membership.create({
      data: {
        userId: userViewerA.id,
        organizationId: orgAId,
        role: OrganizationRole.VIEWER,
      },
    });

    // Create Org B (Eve)
    const orgBRes = await request(app.getHttpServer())
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${ownerBToken}`)
      .send({
        name: `Rival Constructors ${testSuffix}`,
        slug: `rival-constructors-${testSuffix}`,
        country: 'LK',
        defaultCurrency: 'LKR',
      });
    orgBId = orgBRes.body.data.id;

    // Create Project A1 in Org A
    const projA1Res = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .set('x-organization-id', orgAId)
      .send({
        code: `PRJ-A1-${testSuffix.toUpperCase()}`,
        name: 'Lotus Tower Commercial Center',
        projectType: ProjectType.COMMERCIAL,
        country: 'LK',
        currency: CurrencyCode.LKR,
        measurementStandard: MeasurementStandard.SLS_573,
        measurementUnitSystem: UnitSystem.METRIC,
        status: ProjectStatus.UNDER_CONSTRUCTION,
      });
    projectA1Id = projA1Res.body.data.id;

    // Create Project A2 in Org A (for cross-project checks)
    const projA2Res = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .set('x-organization-id', orgAId)
      .send({
        code: `PRJ-A2-${testSuffix.toUpperCase()}`,
        name: 'Marina Residential Bay',
        projectType: ProjectType.RESIDENTIAL,
        country: 'LK',
        currency: CurrencyCode.LKR,
        measurementStandard: MeasurementStandard.SLS_573,
        measurementUnitSystem: UnitSystem.METRIC,
      });
    projectA2Id = projA2Res.body.data.id;

    // Create Project B in Org B (for cross-tenant checks)
    const projBRes = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${ownerBToken}`)
      .set('x-organization-id', orgBId)
      .send({
        code: `PRJ-B-${testSuffix.toUpperCase()}`,
        name: 'Competitor HQ',
        projectType: ProjectType.COMMERCIAL,
        country: 'LK',
      });
    projectBId = projBRes.body.data.id;

    // Create Spatial Node in Project A1
    const spatialA1 = await prisma.spatialNode.create({
      data: {
        projectId: projectA1Id,
        name: 'Tower A - Level 01',
        nodeType: SpatialNodeType.LEVEL,
        displayOrder: 1,
      },
    });
    spatialNodeA1Id = spatialA1.id;

    // Create Spatial Node in Project A2
    const spatialA2 = await prisma.spatialNode.create({
      data: {
        projectId: projectA2Id,
        name: 'Block B - Ground Floor',
        nodeType: SpatialNodeType.LEVEL,
        displayOrder: 1,
      },
    });
    spatialNodeA2Id = spatialA2.id;

    // Create Work Package in Project A1
    const wbsA1 = await prisma.workPackage.create({
      data: {
        projectId: projectA1Id,
        code: 'CONC-01',
        name: 'Reinforced Concrete Substructure',
        displayOrder: 1,
      },
    });
    workPackageA1Id = wbsA1.id;
  });

  afterAll(async () => {
    // Cleanup created test records
    await prisma.documentSpatialLink.deleteMany({
      where: { document: { organizationId: orgAId } },
    });
    await prisma.documentWorkPackageLink.deleteMany({
      where: { document: { organizationId: orgAId } },
    });
    await prisma.document.deleteMany({
      where: { organizationId: { in: [orgAId, orgBId] } },
    });
    await prisma.documentUploadSession.deleteMany({
      where: { organizationId: { in: [orgAId, orgBId] } },
    });
    await prisma.spatialNode.deleteMany({
      where: { projectId: { in: [projectA1Id, projectA2Id, projectBId] } },
    });
    await prisma.workPackage.deleteMany({
      where: { projectId: { in: [projectA1Id, projectA2Id, projectBId] } },
    });
    await prisma.projectMember.deleteMany({
      where: { projectId: { in: [projectA1Id, projectA2Id, projectBId] } },
    });
    await prisma.project.deleteMany({
      where: { organizationId: { in: [orgAId, orgBId] } },
    });
    await prisma.membership.deleteMany({
      where: { organizationId: { in: [orgAId, orgBId] } },
    });
    await prisma.organization.deleteMany({
      where: { id: { in: [orgAId, orgBId] } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [ownerAEmail, qsAEmail, viewerAEmail, ownerBEmail] } },
    });

    await app.close();
  });

  // ========================================================
  // Task V.1: Upload Session Initiation & RBAC Permissions
  // ========================================================
  describe('1. Upload Session Initiation & Permissions', () => {
    it('allows QS_ENGINEER to create an upload session for a valid document', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectA1Id}/documents/upload-sessions`)
        .set('Authorization', `Bearer ${qsAToken}`)
        .set('x-organization-id', orgAId)
        .send({
          declaredFilename: 'architectural_plan_level_01.pdf',
          declaredMimeType: 'application/pdf',
          declaredSizeBytes: 1024 * 1024 * 2, // 2 MB
          category: DocumentCategory.ARCHITECTURAL_DRAWING,
          discipline: DocumentDiscipline.ARCHITECTURE,
          reference: 'ARC-001',
          title: 'Ground Level Architectural Plan',
          spatialNodeIds: [spatialNodeA1Id],
          workPackageIds: [workPackageA1Id],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.declaredFilename).toBe('architectural_plan_level_01.pdf');
    });

    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectA1Id}/documents/upload-sessions`)
        .set('x-organization-id', orgAId)
        .send({
          declaredFilename: 'plan.pdf',
          declaredMimeType: 'application/pdf',
          declaredSizeBytes: 1024,
          category: DocumentCategory.ARCHITECTURAL_DRAWING,
        });

      expect(res.status).toBe(401);
    });

    it('rejects VIEWER role from creating upload sessions with 403', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectA1Id}/documents/upload-sessions`)
        .set('Authorization', `Bearer ${viewerAToken}`)
        .set('x-organization-id', orgAId)
        .send({
          declaredFilename: 'viewer_attempt.pdf',
          declaredMimeType: 'application/pdf',
          declaredSizeBytes: 1024,
          category: DocumentCategory.ARCHITECTURAL_DRAWING,
        });

      expect(res.status).toBe(403);
    });
  });

  // ========================================================
  // Task V.2: File Extension & File Size Validations
  // ========================================================
  describe('2. File Validation & Size Enforcement', () => {
    it('rejects unsupported file extensions (.exe) with 400', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectA1Id}/documents/upload-sessions`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .send({
          declaredFilename: 'malware_payload.exe',
          declaredMimeType: 'application/x-msdownload',
          declaredSizeBytes: 1024,
          category: DocumentCategory.OTHER,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Unsupported file type');
    });

    it('rejects oversized files exceeding 500 MB limit with 400', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectA1Id}/documents/upload-sessions`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .send({
          declaredFilename: 'huge_scan.pdf',
          declaredMimeType: 'application/pdf',
          declaredSizeBytes: 600 * 1024 * 1024, // 600 MB
          category: DocumentCategory.ARCHITECTURAL_DRAWING,
        });

      expect(res.status).toBe(400);
    });
  });

  // ========================================================
  // Task V.3: Direct File Upload, Magic Byte & SHA-256 Checksum
  // ========================================================
  describe('3. Direct Upload, Magic Bytes & SHA-256 Integrity', () => {
    let sessionId: string;
    const validPdfBuffer = Buffer.from(
      '%PDF-1.4\n1 0 obj\n<< /Title (Test Document) >>\nendobj\ntrailer\n<< >>\n%%EOF',
    );
    const validPdfChecksum = crypto.createHash('sha256').update(validPdfBuffer).digest('hex');

    beforeEach(async () => {
      const sessionRes = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectA1Id}/documents/upload-sessions`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .send({
          declaredFilename: 'floor_plan.pdf',
          declaredMimeType: 'application/pdf',
          declaredSizeBytes: validPdfBuffer.length,
          category: DocumentCategory.ARCHITECTURAL_DRAWING,
          discipline: DocumentDiscipline.ARCHITECTURE,
          reference: `ARC-TEST-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        });
      sessionId = sessionRes.body.data.id;
    });

    it('rejects uploaded file if magic bytes do not match declared PDF format', async () => {
      const fakePdfBuffer = Buffer.from('NOT_A_PDF_CONTENT_MALICIOUS_DATA');

      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectA1Id}/documents/upload-sessions/${sessionId}/file`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .attach('file', fakePdfBuffer, 'floor_plan.pdf');

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('magic byte signature');
    });

    it('successfully uploads valid PDF to quarantine and computes SHA-256', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectA1Id}/documents/upload-sessions/${sessionId}/file`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .attach('file', validPdfBuffer, 'floor_plan.pdf');

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('QUARANTINED');
      expect(res.body.data.checksumSha256).toBe(validPdfChecksum);
    });

    it('rejects completion when SHA-256 does not match uploaded file', async () => {
      // 1. Upload valid file
      await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectA1Id}/documents/upload-sessions/${sessionId}/file`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .attach('file', validPdfBuffer, 'floor_plan.pdf');

      // 2. Complete with incorrect hash
      const wrongHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectA1Id}/documents/upload-sessions/complete`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .send({
          sessionId,
          checksumSha256: wrongHash,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Checksum verification mismatch');
    });

    it('successfully finalizes upload session, creates document record and is idempotent', async () => {
      // 1. Upload valid file
      await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectA1Id}/documents/upload-sessions/${sessionId}/file`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .attach('file', validPdfBuffer, 'floor_plan.pdf');

      // 2. Complete with correct hash
      const completeRes = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectA1Id}/documents/upload-sessions/complete`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .send({
          sessionId,
          checksumSha256: validPdfChecksum,
          title: 'Final Architectural Ground Floor',
          spatialNodeIds: [spatialNodeA1Id],
          workPackageIds: [workPackageA1Id],
        });

      expect(completeRes.status).toBe(200);
      expect(completeRes.body.data.id).toBeDefined();
      expect(completeRes.body.data.uploadStatus).toBe('READY');
      expect(completeRes.body.data.securityScanStatus).toBe('CLEAN');
      expect(completeRes.body.data.checksumSha256).toBe(validPdfChecksum);
      expect(completeRes.body.data.spatialLinks).toHaveLength(1);
      expect(completeRes.body.data.workPackageLinks).toHaveLength(1);

      const createdDocId = completeRes.body.data.id;

      // 3. Idempotent duplicate completion
      const dupeRes = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectA1Id}/documents/upload-sessions/complete`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .send({
          sessionId,
          checksumSha256: validPdfChecksum,
        });

      expect(dupeRes.status).toBe(200);
      expect(dupeRes.body.data.id).toBe(createdDocId);
    });
  });

  // ========================================================
  // Task V.4: Spatial & WBS Link Cross-Project Rejection
  // ========================================================
  describe('4. Strict Spatial & WBS Hierarchy Isolation', () => {
    it('rejects linking document to a spatial node belonging to a different project', async () => {
      const validPdf = Buffer.from('%PDF-1.4\nDummy content for cross project check\n%%EOF');
      const hash = crypto.createHash('sha256').update(validPdf).digest('hex');

      // Attempt to initiate session for Project A1 with spatialNodeA2Id (which belongs to Project A2)
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectA1Id}/documents/upload-sessions`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .send({
          declaredFilename: 'cross_project_plan.pdf',
          declaredMimeType: 'application/pdf',
          declaredSizeBytes: validPdf.length,
          category: DocumentCategory.ARCHITECTURAL_DRAWING,
          spatialNodeIds: [spatialNodeA2Id], // BELONGS TO PROJECT A2!
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('do not belong to this project');
    });
  });

  // ========================================================
  // Task V.5: Upload Cancellation & Quarantine Cleanup
  // ========================================================
  describe('5. Upload Cancellation & Quarantine Cleanup', () => {
    it('allows cancelling a pending or quarantined session', async () => {
      // 1. Create session
      const sessionRes = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectA1Id}/documents/upload-sessions`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .send({
          declaredFilename: 'cancel_me.pdf',
          declaredMimeType: 'application/pdf',
          declaredSizeBytes: 1024,
          category: DocumentCategory.OTHER,
        });

      const cancelSessionId = sessionRes.body.data.id;

      // 2. Cancel
      const cancelRes = await request(app.getHttpServer())
        .delete(`/api/v1/projects/${projectA1Id}/documents/upload-sessions/${cancelSessionId}`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.message).toContain('cancelled successfully');
    });
  });

  // ========================================================
  // Task V.6: Document Lifecycle: Read, Update, Archive, Restore
  // ========================================================
  describe('6. Document Lifecycle: Read, Update, Archive & Restore', () => {
    let testDocId: string;
    let testDocRef: string;

    beforeAll(async () => {
      testDocRef = `DOC-TEST-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const buf = Buffer.from('%PDF-1.4\nTest Document Lifecycle Content\n%%EOF');
      const hash = crypto.createHash('sha256').update(buf).digest('hex');

      const sRes = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectA1Id}/documents/upload-sessions`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .send({
          declaredFilename: 'spec_document.pdf',
          declaredMimeType: 'application/pdf',
          declaredSizeBytes: buf.length,
          category: DocumentCategory.SPECIFICATION,
          reference: testDocRef,
          title: 'Initial Specification',
        });

      const sid = sRes.body.data.id;

      await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectA1Id}/documents/upload-sessions/${sid}/file`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .attach('file', buf, 'spec_document.pdf');

      const compRes = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectA1Id}/documents/upload-sessions/complete`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .send({
          sessionId: sid,
          checksumSha256: hash,
        });

      testDocId = compRes.body.data.id;
    });

    it('retrieves full document details with links and user info', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectA1Id}/documents/${testDocId}`)
        .set('Authorization', `Bearer ${viewerAToken}`)
        .set('x-organization-id', orgAId);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(testDocId);
      expect(res.body.data.title).toBe('Initial Specification');
      expect(res.body.data.uploadedBy).toBeDefined();
    });

    it('updates document metadata', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectA1Id}/documents/${testDocId}`)
        .set('Authorization', `Bearer ${qsAToken}`)
        .set('x-organization-id', orgAId)
        .send({
          title: 'Revised Specification v2',
          description: 'Updated clauses per engineer review',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Revised Specification v2');
      expect(res.body.data.description).toBe('Updated clauses per engineer review');
    });

    it('archives document and excludes it from default listing', async () => {
      // 1. Archive
      const archiveRes = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectA1Id}/documents/${testDocId}/archive`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId);

      expect(archiveRes.status).toBe(200);
      expect(archiveRes.body.data.archivedAt).not.toBeNull();

      // 2. Listing without includeArchived
      const listRes = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectA1Id}/documents`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId);

      const found = listRes.body.data.items.some((d: any) => d.id === testDocId);
      expect(found).toBe(false);

      // 3. Listing with includeArchived=true
      const listArchivedRes = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectA1Id}/documents?includeArchived=true`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId);

      const foundArchived = listArchivedRes.body.data.items.some((d: any) => d.id === testDocId);
      expect(foundArchived).toBe(true);

      // 4. Restore
      const restoreRes = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectA1Id}/documents/${testDocId}/restore`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId);

      expect(restoreRes.status).toBe(200);
      expect(restoreRes.body.data.archivedAt).toBeNull();
    });
  });

  // ========================================================
  // Task V.7: Document Download (Presigned URL & Stream)
  // ========================================================
  describe('7. Document Download Mechanisms', () => {
    let downloadDocId: string;
    const content = '%PDF-1.4\nTest Download Binary Stream\n%%EOF';

    beforeAll(async () => {
      const buf = Buffer.from(content);
      const hash = crypto.createHash('sha256').update(buf).digest('hex');

      const sRes = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectA1Id}/documents/upload-sessions`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .send({
          declaredFilename: 'download_test.pdf',
          declaredMimeType: 'application/pdf',
          declaredSizeBytes: buf.length,
          category: DocumentCategory.REPORT,
        });

      const sid = sRes.body.data.id;

      await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectA1Id}/documents/upload-sessions/${sid}/file`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .attach('file', buf, 'download_test.pdf');

      const compRes = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectA1Id}/documents/upload-sessions/complete`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .send({ sessionId: sid, checksumSha256: hash });

      downloadDocId = compRes.body.data.id;
    });

    it('generates a presigned MinIO download URL for authorized user', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectA1Id}/documents/${downloadDocId}/download-url`)
        .set('Authorization', `Bearer ${viewerAToken}`)
        .set('x-organization-id', orgAId);

      expect(res.status).toBe(200);
      expect(res.body.data.downloadUrl).toContain('http');
      expect(res.body.data.expiresInSeconds).toBe(3600);
    });

    it('streams binary file directly with correct headers', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectA1Id}/documents/${downloadDocId}/download`)
        .set('Authorization', `Bearer ${viewerAToken}`)
        .set('x-organization-id', orgAId)
        .buffer(true);

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toContain('application/pdf');
      expect(res.header['content-disposition']).toContain('attachment; filename="download_test.pdf"');
      expect(res.body.toString('utf8')).toBe(content);
    });
  });

  // ========================================================
  // Task V.8: Multi-Tenant Isolation & Cross-Project Protection
  // ========================================================
  describe('8. Multi-Tenant Isolation', () => {
    it('denies user from Org B from accessing Org A project documents with 404', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectA1Id}/documents`)
        .set('Authorization', `Bearer ${ownerBToken}`)
        .set('x-organization-id', orgBId);

      expect(res.status).toBe(404);
    });

    it('denies user from Org B from uploading documents to Org A with 404', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectA1Id}/documents/upload-sessions`)
        .set('Authorization', `Bearer ${ownerBToken}`)
        .set('x-organization-id', orgBId)
        .send({
          declaredFilename: 'cross_tenant.pdf',
          declaredMimeType: 'application/pdf',
          declaredSizeBytes: 1024,
          category: DocumentCategory.OTHER,
        });

      expect(res.status).toBe(404);
    });
  });

  // ========================================================
  // Task V.9: Storage Usage Metrics
  // ========================================================
  describe('9. Storage Usage Aggregation', () => {
    it('returns storage metrics breakdown for authorized user', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectA1Id}/documents/storage-usage`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId);

      expect(res.status).toBe(200);
      expect(res.body.data.totalBytes).toBeDefined();
      expect(res.body.data.totalBytesFormatted).toBeDefined();
      expect(res.body.data.totalDocuments).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(res.body.data.byCategory)).toBe(true);
      expect(Array.isArray(res.body.data.byFormat)).toBe(true);
    });

    it('rejects VIEWER without storage_usage permission with 403', async () => {
      // Temporarily test role check
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectA1Id}/documents/storage-usage`)
        .set('Authorization', `Bearer ${viewerAToken}`)
        .set('x-organization-id', orgAId);

      // In shared-types, VIEWER has only documents.view and documents.download, not storage_usage
      expect(res.status).toBe(403);
    });
  });
});
