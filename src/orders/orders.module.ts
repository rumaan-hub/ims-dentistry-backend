import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PrismaModule } from "src/prisma/prisma.module";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "src/user/strategy/jwt.strategy";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { CartModule } from "src/cart/cart.module";
import { StripeService } from "src/payment/payment.service";
import { MailerService } from "src/mailer/mailer.service";
import { QueueService } from "src/redis/queue.service";
import { RedisModule } from "src/redis/redis.module";
import { RedisService } from "src/redis/redis.service";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { NotificationModule } from "src/notifications/notifications.module";
import { UspsService } from "src/usps/usps.service";
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
    CartModule,
    RedisModule,
    EventEmitterModule.forRoot(),
    NotificationModule
  ],
  controllers: [OrdersController],
  providers: [OrdersService, JwtStrategy, StripeService, MailerService, QueueService, RedisService, UspsService],
  exports: [OrdersService]
})
export class OrdersModule {}
