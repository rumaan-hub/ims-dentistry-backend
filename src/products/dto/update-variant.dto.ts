import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  IsDate,
  IsNotEmpty,
  ValidateNested,
} from "@nestjs/class-validator";
import { Expose, Type } from "class-transformer";

class UpdateVariantAttributeDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  value: string;
}

export class UpdateVariantDto {
  @IsUUID()
  @IsOptional()
  @Expose()
  id?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsInt()
  quantity?: number;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  barCode?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsNumber()
  discountedPrice?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endingDate?: Date;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateVariantAttributeDto)
  attributes?: UpdateVariantAttributeDto[];
}
