import { Module } from '@nestjs/common';
import { ImsDemoController } from './ims-demo.controller';
import { ImsDemoService } from './ims-demo.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SystemActivityModule } from '../system-activity/system-activity.module';
import { ImsNotificationModule } from '../ims-notification/ims-notification.module';

@Module({
    imports: [PrismaModule, SystemActivityModule, ImsNotificationModule],
    controllers: [ImsDemoController],
    providers: [ImsDemoService],
    exports: [ImsDemoService],
})
export class ImsDemoModule { }
