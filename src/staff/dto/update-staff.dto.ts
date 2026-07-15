import { IsString, IsEmail, IsOptional, IsUUID } from 'class-validator';

export class UpdateStaffDto {
    @IsString() @IsOptional() first_name?: string;
    @IsString() @IsOptional() last_name?: string;
    @IsEmail() @IsOptional() email?: string;
    @IsString() @IsOptional() phone?: string;
    @IsString() @IsOptional() address?: string;
    @IsString() @IsOptional() designation?: string;
    @IsUUID() @IsOptional() officeOffice_id?: string;
    @IsString() @IsOptional() password?: string;
}
