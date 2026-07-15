import { forwardRef, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { PrismaModule } from "src/prisma/prisma.module";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "src/user/strategy/jwt.strategy";
import { VendorService } from "./vendor.service";
import { VendorController } from "./vendor.controller";
import { MailerService } from "src/mailer/mailer.service";
import { StripeService } from "src/payment/payment.service";
import { NotificationModule } from "src/notifications/notifications.module";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { CommissionModule } from "src/commission/commission.module";

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: configService.get<string>("JWT_EXPIRY_TIME"),
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    forwardRef(() => NotificationModule),
    EventEmitterModule.forRoot(),
    CommissionModule
  ],
  controllers: [VendorController],
  providers: [VendorService, JwtStrategy, MailerService, StripeService],
  exports: [VendorService],
})
export class VendorModule {}
