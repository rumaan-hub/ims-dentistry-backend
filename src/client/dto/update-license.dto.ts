import { IsString, IsDateString, IsOptional } from 'class-validator';

export class UpdateLicenseDto {
    @IsString()
    @IsOptional()
    license_type?: string;

    @IsString()
    @IsOptional()
    license_number?: string;

    @IsDateString()
    @IsOptional()
    expiry_date?: string;

    @IsString()
    @IsOptional()
    state?: string;

    @IsString()
    @IsOptional()
    status?: string;
}
