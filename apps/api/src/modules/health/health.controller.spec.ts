import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should return health status ok with service metadata', () => {
    const result = controller.check();
    expect(result).toBeDefined();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('buildmind-api');
    expect(result.version).toBe('5.0.0');
    expect(result.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(result.timestamp).toBeDefined();
  });
});
