import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

export class UpdateAgreementDto {
    @IsString()
    @IsNotEmpty()
    @IsIn(['PENDING', 'SENT', 'SIGNED', 'REJECTED'])
    status: string;

    @IsString() @IsOptional() remarks?: string;

    @IsString() @IsOptional() signed_file?: string;
}
