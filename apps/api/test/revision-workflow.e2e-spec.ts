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
  DrawingType,
  SheetSize,
  IssuePurpose,
  ReviewDecision,
  ReviewStatus,
  TransmittalStatus,
  DocumentWorkflowStatus,
} from '@buildmind/shared-types';

describe('Phase 3C: Document Control, Revision Management & Transmittals (E2E Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testSuffix = Math.random().toString(36).substring(2, 8);

  const directorEmail = `director-${testSuffix}@buildmind.test`;
  const seniorQsEmail = `seniorqs-${testSuffix}@buildmind.test`;
  const qsEmail = `qs-${testSuffix}@buildmind.test`;
  const viewerEmail = `viewer-${testSuffix}@buildmind.test`;
  const competitorEmail = `competitor-${testSuffix}@buildmind.test`;
  const password = 'BuildMind#Secure2026!';

  let directorToken: string;
  let seniorQsToken: string;
  let qsToken: string;
  let viewerToken: string;
  let competitorToken: string;

  let directorId: string;
  let seniorQsId: string;
  let qsId: string;
  let viewerId: string;
  let competitorId: string;

  let orgAId: string;
  let orgBId: string;

  let projectId: string;
  let competitorProjectId: string;

  let spatialNodeId: string;
  let workPackageId: string;

  let initialDocId: string;
  let initialVersionId: string;

  // Sample valid PDF buffer
  const validPdfBuffer = Buffer.from(
    '%PDF-1.4\n1 0 obj\n<< /Title (Architectural Elevation) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF',
  );
  const validPdfHash = crypto.createHash('sha256').update(validPdfBuffer).digest('hex');

  const rev2PdfBuffer = Buffer.from(
    '%PDF-1.4\n1 0 obj\n<< /Title (Architectural Elevation Rev 02) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF',
  );
  const rev2PdfHash = crypto.createHash('sha256').update(rev2PdfBuffer).digest('hex');

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

    const registerUser = async (email: string, fullName: string) => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email, fullName, password });
      return {
        id: res.body.user.id,
        token: res.body.tokens.accessToken,
      };
    };

    const userDirector = await registerUser(directorEmail, 'Alice Commercial Director');
    directorId = userDirector.id;
    directorToken = userDirector.token;

    const userSeniorQs = await registerUser(seniorQsEmail, 'Sarah Senior QS');
    seniorQsId = userSeniorQs.id;
    seniorQsToken = userSeniorQs.token;

    const userQs = await registerUser(qsEmail, 'Bob QS Engineer');
    qsId = userQs.id;
    qsToken = userQs.token;

    const userViewer = await registerUser(viewerEmail, 'David Site Viewer');
    viewerId = userViewer.id;
    viewerToken = userViewer.token;

    const userCompetitor = await registerUser(competitorEmail, 'Eve Competitor');
    competitorId = userCompetitor.id;
    competitorToken = userCompetitor.token;

    // Create Org A
    const orgARes = await request(app.getHttpServer())
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${directorToken}`)
      .send({
        name: `Horizon Construction ${testSuffix}`,
        slug: `horizon-${testSuffix}`,
        country: 'LK',
        defaultCurrency: 'LKR',
      });
    orgAId = orgARes.body.data.id;

    // Add members to Org A
    await prisma.membership.create({
      data: {
        userId: seniorQsId,
        organizationId: orgAId,
        role: OrganizationRole.SENIOR_QS,
      },
    });

    await prisma.membership.create({
      data: {
        userId: qsId,
        organizationId: orgAId,
        role: OrganizationRole.QS_ENGINEER,
      },
    });

    await prisma.membership.create({
      data: {
        userId: viewerId,
        organizationId: orgAId,
        role: OrganizationRole.VIEWER,
      },
    });

    // Create Org B
    const orgBRes = await request(app.getHttpServer())
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${competitorToken}`)
      .send({
        name: `Competitor Ltd ${testSuffix}`,
        slug: `competitor-${testSuffix}`,
        country: 'LK',
        defaultCurrency: 'LKR',
      });
    orgBId = orgBRes.body.data.id;

    // Create Project A
    const projRes = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${directorToken}`)
      .set('x-organization-id', orgAId)
      .send({
        name: `Twin Towers Phase 1 ${testSuffix}`,
        code: `TT1-${testSuffix.toUpperCase()}`,
        projectType: ProjectType.HIGH_RISE_COMMERCIAL,
        status: ProjectStatus.PLANNING,
        measurementStandard: MeasurementStandard.SLS_573,
        measurementUnitSystem: UnitSystem.METRIC,
        currency: CurrencyCode.LKR,
      });
    projectId = projRes.body.data.id;

    // Grant project access to Bob (QS) and Sarah (Senior QS)
    await prisma.projectMember.create({
      data: {
        projectId,
        userId: qsId,
      },
    });

    await prisma.projectMember.create({
      data: {
        projectId,
        userId: seniorQsId,
      },
    });

    // Create Competitor Project in Org B
    const compProjRes = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${competitorToken}`)
      .set('x-organization-id', orgBId)
      .send({
        name: `Rival Plaza ${testSuffix}`,
        code: `RIV-${testSuffix.toUpperCase()}`,
        projectType: ProjectType.COMMERCIAL_OFFICE,
      });
    competitorProjectId = compProjRes.body.data.id;

    // Add Spatial Node
    const spatialNode = await prisma.spatialNode.create({
      data: {
        projectId,
        name: 'Tower A',
        nodeType: SpatialNodeType.BUILDING,
        displayOrder: 1,
      },
    });
    spatialNodeId = spatialNode.id;

    // Add Work Package
    const workPkg = await prisma.workPackage.create({
      data: {
        projectId,
        code: 'WP-01',
        name: 'Substructure & Foundation',
        displayOrder: 1,
      },
    });
    workPackageId = workPkg.id;

    // Upload baseline document: DOC-ARCH-001
    const sessionRes = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/documents/upload-sessions`)
      .set('Authorization', `Bearer ${qsToken}`)
      .set('x-organization-id', orgAId)
      .send({
        declaredFilename: 'Tower_A_Elevation.pdf',
        declaredMimeType: 'application/pdf',
        declaredSizeBytes: validPdfBuffer.length,
        category: DocumentCategory.ARCHITECTURAL_DRAWING,
        discipline: DocumentDiscipline.ARCHITECTURE,
        reference: `DWG-A101-${testSuffix.toUpperCase()}`,
        title: 'Tower A North Elevation',
      });
    const sessionId = sessionRes.body.data.id;

    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/documents/upload-sessions/${sessionId}/file`)
      .set('Authorization', `Bearer ${qsToken}`)
      .set('x-organization-id', orgAId)
      .attach('file', validPdfBuffer, 'Tower_A_Elevation.pdf');

    const compRes = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/documents/upload-sessions/complete`)
      .set('Authorization', `Bearer ${qsToken}`)
      .set('x-organization-id', orgAId)
      .send({
        sessionId,
        checksumSha256: validPdfHash,
        spatialNodeIds: [spatialNodeId],
        workPackageIds: [workPackageId],
      });

    initialDocId = compRes.body.data.id;
    initialVersionId = compRes.body.data.latestVersionId;
  });

  afterAll(async () => {
    try {
      await prisma.documentVersionSpatialLink.deleteMany({});
      await prisma.documentVersionWorkPackageLink.deleteMany({});
      await prisma.transmittalItem.deleteMany({});
      await prisma.documentTransmittal.deleteMany({});
      await prisma.documentReview.deleteMany({});
      await prisma.drawingMetadata.deleteMany({});
      await prisma.documentVersion.deleteMany({});
      await prisma.documentSpatialLink.deleteMany({});
      await prisma.documentWorkPackageLink.deleteMany({});
      await prisma.documentAuditLog.deleteMany({});
      await prisma.document.deleteMany({});
      await prisma.documentUploadSession.deleteMany({});
      await prisma.spatialNode.deleteMany({});
      await prisma.workPackage.deleteMany({});
      await prisma.projectMember.deleteMany({});
      await prisma.project.deleteMany({});
      await prisma.membership.deleteMany({});
      if (orgAId || orgBId) {
        await prisma.organization.deleteMany({
          where: { id: { in: [orgAId, orgBId].filter(Boolean) } },
        });
      }
      await prisma.user.deleteMany({
        where: {
          email: {
            in: [directorEmail, seniorQsEmail, qsEmail, viewerEmail, competitorEmail],
          },
        },
      });
    } catch {}
    await app.close();
  });

  // ==========================================
  // 1. Initial Document Backfill & Version 1 Verification
  // ==========================================
  describe('1. Document Version Architecture Foundation', () => {
    it('verifies initial upload created Version 1 with revision code "01" and PUBLISHED status', async () => {
      const docRes = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}/documents/${initialDocId}`)
        .set('Authorization', `Bearer ${qsToken}`)
        .set('x-organization-id', orgAId);

      expect(docRes.status).toBe(200);
      expect(docRes.body.data.latestVersionId).toBeDefined();
      expect(docRes.body.data.currentPublishedVersionId).toBe(docRes.body.data.latestVersionId);
      expect(docRes.body.data.currentRevisionCode).toBe('01');
      expect(docRes.body.data.versions).toHaveLength(1);

      const v1 = docRes.body.data.versions[0];
      expect(v1.versionNumber).toBe(1);
      expect(v1.revisionCode).toBe('01');
      expect(v1.workflowStatus).toBe('PUBLISHED');
      expect(v1.checksumSha256).toBe(validPdfHash);
      expect(v1.uploadedById).toBe(qsId);
    });

    it('verifies DrawingMetadata was automatically registered for the architectural drawing', async () => {
      const drawingRes = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}/drawings`)
        .set('Authorization', `Bearer ${qsToken}`)
        .set('x-organization-id', orgAId);

      expect(drawingRes.status).toBe(200);
      expect(drawingRes.body.data.total).toBeGreaterThanOrEqual(1);

      const drawing = drawingRes.body.data.items.find((d: any) => d.documentId === initialDocId);
      expect(drawing).toBeDefined();
      expect(drawing.drawingNumber).toBe(`DWG-A101-${testSuffix.toUpperCase()}`);
      expect(drawing.drawingTitle).toBe('Tower A North Elevation');
      expect(drawing.discipline).toBe(DocumentDiscipline.ARCHITECTURE);
      expect(drawing.currentRevisionCode).toBe('01');
      expect(drawing.workflowStatus).toBe('PUBLISHED');
    });
  });

  // ==========================================
  // 2. New Revision Upload & Version Incrementing
  // ==========================================
  describe('2. Revision Uploads & Validation', () => {
    let rev2Id: string;

    it('successfully uploads revision 02 as DRAFT without overwriting published version', async () => {
      const revRes = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/documents/${initialDocId}/versions`)
        .set('Authorization', `Bearer ${qsToken}`)
        .set('x-organization-id', orgAId)
        .field('revisionCode', '02')
        .field('title', 'Tower A North Elevation Rev 02')
        .field('changeNote', 'Updated window frame specifications per client request')
        .field('declaredScale', '1:100')
        .attach('file', rev2PdfBuffer, 'Tower_A_Elevation_Rev02.pdf');

      expect(revRes.status).toBe(201);
      expect(revRes.body.data.versionNumber).toBe(2);
      expect(revRes.body.data.revisionCode).toBe('02');
      expect(revRes.body.data.workflowStatus).toBe('DRAFT');
      expect(revRes.body.data.checksumSha256).toBe(rev2PdfHash);
      rev2Id = revRes.body.data.id;

      // Verify parent document pointer: latestVersion is now v2, but currentPublishedVersion remains v1!
      const docRes = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}/documents/${initialDocId}`)
        .set('Authorization', `Bearer ${qsToken}`)
        .set('x-organization-id', orgAId);

      expect(docRes.body.data.latestVersionId).toBe(rev2Id);
      expect(docRes.body.data.currentPublishedVersionId).toBe(initialVersionId); // Draft DOES NOT overwrite published!
      expect(docRes.body.data.currentRevisionCode).toBe('01');
      expect(docRes.body.data.versions).toHaveLength(2);
    });

    it('rejects duplicate revision code within the same document with 409 Conflict', async () => {
      const dupeRes = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/documents/${initialDocId}/versions`)
        .set('Authorization', `Bearer ${qsToken}`)
        .set('x-organization-id', orgAId)
        .field('revisionCode', '02') // Already exists!
        .attach('file', rev2PdfBuffer, 'duplicate.pdf');

      expect(dupeRes.status).toBe(409);
      expect(dupeRes.body.message).toContain('already exists');
    });

    it('rejects revision upload by unauthorized VIEWER role with 403 Forbidden', async () => {
      const viewerRes = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/documents/${initialDocId}/versions`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .set('x-organization-id', orgAId)
        .field('revisionCode', '03')
        .attach('file', rev2PdfBuffer, 'unauthorized.pdf');

      expect(viewerRes.status).toBe(403);
    });

    it('lists version history in descending sequential order', async () => {
      const listRes = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}/documents/${initialDocId}/versions`)
        .set('Authorization', `Bearer ${qsToken}`)
        .set('x-organization-id', orgAId);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data).toHaveLength(2);
      expect(listRes.body.data[0].versionNumber).toBe(2);
      expect(listRes.body.data[1].versionNumber).toBe(1);
    });
  });

  // ==========================================
  // 3. Workflow State Machine & Segregation of Duties
  // ==========================================
  describe('3. Review, Approval & Publication Workflow', () => {
    let rev2VersionId: string;

    beforeAll(async () => {
      const doc = await prisma.document.findUnique({
        where: { id: initialDocId },
      });
      rev2VersionId = doc!.latestVersionId!;
    });

    it('submits version 02 for review: DRAFT -> SUBMITTED', async () => {
      const submitRes = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/documents/${initialDocId}/versions/${rev2VersionId}/submit`)
        .set('Authorization', `Bearer ${qsToken}`)
        .set('x-organization-id', orgAId);

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.data.workflowStatus).toBe('SUBMITTED');
      expect(submitRes.body.data.submittedAt).toBeDefined();
    });

    it('assigns Sarah (Senior QS) as reviewer: SUBMITTED -> UNDER_REVIEW', async () => {
      const reqReviewRes = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/documents/${initialDocId}/versions/${rev2VersionId}/request-review`)
        .set('Authorization', `Bearer ${qsToken}`)
        .set('x-organization-id', orgAId)
        .send({
          assignedReviewerId: seniorQsId,
          comments: 'Please verify the revised window schedules.',
        });

      expect(reqReviewRes.status).toBe(200);
      expect(reqReviewRes.body.data.status).toBe('PENDING');
      expect(reqReviewRes.body.data.assignedReviewer.fullName).toBe('Sarah Senior QS');

      const vRes = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}/documents/${initialDocId}/versions/${rev2VersionId}`)
        .set('Authorization', `Bearer ${qsToken}`)
        .set('x-organization-id', orgAId);

      expect(vRes.body.data.workflowStatus).toBe('UNDER_REVIEW');
    });

    it('enforces segregation of duties: Sarah (Senior QS) cannot approve her own uploaded revision', async () => {
      // 1. Sarah (Senior QS, who has documents.approve) uploads a separate document
      const sSessionRes = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/documents/upload-sessions`)
        .set('Authorization', `Bearer ${seniorQsToken}`)
        .set('x-organization-id', orgAId)
        .send({
          declaredFilename: 'Sarah_Test_Plan.pdf',
          declaredMimeType: 'application/pdf',
          declaredSizeBytes: validPdfBuffer.length,
          category: DocumentCategory.STRUCTURAL_DRAWING,
          reference: `DWG-S99-${testSuffix.toUpperCase()}`,
          title: 'Sarah Structural Plan',
        });
      const sSessionId = sSessionRes.body.data.id;

      await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/documents/upload-sessions/${sSessionId}/file`)
        .set('Authorization', `Bearer ${seniorQsToken}`)
        .set('x-organization-id', orgAId)
        .attach('file', validPdfBuffer, 'Sarah_Test_Plan.pdf');

      const sCompRes = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/documents/upload-sessions/complete`)
        .set('Authorization', `Bearer ${seniorQsToken}`)
        .set('x-organization-id', orgAId)
        .send({ sessionId: sSessionId, checksumSha256: validPdfHash });

      const sDocId = sCompRes.body.data.id;

      // 2. Upload revision 02 by Sarah
      const sRevRes = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/documents/${sDocId}/versions`)
        .set('Authorization', `Bearer ${seniorQsToken}`)
        .set('x-organization-id', orgAId)
        .field('revisionCode', '02')
        .field('title', 'Sarah Structural Rev 02')
        .attach('file', rev2PdfBuffer, 'Sarah_Rev02.pdf');

      const sRevId = sRevRes.body.data.id;

      // 3. Sarah submits and requests review
      await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/documents/${sDocId}/versions/${sRevId}/submit`)
        .set('Authorization', `Bearer ${seniorQsToken}`)
        .set('x-organization-id', orgAId);

      await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/documents/${sDocId}/versions/${sRevId}/request-review`)
        .set('Authorization', `Bearer ${seniorQsToken}`)
        .set('x-organization-id', orgAId)
        .send({ assignedReviewerId: directorId });

      // 4. Sarah attempts to approve her own version (she has 'documents.approve' permission!)
      const selfApproveRes = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/documents/${sDocId}/versions/${sRevId}/review-decision`)
        .set('Authorization', `Bearer ${seniorQsToken}`)
        .set('x-organization-id', orgAId)
        .send({
          decision: ReviewDecision.APPROVED,
          comments: 'Self-approval attempt by Senior QS',
        });

      expect(selfApproveRes.status).toBe(403);
      expect(selfApproveRes.body.message).toContain('Segregation of duties violation');
    });

    it('Sarah (Senior QS) approves version 02: UNDER_REVIEW -> APPROVED', async () => {
      const approveRes = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/documents/${initialDocId}/versions/${rev2VersionId}/review-decision`)
        .set('Authorization', `Bearer ${seniorQsToken}`)
        .set('x-organization-id', orgAId)
        .send({
          decision: ReviewDecision.APPROVED,
          comments: 'Reviewed and confirmed compliant with architectural specifications.',
          decisionNote: 'Complies with SLS 573 rules.',
        });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.status).toBe('APPROVED');

      const vRes = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}/documents/${initialDocId}/versions/${rev2VersionId}`)
        .set('Authorization', `Bearer ${seniorQsToken}`)
        .set('x-organization-id', orgAId);

      expect(vRes.body.data.workflowStatus).toBe('APPROVED');
      expect(vRes.body.data.approvedAt).toBeDefined();
    });

    it('atomically publishes version 02: v1 becomes SUPERSEDED, v2 becomes PUBLISHED', async () => {
      const pubRes = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/documents/${initialDocId}/versions/${rev2VersionId}/publish`)
        .set('Authorization', `Bearer ${directorToken}`)
        .set('x-organization-id', orgAId);

      expect(pubRes.status).toBe(200);
      expect(pubRes.body.data.workflowStatus).toBe('PUBLISHED');
      expect(pubRes.body.data.publishedAt).toBeDefined();

      // Verify Version 1 is atomically SUPERSEDED
      const v1Res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}/documents/${initialDocId}/versions/${initialVersionId}`)
        .set('Authorization', `Bearer ${directorToken}`)
        .set('x-organization-id', orgAId);

      expect(v1Res.body.data.workflowStatus).toBe('SUPERSEDED');
      expect(v1Res.body.data.supersededAt).toBeDefined();

      // Verify parent document pointer is now Version 2
      const docRes = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}/documents/${initialDocId}`)
        .set('Authorization', `Bearer ${directorToken}`)
        .set('x-organization-id', orgAId);

      expect(docRes.body.data.currentPublishedVersionId).toBe(rev2VersionId);
      expect(docRes.body.data.currentRevisionCode).toBe('02');
    });

    it('duplicate publication call is idempotent', async () => {
      const dupePubRes = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/documents/${initialDocId}/versions/${rev2VersionId}/publish`)
        .set('Authorization', `Bearer ${directorToken}`)
        .set('x-organization-id', orgAId);

      expect(dupePubRes.status).toBe(200);
      expect(dupePubRes.body.data.workflowStatus).toBe('PUBLISHED');
    });
  });

  // ==========================================
  // 4. Version Comparison & Historical Downloads
  // ==========================================
  describe('4. Version Comparison & Historical Retrieval', () => {
    it('compares version 01 and version 02 side-by-side with metadata & checksum diffs', async () => {
      const doc = await prisma.document.findUnique({
        where: { id: initialDocId },
      });
      const v2Id = doc!.latestVersionId!;

      const compRes = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}/documents/${initialDocId}/versions-compare?fromVersionId=${initialVersionId}&toVersionId=${v2Id}`)
        .set('Authorization', `Bearer ${qsToken}`)
        .set('x-organization-id', orgAId);

      expect(compRes.status).toBe(200);
      expect(compRes.body.data.isChecksumIdentical).toBe(false);
      expect(compRes.body.data.fromVersion.revisionCode).toBe('01');
      expect(compRes.body.data.toVersion.revisionCode).toBe('02');
      expect(compRes.body.data.metadataDifferences.revisionCode.from).toBe('01');
      expect(compRes.body.data.metadataDifferences.revisionCode.to).toBe('02');
    });

    it('downloads historical version 1 binary stream with version headers', async () => {
      const dlRes = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}/documents/${initialDocId}/versions/${initialVersionId}/download`)
        .set('Authorization', `Bearer ${qsToken}`)
        .set('x-organization-id', orgAId)
        .buffer(true);

      expect(dlRes.status).toBe(200);
      expect(dlRes.headers['x-checksum-sha256']).toBe(validPdfHash);
      expect(dlRes.headers['x-revision-code']).toBe('01');
      expect(dlRes.body.toString('utf8')).toContain('Architectural Elevation');
    });

    it('generates presigned download URL for historical version 1', async () => {
      const urlRes = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}/documents/${initialDocId}/versions/${initialVersionId}/download-url`)
        .set('Authorization', `Bearer ${qsToken}`)
        .set('x-organization-id', orgAId);

      expect(urlRes.status).toBe(200);
      expect(urlRes.body.data.downloadUrl).toContain('http');
      expect(urlRes.body.data.revisionCode).toBe('01');
    });
  });

  // ==========================================
  // 5. Document Transmittals
  // ==========================================
  describe('5. Document Transmittals Management', () => {
    let transmittalId: string;

    it('creates a formal transmittal linking specific DocumentVersion IDs', async () => {
      const trRes = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/transmittals`)
        .set('Authorization', `Bearer ${seniorQsToken}`)
        .set('x-organization-id', orgAId)
        .send({
          reference: `TR-2026-${testSuffix.toUpperCase()}`,
          subject: 'Issue of Architectural Elevations for Construction Tender',
          authorizedRecipients: [
            {
              name: 'John Contractor',
              email: 'john@builder.lk',
              organization: 'Mega Builders Ltd',
              role: 'Main Contractor',
            },
          ],
          issuePurpose: IssuePurpose.FOR_TENDER,
          versionIds: [initialVersionId],
          notes: 'Approved elevations for tender pricing only.',
        });

      expect(trRes.status).toBe(201);
      expect(trRes.body.data.reference).toBe(`TR-2026-${testSuffix.toUpperCase()}`);
      expect(trRes.body.data.status).toBe('DRAFT');
      expect(trRes.body.data.itemCount).toBe(1);
      expect(trRes.body.data.items[0].documentVersionId).toBe(initialVersionId);
      expect(trRes.body.data.items[0].revisionCode).toBe('01');
      transmittalId = trRes.body.data.id;
    });

    it('rejects duplicate transmittal reference with 409 Conflict', async () => {
      const dupeRes = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/transmittals`)
        .set('Authorization', `Bearer ${seniorQsToken}`)
        .set('x-organization-id', orgAId)
        .send({
          reference: `TR-2026-${testSuffix.toUpperCase()}`,
          subject: 'Duplicate Transmittal',
          authorizedRecipients: [{ name: 'Test', email: 'test@test.lk' }],
          versionIds: [initialVersionId],
        });

      expect(dupeRes.status).toBe(409);
    });

    it('retrieves full transmittal details with recipient list and line items', async () => {
      const getRes = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}/transmittals/${transmittalId}`)
        .set('Authorization', `Bearer ${seniorQsToken}`)
        .set('x-organization-id', orgAId);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.subject).toBe(
        'Issue of Architectural Elevations for Construction Tender',
      );
      expect(getRes.body.data.authorizedRecipients).toHaveLength(1);
      expect(getRes.body.data.items).toHaveLength(1);
    });

    it('issues the transmittal: status becomes ISSUED and immutable', async () => {
      const issueRes = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/transmittals/${transmittalId}/issue`)
        .set('Authorization', `Bearer ${directorToken}`)
        .set('x-organization-id', orgAId);

      expect(issueRes.status).toBe(200);
      expect(issueRes.body.data.status).toBe('ISSUED');
      expect(issueRes.body.data.issuedAt).toBeDefined();
    });

    it('rejects re-issuing an already ISSUED transmittal', async () => {
      const reIssueRes = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/transmittals/${transmittalId}/issue`)
        .set('Authorization', `Bearer ${directorToken}`)
        .set('x-organization-id', orgAId);

      expect(reIssueRes.status).toBe(400);
      expect(reIssueRes.body.message).toContain('Only DRAFT transmittals can be issued');
    });
  });

  // ==========================================
  // 6. Cross-Tenant Isolation
  // ==========================================
  describe('6. Cross-Tenant Security Boundaries', () => {
    it('denies competitor from Org B from reading Org A versions with 404', async () => {
      const rivalRes = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}/documents/${initialDocId}/versions`)
        .set('Authorization', `Bearer ${competitorToken}`)
        .set('x-organization-id', orgBId);

      expect(rivalRes.status).toBe(404);
    });

    it('denies competitor from Org B from viewing Org A drawings with 404', async () => {
      const rivalDrawingRes = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}/drawings`)
        .set('Authorization', `Bearer ${competitorToken}`)
        .set('x-organization-id', orgBId);

      expect(rivalDrawingRes.status).toBe(404);
    });

    it('denies competitor from Org B from viewing Org A transmittals with 404', async () => {
      const rivalTrRes = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}/transmittals`)
        .set('Authorization', `Bearer ${competitorToken}`)
        .set('x-organization-id', orgBId);

      expect(rivalTrRes.status).toBe(404);
    });
  });
});
