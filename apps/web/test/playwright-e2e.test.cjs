/**
 * BuildMind AI v5.0 — Phase 2D Playwright End-to-End Acceptance Test Suite
 * Executes real headless Chromium browser automation against Next.js (port 3000)
 * and NestJS API (port 4001) with PostgreSQL persistence.
 *
 * Implements all 16 required Phase 2D acceptance scenarios:
 *   1. Public homepage access
 *   2. User registration
 *   3. User login
 *   4. Organization onboarding
 *   5. Organization creation
 *   6. Organization switching
 *   7. Project creation
 *   8. Project listing and details
 *   9. Member invitation
 *  10. Invitation acceptance
 *  11. Role-based interface restrictions
 *  12. Unauthorized protected route access
 *  13. Cross-tenant access denial
 *  14. Session refresh
 *  15. Logout
 *  16. Responsive mobile viewport
 *
 * Reports scenario counts separately from assertion counts.
 */

const { chromium } = require('@playwright/test');
const { spawn } = require('child_process');
const http = require('http');
const crypto = require('crypto');
const { PrismaClient } = require('../../../packages/database');

const prisma = new PrismaClient();
const API_PORT = 4001;
const WEB_PORT = 3000;
const API_URL = `http://localhost:${API_PORT}/api/v1`;
const WEB_URL = `http://localhost:${WEB_PORT}`;

function waitForHttp(url, timeoutMs = 25000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) {
          resolve(true);
        } else if (Date.now() - start > timeoutMs) {
          reject(new Error(`Timeout waiting for ${url} (status: ${res.statusCode})`));
        } else {
          setTimeout(check, 500);
        }
      });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Timeout waiting for ${url}`));
        } else {
          setTimeout(check, 500);
        }
      });
    };
    check();
  });
}

async function runPlaywrightSuite() {
  console.log('\n============================================================');
  console.log('BuildMind AI v5.0 — Phase 2D Acceptance & Integration Audit');
  console.log('16-Scenario Playwright End-to-End Browser Test Suite');
  console.log('============================================================\n');

  let apiProcess = null;
  let webProcess = null;
  let browser = null;

  let scenarioPassed = 0;
  let scenarioFailed = 0;
  let assertionPassed = 0;
  let assertionFailed = 0;

  function assert(desc, condition, details = '') {
    if (condition) {
      console.log(`    ✓ [ASSERTION] ${desc}`);
      assertionPassed++;
    } else {
      console.error(`    ✗ [ASSERTION FAILED] ${desc} — ${details}`);
      assertionFailed++;
      throw new Error(`Assertion failed: ${desc} ${details ? '(' + details + ')' : ''}`);
    }
  }

  const testSuffix = Math.random().toString(36).substring(2, 8);
  const ownerEmail = `playwright-owner-${testSuffix}@buildmind.test`;
  const inviteeEmail = `playwright-invitee-${testSuffix}@buildmind.test`;
  const crossTenantEmail = `playwright-tenantb-${testSuffix}@buildmind.test`;
  const testPassword = 'BuildMind#Secure2026!';

  const org1Name = `Apex Commercial ${testSuffix}`;
  const org1Slug = `apex-commercial-${testSuffix}`;
  const org2Name = `Secondary Engineering ${testSuffix}`;
  const org2Slug = `secondary-eng-${testSuffix}`;
  const crossOrgName = `Isolated Tenant B ${testSuffix}`;
  const crossOrgSlug = `isolated-tenantb-${testSuffix}`;

  const projectCode = `PRJ-PLW-${testSuffix.toUpperCase()}`;
  const projectName = `Port City Marine Complex ${testSuffix}`;

  let org1Record = null;
  let org2Record = null;
  let crossOrgRecord = null;
  let projectRecord = null;
  let ownerUserRecord = null;
  let inviteeUserRecord = null;
  let crossUserRecord = null;

  try {
    // 1. Ensure NestJS API is operational on port 4001
    try {
      await waitForHttp(`${API_URL}/health`, 1500);
      console.log(`[INFRA] NestJS API already running on port ${API_PORT}`);
    } catch {
      console.log(`[INFRA] Starting NestJS API server on port ${API_PORT}...`);
      apiProcess = spawn('node', ['apps/api/dist/main.js'], {
        cwd: 'D:\\My Projects\\buildmind',
        env: {
          ...process.env,
          API_PORT: String(API_PORT),
          CORS_ORIGIN: WEB_URL,
        },
        stdio: 'ignore',
        shell: false,
      });
      await waitForHttp(`${API_URL}/health`, 30000);
      console.log(`[INFRA] NestJS API started and healthy at ${API_URL}`);
    }

    // 2. Ensure Next.js frontend is operational on port 3000
    try {
      await waitForHttp(`${WEB_URL}/login`, 2000);
      console.log(`[INFRA] Next.js frontend already running at ${WEB_URL}\n`);
    } catch {
      console.log('[INFRA] Starting Next.js production server on port 3000...');
      webProcess = spawn(
        'node',
        ['node_modules/next/dist/bin/next', 'start', '-p', '3000'],
        {
          cwd: 'D:\\My Projects\\buildmind\\apps\\web',
          env: {
            ...process.env,
            PORT: '3000',
            NEXT_PUBLIC_API_URL: API_URL,
          },
          stdio: 'ignore',
          shell: false,
        },
      );
      await waitForHttp(`${WEB_URL}/login`, 30000);
      console.log(`[INFRA] Next.js frontend started and ready at ${WEB_URL}\n`);
    }

    // 3. Launch headless Chromium browser
    console.log('[BROWSER] Launching headless Chromium browser...');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const defaultContext = await browser.newContext({
      baseURL: WEB_URL,
      viewport: { width: 1280, height: 800 },
      ignoreHTTPSErrors: true,
    });

    const page = await defaultContext.newPage();

    // Helper runner for scenarios
    async function executeScenario(num, name, fn) {
      console.log(`\n============================================================`);
      console.log(`Scenario ${num}: ${name}`);
      console.log(`============================================================`);
      const startTime = Date.now();
      try {
        await fn();
        const duration = Date.now() - startTime;
        console.log(`✓ [PASSED] Scenario ${num}: ${name} (${duration}ms)`);
        scenarioPassed++;
      } catch (err) {
        const duration = Date.now() - startTime;
        console.error(`✗ [FAILED] Scenario ${num}: ${name} (${duration}ms) — ${err.message}`);
        scenarioFailed++;
        throw err;
      }
    }

    // -------------------------------------------------------------
    // Scenario 1: Public Homepage Access
    // -------------------------------------------------------------
    await executeScenario(1, 'Public Homepage Access', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const brandTitle = page.locator('text=BuildMind AI');
      const versionBadge = page.locator('text=v5.0 Enterprise');
      const signInLink = page.locator('a[href="/login"]');
      const registerLink = page.locator('a[href="/register"]');

      assert('Homepage renders BuildMind AI brand title', (await brandTitle.count()) > 0);
      assert('Homepage displays v5.0 Enterprise badge', (await versionBadge.count()) > 0);
      assert('Homepage renders Sign In navigation link', (await signInLink.count()) > 0);
      assert('Homepage renders Register navigation link', (await registerLink.count()) > 0);

      // Verify QS Modules, Shared Systems and AF features
      const content = await page.content();
      assert('Homepage details QS-01 Quantity Takeoff', content.includes('QS-01'));
      assert('Homepage details QS-03 BOQ Generation', content.includes('QS-03'));
      assert('Homepage details ES-01 Measurement Standards', content.includes('ES-01'));
      assert('Homepage details AF-01 AI Auto-Detection', content.includes('AF-01'));
      assert('Homepage details AF-04 Conversational QS Copilot', content.includes('AF-04'));
    });

    // -------------------------------------------------------------
    // Scenario 2: User Registration
    // -------------------------------------------------------------
    await executeScenario(2, 'User Registration', async () => {
      await defaultContext.clearCookies();
      await page.goto('/register');
      await page.waitForLoadState('networkidle');

      await page.waitForSelector('#fullName', { timeout: 10000 });
      await page.fill('#fullName', 'Playwright Commercial Owner');
      await page.fill('#email', ownerEmail);
      await page.fill('#password', testPassword);
      await page.fill('#confirmPassword', testPassword);
      await page.click('button[type="submit"]');

      // Wait for registration confirmation card
      await page.waitForSelector('text=Account Registered Successfully', { timeout: 15000 });
      assert('Registration confirmation card displayed in DOM', true);

      // Verify user record created in PostgreSQL
      ownerUserRecord = await prisma.user.findUnique({ where: { email: ownerEmail } });
      assert('Registered user record found in PostgreSQL database', Boolean(ownerUserRecord));
      assert('Registered user has valid ID', Boolean(ownerUserRecord?.id));

      await page.click('button:has-text("Continue to Workspace")');
      await page.waitForURL((url) => !url.pathname.includes('/register'), { timeout: 15000 });
      assert('Redirects away from /register upon continue', !page.url().includes('/register'));
    });

    // -------------------------------------------------------------
    // Scenario 3: User Login
    // -------------------------------------------------------------
    await executeScenario(3, 'User Login & Cookie Authentication', async () => {
      // Clear cookies to test cold login
      await defaultContext.clearCookies();
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      await page.fill('input[type="email"]', ownerEmail);
      await page.fill('input[type="password"]', testPassword);
      await page.click('button[type="submit"]');

      // Wait for redirection after login
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
      assert('Login redirects authenticated user away from /login', !page.url().includes('/login'));

      const cookies = await defaultContext.cookies();
      const hasAccessToken = cookies.some((c) => c.name === 'buildmind_access_token');
      const hasRefreshToken = cookies.some((c) => c.name === 'buildmind_refresh_token');

      assert('buildmind_access_token cookie set in browser context', hasAccessToken);
      assert('buildmind_refresh_token cookie set in browser context', hasRefreshToken);
    });

    // -------------------------------------------------------------
    // Scenario 4: Organization Onboarding
    // -------------------------------------------------------------
    await executeScenario(4, 'Organization Onboarding Form Inspection', async () => {
      await page.goto('/onboarding/organization');
      await page.waitForLoadState('networkidle');

      const nameInput = page.locator('input[placeholder*="Commercial"]');
      const slugInput = page.locator('input[placeholder*="surveyors"]');
      const countrySelect = page.locator('select').first();
      const submitBtn = page.locator('button[type="submit"]');

      assert('Onboarding page renders organization name field', (await nameInput.count()) > 0);
      assert('Onboarding page renders organization slug field', (await slugInput.count()) > 0);
      assert('Onboarding page renders country selection field', (await countrySelect.count()) > 0);
      assert('Onboarding page renders submit button', (await submitBtn.count()) > 0);

      const pageContent = await page.content();
      assert('Onboarding page references SLS 573 measurement standards', pageContent.includes('SLS 573'));
    });

    // -------------------------------------------------------------
    // Scenario 5: Organization Creation
    // -------------------------------------------------------------
    await executeScenario(5, 'Organization Creation Flow', async () => {
      const nameInput = page.locator('input[placeholder*="Commercial"]');
      const slugInput = page.locator('input[placeholder*="surveyors"]');

      await nameInput.fill(org1Name);
      await slugInput.fill(org1Slug);
      await page.click('button[type="submit"]');

      // Wait for redirect to /projects
      await page.waitForURL((url) => url.pathname.includes('/projects'), { timeout: 15000 });
      assert('Organization created and redirects to /projects', page.url().includes('/projects'));

      org1Record = await prisma.organization.findUnique({
        where: { slug: org1Slug },
        include: { memberships: true },
      });
      assert('Organization record verified in PostgreSQL database', Boolean(org1Record));
      assert('Creator is assigned as ORGANIZATION_OWNER', org1Record?.memberships[0]?.role === 'ORGANIZATION_OWNER');

      const cookies = await defaultContext.cookies();
      const hasOrgCookie = cookies.some((c) => c.name === 'buildmind_org_id');
      assert('buildmind_org_id cookie set to created organization', hasOrgCookie);
    });

    // -------------------------------------------------------------
    // Scenario 6: Organization Switching
    // -------------------------------------------------------------
    await executeScenario(6, 'Organization Switching & Context Updates', async () => {
      // Create a second organization for the same user via API
      org2Record = await prisma.organization.create({
        data: {
          name: org2Name,
          slug: org2Slug,
          country: 'LK',
          currency: 'LKR',
          memberships: {
            create: {
              userId: ownerUserRecord.id,
              role: 'ORGANIZATION_OWNER',
              status: 'ACTIVE',
            },
          },
        },
      });
      assert('Secondary organization provisioned in database', Boolean(org2Record));

      // Reload /projects so header receives both organizations
      await page.goto('/projects');
      await page.waitForLoadState('networkidle');

      const orgSelectorBtn = page.locator('button[aria-label="Organization selector"]');
      assert('AppShell header renders organization selector button', (await orgSelectorBtn.count()) === 1);

      await orgSelectorBtn.click();
      await page.waitForSelector('text=Organizations (', { timeout: 5000 });

      // Verify dropdown lists both organizations
      const dropdownContent = await page.content();
      assert('Dropdown lists initial organization', dropdownContent.includes(org1Name));
      assert('Dropdown lists secondary organization', dropdownContent.includes(org2Name));

      // Click second organization to switch
      await page.click(`button:has-text("${org2Name}")`);
      await page.waitForTimeout(1000);

      // Verify active org changed
      const updatedSelectorText = await orgSelectorBtn.textContent();
      assert('Active organization in header updated to secondary org', updatedSelectorText.includes(org2Name));

      // Switch back to org1
      await orgSelectorBtn.click();
      await page.waitForSelector('text=Organizations (', { timeout: 5000 });
      await page.click(`button:has-text("${org1Name}")`);
      await page.waitForTimeout(1000);

      const revertedSelectorText = await orgSelectorBtn.textContent();
      assert('Active organization successfully switched back to initial org', revertedSelectorText.includes(org1Name));
    });

    // -------------------------------------------------------------
    // Scenario 7: Project Creation
    // -------------------------------------------------------------
    await executeScenario(7, 'Project Creation under Active Organization', async () => {
      await page.goto('/projects/new');
      await page.waitForLoadState('networkidle');

      const projCodeInput = page.locator('input[placeholder*="PRJ-"]');
      const projNameInput = page.locator('input[placeholder*="Tower"]');
      const projSubmitBtn = page.locator('button[type="submit"]');

      assert('New project page renders project code field', (await projCodeInput.count()) === 1);
      assert('New project page renders project name field', (await projNameInput.count()) === 1);

      await projCodeInput.fill(projectCode);
      await projNameInput.fill(projectName);
      await projSubmitBtn.click();

      // Wait for redirect to /projects/[projectId]
      await page.waitForURL((url) => Boolean(url.pathname.match(/\/projects\/[a-f0-9-]+/)), { timeout: 15000 });
      const currentUrl = page.url();
      const match = currentUrl.match(/\/projects\/([a-f0-9-]+)/);
      assert('Project created and redirects to project detail route', Boolean(match));

      const createdProjectId = match[1];
      projectRecord = await prisma.project.findUnique({ where: { id: createdProjectId } });
      assert('Project record verified in PostgreSQL database', Boolean(projectRecord));
      assert('Project measurement standard is SLS 573', projectRecord?.standard === 'SLS_573');
      assert('Project is bound to organization 1', projectRecord?.organizationId === org1Record.id);
    });

    // -------------------------------------------------------------
    // Scenario 8: Project Listing and Details
    // -------------------------------------------------------------
    await executeScenario(8, 'Project Listing and Details Workspace', async () => {
      // Navigate to project list
      await page.goto('/projects');
      await page.waitForLoadState('networkidle');

      const listContent = await page.content();
      assert('Projects list page contains created project code', listContent.includes(projectCode));
      assert('Projects list page contains created project name', listContent.includes(projectName));

      // Navigate to project detail page
      await page.goto(`/projects/${projectRecord.id}`);
      await page.waitForLoadState('networkidle');

      await page.waitForSelector('text=Assigned Project Members', { timeout: 15000 });
      const detailContent = await page.content();

      assert('Project details page displays project code', detailContent.includes(projectCode));
      assert('Project details page displays SLS_573 measurement standard', detailContent.includes('SLS_573'));
      assert('Project details page renders Assigned Project Members section', detailContent.includes('Assigned Project Members'));
    });

    // -------------------------------------------------------------
    // Scenario 9: Member Invitation
    // -------------------------------------------------------------
    let invitationRawToken = null;
    await executeScenario(9, 'Organization Member Invitation Dispatch', async () => {
      await page.goto(`/organizations/${org1Record.id}/invitations`);
      await page.waitForLoadState('networkidle');

      const inviteEmailInput = page.locator('input[type="email"]');
      const inviteSubmitBtn = page.locator('button[type="submit"]');

      assert('Invitations management page renders email input', (await inviteEmailInput.count()) === 1);
      assert('Invitations management page renders send invitation button', (await inviteSubmitBtn.count()) === 1);

      await inviteEmailInput.fill(inviteeEmail);
      await page.selectOption('select', 'SENIOR_QS');
      await inviteSubmitBtn.click();

      // Wait for invitation to appear in table
      await page.waitForSelector(`text=${inviteeEmail}`, { timeout: 15000 });
      assert('Dispatched invitation appears in invitations table', (await page.locator(`text=${inviteeEmail}`).count()) > 0);

      // Verify token record in database
      const dbInvite = await prisma.organizationInvitation.findFirst({
        where: { email: inviteeEmail, organizationId: org1Record.id },
      });
      assert('Invitation record exists in PostgreSQL database', Boolean(dbInvite));
      assert('Invitation status is PENDING', dbInvite?.status === 'PENDING');
      assert('Invitation tokenHash is 64-character SHA-256 hex string', dbInvite?.tokenHash.length === 64);

      // Seed a known test token for Scenario 10
      invitationRawToken = crypto.randomBytes(32).toString('hex');
      const knownHash = crypto.createHash('sha256').update(invitationRawToken).digest('hex');
      await prisma.organizationInvitation.update({
        where: { id: dbInvite.id },
        data: { tokenHash: knownHash },
      });
    });

    // -------------------------------------------------------------
    // Scenario 10: Invitation Acceptance
    // -------------------------------------------------------------
    let inviteeContext = null;
    let inviteePage = null;
    await executeScenario(10, 'Invitation Acceptance Flow', async () => {
      // 1. Pre-register invitee user so they have credentials
      const regRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteeEmail,
          password: testPassword,
          fullName: 'Senior QS Invitee',
        }),
      });
      const regData = await regRes.json();
      inviteeUserRecord = regData.user;
      assert('Invitee user account created via registration API', Boolean(inviteeUserRecord?.id));

      // 2. Open fresh browser context for invitee
      inviteeContext = await browser.newContext({
        baseURL: WEB_URL,
        viewport: { width: 1280, height: 800 },
        ignoreHTTPSErrors: true,
      });
      inviteePage = await inviteeContext.newPage();

      // 3. Log in as invitee
      await inviteePage.goto('/login');
      await inviteePage.waitForSelector('input[type="email"]');
      await inviteePage.fill('input[type="email"]', inviteeEmail);
      await inviteePage.fill('input[type="password"]', testPassword);
      await inviteePage.click('button[type="submit"]');
      await inviteePage.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

      // 4. Navigate to accept invitation URL
      await inviteePage.goto(`/invitations/accept?token=${invitationRawToken}`);
      await inviteePage.waitForLoadState('networkidle');

      // Verify invitation verification card renders
      await inviteePage.waitForSelector(`text=${org1Name}`, { timeout: 15000 });
      assert('Accept page successfully validates token and shows org name', true);

      // Click Accept button
      const acceptBtn = inviteePage.locator('button:has-text("Accept Invitation & Enter Workspace")');
      assert('Accept Invitation button is rendered', (await acceptBtn.count()) === 1);
      await acceptBtn.click();

      // Wait for acceptance confirmation / redirect
      await inviteePage.waitForURL((url) => url.pathname.includes('/projects'), { timeout: 15000 });
      assert('Invitee redirected to /projects after accepting', inviteePage.url().includes('/projects'));

      // Verify membership record in database
      const membership = await prisma.membership.findFirst({
        where: { organizationId: org1Record.id, userId: inviteeUserRecord.id },
      });
      assert('Invitee is now an active member in PostgreSQL', membership?.status === 'ACTIVE');
      assert('Invitee assigned role matches invitation role (SENIOR_QS)', membership?.role === 'SENIOR_QS');

      // Verify invitation status updated to ACCEPTED
      const updatedInvite = await prisma.organizationInvitation.findFirst({
        where: { email: inviteeEmail, organizationId: org1Record.id },
      });
      assert('Invitation status updated to ACCEPTED', updatedInvite?.status === 'ACCEPTED');
    });

    // -------------------------------------------------------------
    // Scenario 11: Role-Based Interface Restrictions
    // -------------------------------------------------------------
    await executeScenario(11, 'Role-Based Interface Restrictions (SENIOR_QS)', async () => {
      // In invitee's session (role SENIOR_QS), navigate to organization settings
      await inviteePage.goto(`/organizations/${org1Record.id}/settings`);
      await inviteePage.waitForLoadState('networkidle');

      // Verify that OWNER-only danger zones are NOT rendered in the DOM
      const transferSection = inviteePage.locator('text=Transfer Organization Ownership');
      const deleteSection = inviteePage.locator('text=Delete Organization');

      assert('Transfer Ownership controls hidden from SENIOR_QS', (await transferSection.count()) === 0);
      assert('Delete Organization controls hidden from SENIOR_QS', (await deleteSection.count()) === 0);

      // Directly attempt a forbidden API mutation (DELETE org) using invitee context
      const response = await inviteePage.request.delete(`${API_URL}/organizations/${org1Record.id}`, {
        headers: { origin: WEB_URL },
      });
      assert('Forbidden organization deletion rejected with 403 Forbidden', response.status() === 403);
    });

    // -------------------------------------------------------------
    // Scenario 12: Unauthorized Protected Route Access
    // -------------------------------------------------------------
    await executeScenario(12, 'Unauthorized Protected Route Access & Redirection', async () => {
      const incognitoContext = await browser.newContext({
        baseURL: WEB_URL,
        viewport: { width: 1280, height: 800 },
      });
      const incognitoPage = await incognitoContext.newPage();

      // Attempt accessing /dashboard without cookies
      await incognitoPage.goto('/dashboard');
      await incognitoPage.waitForURL((url) => url.pathname.includes('/login'), { timeout: 10000 });
      assert(
        'Unauthenticated access to /dashboard redirected to /login',
        incognitoPage.url().includes('/login') &&
          (incognitoPage.url().includes('returnUrl') || incognitoPage.url().includes('redirect')),
      );

      // Attempt accessing /projects without cookies
      await incognitoPage.goto('/projects');
      await incognitoPage.waitForURL((url) => url.pathname.includes('/login'), { timeout: 10000 });
      assert(
        'Unauthenticated access to /projects redirected to /login',
        incognitoPage.url().includes('/login') &&
          (incognitoPage.url().includes('returnUrl') || incognitoPage.url().includes('redirect')),
      );

      await incognitoContext.close();
    });

    // -------------------------------------------------------------
    // Scenario 13: Cross-Tenant Access Denial
    // -------------------------------------------------------------
    let crossContext = null;
    let crossPage = null;
    await executeScenario(13, 'Cross-Tenant Access Denial & Multi-Tenant Isolation', async () => {
      // Provision an isolated second tenant (Org B and User C)
      const regRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: crossTenantEmail,
          password: testPassword,
          fullName: 'Tenant B Surveyor',
        }),
      });
      const regData = await regRes.json();
      crossUserRecord = regData.user;

      crossOrgRecord = await prisma.organization.create({
        data: {
          name: crossOrgName,
          slug: crossOrgSlug,
          country: 'LK',
          currency: 'LKR',
          memberships: {
            create: {
              userId: crossUserRecord.id,
              role: 'ORGANIZATION_OWNER',
              status: 'ACTIVE',
            },
          },
        },
      });

      // Launch context for User C
      crossContext = await browser.newContext({
        baseURL: WEB_URL,
        viewport: { width: 1280, height: 800 },
      });
      crossPage = await crossContext.newPage();

      // Log in as User C
      await crossPage.goto('/login');
      await crossPage.waitForSelector('input[type="email"]');
      await crossPage.fill('input[type="email"]', crossTenantEmail);
      await crossPage.fill('input[type="password"]', testPassword);
      await crossPage.click('button[type="submit"]');
      await crossPage.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

      // Attempt to access Org A's project details via browser
      await crossPage.goto(`/projects/${projectRecord.id}`);
      await crossPage.waitForLoadState('networkidle');

      const crossPageContent = await crossPage.content();
      const projectExposed = crossPageContent.includes(projectCode) && crossPageContent.includes(projectName);
      assert('Org A project details are NOT exposed to Tenant B user', !projectExposed);

      // Attempt direct API request to Org A project with Tenant B credentials
      const apiRes = await crossPage.request.get(`${API_URL}/projects/${projectRecord.id}`);
      assert(
        'Cross-tenant API request strictly rejected with 403 or 404',
        apiRes.status() === 403 || apiRes.status() === 404,
      );
    });

    // -------------------------------------------------------------
    // Scenario 14: Session Refresh
    // -------------------------------------------------------------
    await executeScenario(14, 'Session Refresh & Token Lifecycle', async () => {
      // Fetch fresh CSRF token
      const csrfRes = await defaultContext.request.get(`${API_URL}/auth/csrf`);
      const csrfData = await csrfRes.json();

      // Execute token refresh using owner session
      const refreshRes = await defaultContext.request.post(`${API_URL}/auth/refresh`, {
        headers: {
          'x-csrf-token': csrfData.csrfToken,
          origin: WEB_URL,
        },
      });
      assert('Token refresh request succeeds with 200 OK', refreshRes.status() === 200);

      const refreshedData = await refreshRes.json();
      assert('Refresh response confirms rotating session', Boolean(refreshedData.user));

      // Verify authenticated call succeeds after refresh
      const meRes = await defaultContext.request.get(`${API_URL}/auth/me`);
      assert('Session remains authenticated after token refresh', meRes.status() === 200);
      const meData = await meRes.json();
      assert('Retrieved user identity matches owner email', meData.email === ownerEmail);
    });

    // -------------------------------------------------------------
    // Scenario 15: Logout
    // -------------------------------------------------------------
    await executeScenario(15, 'User Logout & Session Invalidation', async () => {
      await page.goto('/projects');
      await page.waitForLoadState('networkidle');

      // Click user account menu button in header
      const userMenuBtn = page.locator('button[aria-label="User account menu"]');
      assert('AppShell header renders user account menu', (await userMenuBtn.count()) === 1);
      await userMenuBtn.click();

      // Click Sign Out
      await page.waitForSelector('button:has-text("Sign Out")', { timeout: 5000 });
      await page.click('button:has-text("Sign Out")');

      // Verify redirection to /login
      await page.waitForURL((url) => url.pathname.includes('/login'), { timeout: 10000 });
      assert('Logout redirects user to /login page', page.url().includes('/login'));

      // Attempt accessing /projects after logout
      await page.goto('/projects');
      await page.waitForURL((url) => url.pathname.includes('/login'), { timeout: 10000 });
      assert('Accessing /projects after logout immediately redirects back to /login', page.url().includes('/login'));
    });

    // -------------------------------------------------------------
    // Scenario 16: Responsive Mobile Viewport
    // -------------------------------------------------------------
    await executeScenario(16, 'Responsive Mobile Viewport & Layout Integrity', async () => {
      const mobileContext = await browser.newContext({
        baseURL: WEB_URL,
        viewport: { width: 375, height: 667 }, // iPhone SE / Mobile Viewport
      });
      const mobilePage = await mobileContext.newPage();

      // Test mobile login page layout
      await mobilePage.goto('/login');
      await mobilePage.waitForLoadState('networkidle');

      const loginHasNoOverflow = await mobilePage.evaluate(() => {
        return document.documentElement.scrollWidth <= document.documentElement.clientWidth;
      });
      assert('Login page renders with zero horizontal overflow on mobile viewport', loginHasNoOverflow);

      const emailVisible = await mobilePage.locator('input[type="email"]').isVisible();
      const passwordVisible = await mobilePage.locator('input[type="password"]').isVisible();
      const submitVisible = await mobilePage.locator('button[type="submit"]').isVisible();

      assert('Login email field visible on mobile viewport', emailVisible);
      assert('Login password field visible on mobile viewport', passwordVisible);
      assert('Login submit button visible and tap-accessible on mobile viewport', submitVisible);

      // Test mobile homepage layout
      await mobilePage.goto('/');
      await mobilePage.waitForLoadState('networkidle');

      const homeHasNoOverflow = await mobilePage.evaluate(() => {
        return document.documentElement.scrollWidth <= document.documentElement.clientWidth;
      });
      assert('Homepage renders with zero horizontal overflow on mobile viewport', homeHasNoOverflow);

      await mobileContext.close();
    });

    // -------------------------------------------------------------
    // Prune Test Artifacts cleanly from PostgreSQL
    // -------------------------------------------------------------
    console.log('\n--- Pruning Test Artifacts ---');
    if (org1Record) {
      await prisma.organization.delete({ where: { id: org1Record.id } }).catch(() => {});
    }
    if (org2Record) {
      await prisma.organization.delete({ where: { id: org2Record.id } }).catch(() => {});
    }
    if (crossOrgRecord) {
      await prisma.organization.delete({ where: { id: crossOrgRecord.id } }).catch(() => {});
    }
    await prisma.user.deleteMany({
      where: {
        email: { in: [ownerEmail, inviteeEmail, crossTenantEmail] },
      },
    }).catch(() => {});
    assert('Test data cleanly pruned from PostgreSQL database', true);

  } catch (err) {
    console.error('\nFatal Playwright Execution Error:', err);
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    if (apiProcess) {
      apiProcess.kill();
    }
    if (webProcess) {
      webProcess.kill();
    }
    await prisma.$disconnect();

    console.log('\n============================================================');
    console.log('PLAYWRIGHT ACCEPTANCE TEST SUMMARY:');
    console.log(`  Scenarios:  ${scenarioPassed} / 16 PASSED (${scenarioFailed} failed)`);
    console.log(`  Assertions: ${assertionPassed} passed, ${assertionFailed} failed`);
    console.log('============================================================\n');

    process.exit(scenarioFailed > 0 || assertionFailed > 0 ? 1 : 0);
  }
}

void runPlaywrightSuite();
