import {
    IsString,
    IsOptional,
    IsBoolean
  } from "@nestjs/class-validator";
  
  export class UpdateCategoryDto {
    @IsOptional()
    @IsString()
    name: string;
  
    @IsOptional()
    @IsString()
    image: string;

    @IsOptional()
    @IsBoolean()
    approved: boolean;
  }
  