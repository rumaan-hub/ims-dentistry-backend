import { IsString, IsNotEmpty, IsIn, IsOptional, IsDateString } from 'class-validator';

export class UpdateImsDemoDto {
    @IsString()
    @IsNotEmpty()
    @IsIn(['PENDING', 'SCHEDULED', 'RESCHEDULED', 'SUCCESSFUL', 'FAILED', 'CANCELLED'])
    demo_status: string;

    @IsDateString() @IsOptional() demo_date?: string;

    @IsString() @IsOptional() remarks?: string;
}
