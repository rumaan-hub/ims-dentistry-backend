import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SystemActivityService {
    private readonly logger = new Logger(SystemActivityService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Log an activity
     * @param data log details
     */
    async create(data: {
        action: string;
        product?: string;
        office?: string;
        user?: string;
        client_id?: string;
    }) {
        try {
            return await (this.prisma as any).systemActivity.create({
                data: {
                    action: data.action,
                    product: data.product || undefined,
                    office: data.office || undefined,
                    user: data.user || undefined,
                    client_id: data.client_id || undefined,
                },
            });
        } catch (error) {
            this.logger.error(`Failed to create system activity log: ${error.message}`);
        }
    }

    /**
     * Get latest activity logs for a client
     * @param clientId identifier
     * @param limit rows to return
     */
    async findAllByClient(clientId?: string, limit: number = 50) {
        return (this.prisma as any).systemActivity.findMany({
            where: clientId ? { client_id: clientId } : {},
            orderBy: { created_at: 'desc' },
            take: limit,
        });
    }

    /**
     * Scheduled cleanup of logs older than 30 days
     * Runs every day at midnight
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async cleanupOldLogs() {
        this.logger.log('Starting scheduled cleanup of system activity logs...');

        // Retention to 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        try {
            const deleted = await (this.prisma as any).systemActivity.deleteMany({
                where: {
                    created_at: {
                        lt: thirtyDaysAgo,
                    },
                },
            });
            this.logger.log(`Cleanup complete. Removed ${deleted.count} log entries older than 30 days.`);
        } catch (error) {
            this.logger.error(`Cleanup failed: ${error.message}`);
        }
    }
}
