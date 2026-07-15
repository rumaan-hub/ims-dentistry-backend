import { IsString, IsOptional } from "class-validator";

export class CreateBlogCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
