import {
    IsString,
    IsNotEmpty,
    IsUUID,
    IsOptional,
    IsArray,
    ValidateNested,
    IsInt,
    Min,
    IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TransferDetailDto {
    @IsString() @IsNotEmpty() productId: string;
    @IsInt() @Min(1) qty: number;
}

export class CreateTransferDto {
    @IsUUID() @IsOptional() client_id?: string;
    @IsUUID() @IsNotEmpty() source_office_id: string;
    @IsUUID() @IsNotEmpty() destination_office_id: string;
    @IsString() @IsOptional() status?: string; // "Pending" | "In Transit" | "Completed"
    @IsDateString() @IsNotEmpty() transfer_date: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TransferDetailDto)
    details: TransferDetailDto[];
}
