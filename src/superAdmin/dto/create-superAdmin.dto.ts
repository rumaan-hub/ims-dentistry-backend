import { Transform } from "class-transformer";
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "@nestjs/class-validator";
import { Role } from "src/user/role/role.enum";
import { IsOptional } from "class-validator";

export class CreateSuperAdminDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail({}, { message: "Invalid Email" })
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @IsNotEmpty({ message: "Mobile number should not be empty" })
  @IsString()
  phone: string;

  @IsNotEmpty({ message: "First name should not be empty" })
  @IsString()
  firstName: string;

  @IsNotEmpty({ message: "Last name should not be empty!" })
  @IsString()
  lastName: string;

  @IsNotEmpty({ message: "Role should not be empty" })
  @IsString()
  role: Role;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(16)
  @Matches(
    /^(?=[A-Za-z0-9@#$%^&*()+!={}~`_\[\]\'\\/:;,.<>?~"|\-\[\]]+$)(?=.*[a-z])(?=.*[0-9])(?=.*[@#$%^&*()+!={}~`_\[\]\'\\/:;,.<>?~"|\-\[\]]).{8,}$/,
    {
      message:
        "Password should contain at least 8 characters with 1 special character and 1 number",
    }
  )
  password: string;

  @IsOptional()
  @IsString()
  profile?: string;
}
