import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { CreateAutoOrderDto } from "./dto/create-auto-order.dto";
import { UpdateAutoOrderDto } from "./dto/update-auto-order.dto";
import { PrismaService } from "src/prisma/prisma.service";
import {
  exceptionHandler,
  handlePrismaError,
} from "src/utils/error-handler.util";
import { StripeService } from "src/payment/payment.service";
import * as cron from "node-cron";
import { Cron } from "@nestjs/schedule";
import { getOrderEmailTemplateForUser, getOrderEmailTemplateForVendor } from "src/utils/vendorEmailTemplates";
import { DateTime } from "luxon"
import { QueueService } from "src/redis/queue.service";

@Injectable()
export class AutoOrderService {
  private readonly logger: Logger = new Logger(AutoOrderService.name);
  private cronJobs: { [key: string]: cron.ScheduledTask } = {};
  constructor(
    private prismaService: PrismaService,
    private stripeService: StripeService,
    private queueService: QueueService
  ) {}
  async createAutoOrder(
    userId: string,
    createAutoOrderDto: CreateAutoOrderDto
  ) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
        select: {
          stripeCustomerId: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });
      if (!user) {
        throw new ConflictException("User  does not exist");
      }

      const productVariant = await this.prismaService.productVariant.findUnique(
        {
          where: { id: createAutoOrderDto.variantId },
          include: { product: true },
        }
      );
      if (!productVariant) {
        throw new NotFoundException("Product variant does not exist!");
      }

      if (productVariant.quantity <= 0) {
        throw new ConflictException(
          `${productVariant.product.title} is out of stock.`
        );
      } else if (productVariant.quantity < createAutoOrderDto.quantity) {
        throw new ConflictException(
          `Only ${productVariant.quantity} units of ${productVariant.product.title} are available.`
        );
      }

      const existingAutoOrder = await this.prismaService.autoOrder.findMany({
        where: {
          userId,
          autoOrderFrequency: createAutoOrderDto.autoOrderFrequency,
          autoOrderFrequencyTime: createAutoOrderDto.autoOrderFrequencyTime,
          variantId: createAutoOrderDto.variantId,
        },
        include: {
          user: true,
          variant: {
            include: {
              product: true,
            },
          },
        },
      });
      if (existingAutoOrder.length > 0) {
        throw new ConflictException(
          `An auto order for ${productVariant.product.title} is already scheduled with the same frequency.`
        );
      }
      const normalizeDate = (date: Date): number => {
        return new Date(date.setHours(0, 0, 0, 0)).getTime();
      };
      const startDate = new Date(createAutoOrderDto?.startDate);
      const currentDate = new Date();
      if (isNaN(startDate.getTime())) {
        throw new BadRequestException("Invalid start date format.");
      }
      if (normalizeDate(startDate) <= normalizeDate(currentDate)) {
        throw new ConflictException("Start date should be greater than today's date.");
      }
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await this.stripeService.createCustomer(
          user.email,
          `${user.firstName} ${user.lastName}`
        );
        stripeCustomerId = customer.id;
        await this.prismaService.user.update({
          where: { id: userId },
          data: { stripeCustomerId: stripeCustomerId },
        });
      }
      await this.stripeService.attachPaymentMethodToCustomer(
        createAutoOrderDto.paymentMethodId,
        stripeCustomerId
      );

      const order = await this.prismaService.autoOrder.create({
        data: {
          userId,
          addressId: createAutoOrderDto?.addressId,
          licenseId: createAutoOrderDto?.licenseId,
          variantId: createAutoOrderDto?.variantId,
          paymentMethodId: createAutoOrderDto?.paymentMethodId,
          autoOrderFrequency: createAutoOrderDto?.autoOrderFrequency,
          autoOrderFrequencyTime: createAutoOrderDto?.autoOrderFrequencyTime,
          startDate: createAutoOrderDto?.startDate,
        },
      });

      await this.prismaService.autoOrderItems.create({
        data: {
          autoOrderId: order.id,
          quantity: createAutoOrderDto.quantity,
        },
      });

      return {
        message: "Auto Order has been placed successfully!",
        data: order,
      };
    } catch (error) {
      this.logger.error("Error while auto order", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async removeAutoOrder(userId: string, autoOrderId: string) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new NotFoundException("User does not exist");
      }
      const existAutoOrder = await this.prismaService.autoOrder.findUnique({
        where: { id: autoOrderId },
        select: {
          startDate: true,
        },
      });
      if (!existAutoOrder) {
        throw new NotFoundException("Auto Order does not exist");
      }
      const normalizeDate = (date: Date) => new Date(date.setHours(0, 0, 0, 0)).getTime();
      const startDate = new Date(existAutoOrder?.startDate);
      const today = new Date();

      if (normalizeDate(startDate) <= normalizeDate(today)) {
        throw new ConflictException(
          "Cannot remove an auto order that has already started."
        );
      }

      await this.prismaService.$transaction([
        this.prismaService.autoOrderItems.deleteMany({
          where: { autoOrderId },
        }),
        this.prismaService.autoOrder.delete({
          where: { id: autoOrderId },
        }),
      ]);
      return {
        message: "Auto Order has been removed successfully!",
      };
    } catch (error) {
      this.logger.error("Error while remove auto order", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async getAutoOrders(userId: string, page: number, limit: number, autoOrderFrequency?: string) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new NotFoundException("User does not exist");
      }
      const skip = (page - 1) * limit;
      const filters: any = { userId };
      if(autoOrderFrequency){
        filters.autoOrderFrequency = autoOrderFrequency;
      }
      const totalOrders = await this.prismaService.autoOrder.count({ where: filters });
      if (totalOrders === 0) {
        return {
          message: "Auto Order fetched successfully!",
          data: [],
          currentPage: page,
          totalPages: 0,
          totalOrders: 0,
        };
      }
      const autoOrders = await this.prismaService.autoOrder.findMany({
        where: filters,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          products: true,
          address: true,
          license: true,
          user: true,
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
      });
      if (!autoOrders) {
        throw new NotFoundException("Auto order not found");
      }
      const paymentMethodResponse = await this.stripeService.getPaymentMethods(user?.stripeCustomerId);
      const paymentMethodMap = new Map(
        paymentMethodResponse.data.map((method) => [method.id, method])
      );
      const autoOrdersWithPaymentMethods = autoOrders.map((order) => ({
        ...order,
        paymentMethod: paymentMethodMap.get(order.paymentMethodId) || null,
      }));
      return {
        message: "Auto Order fetched successfully!",
        data: autoOrdersWithPaymentMethods,
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
      };
    } catch (error) {
      this.logger.error("Error while fetch auto order", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async updateAutoOrder(
    userId: string,
    autoOrderId: string,
    updateAutoOrderDto: UpdateAutoOrderDto
  ) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new NotFoundException("User does not exist");
      }
      const existAutoOrder = await this.prismaService.autoOrder.findUnique({
        where: { id: autoOrderId },
        select: {
          startDate: true,
          variantId: true,
        },
      });
      if (!existAutoOrder) {
        throw new NotFoundException("Auto Order does not exist");
      }
  
      const productVariant = await this.prismaService.productVariant.findUnique({
        where: { id: existAutoOrder.variantId },
        include: { product: true },
      });
      if (!productVariant) {
        throw new NotFoundException("Product variant does not exist!");
      }
      if (productVariant.quantity <= 0) {
        throw new ConflictException(
          `${productVariant.product.title} is out of stock.`
        );
      } else if (productVariant.quantity < updateAutoOrderDto.quantity) {
        throw new ConflictException(
          `Only ${productVariant.quantity} units of ${productVariant.product.title} are available.`
        );
      }
  
      const currentDate = new Date().toDateString();
      const data: any = {};
      if (updateAutoOrderDto?.addressId) data.addressId = updateAutoOrderDto.addressId;
      if (updateAutoOrderDto?.licenseId) data.licenseId = updateAutoOrderDto.licenseId;
      if (updateAutoOrderDto?.paymentMethodId) data.paymentMethodId = updateAutoOrderDto.paymentMethodId;
      if (updateAutoOrderDto?.autoOrderFrequency) data.autoOrderFrequency = updateAutoOrderDto.autoOrderFrequency;
      if (updateAutoOrderDto?.autoOrderFrequencyTime) data.autoOrderFrequencyTime = updateAutoOrderDto.autoOrderFrequencyTime;
      if (updateAutoOrderDto?.startDate) {
        const newStartDate = new Date(updateAutoOrderDto?.startDate).setHours(0, 0, 0, 0);
        const today = new Date().setHours(0, 0, 0, 0);
        if (newStartDate <= today) {
          throw new ConflictException("Start date should be greater than the current date.");
        }
        data.startDate = updateAutoOrderDto.startDate;
      }
      const autoOrder = await this.prismaService.autoOrder.update({
        where: { id: autoOrderId },
        data: data,
      });
  
      if (updateAutoOrderDto?.quantity !== undefined) {
        await this.prismaService.autoOrderItems.updateMany({
          where: { autoOrderId: autoOrderId },
          data: {
            quantity: updateAutoOrderDto.quantity,
          },
        });
      }
      if (this.cronJobs[autoOrderId]) {
        await this.updateAutoOrderCronJob(autoOrder);
      }

      return {
        message: "Auto Order updated successfully!",
        data: autoOrder,
      };
    } catch (error) {
      this.logger.error("Error while update auto order", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }
  private async updateAutoOrderCronJob(autoOrder: any) {
    if (this.cronJobs[autoOrder.id]) {
      this.cronJobs[autoOrder.id].stop();
      delete this.cronJobs[autoOrder.id];
    }
    this.scheduleAutoOrder(autoOrder);
  }

  async createOrder() {
    const serverTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = DateTime.now().setZone(serverTimeZone);
    const formattedDate = now.toFormat("yyyy-MM-dd");

    const existAutoOrder = await this.prismaService.autoOrder.findMany({
      where: {
        startDate: formattedDate
      },
      include: {
        user: true,
        address: true,
        variant: {
          include: {
            product: true,
          },
        },
        products: {
          select: {
            quantity: true,
          },
        },
      },
    });
    if (!existAutoOrder?.length) {
      this.logger.log("No auto orders found for today.");
      return;
    };

    await Promise.all(
      existAutoOrder.map(async (autoOrder) => {
        await this.processOrder(autoOrder);
        this.scheduleAutoOrder(autoOrder);
      })
    );
  }

  private async processOrder(autoOrder: any) {
    const { variant, addressId, licenseId, products } = autoOrder;
    const quantity = products[0]?.quantity;
    const taxRate = await this.stripeService.calculateTax(
      addressId,
      variant?.price
    );
    const paymentProductObject = {};
    paymentProductObject[variant.id] = {
      price: variant?.price,
      vendorId: variant?.product?.vendorId,
      quantity: quantity,
    };
    let userId = autoOrder.userId;
    // Forward billing name/email/address to Stripe for AVS + Radar scoring,
    // mirroring the manual checkout flow — fewer false-positive declines.
    const user = autoOrder?.user;
    const address = autoOrder?.address;
    const billingDetails = {
      name: [user?.firstName, user?.lastName].filter(Boolean).join(' ') || undefined,
      email: user?.email || undefined,
      phone: address?.phone || user?.officePhoneNo || undefined,
      line1: address?.streetAddress || undefined,
      line2: address?.building || undefined,
      city: address?.city || undefined,
      state: address?.state || undefined,
      postalCode: address?.zipCode || undefined,
      country: address?.country || 'US',
    };

    const paymentIntent = await this.stripeService.createPaymentIntent(
      Math.round((variant?.price + taxRate) * 100),
      "usd",
      autoOrder?.user?.stripeCustomerId,
      autoOrder?.paymentMethodId,
      "manual",
      {
        userId,
        detail: JSON.stringify(paymentProductObject.toString()),
      },
      billingDetails
    );
    if (!paymentIntent || !paymentIntent.id) {
      throw new NotFoundException("Payment failed for this order!");
    }
    await this.stripeService.confirmPaymentIntent(paymentIntent.id);

    const order = await this.prismaService.orders.create({
      data: {
        userId,
        addressId: addressId,
        licenseId: licenseId,
        price: variant.price,
        discount: (variant?.discount).toString() ?? "",
        tax: taxRate,
        stripePaymentIntentId: paymentIntent.id,
        trackingNo: "",
        shippingTax: null,
        autoOrderId: autoOrder.id,
      },
    });
    await this.prismaService.orderItems.create({
      data: {
        orderId: order.id,
        variantId: variant.id,
        quantity: quantity,
        status: "PLACED",
        vendorId: variant.product.vendorId,
      },
    });

    await this.prismaService.productVariant.update({
      where: { id: variant.id },
      data: {
        quantity: {
          decrement: quantity,
        },
      },
    });
    await this.prismaService.product.update({
      where: { id: variant.productId },
      data: {
        totalSold: {
          increment: quantity,
        },
      },
    });
    const createdOrder = await this.prismaService.orders.findUnique({
      where: {
        id: order.id,
      },
      include: {
        user: {
          include: {
            address: true,
          },
        },
        products: {
          include: {
            vendor: true,
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
        address: true,
      },
    });

    await Promise.all(
      createdOrder.products.map((orderProduct) => {
        const vendorProducts = createdOrder.products.filter(
          (p) => p.vendor.id === orderProduct.vendor.id
        );
    
        const vendorSpecificOrder = {
          ...createdOrder,
          products: vendorProducts,
        };
    
        return this.queueService.addEmailJob(
          orderProduct.vendor.email,
          "Order Placed Successfully",
          getOrderEmailTemplateForVendor(vendorSpecificOrder, orderProduct.vendor)
        );
      })
    );
    await this.queueService.addEmailJob(
      createdOrder.user.email,
      "Your Order Has Been Placed",
      getOrderEmailTemplateForUser(createdOrder)
    );

    return {
      message: "Order has been placed successfully!",
      data: order,
    };
  }

  private scheduleAutoOrder(autoOrder: any) {
    let executionCount = 1;
    const frequency = autoOrder.autoOrderFrequency;
    const cronSchedule = this.getCronSchedule(frequency);
    const job = cron.schedule(cronSchedule, async () => {
      if (executionCount >= autoOrder.autoOrderFrequencyTime) {
        job.stop();
        return;
      }
      await this.processOrder(autoOrder);
      executionCount++;
    });
    this.cronJobs[autoOrder.id] = job;
  }

  getCronSchedule(frequency: string): string {
    const matchWeeks = frequency.match(/After (\d+) Week?/);
    const matchMonths = frequency.match(/After (\d+) Month?/);
    const matchHours = frequency.match(/After (\d+) Hour?/);
    const matchDays = frequency.match(/After (\d+) Day?/);
    const matchMinutes = frequency.match(/After (\d+) Minute?/);

    if (matchWeeks) {
      const weeks = parseInt(matchWeeks[1]);
      return `0 0 */${weeks * 7} * *`;
    }

    if (matchMonths) {
      const months = parseInt(matchMonths[1]);
      return `0 0 1 */${months} *`;
    }

    if (matchHours) {
      const hours = parseInt(matchHours[1]);
      return `0 */${hours} * * *`;
    }

    if (matchMinutes) {
      const minutes = parseInt(matchMinutes[1]);
      return `*/${minutes} * * * *`;
    }

    if (matchDays) {
      const days = parseInt(matchDays[1]);
      return `0 0 */${days} * *`;
    }

    return "0 0 * * *";
  }

  @Cron('0 * * * *')
  async createOrderCron() {
    const serverTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = DateTime.now().setZone(serverTimeZone);
    if (now.hour === 0) {
      await this.createOrder();
    }
  }
}
