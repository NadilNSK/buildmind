import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsArray,
  MaxLength,
  Matches,
  ValidateNested,
  IsEmail,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IssuePurpose, TransmittalStatus } from '@buildmind/shared-types';

export class TransmittalRecipientDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  organization?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  role?: string;
}

export class CreateTransmittalDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[A-Za-z0-9_.\-]+$/, {
    message: 'Reference must be alphanumeric with dots, dashes or underscores',
  })
  reference!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  subject!: string;

  @IsOptional()
  @IsUUID('4')
  senderUserId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransmittalRecipientDto)
  authorizedRecipients?: TransmittalRecipientDto[];

  @IsOptional()
  @IsArray()
  recipients?: any[];

  @IsOptional()
  @IsEnum(IssuePurpose)
  issuePurpose?: IssuePurpose;

  @IsOptional()
  @IsString()
  issueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsArray()
  versionIds?: string[];

  @IsOptional()
  @IsArray()
  items?: any[];
}

export class TransmittalQueryDto {
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
  @IsEnum(TransmittalStatus)
  status?: TransmittalStatus;

  @IsOptional()
  @IsEnum(IssuePurpose)
  issuePurpose?: IssuePurpose;
}
