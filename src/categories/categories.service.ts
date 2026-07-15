import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import {
  exceptionHandler,
  handlePrismaError,
} from "src/utils/error-handler.util";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoryService {
  private readonly logger: Logger = new Logger(CategoryService.name);

  constructor(private prismaService: PrismaService) { }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/&/g, "and")
      .replace(/[()]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = this.slugify(name);
    const existing = await this.prismaService.category.findUnique({
      where: { slug: baseSlug },
    });
    if (!existing) return baseSlug;
    const uniqueSlug = `${baseSlug}-${Date.now()}`;
    return uniqueSlug;
  }

  async createCategory(createCategory: CreateCategoryDto) {
    try {
      const specificCategory = await this.prismaService.category.findFirst({
        where: {
          name: createCategory.name,
        },
      });
      if (specificCategory) {
        throw new ConflictException(
          "The category of this name is already exist!",
        );
      }
      const slug = await this.generateUniqueSlug(createCategory.name);
      const category = await this.prismaService.category.create({
        data: {
          ...createCategory,
          slug,
        },
      });
      return {
        message: "Category has been created successfully!",
        data: category,
      };
    } catch (error) {
      this.logger.error("Error creating category", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }
  async findAllApprovedCategories() {
    try {
      // old code logic preserved
      // const allCategories = await this.prismaService.category.findMany({
      //   where: {
      //     approved: true,
      //   },
      //   orderBy: {
      //     createdAt: "desc",
      //   },
      //   include: {
      //     children: true,
      //   },
      // });

      const allCategories = await this.prismaService.category.findMany({
        where: {
          approved: true,
          parentId: null, // Only fetch parent (main) categories
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          children: true, // Auto-includes related subcategories
        },
      });
      return {
        data: allCategories,
      };
    } catch (error) {
      this.logger.error("Error creating category", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }
  async findAllCategories(page: number, limit: number) {
    try {
      const skip = (page - 1) * limit;
      const allCategories = await this.prismaService.category.findMany({
        skip: skip,
        take: limit,
        include: {
          // subCategories: true,
          children: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      const totalCategories = await this.prismaService.category.count();
      return {
        data: allCategories,
        currentPage: page,
        totalPages: Math.ceil(totalCategories / limit),
        totalCategories: totalCategories,
      };
    } catch (error) {
      this.logger.error("Error creating category", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }
  async updateCategory(
    categoryId: string,
    updatedCategoryData: UpdateCategoryDto,
  ) {
    try {
      const updatedCategory = await this.prismaService.category.update({
        where: {
          id: categoryId,
        },
        data: updatedCategoryData,
      });
      return {
        message: "Category has been updated successfully!",
        data: updatedCategory,
      };
    } catch (error) {
      this.logger.error("Error creating category", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }
  async deleteCategory(categoryId: string) {
    try {
      const associatedSubCategories =
        await this.prismaService.category.findMany({
          // where: { categoryId },
          where: { parentId: categoryId },
          include: {
            products: true,
          },
        });
      for (const subCategory of associatedSubCategories) {
        if (subCategory?.products?.length > 0) {
          throw new BadRequestException(
            "Category deletion failed: Subcategories associated with this category are linked to products.",
          );
        }
      }

      const subCategories = await this.prismaService.category.findMany({
        where: { parentId: categoryId },
        include: {
          products: {
            // ProductCategory[]
            include: {
              product: {
                // real Product
                include: {
                  variants: {
                    include: {
                      wishlistItems: true,
                      orders: true,
                      cartItems: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // const subCategories = await this.prismaService.category.findMany({
      // where: { categoryId },
      //   include: {
      //     products: {
      //       include: {
      //         variants: {
      //           include: {
      //             wishlistItems: true,
      //             orders: true,
      //             cartItems: true,
      //           },
      //         },
      //       },
      //     },
      //   },
      // });

      if (subCategories.length) {
        for (const subCategory of subCategories) {
          // for (const product of subCategory.products) {
          for (const pc of subCategory.products) {
            const product = pc.product;
            //
            for (const variant of product.variants) {
              if (variant.orders.length) {
                await this.prismaService.orderItems.deleteMany({
                  where: { variantId: variant.id },
                });
              }

              if (variant.cartItems.length) {
                await this.prismaService.cartItem.deleteMany({
                  where: { variantId: variant.id },
                });
              }

              if (variant.wishlistItems.length) {
                await this.prismaService.wishlistItem.deleteMany({
                  where: { variantId: variant.id },
                });
              }

              await this.prismaService.productVariant.delete({
                where: { id: variant.id },
              });
            }

            await this.prismaService.product.delete({
              where: { id: product.id },
            });
          }

          await this.prismaService.category.delete({
            where: { id: subCategory.id },
          });
        }
      }

      await this.prismaService.category.delete({
        where: {
          id: categoryId,
        },
      });

      return {
        message:
          "Category and its related subcategories/products/orders/cart items have been deleted successfully!",
      };
    } catch (error) {
      this.logger.error("Error deleting category", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async findCategoryById(categoryId: string) {
    try {
      const category = await this.prismaService.category.findUnique({
        where: {
          id: categoryId,
        },
        include: {
          children: true,
        },
        // include: {
        //   subCategories: {
        //     include: {
        //       products: true,
        //     },
        //   },
        // },
      });
      return {
        data: category,
      };
    } catch (error) {
      this.logger.error("Error creating category", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }
}
