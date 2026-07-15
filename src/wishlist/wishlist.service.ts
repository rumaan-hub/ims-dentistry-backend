import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import {
  exceptionHandler,
  handlePrismaError,
} from "src/utils/error-handler.util";

@Injectable()
export class WishlistService {
  private readonly logger: Logger = new Logger(WishlistService.name);

  constructor(private prismaService: PrismaService) {}

  async addProductToWishlist(
    userId: string,
    variantId: string,
    quantity: number
  ) {
    try {
      const wishlist = await this.prismaService.wishList.findUnique({
        where: { userId },
        include: { items: true },
      });

      if (!wishlist) {
        throw new ConflictException("Wishlist does not exist for this user");
      }

      const product = await this.prismaService.productVariant.findUnique({
        where: {
          id: variantId,
        },
      });
      const item = wishlist.items.find((item) => item.variantId === variantId);
      if (product.quantity <= 0) {
        throw new ConflictException("This product is out of stock now!");
      } else if (product.quantity < quantity + item?.quantity) {
        throw new ConflictException(
          "This product has less qunatity in the stock!"
        );
      }
      let wishlistItems = {};
      if (item) {
        wishlistItems = await this.prismaService.wishlistItem.update({
          where: {
            wishlistId_variantId: {
              wishlistId: wishlist.id,
              variantId: item.variantId,
            },
          },
          data: { quantity: quantity + item.quantity },
        });
      } else {
        wishlistItems = await this.prismaService.wishlistItem.create({
          data: {
            wishlistId: wishlist.id,
            variantId: product.id,
            quantity,
          },
        });
      }
      await this.prismaService.product.update({
        where: {
          id: product.productId
        },
        data: {
          intoWishList: true
        }
      })
      const wishListData = await this.prismaService.wishList.findUnique({
        where: { userId },
        include: {
          items: true
        }
      })
      return {
        data: wishListData,
        message: "Products has been added into the wishlist successfully!",
      };
    } catch (error) {
      this.logger.error("Error adding wishlist", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }
  async getWishListProducts(userId: string) {
    try {
      const wishlist = await this.prismaService.wishList.findUnique({
        where: { userId },
        include: {
          items: {
            orderBy: {
              variant: {
                createdAt: "desc"
              },
            },
            select: {
              variant: {
                select: {
                  id: true,
                  price: true,
                  discountedPrice: true,
                  product: true,
                  size: true,
                  color: true, 
                  quantity: true,
                  sku: true,
                  createdAt: true,
                  updatedAt: true,
                  discount: true,
                  barCode: true,
                }
              },
              quantity: true,
            },
          },
        },
      });
      return {
        data: wishlist,
      };
    } catch (error) {
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async updateWishList(userId: string, quantity: number, variantId: string) {
    try {
      const wishList = await this.prismaService.wishList.findUnique({
        where: { userId },
        include: {
          items: {
            select: {
              variant: true,
              variantId: true,
              quantity: true,
              wishlistId: true,
            },
          },
        },
      });
      const item = wishList.items.find((item) => item.variantId === variantId);
      const variant = await this.prismaService.productVariant.findUnique({
        where: {
          id: variantId
        }
      })
      if (quantity === 0) {
        await this.prismaService.wishlistItem.delete({
          where: {
            wishlistId_variantId: {
              wishlistId: item.wishlistId,
              variantId: item.variantId,
            },
          },
        });

        await this.prismaService.product.update({
          where: {
            id: variant.productId
          },
          data: {
            intoWishList: false
          }
        })
        return {
          message:
            "This product has been removed from the wishList successfully!",
        };
      } else {
        const cartItems = await this.prismaService.wishlistItem.update({
          where: {
            wishlistId_variantId: {
              wishlistId: item.wishlistId,
              variantId: item.variantId,
            },
          },
          data: { quantity: quantity + item.quantity },
        });
        return {
          message: "WishList has been updated successfully!",
          data: cartItems,
        };
      }
    } catch (error) {
      this.logger.error("Error registering admin", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }
}
