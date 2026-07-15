import { OnEvent } from "@nestjs/event-emitter";
import { NotificationsService } from "../notifications.service";
import { Injectable } from "@nestjs/common";
import { NotificationGateway } from "../notifications.gateway";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class VendorEvents {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationGateway: NotificationGateway,
    private readonly prismaService: PrismaService
  ) {}

  @OnEvent("created.vendor")
  async handleVendorCreateEvent(payload: { vendor: any }) {
    const { vendor } = payload;
    const title = "New Vendor Registration";
    const message = `A new vendor named ${vendor.firstName} ${vendor.lastName} has registered and is pending approval.`;

    const superAdmin = await this.prismaService.superAdmin.findFirst({
      where: { role: "SUPER_ADMIN" },
    });
    const allAdmins = await this.prismaService.admin.findMany({
      where: { role: "ADMIN" },
    });

    let notificationPayload = {
      title,
      message,
      vendorId: vendor.id,
    };

    const adminNotifications = await Promise.all(
      allAdmins.map((admin) =>
        this.notificationsService.createNotification({
          ...notificationPayload,
          adminId: admin.id,
        })
      )
    );
    const superAdminNotification = await this.notificationsService.createNotification({
      ...notificationPayload,
      superAdminId: superAdmin.id,
    });

    adminNotifications.forEach((notification, index) => {
      this.notificationGateway.sendToAdmin(
        allAdmins[index].id,
        "created.vendor",
        notification
      );
    });

    this.notificationGateway.sendToSuperAdmin(
      superAdmin.id as string,
      "created.vendor",
      superAdminNotification
    );
  }
}
