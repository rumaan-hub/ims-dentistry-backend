import { IsNotEmpty, IsOptional, IsString } from "@nestjs/class-validator";

export class CreateAnswerDto {
  @IsNotEmpty({ message: "Answer should not be empty" })
  @IsString()
  reply: string;
}
