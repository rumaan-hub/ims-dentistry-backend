import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from "@nestjs/class-validator";
import { Transform } from "class-transformer";
import {
  BussinessType,
  HealthCareBusinessType,
  Role,
  Speciality,
} from "@prisma/client";
import { IsNumber } from "class-validator";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsEmail({}, { message: "Invalid Email" })
  @Transform(({ value }) => value.toLowerCase())
  email?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  role?: Role;

  @IsOptional()
  @IsBoolean()
  isVerfied?: boolean;

  @IsOptional()
  @IsBoolean()
  isSubscribed?: boolean;
  
  @IsOptional()
  @IsEnum(BussinessType)
  businessType?: BussinessType;

  @IsOptional()
  @IsEnum(HealthCareBusinessType)
  healthCareBusinessType?: HealthCareBusinessType;

  @IsOptional()
  @IsArray()
  dentalOfficeSpeciality?: Speciality[];

  @IsOptional()
  @IsString()
  doctorFirstName?: string;

  @IsOptional()
  @IsString()
  doctorLastName?: string;

  @IsOptional()
  @IsString()
  officeContactFirstName?: string;

  @IsOptional()
  @IsString()
  officeContactLastName?: string;

  @IsOptional()
  @IsString()
  contactJobTitle?: string;

  @IsOptional()
  @IsString()
  managerFirstName?: string;

  @IsOptional()
  @IsString()
  managerLastName?: string;

  @IsOptional()
  @IsInt()
  noOfLocations?: number;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsNumber()
  totalSales?: number;

  @IsString()
  @IsOptional()
  officePhoneNo?: string;

  @IsOptional()
  @IsString()
  profile: string;
}
