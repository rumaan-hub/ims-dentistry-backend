import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from './prisma.service';

@Injectable()
export class AuditRetentionService {
  private readonly logger = new Logger(AuditRetentionService.name);

  constructor(private prisma: PrismaService) {}

  // Runs automatically every day at 1:00 AM
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async deleteOldAuditLogs() {
    const retentionDays = 30;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - retentionDays);

    try {
      // Direct call bypassing middleware auditing by doing unsafe raw query
      // or directly via auditLog, the logger in prisma.service excludes 'AuditLog'
      const result = await this.prisma.auditLog.deleteMany({
        where: {
          timestamp: {
            lt: thresholdDate
          }
        }
      });

      this.logger.log(`🗑️ Audit Retention Cleanup: Deleted ${result.count} logs older than ${retentionDays} days.`);
    } catch (error) {
      this.logger.error('Failed to clean up old audit logs', error);
    }
  }
}
