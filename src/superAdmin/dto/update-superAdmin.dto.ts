import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  ValidateNested,
} from "@nestjs/class-validator";
import { UpdateAddressDto } from "./update-address.dto";

export class UpdateSuperAdminDto {
  @IsOptional()
  @IsString()
  @IsEmail({}, { message: "Invalid Email" })
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @IsOptional()
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  profile?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => UpdateAddressDto)
  address: UpdateAddressDto[];
}
