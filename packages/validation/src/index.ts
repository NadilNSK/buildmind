import { z } from 'zod';
import {
  CurrencyCode,
  MeasurementStandard,
  ContractStandard,
  ProjectStatus,
  UserRole,
  OrganizationStatus,
} from '@buildmind/shared-types';

// ==========================================
// 1. Common Schema Primitives
// ==========================================

export const uuidSchema = z.string().uuid({ message: 'Must be a valid UUID' });

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ==========================================
// 2. Organization Schemas
// ==========================================

export const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters').max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must consist of lowercase alphanumeric characters and hyphens'),
  country: z.string().length(2).default('LK'),
  defaultCurrency: z.nativeEnum(CurrencyCode).default(CurrencyCode.LKR),
});

export const updateOrganizationSchema = createOrganizationSchema.partial().extend({
  status: z.nativeEnum(OrganizationStatus).optional(),
});

// ==========================================
// 3. User Schemas
// ==========================================

export const createUserSchema = z.object({
  email: z.string().email('Must be a valid email address'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one digit'),
  role: z.nativeEnum(UserRole).default(UserRole.QS_ENGINEER),
});

export const loginSchema = z.object({
  email: z.string().email('Must be a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ==========================================
// 4. Project Schemas
// ==========================================

export const createProjectSchema = z.object({
  organizationId: uuidSchema,
  code: z
    .string()
    .min(2, 'Project code must be at least 2 characters')
    .max(20)
    .regex(/^[A-Z0-9_-]+$/, 'Project code must be uppercase alphanumeric with dashes/underscores'),
  name: z.string().min(2, 'Project name must be at least 2 characters').max(150),
  description: z.string().max(1000).optional(),
  country: z.string().length(2).default('LK'),
  measurementStandard: z.nativeEnum(MeasurementStandard).default(MeasurementStandard.SLS_573),
  contractStandard: z.nativeEnum(ContractStandard).optional(),
  currency: z.nativeEnum(CurrencyCode).default(CurrencyCode.LKR),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.PLANNING),
});

export const updateProjectSchema = createProjectSchema.partial().omit({ organizationId: true });

// ==========================================
// 5. Schema Inferred Types
// ==========================================

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;
