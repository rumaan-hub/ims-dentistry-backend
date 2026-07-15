import { IsEmail, IsNotEmpty, IsString } from "@nestjs/class-validator";
import { Transform } from "class-transformer";

export class CreateGetInTouchDto {
  @IsNotEmpty({ message: "Get in touch name should not be empty" })
  @IsString()
  name: string;

  @IsNotEmpty({ message: "Get in touch email should not be empty" })
  @IsString()
  @IsEmail({}, { message: "Invalid Email" })
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @IsNotEmpty({ message: "Get in touch subject should not be empty" })
  @IsString()
  subject: string;

  @IsNotEmpty({ message: "Get in touch message should not be empty" })
  @IsString()
  message: string;
}
