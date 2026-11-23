import { z } from 'zod';
import {
  CurrencyCode,
  MeasurementStandard,
  ContractStandard,
  ProjectStatus,
  UserRole,
  OrganizationRole,
  MembershipStatus,
  InvitationStatus,
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

// Strong password requirement: 8-128 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special character
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password cannot exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// ==========================================
// 2. Organization Schemas
// ==========================================

export const organizationRoleSchema = z.nativeEnum(OrganizationRole);
export const membershipStatusSchema = z.nativeEnum(MembershipStatus);
export const invitationStatusSchema = z.nativeEnum(InvitationStatus);

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
  settings: z.record(z.any()).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Must be a valid email address').toLowerCase().trim(),
  role: z.nativeEnum(OrganizationRole).default(OrganizationRole.QS_ENGINEER),
});

export const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(OrganizationRole),
});

export const updateMemberStatusSchema = z.object({
  status: z.nativeEnum(MembershipStatus),
});

export const transferOwnershipSchema = z.object({
  newOwnerUserId: uuidSchema,
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(16, 'Invitation token is required'),
});

// ==========================================
// 3. User & Authentication Schemas
// ==========================================

export const registerSchema = z.object({
  email: z.string().email('Must be a valid email address').toLowerCase().trim(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100).trim(),
  password: passwordSchema,
  role: z.nativeEnum(UserRole).default(UserRole.QS_ENGINEER).optional(),
});

export const createUserSchema = registerSchema;

export const loginSchema = z.object({
  email: z.string().email('Must be a valid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10, 'Refresh token is required').optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Must be a valid email address').toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(16, 'Reset token is required'),
  newPassword: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(16, 'Verification token is required'),
});

export const resendVerificationSchema = z.object({
  email: z.string().email('Must be a valid email address').toLowerCase().trim(),
});

// ==========================================
// 4. Project Schemas
// ==========================================

export const createProjectSchema = z.object({
  organizationId: uuidSchema.optional(),
  code: z
    .string()
    .min(2, 'Project code must be at least 2 characters')
    .max(20)
    .regex(/^[A-Za-z0-9_-]+$/, 'Project code must be alphanumeric with dashes or underscores'),
  name: z.string().min(2, 'Project name must be at least 2 characters').max(150),
  description: z.string().max(1000).optional(),
  country: z.string().length(2).default('LK'),
  measurementStandard: z.nativeEnum(MeasurementStandard).default(MeasurementStandard.SLS_573),
  contractStandard: z.nativeEnum(ContractStandard).optional(),
  currency: z.nativeEnum(CurrencyCode).default(CurrencyCode.LKR),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.PLANNING),
});

export const updateProjectSchema = createProjectSchema.partial().omit({ organizationId: true });

export const addProjectMemberSchema = z.object({
  userId: uuidSchema,
  role: z.string().max(50).optional(),
});

// ==========================================
// 5. Schema Inferred Types
// ==========================================

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type UpdateMemberStatusInput = z.infer<typeof updateMemberStatusSchema>;
export type TransferOwnershipInput = z.infer<typeof transferOwnershipSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;
