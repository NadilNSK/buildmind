import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';

describe('BuildMind AI API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health returns 200 OK with system telemetry', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('buildmind-api');
    expect(res.body.version).toBe('5.0.0');
    expect(res.body.environment).toBeDefined();
    expect(typeof res.body.uptimeSeconds).toBe('number');
  });

  it('GET /api/v1/qs/capabilities returns exactly 24 approved enterprise capabilities', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/qs/capabilities')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(24);

    const ids = res.body.data.map((c: { id: string }) => c.id);
    // Verify 12 QS modules
    for (let i = 1; i <= 12; i++) {
      const code = `QS-${i.toString().padStart(2, '0')}`;
      expect(ids).toContain(code);
    }
    // Verify 7 Shared Systems
    for (let i = 1; i <= 7; i++) {
      const code = `ES-${i.toString().padStart(2, '0')}`;
      expect(ids).toContain(code);
    }
    // Verify Smart Selective QS
    expect(ids).toContain('SSQ-01');
    // Verify 4 Advanced Features
    expect(ids).toContain('AF-01');
    expect(ids).toContain('AF-02');
    expect(ids).toContain('AF-03');
    expect(ids).toContain('AF-04');
  });

  it('GET /api/v1/organizations/:id returns structured 501 for unauthenticated access', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/organizations/test-id-123')
      .expect(501);

    expect(res.body.success).toBe(false);
    expect(res.body.statusCode).toBe(501);
    expect(res.body.error).toBe('Not Implemented');
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.correlationId).toBeDefined();
  });
});
