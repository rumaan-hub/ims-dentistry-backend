import { Module } from '@nestjs/common';
import { ImsSubscriptionController } from './ims-subscription.controller';
import { ImsSubscriptionService } from './ims-subscription.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MailerModule } from '../mailer/mailer.module';
import { ImsNotificationModule } from '../ims-notification/ims-notification.module';

@Module({
    imports: [PrismaModule, MailerModule, ImsNotificationModule],
    controllers: [ImsSubscriptionController],
    providers: [ImsSubscriptionService],
    exports: [ImsSubscriptionService],
})
export class ImsSubscriptionModule { }
