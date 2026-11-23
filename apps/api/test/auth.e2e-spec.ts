import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';
import { EmailService } from '../src/modules/email/email.service';
import { JwtService } from '@nestjs/jwt';
import { REFRESH_COOKIE_NAME } from '../src/modules/auth/services/token.service';

describe('Authentication Backend (E2E Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let emailService: EmailService;
  let jwtService: JwtService;

  const testSuffix = Math.random().toString(36).substring(2, 8);
  const testEmailA = `test-qs-a-${testSuffix}@buildmind.test`;
  const testEmailB = `test-qs-b-${testSuffix}@buildmind.test`;
  const testPasswordA = 'BuildMind#Secure2026!';
  const newPasswordA = 'BuildMind#NewPass2027!';
  const testPasswordB = 'CommercialQS#2026!';

  let userAId: string;
  let userBId: string;
  let accessTokenA: string;
  let refreshTokenA: string;
  let accessTokenB: string;

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
    jwtService = app.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    // Isolated Test Data Cleanup
    try {
      const testEmails = [testEmailA, testEmailB];
      const users = await prisma.user.findMany({
        where: { email: { in: testEmails } },
        select: { id: true },
      });
      const userIds = users.map((u) => u.id);

      if (userIds.length > 0) {
        await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.emailVerificationToken.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.passwordResetToken.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.authAuditEvent.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      }
    } catch (err) {
      console.error('Error during test cleanup:', err);
    }

    await app.close();
  });

  // -------------------------------------------------------------
  // Scenario 1: Successful registration
  // -------------------------------------------------------------
  it('Scenario 1: Successful user registration with Argon2id hash & email verification token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: testEmailA,
        fullName: 'Senior QS Engineer A',
        password: testPasswordA,
      })
      .expect(201);

    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(testEmailA);
    expect(res.body.user.isEmailVerified).toBe(false);
    expect(res.body.tokens.accessToken).toBeDefined();
    expect(res.body.tokens.refreshToken).toBeDefined();

    userAId = res.body.user.id;
    accessTokenA = res.body.tokens.accessToken;
    refreshTokenA = res.body.tokens.refreshToken;

    // Verify in PostgreSQL database
    const dbUser = await prisma.user.findUnique({ where: { id: userAId } });
    expect(dbUser).toBeDefined();
    expect(dbUser?.passwordHash).toContain('$argon2id$');

    // Verify verification email dispatched to local email service
    const verificationToken = emailService.getLastVerificationToken(testEmailA);
    expect(verificationToken).toBeDefined();
    expect(verificationToken?.length).toBeGreaterThanOrEqual(32);
  });

  // -------------------------------------------------------------
  // Scenario 2: Duplicate email rejection
  // -------------------------------------------------------------
  it('Scenario 2: Duplicate email registration is rejected with 409 Conflict', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: testEmailA,
        fullName: 'Duplicate User',
        password: testPasswordA,
      })
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.statusCode).toBe(409);
  });

  // -------------------------------------------------------------
  // Scenario 3: Successful login
  // -------------------------------------------------------------
  it('Scenario 3: Successful login with valid credentials creates session and sets cookies', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: testEmailA,
        password: testPasswordA,
      })
      .expect(200);

    expect(res.body.user.email).toBe(testEmailA);
    expect(res.body.tokens.accessToken).toBeDefined();
    expect(res.body.tokens.refreshToken).toBeDefined();

    accessTokenA = res.body.tokens.accessToken;
    refreshTokenA = res.body.tokens.refreshToken;

    // Check Set-Cookie headers
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies).toBeDefined();
    const hasRefreshCookie = cookies.some((c) => c.includes(REFRESH_COOKIE_NAME));
    expect(hasRefreshCookie).toBe(true);

    // Verify audit event in PostgreSQL
    const auditEvent = await prisma.authAuditEvent.findFirst({
      where: { userId: userAId, eventType: 'LOGIN_SUCCESS' },
      orderBy: { createdAt: 'desc' },
    });
    expect(auditEvent).toBeDefined();
  });

  // -------------------------------------------------------------
  // Scenario 4: Incorrect password rejection
  // -------------------------------------------------------------
  it('Scenario 4: Incorrect password login is rejected with 401 Unauthorized', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: testEmailA,
        password: 'WrongPassword123!',
      })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.statusCode).toBe(401);

    // Verify LOGIN_FAILED audit event in PostgreSQL
    const auditEvent = await prisma.authAuditEvent.findFirst({
      where: { userId: userAId, eventType: 'LOGIN_FAILED' },
      orderBy: { createdAt: 'desc' },
    });
    expect(auditEvent).toBeDefined();
  });

  // -------------------------------------------------------------
  // Scenario 5: Protected route without authentication
  // -------------------------------------------------------------
  it('Scenario 5: Protected route rejects access when no token is provided (401)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  // -------------------------------------------------------------
  // Scenario 6: Protected route with valid authentication
  // -------------------------------------------------------------
  it('Scenario 6: Protected route allows access with valid Bearer token', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessTokenA}`)
      .expect(200);

    expect(res.body.id).toBe(userAId);
    expect(res.body.email).toBe(testEmailA);
    expect(res.body.activeSessionsCount).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------
  // Scenario 7: Expired access token rejection
  // -------------------------------------------------------------
  it('Scenario 7: Expired access token is rejected with 401 Unauthorized', async () => {
    // Generate an already expired JWT
    const expiredToken = await jwtService.signAsync(
      { sub: userAId, email: testEmailA, role: 'QS_ENGINEER', type: 'access' },
      { expiresIn: '-10s' },
    );

    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  // -------------------------------------------------------------
  // Scenario 8: Refresh token rotation
  // -------------------------------------------------------------
  let originalRefreshTokenA: string;

  it('Scenario 8: Refresh token rotation issues fresh tokens and revokes old session', async () => {
    originalRefreshTokenA = refreshTokenA;

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: originalRefreshTokenA })
      .expect(200);

    expect(res.body.tokens.accessToken).toBeDefined();
    expect(res.body.tokens.refreshToken).toBeDefined();
    expect(res.body.tokens.refreshToken).not.toBe(originalRefreshTokenA);

    accessTokenA = res.body.tokens.accessToken;
  });

  // -------------------------------------------------------------
  // Scenario 9: Refresh token reuse detection
  // -------------------------------------------------------------
  it('Scenario 9: Replaying rotated refresh token triggers security reuse detection & revokes all sessions', async () => {
    // Replay the already used originalRefreshTokenA
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: originalRefreshTokenA })
      .expect(401);

    expect(res.body.message).toContain('Refresh token reuse detected');

    // Confirm that all active sessions for this user were revoked in PostgreSQL
    const activeSessions = await prisma.session.findMany({
      where: { userId: userAId, isRevoked: false },
    });
    expect(activeSessions.length).toBe(0);

    // Verify REFRESH_REUSE_DETECTED audit event was logged
    const reuseAudit = await prisma.authAuditEvent.findFirst({
      where: { userId: userAId, eventType: 'REFRESH_REUSE_DETECTED' },
    });
    expect(reuseAudit).toBeDefined();
  });

  // -------------------------------------------------------------
  // Scenario 10: Logout and session revocation
  // -------------------------------------------------------------
  it('Scenario 10: Logout explicitly revokes the active session and clears cookies', async () => {
    // Login fresh to obtain an active session
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testEmailA, password: testPasswordA })
      .expect(200);

    const activeToken = loginRes.body.tokens.accessToken;

    // Logout
    const logoutRes = await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${activeToken}`)
      .expect(200);

    expect(logoutRes.body.success).toBe(true);

    // Verify token can no longer access protected endpoints
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${activeToken}`)
      .expect(401);
  });

  // -------------------------------------------------------------
  // Scenario 11: Password reset flow & expiration
  // -------------------------------------------------------------
  it('Scenario 11: Password reset flow handles invalid tokens and completes password change', async () => {
    // 1. Request reset
    const forgotRes = await request(app.getHttpServer())
      .post('/api/v1/auth/forgot-password')
      .send({ email: testEmailA })
      .expect(200);

    expect(forgotRes.body.success).toBe(true);

    const resetToken = emailService.getLastResetToken(testEmailA);
    expect(resetToken).toBeDefined();

    // 2. Reject invalid reset token
    await request(app.getHttpServer())
      .post('/api/v1/auth/reset-password')
      .send({
        token: 'invalid-nonexistent-token-value-12345',
        newPassword: newPasswordA,
      })
      .expect(400);

    // 3. Reset password successfully with valid token
    const resetRes = await request(app.getHttpServer())
      .post('/api/v1/auth/reset-password')
      .send({
        token: resetToken!,
        newPassword: newPasswordA,
      })
      .expect(200);

    expect(resetRes.body.success).toBe(true);

    // 4. Verify login succeeds with new password and fails with old password
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testEmailA, password: testPasswordA })
      .expect(401);

    const newLoginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testEmailA, password: newPasswordA })
      .expect(200);

    expect(newLoginRes.body.user.email).toBe(testEmailA);
    accessTokenA = newLoginRes.body.tokens.accessToken;
  });

  // -------------------------------------------------------------
  // Scenario 12: Email verification
  // -------------------------------------------------------------
  it('Scenario 12: Email verification confirms token and updates account in PostgreSQL', async () => {
    const verificationToken = emailService.getLastVerificationToken(testEmailA);
    expect(verificationToken).toBeDefined();

    // 1. Invalid verification token fails
    await request(app.getHttpServer())
      .post('/api/v1/auth/verify-email')
      .send({ token: 'bogus-verification-token-string' })
      .expect(400);

    // 2. Valid token succeeds
    const verifyRes = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-email')
      .send({ token: verificationToken! })
      .expect(200);

    expect(verifyRes.body.success).toBe(true);

    // 3. Verify in PostgreSQL database
    const verifiedUser = await prisma.user.findUnique({ where: { id: userAId } });
    expect(verifiedUser?.isEmailVerified).toBe(true);
  });

  // -------------------------------------------------------------
  // Scenario 14: Input validation & strong password policy
  // -------------------------------------------------------------
  it('Scenario 14: Rejects weak passwords, invalid email syntax, and missing inputs (400)', async () => {
    // 1. Weak password (no number or special char)
    const weakPassRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'weakpass@buildmind.test',
        fullName: 'Weak Password Tester',
        password: 'weakpassword',
      })
      .expect(400);

    expect(weakPassRes.body.message).toBeDefined();

    // 2. Malformed email
    const malformedEmailRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'not-an-email',
        fullName: 'Malformed Email',
        password: 'ValidPassword123!',
      })
      .expect(400);

    expect(malformedEmailRes.body.message).toBeDefined();

    // 3. Missing full name
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'missingname@buildmind.test',
        password: 'ValidPassword123!',
      })
      .expect(400);
  });

  // -------------------------------------------------------------
  // Scenario 15: No cross-user session access & multi-tenant isolation
  // -------------------------------------------------------------
  it('Scenario 15: Strict user isolation prevents cross-user session tampering', async () => {
    // 1. Register User B
    const regB = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: testEmailB,
        fullName: 'Commercial Director B',
        password: testPasswordB,
      })
      .expect(201);

    userBId = regB.body.user.id;
    accessTokenB = regB.body.tokens.accessToken;

    // 2. User B /me strictly returns User B's profile
    const meB = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessTokenB}`)
      .expect(200);

    expect(meB.body.id).toBe(userBId);
    expect(meB.body.email).toBe(testEmailB);
    expect(meB.body.id).not.toBe(userAId);

    // 3. Re-login User A and verify User A /me strictly returns User A's profile
    const loginA = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testEmailA, password: newPasswordA })
      .expect(200);

    const tokenA = loginA.body.tokens.accessToken;

    const meA = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(meA.body.id).toBe(userAId);
    expect(meA.body.id).not.toBe(userBId);
  });

  // -------------------------------------------------------------
  // Scenario 13: Rate limiting protection (Executed last to prevent throttling earlier tests)
  // -------------------------------------------------------------
  it('Scenario 13: Rate limiting responds with 429 Too Many Requests when threshold exceeded', async () => {
    const endpoint = '/api/v1/auth/login';
    let hitRateLimit = false;

    // Rapid burst of 15 login requests exceeding limit of 10/min
    for (let i = 0; i < 15; i++) {
      const res = await request(app.getHttpServer())
        .post(endpoint)
        .send({ email: 'bruteforce@buildmind.test', password: 'WrongPasswordBurst!' });

      if (res.status === 429) {
        hitRateLimit = true;
        expect(res.body.statusCode).toBe(429);
        break;
      }
    }

    expect(hitRateLimit).toBe(true);
  });
});
