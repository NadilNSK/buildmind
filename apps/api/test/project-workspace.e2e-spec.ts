import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  ProjectType,
  ProjectStatus,
  MeasurementStandard,
  UnitSystem,
  ContractStandard,
  CurrencyCode,
  SpatialNodeType,
  OrganizationRole,
  MembershipStatus,
} from '@buildmind/shared-types';

describe('Phase 3A: Construction Project Workspace & Data Foundation (E2E Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testSuffix = Math.random().toString(36).substring(2, 8);

  const ownerAEmail = `qs-director-${testSuffix}@buildmind.test`;
  const viewerAEmail = `site-viewer-${testSuffix}@buildmind.test`;
  const ownerBEmail = `other-tenant-${testSuffix}@buildmind.test`;
  const password = 'BuildMind#Secure2026!';

  let ownerAToken: string;
  let viewerAToken: string;
  let ownerBToken: string;

  let userOwnerAId: string;
  let userViewerAId: string;
  let userOwnerBId: string;

  let orgAId: string;
  let orgBId: string;

  let projectAId: string;
  let projectACode: string;

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
    userOwnerAId = userOwnerA.id;
    ownerAToken = userOwnerA.token;

    const userViewerA = await registerUser(viewerAEmail, 'David Site Viewer');
    userViewerAId = userViewerA.id;
    viewerAToken = userViewerA.token;

    const userOwnerB = await registerUser(ownerBEmail, 'Eve Competitor');
    userOwnerBId = userOwnerB.id;
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

    // Add David as VIEWER in Org A
    await prisma.membership.create({
      data: {
        userId: userViewerAId,
        organizationId: orgAId,
        role: OrganizationRole.VIEWER,
        status: MembershipStatus.ACTIVE,
      },
    });

    // Create Org B (Eve)
    const orgBRes = await request(app.getHttpServer())
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${ownerBToken}`)
      .send({
        name: `Competitor Holdings ${testSuffix}`,
        slug: `competitor-${testSuffix}`,
        country: 'LK',
        defaultCurrency: 'LKR',
      });
    orgBId = orgBRes.body.data.id;
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('1. Project Creation & Decimal Handling', () => {
    it('should create a commercial project with full construction metadata and exact decimal value', async () => {
      projectACode = `PRJ-${testSuffix.toUpperCase()}`;

      const res = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .send({
          code: projectACode,
          name: 'Colombo Port City Financial Centre Tower A',
          description: 'High-rise commercial office building with basement parking',
          projectType: ProjectType.COMMERCIAL,
          location: 'Colombo 01',
          country: 'LK',
          clientName: 'Port City Development Commission',
          contractorName: 'China Harbour Engineering',
          consultantName: 'Atkins International',
          projectManager: 'Eng. Bandara (FRICS)',
          startDate: '2026-06-01T00:00:00.000Z',
          expectedCompletionDate: '2029-12-31T00:00:00.000Z',
          estimatedContractValue: '450750250.75',
          currency: CurrencyCode.LKR,
          measurementStandard: MeasurementStandard.SLS_573,
          measurementUnitSystem: UnitSystem.METRIC,
          contractStandard: ContractStandard.FIDIC_RED,
          status: ProjectStatus.PLANNING,
        })
        .expect(201);

      const data = res.body.data;
      expect(data.id).toBeDefined();
      expect(data.code).toBe(projectACode);
      expect(data.estimatedContractValue).toBe('450750250.75'); // Exact decimal string
      expect(data.projectType).toBe(ProjectType.COMMERCIAL);
      expect(data.measurementStandard).toBe(MeasurementStandard.SLS_573);
      expect(data.measurementUnitSystem).toBe(UnitSystem.METRIC);
      expect(data.contractStandard).toBe(ContractStandard.FIDIC_RED);
      expect(data.status).toBe(ProjectStatus.PLANNING);

      projectAId = data.id;
    });

    it('should reject duplicate project code within the same organization with 409 Conflict', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .send({
          code: projectACode,
          name: 'Duplicate Code Project',
        })
        .expect(409);
    });

    it('should allow the same project code in a different organization', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${ownerBToken}`)
        .set('x-organization-id', orgBId)
        .send({
          code: projectACode,
          name: 'Competitor Same Code Project',
          currency: CurrencyCode.LKR,
        })
        .expect(201);

      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.code).toBe(projectACode);
    });
  });

  describe('2. Project Settings, Overview & Status Transitions', () => {
    it('should fetch project overview with metrics and audit stream', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectAId}/overview`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .expect(200);

      const data = res.body.data;
      expect(data.project).toBeDefined();
      expect(data.project.code).toBe(projectACode);
      expect(data.metrics).toBeDefined();
      expect(data.metrics.memberCount).toBeGreaterThanOrEqual(1);
      expect(data.metrics.spatialNodeCount).toBe(0);
      expect(data.metrics.workPackageCount).toBe(0);
      expect(Array.isArray(data.recentActivity)).toBe(true);
    });

    it('should allow valid status transition from PLANNING to DESIGN', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectAId}/settings`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .send({
          status: ProjectStatus.DESIGN,
        })
        .expect(200);

      expect(res.body.data.status).toBe(ProjectStatus.DESIGN);
    });

    it('should reject invalid status transition (e.g. DESIGN directly to FINAL_ACCOUNT) with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectAId}/settings`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .send({
          status: ProjectStatus.FINAL_ACCOUNT,
        })
        .expect(400);

      expect(res.body.message).toContain('Invalid project status transition');
    });

    it('should allow valid status transition from DESIGN to TENDERING to PRE_CONSTRUCTION to UNDER_CONSTRUCTION', async () => {
      // DESIGN -> TENDERING
      await request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectAId}/settings`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .send({ status: ProjectStatus.TENDERING })
        .expect(200);

      // TENDERING -> PRE_CONSTRUCTION
      await request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectAId}/settings`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .send({ status: ProjectStatus.PRE_CONSTRUCTION })
        .expect(200);

      // PRE_CONSTRUCTION -> UNDER_CONSTRUCTION
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectAId}/settings`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .send({ status: ProjectStatus.UNDER_CONSTRUCTION })
        .expect(200);

      expect(res.body.data.status).toBe(ProjectStatus.UNDER_CONSTRUCTION);
    });
  });

  describe('3. Spatial Breakdown Structure (SBS) & Cycle Prevention', () => {
    let siteNodeId: string;
    let towerNodeId: string;
    let floorNodeId: string;

    it('should create root spatial node (SITE)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectAId}/spatial-nodes`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .send({
          name: 'Port City Lot 14 Site',
          code: 'SITE-01',
          nodeType: SpatialNodeType.SITE,
          description: 'Overall site footprint of 12,000 m2',
          displayOrder: 1,
        })
        .expect(201);

      const data = res.body.data;
      expect(data.id).toBeDefined();
      expect(data.name).toBe('Port City Lot 14 Site');
      expect(data.nodeType).toBe(SpatialNodeType.SITE);
      expect(data.parentNodeId).toBeNull();

      siteNodeId = data.id;
    });

    it('should create child spatial node (BUILDING under SITE)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectAId}/spatial-nodes`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .send({
          parentNodeId: siteNodeId,
          name: 'Tower A Main Structure',
          code: 'TWR-A',
          nodeType: SpatialNodeType.BUILDING,
          displayOrder: 1,
        })
        .expect(201);

      const data = res.body.data;
      expect(data.id).toBeDefined();
      expect(data.parentNodeId).toBe(siteNodeId);
      expect(data.parentNode).toBeDefined();
      expect(data.parentNode.name).toBe('Port City Lot 14 Site');

      towerNodeId = data.id;
    });

    it('should create grandchild spatial node (LEVEL under BUILDING)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectAId}/spatial-nodes`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .send({
          parentNodeId: towerNodeId,
          name: 'Level 01 Retail Podium',
          code: 'L01',
          nodeType: SpatialNodeType.LEVEL,
          displayOrder: 1,
        })
        .expect(201);

      const data = res.body.data;
      expect(data.id).toBeDefined();
      expect(data.parentNodeId).toBe(towerNodeId);

      floorNodeId = data.id;
    });

    it('should reject self-parent assignment with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectAId}/spatial-nodes/${towerNodeId}`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .send({
          parentNodeId: towerNodeId,
        })
        .expect(400);

      expect(res.body.message).toContain('cannot be its own parent');
    });

    it('should reject circular ancestry (SITE parented to child TOWER) with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectAId}/spatial-nodes/${siteNodeId}`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .send({
          parentNodeId: floorNodeId, // Making root a child of its own grandchild
        })
        .expect(400);

      expect(res.body.message).toContain('Circular reference detected');
    });

    it('should list all spatial nodes with child counts and correct hierarchy', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectAId}/spatial-nodes`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .expect(200);

      const data = res.body.data;
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(3);

      const site = data.find((n: any) => n.id === siteNodeId);
      expect(site).toBeDefined();
      expect(site.childCount).toBe(1);
    });

    it('should soft-delete / archive a spatial node', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/projects/${projectAId}/spatial-nodes/${floorNodeId}`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .expect(200);

      // Active list should now exclude archived node
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectAId}/spatial-nodes`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .expect(200);

      expect(res.body.data.length).toBe(2);
      expect(res.body.data.some((n: any) => n.id === floorNodeId)).toBe(false);
    });
  });

  describe('4. Work Breakdown Structure (WBS) & Hierarchy Integrity', () => {
    let pkg1Id: string;
    let pkg1SubId: string;

    it('should create root work package (01 Substructure)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectAId}/work-packages`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .send({
          code: '01',
          name: 'Substructure Works',
          description: 'Piling, excavation, retaining walls and foundations',
          displayOrder: 1,
        })
        .expect(201);

      const data = res.body.data;
      expect(data.id).toBeDefined();
      expect(data.code).toBe('01');
      expect(data.parentPackageId).toBeNull();

      pkg1Id = data.id;
    });

    it('should reject duplicate work package code within the same project with 409 Conflict', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectAId}/work-packages`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .send({
          code: '01',
          name: 'Duplicate Package',
        })
        .expect(409);
    });

    it('should create child work package (01.01 Earthwork)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectAId}/work-packages`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .send({
          parentPackageId: pkg1Id,
          code: '01.01',
          name: 'Site Clearance & Excavation',
          displayOrder: 1,
        })
        .expect(201);

      const data = res.body.data;
      expect(data.id).toBeDefined();
      expect(data.parentPackageId).toBe(pkg1Id);
      expect(data.parentPackage).toBeDefined();
      expect(data.parentPackage.code).toBe('01');

      pkg1SubId = data.id;
    });

    it('should reject circular parent package reference with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectAId}/work-packages/${pkg1Id}`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .send({
          parentPackageId: pkg1SubId, // Making root package child of its own child
        })
        .expect(400);

      expect(res.body.message).toContain('Circular reference detected');
    });

    it('should reject self-parent package reference with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectAId}/work-packages/${pkg1Id}`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .send({
          parentPackageId: pkg1Id,
        })
        .expect(400);

      expect(res.body.message).toContain('cannot be its own parent');
    });

    it('should list work packages with hierarchy details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectAId}/work-packages`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .set('x-organization-id', orgAId)
        .expect(200);

      const data = res.body.data;
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);

      const pkg1 = data.find((p: any) => p.id === pkg1Id);
      expect(pkg1.childCount).toBe(1);
    });
  });

  describe('5. RBAC Permissions & Read-Only Access Restrictions', () => {
    it('should allow VIEWER to read project, spatial nodes and work packages', async () => {
      // Can read project
      await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectAId}`)
        .set('Authorization', `Bearer ${viewerAToken}`)
        .set('x-organization-id', orgAId)
        .expect(200);

      // Can read spatial nodes
      await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectAId}/spatial-nodes`)
        .set('Authorization', `Bearer ${viewerAToken}`)
        .set('x-organization-id', orgAId)
        .expect(200);

      // Can read work packages
      await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectAId}/work-packages`)
        .set('Authorization', `Bearer ${viewerAToken}`)
        .set('x-organization-id', orgAId)
        .expect(200);
    });

    it('should DENY VIEWER from editing project settings with 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectAId}/settings`)
        .set('Authorization', `Bearer ${viewerAToken}`)
        .set('x-organization-id', orgAId)
        .send({ name: 'Hacked By Viewer' })
        .expect(403);
    });

    it('should DENY VIEWER from creating spatial nodes with 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectAId}/spatial-nodes`)
        .set('Authorization', `Bearer ${viewerAToken}`)
        .set('x-organization-id', orgAId)
        .send({
          name: 'Unauthorized Node',
          nodeType: SpatialNodeType.ROOM,
        })
        .expect(403);
    });

    it('should DENY VIEWER from creating work packages with 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectAId}/work-packages`)
        .set('Authorization', `Bearer ${viewerAToken}`)
        .set('x-organization-id', orgAId)
        .send({
          code: '99',
          name: 'Unauthorized Package',
        })
        .expect(403);
    });
  });

  describe('6. Multi-Tenant Cross-Organization Isolation', () => {
    it('should DENY Tenant B from viewing Tenant A project with 404', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectAId}`)
        .set('Authorization', `Bearer ${ownerBToken}`)
        .set('x-organization-id', orgBId)
        .expect(404);
    });

    it('should DENY Tenant B from listing Tenant A spatial nodes with 404', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectAId}/spatial-nodes`)
        .set('Authorization', `Bearer ${ownerBToken}`)
        .set('x-organization-id', orgBId)
        .expect(404);
    });

    it('should DENY Tenant B from modifying Tenant A work packages with 404', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectAId}/work-packages`)
        .set('Authorization', `Bearer ${ownerBToken}`)
        .set('x-organization-id', orgBId)
        .send({
          code: '10',
          name: 'Intruder Package',
        })
        .expect(404);
    });
  });

  describe('7. Audit Event Generation', () => {
    it('should have recorded audit events for project creation, settings change, spatial nodes, and WBS', async () => {
      const events = await prisma.authAuditEvent.findMany({
        where: {
          metadata: {
            path: ['projectId'],
            equals: projectAId,
          },
        },
      });

      const eventTypes = events.map((e) => e.eventType);
      expect(eventTypes).toContain('PROJECT_CREATED');
      expect(eventTypes).toContain('PROJECT_SETTINGS_UPDATED');
      expect(eventTypes).toContain('SPATIAL_NODE_CREATED');
      expect(eventTypes).toContain('WORK_PACKAGE_CREATED');
    });
  });
});
