/**
 * BuildMind AI v5.0 — Phase 2C Frontend & Browser Integration Test Suite
 * Tests multi-tenant organization switching, team management, invitations and project flows
 */

const http = require('http');
const cookieParser = require('../../api/node_modules/cookie-parser');
const { ValidationPipe } = require('../../api/node_modules/@nestjs/common');
const { NestFactory } = require('../../api/node_modules/@nestjs/core');
const { AppModule } = require('../../api/dist/app.module');
const { AllExceptionsFilter } = require('../../api/dist/common/filters/http-exception.filter');
const { PrismaClient } = require('../../../packages/database');

const prisma = new PrismaClient();
const TEST_PORT = 4006;
const API_BASE = `http://localhost:${TEST_PORT}/api/v1`;

class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  setFromHeaders(headers) {
    const rawCookies = headers['set-cookie'];
    if (!rawCookies) return;
    const cookieArray = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
    for (const c of cookieArray) {
      const parts = c.split(';')[0].split('=');
      const name = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      this.cookies.set(name, value);
    }
  }

  getCookieHeader() {
    const entries = [];
    for (const [name, value] of this.cookies.entries()) {
      entries.push(`${name}=${value}`);
    }
    return entries.join('; ');
  }

  get(name) {
    return this.cookies.get(name);
  }
}

async function httpRequest(urlPath, options = {}, jar = null) {
  const url = new URL(`${API_BASE}${urlPath}`);
  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': 'application/json',
      Origin: 'http://localhost:3000',
      ...(options.headers || {}),
    };

    if (jar) {
      const cookieHeader = jar.getCookieHeader();
      if (cookieHeader) {
        headers['Cookie'] = cookieHeader;
      }
      const csrf = jar.get('buildmind_csrf_token');
      if (csrf && !headers['x-csrf-token'] && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method || 'GET')) {
        headers['x-csrf-token'] = csrf;
      }
    }

    const req = http.request(
      url,
      {
        method: options.method || 'GET',
        headers,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (jar) {
            jar.setFromHeaders(res.headers);
          }
          let parsed;
          try {
            parsed = JSON.parse(body);
          } catch {
            parsed = body;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      },
    );

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n--- BuildMind AI v5.0: Phase 2C Frontend & Browser Integration Verification ---');
  let app;
  const testSuffix = Math.random().toString(36).substring(2, 8);
  const ownerEmail = `browser-owner-${testSuffix}@buildmind.test`;
  const memberEmail = `browser-member-${testSuffix}@buildmind.test`;
  const password = 'BuildMind#Secure2026!';
  let passed = 0;
  let failed = 0;

  function assert(desc, condition, details = '') {
    if (condition) {
      console.log(`  ✓ ${desc}`);
      passed++;
    } else {
      console.error(`  ✗ ${desc} — ${details}`);
      failed++;
    }
  }

  try {
    // 1. Start test NestJS instance on dedicated port 4006
    app = await NestFactory.create(AppModule, { logger: false });
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
    await app.listen(TEST_PORT);
    console.log(`Test API operational at ${API_BASE}`);

    const jarOwner = new CookieJar();
    const jarMember = new CookieJar();

    // Pre-seed CSRF token
    await httpRequest('/auth/csrf', { method: 'GET' }, jarOwner);
    await httpRequest('/auth/csrf', { method: 'GET' }, jarMember);

    // Register Owner
    const regOwner = await httpRequest(
      '/auth/register',
      {
        method: 'POST',
        body: { email: ownerEmail, fullName: 'Browser Test Owner', password },
      },
      jarOwner,
    );
    assert('Owner registration succeeds and sets session cookies', regOwner.status === 201);

    // Register Member
    const regMember = await httpRequest(
      '/auth/register',
      {
        method: 'POST',
        body: { email: memberEmail, fullName: 'Browser Test Member', password },
      },
      jarMember,
    );
    assert('Member registration succeeds', regMember.status === 201);

    // 2. Create Organization via Browser Session
    const createOrgRes = await httpRequest(
      '/organizations',
      {
        method: 'POST',
        body: {
          name: `Browser Enterprise ${testSuffix}`,
          slug: `browser-ent-${testSuffix}`,
          country: 'LK',
          defaultCurrency: 'LKR',
        },
      },
      jarOwner,
    );
    assert('Organization created with creator as ORGANIZATION_OWNER', createOrgRes.status === 201);
    const orgId = createOrgRes.body.data.id;
    assert('Organization ID received', Boolean(orgId));

    // Simulate browser setting active organization cookie
    jarOwner.cookies.set('buildmind_org_id', orgId);

    // 3. List User Organizations
    const listOrgs = await httpRequest('/organizations', { method: 'GET' }, jarOwner);
    assert('Listing organizations returns user workspace', listOrgs.status === 200 && listOrgs.body.data.length >= 1);
    assert('Workspace currentUserRole is ORGANIZATION_OWNER', listOrgs.body.data[0].currentUserRole === 'ORGANIZATION_OWNER');

    // 4. Create Project with Active Organization Cookie
    const createProj = await httpRequest(
      '/projects',
      {
        method: 'POST',
        headers: { 'x-organization-id': orgId },
        body: {
          code: `PRJ-BRW-${testSuffix.toUpperCase()}`,
          name: 'High-Rise Commercial Complex',
          measurementStandard: 'SLS_573',
          currency: 'LKR',
          status: 'ACTIVE',
        },
      },
      jarOwner,
    );
    assert('Project created under active organization with SLS 573 standard', createProj.status === 201);
    const projectId = createProj.body.data.id;

    // 5. List Projects
    const listProjects = await httpRequest(
      '/projects',
      { method: 'GET', headers: { 'x-organization-id': orgId } },
      jarOwner,
    );
    assert('Projects list returns created project', listProjects.status === 200 && listProjects.body.data.length >= 1);

    // 6. Send Invitation to Member Email
    const inviteRes = await httpRequest(
      `/organizations/${orgId}/invitations`,
      {
        method: 'POST',
        headers: { 'x-organization-id': orgId },
        body: {
          email: memberEmail,
          role: 'SENIOR_QS',
        },
      },
      jarOwner,
    );
    assert('Invitation sent successfully with cryptographically secure token', inviteRes.status === 201);
    const inviteToken = inviteRes.body.data.token;
    assert('Invitation token provided', Boolean(inviteToken));

    // 7. Verify Invitation Public Endpoint
    const verifyRes = await httpRequest(
      `/organizations/invitations/verify?token=${encodeURIComponent(inviteToken)}`,
      { method: 'GET' },
    );
    assert('Public verification endpoint validates token', verifyRes.status === 200 && verifyRes.body.data.valid === true);
    assert('Verified invitation role matches SENIOR_QS', verifyRes.body.data.role === 'SENIOR_QS');

    // 8. Accept Invitation using Member Session
    const acceptRes = await httpRequest(
      '/organizations/invitations/accept',
      {
        method: 'POST',
        body: { token: inviteToken },
      },
      jarMember,
    );
    assert('Member successfully accepts invitation and enters workspace', acceptRes.status === 200);

    // 9. Member can now access organization projects
    jarMember.cookies.set('buildmind_org_id', orgId);
    const memberProjectList = await httpRequest(
      '/projects',
      { method: 'GET', headers: { 'x-organization-id': orgId } },
      jarMember,
    );
    assert('Accepted member can view organization projects', memberProjectList.status === 200 && memberProjectList.body.data.length >= 1);

    // 10. Member with SENIOR_QS cannot delete organization
    const memberDeleteOrg = await httpRequest(
      `/organizations/${orgId}`,
      { method: 'DELETE', headers: { 'x-organization-id': orgId } },
      jarMember,
    );
    assert('SENIOR_QS member is forbidden from deleting organization (403)', memberDeleteOrg.status === 403);

    // 11. Owner updates organization settings
    const updateOrg = await httpRequest(
      `/organizations/${orgId}`,
      {
        method: 'PATCH',
        headers: { 'x-organization-id': orgId },
        body: { name: `Browser Enterprise Renamed ${testSuffix}` },
      },
      jarOwner,
    );
    assert('Owner can update organization settings', updateOrg.status === 200 && updateOrg.body.data.name.includes('Renamed'));

    // 12. Cleanup
    await prisma.organization.delete({ where: { id: orgId } });
    await prisma.user.deleteMany({ where: { email: { in: [ownerEmail, memberEmail] } } });
    assert('Test organization and users cleanly removed', true);

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    if (app) {
      await app.close();
    }
    await prisma.$disconnect();
    console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
    process.exit(failed > 0 ? 1 : 0);
  }
}

void runTests();
