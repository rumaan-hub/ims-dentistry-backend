import {
  IsString,
  IsOptional,
  IsNotEmpty,
} from "class-validator";
import { vendorStatus } from "@prisma/client";

export class updateVendorStatusDto {
  @IsOptional()
  @IsString()
  reason: string;

  @IsNotEmpty()
  @IsString()
  status: vendorStatus;
}
