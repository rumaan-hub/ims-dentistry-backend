import { Controller, Post, Body, Get, Param, Query, Delete } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('start')
  async startChat(@Body('userId') userId: string, @Body('vendorId') vendorId: string) {
    return this.chatService.createChat(userId, vendorId);
  }

  @Get(':chatId/messages')
  async getMessages(@Param('chatId') chatId: string) {
    return this.chatService.getMessages(chatId);
  }

  @Get('user/:userId')
  async getUserChats(@Param('userId') userId: string, @Query('search') search: string) {
    return this.chatService.getChatsForUser(userId, search);
  }

  @Get('vendor/:vendorId')
  async getVendorChats(@Param('vendorId') vendorId: string, @Query('search') search: string) {
    return this.chatService.getChatsForVendor(vendorId, search);
  }

  @Post(':chatId/markAsRead')
  async markAsRead(
    @Param('chatId') chatId: string,
    @Body('userId') userId: string
  ) {
    return this.chatService.markMessagesAsRead(chatId, userId);
  }

  @Get('unreadCounts/:userId')
  async getUnreadCounts(
    @Param('userId') userId: string,
    @Query('isVendor') isVendor: boolean
  ) {
    return this.chatService.getUnreadCounts(userId, isVendor === true);
  }
  
}
