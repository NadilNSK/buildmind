if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {
    try {
      process.loadEnvFile('../../.env');
    } catch {
      // env already loaded or file missing
    }
  }
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import * as crypto from 'crypto';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Correlation ID middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const correlationId =
      (req.headers['x-correlation-id'] as string) || `req-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    req.headers['x-correlation-id'] = correlationId;
    res.setHeader('x-correlation-id', correlationId);
    next();
  });

  // Cookie parser for secure HttpOnly session tokens
  app.use(cookieParser());

  // Global prefix: /api/v1
  app.setGlobalPrefix('api/v1');

  // CORS configuration
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Global Validation Pipe with strict settings
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global structured exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.API_PORT || 4001;
  await app.listen(port);
  logger.log(`BuildMind AI API v5.0 started on port ${port} with prefix /api/v1`);
  logger.log(`Public Health endpoint: http://localhost:${port}/api/v1/health`);
  logger.log(`Auth endpoints available at: http://localhost:${port}/api/v1/auth/*`);
}

void bootstrap();
