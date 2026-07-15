import {
  BadRequestException,
  ConflictException,
  ConsoleLogger,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  exceptionHandler,
  handlePrismaError,
  handleStripeError,
} from "src/utils/error-handler.util";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";
import { CreateReturnOrderDto } from "./dto/create-return-order";
import { CreateCancelOrderDto } from "./dto/create-cancel-order";
import { StripeService } from "src/payment/payment.service";
import { MailerService } from "src/mailer/mailer.service";
import { add, format, sub } from "date-fns";
import { getOrderEmailTemplateForUser, getOrderEmailTemplateForUserInprogress, getOrderEmailTemplateForVendor, orderStatusCanceledEmailTemplate, orderStatusDeliveredEmailTemplate, orderStatusInProgressEmailTemplate, orderStatusPackedEmailTemplate, orderStatusPlacedEmailTemplate, orderStatusReturnedEmailTemplate, orderStatusShippedEmailTemplate } from "src/utils/vendorEmailTemplates";
import { RequestUser } from "src/user/interface/user.interface";
import { CustomerType, OrderStatus, Role, TransactionStatus } from "@prisma/client";
import { QueueService } from "src/redis/queue.service";
import { getCancelEmailTemplate, getRefundEmailTemplate, getRevereseEmailTemplateForVendor, getReversalEmailTemplate, getVendorTransferEmailTemplate } from "src/utils/paymentEmailTemplates";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Cron } from "@nestjs/schedule";
import { reverse } from "dns";
import { UspsService } from "src/usps/usps.service";

@Injectable()
export class OrdersService {
  private readonly logger: Logger = new Logger(OrdersService.name);
  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
    private emailService: MailerService,
    private readonly queueService: QueueService,
    private eventEmitter: EventEmitter2,
    private upsService: UspsService
  ) { }

  async addOrder(userId: string, cartId: string, orderData: CreateOrderDto) {
    try {

      const [user, existingCart, address] = await Promise.all(
        [
          await this.prisma.user.findUnique({
            where: { id: userId },
          }),
          await this.prisma.cart.findUnique({
            where: {
              id: cartId,
              userId,
            },
            include: {
              items: {
                select: {
                  variant: {
                    include: {
                      product: true,
                    },
                  },
                  quantity: true,
                },
              },
              bundleItems: {
                select: {
                  bundleId: true,
                  quantity: true,
                  priceAtAdding: true,
                  bundle: {
                    select: {
                      id: true,
                      title: true,
                      vendorId: true,
                      maxPurchasesPerUser: true,
                      items: {
                        select: {
                          variantId: true,
                          quantity: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          }),
          await this.prisma.address.findUnique({
            where: { id: orderData.addressId }
          })
        ]
      )
      if (!user) throw new NotFoundException("User does not exist");
      if (!existingCart) {
        throw new BadRequestException("Cart does not exist or something went wrong with the cart!")
      }
      if (!address) {
        throw new BadRequestException("Address not found");
      }
      if (existingCart?.items.length === 0 && (!existingCart?.bundleItems || existingCart?.bundleItems.length === 0)) {
        throw new BadRequestException("Cart is empty. Please add items to the cart before placing an order.")
      }

      let license: any;
      if (orderData.licenseId) {
        license = await this.prisma.licenseList.findUnique({
          where: { id: orderData.licenseId, userId }
        });
        if (!license) {
          throw new BadRequestException("License not found or does not belong to the user.");
        }
      }
      const productsRequiringLicense = existingCart.items.filter(
        item => item.variant.product.isLicenseRequired
      );

      const licenseIsRequired = productsRequiringLicense.length > 0;

      if (licenseIsRequired && !orderData.licenseId) {
        const licenseRequiredItemTitles = productsRequiringLicense.map(item => {
          const { title } = item.variant.product;
          return `${title}`;
        });

        const itemList = licenseRequiredItemTitles.join(", ");

        const message =
          productsRequiringLicense.length === 1
            ? `The item ${licenseRequiredItemTitles[0]} requires a valid license. Please provide a valid license to proceed with your order.`
            : `The following items require a valid license to proceed with your order: ${itemList}. Please provide a valid license.`;

        throw new BadRequestException(message);
      }

      const { totalDiscount, vendorDiscounts, appliedPromotionIds, freeItems } = await this.applyPromotions(
        user,
        existingCart.items,
        address,
        orderData
      );

      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await this.stripeService.createCustomer(user.email, `${user.firstName} ${user.lastName}`);
        stripeCustomerId = customer.id;
        await this.prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId },
        });
      }

      const attachPaymentMethodToCustomer = await this.stripeService.attachPaymentMethodToCustomer(
        orderData.paymentMethodId,
        stripeCustomerId
      );

      let last4 = attachPaymentMethodToCustomer?.card?.last4;
      let hashCardNumber = `**** **** **** ${last4}`;

      const paymentProductObject: Record<string, any> = {};
      for (const item of existingCart.items) {
        const selectedProduct = orderData.products.find(prod => prod.variantId === item.variant.id);
        if (!selectedProduct) continue;
        const variant = item.variant;
        paymentProductObject[variant.id] = {
          price: variant.price,
          vendorId: variant.product.vendorId,
          quantity: selectedProduct.quantity,
        };
        if (selectedProduct && item.variant.quantity <= 0) {
          throw new BadRequestException(
            `${item.variant.product.title} in ${item.variant.color ?? 'default color'} - ${item.variant.size ?? 'default size'} is out of stock. Kindly remove it from the cart!`
          );
        } else if (selectedProduct && item.variant.quantity < selectedProduct.quantity) {
          throw new BadRequestException(
            `Only ${item.variant.quantity} units of ${item.variant.product.title} in ${item.variant.color ?? 'default color'} - ${item.variant.size ?? 'default size'} are available.`
          );
        }
      }

      if (Object.keys(paymentProductObject).length === 0 && existingCart.bundleItems && existingCart.bundleItems.length > 0) {
        for (const bi of existingCart.bundleItems) {
          paymentProductObject[`bundle_${bi.bundleId}`] = {
            price: bi.priceAtAdding || (bi.bundle as any)?.bundlePrice || 0,
            vendorId: (bi.bundle as any)?.vendorId,
            quantity: bi.quantity,
          };
        }
      }

      if (Object.keys(paymentProductObject).length === 0) {
        throw new BadRequestException('No valid products found in the cart for payment.');
      }

      let taxRate: number;
      if (orderData.taxAmount !== undefined && orderData.taxAmount >= 0) {
        taxRate = orderData.taxAmount;
      } else {
        const priceInCent = Math.round(orderData.price * 100);
        taxRate = await this.stripeService.calculateTax(orderData.addressId, priceInCent);
      }

      // Pass the customer's name/email and shipping address as billing details
      // so Stripe can run AVS and feed Radar stronger signals — this reduces
      // false-positive "fraudulent" declines on otherwise-valid cards.
      const billingDetails = {
        name: [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined,
        email: user.email || undefined,
        phone: address.phone || user.officePhoneNo || undefined,
        line1: address.streetAddress || undefined,
        line2: address.building || undefined,
        city: address.city || undefined,
        state: address.state || undefined,
        postalCode: address.zipCode || undefined,
        country: address.country || 'US',
      };

      const paymentIntent = await this.stripeService.createPaymentIntent(
        Math.round((orderData.price + taxRate + orderData.shippingTax - totalDiscount) * 100),
        'usd',
        stripeCustomerId,
        orderData.paymentMethodId,
        'manual',
        {
          userId,
          cartId,
          detail: JSON.stringify(paymentProductObject),
          promotionIds: appliedPromotionIds.join(','),
        },
        billingDetails
      );
      if (!paymentIntent || !paymentIntent.id) {
        throw new NotFoundException('Payment failed for this order!');
      }

      await this.stripeService.confirmPaymentIntent(paymentIntent.id);
      await this.stripeService.capturePaymentIntent(paymentIntent.id);

      const order = await this.prisma.$transaction(async prisma => {
        const maxSequence = await prisma.orders.aggregate({
          _max: { orderNumber: true },
        });
        const maxOrderNumber = maxSequence._max.orderNumber;
        let nextSequence = 1;
        if (maxOrderNumber) {
          const numericPart = maxOrderNumber.replace('ORD-', '');
          nextSequence = parseInt(numericPart, 10) + 1;
        }
        const orderNumber = `ORD-${String(nextSequence).padStart(6, '0')}`;

        let shippingDiscount: number = 0;
        let discount: number = 0;
        const shippingPromotions = vendorDiscounts.filter(v => v.promotionType === 'FREE_SHIPPING');
        const discountPromotions = vendorDiscounts.filter(v => v.promotionType !== 'FREE_SHIPPING' && v.promotionType !== 'BUY_X_GET_Y');

        if (shippingPromotions.length > 0) {
          shippingDiscount = shippingPromotions.reduce((sum, promo) => sum + promo.discount, 0);
        }
        if (discountPromotions.length > 0) {
          discount = discountPromotions.reduce((sum, promo) => sum + promo.discount, 0);
        }

        const newOrder = await prisma.orders.create({
          data: {
            userId,
            orderNumber,
            addressId: orderData.addressId,
            licenseId: orderData.licenseId ?? null,
            price: orderData.price - discount,
            discount: orderData.discount,
            promotionDiscount: [
              ...(orderData.promotionId && orderData.discountAmount
                ? [...(vendorDiscounts as any[]), { promotionId: orderData.promotionId, promotionType: 'PROMO_CODE', discount: orderData.discountAmount }]
                : (vendorDiscounts as any[])),
              ...(orderData.storewideDiscountAmount && orderData.storewideDiscountAmount > 0
                ? [{ promotionType: 'STOREWIDE_DEAL', discount: orderData.storewideDiscountAmount }]
                : []),
            ],
            promotionIds: orderData.promotionId
              ? [...appliedPromotionIds, orderData.promotionId]
              : appliedPromotionIds,
            tax: taxRate,
            status: 'PLACED',
            stripePaymentIntentId: paymentIntent.id ?? '',
            cardNumber: hashCardNumber ?? null,
            expiryDate: attachPaymentMethodToCustomer?.card?.exp_month && attachPaymentMethodToCustomer?.card?.exp_year
              ? `${attachPaymentMethodToCustomer.card.exp_month}/${attachPaymentMethodToCustomer.card.exp_year}`
              : null,
            trackingNo: JSON.stringify(orderData?.trackingNo ?? []),
            shippingTax: orderData.shippingTax - shippingDiscount,
            deliveryOptions: JSON.stringify(orderData?.deliveryOptions ?? []),
            userSnapshot: { user: user, address: address, license: license ?? null },
            billingDetails: {
              name: attachPaymentMethodToCustomer?.billing_details?.name,
              email: attachPaymentMethodToCustomer?.billing_details?.email,
              address: attachPaymentMethodToCustomer?.billing_details?.address
                ? JSON.parse(JSON.stringify(attachPaymentMethodToCustomer.billing_details.address))
                : null,
              phone: attachPaymentMethodToCustomer?.billing_details?.phone,
              cardBrand: attachPaymentMethodToCustomer?.card?.brand,
              cardNumber: hashCardNumber,
            },
          },
        });

        const subtotal = orderData.price;
        const vendorItems = new Map<string, any[]>();
        existingCart.items.forEach(item => {
          const vendorId = item.variant.product.vendorId;
          if (!vendorItems.has(vendorId)) {
            vendorItems.set(vendorId, []);
          }
          vendorItems.get(vendorId)!.push(item);
        });

        const vendorAmounts = new Map<string, { subtotal: number; tax: number }>();
        for (const [vendorId, items] of vendorItems) {
          let vendorSubtotal = 0;
          items.forEach(item => {
            const selectedProduct = orderData.products.find(p => p.variantId === item.variant.id);
            if (selectedProduct) {
              vendorSubtotal += item.variant.discountedPrice * selectedProduct.quantity;
            }
          });
          const vendorTax = (vendorSubtotal / subtotal) * taxRate;
          vendorAmounts.set(vendorId, { subtotal: vendorSubtotal, tax: vendorTax });
        }

        // Total raw products subtotal (before storewide discount) for proportional distribution
        const totalRawSubtotal = Array.from(vendorAmounts.values()).reduce((s, v) => s + v.subtotal, 0);
        const storewideDiscountAmount = orderData.storewideDiscountAmount || 0;

        await Promise.all(
          Array.from(vendorAmounts.entries()).map(([vendorId, amounts]) => {

            let discount: number = 0;
            let shippingDiscount: number = 0;
            const promotionDiscount = vendorDiscounts.find(v => v.vendorId === vendorId && v.promotionType !== 'FREE_SHIPPING' && v.promotionType !== 'BUY_X_GET_Y')?.discount || 0;
            const promotionShipping = vendorDiscounts.find(v => v.vendorId === vendorId && v.promotionType === 'FREE_SHIPPING')?.discount || 0;
            const deliveryOptions = orderData.deliveryOptions.find(data => data.vendorId === vendorId);
            const vendorShippingTax = deliveryOptions.totalShippingCost;
            if (promotionShipping > 0) {
              shippingDiscount = vendorShippingTax - promotionShipping;
            } else {
              shippingDiscount = vendorShippingTax;
            }
            if (promotionDiscount > 0) {
              discount = promotionDiscount;
            }
            // Distribute storewide discount proportionally across vendors
            const vendorStorewideDiscount = totalRawSubtotal > 0
              ? parseFloat(((amounts.subtotal / totalRawSubtotal) * storewideDiscountAmount).toFixed(2))
              : 0;
            let roundedSubtotal = parseFloat(amounts.subtotal.toFixed(2)) - discount - vendorStorewideDiscount;
            const roundedTax = parseFloat(amounts.tax.toFixed(2));
            const roundedTotal = parseFloat((roundedSubtotal + roundedTax + shippingDiscount).toFixed(2));
            const roundedEffectiveTaxRate = parseFloat(((amounts.tax / amounts.subtotal) * 100).toFixed(2));

            return prisma.transaction.create({
              data: {
                stripePaymentIntentId: paymentIntent.id,
                customerId: userId,
                vendorId,
                subtotalAmount: roundedSubtotal,
                taxAmount: roundedTax,
                totalAmount: roundedTotal,
                taxRateApplied: Number.isFinite(roundedEffectiveTaxRate) ? roundedEffectiveTaxRate : 0,
                status: TransactionStatus.PENDING,
                orderId: newOrder.id,
                shippingCost: shippingDiscount,
                stateCollectedFor: address.state,
              },
            });
          })
        );

        const itemsMap = new Map<
          string,
          {
            variantId: string;
            totalQuantity: number;
            paidQuantity: number;
            freeQuantity: number;
            vendorId: string;
            productSnapshot: any[];
          }
        >();

        existingCart.items.forEach(item => {
          const selectedProduct = orderData.products.find(prod => prod.variantId === item.variant.id);
          if (!selectedProduct) return;
          const key = item.variant.id;
          const existing = itemsMap.get(key);
          if (existing) {
            itemsMap.set(key, {
              ...existing,
              totalQuantity: existing.totalQuantity + selectedProduct.quantity,
              paidQuantity: existing.paidQuantity + selectedProduct.quantity,
              productSnapshot: [{
                ...existing.productSnapshot,
                paidQuantity: existing.paidQuantity + selectedProduct.quantity,
              }],
            });
          } else {
            itemsMap.set(key, {
              variantId: item.variant.id,
              totalQuantity: selectedProduct.quantity,
              paidQuantity: selectedProduct.quantity,
              freeQuantity: 0,
              vendorId: item.variant.product.vendorId,
              productSnapshot: [{
                variant: item.variant,
                paidQuantity: selectedProduct.quantity,
                freeQuantity: 0,
              }],
            });
          }
        });

        freeItems.forEach(item => {
          const key = item.variantId;
          const existing = itemsMap.get(key);
          if (existing) {
            itemsMap.set(key, {
              ...existing,
              totalQuantity: existing.totalQuantity + item.quantity,
              freeQuantity: existing.freeQuantity + item.quantity,
              productSnapshot: [{
                ...existing.productSnapshot,
                freeQuantity: existing.freeQuantity + item.quantity,
              }],
            });
          } else {
            itemsMap.set(key, {
              variantId: item.variantId,
              totalQuantity: item.quantity,
              paidQuantity: 0,
              freeQuantity: item.quantity,
              vendorId: item.vendorId,
              productSnapshot: [{
                paidQuantity: 0,
                freeQuantity: item.quantity,
              }],
            });
          }
        });

        const orderItemsRaw = Array.from(itemsMap.values()).map(item => ({
          orderId: newOrder.id,
          variantId: item.variantId,
          quantity: item.totalQuantity,
          freeQuantity: item.freeQuantity,
          status: (orderData.status as OrderStatus) || OrderStatus.PLACED,
          vendorId: item.vendorId,
          trackStatus: JSON.stringify([{ status: OrderStatus.PLACED, date: new Date().toISOString() }]),
          isFree: item.paidQuantity === 0,
          productSnapshot: item.productSnapshot,
        }));

        await prisma.orderItems.createMany({ data: orderItemsRaw });

        if (existingCart.bundleItems && existingCart.bundleItems.length > 0) {
          await prisma.bundleOrderItem.createMany({
            data: existingCart.bundleItems.map(bi => ({
              orderId: newOrder.id,
              bundleId: bi.bundleId,
              quantity: bi.quantity,
              priceAtPurchase: bi.priceAtAdding,
              vendorId: bi.bundle.vendorId,
              status: (orderData.status as OrderStatus) || OrderStatus.PLACED,
              productSnapshot: bi.bundle.items,
            })),
          });

          // Record BundleUsage for purchase-limit enforcement
          const bundleUsageRows = existingCart.bundleItems
            .filter(bi => (bi.bundle as any).maxPurchasesPerUser)
            .map(bi => ({
              bundleId: bi.bundleId,
              userId: newOrder.userId,
              orderId: newOrder.id,
            }));
          if (bundleUsageRows.length > 0) {
            await (prisma as any).bundleUsage.createMany({ data: bundleUsageRows });
          }
        }

        await this.prisma.$transaction([
          ...existingCart.items.map(item =>
            prisma.productVariant.update({
              where: { id: item.variant.id },
              data: { quantity: { decrement: item.quantity } },
            })
          ),
          ...existingCart.items.map(item =>
            prisma.product.update({
              where: { id: item.variant.productId },
              data: { totalSold: { increment: item.quantity } },
            })
          ),
          ...existingCart.items.map(item =>
            prisma.cartItem.delete({ where: { cartId_variantId: { cartId, variantId: item.variant.id } } })
          ),
          ...(existingCart.bundleItems ?? []).flatMap(bi =>
            bi.bundle.items
              .filter(bundleItem => bundleItem.variantId !== null)
              .map(bundleItem =>
                prisma.productVariant.update({
                  where: { id: bundleItem.variantId! },
                  data: { quantity: { decrement: bundleItem.quantity * bi.quantity } },
                })
              )
          ),
          ...(existingCart.bundleItems ?? []).map(bi =>
            prisma.bundleCartItem.delete({
              where: { cartId_bundleId: { cartId, bundleId: bi.bundleId } },
            })
          ),
        ]);

        await prisma.orderPromotion.createMany({
          data: appliedPromotionIds.map(promotionId => ({
            orderId: newOrder.id,
            promotionId,
          })),
        });

        return newOrder;
      });

      const createdOrder = await this.prisma.orders.findUnique({
        where: { id: order.id },
        include: {
          user: true,
          products: { include: { vendor: true, variant: { include: { product: { include: { vendor: true } } } } } },
          bundleItems: { include: { bundle: { include: { items: true } } } },
          address: true,
          license: true,
          orderPromotions: { include: { promotion: true } },
        },
      });

      await Promise.all(
        createdOrder.products.map(async item => {
          return this.prisma.orderItems.updateMany({
            where: { orderId: createdOrder.id, variantId: item.variantId },
            data: {
              productSnapshot: [{
                orderId: item.orderId,
                quantity: item.quantity,
                status: item.status,
                trackStatus: item.trackStatus,
                variant: item.variant,
                variantId: item.variantId,
                isFree: item.isFree,
                freeQuantity: item.freeQuantity,
              }],
            },
          });
        })
      );

      const uniqueVendors = Array.from(
        new Map(createdOrder.products.map(p => [p.vendor.id, p.vendor])).values()
      );

      await Promise.all(
        uniqueVendors.map(vendor => {
          const vendorProducts = createdOrder.products.filter(p => p.vendor.id === vendor.id);
          const vendorSpecificOrder = { ...createdOrder, products: vendorProducts };
          return this.queueService.addEmailJob(
            vendor.email,
            'Order Placed Successfully',
            getOrderEmailTemplateForVendor(vendorSpecificOrder, vendor)
          );
        })
      );

      const vendorIds = [...new Set(createdOrder.products.map(p => p.vendorId))];
      for (const vendorId of vendorIds) {
        const commission = await this.prisma.commission.findUnique({ where: { vendorId } });
        if (!commission) continue;
        const vendorItems = createdOrder.products.filter(p => p.vendorId === vendorId);

        const payOnStatusValue = this.getOrderStatusValue(commission.payOnStatus);

        if (typeof payOnStatusValue !== 'number') {
          this.logger.error(`Invalid payOnStatus "${commission.payOnStatus}" for vendor ${vendorId}`);
          return;
        }

        const shouldTriggerTransfer = vendorItems.some(item => {
          const itemStatusValue = this.getOrderStatusValue(item.status);
          if (typeof itemStatusValue !== 'number') {
            this.logger.warn(`Invalid status "${item.status}" found for order product`);
            return false;
          }
          return itemStatusValue >= payOnStatusValue;
        });

        if (shouldTriggerTransfer) {
          await this.handleVendorTransfer(createdOrder.id, vendorId, commission.payOnStatus);
        }
      }

      await this.queueService.addEmailJob(
        createdOrder.user.email,
        'Your Order Has Been Placed',
        getOrderEmailTemplateForUser(createdOrder)
      );

      this.eventEmitter.emit('order.placed', { createdOrder });

      return {
        message: 'Order has been placed successfully!',
        data: order,
      };
    } catch (error) {
      this.logger.error('Error while ordering', error);
      // A card decline (incl. a valid card blocked as fraudulent) is surfaced
      // as a clean HttpException by the StripeService — re-throw it verbatim so
      // the client gets the actionable message instead of "Internal Server Error".
      const stripeError = handleStripeError(error);
      if (stripeError) {
        throw stripeError;
      }
      if (error instanceof HttpException) {
        throw error;
      }
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async applyPromotions(user: any, cartItems: any[], address: any, orderData: CreateOrderDto) {

    const vendorItems = new Map<string, any[]>();
    cartItems.forEach(item => {
      const vendorId = item.variant.product.vendorId;
      if (!vendorItems.has(vendorId)) {
        vendorItems.set(vendorId, []);
      }
      vendorItems.get(vendorId)!.push(item);
    });

    const userTotal = await this.prisma.orders.aggregate({
      where: { userId: user.id, status: 'DELIVERED' },
      _sum: { price: true, tax: true, shippingTax: true },
    });
    const userTotalSpend = (userTotal._sum.price || 0) + (userTotal._sum.tax || 0) + (userTotal._sum.shippingTax || 0);

    const vendorPromotions = new Map<string, any[]>();
    const vendorPromotionValidationInfo = new Map<string, any[]>();
    for (const vendorId of vendorItems.keys()) {
      const vendorProducts = vendorItems.get(vendorId)!.map(item => item.variant.productId);
      const promotions = await this.prisma.promotion.findMany({
        where: {
          status: true,
          vendorId,
          OR: [
            { appliesToAllProducts: true },
            { products: { some: { id: { in: vendorProducts } } } },
            { buyProductIds: { hasSome: vendorProducts } },
            { getProductIds: { hasSome: vendorProducts } },
          ],
        },
        include: { bundleDeals: true, products: true },
      });

      const validatedPromotions: any[] = [];
      const validationDetails: any[] = [];
      for (const promotion of promotions) {
        const now = new Date();
        const info: string[] = [];

        if (
          promotion.durationType === 'SELECTED_TIME' &&
          (promotion.startDate > now || promotion.endDate < now)
        ) {
          info.push('Promotion is not active based on date');
        }

        if (promotion.eligibleCustomers !== 'ALL') {
          const customerTypes = [
            user.orders?.length === 0 ? 'NEW' : 'REPEATED',
            user.getInTouch ? 'NEWS_LETTER' : null,
          ].filter(Boolean);

          const matchesType = promotion.customerTypes.some(type => customerTypes.includes(type));
          const matchesSpend = promotion.highSpendLimit ? userTotalSpend >= promotion.highSpendLimit : true;

          if (!matchesType && !matchesSpend) {
            info.push('Customer type or spend amount does not match');
          }
        }

        if (promotion.eligibleCountries.length && !promotion.eligibleCountries.includes(address.country)) {
          info.push('Country not eligible');
        }

        if (promotion.eligibleStates.length && !promotion.eligibleStates.includes(address.state)) {
          info.push('State not eligible');
        }

        if (promotion.eligibleCities.length && !promotion.eligibleCities.includes(address.city)) {
          info.push('City not eligible');
        }

        if (info.length === 0) {
          validatedPromotions.push(promotion);
        } else {
          validationDetails.push({
            promotionId: promotion.id,
            failedConditions: info,
          });
        }
      }

      vendorPromotions.set(vendorId, validatedPromotions);
      vendorPromotionValidationInfo.set(vendorId, validationDetails);
    }
    const debugValidation = Object.fromEntries(
      Array.from(vendorPromotionValidationInfo.entries()).map(([vendorId, validations]) => [
        vendorId,
        validations.map(v => ({
          promotionId: v.promotionId,
          failedConditions: v.failedConditions,
        })),
      ])
    );

    let totalDiscount = 0;
    const vendorDiscounts: { vendorId: string; discount: number; promotionId: string; promotionType: 'FREE_SHIPPING' | 'BUY_X_GET_Y' | 'BUNDLE_DEALS' | 'SPEND_MONEY' }[] = [];
    const appliedPromotionIds: string[] = [];
    let shippingTax = orderData.shippingTax ?? 0;
    const vendorSubtotals = new Map<string, number>();
    const freeItems: { variantId: string; quantity: number; vendorId: string; price: number; isFree: boolean }[] = [];

    for (const [vendorId, items] of vendorItems) {
      let vendorSubtotal = 0;
      items.forEach(item => {
        const selectedProduct = orderData.products.find(prod => prod.variantId === item.variant.id);
        if (selectedProduct) {
          vendorSubtotal += item.variant.discountedPrice * selectedProduct.quantity;
        }
      });
      vendorSubtotals.set(vendorId, vendorSubtotal);

      let vendorDiscount = 0;
      let bestPromotion: any = null;
      let maxBenefit = 0;
      const promotions = vendorPromotions.get(vendorId) || [];

      for (const promotion of promotions) {
        if (promotion.maxOrdersPerUser) {
          const userOrderCountForPromotion = await this.prisma.orderPromotion.count({
            where: {
              promotionId: promotion.id,
              order: { userId: user.id },
            },
          })
          if (userOrderCountForPromotion >= promotion.maxOrdersPerUser) {
            this.logger.log("User has already used this promotion maximum allowed times");
            continue;
          };
        }

        let benefit = 0;
        switch (promotion.type) {
          case 'FREE_SHIPPING':
            const deliveryOption = orderData.deliveryOptions.filter(data => data.vendorId === promotion.vendorId);
            const shippingMethod = deliveryOption[0].options.find(data => data.shippingMethod === "UPS");
            const option = deliveryOption.length > 0 ? shippingMethod?.deliveryType : undefined;
            if (!option) {
              throw new BadRequestException('Delivery option not found for the vendor.');
            }
            const shippingTaxForVendor = deliveryOption.length > 0 ? deliveryOption[0].totalShippingCost : 0;
            if (!shippingTaxForVendor) {
              throw new BadRequestException('Shipping cost not found for the vendor.');
            }

            if (vendorSubtotal >= (promotion.minPurchaseValue)) {
              if (promotion.deliveryOptions.includes(option)) {
                if (promotion.freeShippingValue < shippingTaxForVendor) {
                  benefit = promotion.freeShippingValue;
                  shippingTax = shippingTaxForVendor - promotion.freeShippingValue;
                } else {
                  benefit = shippingTaxForVendor;
                  shippingTax = shippingTaxForVendor;
                }
              }
            }
            break;

          case 'BUY_X_GET_Y':
            const totalBuyQuantity = items
              .filter(item => promotion.buyProductIds.includes(item.variant.productId))
              .reduce((sum, item) => sum + item.quantity, 0);

            const buyQuantity = promotion.buyQuantity;
            const getQuantity = promotion.getQuantity;
            const buyCount = Math.floor(totalBuyQuantity / buyQuantity);
            const freeItemCount = buyCount * getQuantity;

            const eligibleItems = items.filter(i => promotion.getProductIds.includes(i.variant.productId));

            let remainingFreeItems = freeItemCount;
            for (const freeItem of eligibleItems) {
              const freeQuantity = Math.min(remainingFreeItems, freeItem.quantity);
              if (freeQuantity > 0) {
                const freeItemPrice = freeItem.variant.discountedPrice;
                benefit += freeItemPrice * freeQuantity;
                remainingFreeItems -= freeQuantity;
              }
              if (remainingFreeItems <= 0) break;
            }
            break;

          case 'BUNDLE_DEALS':
            const bundleItems = items.filter(item =>
              promotion.selectedProductIds.includes(item.variant.productId)
            );
            const totalBundleQuantity = bundleItems.reduce((sum, item) => sum + item.quantity, 0);
            const applicableDeal = promotion.bundleDeals
              .filter(deal => totalBundleQuantity >= deal.bundleQuantity)
              .sort((a, b) => b.bundleQuantity - a.bundleQuantity)[0];

            if (applicableDeal) {
              if (applicableDeal.bundleFixedDiscount) {
                benefit = applicableDeal.bundleFixedDiscount;
                benefit = benefit * applicableDeal?.bundleQuantity;
              } else if (applicableDeal.bundlePercentageDiscount) {
                benefit = (vendorSubtotal * applicableDeal.bundlePercentageDiscount) / 100;
                benefit = benefit * applicableDeal?.bundleQuantity;
              }
              if (benefit < promotion.capMinValue) {
                benefit = benefit;
              } else if (benefit > promotion.capMaxValue) {
                benefit = promotion.capMaxValue;
              }
            }
            break;

          case 'SPEND_MONEY':
            if (vendorSubtotal >= (promotion.spendAmount)) {
              if (promotion.spendFixedDiscount) {
                benefit = promotion.spendFixedDiscount;
              } else if (promotion.spendPercentageDiscount) {
                benefit = (vendorSubtotal * promotion.spendPercentageDiscount) / 100;
              }
              if (benefit < promotion.capMinValue) {
                benefit = benefit;
              } else if (benefit > promotion.capMaxValue) {
                benefit = promotion.capMaxValue;
              }
            }
            break;
        }
        if (benefit > maxBenefit) {
          maxBenefit = benefit;
          bestPromotion = promotion;
        }
      }

      if (bestPromotion) {
        switch (bestPromotion.type) {
          case 'FREE_SHIPPING':
            const deliveryOption = orderData.deliveryOptions.filter(data => data.vendorId === bestPromotion.vendorId);
            const shippingMethod = deliveryOption[0].options.find(data => data.shippingMethod === "UPS");
            const option = deliveryOption.length > 0 ? shippingMethod?.deliveryType : undefined;
            if (!option) {
              throw new BadRequestException('Delivery option not found for the vendor.');
            }
            const shippingTaxForVendor = deliveryOption.length > 0 ? deliveryOption[0].totalShippingCost : 0;
            if (!shippingTaxForVendor) {
              throw new BadRequestException('Shipping cost not found for the vendor.');
            }

            if (vendorSubtotal >= (bestPromotion.minPurchaseValue)) {
              if (bestPromotion.deliveryOptions.includes(option)) {
                if (bestPromotion.freeShippingValue < shippingTaxForVendor) {
                  vendorDiscount = bestPromotion.freeShippingValue;
                  shippingTax = shippingTaxForVendor - bestPromotion.freeShippingValue;
                } else {
                  vendorDiscount = shippingTaxForVendor;
                }

                vendorDiscounts.push({
                  vendorId,
                  discount: vendorDiscount,
                  promotionId: bestPromotion.id,
                  promotionType: 'FREE_SHIPPING',
                });
                appliedPromotionIds.push(bestPromotion.id);
              }
            }
            break;

          case 'BUY_X_GET_Y':
            const totalBuyQuantity = items
              .filter(item => bestPromotion.buyProductIds.includes(item.variant.productId))
              .reduce((sum, item) => sum + item.quantity, 0);

            const buyQuantity = bestPromotion.buyQuantity;
            const getQuantity = bestPromotion.getQuantity;
            const buyCount = Math.floor(totalBuyQuantity / buyQuantity);
            const freeItemCount = buyCount * getQuantity;

            const eligibleItems = items.filter(i => bestPromotion.getProductIds.includes(i.variant.productId));

            let remainingFreeItems = freeItemCount;
            for (const freeItem of eligibleItems) {
              const freeQuantity = Math.min(remainingFreeItems, freeItem.quantity);
              if (freeQuantity > 0) {
                freeItems.push({
                  variantId: freeItem.variant.id,
                  quantity: freeQuantity,
                  vendorId,
                  price: 0,
                  isFree: true,
                });
                await this.prisma.productVariant.update({
                  where: { id: freeItem.variant.id },
                  data: { quantity: { decrement: freeQuantity } },
                });
                vendorDiscount += freeItem.variant.discountedPrice * freeQuantity;
                remainingFreeItems -= freeQuantity;
              }
              if (remainingFreeItems <= 0) break;
            }

            if (vendorDiscount > 0) {
              vendorDiscounts.push({
                vendorId,
                discount: vendorDiscount,
                promotionId: bestPromotion.id,
                promotionType: 'BUY_X_GET_Y',
              });
              appliedPromotionIds.push(bestPromotion.id);
            }
            break;

          case 'BUNDLE_DEALS':
            const bundleItems = items.filter(item =>
              bestPromotion.selectedProductIds.includes(item.variant.productId)
            );
            const totalBundleQuantity = bundleItems.reduce((sum, item) => sum + item.quantity, 0);
            const applicableDeal = bestPromotion.bundleDeals
              .filter(deal => totalBundleQuantity >= deal.bundleQuantity)
              .sort((a, b) => b.bundleQuantity - a.bundleQuantity)[0];

            if (applicableDeal) {
              if (applicableDeal.bundleFixedDiscount) {
                vendorDiscount = applicableDeal.bundleFixedDiscount;
                vendorDiscount = vendorDiscount * applicableDeal?.bundleQuantity;
              } else if (applicableDeal.bundlePercentageDiscount) {
                vendorDiscount = (vendorSubtotal * applicableDeal.bundlePercentageDiscount) / 100;
                vendorDiscount = vendorDiscount * applicableDeal?.bundleQuantity;
              }
              if (vendorDiscount < bestPromotion.capMinValue) {
                vendorDiscount = vendorDiscount;
              } else if (vendorDiscount > bestPromotion.capMaxValue) {
                vendorDiscount = bestPromotion.capMaxValue;
              }
              vendorDiscounts.push({
                vendorId,
                discount: vendorDiscount,
                promotionId: bestPromotion.id,
                promotionType: 'BUNDLE_DEALS',
              });
              appliedPromotionIds.push(bestPromotion.id);
            }
            break;

          case 'SPEND_MONEY':
            if (vendorSubtotal >= (bestPromotion.spendAmount || 0)) {
              if (bestPromotion.spendFixedDiscount) {
                vendorDiscount = bestPromotion.spendFixedDiscount;
              } else if (bestPromotion.spendPercentageDiscount) {
                vendorDiscount = (vendorSubtotal * bestPromotion.spendPercentageDiscount) / 100;
              }
              if (vendorDiscount < bestPromotion.capMinValue) {
                vendorDiscount = vendorDiscount;
              } else if (vendorDiscount > bestPromotion.capMaxValue) {
                vendorDiscount = bestPromotion.capMaxValue;
              }
              vendorDiscounts.push({
                vendorId,
                discount: vendorDiscount,
                promotionId: bestPromotion.id,
                promotionType: 'BUNDLE_DEALS',
              });
              appliedPromotionIds.push(bestPromotion.id);
            }
            break;
        }
      }
      totalDiscount += vendorDiscount;
    }

    for (const freeItem of freeItems) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: freeItem.variantId },
        include: { product: true },
      });
      if (!variant || variant.quantity < freeItem.quantity) {
        throw new BadRequestException(
          `Not enough stock for free item ${variant?.product?.title ?? 'unknown'} in ${variant?.color ?? 'default color'} - ${variant?.size ?? 'default size'}.`
        );
      }
    }

    return {
      totalDiscount,
      vendorDiscounts,
      appliedPromotionIds,
      shippingTax,
      freeItems,
    };
  }

  async getAllOrders(
    userId: string,
    page: number,
    limit: number,
    status: string,
    searchTerm: string,
    returnOrder: string
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id: userId
        }
      })
      const skip = (page - 1) * limit;
      const filters: any = {
        userId,
      };

      if (status) {
        filters.status = status;
      }

      searchTerm = searchTerm?.trim();
      if (searchTerm) {
        filters.OR = [
          {
            id: {
              contains: searchTerm ?? "",
              mode: "insensitive",
            },
          },
          {
            orderNumber: {
              contains: searchTerm ?? "",
              mode: "insensitive",
            },
          },
          {
            products: {
              some: {
                variant: {
                  product: {
                    title: {
                      contains: searchTerm,
                      mode: "insensitive",
                    },
                  },
                },
              },
            },
          },
          {
            address: {
              streetAddress: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
          },
        ];
      }

      const getUserOrders = await this.prisma.orders.findMany({
        where: filters,
        skip: skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          products: {
            include: {
              variant: {
                include: {
                  product: true
                },
              },
              vendor: true,
            },
          },
          address: true,
          returnOrder: true,
          bundleItems: {
            include: {
              bundle: true,
            },
          },
        },
      });

      if (returnOrder) {
        const filteredProducts = getUserOrders
          .map((order) => {
            const filteredVariants = order.products.filter((variant) => {
              const isReturn = variant.status === "RETURNED";
              return isReturn;
            });

            return {
              ...order,
              products: filteredVariants,
            };
          })
          .filter((product) => product.products.length > 0);
      }

      const totalOrders = await this.prisma.orders.count({
        where: filters,
      });
      const getCancelledOrders = await this.prisma.orders.findMany({
        where: {
          userId: userId,
          status: "CANCELED",
        }
      })
      const getDeliveredOrder = await this.prisma.orders.findMany({
        where: {
          userId: userId,
          status: "DELIVERED",
        }
      })

      return {
        data: getUserOrders,
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders: totalOrders,
        cancelOrder: getCancelledOrders?.length,
        deliveredOrder: getDeliveredOrder?.length
      };
    } catch (error) {
      this.logger.error("Error while fetching orders", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }

  }

  async getReturnOrders(userId: string, searchTerm: string) {
    try {
      const filters: any = {
        userId,
      };

      searchTerm = searchTerm?.trim();
      if (searchTerm) {
        filters.OR = [
          {
            id: {
              contains: searchTerm ?? "",
              mode: "insensitive",
            },
          },
          {
            orderNumber: {
              contains: searchTerm ?? "",
              mode: "insensitive",
            },
          },
          {
            products: {
              some: {
                variant: {
                  product: {
                    title: {
                      contains: searchTerm,
                      mode: "insensitive",
                    },
                  },
                },
              },
            },
          },
          {
            address: {
              streetAddress: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
          },
        ];
      }

      const getUserOrders = await this.prisma.orders.findMany({
        where: filters,
        orderBy: { updatedAt: "desc" },
        include: {
          products: {
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
              vendor: true,
            },
          },
          address: true,
        },
      });

      const filteredProducts = getUserOrders
        .map((order) => {
          const filteredVariants = order.products.filter((variant) => {
            const isReturn = variant.status === "RETURNED";
            return isReturn;
          });

          return {
            ...order,
            products: filteredVariants,
          };
        })
        .filter((product) => product.products.length > 0);
      return {
        data: filteredProducts,
      };
    } catch (error) {
      this.logger.error("Error while return orders", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async getOrdersByProduct(
    variantId: string,
    page: number,
    limit: number,
    status: string,
    searchTerm: string
  ) {
    try {
      const skip = (page - 1) * limit;
      const filters: any = {
        products: {
          some: {
            variantId: variantId,
          },
        },
      };

      if (status) {
        filters.status = status;
      }

      searchTerm = searchTerm?.trim();
      if (searchTerm) {
        filters.OR = [
          {
            products: {
              some: {
                variant: {
                  product: {
                    title: {
                      contains: searchTerm,
                      mode: "insensitive",
                    },
                  },
                },
              },
            },
          },
          {
            address: {
              streetAddress: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
          },
        ];
      }

      const getUserOrders = await this.prisma.orders.findMany({
        where: filters,
        skip: skip,
        take: limit,
        include: {
          products: {
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
            },
          },
          returnOrder: true,
          address: true,
        },
      });

      const totalOrders = await this.prisma.orders.count({
        where: filters,
      });

      return {
        data: getUserOrders,
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders: totalOrders,
      };
    } catch (error) {
      this.logger.error("Error while fetching orders by product", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async getSpecificOrder(orderId: string) {
    try {
      const specificOrder = await this.prisma.orders.findUnique({
        where: {
          id: orderId,
        },
        include: {
          products: {
            include: {
              variant: {
                include: {
                  product: {
                    include: {
                      vendor: true,
                    },
                  },
                },
              },
            },
          },
          bundleItems: {
            include: {
              bundle: {
                include: {
                  items: {
                    include: {
                      variant: {
                        include: {
                          product: {
                            include: { vendor: true },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          address: true,
          license: true,
          user: true,
          returnOrder: true,
        },
      });
      const paymentIntentId = specificOrder.stripePaymentIntentId;
      if (!paymentIntentId) {
        return {
          data: { ...specificOrder, paymentMethod: null },
        };
      }

      const paymentIntentData = await this.stripeService.getPaymentIntent(paymentIntentId);
      const paymentMethodId = paymentIntentData?.payment_method;
      const user = specificOrder.user;
      if (!user?.stripeCustomerId) {
        return {
          data: { ...specificOrder, paymentMethod: null },
        };
      }
      const paymentMethods = await this.stripeService.getPaymentMethods(user.stripeCustomerId);
      const paymentMethodMap = new Map<string, any>(
        paymentMethods.data.map((method) => [method.id, method])
      );
      const paymentMethod = typeof paymentMethodId === "string" ? paymentMethodMap.get(paymentMethodId) || null : null;
      return {
        data: { ...specificOrder, paymentMethod },
      };

    } catch (error) {
      this.logger.error("Error while fetching specific order", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async updateOrder(orderId: string, updateOrderData: UpdateOrderDto, logginUser: RequestUser) {
    try {
      const existingOrder = await this.prisma.orders.findUnique({
        where: { id: orderId },
        include: {
          products: {
            include: {
              variant: true,
            },
          },
        },
      });

      if (!existingOrder) {
        throw new NotFoundException(`Order with ID ${orderId} not found.`);
      }

      const data: any = {};
      if (updateOrderData?.addressId)
        data.addressId = updateOrderData.addressId;
      if (updateOrderData?.licenseId)
        data.licenseId = updateOrderData.licenseId;
      if (updateOrderData?.status) {
        const status = updateOrderData.status;

        if (logginUser.role === Role.VENDOR) {
          const existingOrderItems = await this.prisma.orderItems.findMany({
            where: { orderId, vendorId: logginUser.id },
            select: { status: true, trackStatus: true, variantId: true },
          });

          if (!existingOrderItems?.length) {
            throw new BadRequestException("You can only update your own order items.");
          }

          await Promise.all(
            existingOrderItems.map(async (orderItem) => {
              let existingTrackStatus = [];
              try {
                existingTrackStatus = Array.isArray(orderItem.trackStatus)
                  ? [...orderItem.trackStatus]
                  : typeof orderItem.trackStatus === 'string' ? JSON.parse(orderItem.trackStatus) : [];
              } catch (e) {
                existingTrackStatus = [];
              }

              const existingStatusIndex = existingTrackStatus.findIndex(
                (item) => item.status === status
              );

              const currentDate = new Date().toISOString();

              if (existingStatusIndex >= 0) {
                existingTrackStatus[existingStatusIndex].date = currentDate;
              } else {
                existingTrackStatus.push({ status, date: currentDate });
              }

              await this.prisma.orderItems.update({
                where: {
                  orderId_variantId: {
                    orderId,
                    variantId: orderItem.variantId
                  }
                },
                data: {
                  status,
                  trackStatus: existingTrackStatus
                },
              });
            })
          );
        } else if (logginUser.role === Role.ADMIN) {
          const assignedVendorIds = (await this.prisma.vendors.findMany({
            where: { adminId: logginUser.id },
            select: { id: true },
          })).map(v => v.id);

          if (assignedVendorIds.length === 0) {
            throw new BadRequestException("You don't have any vendors assigned to you.");
          }

          const orderItems = await this.prisma.orderItems.findMany({
            where: {
              orderId,
              vendorId: { in: assignedVendorIds }
            },
            select: { trackStatus: true, variantId: true },
          });

          await Promise.all(
            orderItems.map(async (orderItem) => {
              let existingTrackStatus = [];
              try {
                existingTrackStatus = Array.isArray(orderItem.trackStatus)
                  ? [...orderItem.trackStatus]
                  : typeof orderItem.trackStatus === 'string' ? JSON.parse(orderItem.trackStatus) : [];
              } catch (e) {
                existingTrackStatus = [];
              }

              const existingStatusIndex = existingTrackStatus.findIndex(
                (item) => item.status === status
              );

              const currentDate = new Date().toISOString();

              if (existingStatusIndex >= 0) {
                existingTrackStatus[existingStatusIndex].date = currentDate;
              } else {
                existingTrackStatus.push({ status, date: currentDate });
              }

              await this.prisma.orderItems.update({
                where: {
                  orderId_variantId: {
                    orderId,
                    variantId: orderItem.variantId
                  }
                },
                data: {
                  status,
                  trackStatus: existingTrackStatus
                },
              });
            })
          );
        } else if (logginUser.role === Role.SUPER_ADMIN) {
          const orderItems = await this.prisma.orderItems.findMany({
            where: { orderId },
            select: { trackStatus: true, variantId: true },
          });

          await Promise.all(
            orderItems.map(async (orderItem) => {
              let existingTrackStatus = [];
              try {
                existingTrackStatus = Array.isArray(orderItem.trackStatus)
                  ? [...orderItem.trackStatus]
                  : typeof orderItem.trackStatus === 'string' ? JSON.parse(orderItem.trackStatus) : [];
              } catch (e) {
                existingTrackStatus = [];
              }

              const existingStatusIndex = existingTrackStatus.findIndex(
                (item) => item.status === status
              );

              const currentDate = new Date().toISOString();

              if (existingStatusIndex >= 0) {
                existingTrackStatus[existingStatusIndex].date = currentDate;
              } else {
                existingTrackStatus.push({ status, date: currentDate });
              }

              await this.prisma.orderItems.update({
                where: {
                  orderId_variantId: {
                    orderId,
                    variantId: orderItem.variantId
                  }
                },
                data: {
                  status,
                  trackStatus: existingTrackStatus
                },
              });
            })
          );
        }
      }

      if (updateOrderData?.trackingNo && Array.isArray(updateOrderData.trackingNo)) {
        const trackingNumbers = updateOrderData.trackingNo
          .map((entry) => entry.trackingNo)
          .filter((tn) => typeof tn === 'string');

        const data = await this.upsService.subscribeToTrackingUpdates(trackingNumbers);
      }

      if (updateOrderData?.trackingNo && Array.isArray(updateOrderData.trackingNo)) {
        type TrackingNoItem = { vendorId: string; trackingNo: string };

        let existingTrackingNo: TrackingNoItem[] = [];
        if (existingOrder.trackingNo) {
          try {
            existingTrackingNo = Array.isArray(existingOrder.trackingNo)
              ? (existingOrder.trackingNo as TrackingNoItem[])
              : JSON.parse(existingOrder.trackingNo as string);
          } catch (e) {
            existingTrackingNo = [];
          }
        }

        const vendorIdsInUpdate = [...new Set(updateOrderData.trackingNo.map(t => t.vendorId))];
        const filteredExisting = existingTrackingNo.filter(
          item => !vendorIdsInUpdate.includes(item.vendorId)
        );

        data.trackingNo = [...filteredExisting, ...updateOrderData.trackingNo];

        const trackingNumbers = updateOrderData.trackingNo
          .map(entry => entry.trackingNo)
          .filter(tn => typeof tn === 'string');

        if (trackingNumbers.length > 0) {
          await this.upsService.subscribeToTrackingUpdates(trackingNumbers);
        }
      }

      if (updateOrderData?.price) data.price = updateOrderData.price;
      if (updateOrderData?.discount) data.discount = updateOrderData.discount;
      if (updateOrderData?.returnStatus)
        data.returnStatus = updateOrderData.returnStatus;

      const orderItems = await this.prisma.orderItems.findMany({
        where: { orderId },
        select: { status: true },
      });

      const uniqueStatuses = new Set(orderItems.map((item) => item.status));

      if (uniqueStatuses.size === 1) {
        data.status = Array.from(uniqueStatuses)[0];
      } else {
        data.status = existingOrder?.status;
      }

      let updatedOrder: any;
      if (Object.keys(data).length > 0) {
        updatedOrder = await this.prisma.orders.update({
          where: { id: orderId },
          data: data,
          include: {
            products: {
              where: logginUser.role === Role.VENDOR
                ? { vendorId: logginUser?.id }
                : undefined
            }
          },
        });
      }

      if ((logginUser.role === Role.VENDOR || logginUser.role === Role.ADMIN) &&
        updateOrderData?.products?.length > 0) {
        for (const productData of updateOrderData.products) {
          const existingOrderItem = existingOrder.products.find(
            (item) => item.orderId === productData.orderId &&
              item.vendorId === (logginUser.role === Role.VENDOR ? logginUser.id : item.vendorId)
          );

          if (!existingOrderItem) {
            throw new BadRequestException("You can only update your own order items.");
          }

          if (logginUser.role === Role.ADMIN) {
            const isVendorAssigned = await this.prisma.vendors.findFirst({
              where: {
                id: existingOrderItem.vendorId,
                adminId: logginUser.id
              }
            });

            if (!isVendorAssigned) {
              throw new BadRequestException("You can only update order items for vendors assigned to you.");
            }
          }

          await this.prisma.orderItems.upsert({
            where: {
              orderId_variantId: {
                orderId: orderId,
                variantId: productData.variantId || existingOrderItem.variantId,
              },
            },
            update: {
              quantity: productData.quantity || existingOrderItem.quantity,
              status: productData.status || existingOrderItem.status || "PLACED",
            },
            create: {
              orderId,
              variantId: productData.variantId || existingOrderItem.variantId,
              quantity: productData.quantity || existingOrderItem.quantity,
              status: productData.status || existingOrderItem.status || "PLACED",
              vendorId: logginUser.role === Role.VENDOR ? logginUser.id : existingOrderItem.vendorId,
            },
          });
        }
      }

      const isVendor = logginUser.role === Role.VENDOR;
      const isAdmin = logginUser.role === Role.ADMIN;

      const assignedVendorIds = (await this.prisma.vendors.findMany({
        where: { adminId: logginUser.id },
        select: { id: true },
      })).map(v => v.id);

      const order = await this.prisma.orders.findUnique({
        where: {
          id: orderId,
        },
        include: {
          user: true,
          products: {
            where: isVendor
              ? { vendorId: logginUser.id }
              : isAdmin
                ? {
                  vendor: {
                    id: {
                      in: assignedVendorIds,
                    },
                  },
                }
                : undefined,

            include: {
              variant: {
                include: {
                  product: true,
                },
              },
              vendor: true,
            },
          },
        },
      });

      if (updateOrderData?.trackingUpdates && Array.isArray(updateOrderData.trackingUpdates)) {
        await Promise.all(
          updateOrderData.trackingUpdates.map(async (trackingUpdate) => {
            const { variantId, trackingNo } = trackingUpdate;

            if (logginUser.role === Role.VENDOR) {
              const item = await this.prisma.orderItems.findUnique({
                where: {
                  orderId_variantId: {
                    orderId,
                    variantId
                  }
                },
                select: { vendorId: true }
              });

              if (!item || item.vendorId !== logginUser.id) {
                throw new BadRequestException("You can only update tracking for your own items.");
              }
            } else if (logginUser.role === Role.ADMIN) {
              const item = await this.prisma.orderItems.findUnique({
                where: {
                  orderId_variantId: {
                    orderId,
                    variantId
                  }
                },
                include: {
                  vendor: {
                    select: { adminId: true }
                  }
                }
              });

              if (!item || item.vendor.adminId !== logginUser.id) {
                throw new BadRequestException("You can only update tracking for items from your vendors.");
              }
            }

            await this.prisma.orderItems.update({
              where: {
                orderId_variantId: {
                  orderId,
                  variantId
                }
              },
              data: {
                trackingNo,
              }
            });

            if (trackingNo) {
              await this.upsService.subscribeToTrackingUpdates([trackingNo]);
            }
          })
        );
      }

      const orderUniqueStatuses = new Set(order.products.map(p => p.status));

      for (const status of orderUniqueStatuses) {
        switch (status) {
          case 'INPROGRESS':
            await this.emailService.sendEmail(
              order.user.email,
              "Your Order is being processed",
              getOrderEmailTemplateForUserInprogress(order, status)
            );
            break;
          case 'PACKED':
            await this.emailService.sendEmail(
              order.user.email,
              "Your order is packed",
              getOrderEmailTemplateForUserInprogress(order, status)
            );
            break;
          case 'SHIPPED':
            await this.emailService.sendEmail(
              order.user.email,
              "Your order is shipped",
              getOrderEmailTemplateForUserInprogress(order, status)
            );
            break;
          case 'DELIVERED':
            await this.emailService.sendEmail(
              order.user.email,
              "Your order is delivered",
              getOrderEmailTemplateForUserInprogress(order, status)
            );
            break;
        }
      }

      this.eventEmitter.emit('order.status.updated', { order });

      const vendorIds = [...new Set(order.products.map(p => p.vendorId))];
      for (const vendorId of vendorIds) {
        const commission = await this.prisma.commission.findUnique({ where: { vendorId } });
        if (!commission) continue;
        const vendorItems = order.products.filter(p => p.vendorId === vendorId);

        const payOnStatusValue = this.getOrderStatusValue(commission.payOnStatus);

        if (typeof payOnStatusValue !== 'number') {
          this.logger.error(`Invalid payOnStatus "${commission.payOnStatus}" for vendor ${vendorId}`);
          return;
        }

        const shouldTriggerTransfer = vendorItems.some(item => {
          const itemStatusValue = this.getOrderStatusValue(item.status);
          if (typeof itemStatusValue !== 'number') {
            this.logger.warn(`Invalid status "${item.status}" found for order product`);
            return false;
          }
          return itemStatusValue >= payOnStatusValue;
        });

        if (shouldTriggerTransfer) {
          await this.handleVendorTransfer(orderId, vendorId, commission.payOnStatus);
        }
      }

      return {
        message: "Order has been updated successfully!",
        data: updatedOrder,
      };
    } catch (error) {
      this.logger.error("Error while updating order", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  private getOrderStatusValue(status: string): number | undefined {
    const statuses = Object.keys(OrderStatus) as Array<keyof typeof OrderStatus>;
    const index = statuses.findIndex(s => OrderStatus[s] === status);
    return index >= 0 ? index : undefined;
  }

  private async retryCapabilityCheck(
    accountId: string,
    capability: string,
    maxRetries: number,
    delayMs: number
  ): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
      const capabilities =
        await this.stripeService.getAccountCapabilities(accountId);
      if (capabilities[capability] === "active") {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    return false;
  }

  async getRecentOrdersByVendor(
    vendorId: string,
    status: string,
    searchTerm: string,
    page: number,
    limit: number
  ) {
    try {
      const skip = (page - 1) * limit;

      const vendorExists = await this.prisma.vendors.findUnique({
        where: { id: vendorId },
      });

      if (!vendorExists) {
        throw new NotFoundException(`Vendor with ID ${vendorId} not found.`);
      }

      const filters: any = {
        products: {
          some: {
            variant: {
              product: {
                vendorId: vendorId,
              },
            },
          },
        },
      };


      if (searchTerm?.trim()) {
        const s = searchTerm.trim();
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

        const AND: any[] = [];

        if (dateRegex.test(s)) {
          const start = new Date(s);
          const end = new Date(s);
          end.setUTCHours(23, 59, 59, 999);

          AND.push({
            createdAt: { gte: start, lte: end },
          });
        } else {
          const OR: any[] = [
            {
              products: {
                some: {
                  variant: {
                    product: {
                      title: { contains: s, mode: "insensitive" },
                    },
                  },
                },
              },
            },
            {
              address: {
                streetAddress: { contains: s, mode: "insensitive" },
              },
            },
            {
              id: { contains: s, mode: "insensitive" },
            },
            {
              orderNumber: { contains: s, mode: "insensitive" },
            },
            {
              user: {
                OR: [
                  { firstName: { contains: s, mode: "insensitive" } },
                  { lastName: { contains: s, mode: "insensitive" } },
                ],
              },
            },
          ];

          const tokens = s.split(/\s+/).filter(Boolean);
          if (tokens.length >= 2) {
            const first = tokens[0];
            const last = tokens[tokens.length - 1];

            OR.push(
              {
                user: {
                  AND: [
                    { firstName: { contains: first, mode: "insensitive" } },
                    { lastName: { contains: last, mode: "insensitive" } },
                  ],
                },
              },
              {
                user: {
                  AND: [
                    { firstName: { contains: last, mode: "insensitive" } },
                    { lastName: { contains: first, mode: "insensitive" } },
                  ],
                },
              }
            );
          }

          AND.push({ OR });
        }

        if (AND.length > 0) {
          filters.AND = AND;
        }
      }


      if (status) {
        filters.status = status;
      }

      if (status && !filters.status) {
        filters.products.some.status = status;
      }

      const recentOrders = await this.prisma.orders.findMany({
        where: filters,
        orderBy: {
          createdAt: "desc",
        },
        skip: skip,
        take: limit,
        include: {
          user: true,
          address: true,
          cancelOrder: {
            include: {
              order: true,
            }
          },
          products: {
            where: {
              variant: {
                product: {
                  vendorId: vendorId,
                },
              },
            },
            include: {
              variant: {
                include: {
                  product: {
                    include: {
                      vendor: true,
                    }
                  },
                },
              },
            },
          },
          returnOrder: true,
        },
      });

      const totalOrders = await this.prisma.orders.count({
        where: {
          products: {
            some: {
              variant: {
                product: {
                  vendorId: vendorId,
                },
              },
            },
          },
        },
      });

      return {
        data: recentOrders,
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders: totalOrders,
      };
    } catch (error) {
      this.logger.error("Error fetching recent orders by vendor", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async getAllOrdersForSuperAdmin(
    vendorId: string,
    status: string,
    searchTerm: string,
    page: number,
    limit: number
  ) {
    try {
      const skip = (page - 1) * limit;

      const filters: any = {};

      if (vendorId) {
        const vendorExists = await this.prisma.vendors.findUnique({
          where: { id: vendorId },
        });

        if (!vendorExists) {
          throw new NotFoundException(`Vendor with ID ${vendorId} not found.`);
        }
        filters.products = {
          some: {
            variant: {
              product: {
                vendorId: vendorId,
              },
            },
          },
        };
      }

      if (searchTerm?.trim()) {
        const s = searchTerm.trim();
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

        const AND: any[] = [];

        if (dateRegex.test(s)) {
          const start = new Date(s);
          const end = new Date(s);
          end.setUTCHours(23, 59, 59, 999);

          AND.push({
            createdAt: { gte: start, lte: end },
          });
        } else {
          const OR: any[] = [
            {
              products: {
                some: {
                  variant: {
                    product: {
                      title: { contains: s, mode: "insensitive" },
                    },
                  },
                },
              },
            },
            {
              address: {
                streetAddress: { contains: s, mode: "insensitive" },
              },
            },
            {
              id: { contains: s, mode: "insensitive" },
            },
            {
              orderNumber: { contains: s, mode: "insensitive" },
            },
            {
              user: {
                OR: [
                  { firstName: { contains: s, mode: "insensitive" } },
                  { lastName: { contains: s, mode: "insensitive" } },
                  { officeContactFirstName: { contains: s, mode: 'insensitive' } },
                  { officeContactLastName: { contains: s, mode: 'insensitive' } }
                ],
              },
            },
          ];

          const tokens = s.split(/\s+/).filter(Boolean);
          if (tokens.length >= 2) {
            const first = tokens[0];
            const last = tokens[tokens.length - 1];

            OR.push(
              {
                user: {
                  AND: [
                    { firstName: { contains: first, mode: "insensitive" } },
                    { lastName: { contains: last, mode: "insensitive" } },
                  ],
                },
              },
              {
                user: {
                  AND: [
                    { officeContactFirstName: { contains: first, mode: 'insensitive' } },
                    { officeContactLastName: { contains: last, mode: 'insensitive' } }
                  ],
                },
              },
              {
                user: {
                  AND: [
                    { firstName: { contains: last, mode: "insensitive" } },
                    { lastName: { contains: first, mode: "insensitive" } },
                  ],
                },
              },
              {
                user: {
                  AND: [
                    { officeContactFirstName: { contains: last, mode: 'insensitive' } },
                    { officeContactLastName: { contains: first, mode: 'insensitive' } }
                  ],
                },
              },
            );
          }

          AND.push({ OR });
        }

        if (AND.length > 0) {
          filters.AND = AND;
        }
      }

      if (status) {
        filters.status = status;
      }

      if (status && !filters.status) {
        filters.products.some.status = status;
      }

      const recentOrders = await this.prisma.orders.findMany({
        where: filters,
        orderBy: {
          createdAt: "desc",
        },
        skip: skip,
        take: limit,
        include: {
          user: true,
          products: {
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
              vendor: true,
            },
          },
          returnOrder: true,
          cancelOrder: true,
        },
      });

      const totalOrders = await this.prisma.orders.count({
        where: filters,
      });

      return {
        data: recentOrders,
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders: totalOrders,
      };
    } catch (error) {
      this.logger.error("Error fetching recent orders by vendor", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async getOrdersForAdmin(
    adminId: string,
    page: number,
    limit: number,
    status: string,
    searchTerm: string
  ) {
    try {
      const skip = (page - 1) * limit;
      const admin = await this.prisma.admin.findUnique({
        where: { id: adminId },
        include: {
          vendors: true,
        },
      });

      if (!admin) {
        throw new NotFoundException("This admin has no assigned vendors.");
      }

      const vendorIds = admin.vendors.map((vendor) => vendor.id);

      if (vendorIds.length === 0) {
        // throw new ConflictException("This admin has no assigned vendors.");
        return {
          data: [],
          currentPage: page,
          totalPages: 0,
          totalOrders: 0,
        };
      }

      const filters: any = {
        products: {
          some: {
            vendorId: {
              in: vendorIds,
            },
          },
        },
      };

      if (searchTerm?.trim()) {
        const s = searchTerm.trim();
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

        const AND: any[] = [];

        if (dateRegex.test(s)) {
          const start = new Date(s);
          const end = new Date(s);
          end.setUTCHours(23, 59, 59, 999);

          AND.push({
            createdAt: { gte: start, lte: end },
          });
        } else {
          const OR: any[] = [
            {
              products: {
                some: {
                  variant: {
                    product: {
                      title: { contains: s, mode: "insensitive" },
                    },
                  },
                },
              },
            },
            {
              address: {
                streetAddress: { contains: s, mode: "insensitive" },
              },
            },
            {
              id: { contains: s, mode: "insensitive" },
            },
            {
              orderNumber: { contains: s, mode: "insensitive" },
            },
            {
              user: {
                OR: [
                  { firstName: { contains: s, mode: "insensitive" } },
                  { lastName: { contains: s, mode: "insensitive" } },
                ],
              },
            },
          ];

          const tokens = s.split(/\s+/).filter(Boolean);
          if (tokens.length >= 2) {
            const first = tokens[0];
            const last = tokens[tokens.length - 1];

            OR.push(
              {
                user: {
                  AND: [
                    { firstName: { contains: first, mode: "insensitive" } },
                    { lastName: { contains: last, mode: "insensitive" } },
                  ],
                },
              },
              {
                user: {
                  AND: [
                    { firstName: { contains: last, mode: "insensitive" } },
                    { lastName: { contains: first, mode: "insensitive" } },
                  ],
                },
              }
            );
          }

          AND.push({ OR });
        }

        if (AND.length > 0) {
          filters.AND = AND;
        }
      }

      if (status) {
        filters.status = status;
      }

      if (status && !filters.status) {
        filters.products.some.status = status;
      }

      const orders = await this.prisma.orders.findMany({
        where: filters,
        skip: skip,
        take: limit,
        include: {
          user: true,
          products: {
            where: {
              vendorId: { in: vendorIds }
            },
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
              vendor: true,
            },
          },
          address: true,
          returnOrder: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const totalOrders = await this.prisma.orders.count({
        where: filters,
      });

      return {
        data: orders,
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders: totalOrders,
      };
    } catch (error) {
      this.logger.error("Error fetching vendor orders by admin", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async createReturnOrder(
    orderId: string,
    createReturnOrderDto: CreateReturnOrderDto
  ) {
    try {
      const { trackingNo, deliverFrom, variants } = createReturnOrderDto;

      return await this.prisma.$transaction(async (prisma) => {

        const orderPromotions = await prisma.orderPromotion.findMany({
          where: { orderId },
          include: { promotion: true }
        });
        const promotedVariants = new Set<string>();
        for (const promotion of orderPromotions) {
          if (promotion.promotion.vendorId) {
            const promotedItems = await prisma.orderItems.findMany({
              where: {
                orderId,
                vendorId: promotion.promotion.vendorId
              }
            });
            promotedItems.forEach(item => promotedVariants.add(item.variantId));
          } else {
            const promotedItems = await prisma.orderItems.findMany({
              where: { orderId }
            });
            promotedItems.forEach(item => promotedVariants.add(item.variantId));
          }
        }

        for (const item of variants) {
          if (promotedVariants.has(item.variantId)) {
            const product = await prisma.productVariant.findUnique({
              where: { id: item.variantId },
              select: { product: { select: { title: true } } },
            });
            const productName = product?.product?.title;
            throw new BadRequestException(
              `You can't return "${productName}" because it was purchased with a promotion.`
            );
          }
        }

        let returnOrder = await prisma.returnOrder.findFirst({
          where: { orderId },
        });
        if (!returnOrder) {
          returnOrder = await prisma.returnOrder.create({
            data: {
              orderId,
              trackingNo,
              deliverFrom,
            },
            include: {
              order: true
            }
          });
        }
        for (const item of variants) {
          const variantExists = await prisma.productVariant.findUnique({
            where: { id: item.variantId },
          });

          if (!variantExists) {
            throw new Error(`Variant with ID ${item.variantId} does not exist.`);
          }
          const existingReturnVariant = await prisma.returnOrderVariant.findFirst({
            where: {
              returnOrderId: returnOrder.id,
              variantId: item.variantId,
            },
          });
          if (existingReturnVariant) {
            const product = await this.prisma.productVariant.findUnique({
              where: { id: item.variantId },
              select: { product: { select: { title: true } } },
            })
            const productName = product?.product?.title;
            throw new BadRequestException(`You can't return "${productName}" because it is already in return status.`);
          }

          if (!existingReturnVariant) {
            const returnData = await prisma.returnOrderVariant.create({
              data: {
                returnOrderId: returnOrder.id,
                variantId: item.variantId,
                message: item.message,
                reason: item.reason,
              },
              include: {
                returnOrder: true
              }
            });

            await this.queueService.addReturnOrderFinancialsJob(returnData, item, orderId);

            await prisma.orderItems.update({
              where: {
                orderId_variantId: {
                  orderId,
                  variantId: item.variantId,
                },
              },
              data: { status: "RETURNED" },
            });
          }
        }

        const remainingItems = await prisma.orderItems.findMany({
          where: {
            orderId,
            status: { not: "RETURNED" },
          },
        });
        if (remainingItems.length === 0) {
          await prisma.orders.update({
            where: { id: orderId },
            data: { status: "RETURNED" },
          });
        }

        const order = await this.prisma.orders.findUnique({
          where: { id: orderId },
          include: {
            user: true,
            products: {
              where: { variantId: { in: variants.map(v => v.variantId) } },
              include: {
                variant: {
                  include: {
                    product: true,
                  },
                },
                vendor: true,
              },
            },
          },
        });

        this.eventEmitter.emit('order.returned', { order });

        return returnOrder;
      });

    } catch (error) {
      this.logger.error("Error while creating returned order", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async handleReturnFinancials(returnData: any, item: any, orderId: string) {
    const orderData = await this.prisma.orders.findUnique({
      where: { id: returnData.returnOrder.orderId },
      include: {
        user: true,
        products: {
          where: { variantId: item.variantId },
          include: {
            variant: {
              include: {
                product: true,
              },
            },
            vendor: true,
          },
        }
      }
    })

    let productSnapshots: any[] = [];
    orderData.products.forEach((product: any) => {
      if (Array.isArray(product?.productSnapshot)) {
        productSnapshots.push(...product.productSnapshot);
      } else if (product?.productSnapshot) {
        productSnapshots.push(product.productSnapshot);
      }
    });
    let total = productSnapshots.reduce((sum, item) => {
      const discountedPrice = item.variant.discountedPrice ?? 0;
      const quantity = item.quantity ?? 0;
      return sum + discountedPrice * quantity;
    }, 0);

    const totalQuantity = productSnapshots.reduce((sum, item) => {
      return sum + (item.quantity || 0);
    }, 0);

    const allOrder = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        products: true
      }
    })

    let shippingCost: any = [];
    if (typeof orderData?.deliveryOptions === 'string') {
      shippingCost = JSON.parse(orderData.deliveryOptions);
    } else if (Array.isArray(orderData?.deliveryOptions)) {
      shippingCost = orderData.deliveryOptions;
    }

    let itemShippingInfo = null;
    let isFlatRateItem = false;
    let flatRateAmount = 0;
    let flatShippingCost = 0;

    for (const vendorOption of shippingCost) {
      for (const method of vendorOption.options) {
        const flatItems = method.items.filter(i => i.flatRate);
        if (flatItems.length > 0) {
          flatShippingCost += method.shippingCost;
        }
        const foundItem = method.items.find(i => i.variantId === item.variantId);
        if (foundItem) {
          itemShippingInfo = {
            shippingMethod: method.shippingMethod,
            shippingCost: method.shippingCost,
            totalItemsInMethod: method.items.length,
            flatRate: foundItem.flatRate
          };

          if (foundItem.flatRate) {
            isFlatRateItem = true;
            flatRateAmount = foundItem.flatRate;
          }
          break;
        }
      }
      if (itemShippingInfo) break;
    }

    const vendorId = orderData.products[0].vendorId;
    const vendorProductCount = allOrder.products.filter(p => p.vendorId === vendorId).reduce((acc, p) => acc + (p.quantity || 0), 0);

    const vendorDeliveryCost = shippingCost.find((data: any) => data.vendorId === vendorId);
    const shippingCostSpecificVendor = vendorDeliveryCost?.totalShippingCost;
    let getShippingForReturn = shippingCostSpecificVendor / vendorProductCount;

    let shippingRefund = 0;

    if (isFlatRateItem) {
      shippingRefund = flatRateAmount;
    } else if (itemShippingInfo?.shippingMethod === 'FLAT') {
      shippingRefund = itemShippingInfo.shippingCost / itemShippingInfo.totalItemsInMethod;
    }

    let userShippingRefund = 0;
    if (isFlatRateItem) {
      userShippingRefund = shippingRefund;
    } else if (!isFlatRateItem) {
      const final = orderData?.shippingTax - flatShippingCost;
      userShippingRefund = final / vendorProductCount;
    }

    const getTaxForReturn = orderData.tax / vendorProductCount * totalQuantity;
    const totalAmount = total + userShippingRefund + getTaxForReturn;
    const funcAmount = await this.truncateToTwoDecimals(totalAmount);
    const amountInCentsForPlatform = Math.round(funcAmount * 100);

    let vendorReturnPayment = total + userShippingRefund;
    await this.truncateToTwoDecimals(vendorReturnPayment);

    const vendorTransfer = await this.prisma.vendorTransfers.findUnique({
      where: { vendorId_orderId: { vendorId, orderId } }
    })

    if (!vendorTransfer) {
      this.logger.warn(`Vendor transfer for order ${orderId} not found, skipping payment reversal`);
      return;
    }

    if (vendorTransfer.status === "PENDING") {
      await this.prisma.vendorTransfers.update({
        where: { id: vendorTransfer.id, vendorId: vendorTransfer.vendorId },
        data: {
          status: "REVERSED",
          transactionType: "RETURNED"
        }
      })
    } else {
      const vendor = await this.getVendorById(vendorTransfer?.vendorId);
      try {

        await this.stripeService.reverseTransfer(vendorTransfer.transferId, vendorReturnPayment);

        await this.prisma.vendorTransfers.update({
          where: { id: vendorTransfer.id, vendorId },
          data: { transactionType: "RETURNED", status: "REVERSED" }
        });

        await this.emailService.sendEmail(
          vendor.email,
          "Payment Reversed",
          `Dear ${vendor.firstName} ${vendor.lastName},
          We would like to inform you that a payment of **$${total}** has been reversed in connection with a recent return order.
          **Product Price:** $${total}  
          **Shipping Cost:** $${getShippingForReturn}  
          Please note that this amount will be reflected in your account, and any pending balances may be adjusted accordingly.
          If you have any questions or need further clarification, feel free to reach out to us at any time. We’re here to help.
          Thank you for your continued partnership with Dentistry99.`
        )
      } catch (error) {
        await this.prisma.vendorDebts.findUnique({
          where: {
            vendorId_orderId_unique: {
              vendorId,
              orderId,
            },
          },
        });

        await this.prisma.vendorDebts.upsert({
          where: {
            vendorId_orderId_unique: {
              vendorId,
              orderId,
            },
          },
          update: {
            amount: {
              increment: vendorReturnPayment,
            },
            status: 'PENDING',
          },
          create: {
            vendorId,
            orderId,
            amount: vendorReturnPayment,
            status: 'PENDING',
          },
        });

        await this.prisma.vendorTransfers.update({
          where: { id: vendorTransfer.id },
          data: {
            transactionType: 'RETURN_PENDING',
            status: 'INSUFFICIENT_FUNDS',
          },
        });

        await this.emailService.sendEmail(
          vendor.email,
          'Insufficient Payment for Return Order',
          `Dear ${vendor.firstName} ${vendor.lastName},
          We attempted to process a payment related to a returned order but were unable to complete it due to insufficient funds in your current balance.
          **Product Price:** $${vendorReturnPayment}  
          **Shipping Cost:** $${getShippingForReturn}  
          **Remaining Amount to be Deducted:** $${vendorReturnPayment + getShippingForReturn}
          The pending amount will be automatically deducted from your future order earnings.
          If you have any questions or concerns, please don't hesitate to reach out to us.`
        );
        this.logger.log('Vendor payment will be deducted from future earnings');
      }
    }

    try {
      await this.stripeService.createRefund(
        amountInCentsForPlatform,
        orderData.stripePaymentIntentId,
        returnData.reason
      )
      await this.emailService.sendEmail(
        orderData.user.email,
        "Payment Refunded",
        `Dear ${orderData.user.firstName} ${orderData.user.lastName} your payment of 
        $${totalAmount.toFixed(2)} has been reversed for the return order. 
        Thank you for your understanding.
        If you have any questions, please contact us at at Dentistry99`
      );
    } catch (error) {
      this.logger.log("Error in refund for return order", error?.message);
    }

  }

  private async truncateToTwoDecimals(num: number): Promise<number> {
    return Math.floor(num * 100) / 100;
  }

  async findReturnOrderByOrderId(orderId: string, trackingId: string) {
    try {
      const specificReturnOrder = await this.prisma.returnOrder.findUnique({
        where: {
          orderId: orderId,
        },
        include: {
          order: true,
          variants: {
            select: {
              variant: true,
            },
          },
        },
      });
      if (!specificReturnOrder) {
        throw new NotFoundException("Return Order does not found!");
      }
      return {
        data: specificReturnOrder,
      };
    } catch (error) {
      this.logger.error("Error while getting all return order", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async cancelOrder(
    userId: string,
    orderId: string,
    createReturnOrderDto: CreateCancelOrderDto
  ) {
    try {
      const order = await this.prisma.orders.findUnique({
        where: {
          id: orderId,
          userId,
        },
        include: {
          products: {
            include: {
              variant: {
                include: {
                  product: true
                }
              }
            }
          },
          address: true,
          user: true
        },
      });

      if (!order) {
        throw new NotFoundException(`Order with ID ${orderId} not found.`);
      }

      const nonCancellableStatus = ["SHIPPED", "DELIVERED", "RETURNED"];
      const nonCancellableItem = order.products.find((product) =>
        nonCancellableStatus.includes(product.status)
      );

      if (nonCancellableItem) {
        throw new ConflictException(
          `Order with ID ${orderId} contains items that cannot be canceled.`
        );
      }

      let message = '';
      if (!order.stripePaymentIntentId) {
        throw new BadRequestException("No Stripe Payment Intent associated with this order.");
      }
      const checkPaymentIntent = await this.stripeService.getPaymentIntent(order?.stripePaymentIntentId);

      const vendorTransfers = await this.prisma.vendorTransfers.findMany({
        where: { orderId }
      });

      if (vendorTransfers.length > 0) {
        for (const transfer of vendorTransfers) {
          const vendor = await this.getVendorById(transfer.vendorId);
          if (transfer.status === "PENDING") {
            await this.prisma.vendorTransfers.update({
              where: { id: transfer.id, vendorId: vendor?.id },
              data: {
                status: "REVERSED",
                transactionType: "REFUND"
              }
            })
          } else {
            const amounntForRevere = await this.stripeService.transferDetails(transfer?.transferId);
            const totalDeducted = (amounntForRevere.amount / 100);
            try {

              const reverseTransfer = await this.stripeService.reverseTransfer(transfer.transferId);
              const amountInDollars = (reverseTransfer.amount / 100);
              const remainingDebt = totalDeducted - amountInDollars;

              if (amountInDollars < totalDeducted) {
                await this.prisma.vendorDebts.create({
                  data: {
                    vendorId: vendor.id,
                    orderId,
                    amount: remainingDebt,
                    status: "PENDING"
                  }
                })

                await this.prisma.vendorTransfers.update({
                  where: { id: transfer.id, },
                  data: { transactionType: "REFUND_PENDING", status: "INSUFFICIENT_FUNDS" }
                });

              } else {
                await this.prisma.vendorTransfers.update({
                  where: { id: transfer.id, },
                  data: { transactionType: "REFUND", status: "REVERSED" }
                });

                await this.emailService.sendEmail(
                  order.user.email,
                  "Payment Reversed",
                  getRevereseEmailTemplateForVendor(order, vendor, amountInDollars)
                );
              }

            } catch (error) {
              if (error.code === 'balance_insufficient') {
                await this.handleInsufficientFunds(transfer, order.id, totalDeducted);
                await this.emailService.sendEmail(
                  vendor.email,
                  "Insufficient Payment for cancel Order",
                  `Dear ${vendor.firstName} ${vendor.lastName} your payment will be deducted from future orders earnings`
                )
                this.logger.log('Vendor payment will be deducted from future earnings');
              } else {
                this.logger.log("error", error);
                throw error;
              }
            }
          }
        }
      }

      if (checkPaymentIntent?.status === "succeeded") {
        try {
          const refund = await this.stripeService.createRefund(
            checkPaymentIntent.amount,
            order?.stripePaymentIntentId,
            createReturnOrderDto.reason
          );

          if (!refund) {
            throw new BadRequestException("Refund creation failed");
          }

          let getReverseAmount = refund.amount;
          const amountInDollars = (getReverseAmount / 100).toFixed(2);

          const refundDetails = await this.stripeService.getRefund(refund.id);
          if (refundDetails?.destination_details?.card?.type === 'reversal') {

            await this.emailService.sendEmail(
              order.user.email,
              "Payment Refunded",
              getReversalEmailTemplate(order, amountInDollars)
            )
            message = 'the payment has been reversed successfully.';

          } else {

            await this.emailService.sendEmail(
              order.user.email,
              "Payment Refunded",
              getRefundEmailTemplate(order, getReverseAmount)
            )
            message = 'the payment has been refunded successfully.';

          }
        } catch (error) {
          console.error('Refund error:', error);
          throw new ConflictException('Refund failed. Please contact support.');
        }
      } else if (["requires_capture", "requires_payment_method", "requires_confirmation", "processing"].includes(checkPaymentIntent.status)) {
        try {
          const cancelPaymentIntent = await this.stripeService.cancelPaymentIntent(order?.stripePaymentIntentId);
          if (!cancelPaymentIntent) {
            throw new BadRequestException("Payment cancellation failed.");
          }

          await this.emailService.sendEmail(
            order.user.email,
            "Payment Canceled",
            getCancelEmailTemplate(order)
          )
          message = 'the payment has been canceled.'
        } catch (error) {
          console.error('Payment cancellation error:', error);
          throw new BadRequestException('Payment cancellation failed. Please contact support.');
        }
      } else {
        throw new BadRequestException("Payment Intent is in an invalid state for cancelation or refund");
      }

      const cancelOrder = await this.prisma.cancelOrder.create({
        data: {
          orderId: orderId,
          message: createReturnOrderDto.message,
          reason: createReturnOrderDto.reason,
          cancelStatus: "CANCELED",
          variants: {
            create: createReturnOrderDto.variants.map((variant) => ({
              variantId: variant.variantId,
            })),
          },
        },
        include: {
          order: {
            include: {
              products: true,
              user: true,
            }
          },
        }
      });

      for (const product of order.products) {
        await this.prisma.orderItems.update({
          where: {
            orderId_variantId: {
              orderId: product.orderId,
              variantId: product.variantId,
            },
          },
          data: { status: "CANCELED" },
        });
      }

      const updatedOrderItems = await this.prisma.orderItems.findMany({
        where: {
          orderId,
        },
      });

      let cancelProductCount = 0;
      for (const items of updatedOrderItems) {
        if (items.status === "CANCELED") {
          cancelProductCount++;
        }
      }

      if (cancelProductCount === updatedOrderItems.length) {
        await this.prisma.orders.update({
          where: { id: orderId },
          data: { isCanceled: true, status: "CANCELED" },
        });
      }

      const orderData = cancelOrder.order;
      this.eventEmitter.emit('order.cancelled', { orderData });

      return {
        message: `Order has been canceled successfully and ${message}`,
        data: cancelOrder,
      };
    } catch (error) {
      this.logger.error(`Cancel Order Failed: ${error.message}`, error.stack);
      throw new BadRequestException("An unexpected error occurred. Please try again.");
    }
  }

  private async getVendorById(vendorId: string) {
    const vendor = await this.prisma.vendors.findUnique({
      where: { id: vendorId },
      include: { connectAccount: true },
    });

    if (!vendor || !vendor.delieryId) {
      throw new BadRequestException(`Vendor ${vendorId} is missing delivery ID or not found.`);
    }

    return vendor;
  }

  private async handleInsufficientFunds(transfer: any, orderId: string, totalDeducted: any) {
    await this.prisma.$transaction([
      this.prisma.vendorDebts.create({
        data: {
          vendorId: transfer.vendorId,
          orderId,
          amount: totalDeducted,
          status: "PENDING",
        }
      }),
      this.prisma.vendorTransfers.update({
        where: { id: transfer.id },
        data: {
          transactionType: "REFUND_PENDING",
          status: "INSUFFICIENT_FUNDS"
        }
      })
    ]);
  }

  async handleVendorTransfer(orderId: string, vendorId: string, status: string) {
    try {
      const vendor = await this.getVendorById(vendorId);

      const commission = await this.prisma.commission.findUnique({
        where: { vendorId },
        select: {
          payOnStatus: true,
          calculationMethod: true,
          commissionPercentage: true
        }
      });

      if (!commission) {
        throw new NotFoundException(`Commission configuration not found for vendor ${vendorId}`);
      }

      if (commission.payOnStatus !== status) {
        this.logger.log(`Status ${status} does not match commission payOnStatus ${commission.payOnStatus}`);
        return;
      }

      const existingTransfer = await this.prisma.vendorTransfers.findFirst({
        where: {
          orderId,
          vendorId,
          transactionType: "SALE",
          status: "COMPLETED"
        }
      });

      if (existingTransfer) {
        this.logger.log(`Transfer already exists for order ${orderId} and vendor ${vendorId}`);
        return;
      }

      const order = await this.prisma.orders.findUnique({
        where: { id: orderId },
        include: {
          products: {
            where: { vendorId },
            include: {
              variant: {
                include: {
                  product: true
                }
              },
            }
          },
        }
      });

      if (!order) {
        throw new NotFoundException(`Order with ID ${orderId} not found`);
      }
      if (!order.products.length) {
        throw new BadRequestException(`No products found for vendor ${vendorId} in order ${orderId}`);
      }

      const vendors = await this.prisma.orderItems.groupBy({
        by: ['vendorId'],
        where: {
          orderId: orderId,
        },
      });

      let productSnapshots: any[] = [];
      order.products.forEach((product: any) => {
        if (Array.isArray(product?.productSnapshot)) {
          productSnapshots.push(...product.productSnapshot);
        } else if (product?.productSnapshot) {
          productSnapshots.push(product.productSnapshot);
        }
      });

      if (!productSnapshots.length) {
        throw new BadRequestException(`No valid product snapshots found for order ${orderId}`);
      }

      let subtotal = 0;
      for (const item of productSnapshots) {
        let quantity: number = 0;
        if (item.freeQuantity > 0) {
          quantity = item.quantity - item.freeQuantity;
        } else {
          quantity = item.quantity;
        }
        subtotal += (item.variant.discountedPrice) * quantity;
      }

      let shippingCost: any = [];
      try {
        if (typeof order?.deliveryOptions === 'string') {
          shippingCost = JSON.parse(order.deliveryOptions);
        } else if (Array.isArray(order?.deliveryOptions)) {
          shippingCost = order.deliveryOptions;
        }
      } catch (error) {
        this.logger.error(`Error parsing delivery options for order ${orderId}:`, error);
        shippingCost = [];
      }

      const vendorDeliveryCost = shippingCost.find((data: any) => data.vendorId === vendorId);
      let flatRat: any = 0;
      const flatRateShippingData = vendorDeliveryCost?.options?.find((option: any) => option.shippingMethod === 'FLAT');
      if (flatRateShippingData) {
        const flatItems = flatRateShippingData.items.filter((item: any) => item.flatRate);
        if (flatItems.length > 0) {
          const totalFlatRate = flatItems.reduce((sum: number, item: any) => sum + item.flatRate, 0);
          flatRat = totalFlatRate;
        }
      }

      const shippingCostSpecificVendor = vendorDeliveryCost?.totalShippingCost;
      const vendorBearShippingCharges = vendorDeliveryCost?.vendorBear || 0;
      let shipping = Number(shippingCostSpecificVendor);

      let discount = [];
      if (typeof order?.promotionDiscount === 'string') {
        try {
          discount = JSON.parse(order.promotionDiscount);
        } catch (err) {
          console.error("Invalid JSON in promotionDiscount", err);
          discount = [];
        }
      } else if (Array.isArray(order?.promotionDiscount)) {
        discount = order.promotionDiscount;
      }

      const vendorFreeShippingDiscount = discount.find(
        (data) =>
          data.vendorId === vendorId &&
          data.promotionType === 'FREE_SHIPPING'
      );
      const vendorOtherPromotionDiscount = discount.find(
        (data) =>
          data.vendorId === vendorId &&
          data.promotionType !== 'FREE_SHIPPING' &&
          data.promotionType !== 'BUY_X_GET_Y'
      );

      let vendorPromotionDiscount: any = 0;

      if (vendorFreeShippingDiscount?.discount > 0) {
        vendorPromotionDiscount = vendorFreeShippingDiscount?.discount || 0;
      } else if (vendorOtherPromotionDiscount?.discount > 0) {
        vendorPromotionDiscount = vendorOtherPromotionDiscount?.discount || 0;
      }

      const tax = order?.tax;

      let commissionAmount = 0;
      if (commission.calculationMethod === 'WHOLE_ORDER') {
        commissionAmount = (order.price * commission.commissionPercentage) / 100;
      } else {
        commissionAmount = (subtotal * commission.commissionPercentage) / 100;
      }

      const vendorTotal = subtotal - commissionAmount;
      const hasActiveTransfers = await this.retryCapabilityCheck(
        vendor.delieryId,
        "transfers",
        5,
        5000
      );

      if (!hasActiveTransfers) {
        throw new Error(`Transfers capability not enabled for vendor ${vendor.id}`);
      }

      const amountInCents = Math.round((subtotal - commissionAmount - vendorPromotionDiscount - vendorBearShippingCharges + flatRat) * 100);
      if (amountInCents <= 0) {
        throw new BadRequestException(`Invalid transfer amount: ${amountInCents} cents`);
      }

      const stripeFee = await this.stripeService.getStripeFee(order?.stripePaymentIntentId);

      const availableBalance = await this.stripeService.getPlatformBalance();

      if (availableBalance?.available < amountInCents) {
        await this.prisma.vendorTransfers.create({
          data: {
            transferId: null,
            order: {
              connect: { id: orderId },
            },
            vendor: {
              connect: { id: vendorId },
            },
            transactionType: "SALE",
            saleItemPrice: subtotal,
            tax: tax,
            shippingCost: shipping,
            total: subtotal + tax + shipping,
            vendorSalePriceAfterCommission: subtotal - commissionAmount,
            vendorTax: 0,
            vendorShipping: 0,
            vendorTotal: vendorTotal,
            platformCommission: commissionAmount,
            platformTax: tax,
            platformShipping: shipping,
            platformStripeFee: stripeFee?.breakdown?.stripeFee ?? 0,
            platformTotal: tax + shipping + commissionAmount + stripeFee?.breakdown?.stripeFee,
            shipment: commission?.payOnStatus,
            status: "PENDING",
            pendingAmount: amountInCents
          }
        });
      } else {
        const vendorPaymentTransfer = await this.stripeService.createTransfer(
          amountInCents,
          "usd",
          vendor.delieryId
        );
        if (!vendorPaymentTransfer?.id) {
          throw new BadRequestException('Failed to create Stripe transfer');
        }

        await this.prisma.vendorTransfers.create({
          data: {
            transferId: vendorPaymentTransfer.id,
            order: {
              connect: { id: orderId },
            },
            vendor: {
              connect: { id: vendorId },
            },
            transactionType: "SALE",
            saleItemPrice: subtotal,
            tax: tax,
            shippingCost: shipping,
            total: subtotal + tax + shipping,
            vendorSalePriceAfterCommission: subtotal - commissionAmount,
            vendorTax: 0,
            vendorShipping: 0,
            vendorTotal: vendorTotal,
            platformCommission: commissionAmount,
            platformTax: tax,
            platformShipping: shipping,
            platformStripeFee: stripeFee?.breakdown?.stripeFee ?? 0,
            platformTotal: tax + shipping + commissionAmount + stripeFee?.breakdown?.stripeFee,
            shipment: commission?.payOnStatus,
            status: "COMPLETED",
            pendingAmount: 0,
          }
        });
      }

      await this.queueService.addPendingPlatformTransfers(vendorId, vendor.delieryId);

    } catch (error) {
      this.logger.error(`Error in handleVendorTransfer for order ${orderId} and vendor ${vendorId}:`, error);

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new Error(`Failed to process vendor transfer: ${error.message}`);
    }
  }

  async processPendingVendorRefunds(vendorId: string, deliveryId: string) {
    const pendingPlatformTransfers = await this.prisma.vendorTransfers.findMany({
      where: {
        status: "PENDING",
        transactionType: "SALE"
      },
      include: {
        vendor: true
      }
    })
    if (pendingPlatformTransfers?.length > 0) {
      const platformBalance = await this.stripeService.getPlatformBalance();
      for (const transfer of pendingPlatformTransfers) {
        if (platformBalance?.available > transfer?.pendingAmount) {
          const vendorPaymentTransfer = await this.stripeService.createTransfer(
            transfer?.pendingAmount,
            "usd",
            transfer?.vendor.delieryId
          );

          await this.prisma.vendorTransfers.update({
            where: { id: transfer.id, vendorId: transfer.vendorId },
            data: {
              transferId: vendorPaymentTransfer.id,
              status: "COMPLETED"
            }
          })
        }
      }
    }

    const vendor = await this.prisma.vendors.findUnique({
      where: { id: vendorId },
    })

    const availableSaleTransfers = await this.prisma.vendorTransfers.findMany({
      where: { vendorId, transactionType: "SALE", status: "COMPLETED" },
      orderBy: { createdAt: "desc" }
    })

    const pendingTransfers = await this.prisma.vendorTransfers.findMany({
      where: {
        vendorId,
        transactionType: { in: ['REFUND_PENDING', 'RETURN_PENDING'] },
        status: 'INSUFFICIENT_FUNDS',
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!pendingTransfers.length) return;

    const stripeBalance = await this.stripeService.getConnectAccountBalance(deliveryId);
    let availableBalance = stripeBalance.available[0]?.amount ?? 0;

    for (const transfer of pendingTransfers) {
      if (availableBalance <= 0) break;

      let debt = await this.prisma.vendorDebts.findUnique({
        where: {
          vendorId_orderId_unique: {
            vendorId,
            orderId: transfer.orderId,
          },
          status: 'PENDING',
        },
      });

      if (!debt) continue;

      const amountToReverse = debt?.amount;

      if (amountToReverse <= 0) continue;

      const reverseTransferDetails = await this.stripeService.transferDetails(transfer?.transferId);
      const totalReversed = reverseTransferDetails.reversals?.data?.reduce((sum, reversal) => {
        return sum + (reversal.amount ?? 0);
      }, 0) ?? 0;

      const totalAmount = reverseTransferDetails.amount ?? 0;

      const availableAmountToReverse = totalAmount - totalReversed;

      if (availableAmountToReverse <= 0) {

        for (const saleTransfer of availableSaleTransfers) {

          const reverseTransferDetails = await this.stripeService.transferDetails(saleTransfer?.transferId);
          const totalReversed = reverseTransferDetails.reversals?.data?.reduce((sum, reversal) => {
            return sum + (reversal.amount ?? 0);
          }, 0) ?? 0;

          const totalAmount = reverseTransferDetails.amount ?? 0;
          const availableAmountToReverse = totalAmount - totalReversed;
          const amountToInDollar = await this.truncateToTwoDecimals(availableAmountToReverse / 100);
          let amount = Math.min(amountToInDollar, debt?.amount);
          if (amount === 0) continue;

          try {
            const reversed = await this.stripeService.reverseTransfer(saleTransfer.transferId, amount);

            await this.updateRecordsAfterReversal(vendor, transfer, debt, amount)
            availableBalance -= amountToReverse;
            debt.amount -= amount;
            if (debt.amount <= 0) break;

          } catch (err) {
            this.logger.error(
              `Failed to reverse from original transfer for order ${transfer.orderId}`,
              err
            );
          }
        }
      } else {
        const amountToInDollar = await this.truncateToTwoDecimals(availableAmountToReverse / 100);
        let amount = Math.min(amountToInDollar, debt?.amount);
        try {
          if (amount === 0) continue;
          const reversed = await this.stripeService.reverseTransfer(transfer.transferId, amount);

          await this.updateRecordsAfterReversal(vendor, transfer, debt, amount)

          availableBalance -= amountToReverse;

        } catch (err) {
          this.logger.error(
            `❌ Failed to reverse ${transfer.transactionType} for vendor ${vendorId}, order ${transfer.orderId}`,
            err
          );
        }
      }
    }
  }

  private async updateRecordsAfterReversal(
    vendor: any,
    transfer: any,
    debt: any,
    amount: number
  ) {
    const remainingDebt = debt.amount - amount;

    const finalTransactionType =
      transfer.transactionType === 'REFUND_PENDING' ? 'REFUND' : 'RETURNED';
    const updatedTransactionType =
      remainingDebt === 0 ? finalTransactionType : transfer.transactionType;

    const updatedStatus = remainingDebt === 0 ? 'REVERSED' : 'INSUFFICIENT_FUNDS';

    await this.prisma.vendorDebts.update({
      where: {
        vendorId_orderId_unique: {
          vendorId: debt?.vendorId,
          orderId: debt.orderId,
        },
      },
      data: {
        amount: remainingDebt,
        status: remainingDebt === 0 ? 'DEDUCTED' : 'PENDING',
      },
    });

    await this.prisma.vendorTransfers.update({
      where: {
        vendorId_orderId: {
          vendorId: debt.vendorId, orderId: debt.orderId
        }
      },
      data: {
        transactionType: updatedTransactionType,
        status: updatedStatus,
      },
    });

    await this.emailService.sendEmail(
      vendor.email,
      'Refund / Return Processed',
      `Dear Vendor, $${amount} has been reversed against order ${transfer.orderId}. Remaining debt: $${remainingDebt}.`
    );

    this.logger.log(
      `Processed $${amount} for ${transfer.transactionType} of vendor ${debt.vendorId}, order ${transfer.orderId}`
    );
  }

}
