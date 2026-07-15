import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  ValidateNested,
  MaxLength,
  MinLength,
  Matches,
} from "class-validator";
import { Type } from "class-transformer";
import { Role, VendorBusinessType } from "@prisma/client";

class AddressDto {
  @IsNotEmpty()
  @IsString()
  streetAddress: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  state: string;

  @IsNotEmpty()
  @IsString()
  zipCode: string;

  @IsOptional()
  @IsString()
  country?: string;
}

export class CreateVendorDto {
  @IsOptional()
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  workPhone?: string;

  @IsNotEmpty()
  @IsString()
  businessType: VendorBusinessType;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  webisteName?: string;

  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @IsNotEmpty()
  @IsBoolean()
  ownProductManf: boolean;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsNotEmpty()
  @IsBoolean()
  autherizeDist: boolean

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

  @IsNotEmpty({ message: "Role should not be empty" })
  @IsString()
  role: Role;

  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;

  @IsOptional()
  @IsBoolean()
  returnPolicy?: boolean;

  @IsOptional()
  @IsString()
  profile?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  address?: AddressDto;
}
export class ResendEmailDTO {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
