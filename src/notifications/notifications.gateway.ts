import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "../user/user.service";
import { VendorService } from "../vendor/vendor.service";
import { NotificationsService } from "./notifications.service";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { AdminService } from "src/admin/admin.service";
import { SuperAdminService } from "src/superAdmin/superAdmin.service";

@WebSocketGateway({ cors: true })
@Injectable()
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedClients: Map<string, Socket> = new Map();

  constructor(
    private jwtService: JwtService,
    private usersService: UserService,
    private vendorsService: VendorService,
    private adminService: AdminService,
    private superAdminService: SuperAdminService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService
  ) {}

  async handleConnection(client: Socket) {
    try {
      const authToken = client.handshake.auth?.token;
      if (!authToken) {
        client.disconnect();
        return;
      }
      const payload = await this.jwtService.verifyAsync(authToken);
      let user: any;

      if (payload.role === "VENDOR") {
        user = await this.vendorsService.getSpecificVendor(payload.id);
      } else if (payload.role === "USER") {
        user = await this.usersService.findUser(payload.id);
      } else if (payload.role === "ADMIN") {
        user = await this.adminService.getSpecificAdmin(payload.id);
      } else {
        user = await this.superAdminService.getSuperAdminById(payload.id);
      }

      if (!user) {
        client.disconnect();
        return;
      }
      this.connectedClients.set(user?.data.id, client);
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socket] of this.connectedClients.entries()) {
      if (socket.id === client.id) {
        this.connectedClients.delete(userId);
        break;
      }
    }
  }

  @SubscribeMessage("markAsReadForNotifications")
  async handleMarkAsReadNotifications(
    client: Socket,
    payload: {
      userId?: string;
      vendorId?: string;
      adminId?: string;
      superAdminId?: string;
      role: "USER" | "VENDOR" | "ADMIN" | "SUPER_ADMIN";
    }
  ) {

    const roleKeyMap = {
      USER: "userId",
      VENDOR: "vendorId",
      ADMIN: "adminId",
      SUPER_ADMIN: "superAdminId",
    };

    const key = roleKeyMap[payload.role];

    if (!key || !payload[key]) {
      return;
    }

    const updatedNotification = await this.notificationsService.markAllAsRead({
      [key]: payload[key],
    });

    return updatedNotification;
  }

  @SubscribeMessage("markAsReadForNotification")
  async handleMarkAsRead(client: Socket, payload: { notificationId: string }) {
    const { notificationId } = payload;
    if (!notificationId) {
      return null;
    }
    const updatedNotification =
      await this.notificationsService.markAsRead(notificationId);

    return updatedNotification;
  }

  public sendToUser(userId: string, event: string, data: any): boolean {
    const client = this.connectedClients.get(userId);
    if (client) {
      client.emit(event, data);
      return true;
    }
    return false;
  }

  public sendToVendor(vendorId: string, event: string, data: any): boolean {
    const client = this.connectedClients.get(vendorId);
    if (client) {
      client.emit(event, data);
      return true;
    }
    return false;
  }

  public sendToAdmin(adminId: string, event: string, data: any): boolean {
    const client = this.connectedClients.get(adminId);
    if (client) {
      client.emit(event, data);
      return true;
    }
    return false;
  }

  public sendToSuperAdmin(
    superAdminId: string,
    event: string,
    data: any
  ): boolean {
    const client = this.connectedClients.get(superAdminId);
    if (client) {
      client.emit(event, data);
      return true;
    }
    return false;
  }
}
