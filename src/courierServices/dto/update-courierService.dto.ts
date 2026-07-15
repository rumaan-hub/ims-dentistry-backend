import { IsOptional, IsString } from "class-validator";

export class UpdateCourierServiceDto {

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @IsOptional()
  @IsString()
  phoneNo?: string;
}