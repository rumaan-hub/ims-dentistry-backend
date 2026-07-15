import { OrderStatus } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsArray,
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
  @IsNumber()
  price: GLfloat;

  @IsOptional()
  @IsString()
  paymentMethodId: string;

  @IsOptional()
  @IsString()
  discount?: string;

  @IsOptional()
  @IsString()
  autoOrderFrequency: string;

  @IsOptional()
  @IsNumber()
  autoOrderFrequencyTime: number;

  @IsOptional()
  @IsString()
  startDate: string;

  @IsOptional()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsUUID()
  variantId: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAutoOrderDto)
  products?: ProductAutoOrderDto[];
}

class ProductAutoOrderDto {
    @IsOptional()
    @IsNumber()
    quantity: number;
  
    @IsOptional()
    @IsUUID()
    variantId: string;
  
    @IsOptional()
    @IsUUID()
    id?: string;
}