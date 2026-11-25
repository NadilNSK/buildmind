import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  MaxLength,
  Min,
  Max,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  DocumentDiscipline,
  DrawingType,
  SheetSize,
  IssuePurpose,
} from '@buildmind/shared-types';

export class CreateDrawingDto {
  @IsUUID('4')
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  drawingNumber!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  drawingTitle!: string;

  @IsOptional()
  @IsEnum(DocumentDiscipline)
  discipline?: DocumentDiscipline;

  @IsOptional()
  @IsEnum(DrawingType)
  drawingType?: DrawingType;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  originator?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  sheetNumber?: string;

  @IsOptional()
  @IsEnum(SheetSize)
  sheetSize?: SheetSize;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  declaredScale?: string;

  @IsOptional()
  @IsEnum(IssuePurpose)
  issuePurpose?: IssuePurpose;
}

export class UpdateDrawingDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  drawingNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  drawingTitle?: string;

  @IsOptional()
  @IsEnum(DocumentDiscipline)
  discipline?: DocumentDiscipline;

  @IsOptional()
  @IsEnum(DrawingType)
  drawingType?: DrawingType;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  originator?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  sheetNumber?: string;

  @IsOptional()
  @IsEnum(SheetSize)
  sheetSize?: SheetSize;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  declaredScale?: string;

  @IsOptional()
  @IsEnum(IssuePurpose)
  issuePurpose?: IssuePurpose;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;
}

export class DrawingQueryDto {
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
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(DocumentDiscipline)
  discipline?: DocumentDiscipline;

  @IsOptional()
  @IsEnum(DrawingType)
  drawingType?: DrawingType;

  @IsOptional()
  @IsString()
  status?: string;
}
