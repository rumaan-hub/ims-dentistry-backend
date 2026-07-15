import { IsOptional, IsString } from "@nestjs/class-validator";
import { IsArray } from "class-validator";

export class UpdateReplyDto {
  @IsOptional()
  @IsString()
  reply?: string;

  @IsOptional()
  @IsArray()
  images?: string[];
}
