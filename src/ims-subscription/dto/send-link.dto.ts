import { IsString, IsNotEmpty, IsNumber, Min, Max, IsOptional, IsIn } from 'class-validator';

export class SendLinkDto {
    @IsString() @IsNotEmpty() client_id: string;
    @IsString() @IsNotEmpty() subscription_plan_id: string;
    @IsNumber() @Min(0) @Max(100) @IsOptional() discount_percentage?: number;
    @IsString() @IsIn(['monthly', 'annual']) billing_cycle: string;
}
