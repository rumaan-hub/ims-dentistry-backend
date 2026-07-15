import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  IsDate,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { IsNotEmpty } from "@nestjs/class-validator";
import { CustomerType, DeliveryOption, DurationType, EligibleCustomerType, PromotionType } from "@prisma/client";

export class CreatePromotionDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsNotEmpty()
  @IsEnum(PromotionType)
  type: PromotionType;

  @IsOptional()
  @IsNumber()
  minPurchaseValue: number;

  @IsOptional()
  @IsNumber()
  freeShippingValue: number;

  @IsNotEmpty()
  @IsOptional()
  @IsNumber()
  maxOrdersPerUser?: number;

  @IsNotEmpty()
  @IsOptional()
  @IsBoolean()
  appliesToAllProducts: boolean;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  selectedProductIds?: string[];

  @IsOptional()
  @IsNumber()
  capMinValue?: number;

  @IsOptional()
  @IsNumber()
  capMaxValue?: number;

  @IsNotEmpty()
  @IsEnum(EligibleCustomerType)
  eligibleCustomers: EligibleCustomerType;

  @IsOptional()
  @IsArray()
  @IsEnum(CustomerType, { each: true })
  customerTypes?: CustomerType[];

  @IsOptional()
  @IsNumber()
  highSpendLimit: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  eligibleCountries?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  eligibleStates?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  eligibleCities?: string[];

  @IsArray()
  @IsOptional()
  @IsEnum(DeliveryOption, { each: true })
  deliveryOptions: DeliveryOption[];

  @IsEnum(DurationType)
  durationType: DurationType;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsNumber()
  buyQuantity?: number;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  buyProductIds?: string[];

  @IsOptional()
  @IsNumber()
  getQuantity?: number;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  getProductIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedCategoryIds?: string[];

  @IsOptional()
  @IsNumber()
  totalUsageLimit?: number;

  @IsOptional()
  @IsNumber()
  spendFixedDiscount?: number;

  @IsOptional()
  @IsNumber()
  spendPercentageDiscount?: number;
  
  @IsOptional()
  @IsNumber()
  spendAmount?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BundleDealDto)
  bundleDeals?: BundleDealDto[];
}

export class BundleDealDto {

  @IsOptional()
  @IsNumber()
  bundleFixedDiscount: number;

  @IsOptional()
  @IsNumber()
  bundlePercentageDiscount: number;

  @IsNotEmpty()
  @IsNumber()
  bundleQuantity: number;

}
