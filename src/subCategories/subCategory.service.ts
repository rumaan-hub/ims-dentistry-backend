// import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
// import { PrismaService } from "../prisma/prisma.service";
// import { CreateSubCategoryDto } from "./dto/create-subCategories.dto";
// import {
//   exceptionHandler,
//   handlePrismaError,
// } from "src/utils/error-handler.util";
// import { UpdateSubCategoryDto } from "./dto/update-subCategories.dto";

// @Injectable()
// export class SubCategoryService {
//   private readonly logger: Logger = new Logger(SubCategoryService.name);

//   constructor(private prismaService: PrismaService) {}

//   async createSubCategory(createCategory: CreateSubCategoryDto) {
//     try {
//       const category = await this.prismaService.category.findUnique({
//         where: {
//           id: createCategory.categoryId
//         }
//       })
//       if (!category) {
//         throw new NotFoundException('Category not found!')
//       }
//       const subCategory = await this.prismaService.subCategory.create({
//         data: createCategory,
//       });
//       return {
//         message: "Sub Category has been created successfully!",
//         data: subCategory,
//       };
//     } catch (error) {
//       this.logger.error("Error creating category", error);
//       if (error?.response) {
//         throw exceptionHandler(error);
//       } else {
//         throw handlePrismaError(error);
//       }
//     }
//   }
//   async findAllSubCategories(page: number, limit: number) {
//     try {
//       const skip = (page - 1) * limit;
//       const findSubCategories = await this.prismaService.subCategory.findMany({
//         skip: skip,
//         take: limit,
//         include: {
//           category: true,
//         },
//         orderBy: {
//           createdAt: "desc",
//         },
//       });
//       const totalSubCategories = await this.prismaService.subCategory.count();

//       return {
//         data: findSubCategories,
//         currentPage: page,
//         totalPages: Math.ceil(totalSubCategories / limit),
//         totalSubCategories: totalSubCategories,
//       };
//     } catch (error) {
//       this.logger.error("Error finding category", error);
//       if (error?.response) {
//         throw exceptionHandler(error);
//       } else {
//         throw handlePrismaError(error);
//       }
//     }
//   }
//   async findSpecificSubCategory(id: string) {
//     try {
//       const findSubCategory = await this.prismaService.subCategory.findUnique({
//         where: {
//           id,
//         },
//         include: {
//           category: true,
//         },
//       });
//       return {
//         data: findSubCategory,
//       };
//     } catch (error) {
//       this.logger.error("Error finding category", error);
//       if (error?.response) {
//         throw exceptionHandler(error);
//       } else {
//         throw handlePrismaError(error);
//       }
//     }
//   }
//   async updateSubCategory(id: string, updatedData: UpdateSubCategoryDto) {
//     try {
//       const subCategory = await this.prismaService.subCategory.findUnique({
//         where: {
//           id,
//         },
//       });
//       if (!subCategory) {
//         throw new NotFoundException("Sub-Category not found!");
//       }

//       const updatedSubCategory = await this.prismaService.subCategory.update({
//         where: {
//           id,
//         },
//         data: updatedData,
//       });
//       return {
//         message: "Sub-Category has been updated successfully!",
//         data: updatedSubCategory,
//       };
//     } catch (error) {
//       this.logger.error("Error finding category", error);
//       if (error?.response) {
//         throw exceptionHandler(error);
//       } else {
//         throw handlePrismaError(error);
//       }
//     }
//   }
//   async deleteSubCategory(id: string) {
//     try {
//       const associatedProducts = await this.prismaService.subCategory.findMany({
//         where: {
//           id,
//         },
//         include:{
//           products: true,
//         }
//       })
      
//       if(associatedProducts[0].products.length > 0) {
//         throw new BadRequestException("Deletion failed: This sub-category has associated products. Please remove or reassign them before proceeding.")
//       }
      
//       const subCategory = await this.prismaService.subCategory.findUnique({
//         where: { id },
//         include: {
//           products: {
//             include: {
//               variants: {
//                 include: {
//                   wishlistItems: true,
//                   orders: true,
//                   cartItems: true,
//                 },
//               },
//             },
//           },
//         },
//       });
  
//       if (!subCategory) {
//         throw new Error('Sub-category not found!');
//       }
  
//       for (const product of subCategory.products) {
//         for (const variant of product.variants) {
//           if (variant.orders.length) {
//             await this.prismaService.orderItems.deleteMany({
//               where: { variantId: variant.id },
//             });
//           }
  
//           if (variant.cartItems.length) {
//             await this.prismaService.cartItem.deleteMany({
//               where: { variantId: variant.id },
//             });
//           }

//           if (variant.wishlistItems.length) {
//             await this.prismaService.wishlistItem.deleteMany({
//               where: { variantId: variant.id },
//             });
//           }
  
//           await this.prismaService.productVariant.delete({
//             where: { id: variant.id },
//           });
//         }
  
//         await this.prismaService.product.delete({
//           where: { id: product.id },
//         });
//       }

//       await this.prismaService.subCategory.delete({
//         where: { id },
//       });
  
//       return {
//         message: "Sub-Category and its related products/variants/orders/cart items have been deleted successfully!",
//       };
//     } catch (error) {
//       this.logger.error("Error deleting sub-category", error);
//       if (error?.response) {
//         throw exceptionHandler(error);
//       } else {
//         throw handlePrismaError(error);
//       }
//     }
//   }
  
// }
