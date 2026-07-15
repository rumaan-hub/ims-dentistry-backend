import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateLicenseDto {
   @IsString()
   @IsNotEmpty()
   licenseNumber: string;

   @IsString()
   @IsNotEmpty()
   licenseType: string;

   @IsString()
   @IsNotEmpty()
   expirationDate: string;

   @IsString()
   @IsNotEmpty()
   state: string;

   @IsBoolean()
   @IsOptional()
   isDefault?: boolean
}
