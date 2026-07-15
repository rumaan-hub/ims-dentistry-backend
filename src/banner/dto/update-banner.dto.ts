import { IsString, IsOptional, IsInt, IsBoolean, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { BannerTextOverlayDto } from "./banner-text-overlay.dto";

export class UpdateBannerDto {
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  imageKey?: string;

  @IsOptional()
  @IsString()
  alt?: string;

  @IsOptional()
  @IsString()
  linkUrl?: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BannerTextOverlayDto)
  overlays?: BannerTextOverlayDto[];
}
