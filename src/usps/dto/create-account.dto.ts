import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
} from "@nestjs/class-validator";

export class CreateAccountUPS {
  @IsNotEmpty()
  @IsString()
  accountNo: string;

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

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  accessTokenExpiresAt?: Date;
  
  @IsOptional()
  refreshTokenExpiresAt?: Date;
}