import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from "@nestjs/class-validator";
import { Role } from "src/user/role/role.enum";
import { IsBoolean } from "class-validator";

class CreateEmergencyContactDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  contactNo: string;

  @IsString()
  relation: string;
}

class CreateAdminRoleDto {
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

export class CreateAdminDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail({}, { message: "Please enter a valid email address." })
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @IsNotEmpty({ message: "Mobile number should not be empty" })
  @IsString()
  phone: string;

  @IsNotEmpty({ message: "First name should not be empty" })
  @IsString()
  firstName: string;

  @IsNotEmpty({ message: "Last name should not be empty" })
  @IsString()
  lastName: string;

  @IsNotEmpty({ message: "Address should not be empty" })
  @IsString()
  address: string;

  @IsString()
  @IsOptional()
  dateOfBirth: string;

  @IsNotEmpty({ message: "Role should not be empty" })
  @IsString()
  role: Role;

  @ValidateNested()
  @Type(() => CreateEmergencyContactDto)
  @IsOptional()
  emergencyContact?: CreateEmergencyContactDto;

  @ValidateNested({ each: true })
  @Type(() => CreateAdminRoleDto)
  @IsArray()
  adminRoles: CreateAdminRoleDto[];

  @IsOptional()
  @IsArray()
  listOfVendors: string[];

  @IsNotEmpty()
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
  profile?: string;
}
