import { Controller, Get, Patch, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ImsNotificationService } from './ims-notification.service';
import { JwtGuard } from '../user/guard/jwt.guard';

@Controller('ims-notification')
@UseGuards(JwtGuard)
export class ImsNotificationController {
    constructor(private readonly notificationService: ImsNotificationService) { }

    @Get()
    findAll(@Req() req: any) {
        if (!req.user?.is_system_admin) throw new ForbiddenException();
        return this.notificationService.findAll();
    }

    @Patch('read-all')
    markAllAsRead(@Req() req: any) {
        if (!req.user?.is_system_admin) throw new ForbiddenException();
        return this.notificationService.markAllAsRead();
    }

    @Patch(':id/read')
    markAsRead(@Param('id') id: string, @Req() req: any) {
        if (!req.user?.is_system_admin) throw new ForbiddenException();
        return this.notificationService.markAsRead(id);
    }
}
