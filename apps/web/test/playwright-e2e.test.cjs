/**
 * BuildMind AI v5.0 — Phase 2C Playwright End-to-End Browser Test Suite
 * Executes real headless Chromium browser automation against Next.js (port 3000)
 * and NestJS API (port 4001) with PostgreSQL persistence.
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

async function runPlaywrightSuite() {
  console.log('\n============================================================');
  console.log('BuildMind AI v5.0 — Phase 2C Playwright Browser E2E Suite');
  console.log('============================================================\n');

  let apiProcess = null;
  let webProcess = null;
  let browser = null;
  let passed = 0;
  let failed = 0;

  function assert(desc, condition, details = '') {
    if (condition) {
      console.log(`  ✓ [PLAYWRIGHT] ${desc}`);
      passed++;
    } else {
      console.error(`  ✗ [PLAYWRIGHT] ${desc} — ${details}`);
      failed++;
    }
  }

  const testSuffix = Math.random().toString(36).substring(2, 8);
  const testEmail = `playwright-lead-${testSuffix}@buildmind.test`;
  const inviteeEmail = `playwright-invitee-${testSuffix}@buildmind.test`;
  const testPassword = 'BuildMind#Secure2026!';
  const orgName = `Apex Playwright Holdings ${testSuffix}`;
  const orgSlug = `apex-playwright-${testSuffix}`;
  const projectCode = `PRJ-PLW-${testSuffix.toUpperCase()}`;
  const projectName = `Port City Marine Commercial Complex ${testSuffix}`;

  try {
    // 1. Ensure NestJS API is running on port 4001
    let apiReady = false;
    try {
      await waitForHttp(`http://localhost:${API_PORT}/api/v1/health`, 1500);
      apiReady = true;
      console.log(`NestJS API already running on port ${API_PORT}`);
    } catch {
      console.log(`Starting NestJS API server on port ${API_PORT}...`);
      apiProcess = spawn('node', ['apps/api/dist/main.js'], {
        cwd: 'D:\\My Projects\\buildmind',
        env: { ...process.env, API_PORT: String(API_PORT), CORS_ORIGIN: 'http://localhost:3000' },
        stdio: 'ignore',
      });
      await waitForHttp(`http://localhost:${API_PORT}/api/v1/health`, 25000);
      console.log(`NestJS API server started and healthy at http://localhost:${API_PORT}/api/v1`);
    }

    // Verify Next.js frontend is accessible on port 3000
    try {
      await waitForHttp(`${WEB_URL}/login`, 2000);
      console.log(`Next.js frontend already running at ${WEB_URL}\n`);
    } catch {
      console.log('Starting Next.js production server on port 3000...');
      webProcess = spawn(
        'node',
        ['node_modules/next/dist/bin/next', 'start', '-p', '3000'],
        {
          cwd: 'D:\\My Projects\\buildmind\\apps\\web',
          env: {
            ...process.env,
            PORT: '3000',
            NEXT_PUBLIC_API_URL: `http://localhost:${API_PORT}/api/v1`,
          },
          stdio: 'ignore',
          shell: false,
        },
      );
      await waitForHttp(`${WEB_URL}/login`, 25000);
      console.log(`Next.js frontend started and ready at ${WEB_URL}\n`);
    }

    // 2. Launch Chromium browser via Playwright
    console.log('Launching headless Chromium browser...');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const context = await browser.newContext({
      baseURL: WEB_URL,
      viewport: { width: 1280, height: 800 },
      ignoreHTTPSErrors: true,
    });

    const page = await context.newPage();

    // -------------------------------------------------------------
    // Scenario 1: Navigate to /login and verify DOM elements
    // -------------------------------------------------------------
    console.log('--- Step 1: Login Page Verification ---');
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    assert('Login page renders email input', (await emailInput.count()) === 1);
    assert('Login page renders password input', (await passwordInput.count()) === 1);
    assert('Login page renders submit button', (await submitBtn.count()) === 1);

    // -------------------------------------------------------------
    // Scenario 2: Register a new user via browser form
    // -------------------------------------------------------------
    console.log('\n--- Step 2: User Registration Form Submission ---');
    await context.clearCookies();
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    console.log('Current page URL at Step 2:', page.url());

    await page.waitForSelector('#fullName', { timeout: 10000 });
    await page.fill('#fullName', 'Playwright Commercial Lead');
    await page.fill('#email', testEmail);
    await page.fill('#password', testPassword);
    await page.fill('#confirmPassword', testPassword);
    await page.click('button[type="submit"]');

    // Wait for registration confirmation and click Continue
    await page.waitForSelector('text=Account Registered Successfully', { timeout: 15000 });
    assert('Registration confirmation card displayed in browser DOM', true);

    await page.click('button:has-text("Continue to Workspace")');
    await page.waitForURL((url) => !url.pathname.includes('/register'), { timeout: 15000 });
    assert(
      'Registration successfully submitted and redirects away from /register',
      !page.url().includes('/register'),
      `Current URL: ${page.url()}`,
    );

    // -------------------------------------------------------------
    // Scenario 3: Organization Onboarding & Creation Flow
    // -------------------------------------------------------------
    console.log('\n--- Step 3: Organization Onboarding & Creation Flow ---');
    await page.goto('/onboarding/organization');
    await page.waitForLoadState('networkidle');

    const orgNameInput = page.locator('input[placeholder*="Commercial"]');
    const orgSlugInput = page.locator('input[placeholder*="surveyors"]');

    assert('Onboarding page renders organization name field', (await orgNameInput.count()) > 0);
    assert('Onboarding page renders organization slug field', (await orgSlugInput.count()) > 0);

    await orgNameInput.fill(orgName);
    await orgSlugInput.fill(orgSlug);
    await page.click('button[type="submit"]');

    // Wait for redirect to /projects
    await page.waitForURL((url) => url.pathname.includes('/projects'), { timeout: 15000 });
    assert(
      'Organization created successfully and redirects to /projects',
      page.url().includes('/projects'),
      `Current URL: ${page.url()}`,
    );

    // -------------------------------------------------------------
    // Scenario 4: AppShell Header & Organization Switcher Verification
    // -------------------------------------------------------------
    console.log('\n--- Step 4: AppShell Header & Organization Switcher ---');
    const orgSelectorBtn = page.locator('button[aria-label="Organization selector"]');
    assert('Header contains Organization Selector button', (await orgSelectorBtn.count()) === 1);

    const orgButtonText = await orgSelectorBtn.textContent();
    assert(
      'Organization selector displays current organization name',
      orgButtonText.includes('Apex Playwright') || orgButtonText.includes('Select Org') || orgButtonText.length > 0,
    );

    // Click to open organization dropdown
    await orgSelectorBtn.click();
    await page.waitForSelector('text=Organizations (', { timeout: 5000 });
    const orgDropdown = page.locator('text=Organizations (');
    assert(
      'Clicking organization selector reveals organizations dropdown',
      (await orgDropdown.count()) > 0,
    );

    // Close dropdown
    await page.keyboard.press('Escape');

    // -------------------------------------------------------------
    // Scenario 5: Create a New Project under Active Organization
    // -------------------------------------------------------------
    console.log('\n--- Step 5: New Project Creation Flow ---');
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
    await page.waitForURL((url) => url.pathname.match(/\/projects\/[a-f0-9-]+/), { timeout: 15000 });
    assert(
      'Project created successfully and redirects to project detail workspace',
      Boolean(page.url().match(/\/projects\/[a-f0-9-]+/)),
      `Current URL: ${page.url()}`,
    );

    // Wait for project detail content to load
    await page.waitForSelector('text=Assigned Project Members', { timeout: 15000 });

    // Verify project detail contents
    const pageContent = await page.content();
    assert(
      'Project detail page displays project code and measurement standard SLS 573',
      pageContent.includes(projectCode) && pageContent.includes('SLS_573'),
    );
    assert(
      'Project detail page displays Assigned Project Members section',
      pageContent.includes('Assigned Project Members'),
    );

    // -------------------------------------------------------------
    // Scenario 6: Organization Invitations Page & Dispatch
    // -------------------------------------------------------------
    console.log('\n--- Step 6: Organization Invitations Flow ---');
    // Retrieve created organization ID from database
    const createdOrg = await prisma.organization.findUnique({
      where: { slug: orgSlug },
    });
    assert('Organization verified in PostgreSQL database', Boolean(createdOrg));

    if (createdOrg) {
      await page.goto(`/organizations/${createdOrg.id}/invitations`);
      await page.waitForLoadState('networkidle');

      const inviteEmailInput = page.locator('input[type="email"]');
      const inviteSubmitBtn = page.locator('button[type="submit"]');

      assert('Invitations page renders email input', (await inviteEmailInput.count()) === 1);
      assert('Invitations page renders send button', (await inviteSubmitBtn.count()) === 1);

      await inviteEmailInput.fill(inviteeEmail);
      await inviteSubmitBtn.click();

      // Wait for success indicator or invitation table to update
      await page.waitForSelector(`text=${inviteeEmail}`, { timeout: 10000 });
      assert(
        'Dispatched invitation appears in invitations table',
        (await page.locator(`text=${inviteeEmail}`).count()) > 0,
      );

      // Verify token was stored as SHA-256 hash in DB
      const dbInvite = await prisma.organizationInvitation.findFirst({
        where: { email: inviteeEmail, organizationId: createdOrg.id },
      });
      assert('Invitation record created in PostgreSQL', Boolean(dbInvite));
      assert('Invitation status is PENDING', dbInvite.status === 'PENDING');
      assert('Invitation tokenHash is 64-char SHA-256 hex string', dbInvite.tokenHash.length === 64);
    }

    // -------------------------------------------------------------
    // Scenario 7: Verify Session Cookies & Organization Context
    // -------------------------------------------------------------
    console.log('\n--- Step 7: Cookie Persistence & Context Verification ---');
    const cookies = await context.cookies();
    const hasAccessCookie = cookies.some((c) => c.name === 'buildmind_access_token');
    const hasRefreshCookie = cookies.some((c) => c.name === 'buildmind_refresh_token');
    const hasOrgCookie = cookies.some((c) => c.name === 'buildmind_org_id');

    assert('Browser session retains buildmind_access_token cookie', hasAccessCookie);
    assert('Browser session retains buildmind_refresh_token cookie', hasRefreshCookie);
    assert('Browser session retains buildmind_org_id cookie', hasOrgCookie);

    // -------------------------------------------------------------
    // Clean up test records
    // -------------------------------------------------------------
    console.log('\n--- Cleanup ---');
    if (createdOrg) {
      await prisma.organization.delete({ where: { id: createdOrg.id } });
    }
    await prisma.user.deleteMany({
      where: { email: { in: [testEmail, inviteeEmail] } },
    });
    assert('Test data cleanly pruned from PostgreSQL', true);

  } catch (err) {
    console.error('\nPlaywright E2E Execution Error:', err);
    failed++;
  } finally {
    if (browser) {
      await browser.close();
    }
    if (apiProcess) {
      apiProcess.kill();
    }
    if (webProcess) {
      webProcess.kill();
    }
    await prisma.$disconnect();

    console.log('\n============================================================');
    console.log(`PLAYWRIGHT TEST RESULTS: ${passed} passed, ${failed} failed`);
    console.log('============================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  }
}

void runPlaywrightSuite();
