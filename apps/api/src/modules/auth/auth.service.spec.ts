import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { AuditService } from './services/audit.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@buildmind/shared-types';

describe('AuthService (Unit)', () => {
  let service: AuthService;
  let passwordService: PasswordService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    session: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    emailVerificationToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    authAuditEvent: {
      create: jest.fn(),
    },
    $transaction: jest.fn((promises) => Promise.all(promises)),
  };

  const mockEmailService = {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    sendSecurityNotification: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        PasswordService,
        {
          provide: TokenService,
          useValue: {
            createSession: jest.fn().mockResolvedValue({
              tokens: {
                accessToken: 'mock-access-token',
                refreshToken: 'mock-refresh-token',
                tokenType: 'Bearer',
                expiresIn: 900,
              },
              sessionId: 'sess-123',
            }),
            rotateSession: jest.fn(),
            revokeSession: jest.fn().mockResolvedValue(true),
            revokeAllUserSessions: jest.fn().mockResolvedValue(2),
          },
        },
        {
          provide: AuditService,
          useValue: {
            logEvent: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    passwordService = module.get<PasswordService>(PasswordService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('PasswordService', () => {
    it('should hash and verify passwords with Argon2id', async () => {
      const plain = 'StrongPass123!';
      const hash = await passwordService.hashPassword(plain);
      expect(hash).toContain('$argon2id$');

      const isMatch = await passwordService.verifyPassword(hash, plain);
      expect(isMatch).toBe(true);

      const isMismatch = await passwordService.verifyPassword(hash, 'WrongPass123!');
      expect(isMismatch).toBe(false);
    });

    it('should deterministically hash tokens with SHA-256', () => {
      const token = 'random-token-xyz';
      const hash1 = passwordService.hashToken(token);
      const hash2 = passwordService.hashToken(token);
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'usr-1',
        email: 'dev@buildmind.test',
        fullName: 'Dev Lead',
        role: UserRole.QS_ENGINEER,
        isActive: true,
        isEmailVerified: false,
        accountStatus: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.emailVerificationToken.create.mockResolvedValue({});

      const result = await service.register({
        email: 'dev@buildmind.test',
        fullName: 'Dev Lead',
        password: 'ValidPassword123!',
      });

      expect(result.user.email).toBe('dev@buildmind.test');
      expect(result.tokens.accessToken).toBe('mock-access-token');
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should reject registration if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-usr' });

      await expect(
        service.register({
          email: 'existing@buildmind.test',
          fullName: 'Existing',
          password: 'ValidPassword123!',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should reject login for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'notfound@buildmind.test',
          password: 'ValidPassword123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject login for incorrect password', async () => {
      const hash = await passwordService.hashPassword('CorrectPass123!');
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'usr-1',
        email: 'dev@buildmind.test',
        passwordHash: hash,
        isActive: true,
        accountStatus: 'ACTIVE',
        role: UserRole.QS_ENGINEER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.login({
          email: 'dev@buildmind.test',
          password: 'WrongPassword123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject login for suspended accounts', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'usr-suspended',
        email: 'suspended@buildmind.test',
        isActive: true,
        accountStatus: 'SUSPENDED',
      });

      await expect(
        service.login({
          email: 'suspended@buildmind.test',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
