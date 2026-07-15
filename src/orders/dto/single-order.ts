import { OrderStatus } from "@prisma/client";
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";

export class SingleProductOrderDto {
  @IsNotEmpty()
  @IsUUID()
  addressId: string;

  @IsNotEmpty()
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

  @IsNotEmpty()
  @IsString()
  startDate: string;

  @IsNotEmpty({ message: "Quantity should not be empty" })
  @IsNumber()
  quantity: number;

  @IsNotEmpty({ message: "Variant Id should not be empty" })
  @IsUUID()
  variantId: string;
}
