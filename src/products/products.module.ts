import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PrismaModule } from "src/prisma/prisma.module";
import { JwtModule } from "@nestjs/jwt";
import { ProductController } from "./products.controller";
import { ProductService } from "./products.service";
import { ScheduleModule } from "@nestjs/schedule";
import { ProductGateway } from "./products.gatway";
import { MailerService } from "src/mailer/mailer.service";
import { NotificationModule } from "src/notifications/notifications.module";
import { EventEmitterModule } from "@nestjs/event-emitter";

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
    ScheduleModule.forRoot(),
    NotificationModule,
    EventEmitterModule.forRoot()
  ],
  controllers: [ProductController],
  providers: [ProductService, JwtModule, ProductGateway, MailerService],
})
export class ProductModule {}
