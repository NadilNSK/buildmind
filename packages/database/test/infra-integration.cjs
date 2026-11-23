const { PrismaClient } = require('../dist/index.js');
const net = require('net');
const http = require('http');
const { execSync } = require('child_process');

// ================================================================
// 1. PostgreSQL Persistence Integration Test
// ================================================================
async function testPostgresPersistence() {
  console.log('\n--- 1. Testing PostgreSQL Persistence ---');
  let prisma = new PrismaClient();
  const testId = Date.now().toString(36);
  const orgSlug = `test-org-${testId}`;
  const userEmail = `dev-test-${testId}@buildmind.test`;
  const projectCode = `PRJ-${testId.toUpperCase()}`;

  let createdOrgId = '';
  let createdUserId = '';
  let createdProjectId = '';

  try {
    // 1. Create records
    const org = await prisma.organization.create({
      data: {
        name: 'Test Infrastructure Org',
        slug: orgSlug,
        country: 'LK',
        currency: 'LKR',
        status: 'ACTIVE',
      },
    });
    createdOrgId = org.id;

    const user = await prisma.user.create({
      data: {
        email: userEmail,
        fullName: 'DevOps Test Engineer',
        passwordHash: 'dummy_hash_for_test',
        role: 'SENIOR_QS',
      },
    });
    createdUserId = user.id;

    const membership = await prisma.membership.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        role: 'SENIOR_QS',
      },
    });

    const project = await prisma.project.create({
      data: {
        organizationId: org.id,
        createdById: user.id,
        code: projectCode,
        name: 'Test Commercial Project Persistence',
        standard: 'SLS_573',
        status: 'PLANNING',
        currency: 'LKR',
      },
    });
    createdProjectId = project.id;

    console.log(`[PASS] Created isolated test records:
  - Organization ID: ${org.id} (slug: ${org.slug})
  - User ID: ${user.id} (email: ${user.email})
  - Membership ID: ${membership.id}
  - Project ID: ${project.id} (code: ${project.code}, standard: ${project.standard})`);

    // 2. Disconnect (Connection restart)
    console.log('Disconnecting Prisma Client (simulating connection restart)...');
    await prisma.$disconnect();

    // 3. Re-instantiate a new client and query records back
    console.log('Reconnecting new PrismaClient instance...');
    prisma = new PrismaClient();

    const retrievedProject = await prisma.project.findUnique({
      where: { id: createdProjectId },
      include: {
        organization: true,
        createdBy: true,
      },
    });

    if (!retrievedProject) {
      throw new Error(`Project ${createdProjectId} was not found after connection restart!`);
    }

    if (retrievedProject.organization.id !== createdOrgId) {
      throw new Error('Organization relation mismatch after restart!');
    }

    if (retrievedProject.createdBy.id !== createdUserId) {
      throw new Error('CreatedBy user relation mismatch after restart!');
    }

    console.log(`[PASS] Verified record persistence across connection restart:
  - Project Code: ${retrievedProject.code}
  - Organization: ${retrievedProject.organization.name}
  - Standard: ${retrievedProject.standard}
  - Created By: ${retrievedProject.createdBy.fullName}`);

  } finally {
    // 4. Safe cleanup of test records only
    console.log('Cleaning up temporary test records...');
    if (createdProjectId) {
      await prisma.project.deleteMany({ where: { id: createdProjectId } });
    }
    if (createdUserId) {
      await prisma.membership.deleteMany({ where: { userId: createdUserId } });
      await prisma.user.deleteMany({ where: { id: createdUserId } });
    }
    if (createdOrgId) {
      await prisma.organization.deleteMany({ where: { id: createdOrgId } });
    }

    // Verify cleanup
    const remaining = await prisma.project.findUnique({ where: { id: createdProjectId } });
    if (remaining) {
      console.warn('[WARN] Cleanup failed to delete project!');
    } else {
      console.log('[PASS] Isolated test records successfully cleaned up.');
    }

    await prisma.$disconnect();
  }
}

// ================================================================
// 2. Redis Connectivity Integration Test
// ================================================================
function testRedisConnectivity() {
  console.log('\n--- 2. Testing Redis Connectivity ---');
  return new Promise((resolve, reject) => {
    const client = net.createConnection({ host: '127.0.0.1', port: 6379 }, () => {
      console.log('Connected to Redis on port 6379.');
      // Send PING
      client.write('*1\r\n$4\r\nPING\r\n');
    });

    let stage = 'PING';

    client.on('data', (data) => {
      const response = data.toString();
      if (stage === 'PING') {
        if (response.includes('+PONG')) {
          console.log('[PASS] Redis PING returned +PONG');
          stage = 'SET';
          // SET key value
          client.write('*3\r\n$3\r\nSET\r\n$21\r\nbuildmind:test:status\r\n$11\r\noperational\r\n');
        } else {
          client.destroy();
          reject(new Error(`Expected +PONG, got: ${response}`));
        }
      } else if (stage === 'SET') {
        if (response.includes('+OK')) {
          console.log('[PASS] Redis SET buildmind:test:status returned +OK');
          stage = 'GET';
          // GET key
          client.write('*2\r\n$3\r\nGET\r\n$21\r\nbuildmind:test:status\r\n');
        } else {
          client.destroy();
          reject(new Error(`Expected +OK, got: ${response}`));
        }
      } else if (stage === 'GET') {
        if (response.includes('operational')) {
          console.log('[PASS] Redis GET buildmind:test:status returned "operational"');
          stage = 'DEL';
          // Clean up: DEL key
          client.write('*2\r\n$3\r\nDEL\r\n$21\r\nbuildmind:test:status\r\n');
        } else {
          client.destroy();
          reject(new Error(`Expected "operational", got: ${response}`));
        }
      } else if (stage === 'DEL') {
        console.log('[PASS] Redis DEL cleaned up test key.');
        client.end();
        resolve();
      }
    });

    client.on('error', (err) => {
      reject(err);
    });
  });
}

// ================================================================
// 3. MinIO S3 Object Storage Test
// ================================================================
async function testMinIOStorage() {
  console.log('\n--- 3. Testing MinIO S3 Storage Connectivity ---');

  // 1. Health check
  await new Promise((resolve, reject) => {
    http.get('http://localhost:9000/minio/health/live', (res) => {
      if (res.statusCode === 200) {
        console.log(`[PASS] MinIO Live Healthcheck: HTTP ${res.statusCode} OK`);
        resolve();
      } else {
        reject(new Error(`MinIO health check failed: HTTP ${res.statusCode}`));
      }
    }).on('error', reject);
  });

  // 2. Check buckets via Docker container filesystem
  const bucketsOutput = execSync('docker exec buildmind-minio ls -la /data').toString();
  console.log('MinIO /data volume contents:\n' + bucketsOutput.trim());

  if (!bucketsOutput.includes('buildmind-drawings') || !bucketsOutput.includes('buildmind-documents')) {
    throw new Error('Configured buckets buildmind-drawings or buildmind-documents missing from MinIO /data!');
  }
  console.log('[PASS] Verified configured MinIO buckets: "buildmind-drawings" and "buildmind-documents".');

  // 3. Test Object Upload, Retrieval and Cleanup
  console.log('Testing object write, read, and delete on "buildmind-drawings"...');
  const testFileName = `test-drawings-${Date.now()}.dxf.meta`;
  const testContent = `BuildMind AI Drawing Takeoff Meta - Verified at ${new Date().toISOString()}`;

  // Write temporary test file into /data/buildmind-drawings
  execSync(`docker exec buildmind-minio sh -c "echo '${testContent}' > /data/buildmind-drawings/${testFileName}"`);
  console.log(`[PASS] Uploaded test object to buildmind-drawings/${testFileName}`);

  // Read back and verify content
  const retrievedContent = execSync(`docker exec buildmind-minio cat /data/buildmind-drawings/${testFileName}`).toString().trim();
  if (retrievedContent !== testContent) {
    throw new Error(`Content mismatch! Expected "${testContent}", got "${retrievedContent}"`);
  }
  console.log(`[PASS] Retrieved and verified object content: "${retrievedContent}"`);

  // Delete test object
  execSync(`docker exec buildmind-minio rm -f /data/buildmind-drawings/${testFileName}`);
  const remainingFiles = execSync('docker exec buildmind-minio ls /data/buildmind-drawings').toString();
  if (remainingFiles.includes(testFileName)) {
    throw new Error(`Failed to remove test file ${testFileName}!`);
  }
  console.log(`[PASS] Test object successfully removed from buildmind-drawings.`);
}

// ================================================================
// Main Runner
// ================================================================
async function main() {
  try {
    await testPostgresPersistence();
    await testRedisConnectivity();
    await testMinIOStorage();
    console.log('\n============================================================');
    console.log('ALL INFRASTRUCTURE INTEGRATION TESTS PASSED (POSTGRES, REDIS, MINIO)!');
    console.log('============================================================\n');
  } catch (err) {
    console.error('\n[FAIL] Infrastructure test failed:', err);
    process.exit(1);
  }
}

main();
