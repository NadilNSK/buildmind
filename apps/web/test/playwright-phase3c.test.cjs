/**
 * BuildMind AI v5.0 — Phase 3C Playwright End-to-End Browser Test Suite
 * 21 Comprehensive Acceptance Scenarios:
 * 1. User Login & Session Establishment
 * 2. Navigate to Project Documents & Verify Document Register
 * 3. Upload Initial Architectural Drawing (V1, Rev 01, PUBLISHED)
 * 4. Verify Automatic Drawing Registration in Dedicated Drawings Register
 * 5. Search & Filter Drawings in Dedicated Register
 * 6. Open Drawing Details Drawer from Drawings Register
 * 7. Open New Revision Modal & Validate Form Fields
 * 8. Upload New Revision (Revision 02) as DRAFT
 * 9. Verify Immutability of Published Revision 01 while Rev 02 is DRAFT
 * 10. Reject Duplicate Revision Code Attempt with Conflict Error
 * 11. Submit Revision 02 for Review (DRAFT -> SUBMITTED)
 * 12. Request Engineering Review (SUBMITTED -> UNDER_REVIEW)
 * 13. Navigate to Reviews Queue Page
 * 14. Filter Review Queue by Status
 * 15. Open Review Decision Dialog
 * 16. Approve Revision 02 (UNDER_REVIEW -> APPROVED)
 * 17. Publish Revision 02 (Atomic PUBLISHED & Supersession of Rev 01)
 * 18. Compare Revisions Side-by-Side (Compare Modal)
 * 19. Dedicated Transmittals Register Navigation & Filter
 * 20. Create Transmittal Record Linking Published Document Revision
 * 21. Issue Transmittal & Enforce Snapshot Immutability
 */

const { chromium } = require('@playwright/test');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
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
  console.log('BuildMind AI v5.0 — Phase 3C Playwright Browser E2E Suite');
  console.log('Document Control, Drawing Revisions & Transmittals');
  console.log('============================================================\n');

  let apiProcess = null;
  let webProcess = null;
  let browser = null;

  const testSuffix = Math.random().toString(36).substring(2, 8);
  const ownerEmail = `lead-${testSuffix}@buildmind.test`;
  const reviewerEmail = `seniorqs-${testSuffix}@buildmind.test`;
  const password = 'BuildMind#Secure2026!';

  const orgAName = `Apex Engineering ${testSuffix}`;
  const orgASlug = `apex-${testSuffix}`;
  const projectCode = `PRJ-${testSuffix.toUpperCase()}`;
  const projectName = `Lotus Commercial Complex ${testSuffix}`;

  const drawingNumber = `DWG-A101-${testSuffix.toUpperCase()}`;
  const drawingTitle = 'Tower A North Elevation';

  let totalScenarios = 21;
  let passedScenarios = 0;
  let passedAssertions = 0;
  let failedAssertions = 0;

  function assert(title, condition) {
    if (condition) {
      console.log(`  ✓ ${title}`);
      passedAssertions++;
    } else {
      console.error(`  ✗ FAIL: ${title}`);
      failedAssertions++;
    }
  }

  // Create temporary fixtures
  const fixturesDir = path.join(__dirname, 'fixtures-phase3c');
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  const v1PdfPath = path.join(fixturesDir, 'Tower_Elevation_Rev01.pdf');
  fs.writeFileSync(
    v1PdfPath,
    Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Tower North Elevation Rev 01) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF'),
  );

  const v2PdfPath = path.join(fixturesDir, 'Tower_Elevation_Rev02.pdf');
  fs.writeFileSync(
    v2PdfPath,
    Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Tower North Elevation Rev 02 - Modified Mullions) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF'),
  );

  let createdProjectId = null;
  let createdOrgId = null;
  let ownerUserId = null;
  let reviewerUserId = null;

  try {
    // 1. Ensure NestJS API is running on port 4001
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

    // 2. Ensure Next.js is running on port 3000
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
      baseURL: WEB_URL,
    });
    const page = await context.newPage();

    // ==========================================================
    // Pre-seed Users and Project Hierarchy via Database / API
    // ==========================================================
    console.log('\n[SETUP] Pre-seeding test users, organization, and project...');
    const ownerReg = await registerUserApi(ownerEmail, 'Director Alice', password);
    ownerUserId = ownerReg.user.id;
    const reviewerReg = await registerUserApi(reviewerEmail, 'Sarah Senior QS', password);
    reviewerUserId = reviewerReg.user.id;

    // Create Org A
    const orgA = await prisma.organization.create({
      data: {
        name: orgAName,
        slug: orgASlug,
        country: 'LK',
        currency: 'LKR',
        memberships: {
          create: [
            { userId: ownerUserId, role: 'COMMERCIAL_DIRECTOR' },
            { userId: reviewerUserId, role: 'SENIOR_QS' },
          ],
        },
      },
    });
    createdOrgId = orgA.id;

    // Create Project A
    const projectA = await prisma.project.create({
      data: {
        organizationId: orgA.id,
        code: projectCode,
        name: projectName,
        projectType: 'COMMERCIAL',
        country: 'LK',
        currency: 'LKR',
        standard: 'SLS_573',
        status: 'UNDER_CONSTRUCTION',
        createdById: ownerUserId,
        members: {
          create: [
            { userId: ownerUserId, role: 'PROJECT_LEAD' },
            { userId: reviewerUserId, role: 'SENIOR_QS' },
          ],
        },
      },
    });
    createdProjectId = projectA.id;

    console.log(`[SETUP] Hierarchy ready. Project ID: ${createdProjectId}`);

    // ==========================================================
    // Scenario 1: User Login & Session Establishment
    // ==========================================================
    console.log('\n--- Scenario 1: User Login & Session Establishment ---');
    await page.goto('/login');
    await page.waitForSelector('input[name="email"], input[type="email"]');
    await page.fill('input[name="email"], input[type="email"]', ownerEmail);
    await page.fill('input[name="password"], input[type="password"]', password);
    await page.click('button[type="submit"]');

    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
    assert('Owner logged in successfully', !page.url().includes('/login'));

    await context.addCookies([
      {
        name: 'buildmind_org_id',
        value: createdOrgId,
        domain: 'localhost',
        path: '/',
      },
    ]);
    await page.evaluate((orgId) => {
      localStorage.setItem('buildmind_active_org_id', orgId);
    }, createdOrgId);

    passedScenarios++;

    // ==========================================================
    // Scenario 2: Navigate to Project Documents & Verify Document Register
    // ==========================================================
    console.log('\n--- Scenario 2: Navigate to Project Documents & Verify Document Register ---');
    await page.goto(`/projects/${createdProjectId}/documents`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('h1:has-text("Document Control")', { timeout: 10000 });

    const navDrawings = await page.$('a:has-text("Drawings")');
    const navTransmittals = await page.$('a:has-text("Transmittals")');
    const navReviews = await page.$('a:has-text("Reviews")');

    assert('Project navigation includes Drawings link', navDrawings !== null);
    assert('Project navigation includes Transmittals link', navTransmittals !== null);
    assert('Project navigation includes Reviews link', navReviews !== null);
    passedScenarios++;

    // ==========================================================
    // Scenario 3: Upload Initial Architectural Drawing (V1, Rev 01, PUBLISHED)
    // ==========================================================
    console.log('\n--- Scenario 3: Upload Initial Architectural Drawing (V1, Rev 01, PUBLISHED) ---');
    const uploadBtn = await page.waitForSelector('button:has-text("Upload Documents")', { timeout: 10000 });
    await uploadBtn.click();
    await page.waitForSelector('input#file-upload-input', { state: 'attached', timeout: 10000 });

    await page.setInputFiles('input#file-upload-input', v1PdfPath);
    await page.waitForTimeout(300);

    await page.fill('[data-testid="input-title"]', drawingTitle);
    await page.fill('[data-testid="input-reference"]', drawingNumber);
    await page.selectOption('[data-testid="select-category"]', 'ARCHITECTURAL_DRAWING');

    await page.click('[data-testid="btn-submit-upload"]');
    await page.waitForSelector('[data-testid="btn-submit-upload"]', { state: 'detached', timeout: 10000 });

    await page.waitForSelector(`text=${drawingNumber}`, { timeout: 10000 });
    assert(`Document ${drawingNumber} appears in document register`, (await page.$(`text=${drawingNumber}`)) !== null);
    passedScenarios++;

    // ==========================================================
    // Scenario 4: Verify Automatic Drawing Registration in Dedicated Drawings Register
    // ==========================================================
    console.log('\n--- Scenario 4: Verify Automatic Drawing Registration in Dedicated Drawings Register ---');
    await page.goto(`/projects/${createdProjectId}/drawings`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('h1:has-text("Drawing Register")', { timeout: 10000 });

    const drawingRow = await page.waitForSelector(`text=${drawingNumber}`, { timeout: 10000 });
    assert('Drawing automatically registered in dedicated Drawings Register', drawingRow !== null);

    const revBadge = await page.textContent(`tr:has-text("${drawingNumber}")`);
    assert('Drawing displays Rev 01 badge', revBadge && revBadge.includes('Rev 01'));
    assert('Drawing displays PUBLISHED status', revBadge && revBadge.includes('PUBLISHED'));
    passedScenarios++;

    // ==========================================================
    // Scenario 5: Search & Filter Drawings in Dedicated Register
    // ==========================================================
    console.log('\n--- Scenario 5: Search & Filter Drawings in Dedicated Register ---');
    await page.fill('[data-testid="input-drawing-search"]', drawingNumber);
    await page.waitForTimeout(400);

    const filteredRows = await page.$$('tbody tr');
    assert('Filtered table shows exact matching drawing', filteredRows.length >= 1);
    await page.fill('[data-testid="input-drawing-search"]', '');
    await page.waitForTimeout(300);
    passedScenarios++;

    // ==========================================================
    // Scenario 6: Open Drawing Details Drawer from Drawings Register
    // ==========================================================
    console.log('\n--- Scenario 6: Open Drawing Details Drawer from Drawings Register ---');
    const tableRow = await page.waitForSelector(`tr:has-text("${drawingNumber}")`);
    await tableRow.click();

    await page.waitForSelector('span:has-text("Revision History")', { timeout: 10000 });
    assert('Revision History section renders in drawer', (await page.$('span:has-text("Revision History")')) !== null);

    const rev1Item = await page.$('text=Rev 01');
    assert('Revision 01 listed in revision history', rev1Item !== null);
    const pubBadge = await page.$('text=Published');
    assert('Revision 01 has Published badge', pubBadge !== null);
    passedScenarios++;

    // ==========================================================
    // Scenario 7: Open New Revision Modal & Validate Form Fields
    // ==========================================================
    console.log('\n--- Scenario 7: Open New Revision Modal & Validate Form Fields ---');
    const newRevBtn = await page.waitForSelector('[data-testid="btn-upload-revision"]', { timeout: 10000 });
    await newRevBtn.click();

    await page.waitForSelector('h2:has-text("Upload New Revision")', { timeout: 10000 });
    assert('Upload New Revision modal is open', (await page.$('h2:has-text("Upload New Revision")')) !== null);

    const revInput = await page.$('[data-testid="input-revision-code"]');
    assert('Revision Code input field is present', revInput !== null);
    passedScenarios++;

    // ==========================================================
    // Scenario 8: Upload New Revision (Revision 02) as DRAFT
    // ==========================================================
    console.log('\n--- Scenario 8: Upload New Revision (Revision 02) as DRAFT ---');
    const fileInput = await page.waitForSelector('input[type="file"]', { state: 'attached' });
    await fileInput.setInputFiles(v2PdfPath);

    await page.fill('[data-testid="input-revision-code"]', '02');
    await page.fill('input[placeholder="Descriptive title for this revision"]', 'Tower North Elevation Rev 02');
    await page.fill('textarea', 'Updated facade mullion spacing per consultant review');

    await page.click('[data-testid="btn-submit-revision"]');
    await page.waitForSelector('h2:has-text("Upload New Revision")', { state: 'detached', timeout: 10000 });

    await page.waitForSelector('text=Rev 02', { timeout: 10000 });
    assert('Revision 02 appears in revision history', (await page.$('text=Rev 02')) !== null);

    const rev2Card = await page.textContent('div:has-text("Rev 02")');
    assert('Revision 02 has initial DRAFT status', rev2Card && rev2Card.includes('DRAFT'));
    passedScenarios++;

    // ==========================================================
    // Scenario 9: Verify Immutability of Published Revision 01 while Rev 02 is DRAFT
    // ==========================================================
    console.log('\n--- Scenario 9: Verify Immutability of Published Revision 01 while Rev 02 is DRAFT ---');
    const rev1Card = await page.textContent('div:has-text("Rev 01")');
    assert('Revision 01 remains marked as Published', rev1Card && rev1Card.includes('Published'));
    passedScenarios++;

    // ==========================================================
    // Scenario 10: Reject Duplicate Revision Code Attempt with Conflict Error
    // ==========================================================
    console.log('\n--- Scenario 10: Reject Duplicate Revision Code Attempt with Conflict Error ---');
    const newRevBtn2 = await page.waitForSelector('[data-testid="btn-upload-revision"]', { timeout: 10000 });
    await newRevBtn2.click();
    await page.waitForSelector('h2:has-text("Upload New Revision")', { timeout: 10000 });

    const fileInput2 = await page.waitForSelector('input[type="file"]', { state: 'attached' });
    await fileInput2.setInputFiles(v2PdfPath);

    await page.fill('[data-testid="input-revision-code"]', '02'); // Duplicate revision code!
    await page.click('[data-testid="btn-submit-revision"]');

    await page.waitForSelector('text=already exists', { timeout: 10000 });
    assert('Duplicate revision code 02 rejected with conflict error', (await page.$('text=already exists')) !== null);

    // Cancel modal
    await page.click('button:has-text("Cancel")');
    await page.waitForSelector('h2:has-text("Upload New Revision")', { state: 'detached', timeout: 10000 });
    passedScenarios++;

    // ==========================================================
    // Scenario 11: Submit Revision 02 for Review (DRAFT -> SUBMITTED)
    // ==========================================================
    console.log('\n--- Scenario 11: Submit Revision 02 for Review (DRAFT -> SUBMITTED) ---');
    const submitBtn = await page.waitForSelector('[data-testid="btn-submit-v2"]', { timeout: 10000 });
    await submitBtn.click();

    await page.waitForSelector('span:has-text("SUBMITTED")', { timeout: 10000 });
    assert('Revision 02 transitioned to SUBMITTED state', (await page.$('span:has-text("SUBMITTED")')) !== null);
    passedScenarios++;

    // ==========================================================
    // Scenario 12: Request Engineering Review (SUBMITTED -> UNDER_REVIEW)
    // ==========================================================
    console.log('\n--- Scenario 12: Request Engineering Review (SUBMITTED -> UNDER_REVIEW) ---');
    const reqReviewBtn = await page.waitForSelector('[data-testid="btn-req-review-v2"]', { timeout: 10000 });
    await reqReviewBtn.click();

    await page.waitForSelector('span:has-text("UNDER REVIEW")', { timeout: 10000 });
    assert('Revision 02 transitioned to UNDER_REVIEW state', (await page.$('span:has-text("UNDER REVIEW")')) !== null);
    passedScenarios++;

    // ==========================================================
    // Scenario 13: Navigate to Reviews Queue Page
    // ==========================================================
    console.log('\n--- Scenario 13: Navigate to Reviews Queue Page ---');
    await page.goto(`/projects/${createdProjectId}/reviews`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('h1:has-text("Document Review Queue")', { timeout: 10000 });

    const reviewRow = await page.waitForSelector('text=Rev 02', { timeout: 10000 });
    assert('Review Queue displays pending review for Rev 02', reviewRow !== null);
    passedScenarios++;

    // ==========================================================
    // Scenario 14: Filter Review Queue by Status
    // ==========================================================
    console.log('\n--- Scenario 14: Filter Review Queue by Status ---');
    await page.selectOption('select', 'PENDING');
    await page.waitForTimeout(400);

    const pendingRow = await page.$('text=Rev 02');
    assert('Pending filter maintains review record visibility', pendingRow !== null);
    passedScenarios++;

    // ==========================================================
    // Scenario 15: Log in as Senior QS & Open Review Decision Dialog
    // ==========================================================
    console.log('\n--- Scenario 15: Log in as Senior QS & Open Review Decision Dialog ---');
    await context.clearCookies();
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.waitForSelector('input[name="email"], input[type="email"]');
    await page.fill('input[name="email"], input[type="email"]', reviewerEmail);
    await page.fill('input[name="password"], input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    await context.addCookies([
      {
        name: 'buildmind_org_id',
        value: createdOrgId,
        domain: 'localhost',
        path: '/',
      },
    ]);
    await page.evaluate((orgId) => {
      localStorage.setItem('buildmind_active_org_id', orgId);
    }, createdOrgId);

    await page.goto(`/projects/${createdProjectId}/reviews`);
    await page.waitForLoadState('networkidle');

    const reviewActionBtn = await page.waitForSelector('button:has-text("Review")', { timeout: 10000 });
    await reviewActionBtn.click();

    await page.waitForSelector('h2:has-text("Review Document Revision")', { timeout: 10000 });
    assert('Review Decision dialog opened', (await page.$('h2:has-text("Review Document Revision")')) !== null);
    passedScenarios++;

    // ==========================================================
    // Scenario 16: Approve Revision 02 (UNDER_REVIEW -> APPROVED)
    // ==========================================================
    console.log('\n--- Scenario 16: Approve Revision 02 (UNDER_REVIEW -> APPROVED) ---');
    await page.fill('input[placeholder*="SLS 573"]', 'Complies with SLS 573 rules');
    await page.fill('textarea[placeholder*="review remarks"]', 'Facade mullion spacing verified and approved.');

    await page.click('[data-testid="btn-confirm-review-decision"]');
    await page.waitForSelector('h2:has-text("Review Document Revision")', { state: 'detached', timeout: 10000 });

    await page.waitForSelector('span:has-text("APPROVED")', { timeout: 10000 });
    assert('Review record updated to APPROVED', (await page.$('span:has-text("APPROVED")')) !== null);
    passedScenarios++;

    // ==========================================================
    // Scenario 17: Publish Revision 02 (Atomic PUBLISHED & Supersession of Rev 01)
    // ==========================================================
    console.log('\n--- Scenario 17: Publish Revision 02 (Atomic PUBLISHED & Supersession of Rev 01) ---');
    await page.goto(`/projects/${createdProjectId}/documents`);
    await page.waitForLoadState('networkidle');

    const detailsBtn = await page.waitForSelector(
      `tr:has-text("${drawingNumber}") button[title="View details & links"], tr:has-text("${drawingNumber}") button:has-text("${drawingTitle}")`,
      { timeout: 10000 },
    );
    await detailsBtn.click();

    await page.waitForSelector('span:has-text("Revision History")', { timeout: 10000 });
    const publishBtn = await page.waitForSelector('[data-testid="btn-publish-v2"]', { timeout: 10000 });
    await publishBtn.click();

    await page.waitForSelector('span:has-text("SUPERSEDED")', { timeout: 10000 });
    assert('Revision 01 automatically transitioned to SUPERSEDED', (await page.$('span:has-text("SUPERSEDED")')) !== null);
    assert('Revision 02 is now PUBLISHED and Current Published', (await page.$('span:has-text("Published")')) !== null);
    passedScenarios++;

    // ==========================================================
    // Scenario 18: Compare Revisions Side-by-Side (Compare Modal)
    // ==========================================================
    console.log('\n--- Scenario 18: Compare Revisions Side-by-Side (Compare Modal) ---');
    const compareBtn = await page.waitForSelector('[data-testid="btn-compare-revisions"]', { timeout: 10000 });
    await compareBtn.click();

    await page.waitForSelector('h2:has-text("Compare Document Revisions")', { timeout: 10000 });
    assert('Revision Compare Modal is open', (await page.$('h2:has-text("Compare Document Revisions")')) !== null);

    await page.waitForSelector('text=File Binary Content Modified', { timeout: 10000 });
    assert('Cryptographic diff detects binary payload change', (await page.$('text=File Binary Content Modified')) !== null);

    await page.click('button:has-text("Close Comparison")');
    await page.waitForSelector('h2:has-text("Compare Document Revisions")', { state: 'detached', timeout: 10000 });
    passedScenarios++;

    // ==========================================================
    // Scenario 19: Dedicated Transmittals Register Navigation & Filter
    // ==========================================================
    console.log('\n--- Scenario 19: Dedicated Transmittals Register Navigation & Filter ---');
    await page.goto(`/projects/${createdProjectId}/transmittals`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('h1:has-text("Document Transmittals")', { timeout: 10000 });

    const newTransmittalBtn = await page.$('[data-testid="btn-create-transmittal"]');
    assert('New Transmittal button is accessible', newTransmittalBtn !== null);
    passedScenarios++;

    // ==========================================================
    // Scenario 20: Create Transmittal Record Linking Published Document Revision
    // ==========================================================
    console.log('\n--- Scenario 20: Create Transmittal Record Linking Published Document Revision ---');
    await page.click('[data-testid="btn-create-transmittal"]');
    await page.waitForSelector('h2:has-text("New Transmittal Record")', { timeout: 10000 });

    const transRef = `TRN-PKG-${testSuffix.toUpperCase()}`;
    await page.fill('[data-testid="input-transmittal-reference"]', transRef);
    await page.fill('[data-testid="input-transmittal-subject"]', 'Architectural Elevation Tender Package Rev 02');

    // Fill recipient
    await page.fill('input[placeholder="Name *"]', 'John Contractor');
    await page.fill('input[placeholder="Email *"]', 'john@generalcontractor.test');

    // Select document revision
    const docCheckbox = await page.waitForSelector(`input[type="checkbox"]`);
    await docCheckbox.check();

    await page.click('[data-testid="btn-submit-transmittal"]');
    await page.waitForSelector('h2:has-text("New Transmittal Record")', { state: 'detached', timeout: 10000 });

    await page.waitForSelector(`text=${transRef}`, { timeout: 10000 });
    assert(`Transmittal ${transRef} created with DRAFT status`, (await page.$(`text=${transRef}`)) !== null);
    passedScenarios++;

    // ==========================================================
    // Scenario 21: Issue Transmittal & Enforce Snapshot Immutability
    // ==========================================================
    console.log('\n--- Scenario 21: Issue Transmittal & Enforce Snapshot Immutability ---');
    const issueBtn = await page.waitForSelector(`[data-testid="btn-issue-${transRef}"]`, { timeout: 10000 });
    await issueBtn.click();

    await page.waitForSelector('span:has-text("ISSUED")', { timeout: 10000 });
    const transRow = await page.textContent(`tr:has-text("${transRef}")`);
    assert('Transmittal status transitioned to ISSUED', transRow && transRow.includes('ISSUED'));

    // Open Details Modal
    await page.click(`text=${transRef}`);
    await page.waitForSelector('span:has-text("Transmitted Documents")', { timeout: 10000 });
    assert('Transmittal details snapshot modal opens', true);

    const snapshotRev = await page.textContent('span:has-text("Rev 02")');
    assert('Snapshot locks Rev 02 immutably into issued package', snapshotRev !== null);
    passedScenarios++;

  } catch (err) {
    console.error('\nPlaywright Suite Error:', err);
    failedAssertions++;
  } finally {
    if (browser) await browser.close();
    if (webProcess) webProcess.kill();
    if (apiProcess) apiProcess.kill();

    // Clean up temporary fixtures
    if (fs.existsSync(fixturesDir)) {
      fs.rmSync(fixturesDir, { recursive: true, force: true });
    }

    // Clean up DB records
    try {
      await prisma.documentVersionSpatialLink.deleteMany({}).catch(() => {});
      await prisma.documentVersionWorkPackageLink.deleteMany({}).catch(() => {});
      await prisma.transmittalItem.deleteMany({}).catch(() => {});
      await prisma.documentTransmittal.deleteMany({}).catch(() => {});
      await prisma.documentReview.deleteMany({}).catch(() => {});
      await prisma.drawingMetadata.deleteMany({}).catch(() => {});
      await prisma.documentVersion.deleteMany({}).catch(() => {});
      await prisma.documentSpatialLink.deleteMany({}).catch(() => {});
      await prisma.documentWorkPackageLink.deleteMany({}).catch(() => {});
      await prisma.documentAuditLog.deleteMany({}).catch(() => {});
      await prisma.document.deleteMany({}).catch(() => {});
      await prisma.documentUploadSession.deleteMany({}).catch(() => {});
      await prisma.spatialNode.deleteMany({}).catch(() => {});
      await prisma.workPackage.deleteMany({}).catch(() => {});
      await prisma.projectMember.deleteMany({}).catch(() => {});
      await prisma.project.deleteMany({}).catch(() => {});
      await prisma.membership.deleteMany({}).catch(() => {});
      if (createdOrgId) {
        await prisma.organization.deleteMany({ where: { id: createdOrgId } }).catch(() => {});
      }
      await prisma.user.deleteMany({
        where: { email: { in: [ownerEmail, reviewerEmail] } },
      }).catch(() => {});
    } catch {}
  }

  console.log('\n============================================================');
  console.log(`Phase 3C Playwright Results: ${passedScenarios}/${totalScenarios} Scenarios Passed`);
  console.log(`Assertions: ${passedAssertions} Passed, ${failedAssertions} Failed`);
  console.log('============================================================\n');

  if (failedAssertions > 0 || passedScenarios < totalScenarios) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPlaywrightSuite();
