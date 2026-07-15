import { OrderStatus } from "@prisma/client";
import { Type } from "class-transformer";
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

export class CreateOrderDto {
  @IsNotEmpty()
  @IsUUID()
  addressId: string;

  @IsOptional()
  @IsUUID()
  licenseId: string;

  @IsNotEmpty()
  @IsString()
  status: OrderStatus;

  @IsNotEmpty()
  @IsNumber()
  price: GLfloat;

  @IsNotEmpty()
  @IsString()
  paymentMethodId: string;

  @IsOptional()
  @IsString()
  discount?: string;

  @IsOptional()
  @IsString()
  promotionId?: string;

  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  storewideDiscountAmount?: number;

  @IsOptional()
  @IsBoolean()
  autoOrder?: boolean;

  @IsOptional()
  @IsString()
  autoOrderFrequency?: string;

  @IsOptional()
  @IsString()
  cardNumber?: string;

  @IsOptional()
  @IsString()
  expiryDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  trackingNo?: string[];

  @IsOptional()
  @IsNumber()
  shippingTax?: number;

  @IsOptional()
  @IsNumber()
  taxAmount?: number;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryOptionsDto)
  deliveryOptions?: DeliveryOptionsDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductOrderDto)
  products?: ProductOrderDto[];
}

export class DeliveryOptionsDto {
  @IsNotEmpty()
  @IsUUID()
  vendorId: string;

  @IsNotEmpty()
  @IsNumber()
  totalShippingCost: number;

  @IsNotEmpty()
  @IsNumber()
  vendorBear: number;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShippingOptionDto)
  options: ShippingOptionDto[];
}

export class ShippingOptionDto {
  @IsNotEmpty()
  @IsString()
  shippingMethod: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items: ItemDto[];

  @IsNotEmpty()
  @IsNumber()
  shippingCost: number;

  @IsNotEmpty()
  @IsString()
  deliveryType: string;
}

export class ItemDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNotEmpty()
  @IsString()
  variantId: string;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber()
  flatRate?: number;
}

class ProductOrderDto {
  @IsNotEmpty({ message: "Quantity should not be empty" })
  @IsNumber()
  quantity: number;

  @IsNotEmpty({ message: "Variant Id should not be empty" })
  @IsUUID()
  variantId: string;

  @IsOptional()
  @IsUUID()
  id?: string;
}
