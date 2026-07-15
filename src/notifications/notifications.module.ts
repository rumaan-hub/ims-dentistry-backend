import { forwardRef, Module } from "@nestjs/common";
import { NotificationGateway } from "./notifications.gateway";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { PrismaModule } from "src/prisma/prisma.module";
import { OrderEvents } from "./events/order.events";
import { VendorModule } from "src/vendor/vendor.module";
import { UserModule } from "src/user/user.module";
import { ProductEvents } from "./events/product.events";
import { AdminService } from "src/admin/admin.service";
import { SuperAdminService } from "src/superAdmin/superAdmin.service";
import { MailerService } from "src/mailer/mailer.service";
import { VendorEvents } from "./events/vendor.events";

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
    forwardRef(() => VendorModule),
    UserModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationGateway, OrderEvents, ProductEvents, VendorEvents, MailerService, AdminService, SuperAdminService],
  exports: [NotificationsService, NotificationGateway, OrderEvents, ProductEvents, VendorEvents],
})
export class NotificationModule {}
