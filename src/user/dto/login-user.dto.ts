import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "@nestjs/class-validator";
import { Transform } from "class-transformer";
import { Role } from "../role/role.enum";

export class LoginDTO {
  @IsNotEmpty()
  @IsString()
  @IsEmail({}, { message: "Invalid Email" })
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @IsOptional()
  @IsString()
  role: Role;

  @IsString()
  password: string;
}

export class ResendEmailDTO {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class GoogleAuthDTO {
  @IsNotEmpty()
  @IsString()
  idToken: string;
}
