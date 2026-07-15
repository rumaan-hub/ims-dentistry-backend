import { IsNotEmpty, IsOptional, IsString } from "@nestjs/class-validator";
import { IsArray } from "class-validator";

export class CreateReplyDto {
  @IsNotEmpty({ message: "Review should not be empty" })
  @IsString()
  reply: string;

  @IsOptional()
  @IsArray()
  images?: string[];
}
