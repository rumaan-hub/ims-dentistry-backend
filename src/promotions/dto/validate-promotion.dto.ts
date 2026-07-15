import { IsArray, IsNumber, IsString } from 'class-validator';
import { IsNotEmpty } from '@nestjs/class-validator';

export class ValidatePromotionDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsArray()
  items: { productId: string; price: number }[];
}

export class ApplyPromotionDto {
  @IsNotEmpty()
  @IsString()
  promotionId: string;

  @IsNotEmpty()
  @IsString()
  orderId: string;

  @IsNotEmpty()
  @IsNumber()
  discountAmt: number;
}
