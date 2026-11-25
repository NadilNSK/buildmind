import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CurrencyCode,
  MeasurementStandard,
  ContractStandard,
  ProjectStatus,
  ProjectType,
  UnitSystem,
  SpatialNodeType,
} from '@buildmind/shared-types';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty({ message: 'Project code is required' })
  @MinLength(2, { message: 'Project code must be at least 2 characters' })
  @MaxLength(20, { message: 'Project code cannot exceed 20 characters' })
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: 'Project code must be alphanumeric with dashes or underscores',
  })
  code!: string;

  @IsString()
  @IsNotEmpty({ message: 'Project name is required' })
  @MinLength(2, { message: 'Project name must be at least 2 characters' })
  @MaxLength(150, { message: 'Project name cannot exceed 150 characters' })
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(ProjectType)
  projectType?: ProjectType;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  clientName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  contractorName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  consultantName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  projectManager?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  expectedCompletionDate?: string;

  @IsOptional()
  @IsString()
  actualCompletionDate?: string;

  @IsOptional()
  estimatedContractValue?: number | string;

  @IsOptional()
  @IsEnum(MeasurementStandard)
  measurementStandard?: MeasurementStandard;

  @IsOptional()
  @IsEnum(UnitSystem)
  measurementUnitSystem?: UnitSystem;

  @IsOptional()
  @IsEnum(ContractStandard)
  contractStandard?: ContractStandard;

  @IsOptional()
  @IsEnum(CurrencyCode)
  currency?: CurrencyCode;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(ProjectType)
  projectType?: ProjectType;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  clientName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  contractorName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  consultantName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  projectManager?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  expectedCompletionDate?: string;

  @IsOptional()
  @IsString()
  actualCompletionDate?: string;

  @IsOptional()
  estimatedContractValue?: number | string;

  @IsOptional()
  @IsEnum(MeasurementStandard)
  measurementStandard?: MeasurementStandard;

  @IsOptional()
  @IsEnum(UnitSystem)
  measurementUnitSystem?: UnitSystem;

  @IsOptional()
  @IsEnum(ContractStandard)
  contractStandard?: ContractStandard;

  @IsOptional()
  @IsEnum(CurrencyCode)
  currency?: CurrencyCode;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}

export class UpdateProjectSettingsDto extends UpdateProjectDto {}

export class AddProjectMemberDto {
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  role?: string;
}

// ==========================================
// Spatial Node DTOs
// ==========================================

export class CreateSpatialNodeDto {
  @IsOptional()
  @IsUUID('4', { message: 'Parent node ID must be a valid UUID' })
  parentNodeId?: string | null;

  @IsOptional()
  @IsEnum(SpatialNodeType)
  nodeType?: SpatialNodeType;

  @IsString()
  @IsNotEmpty({ message: 'Spatial node name is required' })
  @MinLength(1)
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  displayOrder?: number;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateSpatialNodeDto {
  @IsOptional()
  @IsUUID('4', { message: 'Parent node ID must be a valid UUID' })
  parentNodeId?: string | null;

  @IsOptional()
  @IsEnum(SpatialNodeType)
  nodeType?: SpatialNodeType;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  displayOrder?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

// ==========================================
// Work Package DTOs
// ==========================================

export class CreateWorkPackageDto {
  @IsOptional()
  @IsUUID('4', { message: 'Parent package ID must be a valid UUID' })
  parentPackageId?: string | null;

  @IsString()
  @IsNotEmpty({ message: 'Package code is required' })
  @MinLength(1)
  @MaxLength(50)
  code!: string;

  @IsString()
  @IsNotEmpty({ message: 'Package name is required' })
  @MinLength(1)
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  displayOrder?: number;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateWorkPackageDto {
  @IsOptional()
  @IsUUID('4', { message: 'Parent package ID must be a valid UUID' })
  parentPackageId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  displayOrder?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
