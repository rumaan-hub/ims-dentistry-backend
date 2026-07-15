import { Module } from '@nestjs/common';
import { ImsCheckoutController } from './ims-checkout.controller';
import { ImsCheckoutService } from './ims-checkout.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MailerModule } from '../mailer/mailer.module';
import { ImsNotificationModule } from '../ims-notification/ims-notification.module';

@Module({
    imports: [PrismaModule, MailerModule, ImsNotificationModule],
    controllers: [ImsCheckoutController],
    providers: [ImsCheckoutService],
})
export class ImsCheckoutModule { }
