import { IsString, IsOptional } from 'class-validator';

export class CreateShippingDto {
    @IsString()
    office_name: string;

    @IsString()
    address: string;

    @IsString()
    city: string;

    @IsString()
    state: string;

    @IsString()
    zip_code: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    extension?: string;
}
