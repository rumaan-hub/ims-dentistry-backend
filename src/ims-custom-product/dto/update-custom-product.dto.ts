import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ProductInventoryType } from '@prisma/client';

export class UpdateCustomProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsOptional()
  data?: Record<string, any>;

  @IsOptional()
  @IsEnum(ProductInventoryType)
  inventory_type?: ProductInventoryType;
}
