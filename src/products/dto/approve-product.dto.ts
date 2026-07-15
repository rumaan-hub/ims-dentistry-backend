import {
  IsBoolean,
  IsNotEmpty,
} from "@nestjs/class-validator";
import { productStatus } from "@prisma/client";
import { IsOptional, IsString } from "class-validator";

export class UpdateApprovalProductDto {
  @IsOptional()
  @IsString()
  reason: string;

  @IsNotEmpty()
  @IsString()
  status: productStatus;
}
