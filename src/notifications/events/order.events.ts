import { OnEvent } from "@nestjs/event-emitter";
import { NotificationsService } from "../notifications.service";
import { Injectable } from "@nestjs/common";
import { NotificationGateway } from "../notifications.gateway";

@Injectable()
export class OrderEvents {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationGateway: NotificationGateway
  ) {}

  @OnEvent("order.placed")
  async handleOrderPlacedEvent(payload: { createdOrder: any }) {
    const order = payload?.createdOrder;

    const vendorIds = [
      ...new Set(order.products.map((p: { vendorId: string }) => p.vendorId)),
    ];

    let firstName:string = '';
    let lastName:string = '';
    if (order.user.firstName && order.user.lastName) {
      firstName = order.user.firstName;
      lastName = order.user.lastName;
     } else if (order.user?.officeContactFirstName && order.user?.officeContactLastName) {
        firstName = order.user.officeContactFirstName;
        lastName = order.user.officeContactLastName;
     } else if (order.user?.doctorFirstName || order.user?.doctorLastName) {
        firstName = order.user.doctorFirstName;
        lastName = order.user.doctorLastName;
     }

    for (const vendorId of vendorIds) {
      const notification = await this.notificationsService.createNotification({
        title: "New Order Received",
        message: `You have received a new order #${order.id} from ${firstName} ${lastName}`,
        vendorId: vendorId as string,
        orderId: order.id,
        isOrder: true,
      });

      this.notificationGateway.sendToVendor(
        vendorId as string,
        "order.placed",
        notification
      );
    }
  }

  @OnEvent("order.status.updated")
  async handleOrderStatusUpdated(payload: {
    order: any;
    previousStatus: string;
  }) {
    const { order } = payload;

    const product = order.products.find((p) =>
      ["INPROGRESS", "PACKED", "SHIPPED", "DELIVERED"].includes(p.status)
    );

    if (!product) {
      return;
    }

    let message = "";

    switch (product.status) {
      case "INPROGRESS":
        message = `Order #${order.id} is now being processed.`;
        break;
      case "PACKED":
        message = `Order #${order.id} has been packed and is ready for shipment.`;
        break;
      case "SHIPPED":
        message = `Order #${order.id} has been shipped. You can track its progress in your Orders section.`;
        break;
      case "DELIVERED":
        message = `Order #${order.id} has been delivered. We hope you enjoy your purchase!`;
        break;
      default:
        return;
    }

    const notification = await this.notificationsService.createNotification({
      title: `Order Status Updated`,
      message,
      userId: order.userId,
      orderId: order.id,
      isOrder: true,
    });
    this.notificationGateway.sendToUser(
      order.userId as string,
      "order.status.updated",
      notification
    );
  }

  @OnEvent("order.cancelled")
  async handleCancelledOrder(payload: { orderData: any }) {
    const { orderData } = payload;
    const vendorIds = [
      ...new Set(orderData.products.map((p: { vendorId: string }) => p.vendorId)),
    ];

    let firstName:string = '';
    let lastName:string = '';
    if (orderData.user.firstName && orderData.user.lastName) {
      firstName = orderData.user.firstName;
      lastName = orderData.user.lastName;
     } else if (orderData.user?.officeContactFirstName && orderData.user?.officeContactLastName) {
        firstName = orderData.user.officeContactFirstName;
        lastName = orderData.user.officeContactLastName;
     } else if (orderData.user?.doctorFirstName || orderData.user?.doctorLastName) {
        firstName = orderData.user.doctorFirstName;
        lastName = orderData.user.doctorLastName;
     }

    for (const vendorId of vendorIds) {
      const notification = await this.notificationsService.createNotification({
        title: "Order Cancelled",
        message: `You order has been cancelled #${orderData.id} from ${firstName} ${lastName}`,
        vendorId: vendorId as string,
        orderId: orderData.id,
        isOrder: true,
      });
      this.notificationGateway.sendToVendor(
        vendorId as string,
        "orderData.cancelled",
        notification
      );
    }
  }

  @OnEvent("order.returned")
  async handleReturnOrder(payload: { order: any }) {
    const { order } = payload;
    const vendorIds = [
      ...new Set(order.products.map((p: { vendorId: string }) => p.vendorId)),
    ];

    let firstName:string = '';
    let lastName:string = '';
    if (order.user.firstName && order.user.lastName) {
      firstName = order.user.firstName;
      lastName = order.user.lastName;
     } else if (order.user?.officeContactFirstName && order.user?.officeContactLastName) {
        firstName = order.user.officeContactFirstName;
        lastName = order.user.officeContactLastName;
     } else if (order.user?.doctorFirstName || order.user?.doctorLastName) {
        firstName = order.user.doctorFirstName;
        lastName = order.user.doctorLastName;
     }

    for (const vendorId of vendorIds) {
      const notification = await this.notificationsService.createNotification({
        title: "Order Returned",
        message: `You order has been returned #${order.id} from ${firstName} ${lastName}`,
        vendorId: vendorId as string,
        orderId: order.id,
        isOrder: true,
      });

      this.notificationGateway.sendToVendor(
        vendorId as string,
        "order.returned",
        notification
      );
    }
  }

}
