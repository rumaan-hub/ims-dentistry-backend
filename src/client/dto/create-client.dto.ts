import { IsString, IsNotEmpty, IsEmail, IsBoolean, IsOptional } from 'class-validator';

export class CreateClientDto {
    @IsString() @IsNotEmpty() company_name: string;
    @IsString() @IsNotEmpty() first_name: string;
    @IsString() @IsNotEmpty() last_name: string;
    @IsEmail() @IsNotEmpty() email: string;
    @IsString() @IsOptional() contact_number?: string;
    @IsBoolean() @IsNotEmpty() agree_to_terms: boolean;
}