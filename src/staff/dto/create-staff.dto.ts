import { IsString, IsNotEmpty, IsUUID, IsEmail, IsOptional } from 'class-validator';

export class CreateStaffDto {
    @IsUUID() @IsOptional() client_id?: string;
    @IsString() @IsNotEmpty() first_name: string;
    @IsString() @IsNotEmpty() last_name: string;
    @IsEmail() @IsNotEmpty() email: string;
    @IsString() @IsOptional() phone?: string;
    @IsString() @IsOptional() address?: string;
    @IsString() @IsNotEmpty() designation: string;
    @IsUUID() @IsOptional() officeOffice_id?: string;
    @IsString() @IsOptional() password?: string;
}
