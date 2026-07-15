import {
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VendorTransfersStatus } from '@prisma/client';

export class FilterOptions {
  @IsOptional()
  @IsString()
  vendorId: string;

  @IsOptional()
  @IsEnum(VendorTransfersStatus)
  status?: VendorTransfersStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;
}
