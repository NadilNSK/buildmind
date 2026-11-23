import { Injectable } from '@nestjs/common';
import { HealthCheckResponse } from '@buildmind/shared-types';

@Injectable()
export class HealthService {
  private readonly startupTime = Date.now();

  getHealth(): HealthCheckResponse {
    const uptimeSeconds = Math.floor((Date.now() - this.startupTime) / 1000);
    return {
      status: 'ok',
      service: 'buildmind-api',
      version: '5.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptimeSeconds,
      timestamp: new Date().toISOString(),
      details: {
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        pid: process.pid,
      },
    };
  }
}
