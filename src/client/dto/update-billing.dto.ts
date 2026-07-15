import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateBillingDto {
    @IsString()
    @IsOptional()
    billing_address?: string;

    @IsString()
    @IsOptional()
    stripe_customer_id?: string;

    @IsString()
    @IsOptional()
    stripe_payment_method_id?: string;

    @IsString()
    @IsOptional()
    card_brand?: string;

    @IsString()
    @IsOptional()
    last4?: string;

    @IsNumber()
    @IsOptional()
    expiry_month?: number;

    @IsNumber()
    @IsOptional()
    expiry_year?: number;
}
