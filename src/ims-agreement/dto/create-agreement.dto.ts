import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateAgreementDto {
    @IsString()
    @IsNotEmpty()
    agreement_file: string;

    @IsBoolean()
    dentistry_account_linked: boolean;

    @IsString() @IsOptional() remarks?: string;
}
