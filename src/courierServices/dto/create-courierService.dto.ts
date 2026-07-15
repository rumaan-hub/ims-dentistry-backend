import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateCourierServiceDto {
  @IsNotEmpty()
  @IsString()
  vendorId: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  websiteUrl?: string;

  @IsOptional()
  @IsString()
  phoneNo?: string;
}