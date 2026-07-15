import { IsString, IsOptional, IsBoolean } from "class-validator";

export class UpdateLicensesDto {
  @IsString()
  @IsOptional()
  licenseNumber: string;

  @IsString()
  @IsOptional()
  licenseType: string;

  @IsString()
  @IsOptional()
  expirationDate: string;

  @IsString()
  @IsOptional()
  state: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean
}
