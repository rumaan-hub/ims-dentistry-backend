import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PrismaModule } from "src/prisma/prisma.module";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "src/user/strategy/jwt.strategy";
import { CartModule } from "src/cart/cart.module";
import { StripeService } from "src/payment/payment.service";
import { MailerService } from "src/mailer/mailer.service";
import { AutoOrderController } from "./autoOrder.controller";
import { AutoOrderService } from "./autoOrder.service";
import { OrdersService } from "src/orders/orders.service";
import { RedisModule } from "src/redis/redis.module";
import { QueueService } from "src/redis/queue.service";
import { RedisService } from "src/redis/redis.service";
import { UspsService } from "src/usps/usps.service";
import { UspsModule } from "src/usps/usps.module";

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
    UspsModule
  ],
  controllers: [AutoOrderController],
  providers: [AutoOrderService, JwtStrategy, StripeService, MailerService, OrdersService, QueueService, RedisService, UspsService],
})
export class AutoOrderModule {}
