import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreatePromotionDto } from "./dto/create.promotions.dto";
import {
  CustomerType,
  DurationType,
  EligibleCustomerType,
  PromotionType,
} from "@prisma/client";
import {
  exceptionHandler,
  handlePrismaError,
} from "src/utils/error-handler.util";
import { UpdatePromotionDto } from "./dto/update.promotions.dto";
import { PromotionFilter } from "./dto/filter.options.dto";
import { ApplyPromotionDto, ValidatePromotionDto } from "./dto/validate-promotion.dto";

@Injectable()
export class PromotionsService {
  private readonly logger: Logger = new Logger(PromotionsService.name);
  constructor(private prismaService: PrismaService) {}

  async addPromotion(dto: CreatePromotionDto, vendorId: string) {
    try {
      const vendor = await this.prismaService.vendors.findUnique({
        where: { id: vendorId },
      });
      if (!vendor) {
        throw new NotFoundException("Vendor not found.");
      }

      const vendorProducts = await this.prismaService.product.findMany({
        where: { id: { in: dto.selectedProductIds }, vendorId: vendorId },
      });
      if (!vendorProducts) {
        throw new NotFoundException(`Product for vendor not found.`);
      }

      switch (dto.type) {
        case PromotionType.FREE_SHIPPING:
          if (dto.minPurchaseValue == null || dto.freeShippingValue == null) {
            throw new BadRequestException(
              "FREE_SHIPPING promotion must include minPurchaseValue and freeShippingValue."
            );
          }

          if (dto.deliveryOptions === null) {
            throw new BadRequestException("Delivery option is required.");
          }
          break;

        case PromotionType.BUY_X_GET_Y:
          if (!dto.buyQuantity) {
            throw new BadRequestException("Buy Quantity is required.");
          }
          if (
            !dto.buyProductIds &&
            (!dto.buyProductIds || dto.buyProductIds.length === null)
          ) {
            throw new BadRequestException(
              "You must provide products for BUY_X_GET_Y."
            );
          }
          if (!dto.getQuantity) {
            throw new BadRequestException("Get Quantity is required.");
          }
          if (
            !dto.getProductIds &&
            (!dto.getProductIds || dto.getProductIds.length === null)
          ) {
            throw new BadRequestException(
              "You must provide products for BUY_X_GET_Y."
            );
          }
          break;

        case PromotionType.BUNDLE_DEALS:
          if (!dto.bundleDeals || dto.bundleDeals.length === 0) {
            throw new BadRequestException(
              "At least one bundle deal tier is required for Bundle Deal promotion."
            );
          }
          for (const deal of dto.bundleDeals) {
            if (deal.bundleQuantity <= 0) {
              throw new BadRequestException(
                "Same product quantity must be greater than 0."
              );
            }
            if (
              deal.bundleFixedDiscount <= 0 ||
              deal.bundlePercentageDiscount <= 0
            ) {
              throw new BadRequestException(
                "Discount value must be greater than 0 for (percentage and fixed)."
              );
            }
          }
          break;

        case PromotionType.SPEND_MONEY:
          if (!dto.spendAmount || dto.spendAmount <= 0) {
            throw new BadRequestException(
              "Spend money should be greater than $0."
            );
          }

          if (dto.spendFixedDiscount <= 0 || dto.spendPercentageDiscount <= 0) {
            throw new BadRequestException(
              "Discount value must be greater than 0 for (percentage and fixed)."
            );
          }

          if (dto.spendFixedDiscount && dto.spendPercentageDiscount) {
            throw new BadRequestException(
              "Only one discount type (fixed or percentage) should be provided for Spend Money promotion."
            );
          }
          break;

        case PromotionType.PROMO_CODE:
          if (!dto.code?.trim()) {
            throw new BadRequestException('PROMO_CODE promotion requires a code.');
          }
          if (!dto.spendFixedDiscount && !dto.spendPercentageDiscount) {
            throw new BadRequestException(
              'PROMO_CODE requires either spendFixedDiscount or spendPercentageDiscount.'
            );
          }
          if (dto.spendFixedDiscount && dto.spendPercentageDiscount) {
            throw new BadRequestException(
              'Only one discount type (fixed or percentage) should be provided for PROMO_CODE.'
            );
          }
          break;

        default:
          throw new BadRequestException(
            `Unsupported promotion type: ${dto.type}`
          );
      }

      if (dto.capMinValue === null || dto.capMaxValue === null) {
        throw new BadRequestException(
          "Cap Limit value must include minValue and maxValue."
        );
      }

      if (dto.type === "BUY_X_GET_Y") {
        this.logger.log("selectedProductIds will be false here.");
      } else if (
        !dto.appliesToAllProducts &&
        (!dto.selectedProductIds || dto.selectedProductIds.length === 0)
      ) {
        throw new BadRequestException(
          "You must provide products when AllProducts is false."
        );
      }

      if (dto.eligibleCustomers === EligibleCustomerType.ADD_CUSTOMER) {
        if (!dto.customerTypes || dto.customerTypes.length === 0) {
          throw new BadRequestException(
            "You must provide Customer Type when Customer Eligibility is Add Customer."
          );
        }

        if (dto.customerTypes.includes(CustomerType.HIGH_SPEND)) {
          if (
            dto.highSpendLimit === undefined ||
            dto.highSpendLimit === null ||
            isNaN(dto.highSpendLimit)
          ) {
            throw new BadRequestException(
              "High Spend Limit must be provided when customer type includes HIGH_SPENDER."
            );
          }
        }
      }

      if (dto.durationType === DurationType.SELECTED_TIME) {
        if (!dto.startDate || !dto.endDate) {
          throw new BadRequestException(
            "Start and End dates are required when Duration is Selected Time."
          );
        }
        if (dto.startDate >= dto.endDate) {
          throw new BadRequestException("startDate must be before endDate.");
        }
      }

      if (dto.selectedProductIds || dto.buyProductIds || dto.getProductIds) {
        const productIds = [
          ...(dto.selectedProductIds || []),
          ...(dto.buyProductIds || []),
          ...(dto.getProductIds || [])
        ];
        const uniqueProductIds = [...new Set(productIds)];
        if (uniqueProductIds.length > 0) {
          const validProducts = await this.prismaService.product.count({
            where: { 
              id: { in: uniqueProductIds },
              vendorId 
            }
          });
          if (validProducts !== uniqueProductIds.length) {
            throw new BadRequestException("Some products don't belong to vendor");
          }
        }
      }

      const promotion = await this.prismaService.promotion.create({
        data: {
          name: dto.name,
          code: dto.code,
          type: dto.type,
          minPurchaseValue:
            dto.type === "FREE_SHIPPING" ? dto.minPurchaseValue : null,
          freeShippingValue:
            dto.type === "FREE_SHIPPING" ? dto.freeShippingValue : null,
          maxOrdersPerUser: dto.maxOrdersPerUser ?? null,
          appliesToAllProducts:
            dto.type === "BUY_X_GET_Y" ? false : dto.appliesToAllProducts,
          selectedProductIds:
            dto.type === "BUY_X_GET_Y" ? [] : dto.selectedProductIds,
          capMinValue: dto.type === "BUY_X_GET_Y" ? null : dto.capMinValue,
          capMaxValue: dto.type === "BUY_X_GET_Y" ? null : dto.capMaxValue,
          eligibleCustomers: dto.eligibleCustomers,
          customerTypes:
            dto.eligibleCustomers === "ALL" ? [] : dto.customerTypes,
          highSpendLimit:
            dto.eligibleCustomers === "ADD_CUSTOMER" &&
            dto.customerTypes.includes("HIGH_SPEND")
              ? dto.highSpendLimit
              : null,
          eligibleCountries:
            dto.eligibleCustomers === "ALL" ? [] : dto.eligibleCountries,
          eligibleStates:
            dto.eligibleCustomers === "ALL" ? [] : dto.eligibleStates,
          eligibleCities:
            dto.eligibleCustomers === "ALL" ? [] : dto.eligibleCities,
          deliveryOptions:
            dto.type === "FREE_SHIPPING" ? dto.deliveryOptions : [],
          durationType: dto.durationType,
          startDate: dto.durationType === "LONG_TIME" ? null : dto.startDate,
          endDate: dto.durationType === "LONG_TIME" ? null : dto.endDate,
          status: true,
          buyQuantity: dto.type === "BUY_X_GET_Y" ? dto.buyQuantity : null,
          buyProductIds: dto.type === "BUY_X_GET_Y" ? dto.buyProductIds : [],
          getQuantity: dto.type === "BUY_X_GET_Y" ? dto.getQuantity : null,
          getProductIds: dto.type === "BUY_X_GET_Y" ? dto.getProductIds : [],
          spendAmount: dto.type === "SPEND_MONEY" ? dto.spendAmount : null,
          spendFixedDiscount:
            (dto.type === "SPEND_MONEY" || dto.type === "PROMO_CODE") ? dto.spendFixedDiscount : null,
          spendPercentageDiscount:
            (dto.type === "SPEND_MONEY" || dto.type === "PROMO_CODE") ? dto.spendPercentageDiscount : null,
          selectedCategoryIds: dto.type === "PROMO_CODE" ? (dto.selectedCategoryIds ?? []) : [],
          totalUsageLimit: dto.type === "PROMO_CODE" ? (dto.totalUsageLimit ?? null) : null,
          bundleDeals:
            dto.type === "BUNDLE_DEALS"
              ? {
                  createMany: {
                    data: dto.bundleDeals.map((deal) => ({
                      bundleQuantity: deal.bundleQuantity,
                      bundleFixedDiscount: deal.bundleFixedDiscount ?? null,
                      bundlePercentageDiscount:
                        deal.bundlePercentageDiscount ?? null,
                    })),
                  },
                }
              : undefined,
          vendor: {
            connect: {
              id: vendorId,
            },
          },
          products: {
            connect: [
              ...(dto.selectedProductIds?.map((id: string) => ({ id })) ?? []),
              ...(dto.buyProductIds?.map((id: string) => ({ id })) ?? []),
              ...(dto.getProductIds?.map((id: string) => ({ id })) ?? []),
            ],
          },
        },
        include: {
          bundleDeals: true,
        },
      });

      return {
        promotion,
        message: `${dto.type} promotion created successfully`,
      };
    } catch (error) {
      this.logger.log("Error while add promotion", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async updatePromotion(dto: UpdatePromotionDto, promotionId: string, vendorId: string) {
    try {
      const existingPromotion = await this.prismaService.promotion.findUnique({
        where: { id: promotionId },
        include: {
          vendor: true,
          bundleDeals: true
        }
      })
      if(!existingPromotion){
        throw new NotFoundException("Promotion not found.");
      }
      if (existingPromotion.vendorId !== vendorId) {
        throw new ForbiddenException('You do not own this promotion');
      }
      
      if (dto.selectedProductIds || dto.buyProductIds || dto.getProductIds) {
        const productIds = [
          ...(dto.selectedProductIds || []),
          ...(dto.buyProductIds || []),
          ...(dto.getProductIds || [])
        ];
        const uniqueProductIds = [...new Set(productIds)];
        if (uniqueProductIds.length > 0) {
          const validProducts = await this.prismaService.product.count({
            where: { 
              id: { in: uniqueProductIds },
              vendorId 
            }
          });
          if (validProducts !== uniqueProductIds.length) {
            throw new BadRequestException("Some products don't belong to vendor");
          }
        }
      }

      let spendFixedDiscount: number = null;
      let spendPercentageDiscount: number = null;

      switch (existingPromotion.type) {
        case PromotionType.FREE_SHIPPING:
          if (dto.minPurchaseValue !== undefined && dto.minPurchaseValue <= 0) {
            throw new BadRequestException("minPurchaseValue must be greater than 0");
          }
          /*if (dto.freeShippingValue !== undefined && dto.freeShippingValue <= 0) {
            throw new BadRequestException("freeShippingValue must be greater than 0");
          }*/
          break;

        case PromotionType.BUY_X_GET_Y:
          if (dto.buyQuantity !== undefined && dto.buyQuantity <= 0) {
            throw new BadRequestException("buyQuantity must be greater than 0");
          }
          if (dto.getQuantity !== undefined && dto.getQuantity <= 0) {
            throw new BadRequestException("getQuantity must be greater than 0");
          }
          break;

        case PromotionType.BUNDLE_DEALS:
          if (dto.bundleDeals) {
            for (const deal of dto.bundleDeals) {
              if (deal.bundleQuantity <= 0) {
                throw new BadRequestException("Bundle quantity must be greater than 0");
              }
              if (deal.bundleFixedDiscount && deal.bundleFixedDiscount <= 0) {
                throw new BadRequestException("Fixed discount must be greater than 0");
              }
              if (deal.bundlePercentageDiscount && (deal.bundlePercentageDiscount <= 0)) {
                throw new BadRequestException("Percentage must be greater than 0");
              }
              if (deal.bundleFixedDiscount && deal.bundlePercentageDiscount) {
                throw new BadRequestException("Cannot set both discount types");
              }
            }
          }
          break;

        case PromotionType.SPEND_MONEY:
          if (dto.spendAmount !== undefined && dto.spendAmount <= 0) {
            throw new BadRequestException("spendAmount must be greater than 0");
          }
          if (
            dto.spendFixedDiscount !== undefined && 
            dto.spendFixedDiscount <= 0
          ) {
            throw new BadRequestException("Fixed discount must be greater than 0");
          }
          if (
            dto.spendPercentageDiscount !== undefined && 
            (dto.spendPercentageDiscount <= 0)
          ) {
            throw new BadRequestException("Percentage must be greater than 0");
          }
          if(dto.spendFixedDiscount && dto.spendPercentageDiscount){
            throw new BadRequestException("Cannot set both discount types.")
          }
          if(dto.spendFixedDiscount){
            spendFixedDiscount = dto.spendFixedDiscount;
          }else if(dto.spendPercentageDiscount){
            spendPercentageDiscount = dto.spendPercentageDiscount;
          }
          break;

        case PromotionType.PROMO_CODE:
          if (dto.spendFixedDiscount !== undefined && dto.spendFixedDiscount <= 0) {
            throw new BadRequestException('Fixed discount must be greater than 0.');
          }
          if (dto.spendPercentageDiscount !== undefined && dto.spendPercentageDiscount <= 0) {
            throw new BadRequestException('Percentage discount must be greater than 0.');
          }
          if (dto.spendFixedDiscount && dto.spendPercentageDiscount) {
            throw new BadRequestException('Cannot set both discount types.');
          }
          if (dto.spendFixedDiscount) {
            spendFixedDiscount = dto.spendFixedDiscount;
          } else if (dto.spendPercentageDiscount) {
            spendPercentageDiscount = dto.spendPercentageDiscount;
          }
          break;
      }
  
      if(dto.type === "BUNDLE_DEALS" && dto.bundleDeals.length > 0){
        for (const deal of dto.bundleDeals) {
          if (deal.id) {
            await this.prismaService.bundleDeal.update({
              where: { id: deal.id },
              data: {
                bundleQuantity: deal.bundleQuantity,
                bundleFixedDiscount: deal.bundleFixedDiscount,
              },
            });
          } else {
            await this.prismaService.bundleDeal.create({
              data: {
                promotionId: promotionId,
                bundleQuantity: deal.bundleQuantity,
                bundleFixedDiscount: deal.bundleFixedDiscount,
              },
            });
          }
        }
      }
      
      const updated = await this.prismaService.promotion.update({
        where: { id: promotionId },
        data: {
          name: dto.name,
          code: dto.code,
          type: dto.type,
          minPurchaseValue:
            dto.type === "FREE_SHIPPING" ? dto.minPurchaseValue : null,
          freeShippingValue:
            dto.type === "FREE_SHIPPING" ? dto.freeShippingValue : null,
          maxOrdersPerUser: dto.maxOrdersPerUser ?? null,
          appliesToAllProducts:
            dto.type === "BUY_X_GET_Y" ? false : dto.appliesToAllProducts,
          selectedProductIds:
            dto.type === "BUY_X_GET_Y" ? [] : dto.selectedProductIds,
          capMinValue: dto.type === "BUY_X_GET_Y" ? null : dto.capMinValue,
          capMaxValue: dto.type === "BUY_X_GET_Y" ? null : dto.capMaxValue,
          eligibleCustomers: dto.eligibleCustomers,
          customerTypes:
            dto.eligibleCustomers === "ALL" ? [] : dto.customerTypes,
          highSpendLimit:
            dto.eligibleCustomers === "ADD_CUSTOMER" &&
            dto.customerTypes.includes("HIGH_SPEND")
              ? dto.highSpendLimit
              : null,
          eligibleCountries:
            dto.eligibleCustomers === "ALL" ? [] : dto.eligibleCountries,
          eligibleStates:
            dto.eligibleCustomers === "ALL" ? [] : dto.eligibleStates,
          eligibleCities:
            dto.eligibleCustomers === "ALL" ? [] : dto.eligibleCities,
          deliveryOptions:
            dto.type === "FREE_SHIPPING" ? dto.deliveryOptions : [],
          durationType: dto.durationType,
          startDate: dto.durationType === "LONG_TIME" ? null : dto.startDate,
          endDate: dto.durationType === "LONG_TIME" ? null : dto.endDate,
          buyQuantity: dto.type === "BUY_X_GET_Y" ? dto.buyQuantity : null,
          buyProductIds: dto.type === "BUY_X_GET_Y" ? dto.buyProductIds : [],
          getQuantity: dto.type === "BUY_X_GET_Y" ? dto.getQuantity : null,
          getProductIds: dto.type === "BUY_X_GET_Y" ? dto.getProductIds : [],
          spendAmount: dto.type === "SPEND_MONEY" ? dto.spendAmount : null,
          spendFixedDiscount:
            (dto.type === "SPEND_MONEY" || dto.type === "PROMO_CODE") ? spendFixedDiscount : null,
          spendPercentageDiscount:
            (dto.type === "SPEND_MONEY" || dto.type === "PROMO_CODE") ? spendPercentageDiscount : null,
          selectedCategoryIds: dto.type === "PROMO_CODE" ? (dto.selectedCategoryIds ?? []) : [],
          totalUsageLimit: dto.type === "PROMO_CODE" ? (dto.totalUsageLimit ?? null) : null,
          status: dto.status,
          products: dto.selectedProductIds || dto.buyProductIds || dto.getProductIds
            ? {
                set: [
                  ...(dto.selectedProductIds?.map((id) => ({ id })) ?? []),
                  ...(dto.buyProductIds?.map((id) => ({ id })) ?? []),
                  ...(dto.getProductIds?.map((id) => ({ id })) ?? []),
                ],
              }
            : undefined
        },
        include: {
          bundleDeals: true,
        },
      });
  
      return {
        promotion: updated,
        message: `${dto.type} promotion updated successfully`,
      };
    } catch (error) {
      this.logger.error('Error while updating promotion', error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async deletePromotion(promotionId: string, vendorId: string){
    try {
      const vendor = await this.prismaService.vendors.findUnique({
        where: { id: vendorId }
      })
      if(!vendor){
        throw new NotFoundException("Vendor not found.")
      }

      const promotion = await this.prismaService.promotion.findUnique({
        where: { id: promotionId, vendorId },
        include: {
          bundleDeals: true
        }
      })
      if(!promotion){
        throw new NotFoundException("Promotion not found for this vendor.")
      }

      if(promotion?.bundleDeals){
        await this.prismaService.bundleDeal.deleteMany({
          where: {
            promotionId,
          }
        })
      }

      const data = await this.prismaService.promotion.delete({
        where: { id: promotionId, vendorId }
      })

      return {
        data,
        message: "Promotion delete successfully."
      }
      
    } catch (error) {
      this.logger.error('Error while updating promotion', error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async getByIdPromotion(promotionId: string) {
    try {
      const data = await this.prismaService.promotion.findUnique({
        where: { id: promotionId },
        include: {
          bundleDeals: true,
          vendor: true
        }
      })

      return {
        data,
        message: "Promotion fetch successfully."
      }
      
    } catch (error) {
      this.logger.error('Error fetching vendor promotions data:', error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async fetchAllPromotions(filters: PromotionFilter, vendorId: string) {
    const { type, status, search, page, limit } = filters;

    try {
      const where: any = { vendorId };
      if (type) where.type = type;
      if (status !== undefined) where.status = status;
      if (search?.trim()) {
        const s = search?.trim();
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        if (dateRegex.test(s)) {
          const start = new Date(s);
          const end = new Date(s);
          end.setUTCHours(23, 59, 59, 999);

          where.createdAt = {
            gte: start,
            lte: end,
          };
        } else if (uuidRegex.test(s)) {
          where.id = s;
        } else {
          where.OR = [
            { name: { contains: s, mode: 'insensitive' } }
          ];
        }
      }

      const [data, total] = await Promise.all([
        this.prismaService.promotion.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            bundleDeals: true,
            vendor: true,
          },
        }),
        this.prismaService.promotion.count({ where }),
      ]);

      return {
        currentPage: page,
        totalPromotions: total,
        totalPages: Math.ceil(total / limit),
        data,
      };
    } catch (error) {
      this.logger.error('Error fetching vendor promotions data:', error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async fetchAllVendorPromotions(filters: PromotionFilter ) {
    const { type, status, search, page, limit } = filters;
    try {
      const where: Record<string, any> = { vendor: { is: {} } };
      if (type) where.type = type;
      if (status !== undefined) where.status = status;
      if (search?.trim()) {
        const s = search?.trim();
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
        if (dateRegex.test(s)) {
          const start = new Date(s);
          const end = new Date(s);
          end.setUTCHours(23, 59, 59, 999);
  
          where.createdAt = {
            gte: start,
            lte: end,
          };
        } else if (uuidRegex.test(s)) {
          where.id = s;
        } else {
          where.OR = [
            { name: { contains: s, mode: 'insensitive' } }
          ];
        }
      }
  
      const [data, total] = await Promise.all([
        this.prismaService.promotion.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            bundleDeals: true,
            vendor: true,
          },
        }),
        this.prismaService.promotion.count({ where }),
      ]);
  
      return {
        currentPage: page,
        totalPromotions: total,
        totalPages: Math.ceil(total / limit),
        data,
      };
    } catch (error) {
      this.logger.error('Error fetching vendor promotions data:', error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async fetchAssignnedVendorPromotions(filters: PromotionFilter, adminId: string) {
    const { type, status, search, page, limit } = filters;
  
    try {
      const where: Record<string, any> = { vendor: { is: { adminId } } };
      if (type) where.type = type;
      if (status !== undefined) where.status = status;
      if (search?.trim()) {
        const s = search?.trim();
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
        if (dateRegex.test(s)) {
          const start = new Date(s);
          const end = new Date(s);
          end.setUTCHours(23, 59, 59, 999);
  
          where.createdAt = {
            gte: start,
            lte: end,
          };
        } else if (uuidRegex.test(s)) {
          where.id = s;
        } else {
          where.OR = [
            { name: { contains: s, mode: 'insensitive' } }
          ];
        }
      }
  
      const [data, total] = await Promise.all([
        this.prismaService.promotion.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            bundleDeals: true,
            vendor: true,
          },
        }),
        this.prismaService.promotion.count({ where }),
      ]);
  
      return {
        currentPage: page,
        totalPromotions: total,
        totalPages: Math.ceil(total / limit),
        data,
      };
    } catch (error) {
      this.logger.error('Error fetching vendor promotions data:', error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async validatePromoCode(dto: ValidatePromotionDto, userId: string) {
    try {
      const { code, items } = dto;
      const productIds = items.map((i) => i.productId);
      const cartTotal = items.reduce((sum, i) => sum + i.price, 0);

      const promo = await this.prismaService.promotion.findFirst({
        where: { code: code.toUpperCase(), type: PromotionType.PROMO_CODE },
      });
      if (!promo) throw new BadRequestException('Invalid promo code.');

      if (!promo.status) throw new BadRequestException('This promo code is inactive.');

      if (promo.endDate && new Date() > new Date(promo.endDate))
        throw new BadRequestException('This promo code has expired.');

      if (promo.totalUsageLimit) {
        const totalUsed = await this.prismaService.promotionUsage.count({
          where: { promotionId: promo.id },
        });
        if (totalUsed >= promo.totalUsageLimit)
          throw new BadRequestException('This promo code has reached its usage limit.');
      }

      if (promo.maxOrdersPerUser) {
        const userUsed = await this.prismaService.promotionUsage.count({
          where: { promotionId: promo.id, userId },
        });
        if (userUsed >= promo.maxOrdersPerUser)
          throw new BadRequestException('You have reached the usage limit for this code.');
      }

      if (promo.minPurchaseValue && cartTotal < promo.minPurchaseValue)
        throw new BadRequestException(`Minimum order amount is $${promo.minPurchaseValue}.`);

      if (promo.eligibleCustomers === EligibleCustomerType.ADD_CUSTOMER && promo.customerTypes.length > 0) {
        const userOrderCount = await this.prismaService.orders.count({ where: { userId } });
        const isNew = userOrderCount === 0;

        if (promo.customerTypes.includes(CustomerType.NEW) && !isNew)
          throw new BadRequestException('This code is for new customers only.');
        if (promo.customerTypes.includes(CustomerType.REPEATED) && isNew)
          throw new BadRequestException('This code is for returning customers only.');

        if (promo.customerTypes.includes(CustomerType.HIGH_SPEND) && promo.highSpendLimit) {
          const totalSpend = await this.prismaService.orders.aggregate({
            where: { userId },
            _sum: { price: true },
          });
          if ((totalSpend._sum.price ?? 0) < promo.highSpendLimit)
            throw new BadRequestException('This code requires a higher spend history.');
        }
      }

      // Determine eligible items — strict scope (no vendor fallback when specific products/categories set)
      let eligibleItems = items;

      if (!promo.appliesToAllProducts) {
        if (promo.selectedProductIds?.length > 0) {
          // Only items whose productId is in the promo's selected products
          eligibleItems = items.filter((i) => promo.selectedProductIds.includes(i.productId));
          if (eligibleItems.length === 0)
            throw new BadRequestException('This code is not valid for the products in your cart.');
        } else if (promo.selectedCategoryIds?.length > 0) {
          // Only items whose product belongs to a selected category
          const productCategories = await this.prismaService.productCategory.findMany({
            where: { productId: { in: productIds } },
          });
          const matchingProductIds = productCategories
            .filter((pc) => promo.selectedCategoryIds.includes(pc.categoryId))
            .map((pc) => pc.productId);
          eligibleItems = items.filter((i) => matchingProductIds.includes(i.productId));
          if (eligibleItems.length === 0)
            throw new BadRequestException('This code is not valid for the products in your cart.');
        } else {
          // No specific products/categories configured → vendor-level scope
          const cartProducts = await this.prismaService.product.findMany({
            where: { id: { in: productIds } },
            select: { vendorId: true },
          });
          if (!cartProducts.every((p) => p.vendorId === promo.vendorId))
            throw new BadRequestException('This code is not valid for the products in your cart.');
        }
      }

      // Discount applies only to eligible items' subtotal
      const eligibleSubtotal = eligibleItems.reduce((sum, i) => sum + i.price, 0);
      const discountAmount = promo.spendPercentageDiscount
        ? parseFloat(((eligibleSubtotal * promo.spendPercentageDiscount) / 100).toFixed(2))
        : Math.min(promo.spendFixedDiscount ?? 0, eligibleSubtotal);

      return {
        valid: true,
        promotionId: promo.id,
        discountAmount,
        message: `Code applied — You save $${discountAmount}`,
      };
    } catch (error) {
      if (error?.response) throw exceptionHandler(error);
      throw handlePrismaError(error);
    }
  }

  async applyPromoCode(dto: ApplyPromotionDto, userId: string) {
    try {
      const usage = await this.prismaService.promotionUsage.create({
        data: {
          promotionId: dto.promotionId,
          userId,
          orderId: dto.orderId,
          discountAmt: dto.discountAmt,
        },
      });
      return { usage, message: 'Promo code usage recorded.' };
    } catch (error) {
      if (error?.response) throw exceptionHandler(error);
      throw handlePrismaError(error);
    }
  }

  async fetchAllPromotionForWebsite(filters: PromotionFilter){
    const { type, status, search, page, limit } = filters;
    try {
      const where: Record<string, any> = { vendor: { is: {} } };
      if (type) where.type = type;
      if (status !== undefined) where.status = status;
      if (search?.trim()) {
        const s = search?.trim();
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
        if (dateRegex.test(s)) {
          const start = new Date(s);
          const end = new Date(s);
          end.setUTCHours(23, 59, 59, 999);
  
          where.createdAt = {
            gte: start,
            lte: end,
          };
        } else if (uuidRegex.test(s)) {
          where.id = s;
        } else {
          where.OR = [
            { name: { contains: s, mode: 'insensitive' } }
          ];
        }
      }
  
      const [data, total] = await Promise.all([
        this.prismaService.promotion.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            bundleDeals: true,
            vendor: true,
          },
        }),
        this.prismaService.promotion.count({ where }),
      ]);
  
      return {
        currentPage: page,
        totalPromotions: total,
        totalPages: Math.ceil(total / limit),
        data,
      };
    } catch (error) {
      this.logger.error('Error fetching vendor promotions data:', error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

}
