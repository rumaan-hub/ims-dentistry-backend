import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from "@nestjs/websockets";
import { Socket, Server } from "socket.io";
import { ChatService } from "./chat.service";
import { NotificationsService } from "src/notifications/notifications.service";
import { NotificationGateway } from "src/notifications/notifications.gateway";

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private onlineUsers = new Map<string, { role: string; socketId: string }>();

  constructor(
    private readonly chatService: ChatService,
    private notificationsService: NotificationsService,
    private readonly notificationGateway: NotificationGateway
  ) {}

  async handleConnection(client: Socket) {
  }

  async handleDisconnect(client: Socket) {
    for (const [userId, userInfo] of this.onlineUsers.entries()) {
      if (userInfo.socketId === client.id) {
        this.onlineUsers.delete(userId);
        const lastSeenTime = new Date().toISOString();
        this.server.emit("userStatusChange", {
          userId,
          lastSeen: lastSeenTime,
        });

        try {
          await this.chatService.updateLastSeen(userId, userInfo.role);
        } catch (err) {
          console.error(`Failed to update last seen for ${userId}`, err);
        }
        this.server.emit(
          "onlineUsers",
          Array.from(this.onlineUsers.entries()).map(([id, info]) => ({
            userId: id,
            role: info.role,
          }))
        );
        break;
      }
    }
  }

  @SubscribeMessage("markOnline")
  async handleMarkOnline(
    @MessageBody() data: { userId: string; role: string },
    @ConnectedSocket() client: Socket
  ) {
    const { userId, role } = data;
    this.onlineUsers.set(userId, { role, socketId: client.id });
    this.server.emit("userLastSeenUpdate", { userId, lastSeen: null });

    this.server.emit(
      "onlineUsers",
      Array.from(this.onlineUsers.entries()).map(([id, info]) => ({
        userId: id,
        role: info.role,
      }))
    );

    try {
      await this.chatService.updateLastSeenForOnline(userId, role);
    } catch (err) {
      console.error(`Failed to clear last seen for ${userId}`, err);
    }

    let participantStatuses: Array<{ userId: string; lastSeen: string | null }>;
    if (role === 'USER') {
      participantStatuses = await this.chatService.getAllVendorLastSeenForUser(userId);
    } else {
      participantStatuses = await this.chatService.getAllUserLastSeenForVendor(userId);
    }

    const initialLastSeenUpdates = participantStatuses.map(p => {
      if (this.onlineUsers.has(p.userId)) {
          return { userId: p.userId, lastSeen: null };
      }
      return p;
    });
    client.emit("initialLastSeenStates", initialLastSeenUpdates);
    this.server.emit("userLastSeenUpdate", { userId, lastSeen: null });

    this.server.emit(
      "onlineUsers",
      Array.from(this.onlineUsers.entries()).map(([id, info]) => ({
        userId: id,
        role: info.role,
      }))
    );
  }

  @SubscribeMessage("markOffline")
  async handleMarkOffline(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket
  ) {
    const { userId } = data;
    const userInfo = this.onlineUsers.get(userId);
    if (userInfo) {
      this.onlineUsers.delete(userId);
      const lastSeenTime = new Date().toISOString();
      this.server.emit("userLastSeenUpdate", { userId, lastSeen: lastSeenTime });
       try {
        await this.chatService.updateLastSeen(userId, userInfo.role);
      } catch (err) {
        console.error(`Failed to update last seen for ${userId} via markOffline`, err);
      }

      this.server.emit(
        "onlineUsers",
        Array.from(this.onlineUsers.entries()).map(([id, info]) => ({
          userId: id,
          role: info.role,
        }))
      );
    }
  }

  @SubscribeMessage("joinChat")
  async handleJoinChat(
    @MessageBody() data: { chatId: string },
    @ConnectedSocket() client: Socket
  ) {
    const { chatId } = data;
    client.join(`chat_${chatId}`);
  }

  @SubscribeMessage("sendMessage")
  async handleMessage(
    @MessageBody() data: { chatId: string; senderId: string; text: string },
    @ConnectedSocket() client: Socket
  ) {
    const { chatId, senderId, text } = data;
    const message = await this.chatService.addMessage(chatId, senderId, text);
    this.server.to(`chat_${chatId}`).emit("receiveMessage", message);

    const chat = await this.chatService.getChatById(chatId);
    const receiverId = chat.userId === senderId ? chat.vendorId : chat.userId;
    const isVendor = chat.vendorId === receiverId;

    const shortMessage = text.length > 50 ? text.slice(0, 50) + "..." : text;

    const notify = await this.notificationsService.createNotification({
      title: "New Message Received",
      message: shortMessage,
      ...(isVendor ? { vendorId: receiverId } : { userId: receiverId }),
      isMessage: true,
      chatId,
    });
    if (isVendor) {
      this.notificationGateway.sendToVendor(
        receiverId as string,
        "new.message",
        notify
      );
    } else {
      this.notificationGateway.sendToUser(
        receiverId as string,
        "new.message",
        notify
      );
    }

    const unreadCounts = await this.chatService.getUnreadCounts(
      receiverId,
      isVendor
    );

    const socketId = this.onlineUsers.get(receiverId)?.socketId;
    if (socketId) {
      this.server.to(socketId).emit("unreadCounts", unreadCounts);
    }
  }

  @SubscribeMessage("markAsRead")
  async handleMarkAsRead(
    @MessageBody() data: { chatId: string; userId: string },
    @ConnectedSocket() client: Socket
  ) {
    const { chatId, userId } = data;
    const result = await this.chatService.markMessagesAsRead(chatId, userId);

    const otherSocketId = this.onlineUsers.get(
      result.otherParticipantId
    )?.socketId;
    if (otherSocketId) {
      this.server.to(otherSocketId).emit("messagesRead", {
        chatId,
        readerId: userId,
      });

      const isVendor =
        result.otherParticipantId ===
        (await this.chatService.getVendorId(result.chatId));
      const unreadCounts = await this.chatService.getUnreadCounts(
        result.otherParticipantId,
        isVendor
      );
      this.server.to(otherSocketId).emit("unreadCounts", unreadCounts);
    }

    const currentIsVendor =
      result.readerId === (await this.chatService.getVendorId(result.chatId));
    const currentUnreadCounts = await this.chatService.getUnreadCounts(
      result.readerId,
      currentIsVendor
    );
    client.emit("unreadCounts", currentUnreadCounts);
  }

  @SubscribeMessage("getUnreadCounts")
  async handleGetUnreadCounts(
    @MessageBody() data: { userId: string; isVendor: boolean },
    @ConnectedSocket() client: Socket
  ) {
    const { userId, isVendor } = data;
    const unreadCounts = await this.chatService.getUnreadCounts(
      userId,
      isVendor
    );
    client.emit("unreadCounts", unreadCounts);
  }
}
