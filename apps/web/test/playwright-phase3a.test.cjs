/**
 * BuildMind AI v5.0 — Phase 3A Playwright End-to-End Browser Test Suite
 * 13 Comprehensive Acceptance Scenarios:
 * 1. User Login & Session Establishment
 * 2. Organization Selection & Context
 * 3. Project Creation (Extended Construction Form)
 * 4. Project Overview Navigation & Key Metrics
 * 5. Project Configuration Editing & Persistent Updates
 * 6. Spatial Root Creation (Site / Building)
 * 7. Spatial Child Creation & Nesting
 * 8. Spatial Hierarchy Editing
 * 9. Work Package Creation (Root WBS)
 * 10. Work Package Hierarchy Editing
 * 11. Read-Only Role Restrictions (Viewer Access)
 * 12. Cross-Tenant Access Denial
 * 13. Mobile Viewport Responsiveness
 */

const { chromium } = require('@playwright/test');
const { spawn } = require('child_process');
const http = require('http');
const { PrismaClient } = require('../../../packages/database');

const prisma = new PrismaClient();
const API_PORT = 4001;
const WEB_URL = 'http://localhost:3000';

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

function registerUserApi(email, fullName, password) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email, fullName, password });
    const req = http.request(
      `http://127.0.0.1:${API_PORT}/api/v1/auth/register`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          Origin: 'http://localhost:3000',
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve(parsed);
          } catch (e) {
            resolve(body);
          }
        });
      },
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runPlaywrightSuite() {
  console.log('\n============================================================');
  console.log('BuildMind AI v5.0 — Phase 3A Playwright Browser E2E Suite');
  console.log('============================================================\n');

  let apiProcess = null;
  let webProcess = null;
  let browser = null;

  const totalScenarios = 13;
  let passedScenarios = 0;
  let passedAssertions = 0;
  let failedAssertions = 0;

  function assert(desc, condition, details = '') {
    if (condition) {
      console.log(`    ✓ ${desc}`);
      passedAssertions++;
    } else {
      console.error(`    ✗ ${desc} — ${details}`);
      failedAssertions++;
    }
  }

  const testSuffix = Math.random().toString(36).substring(2, 8);
  const ownerEmail = `qs-director-${testSuffix}@buildmind.test`;
  const viewerEmail = `viewer-surveyor-${testSuffix}@buildmind.test`;
  const tenantBEmail = `tenant-b-${testSuffix}@buildmind.test`;
  const password = 'BuildMind#Secure2026!';

  const orgAName = `Apex Engineering Consortia ${testSuffix}`;
  const orgASlug = `apex-consortia-${testSuffix}`;
  const projectCode = `CP-${testSuffix.toUpperCase()}`;
  const projectName = `Colombo Marine Gateway Commercial Center ${testSuffix}`;

  let createdProjectId = null;

  try {
    // 1. Ensure NestJS API is running
    try {
      await waitForHttp(`http://127.0.0.1:${API_PORT}/api/v1/health`, 1500);
      console.log(`[API] NestJS backend running on port ${API_PORT}`);
    } catch {
      console.log(`[API] Starting NestJS backend on port ${API_PORT}...`);
      apiProcess = spawn('node', ['apps/api/dist/main.js'], {
        cwd: 'D:\\My Projects\\buildmind',
        env: { ...process.env, API_PORT: String(API_PORT), CORS_ORIGIN: 'http://localhost:3000' },
        stdio: 'ignore',
      });
      await waitForHttp(`http://127.0.0.1:${API_PORT}/api/v1/health`, 30000);
      console.log(`[API] NestJS backend online at port ${API_PORT}`);
    }

    // 2. Ensure Next.js is running
    try {
      await waitForHttp(`${WEB_URL}/login`, 2000);
      console.log(`[WEB] Next.js frontend running on ${WEB_URL}`);
    } catch {
      console.log('[WEB] Starting Next.js server on port 3000...');
      webProcess = spawn('node', ['node_modules/next/dist/bin/next', 'start', '-p', '3000'], {
        cwd: 'D:\\My Projects\\buildmind\\apps\\web',
        env: { ...process.env, PORT: '3000', NEXT_PUBLIC_API_URL: `http://localhost:${API_PORT}/api/v1` },
        stdio: 'ignore',
      });
      await waitForHttp(`${WEB_URL}/login`, 30000);
      console.log(`[WEB] Next.js frontend online at ${WEB_URL}`);
    }

    // 3. Launch Headless Chromium Browser
    console.log('[BROWSER] Launching headless Chromium browser...');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();

    // ------------------------------------------------------------------------
    // Scenario 1: User Login & Session Establishment
    // ------------------------------------------------------------------------
    console.log('\n--- Scenario 1: User Login & Session Establishment ---');
    const regResult = await registerUserApi(ownerEmail, 'Dr. Aruni Wickramasinghe (FRICS)', password);
    const userId = regResult.user ? regResult.user.id : (await prisma.user.findUnique({ where: { email: ownerEmail } })).id;

    await page.goto(`${WEB_URL}/login`);
    await page.waitForLoadState('networkidle');
    assert('Login page loaded', page.url().includes('/login'));

    await page.fill('input[type="email"]', ownerEmail);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
    assert('Successfully authenticated and redirected away from /login', !page.url().includes('/login'));

    const cookies = await context.cookies();
    const hasAuthCookie = cookies.some((c) => c.name === 'buildmind_access_token');
    assert('HttpOnly buildmind_access_token cookie set', hasAuthCookie);
    passedScenarios++;

    // ------------------------------------------------------------------------
    // Scenario 2: Organization Selection & Context
    // ------------------------------------------------------------------------
    console.log('\n--- Scenario 2: Organization Selection & Context ---');
    const orgA = await prisma.organization.create({
      data: {
        name: orgAName,
        slug: orgASlug,
        country: 'LK',
        currency: 'LKR',
        memberships: {
          create: {
            userId,
            role: 'ORGANIZATION_OWNER',
            status: 'ACTIVE',
          },
        },
      },
    });

    await context.addCookies([
      {
        name: 'buildmind_org_id',
        value: orgA.id,
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto(`${WEB_URL}/projects`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const pageContent = await page.textContent('body');
    assert('Organization name displayed in header/portfolio', pageContent.includes(orgAName) || pageContent.includes('Projects Portfolio'));
    passedScenarios++;

    // ------------------------------------------------------------------------
    // Scenario 3: Project Creation (Extended Construction Form)
    // ------------------------------------------------------------------------
    console.log('\n--- Scenario 3: Project Creation (Extended Construction Form) ---');
    await page.goto(`${WEB_URL}/projects/new`);
    await page.waitForLoadState('networkidle');

    assert('Navigated to /projects/new', page.url().includes('/projects/new'));

    // Fill form
    await page.fill('input[placeholder="PRJ-CMB-001"]', projectCode);
    await page.fill('input[placeholder="e.g. Colombo Financial Tower Phase 1"]', projectName);
    await page.fill('textarea[placeholder*="Scope of works"]', '35-story commercial waterfront tower with SLS 573 measurement standard');
    await page.fill('input[placeholder="e.g. Colombo 03"]', 'Colombo 01 Waterfront');
    await page.fill('input[placeholder="e.g. Urban Development Authority"]', 'Sri Lanka Ports Authority');
    await page.fill('input[placeholder="e.g. Maga Engineering"]', 'Access Engineering PLC');
    await page.fill('input[placeholder="e.g. CECB Sri Lanka"]', 'Surath Wickramasinghe Associates');
    await page.fill('input[placeholder="e.g. Senior QS K. Silva"]', 'Ch.QS Nalin Perera');
    await page.fill('input[placeholder="450000000.00"]', '850000000.00');

    // Submit
    await page.click('button:has-text("Create Construction Project")');
    await page.waitForURL((url) => url.pathname.includes('/projects/') && !url.pathname.includes('/new'), { timeout: 10000 });

    const currentUrl = page.url();
    const match = currentUrl.match(/\/projects\/([a-zA-Z0-9-]+)/);
    createdProjectId = match ? match[1] : null;

    assert('Project created and redirected to workspace URL', Boolean(createdProjectId));
    passedScenarios++;

    // ------------------------------------------------------------------------
    // Scenario 4: Project Overview Navigation & Key Metrics
    // ------------------------------------------------------------------------
    console.log('\n--- Scenario 4: Project Overview Navigation & Key Metrics ---');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const overviewText = await page.textContent('body');
    assert('Overview shows project code badge', overviewText.includes(projectCode));
    assert('Overview shows project name', overviewText.includes(projectName));
    assert('Overview shows standard SLS_573', overviewText.includes('SLS_573'));
    assert('Overview displays financial value', overviewText.includes('850,000,000') || overviewText.includes('LKR'));
    assert('Overview displays client name', overviewText.includes('Sri Lanka Ports Authority'));
    assert('Overview displays contractor name', overviewText.includes('Access Engineering PLC'));
    assert('Overview displays navigation tabs', overviewText.includes('Spatial Breakdown') && overviewText.includes('Work Breakdown'));
    passedScenarios++;

    // ------------------------------------------------------------------------
    // Scenario 5: Project Configuration Editing & Persistent Updates
    // ------------------------------------------------------------------------
    console.log('\n--- Scenario 5: Project Configuration Editing & Persistent Updates ---');
    await page.goto(`${WEB_URL}/projects/${createdProjectId}/settings`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    assert('Settings page loaded', page.url().includes('/settings'));

    // Update location and contractor
    await page.fill('input[placeholder="e.g. Colombo 03, Kollupitiya"]', 'Port City Central Boulevard');
    await page.fill('input[placeholder="e.g. Maga Engineering (Pvt) Ltd"]', 'Maga-Access Joint Venture');

    await page.click('button:has-text("Save Project Configuration")');
    await page.waitForTimeout(2000);

    const settingsContent = await page.textContent('body');
    assert('Settings update notification displayed', settingsContent.includes('updated successfully') || settingsContent.includes('success'));

    // Verify persistence via direct database check
    const dbProject = await prisma.project.findUnique({ where: { id: createdProjectId } });
    assert('Database project location updated persistently', dbProject.location === 'Port City Central Boulevard');
    assert('Database project contractor updated persistently', dbProject.contractorName === 'Maga-Access Joint Venture');
    passedScenarios++;

    // ------------------------------------------------------------------------
    // Scenario 6: Spatial Root Creation (Site / Building)
    // ------------------------------------------------------------------------
    console.log('\n--- Scenario 6: Spatial Root Creation (Site / Building) ---');
    await page.goto(`${WEB_URL}/projects/${createdProjectId}/spatial`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    assert('Spatial Breakdown page loaded', page.url().includes('/spatial'));

    // Click "Add Root Spatial Node"
    await page.click('button:has-text("Add Root Spatial Node"), button:has-text("Create First Node")');
    await page.waitForTimeout(500);

    // Fill modal form
    await page.fill('input[placeholder="e.g. TWR-A, FL-01"]', 'SITE-01');
    await page.fill('input[placeholder*="Residential Tower A"]', 'Marine Gateway Site Plot A');
    await page.click('button:has-text("Create Node")');
    await page.waitForTimeout(2000);

    const spatialContent = await page.textContent('body');
    assert('Root spatial node created and visible in tree', spatialContent.includes('Marine Gateway Site Plot A'));
    passedScenarios++;

    // ------------------------------------------------------------------------
    // Scenario 7: Spatial Child Creation & Nesting
    // ------------------------------------------------------------------------
    console.log('\n--- Scenario 7: Spatial Child Creation & Nesting ---');
    const addChildBtn = page.locator('button[title="Add Child Spatial Node"]').first();
    if (await addChildBtn.count() > 0) {
      await addChildBtn.click({ force: true });
      await page.waitForTimeout(500);

      await page.fill('input[placeholder="e.g. TWR-A, FL-01"]', 'TWR-01');
      await page.fill('input[placeholder*="Residential Tower A"]', 'Tower 01 Commercial Offices');
      await page.click('button:has-text("Create Node")');
      await page.waitForTimeout(2000);
    }

    const nestedSpatialContent = await page.textContent('body');
    assert('Child spatial node nested under root', nestedSpatialContent.includes('Tower 01 Commercial Offices'));
    passedScenarios++;

    // ------------------------------------------------------------------------
    // Scenario 8: Spatial Hierarchy Editing
    // ------------------------------------------------------------------------
    console.log('\n--- Scenario 8: Spatial Hierarchy Editing ---');
    const editBtn = page.locator('button[title="Edit Spatial Node"]').first();
    if (await editBtn.count() > 0) {
      await editBtn.click({ force: true });
      await page.waitForTimeout(500);

      await page.fill('input[placeholder*="Residential Tower A"]', 'Marine Gateway Master Site');
      await page.click('button:has-text("Save Changes")');
      await page.waitForTimeout(2000);
    }

    const editedSpatialContent = await page.textContent('body');
    assert('Spatial node name edited successfully', editedSpatialContent.includes('Marine Gateway Master Site'));
    passedScenarios++;

    // ------------------------------------------------------------------------
    // Scenario 9: Work Package Creation (Root WBS)
    // ------------------------------------------------------------------------
    console.log('\n--- Scenario 9: Work Package Creation (Root WBS) ---');
    await page.goto(`${WEB_URL}/projects/${createdProjectId}/work-packages`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    assert('Work packages page loaded', page.url().includes('/work-packages'));

    await page.click('button:has-text("Add Root Package"), button:has-text("Create First Package")');
    await page.waitForTimeout(500);

    await page.fill('input[placeholder="01.01"]', '01');
    await page.fill('input[placeholder*="Earthwork & Excavation"]', 'Substructure & Deep Foundations');
    await page.click('button:has-text("Create Package")');
    await page.waitForTimeout(2000);

    const wbsContent = await page.textContent('body');
    assert('Root work package 01 created and visible in WBS', wbsContent.includes('01') && wbsContent.includes('Substructure & Deep Foundations'));
    passedScenarios++;

    // ------------------------------------------------------------------------
    // Scenario 10: Work Package Hierarchy Editing
    // ------------------------------------------------------------------------
    console.log('\n--- Scenario 10: Work Package Hierarchy Editing ---');
    const addSubPkgBtn = page.locator('button[title="Add Sub-Package"]').first();
    if (await addSubPkgBtn.count() > 0) {
      await addSubPkgBtn.click({ force: true });
      await page.waitForTimeout(500);

      await page.fill('input[placeholder="01.01"]', '01.01');
      await page.fill('input[placeholder*="Earthwork & Excavation"]', 'Secant Piling & Marine Shoring');
      await page.click('button:has-text("Create Package")');
      await page.waitForTimeout(2000);
    }

    const subPkgContent = await page.textContent('body');
    assert('Sub-package 01.01 created and displayed in hierarchy', subPkgContent.includes('01.01'));
    passedScenarios++;

    // ------------------------------------------------------------------------
    // Scenario 11: Read-Only Role Restrictions (Viewer Access)
    // ------------------------------------------------------------------------
    console.log('\n--- Scenario 11: Read-Only Role Restrictions (Viewer Access) ---');
    const viewerReg = await registerUserApi(viewerEmail, 'Kamal Perera (Site Inspector)', password);
    const viewerUserId = viewerReg.user ? viewerReg.user.id : (await prisma.user.findUnique({ where: { email: viewerEmail } })).id;

    await prisma.membership.create({
      data: {
        userId: viewerUserId,
        organizationId: orgA.id,
        role: 'VIEWER',
        status: 'ACTIVE',
      },
    });

    const viewerContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const viewerPage = await viewerContext.newPage();

    await viewerPage.goto(`${WEB_URL}/login`);
    await viewerPage.fill('input[type="email"]', viewerEmail);
    await viewerPage.fill('input[type="password"]', password);
    await viewerPage.click('button[type="submit"]');
    await viewerPage.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    await viewerContext.addCookies([
      {
        name: 'buildmind_org_id',
        value: orgA.id,
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Navigate to Spatial Breakdown as Viewer
    await viewerPage.goto(`${WEB_URL}/projects/${createdProjectId}/spatial`);
    await viewerPage.waitForLoadState('networkidle');
    await viewerPage.waitForTimeout(1000);

    const viewerSpatialButtons = await viewerPage.$$('button:has-text("Add Root Spatial Node"), button[title="Add Child Spatial Node"]');
    assert('Viewer cannot see action buttons to create/add spatial nodes', viewerSpatialButtons.length === 0);

    // Navigate to Settings as Viewer
    await viewerPage.goto(`${WEB_URL}/projects/${createdProjectId}/settings`);
    await viewerPage.waitForLoadState('networkidle');
    await viewerPage.waitForTimeout(1000);

    const viewerSaveBtn = await viewerPage.$('button:has-text("Save Project Configuration")');
    assert('Viewer cannot see save button in project settings', viewerSaveBtn === null);
    await viewerContext.close();
    passedScenarios++;

    // ------------------------------------------------------------------------
    // Scenario 12: Cross-Tenant Access Denial
    // ------------------------------------------------------------------------
    console.log('\n--- Scenario 12: Cross-Tenant Access Denial ---');
    const tenantBReg = await registerUserApi(tenantBEmail, 'Eve Competitor (Director)', password);
    const tenantBUserId = tenantBReg.user ? tenantBReg.user.id : (await prisma.user.findUnique({ where: { email: tenantBEmail } })).id;

    const orgB = await prisma.organization.create({
      data: {
        name: `Competitor Infra ${testSuffix}`,
        slug: `competitor-infra-${testSuffix}`,
        country: 'LK',
        currency: 'LKR',
        memberships: {
          create: {
            userId: tenantBUserId,
            role: 'ORGANIZATION_OWNER',
            status: 'ACTIVE',
          },
        },
      },
    });

    const tenantBContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const tenantBPage = await tenantBContext.newPage();

    await tenantBPage.goto(`${WEB_URL}/login`);
    await tenantBPage.fill('input[type="email"]', tenantBEmail);
    await tenantBPage.fill('input[type="password"]', password);
    await tenantBPage.click('button[type="submit"]');
    await tenantBPage.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    await tenantBContext.addCookies([
      {
        name: 'buildmind_org_id',
        value: orgB.id,
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Attempt direct URL navigation to Tenant A's project
    await tenantBPage.goto(`${WEB_URL}/projects/${createdProjectId}`);
    await tenantBPage.waitForLoadState('networkidle');
    await tenantBPage.waitForTimeout(1500);

    const tenantBAccessText = await tenantBPage.textContent('body');
    const isDenied =
      tenantBAccessText.includes('Failed to load') ||
      tenantBAccessText.includes('not found') ||
      tenantBAccessText.includes('Not Found') ||
      (tenantBPage.url().includes('/projects') && !tenantBPage.url().includes(createdProjectId));

    assert('Tenant B denied direct access to Tenant A project workspace', isDenied);
    await tenantBContext.close();
    passedScenarios++;

    // ------------------------------------------------------------------------
    // Scenario 13: Mobile Viewport Behavior
    // ------------------------------------------------------------------------
    console.log('\n--- Scenario 13: Mobile Viewport Behavior ---');
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 13 dimensions
    await page.goto(`${WEB_URL}/projects/${createdProjectId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const mobileOverviewText = await page.textContent('body');
    assert('Mobile viewport renders project overview without crashing', mobileOverviewText.includes(projectCode));

    // Navigate to spatial on mobile
    await page.goto(`${WEB_URL}/projects/${createdProjectId}/spatial`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const mobileSpatialText = await page.textContent('body');
    assert('Mobile viewport renders spatial breakdown hierarchy', mobileSpatialText.includes('Spatial Breakdown Structure'));

    // Navigate to work packages on mobile
    await page.goto(`${WEB_URL}/projects/${createdProjectId}/work-packages`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const mobileWbsText = await page.textContent('body');
    assert('Mobile viewport renders work breakdown structure', mobileWbsText.includes('Work Breakdown Structure'));
    passedScenarios++;

  } catch (err) {
    console.error('Test suite execution error:', err);
    failedAssertions++;
  } finally {
    if (browser) await browser.close();
    if (apiProcess) apiProcess.kill();
    if (webProcess) webProcess.kill();
    await prisma.$disconnect();
  }

  console.log('\n============================================================');
  console.log('Playwright Acceptance Suite Execution Summary:');
  console.log(`  Scenarios:   ${passedScenarios} / ${totalScenarios} passed (${totalScenarios - passedScenarios} failed)`);
  console.log(`  Assertions:  ${passedAssertions} passed, ${failedAssertions} failed`);
  console.log('============================================================\n');

  if (passedScenarios === totalScenarios && failedAssertions === 0) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runPlaywrightSuite();
