import { IsOptional, IsString } from "@nestjs/class-validator";
import { IsArray } from "class-validator";

export class UpdateAnswerDto {
  @IsOptional()
  @IsString()
  reply?: string;
}
