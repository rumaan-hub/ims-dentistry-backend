import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { RedisService } from './redis.service';

@Injectable()
export class QueueService {
  private emailQueue: Queue;

  constructor(private readonly redisService: RedisService) {
    this.emailQueue = new Queue('email-queue', {
      connection: this.redisService.getClient(),
    });
  }

  async addEmailJob(to: string, subject: string, html: string) {
    await this.emailQueue.add('send-email', { to, subject, html }, { attempts: 3 });
  }

  async addReturnOrderFinancialsJob(returnData: any, item: any, orderId: string) {
    await this.emailQueue.add(
      'return-order-financials',
      { returnData, item, orderId },
    );
  }

  async addPendingPlatformTransfers(vendorId: string, deliveryId: string) {
    await this.emailQueue.add(
      'pending-platform-transfers',
      { vendorId, deliveryId },
    );
  }
}
