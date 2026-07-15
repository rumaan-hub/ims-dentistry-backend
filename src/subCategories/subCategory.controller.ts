// import {
//   Controller,
//   Post,
//   Body,
//   UseGuards,
//   Get,
//   Put,
//   Param,
//   Delete,
//   Query,
// } from "@nestjs/common";
// import { CreateSubCategoryDto } from "./dto/create-subCategories.dto";
// import { SubCategoryService } from "./subCategory.service";
// import { Roles } from "src/user/role/role.decorator";
// import { Role } from "src/user/role/role.enum";
// import { JwtGuard } from "src/user/guard/jwt.guard";
// import { RolesGuard } from "src/user/role/role.guard";
// import { UpdateSubCategoryDto } from "./dto/update-subCategories.dto";

// @Controller("subCategory")
// export class SubCategoryController {
//   constructor(private readonly subCategoryService: SubCategoryService) {}

//   @UseGuards(JwtGuard, RolesGuard)
//   @Roles(Role.SUPER_ADMIN, Role.ADMIN)
//   @Post("create")
//   createSubCategory(@Body() createCategory: CreateSubCategoryDto) {
//     return this.subCategoryService.createSubCategory(createCategory);
//   }

//   @Get("all")
//   findAllSubCategories(
//     @Query("page") page: number = 1,
//     @Query("limit") limit: number = 100
//   ) {
//     page = Number(page);
//     limit = Number(limit);
//     return this.subCategoryService.findAllSubCategories(page, limit);
//   }

//   @Get(":id")
//   findSpecificSubCategory(@Param("id") id: string) {
//     return this.subCategoryService.findSpecificSubCategory(id);
//   }

//   @UseGuards(JwtGuard, RolesGuard)
//   @Roles(Role.SUPER_ADMIN, Role.ADMIN)
//   @Put("update/:id")
//   updateSubCategory(
//     @Param("id") id: string,
//     @Body() updatedData: UpdateSubCategoryDto
//   ) {
//     return this.subCategoryService.updateSubCategory(id, updatedData);
//   }

//   @UseGuards(JwtGuard, RolesGuard)
//   @Roles(Role.SUPER_ADMIN, Role.ADMIN)
//   @Delete("delete/:id")
//   deleteSubCategory(@Param("id") id: string) {
//     return this.subCategoryService.deleteSubCategory(id);
//   }
// }
