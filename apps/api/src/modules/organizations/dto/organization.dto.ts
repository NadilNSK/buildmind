import {
  IsEmail,
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
  OrganizationRole,
  MembershipStatus,
  OrganizationStatus,
} from '@buildmind/shared-types';

export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty({ message: 'Organization name is required' })
  @MinLength(2, { message: 'Organization name must be at least 2 characters' })
  @MaxLength(100, { message: 'Organization name cannot exceed 100 characters' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Slug is required' })
  @MinLength(2, { message: 'Slug must be at least 2 characters' })
  @MaxLength(50, { message: 'Slug cannot exceed 50 characters' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must consist of lowercase alphanumeric characters and hyphens',
  })
  slug!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  country?: string;

  @IsOptional()
  @IsEnum(CurrencyCode)
  defaultCurrency?: CurrencyCode;
}

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must consist of lowercase alphanumeric characters and hyphens',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  country?: string;

  @IsOptional()
  @IsEnum(CurrencyCode)
  defaultCurrency?: CurrencyCode;

  @IsOptional()
  @IsEnum(OrganizationStatus)
  status?: OrganizationStatus;

  @IsOptional()
  settings?: Record<string, any>;
}

export class InviteMemberDto {
  @IsEmail({}, { message: 'Must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @IsEnum(OrganizationRole, { message: 'Must be a valid organization role' })
  @IsNotEmpty({ message: 'Role is required' })
  role!: OrganizationRole;
}

export class UpdateMemberRoleDto {
  @IsEnum(OrganizationRole, { message: 'Must be a valid organization role' })
  @IsNotEmpty({ message: 'Role is required' })
  role!: OrganizationRole;
}

export class UpdateMemberStatusDto {
  @IsEnum(MembershipStatus, { message: 'Must be a valid membership status' })
  @IsNotEmpty({ message: 'Status is required' })
  status!: MembershipStatus;
}

export class TransferOwnershipDto {
  @IsUUID('4', { message: 'Target user ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Target user ID is required' })
  newOwnerUserId!: string;
}

export class AcceptInvitationDto {
  @IsString()
  @IsNotEmpty({ message: 'Invitation token is required' })
  @MinLength(16, { message: 'Invalid invitation token format' })
  token!: string;
}
