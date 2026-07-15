import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { exceptionHandler, handlePrismaError } from "src/utils/error-handler.util";
import { contains } from "class-validator";

@Injectable()
export class ChatService {
  private readonly logger: Logger = new Logger(ChatService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createChat(userId: string, vendorId: string) {
    try {
      const userExists = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!userExists) {
        throw new NotFoundException(`User with ID ${userId} does not exist.`);
      }
      const vendorExist = await this.prisma.vendors.findUnique({
        where: { id: vendorId }
      })
      if(!vendorExist){
        throw new NotFoundException(`Vendor with ID ${vendorId} not found`);
      }

      const existChat = await this.prisma.chat.findFirst({
        where: {
          userId,
          vendorId
        }
      })

      if(existChat){
        return {
          chat: existChat,
          message: "Chat already exists between this user and vendor."
        }
      }

      const chatCreation = await this.prisma.chat.create({
        data: {
          userId,
          vendorId,
        },
      });
      return {
        data: chatCreation,
        message: "Chat has been created successfully!",
      };
    } catch (error) {
      this.logger.error("Error creating license", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async addMessage(chatId: string, senderId: string, text: string) {
    return this.prisma.message.create({
      data: {
        chatId,
        senderId,
        text,
        isRead: false,
      },
    });
  }

  async getMessages(chatId: string) {
    return this.prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
    });
  }

  async getChatsForUser(userId: string, search: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} does not exist.`);
      }
      const chats = await this.prisma.chat.findMany({
        where: { 
          userId,
          vendor: search ? {
            OR: [
              { 
                firstName: {
                  contains: search,
                  mode: "insensitive",
                }
              } ,
              {
                lastName: {
                contains: search,
                mode: "insensitive",
                }
              }
            ]
          } : undefined
        },
        include: {
          vendor: true,
          messages: {
            orderBy: { createdAt: "asc" },
          },
        }
      })

      const uniqueVendorIds = new Set(chats.map((chat) => chat.vendorId));
      const totalVendors = uniqueVendorIds.size;

      let unreadMessages: any;
      chats.map((chat) => {
      unreadMessages = chat.messages.filter(
          (msg) => msg.isRead === false
        ).length;
      });

      return {
        data: chats,
        total: totalVendors,
        unread: unreadMessages,
        message: "Chats fetched successfully",
      };
    } catch (error) {
      this.logger.error("Error fetching chats", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }  

  async getChatsForVendor(vendorId: string, search: string) {
    try {
      const vendorExists = await this.prisma.vendors.findUnique({
        where: { id: vendorId },
      });
      if (!vendorExists) {
        throw new NotFoundException(`Vendor with ID ${vendorId} does not exist.`);
      }
  
      const chats = await this.prisma.chat.findMany({
        where: { 
          vendorId: vendorId,
          user: search ? {
            OR: [
              {
                firstName: {
                  contains: search,
                  mode: "insensitive"
                }
              },
              {
                lastName: {
                  contains: search,
                  mode: "insensitive"
                }
              }
            ]
          } : undefined
        },
        include: {
          user: true,
          messages: {
            orderBy: { createdAt: "asc" },
          },
        }
      })
      
      const uniqueUserIds = new Set(chats.map((chat) => chat.userId));
      const totalUsers = uniqueUserIds.size;

      let unreadMessages: any;
      chats.map((chat) => {
      unreadMessages = chat.messages.filter(
          (msg) => msg.isRead === false
        ).length;
      });

      return {
        data: chats,
        total: totalUsers,
        unread: unreadMessages,
        message: "Vendor chats fetched successfully",
      };
    } catch (error) {
      this.logger.error("Error fetching vendor chats", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async markMessagesAsRead(chatId: string, userId: string) {
    await this.prisma.message.updateMany({
      where: {
        chatId,
        senderId: { not: userId },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { user: true, vendor: true },
    });
  
    return {
      chatId,
      readerId: userId,
      otherParticipantId: userId === chat.userId ? chat.vendorId : chat.userId,
    };
  }

  async getUnreadCounts(userId: string, isVendor: boolean) {
    
    const chats = await this.prisma.chat.findMany({
      where: isVendor ? { vendorId: userId } : { userId },
      include: {
        messages: {
          where: {
            senderId: {
              not: userId,
            },
            isRead: false,
          },
        },
      },
    });
    return chats.map(chat => ({
      chatId: chat.id,
      unreadCount: chat.messages.length,
    }));
  }
  
  async getChatById(chatId: string) {
    return this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        user: true,
        vendor: true,
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  async getVendorId(chatId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { vendorId: true },
    });
    return chat?.vendorId;
  }

  async getUserId(chatId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { userId: true },
    });
    return chat?.userId;
  }

  async updateLastSeen(userId: string, role: string) {
    const now = new Date();
    if (role === "USER") {
      await this.prisma.user.update({
        where: { id: userId },
        data: { lastSeen: now },
      });
    } else if (role === "VENDOR") {
      await this.prisma.vendors.update({
        where: { id: userId },
        data: { lastSeen: now },
      });
    }
  }

  async updateLastSeenForOnline(userId: string, role: string) {
    if (role === "USER") {
      await this.prisma.user.update({
        where: { id: userId },
        data: { lastSeen: null },
      });
    } else if (role === "VENDOR") {
      await this.prisma.vendors.update({
        where: { id: userId },
        data: { lastSeen: null },
      });
    }
  }

  async getAllVendorLastSeenForUser(userId: string): Promise<Array<{ userId: string; lastSeen: string | null }>> {
    const chats = await this.prisma.chat.findMany({
      where: { userId: userId },
      select: {
        vendor: {
          select: {
            id: true,
            lastSeen: true,
          },
        },
      },
    });

    const vendorLastSeens = chats.map(chat => ({
      userId: chat.vendor.id,
      lastSeen: chat.vendor.lastSeen ? chat.vendor.lastSeen.toISOString() : null,
    }));

    const uniqueVendorLastSeens = Array.from(new Map(vendorLastSeens.map(item => [item.userId, item])).values());
    return uniqueVendorLastSeens;
  }

  async getAllUserLastSeenForVendor(vendorId: string): Promise<Array<{ userId: string; lastSeen: string | null }>> {
    const chats = await this.prisma.chat.findMany({
      where: { vendorId: vendorId },
      select: {
        user: {
          select: {
            id: true,
            lastSeen: true,
          },
        },
      },
    });

    const userLastSeens = chats.map(chat => ({
      userId: chat.user.id,
      lastSeen: chat.user.lastSeen ? chat.user.lastSeen.toISOString() : null,
    }));
    const uniqueUserLastSeens = Array.from(new Map(userLastSeens.map(item => [item.userId, item])).values());
    return uniqueUserLastSeens;
  }
  
}
