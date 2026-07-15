import { IsOptional, IsString } from "@nestjs/class-validator";
import { IsArray } from "class-validator";

export class UpdateReviewsDto {
  @IsOptional()
  @IsString()
  review: string;

  @IsOptional()
  @IsString()
  rating: string;

  @IsOptional()
  @IsString()
  sellerRating: string;

  @IsOptional()
  @IsArray()
  images?: string[];
}
