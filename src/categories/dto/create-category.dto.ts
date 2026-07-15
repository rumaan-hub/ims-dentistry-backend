import {
  IsNotEmpty,
  IsString,
} from "@nestjs/class-validator";

export class CreateCategoryDto {
  @IsNotEmpty({ message: "Category Name should not be empty" })
  @IsString()
  name: string;

  @IsNotEmpty({ message: "Category image should not be empty" })
  @IsString()
  image: string;
}
