import { IsString, IsOptional } from 'class-validator';

export class UpdateTransferDto {
    @IsString() @IsOptional() status?: string; // "Pending" | "In Transit" | "Completed"
    @IsString() @IsOptional() staff_id?: string;
}
