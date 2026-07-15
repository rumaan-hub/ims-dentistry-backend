import { IsNotEmpty, IsString } from "@nestjs/class-validator";

export class CreateQuestionsDto {
  @IsNotEmpty({ message: "Question should not be empty" })
  @IsString()
  question: string;
}
