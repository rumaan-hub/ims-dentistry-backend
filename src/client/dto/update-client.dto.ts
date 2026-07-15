import { IsString, IsEmail, IsOptional } from 'class-validator';

export class UpdateClientDto {
    @IsString() @IsOptional() company_name?: string;
    @IsString() @IsOptional() first_name?: string;
    @IsString() @IsOptional() last_name?: string;
    @IsEmail() @IsOptional() email?: string;
    @IsString() @IsOptional() contact_number?: string;
    @IsString() @IsOptional() permanent_address?: string;
    @IsString() @IsOptional() city?: string;
    @IsString() @IsOptional() state?: string;
    @IsString() @IsOptional() zip_code?: string;
}
