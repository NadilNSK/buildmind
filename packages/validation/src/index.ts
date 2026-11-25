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
  DocumentCategory,
  DocumentDiscipline,
  DocumentFileFormat,
  DocumentUploadStatus,
  DocumentScanStatus,
  DocumentWorkflowStatus,
  DrawingType,
  SheetSize,
  IssuePurpose,
  ReviewDecision,
  ReviewStatus,
  TransmittalStatus,
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
// 4e. Document Management Schemas (ES-05 / Phase 3B)
// ==========================================

export const documentCategorySchema = z.nativeEnum(DocumentCategory);
export const documentDisciplineSchema = z.nativeEnum(DocumentDiscipline);
export const documentFileFormatSchema = z.nativeEnum(DocumentFileFormat);
export const documentUploadStatusSchema = z.nativeEnum(DocumentUploadStatus);
export const documentScanStatusSchema = z.nativeEnum(DocumentScanStatus);

export const createUploadSessionSchema = z.object({
  declaredFilename: z
    .string()
    .min(1, 'Declared filename is required')
    .max(255, 'Filename cannot exceed 255 characters'),
  declaredMimeType: z.string().min(3).max(128),
  declaredSizeBytes: z
    .number()
    .int()
    .positive('Declared file size must be positive')
    .max(500 * 1024 * 1024, 'File size cannot exceed 500MB'),
  category: z.nativeEnum(DocumentCategory),
  discipline: z.nativeEnum(DocumentDiscipline).default(DocumentDiscipline.GENERAL),
  reference: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[A-Za-z0-9_.\-]+$/, 'Reference must be alphanumeric with dots, dashes or underscores')
    .optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  spatialNodeIds: z.array(uuidSchema).optional(),
  workPackageIds: z.array(uuidSchema).optional(),
  metadata: z.record(z.any()).optional().nullable(),
});

export const completeUploadSessionSchema = z.object({
  sessionId: uuidSchema,
  checksumSha256: z
    .string()
    .regex(/^[a-fA-F0-9]{64}$/, 'Must be a valid 64-character SHA-256 hexadecimal hash'),
  actualSizeBytes: z.number().int().positive().optional(),
  reference: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[A-Za-z0-9_.\-]+$/, 'Reference must be alphanumeric with dots, dashes or underscores')
    .optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  category: z.nativeEnum(DocumentCategory).optional(),
  discipline: z.nativeEnum(DocumentDiscipline).optional(),
  spatialNodeIds: z.array(uuidSchema).optional(),
  workPackageIds: z.array(uuidSchema).optional(),
  metadata: z.record(z.any()).optional().nullable(),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(255).optional(),
  reference: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[A-Za-z0-9_.\-]+$/, 'Reference must be alphanumeric with dots, dashes or underscores')
    .optional(),
  description: z.string().max(2000).optional().nullable(),
  category: z.nativeEnum(DocumentCategory).optional(),
  discipline: z.nativeEnum(DocumentDiscipline).optional(),
  metadata: z.record(z.any()).optional().nullable(),
});

export const updateDocumentLinksSchema = z.object({
  spatialNodeIds: z.array(uuidSchema).optional(),
  workPackageIds: z.array(uuidSchema).optional(),
});

export const documentQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  category: z.nativeEnum(DocumentCategory).optional(),
  discipline: z.nativeEnum(DocumentDiscipline).optional(),
  fileFormat: z.nativeEnum(DocumentFileFormat).optional(),
  uploadStatus: z.nativeEnum(DocumentUploadStatus).optional(),
  spatialNodeId: uuidSchema.optional(),
  workPackageId: uuidSchema.optional(),
  includeArchived: z.coerce.boolean().default(false),
});

// ==========================================
// Phase 3C Document Control & Drawing Schemas
// ==========================================

export const documentWorkflowStatusSchema = z.nativeEnum(DocumentWorkflowStatus);
export const drawingTypeSchema = z.nativeEnum(DrawingType);
export const sheetSizeSchema = z.nativeEnum(SheetSize);
export const issuePurposeSchema = z.nativeEnum(IssuePurpose);
export const reviewDecisionSchema = z.nativeEnum(ReviewDecision);
export const reviewStatusSchema = z.nativeEnum(ReviewStatus);
export const transmittalStatusSchema = z.nativeEnum(TransmittalStatus);

export const revisionCodeRegex = /^[A-Za-z0-9_.\-]+$/;

export const createDocumentVersionSchema = z.object({
  revisionCode: z
    .string()
    .min(1, 'Revision code cannot be empty')
    .max(20, 'Revision code too long')
    .regex(revisionCodeRegex, 'Revision code must be alphanumeric with dots, dashes or underscores'),
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  changeNote: z.string().max(2000).optional().nullable(),
  declaredScale: z.string().max(50).optional().nullable(),
  spatialNodeIds: z.array(uuidSchema).optional(),
  workPackageIds: z.array(uuidSchema).optional(),
});

export const createReviewRequestSchema = z.object({
  versionId: uuidSchema,
  assignedReviewerId: uuidSchema.optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
  comments: z.string().max(2000).optional().nullable(),
});

export const submitReviewDecisionSchema = z.object({
  decision: z.nativeEnum(ReviewDecision),
  comments: z.string().max(2000).optional().nullable(),
  decisionNote: z.string().max(2000).optional().nullable(),
});

export const createDrawingMetadataSchema = z.object({
  documentId: uuidSchema,
  drawingNumber: z.string().min(1, 'Drawing number is required').max(100),
  drawingTitle: z.string().min(1, 'Drawing title is required').max(255),
  discipline: z.nativeEnum(DocumentDiscipline).default(DocumentDiscipline.ARCHITECTURE),
  drawingType: z.nativeEnum(DrawingType).default(DrawingType.FLOOR_PLAN),
  originator: z.string().max(100).optional().nullable(),
  sheetNumber: z.string().max(50).optional().nullable(),
  sheetSize: z.nativeEnum(SheetSize).default(SheetSize.A1),
  declaredScale: z.string().max(50).optional().nullable(),
  issuePurpose: z.nativeEnum(IssuePurpose).default(IssuePurpose.FOR_INFORMATION),
});

export const updateDrawingMetadataSchema = createDrawingMetadataSchema.partial().extend({
  status: z.string().max(50).optional(),
});

export const transmittalRecipientSchema = z.object({
  name: z.string().min(1, 'Recipient name is required'),
  email: z.string().email('Valid recipient email is required'),
  organization: z.string().max(100).optional(),
  role: z.string().max(100).optional(),
});

export const createTransmittalSchema = z.object({
  reference: z
    .string()
    .min(1, 'Transmittal reference is required')
    .max(100)
    .regex(/^[A-Za-z0-9_.\-]+$/, 'Reference must be alphanumeric with dots, dashes or underscores'),
  subject: z.string().min(1, 'Subject is required').max(255),
  senderUserId: uuidSchema.optional(),
  authorizedRecipients: z.array(transmittalRecipientSchema).min(1, 'At least one recipient is required'),
  issuePurpose: z.nativeEnum(IssuePurpose).default(IssuePurpose.FOR_INFORMATION),
  issueDate: z.string().datetime().optional(),
  notes: z.string().max(2000).optional().nullable(),
  versionIds: z.array(uuidSchema).min(1, 'At least one document version must be included in transmittal'),
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
export type CreateSpatialNodeInput = z.infer<typeof createSpatialNodeSchema>;
export type UpdateSpatialNodeInput = z.infer<typeof updateSpatialNodeSchema>;
export type CreateWorkPackageInput = z.infer<typeof createWorkPackageSchema>;
export type UpdateWorkPackageInput = z.infer<typeof updateWorkPackageSchema>;
export type UpdateProjectSettingsInput = z.infer<typeof updateProjectSettingsSchema>;
export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;
export type CreateUploadSessionInput = z.infer<typeof createUploadSessionSchema>;
export type CompleteUploadSessionInput = z.infer<typeof completeUploadSessionSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type UpdateDocumentLinksInput = z.infer<typeof updateDocumentLinksSchema>;
export type DocumentQueryInput = z.infer<typeof documentQuerySchema>;
export type CreateDocumentVersionInput = z.infer<typeof createDocumentVersionSchema>;
export type CreateReviewRequestInput = z.infer<typeof createReviewRequestSchema>;
export type SubmitReviewDecisionInput = z.infer<typeof submitReviewDecisionSchema>;
export type CreateDrawingMetadataInput = z.infer<typeof createDrawingMetadataSchema>;
export type UpdateDrawingMetadataInput = z.infer<typeof updateDrawingMetadataSchema>;
export type CreateTransmittalInput = z.infer<typeof createTransmittalSchema>;
