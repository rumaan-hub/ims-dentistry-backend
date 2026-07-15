import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { BundleStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  exceptionHandler,
  handlePrismaError,
} from "src/utils/error-handler.util";
import { UspsService } from "src/usps/usps.service";

@Injectable()
export class CartService {
  private readonly logger: Logger = new Logger(CartService.name);

  constructor(private prisma: PrismaService) {}

  async addToCart(userId: string, variantId: string, quantity: number) {
    try {
      const cart = await this.prisma.cart.findUnique({
        where: { userId },
        include: { items: true },
      });

      if (!cart) {
        throw new ConflictException("Cart does not exist for this user");
      }

      const product = await this.prisma.productVariant.findUnique({
        where: {
          id: variantId,
        },
        include: {
          product: true,
        },
      });

      const item = cart.items.find((item) => item.variantId === variantId);
      if (product.quantity <= 0) {
        throw new ConflictException("This product is out of stock now!");
      } else if (product.quantity < quantity + (item ? item.quantity : 0)) {
        throw new ConflictException(
          "This product has less qunatity in the stock!"
        );
      }

      let cartItems: any = {};
      if (item) {
        cartItems = await this.prisma.cartItem.update({
          where: {
            cartId_variantId: {
              cartId: cart.id,
              variantId,
            },
          },
          include: {
            variant: {
              select: {
                product: true
              }
            },
          },
          data: { quantity: quantity + item.quantity },
        });
      } else {
        cartItems = await this.prisma.cartItem.create({
          data: {
            cartId: cart.id,
            variantId,
            quantity,
          },
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        });
      }
      return {
        data: {
          cart,
          ...cartItems,
        variant: {
          ...cartItems.variant,
          product: product.product,
        },
        },
        message: "Products has been added into the cart successfully!",
      };
    } catch (error) {
      this.logger.error("Error registering admin", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async getCartProducts(userId: string) {
    try {
      const cart = await this.prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            select: {
              variant: {
                select: {
                  id: true,
                  color: true,
                  size: true,
                  images: true,
                  quantity: true,
                  sku: true,
                  barCode: true,
                  price: true,
                  discount: true,
                  discountedPrice: true,
                  product: {
                    select: {
                      vendor: true,
                      approved: true,
                      createdAt: true,
                      vasoconstrictor: true,
                      video: true,
                      totalReviews: true,
                      totalSales: true,
                      title: true,
                      description: true,
                      manufacturer: true,
                      material: true,
                      descriptiveTitle: true,
                      construction: true,
                      featured: true,
                      rating: true,
                      reviews: true,
                      totalSold: true,
                      type: true,
                      updatedAt: true,
                      images: true,
                      id: true,
                      sds: true,
                      sterility: true,
                      style: true,
                      quantity: true,
                      dilutionRatio: true,
                      isLicenseRequired: true,
                      deliveryOptions: true,
                      flatRate: true,
                      shippingMethod: true,
                      categories: {
                        select: {
                          categoryId: true,
                          category: {
                            select: { id: true, parentId: true },
                          },
                        },
                      },
                    }
                  }
                }
              },
              quantity: true,
            },
          },
          bundleItems: {
            select: {
              quantity: true,
              priceAtAdding: true,
              bundle: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  images: true,
                  bundlePrice: true,
                  originalPrice: true,
                  discountPercentage: true,
                  deliveryCharges: true,
                  label: true,
                  isActive: true,
                  status: true,
                  vendorId: true,
                  items: {
                    select: {
                      quantity: true,
                      priceAtCreation: true,
                      product: { select: { id: true, title: true, images: true } },
                      variant: { select: { id: true, color: true, size: true, images: true } },
                    },
                  },
                },
              },
            },
          },
        },
      });
      return {
        data: cart,
      };
    } catch (error) {
      this.logger.error("Error registering admin", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async updateCart(userId: string, quantity: number, variantId: string) {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const cart = await tx.cart.findUnique({
          where: { userId },
          include: {
            items: {
              select: {
                variantId: true,
                quantity: true,
                cartId: true,
              },
            },
          },
        });
          const item = cart.items.find((item) => item.variantId === variantId);
  
        if (!item) {
          throw new Error('Item not found in cart');
        }
          if (quantity === 0) {
          await tx.cartItem.delete({
            where: {
              cartId_variantId: {
                cartId: item.cartId,
                variantId: item.variantId,
              },
            },
          });
          return { message: 'This product has been removed from the cart successfully!' };
        } else {
          const cartItem = await tx.cartItem.update({
            where: {
              cartId_variantId: {
                cartId: item.cartId,
                variantId: item.variantId,
              },
            },
            data: { quantity },
          });
          return {
            message: 'Cart has been updated successfully!',
            data: cartItem,
          };
        }
      });
  
      return result;
    } catch (error) {
      this.logger.error('Error updating cart', error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async addBundleToCart(userId: string, bundleId: string, quantity: number) {
    try {
      const cart = await this.prisma.cart.findUnique({ where: { userId } });
      if (!cart) throw new NotFoundException('Cart not found for this user.');

      const bundle = await this.prisma.bundleProduct.findUnique({
        where: { id: bundleId },
      });
      if (!bundle) throw new NotFoundException('Bundle not found.');
      if (bundle.status !== BundleStatus.APPROVED || !bundle.isActive) {
        throw new BadRequestException('This bundle is not available for purchase.');
      }

      if ((bundle as any).maxPurchasesPerUser) {
        const usageCount = await (this.prisma as any).bundleUsage.count({
          where: { bundleId, userId },
        });
        if (usageCount >= (bundle as any).maxPurchasesPerUser) {
          throw new BadRequestException(
            `You have reached the purchase limit for this bundle (max ${(bundle as any).maxPurchasesPerUser} time${(bundle as any).maxPurchasesPerUser === 1 ? '' : 's'}).`,
          );
        }
      }

      const existing = await this.prisma.bundleCartItem.findUnique({
        where: { cartId_bundleId: { cartId: cart.id, bundleId } },
      });

      if (existing) {
        const updated = await this.prisma.bundleCartItem.update({
          where: { cartId_bundleId: { cartId: cart.id, bundleId } },
          data: { quantity: existing.quantity + quantity },
        });
        return { data: updated, message: 'Bundle quantity updated in cart.' };
      }

      const item = await this.prisma.bundleCartItem.create({
        data: {
          cartId: cart.id,
          bundleId,
          quantity,
          priceAtAdding: bundle.bundlePrice,
        },
      });

      return { data: item, message: 'Bundle added to cart successfully.' };
    } catch (error) {
      this.logger.error('addBundleToCart error', error);
      if ((error as any)?.response) throw exceptionHandler(error);
      throw handlePrismaError(error);
    }
  }

  async updateBundleQuantity(userId: string, bundleId: string, quantity: number) {
    try {
      const cart = await this.prisma.cart.findUnique({ where: { userId } });
      if (!cart) throw new NotFoundException('Cart not found for this user.');

      if (quantity <= 0) {
        await this.prisma.bundleCartItem.delete({
          where: { cartId_bundleId: { cartId: cart.id, bundleId } },
        });
        return { message: 'Bundle removed from cart.' };
      }

      const updated = await this.prisma.bundleCartItem.update({
        where: { cartId_bundleId: { cartId: cart.id, bundleId } },
        data: { quantity },
      });
      return { data: updated, message: 'Bundle quantity updated.' };
    } catch (error) {
      this.logger.error('updateBundleQuantity error', error);
      if ((error as any)?.response) throw exceptionHandler(error);
      throw handlePrismaError(error);
    }
  }

  async removeBundleFromCart(userId: string, bundleId: string) {
    try {
      const cart = await this.prisma.cart.findUnique({ where: { userId } });
      if (!cart) throw new NotFoundException('Cart not found for this user.');

      const existing = await this.prisma.bundleCartItem.findUnique({
        where: { cartId_bundleId: { cartId: cart.id, bundleId } },
      });
      if (!existing) throw new NotFoundException('Bundle not found in cart.');

      await this.prisma.bundleCartItem.delete({
        where: { cartId_bundleId: { cartId: cart.id, bundleId } },
      });

      return { message: 'Bundle removed from cart successfully.' };
    } catch (error) {
      this.logger.error('removeBundleFromCart error', error);
      if ((error as any)?.response) throw exceptionHandler(error);
      throw handlePrismaError(error);
    }
  }
}
