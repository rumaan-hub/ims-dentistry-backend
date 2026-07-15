import { IsNumber, IsEnum, IsOptional } from "class-validator";
import { PayStatus, CommissionType } from "@prisma/client";

export class UpdateCommissionDto {
  @IsOptional()
  @IsNumber()
  commissionPercentage?: number;

  @IsOptional()
  @IsEnum(PayStatus)
  payOnStatus?: PayStatus;

  @IsOptional()
  @IsEnum(CommissionType)
  calculationMethod?: CommissionType;
}
