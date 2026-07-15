import { OnEvent } from "@nestjs/event-emitter";
import { NotificationsService } from "../notifications.service";
import { Injectable } from "@nestjs/common";
import { NotificationGateway } from "../notifications.gateway";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class ProductEvents {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationGateway: NotificationGateway,
    private readonly prismaService: PrismaService
  ) {}

  @OnEvent("update.product")
  async handleApproveProductEvent(payload: {
    product: any;
    previousStatus: string;
  }) {
    const { product } = payload;
    let message = "";
    let title = "";
    switch (product.status) {
      case "APPROVE":
        title = "Product Approved";
        message = `Congratulations! Your product ${product.title} has been approved and is now live on the platform`;
        break;
      case "PENDING":
        title = "Product PENDING";
        message = `Your product "${product.title}" is currently under review. You will be notified once it has been approved and goes live on the platform.`;
        break;  
      case "REJECT":
        title = "Product Rejected";
        message = `Your product ${product.title} has been reviewed and unfortunately did not meet our criteria. Please check the feedback and make the necessary changes.¸`;
        break;
      default: 
        return;
    }

    const notification = await this.notificationsService.createNotification({
      title,
      message,
      productId: product.id,
      vendorId: product.vendorId,
      isProduct: true,
    });
    this.notificationGateway.sendToVendor(
      product.vendorId as string,
      "update.product",
      notification
    );
  }

  @OnEvent("product.created")
  async handleProductCreatedEvent(payload: {
    product: any;
  }) {

    const { product } = payload;
    const title = "Product Created";
    const message = `A new product ${product?.title} has been submitted by a vendor and is pending your approval.`;

    const superAdmin = await this.prismaService.superAdmin.findFirst({
      where: { role: "SUPER_ADMIN" }
    })
    if(!product?.id){
      console.warn("this product does't have an product ID");
      return
    }

    const notificationPayload = {
      title,
      message,
      productId: product?.id,
      isProduct: true,
    }
    const [adminNotification, superAdminNotification] = await Promise.all([
      this.notificationsService.createNotification({
      ...notificationPayload,
      adminId: product?.vendor?.admin?.id ?? null,
      }),
      this.notificationsService.createNotification({
      ...notificationPayload,
      superAdminId: superAdmin.id,
      }),
    ]);

    this.notificationGateway.sendToAdmin(
      product.adminId as string || null,
      "product.created",
      adminNotification
    );

    this.notificationGateway.sendToSuperAdmin(
      superAdmin.id as string,
      "product.created",
      superAdminNotification
    );

  }
}
