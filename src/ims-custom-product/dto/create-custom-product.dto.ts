import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ProductInventoryType } from '@prisma/client';

export class CreateCustomProductDto {
  @IsString()
  @IsNotEmpty()
  name: string; // Only required field

  @IsOptional()
  data?: Record<string, any>; // Everything else (incl. variants) optional

  @IsOptional()
  @IsEnum(ProductInventoryType)
  inventory_type?: ProductInventoryType; // CONSUMABLE | EQUIPMENT (default CONSUMABLE)
}
