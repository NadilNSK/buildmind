import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import * as crypto from 'crypto';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';
import { EmailService } from '../src/modules/email/email.service';
import {
  OrganizationRole,
  MembershipStatus,
  InvitationStatus,
} from '@buildmind/shared-types';

describe('Multi-Tenant Organizations & RBAC (E2E Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let emailService: EmailService;

  const testSuffix = Math.random().toString(36).substring(2, 8);

  // Test users
  const ownerAEmail = `owner-a-${testSuffix}@buildmind.test`;
  const adminAEmail = `admin-a-${testSuffix}@buildmind.test`;
  const qsAEmail = `qs-a-${testSuffix}@buildmind.test`;
  const viewerAEmail = `viewer-a-${testSuffix}@buildmind.test`;
  const ownerBEmail = `owner-b-${testSuffix}@buildmind.test`;
  const externalEmail = `external-${testSuffix}@buildmind.test`;

  const password = 'BuildMind#Secure2026!';

  let ownerAToken: string;
  let adminAToken: string;
  let qsAToken: string;
  let viewerAToken: string;
  let ownerBToken: string;

  let userAOwnerId: string;
  let userAAdminId: string;
  let userAQsId: string;
  let userAViewerId: string;
  let userBOwnerId: string;

  let orgAId: string;
  let orgBId: string;
  let projectAId: string;

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
    emailService = app.get<EmailService>(EmailService);

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

    const userOwnerA = await registerUser(ownerAEmail, 'Alice Owner');
    userAOwnerId = userOwnerA.id;
    ownerAToken = userOwnerA.token;

    const userAdminA = await registerUser(adminAEmail, 'Bob Admin');
    userAAdminId = userAdminA.id;
    adminAToken = userAdminA.token;

    const userQsA = await registerUser(qsAEmail, 'Charlie QS');
    userAQsId = userQsA.id;
    qsAToken = userQsA.token;

    const userViewerA = await registerUser(viewerAEmail, 'David Viewer');
    userAViewerId = userViewerA.id;
    viewerAToken = userViewerA.token;

    const userOwnerB = await registerUser(ownerBEmail, 'Eve TenantB');
    userBOwnerId = userOwnerB.id;
    ownerBToken = userOwnerB.token;

    // Create Organization A via Owner A
    const orgARes = await request(app.getHttpServer())
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .send({
        name: `Org Alpha ${testSuffix}`,
        slug: `org-alpha-${testSuffix}`,
        country: 'LK',
        defaultCurrency: 'LKR',
      });
    orgAId = orgARes.body.data.id;

    // Create Organization B via Owner B
    const orgBRes = await request(app.getHttpServer())
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${ownerBToken}`)
      .send({
        name: `Org Beta ${testSuffix}`,
        slug: `org-beta-${testSuffix}`,
        country: 'LK',
        defaultCurrency: 'LKR',
      });
    orgBId = orgBRes.body.data.id;

    // Add Admin A, QS A, and Viewer A to Organization A directly in DB with appropriate roles
    await prisma.membership.createMany({
      data: [
        {
          userId: userAAdminId,
          organizationId: orgAId,
          role: OrganizationRole.ORGANIZATION_ADMIN,
          status: MembershipStatus.ACTIVE,
        },
        {
          userId: userAQsId,
          organizationId: orgAId,
          role: OrganizationRole.QS_ENGINEER,
          status: MembershipStatus.ACTIVE,
        },
        {
          userId: userAViewerId,
          organizationId: orgAId,
          role: OrganizationRole.VIEWER,
          status: MembershipStatus.ACTIVE,
        },
      ],
    });

    // Create Project in Org A via Owner A
    const projRes = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .set('x-organization-id', orgAId)
      .send({
        code: `PRJ-A-${testSuffix.toUpperCase()}`,
        name: 'Colombo Financial Center Tower',
        measurementStandard: 'SLS_573',
        currency: 'LKR',
        status: 'ACTIVE',
      });
    projectAId = projRes.body.data.id;
  });

  afterAll(async () => {
    try {
      if (orgAId) {
        await prisma.organization.deleteMany({ where: { id: { in: [orgAId, orgBId] } } });
      }
      const testEmails = [
        ownerAEmail,
        adminAEmail,
        qsAEmail,
        viewerAEmail,
        ownerBEmail,
        externalEmail,
      ];
      await prisma.user.deleteMany({ where: { email: { in: testEmails } } });
    } catch (err) {
      console.warn('Cleanup notice:', err);
    }
    await app.close();
  });

  // ==========================================
  // 1. Tenant Context & Isolation
  // ==========================================

  it('Scenario 01: User without organization context cannot access organization-scoped projects', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${ownerAToken}`);
    expect(res.status).toBe(400); // Bad Request: Organization context required
  });

  it('Scenario 02: Tenant Isolation — Member of Org B cannot view Org A projects', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectAId}`)
      .set('Authorization', `Bearer ${ownerBToken}`)
      .set('x-organization-id', orgBId);
    expect([403, 404]).toContain(res.status);
  });

  it('Scenario 03: Tenant Isolation — Member of Org B cannot access Org A member list', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/organizations/${orgAId}/members`)
      .set('Authorization', `Bearer ${ownerBToken}`)
      .set('x-organization-id', orgBId);
    expect(res.status).toBe(403);
  });

  it('Scenario 04: Tenant Isolation — Member of Org B cannot update Org A settings', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/organizations/${orgAId}`)
      .set('Authorization', `Bearer ${ownerBToken}`)
      .set('x-organization-id', orgAId)
      .send({ name: 'Hacked Org Name' });
    expect(res.status).toBe(403);
  });

  // ==========================================
  // 2. Role-Based Permissions Enforcement
  // ==========================================

  it('Scenario 05: Role Enforcement — VIEWER cannot create projects', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${viewerAToken}`)
      .set('x-organization-id', orgAId)
      .send({
        code: `PRJ-FAIL-${testSuffix.toUpperCase()}`,
        name: 'Unauthorized Project',
      });
    expect(res.status).toBe(403);
  });

  it('Scenario 06: Role Enforcement — VIEWER cannot invite members', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/organizations/${orgAId}/invitations`)
      .set('Authorization', `Bearer ${viewerAToken}`)
      .set('x-organization-id', orgAId)
      .send({
        email: `new-qs-${testSuffix}@buildmind.test`,
        role: OrganizationRole.QS_ENGINEER,
      });
    expect(res.status).toBe(403);
  });

  it('Scenario 07: Role Enforcement — QS_ENGINEER cannot update organization settings', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/organizations/${orgAId}`)
      .set('Authorization', `Bearer ${qsAToken}`)
      .set('x-organization-id', orgAId)
      .send({ name: 'Tampered Name' });
    expect(res.status).toBe(403);
  });

  it('Scenario 08: Role Enforcement — QS_ENGINEER cannot delete organization', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/api/v1/organizations/${orgAId}`)
      .set('Authorization', `Bearer ${qsAToken}`)
      .set('x-organization-id', orgAId);
    expect(res.status).toBe(403);
  });

  it('Scenario 09: Role Enforcement — QS_ENGINEER can view organization projects', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${qsAToken}`)
      .set('x-organization-id', orgAId);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('Scenario 10: Role Enforcement — ORGANIZATION_ADMIN can manage members & update org', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/organizations/${orgAId}`)
      .set('Authorization', `Bearer ${adminAToken}`)
      .set('x-organization-id', orgAId)
      .send({ name: `Org Alpha Renamed ${testSuffix}` });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe(`Org Alpha Renamed ${testSuffix}`);
  });

  it('Scenario 11: Role Enforcement — ORGANIZATION_ADMIN cannot transfer ownership', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/organizations/${orgAId}/transfer-ownership`)
      .set('Authorization', `Bearer ${adminAToken}`)
      .set('x-organization-id', orgAId)
      .send({ newOwnerUserId: userAQsId });
    expect(res.status).toBe(403);
  });

  it('Scenario 12: Role Enforcement — ORGANIZATION_ADMIN cannot delete organization', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/api/v1/organizations/${orgAId}`)
      .set('Authorization', `Bearer ${adminAToken}`)
      .set('x-organization-id', orgAId);
    expect(res.status).toBe(403);
  });

  // ==========================================
  // 3. Invariants & Last-Owner Protection
  // ==========================================

  it('Scenario 13: Invariant Protection — Cannot demote the last active owner of an organization', async () => {
    const ownerMembership = await prisma.membership.findFirst({
      where: { organizationId: orgAId, role: OrganizationRole.ORGANIZATION_OWNER },
    });

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/organizations/${orgAId}/members/${ownerMembership!.id}/role`)
      .set('Authorization', `Bearer ${ownerAToken}`)
      .set('x-organization-id', orgAId)
      .send({ role: OrganizationRole.QS_ENGINEER });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Cannot change role of the last active owner');
  });

  it('Scenario 14: Invariant Protection — Cannot suspend the last active owner of an organization', async () => {
    const ownerMembership = await prisma.membership.findFirst({
      where: { organizationId: orgAId, role: OrganizationRole.ORGANIZATION_OWNER },
    });

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/organizations/${orgAId}/members/${ownerMembership!.id}/status`)
      .set('Authorization', `Bearer ${ownerAToken}`)
      .set('x-organization-id', orgAId)
      .send({ status: MembershipStatus.SUSPENDED });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Cannot suspend the last active owner');
  });

  it('Scenario 15: Invariant Protection — Cannot remove the last active owner of an organization', async () => {
    const ownerMembership = await prisma.membership.findFirst({
      where: { organizationId: orgAId, role: OrganizationRole.ORGANIZATION_OWNER },
    });

    const res = await request(app.getHttpServer())
      .delete(`/api/v1/organizations/${orgAId}/members/${ownerMembership!.id}`)
      .set('Authorization', `Bearer ${ownerAToken}`)
      .set('x-organization-id', orgAId);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Cannot remove the last active owner');
  });

  it('Scenario 16: Ownership Transfer — Atomically transfers ownership and demotes previous owner', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/organizations/${orgAId}/transfer-ownership`)
      .set('Authorization', `Bearer ${ownerAToken}`)
      .set('x-organization-id', orgAId)
      .send({ newOwnerUserId: userAAdminId });

    expect(res.status).toBe(200);

    const oldOwner = await prisma.membership.findUnique({
      where: { userId_organizationId: { userId: userAOwnerId, organizationId: orgAId } },
    });
    const newOwner = await prisma.membership.findUnique({
      where: { userId_organizationId: { userId: userAAdminId, organizationId: orgAId } },
    });

    expect(oldOwner!.role).toBe(OrganizationRole.ORGANIZATION_ADMIN);
    expect(newOwner!.role).toBe(OrganizationRole.ORGANIZATION_OWNER);

    // Transfer back so ownerA remains owner for remaining tests
    await prisma.membership.update({
      where: { userId_organizationId: { userId: userAOwnerId, organizationId: orgAId } },
      data: { role: OrganizationRole.ORGANIZATION_OWNER },
    });
    await prisma.membership.update({
      where: { userId_organizationId: { userId: userAAdminId, organizationId: orgAId } },
      data: { role: OrganizationRole.ORGANIZATION_ADMIN },
    });
  });

  // ==========================================
  // 4. Cryptographic Invitations & Security
  // ==========================================

  let inviteRawToken: string;
  let inviteId: string;

  it('Scenario 17: Invitations — Plaintext token is never stored in DB (only SHA-256 hash)', async () => {
    const inviteEmail = `invitee-${testSuffix}@buildmind.test`;
    const res = await request(app.getHttpServer())
      .post(`/api/v1/organizations/${orgAId}/invitations`)
      .set('Authorization', `Bearer ${ownerAToken}`)
      .set('x-organization-id', orgAId)
      .send({
        email: inviteEmail,
        role: OrganizationRole.QS_ENGINEER,
      });

    expect(res.status).toBe(201);
    inviteRawToken = res.body.data.token;
    inviteId = res.body.data.id;
    expect(inviteRawToken).toBeDefined();

    // Verify database record
    const dbInvitation = await prisma.organizationInvitation.findUnique({
      where: { id: inviteId },
    });
    expect(dbInvitation).toBeDefined();
    expect(dbInvitation!.tokenHash).not.toBe(inviteRawToken);

    // Check hash computation matches SHA-256
    const expectedHash = crypto.createHash('sha256').update(inviteRawToken).digest('hex');
    expect(dbInvitation!.tokenHash).toBe(expectedHash);
  });

  it('Scenario 18: Invitations — Expired invitation cannot be accepted', async () => {
    // Manually expire the invitation in DB
    await prisma.organizationInvitation.update({
      where: { id: inviteId },
      data: { expiresAt: new Date(Date.now() - 10000) },
    });

    // Register a user with that invitee email
    const inviteeEmail = `invitee-${testSuffix}@buildmind.test`;
    const regRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: inviteeEmail, fullName: 'Invited Surveyor', password });
    const inviteeToken = regRes.body.tokens.accessToken;

    const res = await request(app.getHttpServer())
      .post('/api/v1/organizations/invitations/accept')
      .set('Authorization', `Bearer ${inviteeToken}`)
      .send({ token: inviteRawToken });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('expired');
  });

  it('Scenario 19: Invitations — Revoked invitation cannot be accepted', async () => {
    // Issue fresh invitation
    const freshEmail = `revoked-${testSuffix}@buildmind.test`;
    const inviteRes = await request(app.getHttpServer())
      .post(`/api/v1/organizations/${orgAId}/invitations`)
      .set('Authorization', `Bearer ${ownerAToken}`)
      .set('x-organization-id', orgAId)
      .send({ email: freshEmail, role: OrganizationRole.QS_ENGINEER });
    const freshToken = inviteRes.body.data.token;
    const freshId = inviteRes.body.data.id;

    // Revoke it
    await request(app.getHttpServer())
      .delete(`/api/v1/organizations/${orgAId}/invitations/${freshId}`)
      .set('Authorization', `Bearer ${ownerAToken}`)
      .set('x-organization-id', orgAId);

    // Register user with freshEmail
    const regRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: freshEmail, fullName: 'Revoked User', password });
    const regToken = regRes.body.tokens.accessToken;

    const res = await request(app.getHttpServer())
      .post('/api/v1/organizations/invitations/accept')
      .set('Authorization', `Bearer ${regToken}`)
      .send({ token: freshToken });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('no longer valid');
  });

  it('Scenario 20: Invitations — User cannot accept an invitation sent to a different email', async () => {
    const targetEmail = `specific-${testSuffix}@buildmind.test`;
    const inviteRes = await request(app.getHttpServer())
      .post(`/api/v1/organizations/${orgAId}/invitations`)
      .set('Authorization', `Bearer ${ownerAToken}`)
      .set('x-organization-id', orgAId)
      .send({ email: targetEmail, role: OrganizationRole.SENIOR_QS });
    const token = inviteRes.body.data.token;

    // Attempt to accept using viewerA account
    const res = await request(app.getHttpServer())
      .post('/api/v1/organizations/invitations/accept')
      .set('Authorization', `Bearer ${viewerAToken}`)
      .send({ token });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('This invitation was sent to');
  });

  // ==========================================
  // 5. Project Member Access Grants
  // ==========================================

  it('Scenario 21: Project Member Grants — Assigning active org member to project succeeds', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectAId}/members`)
      .set('Authorization', `Bearer ${ownerAToken}`)
      .set('x-organization-id', orgAId)
      .send({ userId: userAQsId, role: 'QS_LEAD' });

    expect(res.status).toBe(201);
    expect(res.body.data.userId).toBe(userAQsId);
    expect(res.body.data.role).toBe('QS_LEAD');
  });

  it('Scenario 22: Project Member Grants — Assigning external user not in org fails', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectAId}/members`)
      .set('Authorization', `Bearer ${ownerAToken}`)
      .set('x-organization-id', orgAId)
      .send({ userId: userBOwnerId, role: 'MEMBER' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('active member of this organization');
  });

  it('Scenario 23: Project Member Grants — Removing member from project succeeds', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/api/v1/projects/${projectAId}/members/${userAQsId}`)
      .set('Authorization', `Bearer ${ownerAToken}`)
      .set('x-organization-id', orgAId);

    expect(res.status).toBe(200);
    expect(res.body.data.success).toBe(true);
  });
});
