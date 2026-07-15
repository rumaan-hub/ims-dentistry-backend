import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsDate,
  ValidateNested,
  IsInt,
} from "@nestjs/class-validator";
import { ShippingMethod } from "@prisma/client";
import { Transform, Type } from "class-transformer";

export class CreateProductDto {
  @IsNotEmpty({ message: "Product title should not be empty" })
  @IsString()
  title: string;

  @IsNotEmpty({ message: "Descriptive title should not be empty" })
  @IsString()
  descriptiveTitle: string;

  @IsNotEmpty({ message: "Product must have at least one image" })
  @IsArray()
  images: string[];

  @IsOptional()
  @IsString()
  bannerImage?: string;

  @IsOptional()
  @IsString()
  rating?: string;

  @IsOptional()
  @IsString()
  video?: string;

  @IsNotEmpty({ message: "Product must have a description" })
  @IsString()
  description: string;

  @IsOptional()
  @IsBoolean()
  approved?: boolean;

  // @IsNotEmpty({ message: "Subcategory ID should not be empty" })
  // @IsUUID()
  // subCategoryId: string;

  @IsArray()
  @IsUUID("all", { each: true })
  @IsNotEmpty({ message: "At least one category is required" })
  categoryId: string[];

  @IsNotEmpty({ message: "Vendor ID should not be empty" })
  @IsUUID()
  vendorId: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  manufacturer?: string;

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
  featured: boolean;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? new Date(value) : value
  )

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];

  @IsOptional()
  @IsString()
  width: string;

  @IsOptional()
  @IsString()
  height: string;

  @IsOptional()
  @IsString()
  length: string;

  @IsOptional()
  @IsString()
  weight: string;

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
  isLicenseRequired?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deliveryOptions?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  flatRate?: number;

  @IsNotEmpty()
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

class VariantAttributeDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  value: string;
}

class ProductVariantDto {
  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsNotEmpty()
  @IsInt()
  quantity: number;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsOptional()
  @IsInt()
  discount?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  discountedPrice?: number;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  barCode?: string;

  @IsOptional()
  @IsString()
  endingDate?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantAttributeDto)
  attributes?: VariantAttributeDto[];
}
