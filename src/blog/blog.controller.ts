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
  Req,
} from "@nestjs/common";
import { JwtGuard } from "src/user/guard/jwt.guard";
import { RolesGuard } from "src/user/role/role.guard";
import { Role } from "src/user/role/role.enum";
import { Roles } from "src/user/role/role.decorator";
import { BlogService } from "./blog.service";
import { CreateBlogPostDto } from "./dto/create-blog-post.dto";
import { UpdateBlogPostDto } from "./dto/update-blog-post.dto";
import { CreateBlogCategoryDto } from "./dto/create-blog-category.dto";
import { UpdateBlogCategoryDto } from "./dto/update-blog-category.dto";
import { CreateBlogTagDto } from "./dto/create-blog-tag.dto";

@Controller("blog")
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  // ─── Blog Posts (Protected) ────────────────────────────────────

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Post("post")
  createPost(@Body() dto: CreateBlogPostDto, @Req() req: any) {
    return this.blogService.createPost(dto, req.user);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Put("post/:id")
  updatePost(@Param("id") id: string, @Body() dto: UpdateBlogPostDto) {
    return this.blogService.updatePost(id, dto);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Put("post/:id/publish")
  togglePublish(@Param("id") id: string) {
    return this.blogService.togglePublish(id);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Delete("post/:id")
  deletePost(@Param("id") id: string) {
    return this.blogService.deletePost(id);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Get("post/admin/all")
  findAllPostsAdmin(
    @Query("page") page: string | number = 1,
    @Query("limit") limit: string | number = 10,
    @Query("search") search?: string,
  ) {
    return this.blogService.findAllPostsAdmin(Number(page), Number(limit), search);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Get("post/admin/:id")
  findPostByIdAdmin(@Param("id") id: string) {
    return this.blogService.findPostByIdAdmin(id);
  }

  // ─── Blog Posts (Public) ───────────────────────────────────────

  @Get("posts")
  findPublishedPosts(
    @Query("page") page: string | number = 1,
    @Query("limit") limit: string | number = 10,
    @Query("search") search?: string,
  ) {
    return this.blogService.findPublishedPosts(Number(page), Number(limit), search);
  }

  @Get("post/:slug")
  findPostBySlug(@Param("slug") slug: string) {
    return this.blogService.findPostBySlug(slug);
  }

  @Get("posts/category/:slug")
  findPostsByCategorySlug(
    @Param("slug") slug: string,
    @Query("page") page: string | number = 1,
    @Query("limit") limit: string | number = 10,
  ) {
    return this.blogService.findPostsByCategorySlug(slug, Number(page), Number(limit));
  }

  @Get("posts/tag/:slug")
  findPostsByTagSlug(
    @Param("slug") slug: string,
    @Query("page") page: string | number = 1,
    @Query("limit") limit: string | number = 10,
  ) {
    return this.blogService.findPostsByTagSlug(slug, Number(page), Number(limit));
  }

  // ─── Blog Categories ──────────────────────────────────────────

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Post("category")
  createCategory(@Body() dto: CreateBlogCategoryDto) {
    return this.blogService.createCategory(dto);
  }

  @Get("categories")
  findAllCategories() {
    return this.blogService.findAllCategories();
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Put("category/:id")
  updateCategory(@Param("id") id: string, @Body() dto: UpdateBlogCategoryDto) {
    return this.blogService.updateCategory(id, dto);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Delete("category/:id")
  deleteCategory(@Param("id") id: string) {
    return this.blogService.deleteCategory(id);
  }

  // ─── Blog Tags ─────────────────────────────────────────────────

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Post("tag")
  createTag(@Body() dto: CreateBlogTagDto) {
    return this.blogService.createTag(dto);
  }

  @Get("tags")
  findAllTags() {
    return this.blogService.findAllTags();
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Delete("tag/:id")
  deleteTag(@Param("id") id: string) {
    return this.blogService.deleteTag(id);
  }
}
