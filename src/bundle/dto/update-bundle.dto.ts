import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  IsEnum,
  IsInt,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BundleItemDto, DiscountType, AppliedTo, DurationType } from './create-bundle.dto';

export class UpdateBundleDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  bundlePrice?: number;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BundleItemDto)
  items?: BundleItemDto[];

  // Discount
  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;

  // Applied To
  @IsOptional()
  @IsEnum(AppliedTo)
  appliedTo?: AppliedTo;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsInt()
  @Min(2)
  minQuantity?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxPurchasesPerUser?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryCharges?: number;

  // Duration
  @IsOptional()
  @IsEnum(DurationType)
  durationType?: DurationType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
