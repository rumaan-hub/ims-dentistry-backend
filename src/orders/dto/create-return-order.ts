import { IsString, IsNotEmpty, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CreateReturnOrderVariantDto {
  @IsUUID()
  variantId: string;

  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class CreateReturnOrderDto {


  @IsString()
  @IsNotEmpty()
  trackingNo: string;

  @IsString()
  @IsNotEmpty()
  deliverFrom: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReturnOrderVariantDto)
  variants: CreateReturnOrderVariantDto[];
}
