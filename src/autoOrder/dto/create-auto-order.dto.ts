import { Type } from "class-transformer";
import {
    IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from "class-validator";

export class CreateAutoOrderDto {
  @IsNotEmpty()
  @IsUUID()
  addressId: string;

  @IsNotEmpty()
  @IsUUID()
  licenseId: string;

  @IsNotEmpty()
  @IsString()
  paymentMethodId: string;

  @IsNotEmpty()
  @IsString()
  autoOrderFrequency: string;

  @IsNotEmpty()
  @IsNumber()
  autoOrderFrequencyTime: number;

  @IsNotEmpty()
  @IsString()
  startDate: string;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsNotEmpty()
  @IsUUID()
  variantId: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAutoOrderDto)
  products?: ProductAutoOrderDto[];
}

class ProductAutoOrderDto {
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