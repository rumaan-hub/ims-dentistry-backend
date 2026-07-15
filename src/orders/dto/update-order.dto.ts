import { OrderStatus, OrderRemarks, ShippingMethod } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from "class-validator";

export class UpdateOrderDto {
  @IsOptional()
  @IsUUID()
  addressId?: string;

  @IsOptional()
  @IsUUID()
  licenseId?: string;

  @IsOptional()
  @IsString()
  price?: string;

  @IsOptional()
  @IsString()
  discount?: string;

  @IsOptional()
  @IsString()
  returnStatus?: OrderRemarks;

  @IsOptional()
  @IsBoolean()
  autoOrder?: boolean;

  @IsOptional()
  @IsString()
  autoOrderFrequency?: string;

  @IsOptional()
  @IsNumber()
  autoOrderFrequencyTime?: number;

  @IsOptional()
  @IsString()
  startDate: string;

  @IsOptional()
  @IsString()
  status: OrderStatus;

  @IsOptional()
  @IsString()
  paymentMethodId: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => trackingNo)
  trackingNo?: trackingNo[];

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsOptional()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductOrderDto)
  products?: ProductOrderDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryOptionsDto)
  deliveryOptions?: DeliveryOptionsDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrackingNoDto)
  trackingUpdates?: TrackingNoDto[];
}

export class DeliveryOptionsDto {
  @IsOptional()
  @IsUUID()
  vendorId: string;

  @IsOptional()
  @IsNumber()
  totalShippingCost: number;

  @IsOptional()
  @IsNumber()
  vendorBear: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShippingOptionDto)
  options: ShippingOptionDto[];
}

export class ShippingOptionDto {
  @IsOptional()
  @IsString()
  shippingMethod: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items: ItemDto[];

  @IsOptional()
  @IsNumber()
  shippingCost: number;

  @IsOptional()
  @IsString()
  deliveryType: string;
}

export class ItemDto {
  @IsOptional()
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  variantId: string;

  @IsOptional()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber()
  flatRate?: number;
}
class trackingNo {
  @IsNotEmpty()
  vendorId: string;

  @IsNotEmpty()
  @IsString()
  trackingNo: string;
}

class TrackingNoDto {
  @IsNotEmpty()
  @IsString()
  trackingNo: string;

  @IsNotEmpty()
  @IsUUID()
  variantId: string;
}

class ProductOrderDto {
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsUUID()
  variantId?: string;

  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @IsOptional()
  @IsString()
  status?: OrderStatus;
}
