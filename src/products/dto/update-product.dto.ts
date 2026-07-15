import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from "@nestjs/class-validator";
import { Transform, Type } from "class-transformer";
import { IsDate } from "class-validator";
import { UpdateVariantDto } from "./update-variant.dto";
import { ShippingMethod } from "@prisma/client";

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  descriptiveTitle?: string;

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsString()
  bannerImage?: string;

  @IsOptional()
  @IsString()
  video?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  approved?: boolean;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsString()
  disapprovalMsg?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  packaging?: string;

  @IsOptional()
  @IsUUID()
  material?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  vasoconstrictor?: string;

  @IsOptional()
  @IsString()
  sds?: string;

  @IsOptional()
  @IsString()
  style?: string;

  @IsOptional()
  @IsString()
  sterility?: string;

  @IsOptional()
  @IsString()
  properties?: string;

  @IsOptional()
  @IsString()
  construction?: string;

  @IsOptional()
  @IsString()
  dilutionRatio?: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  @Type(() => Date)
  endingDate?: Date;

  @IsOptional()
  @IsString()
  rating?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateVariantDto)
  variants?: UpdateVariantDto[];

  @IsOptional()
  @IsString()
  width?: string;

  @IsOptional()
  @IsString()
  height?: string;

  @IsOptional()
  @IsString()
  length?: string;

  @IsOptional()
  @IsString()
  weight?: string;

  @IsString()
  @IsOptional()
  scent: string;

  @IsString()
  @IsOptional()
  viscosity: string;

  @IsString()
  @IsOptional()
  fluidResistance: string;

  @IsString()
  @IsOptional()
  filtrationRate: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deliveryOptions?: string[];

  @IsOptional()
  @IsBoolean()
  isLicenseRequired?: boolean;

  @IsOptional()
  @IsNumber()
  flatRate?: number;

  @IsOptional()
  @IsString()
  shippingMethod: ShippingMethod;

  @IsOptional()
  @IsUUID()
  inventoryTypeId?: string;

  // Legacy string-name support (temporary)
  @IsOptional()
  @IsString()
  inventoryType?: "CONSUMABLE" | "EQUIPMENT";
}
