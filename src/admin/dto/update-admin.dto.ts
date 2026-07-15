import { IsOptional, IsString, ValidateNested, IsArray, IsBoolean, MinLength, MaxLength, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { Status } from '@prisma/client';

class UpdateEmergencyContactDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  contactNo?: string;

  @IsString()
  @IsOptional()
  relation?: string;
}

class UpdateAdminRoleDto {
  @IsString()
  management: string;

  @IsBoolean()
  @IsOptional()
  view: boolean;

  @IsBoolean()
  @IsOptional()
  edit: boolean;

  @IsBoolean()
  @IsOptional()
  add: boolean;

  @IsBoolean()
  @IsOptional()
  delete: boolean;
}

export class UpdateAdminDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  status?: Status;

  @ValidateNested()
  @Type(() => UpdateEmergencyContactDto)
  @IsOptional()
  emergencyContact?: UpdateEmergencyContactDto;

  @ValidateNested({ each: true })
  @Type(() => UpdateAdminRoleDto)
  @IsArray()
  @IsOptional()
  adminRoles?: UpdateAdminRoleDto[];

  @IsString()
  @IsOptional()
  reason?: string;

  @IsOptional()
  @IsString()
  profile?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(16)
  @Matches(
    /^(?=[A-Za-z0-9@#$%^&*()+!={}~`_\[\]\'\\/:;,.<>?~"|\-\[\]]+$)(?=.*[a-z])(?=.*[0-9])(?=.*[@#$%^&*()+!={}~`_\[\]\'\\/:;,.<>?~"|\-\[\]]).{8,}$/,
    {
      message:
        "Password should contain at least 8 characters with 1 special character and 1 number",
    }
  )
  password: string;
}
