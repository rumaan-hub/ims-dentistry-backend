import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateBlogPostDto } from "./dto/create-blog-post.dto";
import { UpdateBlogPostDto } from "./dto/update-blog-post.dto";
import { CreateBlogCategoryDto } from "./dto/create-blog-category.dto";
import { UpdateBlogCategoryDto } from "./dto/update-blog-category.dto";
import { CreateBlogTagDto } from "./dto/create-blog-tag.dto";
import {
  exceptionHandler,
  handlePrismaError,
} from "src/utils/error-handler.util";

@Injectable()
export class BlogService {
  private readonly logger: Logger = new Logger(BlogService.name);

  constructor(private prismaService: PrismaService) {}

  // ─── Slug Helper ───────────────────────────────────────────────

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  private async ensureUniquePostSlug(slug: string, excludeId?: string): Promise<string> {
    let finalSlug = slug;
    let counter = 1;
    while (true) {
      const existing = await this.prismaService.blogPost.findUnique({
        where: { slug: finalSlug },
      });
      if (!existing || (excludeId && existing.id === excludeId)) {
        return finalSlug;
      }
      finalSlug = `${slug}-${counter}`;
      counter++;
    }
  }

  private async ensureUniqueCategorySlug(slug: string, excludeId?: string): Promise<string> {
    let finalSlug = slug;
    let counter = 1;
    while (true) {
      const existing = await this.prismaService.blogCategory.findUnique({
        where: { slug: finalSlug },
      });
      if (!existing || (excludeId && existing.id === excludeId)) {
        return finalSlug;
      }
      finalSlug = `${slug}-${counter}`;
      counter++;
    }
  }

  private async ensureUniqueTagSlug(slug: string, excludeId?: string): Promise<string> {
    let finalSlug = slug;
    let counter = 1;
    while (true) {
      const existing = await this.prismaService.blogTag.findUnique({
        where: { slug: finalSlug },
      });
      if (!existing || (excludeId && existing.id === excludeId)) {
        return finalSlug;
      }
      finalSlug = `${slug}-${counter}`;
      counter++;
    }
  }

  // ─── Blog Posts ────────────────────────────────────────────────

  async createPost(dto: CreateBlogPostDto, user: any) {
    try {
      const slug = await this.ensureUniquePostSlug(this.generateSlug(dto.title));
      const { tagIds, ...postData } = dto;

      const post = await this.prismaService.blogPost.create({
        data: {
          ...postData,
          slug,
          publishedAt: dto.published ? new Date() : null,
          adminId: user.role === "ADMIN" ? user.id : null,
          vendorId: user.role === "VENDOR" ? user.id : null,
          tags: tagIds?.length
            ? { create: tagIds.map((tagId) => ({ tagId })) }
            : undefined,
        },
        include: {
          category: true,
          tags: { include: { tag: true } },
        },
      });

      return {
        message: "Blog post created successfully!",
        data: post,
      };
    } catch (error) {
      this.logger.error("Error creating blog post", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async updatePost(postId: string, dto: UpdateBlogPostDto) {
    try {
      const existing = await this.prismaService.blogPost.findUnique({
        where: { id: postId },
      });
      if (!existing) throw new NotFoundException("Blog post not found");

      const { tagIds, ...postData } = dto;

      // If title changed, regenerate slug
      if (dto.title && dto.title !== existing.title) {
        (postData as any).slug = await this.ensureUniquePostSlug(
          this.generateSlug(dto.title),
          postId,
        );
      }

      // Handle publish state
      if (dto.published === true && !existing.published) {
        (postData as any).publishedAt = new Date();
      }

      // Update tags if provided
      if (tagIds !== undefined) {
        await this.prismaService.blogPostTag.deleteMany({
          where: { postId },
        });
      }

      const post = await this.prismaService.blogPost.update({
        where: { id: postId },
        data: {
          ...postData,
          tags:
            tagIds !== undefined
              ? { create: tagIds.map((tagId) => ({ tagId })) }
              : undefined,
        },
        include: {
          category: true,
          tags: { include: { tag: true } },
          admin: { select: { id: true, firstName: true, lastName: true } },
          vendors: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      return {
        message: "Blog post updated successfully!",
        data: post,
      };
    } catch (error) {
      this.logger.error("Error updating blog post", error);
      if (error instanceof NotFoundException) throw error;
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async togglePublish(postId: string) {
    try {
      const existing = await this.prismaService.blogPost.findUnique({
        where: { id: postId },
      });
      if (!existing) throw new NotFoundException("Blog post not found");

      const post = await this.prismaService.blogPost.update({
        where: { id: postId },
        data: {
          published: !existing.published,
          publishedAt: !existing.published ? new Date() : existing.publishedAt,
        },
      });

      return {
        message: post.published
          ? "Blog post published successfully!"
          : "Blog post unpublished successfully!",
        data: post,
      };
    } catch (error) {
      this.logger.error("Error toggling blog post publish", error);
      if (error instanceof NotFoundException) throw error;
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async deletePost(postId: string) {
    try {
      const existing = await this.prismaService.blogPost.findUnique({
        where: { id: postId },
      });
      if (!existing) throw new NotFoundException("Blog post not found");

      await this.prismaService.blogPostTag.deleteMany({
        where: { postId },
      });

      await this.prismaService.blogPost.delete({
        where: { id: postId },
      });

      return { message: "Blog post deleted successfully!" };
    } catch (error) {
      this.logger.error("Error deleting blog post", error);
      if (error instanceof NotFoundException) throw error;
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  // Admin: all posts (paginated, includes drafts)
  async findAllPostsAdmin(page: number, limit: number, search?: string) {
    try {
      const skip = (page - 1) * limit;
      const where: any = {};

      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
        ];
      }

      const [posts, totalPosts] = await Promise.all([
        this.prismaService.blogPost.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            category: true,
            tags: { include: { tag: true } },
            admin: { select: { id: true, firstName: true, lastName: true } },
            vendors: { select: { id: true, firstName: true, lastName: true } },
          },
        }),
        this.prismaService.blogPost.count({ where }),
      ]);

      return {
        data: posts,
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
      };
    } catch (error) {
      this.logger.error("Error fetching all blog posts", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  // Admin: single post by id
  async findPostByIdAdmin(postId: string) {
    try {
      const post = await this.prismaService.blogPost.findUnique({
        where: { id: postId },
        include: {
          category: true,
          tags: { include: { tag: true } },
          admin: { select: { id: true, firstName: true, lastName: true } },
          vendors: { select: { id: true, firstName: true, lastName: true } },
        },
      });
      if (!post) throw new NotFoundException("Blog post not found");
      return { data: post };
    } catch (error) {
      this.logger.error("Error fetching blog post", error);
      if (error instanceof NotFoundException) throw error;
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  // Public: published posts (paginated)
  async findPublishedPosts(page: number, limit: number, search?: string) {
    try {
      const skip = (page - 1) * limit;
      const where: any = { published: true };

      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { excerpt: { contains: search, mode: "insensitive" } },
        ];
      }

      const [posts, totalPosts] = await Promise.all([
        this.prismaService.blogPost.findMany({
          where,
          skip,
          take: limit,
          orderBy: { publishedAt: "desc" },
          include: {
            category: true,
            tags: { include: { tag: true } },
            admin: { select: { id: true, firstName: true, lastName: true } },
            vendors: { select: { id: true, firstName: true, lastName: true } },
          },
        }),
        this.prismaService.blogPost.count({ where }),
      ]);

      return {
        data: posts,
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
      };
    } catch (error) {
      this.logger.error("Error fetching published blog posts", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  // Public: single post by slug
  async findPostBySlug(slug: string) {
    try {
      const post = await this.prismaService.blogPost.findUnique({
        where: { slug, published: true },
        include: {
          category: true,
          tags: { include: { tag: true } },
          admin: { select: { id: true, firstName: true, lastName: true } },
          vendors: { select: { id: true, firstName: true, lastName: true } },
        },
      });
      if (!post) throw new NotFoundException("Blog post not found");
      return { data: post };
    } catch (error) {
      this.logger.error("Error fetching blog post by slug", error);
      if (error instanceof NotFoundException) throw error;
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  // Public: posts by category slug
  async findPostsByCategorySlug(categorySlug: string, page: number, limit: number) {
    try {
      const category = await this.prismaService.blogCategory.findUnique({
        where: { slug: categorySlug },
      });
      if (!category) throw new NotFoundException("Blog category not found");

      const skip = (page - 1) * limit;
      const where = { published: true, categoryId: category.id };

      const [posts, totalPosts] = await Promise.all([
        this.prismaService.blogPost.findMany({
          where,
          skip,
          take: limit,
          orderBy: { publishedAt: "desc" },
          include: {
            category: true,
            tags: { include: { tag: true } },
          },
        }),
        this.prismaService.blogPost.count({ where }),
      ]);

      return {
        data: posts,
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
      };
    } catch (error) {
      this.logger.error("Error fetching posts by category", error);
      if (error instanceof NotFoundException) throw error;
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  // Public: posts by tag slug
  async findPostsByTagSlug(tagSlug: string, page: number, limit: number) {
    try {
      const tag = await this.prismaService.blogTag.findUnique({
        where: { slug: tagSlug },
      });
      if (!tag) throw new NotFoundException("Blog tag not found");

      const skip = (page - 1) * limit;
      const where = {
        published: true,
        tags: { some: { tagId: tag.id } },
      };

      const [posts, totalPosts] = await Promise.all([
        this.prismaService.blogPost.findMany({
          where,
          skip,
          take: limit,
          orderBy: { publishedAt: "desc" },
          include: {
            category: true,
            tags: { include: { tag: true } },
          },
        }),
        this.prismaService.blogPost.count({ where }),
      ]);

      return {
        data: posts,
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
      };
    } catch (error) {
      this.logger.error("Error fetching posts by tag", error);
      if (error instanceof NotFoundException) throw error;
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  // ─── Blog Categories ──────────────────────────────────────────

  async createCategory(dto: CreateBlogCategoryDto) {
    try {
      const existingCategory = await this.prismaService.blogCategory.findFirst({
        where: { name: dto.name },
      });
      if (existingCategory) {
        throw new ConflictException("A blog category with this name already exists!");
      }

      const slug = await this.ensureUniqueCategorySlug(this.generateSlug(dto.name));

      const category = await this.prismaService.blogCategory.create({
        data: { ...dto, slug },
      });

      return {
        message: "Blog category created successfully!",
        data: category,
      };
    } catch (error) {
      this.logger.error("Error creating blog category", error);
      if (error instanceof ConflictException) throw error;
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async findAllCategories() {
    try {
      const categories = await this.prismaService.blogCategory.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { posts: true } },
        },
      });
      return { data: categories };
    } catch (error) {
      this.logger.error("Error fetching blog categories", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async updateCategory(categoryId: string, dto: UpdateBlogCategoryDto) {
    try {
      const existing = await this.prismaService.blogCategory.findUnique({
        where: { id: categoryId },
      });
      if (!existing) throw new NotFoundException("Blog category not found");

      const updateData: any = { ...dto };
      if (dto.name && dto.name !== existing.name) {
        updateData.slug = await this.ensureUniqueCategorySlug(
          this.generateSlug(dto.name),
          categoryId,
        );
      }

      const category = await this.prismaService.blogCategory.update({
        where: { id: categoryId },
        data: updateData,
      });

      return {
        message: "Blog category updated successfully!",
        data: category,
      };
    } catch (error) {
      this.logger.error("Error updating blog category", error);
      if (error instanceof NotFoundException) throw error;
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async deleteCategory(categoryId: string) {
    try {
      const existing = await this.prismaService.blogCategory.findUnique({
        where: { id: categoryId },
        include: { _count: { select: { posts: true } } },
      });
      if (!existing) throw new NotFoundException("Blog category not found");

      if (existing._count.posts > 0) {
        throw new BadRequestException(
          "Cannot delete category that has blog posts. Remove or reassign the posts first.",
        );
      }

      await this.prismaService.blogCategory.delete({
        where: { id: categoryId },
      });

      return { message: "Blog category deleted successfully!" };
    } catch (error) {
      this.logger.error("Error deleting blog category", error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  // ─── Blog Tags ─────────────────────────────────────────────────

  async createTag(dto: CreateBlogTagDto) {
    try {
      const existingTag = await this.prismaService.blogTag.findFirst({
        where: { name: dto.name },
      });
      if (existingTag) {
        throw new ConflictException("A blog tag with this name already exists!");
      }

      const slug = await this.ensureUniqueTagSlug(this.generateSlug(dto.name));

      const tag = await this.prismaService.blogTag.create({
        data: { name: dto.name, slug },
      });

      return {
        message: "Blog tag created successfully!",
        data: tag,
      };
    } catch (error) {
      this.logger.error("Error creating blog tag", error);
      if (error instanceof ConflictException) throw error;
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async findAllTags() {
    try {
      const tags = await this.prismaService.blogTag.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { posts: true } },
        },
      });
      return { data: tags };
    } catch (error) {
      this.logger.error("Error fetching blog tags", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async deleteTag(tagId: string) {
    try {
      const existing = await this.prismaService.blogTag.findUnique({
        where: { id: tagId },
      });
      if (!existing) throw new NotFoundException("Blog tag not found");

      await this.prismaService.blogPostTag.deleteMany({
        where: { tagId },
      });

      await this.prismaService.blogTag.delete({
        where: { id: tagId },
      });

      return { message: "Blog tag deleted successfully!" };
    } catch (error) {
      this.logger.error("Error deleting blog tag", error);
      if (error instanceof NotFoundException) throw error;
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }
}
