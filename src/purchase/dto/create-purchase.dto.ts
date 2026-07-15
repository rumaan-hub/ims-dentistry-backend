import { IsArray, IsBoolean, IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseOrderDetailDto {
    @IsString()
    @IsNotEmpty()
    productId: string;

    @IsInt()
    @IsNotEmpty()
    quantity: number;

    @IsNumber()
    @IsNotEmpty()
    unit_price: number;

    @IsString()
    @IsOptional()
    description?: string;
}

export class CreatePurchaseDto {
    @IsUUID()
    @IsNotEmpty()
    client_id: string;

    @IsBoolean()
    @IsOptional()
    is_quotation?: boolean = false;

    @IsString()
    @IsOptional()
    remarks?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PurchaseOrderDetailDto)
    details: PurchaseOrderDetailDto[];
}
