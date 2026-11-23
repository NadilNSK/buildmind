import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  CurrencyCode,
  MeasurementStandard,
  ContractStandard,
  ProjectStatus,
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
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  country?: string;

  @IsOptional()
  @IsEnum(MeasurementStandard)
  measurementStandard?: MeasurementStandard;

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
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  country?: string;

  @IsOptional()
  @IsEnum(MeasurementStandard)
  measurementStandard?: MeasurementStandard;

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

export class AddProjectMemberDto {
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  role?: string;
}
