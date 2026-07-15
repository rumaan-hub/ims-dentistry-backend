import { Transform, Type } from "class-transformer";
import { CreateAddressDto } from "./create-address.dto";
import {
  Matches,
  MaxLength,
  MinLength,
  IsString,
  IsInt,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  IsArray,
  IsEnum,
} from "@nestjs/class-validator";
import { BussinessType, HealthCareBusinessType, Role, Speciality } from "@prisma/client";

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail({}, { message: "Invalid Email" })
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @IsString()
  @IsOptional()
  firstName: string;

  @IsString()
  @IsOptional()
  lastName: string;

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

  @IsOptional()
  @IsString()
  role: Role;

  @IsBoolean()
  // Legacy required at signup; now optional for minimal account creation.
  // @IsNotEmpty()
  @IsOptional()
  isVerfied?: boolean;

  @IsBoolean()
  // Legacy required at signup; now optional for minimal account creation.
  // @IsNotEmpty()
  @IsOptional()
  isSubscribed?: boolean;

  // Legacy required at signup; now optional and completed in profile flow.
  // @IsNotEmpty()
  @IsOptional()
  @IsEnum(BussinessType)
  businessType?: BussinessType;

  @IsOptional()
  @IsEnum(HealthCareBusinessType)
  healthCareBusinessType?: HealthCareBusinessType;

  @IsOptional()
  @IsArray()
  dentalOfficeSpeciality?: Speciality[]

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

  @IsInt()
  @IsOptional()
  noOfLocations?: number;

  
  @IsArray()
  @IsOptional()
  @Type(() => CreateAddressDto)
  address: CreateAddressDto[];

  @IsString()
  @IsOptional()
  stripeCustomerId?: string;

  @IsString()
  @IsOptional()
  officePhoneNo?: string;

  @IsOptional()
  @IsString()
  profile: string;
}