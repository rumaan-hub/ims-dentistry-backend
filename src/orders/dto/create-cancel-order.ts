import { IsString, IsNotEmpty, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CreateCancelOrderVariantDto {
  @IsUUID()
  variantId: string;
}

export class CreateCancelOrderDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  reason: string;


  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCancelOrderVariantDto)
  variants: CreateCancelOrderVariantDto[];
}
