import { Module } from '@nestjs/common';
import { ImsNotificationController } from './ims-notification.controller';
import { ImsNotificationService } from './ims-notification.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ImsNotificationController],
    providers: [ImsNotificationService],
    exports: [ImsNotificationService],
})
export class ImsNotificationModule { }
