import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsUUID,
  IsArray,
  Min,
  Max,
  MaxLength,
  Matches,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  DocumentCategory,
  DocumentDiscipline,
  DocumentFileFormat,
  DocumentUploadStatus,
} from '@buildmind/shared-types';

export class CreateUploadSessionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  declaredFilename!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  declaredMimeType!: string;

  @IsNumber()
  @Min(1)
  @Max(500 * 1024 * 1024)
  declaredSizeBytes!: number;

  @IsEnum(DocumentCategory)
  category!: DocumentCategory;

  @IsOptional()
  @IsEnum(DocumentDiscipline)
  discipline?: DocumentDiscipline;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9_.\-]+$/, {
    message: 'Reference must be alphanumeric with dots, dashes or underscores',
  })
  reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  spatialNodeIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  workPackageIds?: string[];

  @IsOptional()
  metadata?: Record<string, any>;
}

export class CompleteUploadSessionDto {
  @IsUUID('4')
  @IsNotEmpty()
  sessionId!: string;

  @IsString()
  @Matches(/^[a-fA-F0-9]{64}$/, {
    message: 'Must be a valid 64-character SHA-256 hexadecimal hash',
  })
  checksumSha256!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  actualSizeBytes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9_.\-]+$/, {
    message: 'Reference must be alphanumeric with dots, dashes or underscores',
  })
  reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;

  @IsOptional()
  @IsEnum(DocumentDiscipline)
  discipline?: DocumentDiscipline;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  spatialNodeIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  workPackageIds?: string[];

  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9_.\-]+$/, {
    message: 'Reference must be alphanumeric with dots, dashes or underscores',
  })
  reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;

  @IsOptional()
  @IsEnum(DocumentDiscipline)
  discipline?: DocumentDiscipline;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateDocumentLinksDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  spatialNodeIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  workPackageIds?: string[];
}

export class DocumentQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;

  @IsOptional()
  @IsEnum(DocumentDiscipline)
  discipline?: DocumentDiscipline;

  @IsOptional()
  @IsEnum(DocumentFileFormat)
  fileFormat?: DocumentFileFormat;

  @IsOptional()
  @IsEnum(DocumentUploadStatus)
  uploadStatus?: DocumentUploadStatus;

  @IsOptional()
  @IsUUID('4')
  spatialNodeId?: string;

  @IsOptional()
  @IsUUID('4')
  workPackageId?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeArchived?: boolean = false;
}
