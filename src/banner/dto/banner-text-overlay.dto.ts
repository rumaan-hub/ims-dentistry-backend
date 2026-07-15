import { IsString, IsOptional, IsNumber, IsInt, IsIn, Min, Max } from "class-validator";

export class BannerTextOverlayDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  text: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  xPct: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  yPct: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  fontSize?: number; // percent of banner height

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsInt()
  fontWeight?: number;

  @IsOptional()
  @IsIn(["left", "center", "right"])
  align?: "left" | "center" | "right";
}
