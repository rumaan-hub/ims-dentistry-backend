import { Transform } from "class-transformer";
import {
    IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "@nestjs/class-validator";
import { Role } from "../role/role.enum";

export class UpdateVerfication {
  @IsNotEmpty({ message: "Verfied user should not be empty" })
  @IsBoolean()
  isVerified: boolean;
}
