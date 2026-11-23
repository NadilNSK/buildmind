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
  NRM2 = 'NRM2',       // RICS New Rules of Measurement 2 (Detailed measurement)
  SMM7 = 'SMM7',       // Standard Method of Measurement 7 (Legacy UK/Commonwealth)
  POMI = 'POMI',       // Principles of Measurement International
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
  TENDERING = 'TENDERING',
  ACTIVE = 'ACTIVE',
  COMMERCIAL_CLOSEOUT = 'COMMERCIAL_CLOSEOUT',
  FINAL_ACCOUNT = 'FINAL_ACCOUNT',
  ARCHIVED = 'ARCHIVED',
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

export enum OrganizationStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
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
  createdAt: string;
  updatedAt: string;
}

export interface MembershipSummary {
  id: string;
  userId: string;
  organizationId: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSummary {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description?: string;
  country: string;
  measurementStandard: MeasurementStandard;
  contractStandard?: ContractStandard;
  status: ProjectStatus;
  currency: CurrencyCode;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 3. Approved 24 Capabilities Catalog
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
// 4. API Request / Response Protocols
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
