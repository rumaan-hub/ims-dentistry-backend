import { IsEmail, IsString, IsOptional } from "@nestjs/class-validator";

export class UpdateAccountUPS {
  @IsOptional()
  @IsString()
  accountNo?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  serviceName?: string;

  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @IsOptional()
  @IsString()
  phoneNo?: string;

  @IsOptional()
  @IsString()
  accessToken?: string;
}
