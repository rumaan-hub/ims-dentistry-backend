import { IsString, IsNotEmpty, IsUUID, IsEmail, IsOptional, IsDateString } from 'class-validator';

export class CreateImsDemoDto {
    @IsDateString() @IsNotEmpty() scheduled_at: string;
    @IsUUID() @IsOptional() client_id?: string;
    @IsString() @IsNotEmpty() full_name: string;
    @IsEmail() @IsNotEmpty() email: string;
    @IsString() @IsOptional() phone?: string;
    @IsString() @IsOptional() company_name?: string;
    @IsString() @IsOptional() notes?: string;
    @IsString() @IsOptional() demo_type?: string;
}
