import { IsString, IsNumber, IsEnum, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { IMSTransactionType, IMSStatus } from '@prisma/client';

export class CreateInventoryDto {
  @IsEnum(IMSTransactionType)
  transaction_type!: IMSTransactionType; // 'IN', 'OUT', 'TRANSFER', 'ADJUSTMENT'

  @IsString()
  staff_id!: string;

  @IsString()
  office_id!: string;

  @IsOptional()
  @IsString()
  destination_office_id?: string;

  // Exactly one of productId / customProductId is required (validated in the service).
  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsUUID()
  customProductId?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsNumber()
  quantity!: number;

  @IsOptional()
  @IsString()
  batch_no?: string;

  @IsOptional()
  @IsDateString()
  expiry_date?: string | Date;

  @IsNumber()
  unit_price!: number;

  @IsOptional()
  @IsString()
  room_number?: string;

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsEnum(IMSStatus)
  status!: IMSStatus;

  // Added fields to allow updating the Product catalog from the Inventory UI
  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsString()
  productType?: string;

  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsString()
  category?: string;
}