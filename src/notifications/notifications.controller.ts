import {
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Body,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { JwtGuard } from "src/user/guard/jwt.guard";

@Controller("notifications")
@UseGuards(JwtGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('')
  async getNotifications(@Req() req: any) {
    const user = req.user;
     if (!user) {
      throw new UnauthorizedException();
    }
    if (user.role === "USER") {
      return this.notificationsService.getUserNotifications(user.id);
    } else if (user.role === "VENDOR") {
      return this.notificationsService.getVendorNotifications(user.id);
    } else if (user.role === "ADMIN"){
      return this.notificationsService.getAdminNotifications(user.id);
    } else if (user.role === "SUPER_ADMIN") {
       return this.notificationsService.getSuperAdminNotifications(user.id);
     }
    return [];
  }

  @Post("mark-all-as-read")
  async markAllAsRead(@Req() req: any) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

}
