import { z } from 'zod';
import {
  CurrencyCode,
  MeasurementStandard,
  ContractStandard,
  ProjectStatus,
  ProjectType,
  UnitSystem,
  SpatialNodeType,
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

export const projectTypeSchema = z.nativeEnum(ProjectType);
export const unitSystemSchema = z.nativeEnum(UnitSystem);
export const spatialNodeTypeSchema = z.nativeEnum(SpatialNodeType);

export const createProjectSchema = z.object({
  organizationId: uuidSchema.optional(),
  code: z
    .string()
    .min(2, 'Project code must be at least 2 characters')
    .max(20)
    .regex(/^[A-Za-z0-9_-]+$/, 'Project code must be alphanumeric with dashes or underscores'),
  name: z.string().min(2, 'Project name must be at least 2 characters').max(150),
  description: z.string().max(1000).optional(),
  projectType: z.nativeEnum(ProjectType).default(ProjectType.COMMERCIAL).optional(),
  country: z.string().length(2).default('LK'),
  location: z.string().max(250).optional(),
  clientName: z.string().max(150).optional(),
  contractorName: z.string().max(150).optional(),
  consultantName: z.string().max(150).optional(),
  projectManager: z.string().max(150).optional(),
  startDate: z.string().datetime().or(z.date()).optional().nullable(),
  expectedCompletionDate: z.string().datetime().or(z.date()).optional().nullable(),
  actualCompletionDate: z.string().datetime().or(z.date()).optional().nullable(),
  estimatedContractValue: z.number().or(z.string()).optional().nullable(),
  measurementStandard: z.nativeEnum(MeasurementStandard).default(MeasurementStandard.SLS_573),
  measurementUnitSystem: z.nativeEnum(UnitSystem).default(UnitSystem.METRIC).optional(),
  contractStandard: z.nativeEnum(ContractStandard).optional().nullable(),
  currency: z.nativeEnum(CurrencyCode).default(CurrencyCode.LKR),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.PLANNING),
});

export const updateProjectSchema = createProjectSchema.partial().omit({ organizationId: true });

export const addProjectMemberSchema = z.object({
  userId: uuidSchema,
  role: z.string().max(50).optional(),
});

// ==========================================
// 4b. Spatial Node Schemas
// ==========================================

export const createSpatialNodeSchema = z.object({
  parentNodeId: uuidSchema.optional().nullable(),
  nodeType: z.nativeEnum(SpatialNodeType).default(SpatialNodeType.BUILDING),
  name: z.string().min(1, 'Spatial node name is required').max(150).trim(),
  code: z.string().max(50).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  displayOrder: z.number().int().default(0),
  metadata: z.record(z.any()).optional().nullable(),
});

export const updateSpatialNodeSchema = createSpatialNodeSchema.partial().extend({
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

// ==========================================
// 4c. Work Package Schemas
// ==========================================

export const createWorkPackageSchema = z.object({
  parentPackageId: uuidSchema.optional().nullable(),
  code: z
    .string()
    .min(1, 'Package code is required')
    .max(50)
    .trim(),
  name: z.string().min(1, 'Package name is required').max(150).trim(),
  description: z.string().max(1000).optional().nullable(),
  displayOrder: z.number().int().default(0),
  metadata: z.record(z.any()).optional().nullable(),
});

export const updateWorkPackageSchema = createWorkPackageSchema.partial().extend({
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

// ==========================================
// 4d. Project Settings Schema
// ==========================================

export const updateProjectSettingsSchema = updateProjectSchema;

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
export type CreateSpatialNodeInput = z.infer<typeof createSpatialNodeSchema>;
export type UpdateSpatialNodeInput = z.infer<typeof updateSpatialNodeSchema>;
export type CreateWorkPackageInput = z.infer<typeof createWorkPackageSchema>;
export type UpdateWorkPackageInput = z.infer<typeof updateWorkPackageSchema>;
export type UpdateProjectSettingsInput = z.infer<typeof updateProjectSettingsSchema>;
export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;
