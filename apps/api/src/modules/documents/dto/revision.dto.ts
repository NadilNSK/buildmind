import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsArray,
  MaxLength,
  Matches,
} from 'class-validator';
import { ReviewDecision } from '@buildmind/shared-types';

export class CreateVersionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^[A-Za-z0-9_.\-]+$/, {
    message: 'Revision code must be alphanumeric with dots, dashes or underscores',
  })
  revisionCode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  changeNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  declaredScale?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  spatialNodeIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  workPackageIds?: string[];
}

export class SubmitReviewDto {
  @IsOptional()
  @IsUUID('4')
  assignedReviewerId?: string;

  @IsOptional()
  @IsString()
  dueAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comments?: string;
}

export class ReviewDecisionDto {
  @IsEnum(ReviewDecision)
  @IsNotEmpty()
  decision!: ReviewDecision;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comments?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  decisionNote?: string;
}
