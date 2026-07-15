import { IsNotEmpty, IsString } from "@nestjs/class-validator";
import { Transform } from "class-transformer";

export class CreateInventoryTypeDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
  name: string;
}
