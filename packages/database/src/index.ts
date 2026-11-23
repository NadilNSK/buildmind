import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __buildmind_prisma: PrismaClient | undefined;
}

const isProduction =
  typeof process !== 'undefined' && process.env && process.env['NODE_ENV'] === 'production';

export const createPrismaClient = (): PrismaClient => {
  return new PrismaClient({
    log: isProduction ? ['error'] : ['query', 'error', 'warn'],
  });
};

export const prisma: PrismaClient =
  globalThis.__buildmind_prisma ?? createPrismaClient();

if (!isProduction) {
  globalThis.__buildmind_prisma = prisma;
}

export * from '@prisma/client';
