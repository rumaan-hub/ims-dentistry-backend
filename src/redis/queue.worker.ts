import { Injectable, OnModuleInit } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { RedisService } from './redis.service';
import { MailerService } from 'src/mailer/mailer.service';
import { OrdersService } from 'src/orders/orders.service';

@Injectable()
export class QueueWorker implements OnModuleInit {
  private worker: Worker;

  constructor(
    private readonly redisService: RedisService,
    private readonly emailService: MailerService,
    private readonly orderService: OrdersService
  ) {}

  onModuleInit() {
    this.worker = new Worker(
      'email-queue',
      async (job: Job) => {
        try {
          switch (job.name) {
            case 'send-email': {
              const { to, subject, html } = job.data;
              await this.emailService.sendEmail(to, subject, html);
              break;
            }

            case 'return-order-financials': {
              const { returnData, item, orderId } = job.data;
              await this.orderService.handleReturnFinancials(returnData, item, orderId);
              break;
            }

            case 'pending-platform-transfers': {
              const { vendorId, deliveryId } = job.data;
              await this.orderService.processPendingVendorRefunds(vendorId, deliveryId);
              break;
            }

            default:
              console.warn(`⚠️ Unknown job name: ${job.name}`);
          }
        } catch (error) {
          console.error(`Error processing job "${job.name}":`, error);
          throw error;
        }
      },
      {
        connection: this.redisService.getClient(),
      }
    );

    this.worker.on('failed', (job, err) => {
      console.error(`Job ${job?.id} (${job?.name}) failed:`, err);
    });
  }
}
