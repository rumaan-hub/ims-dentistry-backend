import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  IsDate,
  ValidateNested,
  IsNotEmpty,
  IsUUID,
} from "class-validator";
import { Type } from "class-transformer";
import {
  CustomerType,
  DeliveryOption,
  DurationType,
  EligibleCustomerType,
  PromotionType,
} from "@prisma/client";
import { isUUID } from "@nestjs/class-validator";

export class UpdatePromotionDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  code: string;

  @IsOptional()
  @IsEnum(PromotionType)
  type: PromotionType;

  @IsOptional()
  @IsNumber()
  minPurchaseValue: number;

  @IsOptional()
  @IsNumber()
  freeShippingValue: number;

  @IsOptional()
  @IsOptional()
  @IsNumber()
  maxOrdersPerUser?: number;

  @IsOptional()
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

  @IsOptional()
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

  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BundleDealDto)
  bundleDeals?: BundleDealDto[];
}

export class BundleDealDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsNumber()
  bundleFixedDiscount: number;

  @IsOptional()
  @IsNumber()
  bundlePercentageDiscount: number;

  @IsOptional()
  @IsNumber()
  bundleQuantity: number;
}
