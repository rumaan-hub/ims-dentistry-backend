import { IsString, IsOptional } from 'class-validator';

export class UpdateShippingDto {
    @IsString()
    @IsOptional()
    office_name?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    city?: string;

    @IsString()
    @IsOptional()
    state?: string;

    @IsString()
    @IsOptional()
    zip_code?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    extension?: string;
}
