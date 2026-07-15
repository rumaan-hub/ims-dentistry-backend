import { OrderStatus } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from "class-validator";

export class UpdateAutoOrderDto {
  @IsOptional()
  @IsUUID()
  addressId: string;

  @IsOptional()
  @IsUUID()
  licenseId: string;

  @IsOptional()
  @IsString()
  status: OrderStatus;

  @IsOptional()
  @IsNumber()
  price: GLfloat;

  @IsOptional()
  @IsString()
  paymentMethodId: string;

  @IsOptional()
  @IsString()
  discount?: string;

  @IsOptional()
  @IsBoolean()
  autoOrder?: boolean;

  @IsOptional()
  @IsString()
  autoOrderFrequency?: string;

  @IsOptional()
  @IsNumber()
  autoOrderFrequencyTime: number;
  
  @IsOptional()
  @IsString()
  trackingNo?: string;

  @IsOptional()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsUUID()
  variantId: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductOrderDto)
  products?: ProductOrderDto[];
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