import { Module } from '@nestjs/common';
import { UspsService } from './usps.service';
import { UspsController } from './usps.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrdersService } from 'src/orders/orders.service';
import { StripeService } from 'src/payment/payment.service';
import { OrdersModule } from 'src/orders/orders.module';
import { MailerService } from 'src/mailer/mailer.service';
import { QueueService } from 'src/redis/queue.service';
import { RedisService } from 'src/redis/redis.service';

@Module({
  providers: [UspsService, PrismaService, OrdersService, StripeService, MailerService, QueueService, RedisService],
  controllers: [UspsController],
  exports: [UspsService],
})
export class UspsModule {}
