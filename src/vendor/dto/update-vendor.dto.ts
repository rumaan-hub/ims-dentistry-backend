import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  ValidateNested,
  MaxLength,
  MinLength,
  Matches,
  IsNotEmpty,
} from "class-validator";
import { Type } from "class-transformer";
import { Role, vendorStatus } from "@prisma/client";
import { UpdateAddressDto } from "./update-address.dto";

export class UpdateVendorDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  workPhone?: string;

  @IsOptional()
  @IsString()
  businessType?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  webisteName?: string;

  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @IsOptional()
  @IsBoolean()
  ownProductManf?: boolean;
  
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsOptional()
  @IsBoolean()
  autherizeDist?: boolean;

  @IsOptional()
  @IsString()
  role?: Role;

  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateAddressDto)
  address?: UpdateAddressDto;

  @IsOptional()
  @IsString()
  upsClientId?: string;

  @IsOptional()
  @IsString()
  upsClientSecret?: string;

  @IsOptional()
  @IsBoolean()
  defaultUps?: boolean;

  @IsOptional()
  @IsString()
  status?: vendorStatus;

  @IsOptional()
  @IsBoolean()
  returnPolicy?: boolean;

  @IsOptional()
  @IsString()
  profile?: string;
}

export class DeactivateVendorDto {
  @IsNotEmpty()
  @IsString()
  status: vendorStatus;

  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason: string;
}