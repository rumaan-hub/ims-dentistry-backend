import { IsNotEmpty, IsOptional, IsString } from "@nestjs/class-validator";
import { IsArray } from "class-validator";

export class CreateReviewsDto {
  @IsNotEmpty({ message: "Review should not be empty" })
  @IsString()
  review: string;

  @IsNotEmpty({ message: "Rating should not be empty" })
  @IsString()
  rating: string;

  @IsNotEmpty({ message: "Rating should not be empty" })
  @IsString()
  sellerRating: string;

  @IsOptional()
  @IsArray()
  images?: string[];
}
