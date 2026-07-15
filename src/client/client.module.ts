import { Module } from '@nestjs/common';
import {
    ClientController,
    LicenseController,
    ShippingController,
    BillingController,
} from './client.controller';
import { ClientService } from './client.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StripeModule } from '../payment/payment.module';

@Module({
    imports: [PrismaModule, StripeModule],
    controllers: [
        ClientController,
        LicenseController,
        ShippingController,
        BillingController,
    ],
    providers: [ClientService],
    exports: [ClientService],
})
export class ClientModule { }
