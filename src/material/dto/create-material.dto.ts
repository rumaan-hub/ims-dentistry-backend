import { IsNotEmpty, IsOptional, IsString } from "@nestjs/class-validator";

export class CreateMaterialDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  images?: string;
}
