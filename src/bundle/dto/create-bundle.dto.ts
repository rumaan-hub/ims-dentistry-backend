import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsNotEmpty,
  ValidateNested,
  Min,
  ArrayMinSize,
  IsEnum,
  IsInt,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum DiscountType {
  FixPrice = 'FixPrice',
  Percentage = 'Percentage',
}

export enum AppliedTo {
  AllProducts = 'AllProducts',
  SpecificProducts = 'SpecificProducts',
  SpecificCategories = 'SpecificCategories',
}

export enum DurationType {
  unlimited = 'unlimited',
  selectedTime = 'selectedTime',
}

export class BundleItemDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateBundleDto {
  @IsNotEmpty()
  @IsString()
  title: string;

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

  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => BundleItemDto)
  items: BundleItemDto[];

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

  @IsNumber()
  @Min(0)
  deliveryCharges: number;

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
