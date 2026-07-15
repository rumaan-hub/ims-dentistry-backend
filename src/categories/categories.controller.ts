import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Put,
  Param,
  Delete,
  Query,
} from "@nestjs/common";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { CategoryService } from "./categories.service";
import { Roles } from "src/user/role/role.decorator";
import { Role } from "src/user/role/role.enum";
import { JwtGuard } from "src/user/guard/jwt.guard";
import { RolesGuard } from "src/user/role/role.guard";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Controller("category")
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Post("create")
  createCategory(@Body() createCategory: CreateCategoryDto) {
    return this.categoryService.createCategory(createCategory);
  }
  @Get("all")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  findAllCategories(
    @Query("page") page: string | number = 1,
    @Query("limit") limit: string | number = 10
  ) {
    page = Number(page);
    limit = Number(limit);
    return this.categoryService.findAllCategories(page, limit);
  }
  @Get()
  findAllApprovedCategories() {
    return this.categoryService.findAllApprovedCategories();
  }
  @Get(":id")
  findCategoryById(@Param("id") id: string) {
    return this.categoryService.findCategoryById(id);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Put("update/:id")
  updateCategory(
    @Param("id") id: string,
    @Body() updatedCategory: UpdateCategoryDto
  ) {
    return this.categoryService.updateCategory(id, updatedCategory);
  }
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Delete("delete/:id")
  deleteCategory(@Param("id") id: string) {
    return this.categoryService.deleteCategory(id);
  }
}
