/**
 * BuildMind AI v5.0 — Core Domain Enums & Contracts
 * Enterprise Quantity Surveying & Commercial Management Platform
 */

// ==========================================
// 1. Regional & Standard Enums
// ==========================================

export enum MeasurementStandard {
  SLS_573 = 'SLS_573', // Sri Lanka Standard Method of Measurement (Building Works)
  CESMM4 = 'CESMM4',   // Civil Engineering Standard Method of Measurement
  NRM1 = 'NRM1',       // RICS New Rules of Measurement 1 (Order of cost estimating)
  NRM2 = 'NRM2',       // RICS New Rules of Measurement 2 (Detailed measurement)
  NRM3 = 'NRM3',       // RICS New Rules of Measurement 3 (Maintenance & lifecycle)
  SMM7 = 'SMM7',       // Standard Method of Measurement 7 (Legacy UK/Commonwealth)
  POMI = 'POMI',       // Principles of Measurement International
  CUSTOM = 'CUSTOM',   // Custom or Other Client Specification Standard
}

export enum ContractStandard {
  FIDIC_RED = 'FIDIC_RED',           // FIDIC Conditions of Contract for Construction (Red Book)
  FIDIC_YELLOW = 'FIDIC_YELLOW',     // FIDIC Plant and Design-Build (Yellow Book)
  CIDA_SBD_01 = 'CIDA_SBD_01',       // Major Contracts (> LKR 100M) - Sri Lanka
  CIDA_SBD_02 = 'CIDA_SBD_02',       // Minor Contracts (< LKR 100M) - Sri Lanka
  CIDA_SBD_03 = 'CIDA_SBD_03',       // Design & Build Contracts - Sri Lanka
  JCT = 'JCT',                       // Joint Contracts Tribunal (International reference)
}

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  DESIGN = 'DESIGN',
  TENDERING = 'TENDERING',
  PRE_CONSTRUCTION = 'PRE_CONSTRUCTION',
  UNDER_CONSTRUCTION = 'UNDER_CONSTRUCTION',
  ACTIVE = 'ACTIVE', // Alias for backward compatibility
  ON_HOLD = 'ON_HOLD',
  COMMERCIAL_CLOSEOUT = 'COMMERCIAL_CLOSEOUT',
  FINAL_ACCOUNT = 'FINAL_ACCOUNT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ARCHIVED = 'ARCHIVED',
}

export enum ProjectType {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
  INDUSTRIAL = 'INDUSTRIAL',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  EDUCATIONAL = 'EDUCATIONAL',
  HEALTHCARE = 'HEALTHCARE',
  HOSPITALITY = 'HOSPITALITY',
  MIXED_USE = 'MIXED_USE',
  RENOVATION = 'RENOVATION',
  OTHER = 'OTHER',
}

export enum UnitSystem {
  METRIC = 'METRIC',
  IMPERIAL = 'IMPERIAL',
}

export enum SpatialNodeType {
  SITE = 'SITE',
  BUILDING = 'BUILDING',
  BLOCK = 'BLOCK',
  LEVEL = 'LEVEL',
  ZONE = 'ZONE',
  ROOM = 'ROOM',
  OTHER = 'OTHER',
}

// ==========================================
// 1b. Document Management Enums (ES-05 / Phase 3B)
// ==========================================

export enum DocumentCategory {
  ARCHITECTURAL_DRAWING = 'ARCHITECTURAL_DRAWING',
  STRUCTURAL_DRAWING = 'STRUCTURAL_DRAWING',
  CIVIL_DRAWING = 'CIVIL_DRAWING',
  MECHANICAL_DRAWING = 'MECHANICAL_DRAWING',
  ELECTRICAL_DRAWING = 'ELECTRICAL_DRAWING',
  PLUMBING_DRAWING = 'PLUMBING_DRAWING',
  FIRE_PROTECTION_DRAWING = 'FIRE_PROTECTION_DRAWING',
  LANDSCAPE_DRAWING = 'LANDSCAPE_DRAWING',
  BIM_MODEL = 'BIM_MODEL',
  SPECIFICATION = 'SPECIFICATION',
  BILL_OF_QUANTITIES = 'BILL_OF_QUANTITIES',
  CONTRACT = 'CONTRACT',
  TENDER_DOCUMENT = 'TENDER_DOCUMENT',
  COST_SCHEDULE = 'COST_SCHEDULE',
  SITE_PHOTOGRAPH = 'SITE_PHOTOGRAPH',
  REPORT = 'REPORT',
  CORRESPONDENCE = 'CORRESPONDENCE',
  OTHER = 'OTHER',
}

export enum DocumentDiscipline {
  ARCHITECTURE = 'ARCHITECTURE',
  STRUCTURE = 'STRUCTURE',
  CIVIL = 'CIVIL',
  MECHANICAL = 'MECHANICAL',
  ELECTRICAL = 'ELECTRICAL',
  PLUMBING = 'PLUMBING',
  FIRE_PROTECTION = 'FIRE_PROTECTION',
  LANDSCAPE = 'LANDSCAPE',
  QUANTITY_SURVEYING = 'QUANTITY_SURVEYING',
  COMMERCIAL = 'COMMERCIAL',
  GENERAL = 'GENERAL',
}

export enum DocumentFileFormat {
  PDF = 'PDF',
  DOCX = 'DOCX',
  XLSX = 'XLSX',
  CSV = 'CSV',
  TXT = 'TXT',
  IFC = 'IFC',
  DWG = 'DWG',
  DXF = 'DXF',
  PNG = 'PNG',
  JPG = 'JPG',
  JPEG = 'JPEG',
  TIFF = 'TIFF',
}

export enum DocumentUploadStatus {
  PENDING = 'PENDING',
  UPLOADING = 'UPLOADING',
  QUARANTINED = 'QUARANTINED',
  VALIDATING = 'VALIDATING',
  READY = 'READY',
  REJECTED = 'REJECTED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

export enum DocumentScanStatus {
  CLEAN = 'CLEAN',
  PENDING_SCAN = 'PENDING_SCAN',
  FLAGGED = 'FLAGGED',
  UNSCANNED = 'UNSCANNED',
}

export enum CurrencyCode {
  LKR = 'LKR', // Sri Lankan Rupee (Primary target)
  USD = 'USD', // US Dollar
  GBP = 'GBP', // British Pound
  EUR = 'EUR', // Euro
  AED = 'AED', // UAE Dirham
  SGD = 'SGD', // Singapore Dollar
  AUD = 'AUD', // Australian Dollar
}

// ==========================================
// 2. Identity, Organization & Roles
// ==========================================

export enum UserRole {
  GLOBAL_ADMIN = 'GLOBAL_ADMIN',
  COMMERCIAL_DIRECTOR = 'COMMERCIAL_DIRECTOR',
  SENIOR_QS = 'SENIOR_QS',
  QS_ENGINEER = 'QS_ENGINEER',
  ESTIMATOR = 'ESTIMATOR',
  AUDITOR = 'AUDITOR',
  VIEWER = 'VIEWER',
}

export enum OrganizationRole {
  ORGANIZATION_OWNER = 'ORGANIZATION_OWNER',
  ORGANIZATION_ADMIN = 'ORGANIZATION_ADMIN',
  COMMERCIAL_DIRECTOR = 'COMMERCIAL_DIRECTOR',
  SENIOR_QS = 'SENIOR_QS',
  QS_ENGINEER = 'QS_ENGINEER',
  ESTIMATOR = 'ESTIMATOR',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  AUDITOR = 'AUDITOR',
  VIEWER = 'VIEWER',
}

export enum MembershipStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

export enum OrganizationStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

// ==========================================
// 2b. RBAC Permission Registry & Matrix
// ==========================================

export type PermissionKey =
  | 'organization.view'
  | 'organization.update'
  | 'organization.delete'
  | 'organization.manage_members'
  | 'organization.transfer_ownership'
  | 'organization.manage_billing'
  | 'projects.create'
  | 'projects.view'
  | 'projects.update'
  | 'projects.delete'
  | 'projects.manage_access'
  | 'projects.settings.view'
  | 'projects.settings.edit'
  | 'projects.spatial.view'
  | 'projects.spatial.manage'
  | 'projects.wbs.view'
  | 'projects.wbs.manage'
  | 'documents.view'
  | 'documents.upload'
  | 'documents.download'
  | 'documents.update'
  | 'documents.archive'
  | 'documents.restore'
  | 'documents.link'
  | 'documents.storage_usage'
  | 'drawings.view'
  | 'drawings.upload'
  | 'drawings.update'
  | 'drawings.delete'
  | 'takeoff.view'
  | 'takeoff.create'
  | 'takeoff.update'
  | 'takeoff.delete'
  | 'takeoff.approve'
  | 'estimates.view'
  | 'estimates.create'
  | 'estimates.update'
  | 'estimates.delete'
  | 'estimates.approve'
  | 'boq.view'
  | 'boq.create'
  | 'boq.update'
  | 'boq.delete'
  | 'boq.export'
  | 'boq.lock'
  | 'budgets.view'
  | 'budgets.create'
  | 'budgets.update'
  | 'budgets.delete'
  | 'budgets.approve'
  | 'tenders.view'
  | 'tenders.create'
  | 'tenders.update'
  | 'tenders.delete'
  | 'tenders.evaluate'
  | 'contracts.view'
  | 'contracts.create'
  | 'contracts.update'
  | 'contracts.delete'
  | 'contracts.administer'
  | 'procurement.view'
  | 'procurement.create'
  | 'procurement.update'
  | 'procurement.manage'
  | 'valuations.view'
  | 'valuations.create'
  | 'valuations.certify'
  | 'variations.view'
  | 'variations.create'
  | 'variations.approve'
  | 'reports.view'
  | 'reports.export'
  | 'audit.view'
  | 'audit.export';

export const ALL_PERMISSIONS: PermissionKey[] = [
  'organization.view',
  'organization.update',
  'organization.delete',
  'organization.manage_members',
  'organization.transfer_ownership',
  'organization.manage_billing',
  'projects.create',
  'projects.view',
  'projects.update',
  'projects.delete',
  'projects.manage_access',
  'projects.settings.view',
  'projects.settings.edit',
  'projects.spatial.view',
  'projects.spatial.manage',
  'projects.wbs.view',
  'projects.wbs.manage',
  'documents.view',
  'documents.upload',
  'documents.download',
  'documents.update',
  'documents.archive',
  'documents.restore',
  'documents.link',
  'documents.storage_usage',
  'drawings.view',
  'drawings.upload',
  'drawings.update',
  'drawings.delete',
  'takeoff.view',
  'takeoff.create',
  'takeoff.update',
  'takeoff.delete',
  'takeoff.approve',
  'estimates.view',
  'estimates.create',
  'estimates.update',
  'estimates.delete',
  'estimates.approve',
  'boq.view',
  'boq.create',
  'boq.update',
  'boq.delete',
  'boq.export',
  'boq.lock',
  'budgets.view',
  'budgets.create',
  'budgets.update',
  'budgets.delete',
  'budgets.approve',
  'tenders.view',
  'tenders.create',
  'tenders.update',
  'tenders.delete',
  'tenders.evaluate',
  'contracts.view',
  'contracts.create',
  'contracts.update',
  'contracts.delete',
  'contracts.administer',
  'procurement.view',
  'procurement.create',
  'procurement.update',
  'procurement.manage',
  'valuations.view',
  'valuations.create',
  'valuations.certify',
  'variations.view',
  'variations.create',
  'variations.approve',
  'reports.view',
  'reports.export',
  'audit.view',
  'audit.export',
];

export const ROLE_PERMISSIONS: Record<OrganizationRole, readonly PermissionKey[]> = {
  [OrganizationRole.ORGANIZATION_OWNER]: ALL_PERMISSIONS,
  [OrganizationRole.ORGANIZATION_ADMIN]: ALL_PERMISSIONS.filter(
    (p) => p !== 'organization.delete' && p !== 'organization.transfer_ownership',
  ),
  [OrganizationRole.COMMERCIAL_DIRECTOR]: [
    'organization.view',
    'projects.create',
    'projects.view',
    'projects.update',
    'projects.manage_access',
    'projects.settings.view',
    'projects.settings.edit',
    'projects.spatial.view',
    'projects.spatial.manage',
    'projects.wbs.view',
    'projects.wbs.manage',
    'documents.view',
    'documents.upload',
    'documents.download',
    'documents.update',
    'documents.archive',
    'documents.restore',
    'documents.link',
    'documents.storage_usage',
    'drawings.view',
    'drawings.upload',
    'takeoff.view',
    'takeoff.approve',
    'estimates.view',
    'estimates.approve',
    'boq.view',
    'boq.export',
    'boq.lock',
    'budgets.view',
    'budgets.create',
    'budgets.update',
    'budgets.approve',
    'tenders.view',
    'tenders.create',
    'tenders.update',
    'tenders.evaluate',
    'contracts.view',
    'contracts.create',
    'contracts.update',
    'contracts.administer',
    'procurement.view',
    'procurement.manage',
    'valuations.view',
    'valuations.certify',
    'variations.view',
    'variations.approve',
    'reports.view',
    'reports.export',
    'audit.view',
  ],
  [OrganizationRole.SENIOR_QS]: [
    'organization.view',
    'projects.view',
    'projects.update',
    'projects.settings.view',
    'projects.settings.edit',
    'projects.spatial.view',
    'projects.spatial.manage',
    'projects.wbs.view',
    'projects.wbs.manage',
    'documents.view',
    'documents.upload',
    'documents.download',
    'documents.update',
    'documents.archive',
    'documents.restore',
    'documents.link',
    'documents.storage_usage',
    'drawings.view',
    'drawings.upload',
    'drawings.update',
    'takeoff.view',
    'takeoff.create',
    'takeoff.update',
    'takeoff.approve',
    'estimates.view',
    'estimates.create',
    'estimates.update',
    'boq.view',
    'boq.create',
    'boq.update',
    'boq.export',
    'budgets.view',
    'budgets.create',
    'budgets.update',
    'tenders.view',
    'tenders.create',
    'tenders.evaluate',
    'contracts.view',
    'procurement.view',
    'procurement.create',
    'valuations.view',
    'valuations.create',
    'variations.view',
    'variations.create',
    'reports.view',
    'reports.export',
    'audit.view',
  ],
  [OrganizationRole.QS_ENGINEER]: [
    'organization.view',
    'projects.view',
    'projects.settings.view',
    'projects.spatial.view',
    'projects.spatial.manage',
    'projects.wbs.view',
    'projects.wbs.manage',
    'documents.view',
    'documents.upload',
    'documents.download',
    'documents.update',
    'documents.link',
    'documents.storage_usage',
    'drawings.view',
    'drawings.upload',
    'takeoff.view',
    'takeoff.create',
    'takeoff.update',
    'estimates.view',
    'estimates.create',
    'estimates.update',
    'boq.view',
    'boq.create',
    'boq.update',
    'boq.export',
    'budgets.view',
    'tenders.view',
    'contracts.view',
    'procurement.view',
    'valuations.view',
    'valuations.create',
    'variations.view',
    'variations.create',
    'reports.view',
  ],
  [OrganizationRole.ESTIMATOR]: [
    'organization.view',
    'projects.view',
    'projects.settings.view',
    'projects.spatial.view',
    'projects.wbs.view',
    'documents.view',
    'documents.upload',
    'documents.download',
    'documents.link',
    'drawings.view',
    'takeoff.view',
    'takeoff.create',
    'takeoff.update',
    'estimates.view',
    'estimates.create',
    'estimates.update',
    'boq.view',
    'boq.create',
    'boq.update',
    'boq.export',
    'budgets.view',
    'reports.view',
  ],
  [OrganizationRole.PROJECT_MANAGER]: [
    'organization.view',
    'projects.create',
    'projects.view',
    'projects.update',
    'projects.manage_access',
    'projects.settings.view',
    'projects.settings.edit',
    'projects.spatial.view',
    'projects.spatial.manage',
    'projects.wbs.view',
    'projects.wbs.manage',
    'documents.view',
    'documents.upload',
    'documents.download',
    'documents.update',
    'documents.archive',
    'documents.restore',
    'documents.link',
    'documents.storage_usage',
    'drawings.view',
    'drawings.upload',
    'drawings.update',
    'takeoff.view',
    'estimates.view',
    'boq.view',
    'budgets.view',
    'budgets.update',
    'tenders.view',
    'contracts.view',
    'contracts.update',
    'procurement.view',
    'procurement.create',
    'procurement.manage',
    'valuations.view',
    'variations.view',
    'variations.create',
    'reports.view',
    'reports.export',
  ],
  [OrganizationRole.AUDITOR]: [
    'organization.view',
    'projects.view',
    'projects.settings.view',
    'projects.spatial.view',
    'projects.wbs.view',
    'documents.view',
    'documents.download',
    'documents.storage_usage',
    'drawings.view',
    'takeoff.view',
    'estimates.view',
    'boq.view',
    'budgets.view',
    'tenders.view',
    'contracts.view',
    'procurement.view',
    'valuations.view',
    'variations.view',
    'reports.view',
    'reports.export',
    'audit.view',
    'audit.export',
  ],
  [OrganizationRole.VIEWER]: [
    'organization.view',
    'projects.view',
    'projects.settings.view',
    'projects.spatial.view',
    'projects.wbs.view',
    'documents.view',
    'documents.download',
    'drawings.view',
    'reports.view',
  ],
};

export function hasPermission(role: OrganizationRole | string, permission: PermissionKey): boolean {
  const allowed = ROLE_PERMISSIONS[role as OrganizationRole];
  if (!allowed) return false;
  return allowed.includes(permission);
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export enum AuthAuditEventType {
  REGISTER_SUCCESS = 'REGISTER_SUCCESS',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  LOGOUT_ALL = 'LOGOUT_ALL',
  REFRESH_SUCCESS = 'REFRESH_SUCCESS',
  REFRESH_REUSE_DETECTED = 'REFRESH_REUSE_DETECTED',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED = 'PASSWORD_RESET_COMPLETED',
  EMAIL_VERIFICATION_REQUESTED = 'EMAIL_VERIFICATION_REQUESTED',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
}

export interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  accountStatus: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  country: string;
  defaultCurrency: CurrencyCode;
  status: OrganizationStatus;
  settings?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  currentUserRole?: OrganizationRole;
  memberCount?: number;
  projectCount?: number;
}

export interface MembershipSummary {
  id: string;
  userId: string;
  organizationId: string;
  role: OrganizationRole;
  status: MembershipStatus;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
  };
}

export interface OrganizationMemberSummary {
  id: string;
  userId: string;
  organizationId: string;
  role: OrganizationRole;
  status: MembershipStatus;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
}

export interface OrganizationInvitationSummary {
  id: string;
  organizationId: string;
  email: string;
  role: OrganizationRole;
  status: InvitationStatus;
  invitedById: string;
  invitedBy?: {
    id: string;
    email: string;
    fullName: string;
  };
  expiresAt: string;
  acceptedAt?: string | null;
  createdAt: string;
}

export interface ProjectMemberSummary {
  id: string;
  projectId: string;
  userId: string;
  role?: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
}

export interface CreateOrganizationDto {
  name: string;
  slug: string;
  country?: string;
  defaultCurrency?: CurrencyCode;
}

export interface UpdateOrganizationDto {
  name?: string;
  slug?: string;
  country?: string;
  defaultCurrency?: CurrencyCode;
  status?: OrganizationStatus;
  settings?: Record<string, any>;
}

export interface InviteMemberDto {
  email: string;
  role: OrganizationRole;
}

export interface UpdateMemberRoleDto {
  role: OrganizationRole;
}

export interface UpdateMemberStatusDto {
  status: MembershipStatus;
}

export interface TransferOwnershipDto {
  newOwnerUserId: string;
}

export interface AcceptInvitationDto {
  token: string;
}

export interface CreateProjectDto {
  code: string;
  name: string;
  description?: string;
  projectType?: ProjectType;
  country?: string;
  location?: string;
  clientName?: string;
  contractorName?: string;
  consultantName?: string;
  projectManager?: string;
  startDate?: string;
  expectedCompletionDate?: string;
  actualCompletionDate?: string;
  estimatedContractValue?: number | string | null;
  measurementStandard?: MeasurementStandard;
  measurementUnitSystem?: UnitSystem;
  contractStandard?: ContractStandard;
  currency?: CurrencyCode;
  status?: ProjectStatus;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  projectType?: ProjectType;
  country?: string;
  location?: string;
  clientName?: string;
  contractorName?: string;
  consultantName?: string;
  projectManager?: string;
  startDate?: string | null;
  expectedCompletionDate?: string | null;
  actualCompletionDate?: string | null;
  estimatedContractValue?: number | string | null;
  measurementStandard?: MeasurementStandard;
  measurementUnitSystem?: UnitSystem;
  contractStandard?: ContractStandard | null;
  currency?: CurrencyCode;
  status?: ProjectStatus;
}

export interface AddProjectMemberDto {
  userId: string;
  role?: string;
}

export interface ProjectSummary {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description?: string | null;
  projectType: ProjectType;
  status: ProjectStatus;
  location?: string | null;
  country: string;
  clientName?: string | null;
  contractorName?: string | null;
  consultantName?: string | null;
  projectManager?: string | null;
  startDate?: string | null;
  expectedCompletionDate?: string | null;
  actualCompletionDate?: string | null;
  estimatedContractValue?: string | number | null;
  currency: CurrencyCode;
  measurementStandard: MeasurementStandard;
  measurementUnitSystem: UnitSystem;
  contractStandard?: ContractStandard | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
  createdBy?: {
    id: string;
    email: string;
    fullName: string;
  };
  memberCount?: number;
  spatialNodeCount?: number;
  workPackageCount?: number;
}

export interface SpatialNodeSummary {
  id: string;
  projectId: string;
  parentNodeId?: string | null;
  nodeType: SpatialNodeType;
  name: string;
  code?: string | null;
  description?: string | null;
  displayOrder: number;
  status: 'ACTIVE' | 'ARCHIVED';
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  children?: SpatialNodeSummary[];
}

export interface CreateSpatialNodeDto {
  parentNodeId?: string | null;
  nodeType?: SpatialNodeType;
  name: string;
  code?: string;
  description?: string;
  displayOrder?: number;
  metadata?: Record<string, any>;
}

export interface UpdateSpatialNodeDto {
  parentNodeId?: string | null;
  nodeType?: SpatialNodeType;
  name?: string;
  code?: string;
  description?: string;
  displayOrder?: number;
  status?: 'ACTIVE' | 'ARCHIVED';
  metadata?: Record<string, any>;
}

export interface WorkPackageSummary {
  id: string;
  projectId: string;
  parentPackageId?: string | null;
  code: string;
  name: string;
  description?: string | null;
  displayOrder: number;
  status: 'ACTIVE' | 'ARCHIVED';
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  children?: WorkPackageSummary[];
}

export interface CreateWorkPackageDto {
  parentPackageId?: string | null;
  code: string;
  name: string;
  description?: string;
  displayOrder?: number;
  metadata?: Record<string, any>;
}

export interface UpdateWorkPackageDto {
  parentPackageId?: string | null;
  code?: string;
  name?: string;
  description?: string;
  displayOrder?: number;
  status?: 'ACTIVE' | 'ARCHIVED';
  metadata?: Record<string, any>;
}

export interface ProjectSettingsDto {
  id: string;
  projectId: string;
  name: string;
  code: string;
  description?: string | null;
  projectType: ProjectType;
  status: ProjectStatus;
  location?: string | null;
  country: string;
  clientName?: string | null;
  contractorName?: string | null;
  consultantName?: string | null;
  projectManager?: string | null;
  startDate?: string | null;
  expectedCompletionDate?: string | null;
  actualCompletionDate?: string | null;
  estimatedContractValue?: string | number | null;
  currency: CurrencyCode;
  measurementStandard: MeasurementStandard;
  measurementUnitSystem: UnitSystem;
  contractStandard?: ContractStandard | null;
  updatedAt: string;
}

export interface UpdateProjectSettingsDto {
  name?: string;
  description?: string;
  projectType?: ProjectType;
  status?: ProjectStatus;
  location?: string;
  country?: string;
  clientName?: string;
  contractorName?: string;
  consultantName?: string;
  projectManager?: string;
  startDate?: string | null;
  expectedCompletionDate?: string | null;
  actualCompletionDate?: string | null;
  estimatedContractValue?: string | number | null;
  currency?: CurrencyCode;
  measurementStandard?: MeasurementStandard;
  measurementUnitSystem?: UnitSystem;
  contractStandard?: ContractStandard | null;
}

export interface ProjectOverviewSummary {
  project: ProjectSummary;
  stats: {
    totalMembers: number;
    totalSpatialNodes: number;
    totalWorkPackages: number;
  };
  recentActivities: Array<{
    id: string;
    eventType: string;
    actorEmail?: string;
    description: string;
    timestamp: string;
  }>;
}

// ==========================================
// 2c. Document Management DTOs & Contracts
// ==========================================

export interface DocumentSummary {
  id: string;
  organizationId: string;
  projectId: string;
  reference: string;
  title: string;
  description?: string | null;
  category: DocumentCategory | string;
  discipline: DocumentDiscipline | string;
  originalFilename: string;
  fileFormat: DocumentFileFormat | string;
  mimeType: string;
  fileSizeBytes: string;
  storageObjectKey: string;
  checksumSha256: string;
  uploadStatus: DocumentUploadStatus | string;
  securityScanStatus: DocumentScanStatus | string;
  uploadedById: string;
  archivedAt?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  uploadedBy?: {
    id: string;
    email: string;
    fullName: string;
  };
  spatialLinkCount?: number;
  workPackageLinkCount?: number;
}

export interface DocumentDetails extends DocumentSummary {
  spatialLinks: Array<{
    id: string;
    spatialNodeId: string;
    spatialNode: {
      id: string;
      name: string;
      code?: string | null;
      nodeType: string;
    };
  }>;
  workPackageLinks: Array<{
    id: string;
    workPackageId: string;
    workPackage: {
      id: string;
      name: string;
      code: string;
    };
  }>;
}

export interface DocumentUploadSessionSummary {
  id: string;
  organizationId: string;
  projectId: string;
  userId: string;
  documentId?: string | null;
  declaredFilename: string;
  declaredMimeType: string;
  declaredSizeBytes: string;
  category: string;
  discipline: string;
  storageKey: string;
  status: string;
  checksumSha256?: string | null;
  actualSizeBytes?: string | null;
  metadata?: Record<string, any> | null;
  expiresAt: string;
  completedAt?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUploadSessionDto {
  declaredFilename: string;
  declaredMimeType: string;
  declaredSizeBytes: number | string;
  category: DocumentCategory | string;
  discipline?: DocumentDiscipline | string;
  reference?: string;
  title?: string;
  description?: string;
  spatialNodeIds?: string[];
  workPackageIds?: string[];
  metadata?: Record<string, any>;
}

export interface CompleteUploadSessionDto {
  sessionId: string;
  checksumSha256: string;
  actualSizeBytes?: number | string;
  reference?: string;
  title?: string;
  description?: string;
  category?: DocumentCategory | string;
  discipline?: DocumentDiscipline | string;
  spatialNodeIds?: string[];
  workPackageIds?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateDocumentDto {
  title?: string;
  reference?: string;
  description?: string | null;
  category?: DocumentCategory | string;
  discipline?: DocumentDiscipline | string;
  metadata?: Record<string, any> | null;
}

export interface UpdateDocumentLinksDto {
  spatialNodeIds?: string[];
  workPackageIds?: string[];
}

export interface StorageUsageSummary {
  totalBytes: string;
  totalBytesFormatted: string;
  totalDocuments: number;
  totalUploadSessions: number;
  byCategory: Array<{
    category: string;
    count: number;
    bytes: string;
  }>;
  byFormat: Array<{
    format: string;
    count: number;
    bytes: string;
  }>;
}

// ==========================================
// 3. Authentication DTOs & Contracts
// ==========================================

export interface JwtPayload {
  sub: string;       // User UUID
  email: string;     // User Email
  role: UserRole;    // System Role
  sessionId?: string; // Associated Session UUID
  type?: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  tokenType: 'Bearer';
  expiresIn: number; // in seconds
}

export interface AuthResponse {
  user: UserSummary;
  tokens: AuthTokens;
  message?: string;
}

export interface RegisterDto {
  email: string;
  fullName: string;
  password: string;
  role?: UserRole;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshTokenDto {
  refreshToken?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface VerifyEmailDto {
  token: string;
}

export interface ResendVerificationDto {
  email: string;
}

export interface UserSessionSummary {
  id: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent?: boolean;
}

// ==========================================
// 4. Approved 24 Capabilities Catalog
// ==========================================

export enum QSModuleId {
  // 12 QS Core Modules
  QS_01 = 'QS-01', // Quantity Takeoff
  QS_02 = 'QS-02', // Cost Estimation
  QS_03 = 'QS-03', // BOQ Generation
  QS_04 = 'QS-04', // Budget Planning
  QS_05 = 'QS-05', // Tender Management
  QS_06 = 'QS-06', // Contract Administration
  QS_07 = 'QS-07', // Procurement Management
  QS_08 = 'QS-08', // Cost Control & Monitoring
  QS_09 = 'QS-09', // Interim Payment Valuation
  QS_10 = 'QS-10', // Variation Management
  QS_11 = 'QS-11', // Risk & Value Engineering
  QS_12 = 'QS-12', // Final Account Preparation

  // 7 Enterprise Shared Systems
  ES_01 = 'ES-01', // Measurement Standards Engine
  ES_02 = 'ES-02', // Construction Specifications Engine
  ES_03 = 'ES-03', // Contract Rules Engine
  ES_04 = 'ES-04', // Drawing Revision Management
  ES_05 = 'ES-05', // Document Control
  ES_06 = 'ES-06', // Commercial Reporting
  ES_07 = 'ES-07', // Quality Assurance & Audit

  // 1 Smart Selective Scope Engine
  SSQ_01 = 'SSQ-01', // Smart Selective QS

  // 4 Approved Advanced Features
  AF_01 = 'AF-01', // AI Auto-Detection & One-Click Takeoff
  AF_02 = 'AF-02', // Interactive 3D BIM Viewer
  AF_03 = 'AF-03', // AI Drawing Conflict Detection
  AF_04 = 'AF-04', // Conversational QS Copilot
}

export interface CapabilityMeta {
  id: QSModuleId;
  name: string;
  category: 'QS_MODULE' | 'SHARED_SYSTEM' | 'SELECTIVE_SCOPE' | 'ADVANCED_FEATURE';
  phase: number;
  status: 'FOUNDATION_PLACEHOLDER' | 'IN_DEVELOPMENT' | 'PRODUCTION_ACTIVE';
  description: string;
}

// ==========================================
// 5. API Request / Response Protocols
// ==========================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  correlationId?: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
  correlationId?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  service: string;
  version: string;
  environment: string;
  uptimeSeconds: number;
  timestamp: string;
  details?: Record<string, unknown>;
}
