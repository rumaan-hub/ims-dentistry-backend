import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationGateway } from "./notifications.gateway";

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationGateway))
    private notificationGateway: NotificationGateway
  ) {}

  async createNotification(data: {
    title: string;
    message: string;
    userId?: string;
    vendorId?: string;
    orderId?: string;
    productId?: string;
    isProduct?: boolean;
    isOrder?: boolean;
    isMessage?: boolean;
    chatId?: string;
    adminId?: string;
    superAdminId?: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        userId: data.userId,
        vendorId: data.vendorId,
        orderId: data.orderId,
        productId: data.productId,
        isRead: false,
        isMessage: data.isMessage,
        isProduct: data.isProduct,
        isOrder: data.isOrder,
        chatId: data.chatId,
        adminId: data.adminId,
        superAdminId: data.superAdminId,
      },
      include: {
        user: true,
        vendor: true,
        order: true,
        product: true,
        admin: true,
      },
    });
    return notification;
  }

  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }

  async getVendorNotifications(vendorId: string) {
    return this.prisma.notification.findMany({
      where: {
        vendorId,
        NOT: {
          title: {
            equals: "New Vendor Registration",
            mode: "insensitive",
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }
  async getAdminNotifications(adminId: string) {
    return this.prisma.notification.findMany({
      where: { adminId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }
  async getSuperAdminNotifications(superAdminId: string) {
    return this.prisma.notification.findMany({
      where: { superAdminId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }

  async markAllAsRead({
    userId,
    vendorId,
    adminId,
    superAdminId,
  }: {
    userId?: string;
    vendorId?: string;
    adminId?: string;
    superAdminId?: string;
  }) {
    let whereCondition: Record<string, any> = { isRead: false };
    if (userId) {
      whereCondition.userId = userId;
    } else if (vendorId) {
      whereCondition.vendorId = vendorId;
    } else if (adminId) {
      whereCondition.adminId = adminId;
    } else if (superAdminId) {
      whereCondition.superAdminId = superAdminId;
    } else {
      throw new Error("No valid identifier provided for markAllAsRead");
    }

    const updated = await this.prisma.notification.updateMany({
      where: whereCondition,
      data: { isRead: true },
    });

    this.notificationGateway.server.emit("notifications.markedRead", {
      adminId: adminId ?? null,
      superAdminId: superAdminId ?? null,
    });
    return updated;
  }

  async markAsRead(notificationId: string) {
    if (!notificationId) {
      throw new Error("Notification ID is required");
    }

    const alreadyRead = await this.prisma.notification.findUnique({
      where: { id: notificationId, isRead: true }
    })
    if(alreadyRead){  
      return
    }
    const updatedNotification = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    const eventMarkedRead = this.notificationGateway.server.emit("notification.markedRead", {
      notificationId,
    });
    return updatedNotification;
  }
}
