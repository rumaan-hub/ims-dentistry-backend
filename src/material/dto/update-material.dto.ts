import { IsNotEmpty, IsOptional, IsString } from "@nestjs/class-validator";

export class UpdateMaterialDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  images?: string;
}
