import { IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateLicenseDto {
    @IsString()
    license_type: string;

    @IsString()
    license_number: string;

    @IsDateString()
    expiry_date: string;

    @IsString()
    state: string;

    @IsString()
    @IsOptional()
    status?: string;
}
